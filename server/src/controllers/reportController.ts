import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ComplianceObligation } from '../models/ComplianceObligation';
import { ComplianceTask } from '../models/ComplianceTask';
import { EvidenceDocument } from '../models/EvidenceDocument';
import { Risk } from '../models/Risk';
import { Finding } from '../models/Finding';
import { CorrectiveAction } from '../models/CorrectiveAction';
import { Vendor } from '../models/Vendor';
import { EmployeeComplianceRecord } from '../models/EmployeeComplianceRecord';
import { AuditLog } from '../models/AuditLog';
import { CacheService, CacheKeys } from '../cache/nodeCache';
import { AuditService } from '../services/auditService';

export class ReportController {
  /**
   * Real MongoDB aggregation metrics for Dashboard overview
   */
  static async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const cacheKey = CacheKeys.dashboardSummary(orgId.toString());

    const metrics = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // 1. Obligations status breakdown aggregation
        const obligationStatusAgg = await ComplianceObligation.aggregate([
          { $match: { organizationId: orgId, isArchived: false } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const obligationCategoriesAgg = await ComplianceObligation.aggregate([
          { $match: { organizationId: orgId, isArchived: false } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);

        const obligationStats: Record<string, number> = {
          total: 0,
          compliant: 0,
          non_compliant: 0,
          in_progress: 0,
          pending_review: 0,
          not_started: 0,
          needs_attention: 0,
        };

        for (const item of obligationStatusAgg) {
          obligationStats[item._id] = item.count;
          obligationStats.total += item.count;
        }

        // Compliance Health Score calculation (0 - 100)
        let healthScore = 0;
        if (obligationStats.total > 0) {
          healthScore = Math.round(
            ((obligationStats.compliant + obligationStats.in_progress * 0.5) / obligationStats.total) * 100
          );
        }

        // 2. Tasks stats (overdue vs upcoming)
        const [overdueTasksCount, upcomingTasksCount, completedTasksCount] = await Promise.all([
          ComplianceTask.countDocuments({
            organizationId: orgId,
            dueDate: { $lt: now },
            status: { $in: ['todo', 'in_progress', 'under_review'] },
          }),
          ComplianceTask.countDocuments({
            organizationId: orgId,
            dueDate: { $gte: now, $lte: thirtyDaysAhead },
            status: { $in: ['todo', 'in_progress', 'under_review'] },
          }),
          ComplianceTask.countDocuments({
            organizationId: orgId,
            status: 'completed',
          }),
        ]);

        // 3. Expiring documents within 30 days
        const expiringDocumentsCount = await EvidenceDocument.countDocuments({
          organizationId: orgId,
          expiryDate: { $gte: now, $lte: thirtyDaysAhead },
          status: 'valid',
        });

        // 4. Missing evidence: obligations with status compliant/in_progress but no evidence attached
        const missingEvidenceCount = await ComplianceObligation.countDocuments({
          organizationId: orgId,
          isArchived: false,
          evidenceIds: { $size: 0 },
        });

        // 5. Risks breakdown by severity
        const risksSeverityAgg = await Risk.aggregate([
          { $match: { organizationId: orgId, status: { $in: ['open', 'mitigating'] } } },
          { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
        ]);

        const riskStats: Record<string, number> = {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };

        for (const item of risksSeverityAgg) {
          riskStats[item._id] = item.count;
          riskStats.total += item.count;
        }

        // 6. Outstanding corrective actions & findings
        const [openFindingsCount, pendingCorrectiveActionsCount] = await Promise.all([
          Finding.countDocuments({
            organizationId: orgId,
            status: { $in: ['open', 'action_plan_pending', 'in_remediation'] },
          }),
          CorrectiveAction.countDocuments({
            organizationId: orgId,
            status: { $in: ['proposed', 'in_progress', 'completed'] },
          }),
        ]);

        // 7. Vendor review counts
        const [totalVendors, criticalVendors, vendorsUnderReview] = await Promise.all([
          Vendor.countDocuments({ organizationId: orgId, status: 'active' }),
          Vendor.countDocuments({ organizationId: orgId, riskLevel: 'critical', status: 'active' }),
          Vendor.countDocuments({ organizationId: orgId, status: 'under_review' }),
        ]);

        // 8. HR compliance overview
        const [totalEmployees, activeEmployees] = await Promise.all([
          EmployeeComplianceRecord.countDocuments({ organizationId: orgId }),
          EmployeeComplianceRecord.countDocuments({ organizationId: orgId, status: 'active' }),
        ]);

        // 9. Recent authorized activity
        const recentActivity = await AuditLog.find({ organizationId: orgId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        return {
          healthScore,
          obligations: {
            ...obligationStats,
            byCategory: obligationCategoriesAgg.map((c) => ({ category: c._id, count: c.count })),
          },
          tasks: {
            overdue: overdueTasksCount,
            upcoming: upcomingTasksCount,
            completed: completedTasksCount,
          },
          evidence: {
            expiring: expiringDocumentsCount,
            missing: missingEvidenceCount,
          },
          risks: riskStats,
          capa: {
            openFindings: openFindingsCount,
            pendingCorrectiveActions: pendingCorrectiveActionsCount,
          },
          vendors: {
            total: totalVendors,
            critical: criticalVendors,
            underReview: vendorsUnderReview,
          },
          hr: {
            total: totalEmployees,
            active: activeEmployees,
          },
          recentActivity,
        };
      },
      60 // 1 minute short cache TTL for snappy dashboards
    );

    res.json({ success: true, data: metrics });
  }

  /**
   * CSV export of compliance register
   */
  static async exportComplianceCSV(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;

    const obligations = await ComplianceObligation.find({
      organizationId: orgId,
      isArchived: false,
    })
      .populate('assignedTo', 'displayName email')
      .lean();

    // Generate CSV string
    const headers = [
      'ID',
      'Title',
      'Framework',
      'Category',
      'Priority',
      'Status',
      'Due Date',
      'Recurrence',
      'Assigned To',
    ];

    const rows = obligations.map((o: any) => [
      `"${o._id}"`,
      `"${(o.title || '').replace(/"/g, '""')}"`,
      `"${(o.framework || '').replace(/"/g, '""')}"`,
      `"${o.category}"`,
      `"${o.priority}"`,
      `"${o.status}"`,
      `"${o.dueDate ? new Date(o.dueDate).toISOString().split('T')[0] : ''}"`,
      `"${o.recurrence}"`,
      `"${o.assignedTo?.displayName || 'Unassigned'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    await AuditService.log(req, {
      action: 'DATA_EXPORT_CSV',
      resourceType: 'ComplianceObligation',
      changes: { after: { exportedCount: obligations.length } },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tripro-compliance-export-${Date.now()}.csv"`);
    res.send(csvContent);
  }
}
