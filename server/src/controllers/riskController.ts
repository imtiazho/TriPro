import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Risk } from '../models/Risk';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class RiskController {
  /**
   * List risks with filters
   */
  static async getRisks(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { category, riskLevel, status, page = 1, limit = 20 } = req.query as any;

    const query: any = { organizationId: orgId };

    if (category) query.category = category;
    if (riskLevel) query.riskLevel = riskLevel;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [risks, total] = await Promise.all([
      Risk.find(query)
        .sort({ riskScore: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('ownerId', 'displayName email')
        .populate('relatedObligationId', 'title category')
        .populate('relatedVendorId', 'name category')
        .lean(),
      Risk.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: risks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Create risk record with automatic 5x5 scoring
   */
  static async createRisk(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const body = req.body;

    const likelihood = Math.min(5, Math.max(1, Number(body.likelihood) || 3));
    const impact = Math.min(5, Math.max(1, Number(body.impact) || 3));
    const riskScore = likelihood * impact;

    let riskLevel = 'medium';
    if (riskScore >= 20) riskLevel = 'critical';
    else if (riskScore >= 12) riskLevel = 'high';
    else if (riskScore >= 6) riskLevel = 'medium';
    else riskLevel = 'low';

    const risk = await Risk.create({
      organizationId: orgId,
      title: body.title.trim(),
      description: body.description,
      category: body.category || 'Regulatory',
      likelihood,
      impact,
      riskScore,
      riskLevel,
      status: body.status || 'open',
      ownerId: body.ownerId ? new Types.ObjectId(body.ownerId) : undefined,
      mitigationPlan: body.mitigationPlan || '',
      relatedObligationId: body.relatedObligationId ? new Types.ObjectId(body.relatedObligationId) : undefined,
      relatedVendorId: body.relatedVendorId ? new Types.ObjectId(body.relatedVendorId) : undefined,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
    });

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'RISK_CREATED',
      resourceType: 'Risk',
      resourceId: risk._id.toString(),
      changes: { after: risk.toObject() },
    });

    res.status(201).json({ success: true, data: risk });
  }

  /**
   * Update risk record
   */
  static async updateRisk(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const body = req.body;

    const risk = await Risk.findOne({ _id: id, organizationId: orgId });
    if (!risk) {
      res.status(404).json({ success: false, error: { message: 'Risk not found' } });
      return;
    }

    const before = risk.toObject();

    if (body.title) risk.title = body.title.trim();
    if (body.description) risk.description = body.description;
    if (body.category) risk.category = body.category;
    if (body.likelihood !== undefined) risk.likelihood = Number(body.likelihood);
    if (body.impact !== undefined) risk.impact = Number(body.impact);
    if (body.status) risk.status = body.status;
    if (body.ownerId !== undefined) {
      risk.ownerId = body.ownerId ? new Types.ObjectId(body.ownerId) : undefined;
    }
    if (body.mitigationPlan !== undefined) risk.mitigationPlan = body.mitigationPlan;
    if (body.reviewDate) risk.reviewDate = new Date(body.reviewDate);

    // Recalculate score
    risk.riskScore = risk.likelihood * risk.impact;
    if (risk.riskScore >= 20) risk.riskLevel = 'critical';
    else if (risk.riskScore >= 12) risk.riskLevel = 'high';
    else if (risk.riskScore >= 6) risk.riskLevel = 'medium';
    else risk.riskLevel = 'low';

    await risk.save();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'RISK_UPDATED',
      resourceType: 'Risk',
      resourceId: risk._id.toString(),
      changes: { before, after: risk.toObject() },
    });

    res.json({ success: true, data: risk });
  }

  /**
   * Delete risk
   */
  static async deleteRisk(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const risk = await Risk.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!risk) {
      res.status(404).json({ success: false, error: { message: 'Risk not found' } });
      return;
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'RISK_DELETED',
      resourceType: 'Risk',
      resourceId: id,
    });

    res.json({ success: true, message: 'Risk record removed' });
  }
}
