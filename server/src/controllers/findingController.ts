import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Finding } from '../models/Finding';
import { CorrectiveAction } from '../models/CorrectiveAction';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class FindingController {
  /**
   * List audit findings with their linked corrective actions
   */
  static async getFindings(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { severity, status, page = 1, limit = 20 } = req.query as any;

    const query: any = { organizationId: orgId };

    if (severity) query.severity = severity;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [findings, total] = await Promise.all([
      Finding.find(query)
        .sort({ identifiedDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('ownerId', 'displayName email')
        .populate('linkedObligationId', 'title category')
        .lean(),
      Finding.countDocuments(query),
    ]);

    // Attach corrective actions to each finding
    const findingIds = findings.map((f) => f._id);
    const actions = await CorrectiveAction.find({
      organizationId: orgId,
      findingId: { $in: findingIds },
    })
      .populate('assignedTo', 'displayName email')
      .populate('verifiedBy', 'displayName email')
      .lean();

    const actionsByFindingId = new Map<string, any[]>();
    for (const a of actions) {
      const fid = a.findingId.toString();
      if (!actionsByFindingId.has(fid)) actionsByFindingId.set(fid, []);
      actionsByFindingId.get(fid)!.push(a);
    }

    const populatedFindings = findings.map((f) => ({
      ...f,
      correctiveActions: actionsByFindingId.get(f._id.toString()) || [],
    }));

    res.json({
      success: true,
      data: populatedFindings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Create new finding
   */
  static async createFinding(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const body = req.body;

    const finding = await Finding.create({
      organizationId: orgId,
      title: body.title.trim(),
      description: body.description,
      source: body.source || 'Compliance Audit',
      severity: body.severity || 'medium',
      status: body.status || 'open',
      identifiedDate: body.identifiedDate ? new Date(body.identifiedDate) : new Date(),
      ownerId: body.ownerId ? new Types.ObjectId(body.ownerId) : undefined,
      rootCause: body.rootCause || '',
      linkedObligationId: body.linkedObligationId ? new Types.ObjectId(body.linkedObligationId) : undefined,
    });

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'FINDING_CREATED',
      resourceType: 'Finding',
      resourceId: finding._id.toString(),
      changes: { after: finding.toObject() },
    });

    res.status(201).json({ success: true, data: finding });
  }

  /**
   * Update finding
   */
  static async updateFinding(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const body = req.body;

    const finding = await Finding.findOne({ _id: id, organizationId: orgId });
    if (!finding) {
      res.status(404).json({ success: false, error: { message: 'Finding not found' } });
      return;
    }

    const before = finding.toObject();

    if (body.title) finding.title = body.title.trim();
    if (body.description) finding.description = body.description;
    if (body.source) finding.source = body.source;
    if (body.severity) finding.severity = body.severity;
    if (body.status) finding.status = body.status;
    if (body.ownerId !== undefined) {
      finding.ownerId = body.ownerId ? new Types.ObjectId(body.ownerId) : undefined;
    }
    if (body.rootCause !== undefined) finding.rootCause = body.rootCause;

    await finding.save();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'FINDING_UPDATED',
      resourceType: 'Finding',
      resourceId: finding._id.toString(),
      changes: { before, after: finding.toObject() },
    });

    res.json({ success: true, data: finding });
  }

  /**
   * Create corrective action for a finding
   */
  static async createCorrectiveAction(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { findingId } = req.params;
    const body = req.body;

    const finding = await Finding.findOne({ _id: findingId, organizationId: orgId });
    if (!finding) {
      res.status(404).json({ success: false, error: { message: 'Finding not found' } });
      return;
    }

    const action = await CorrectiveAction.create({
      organizationId: orgId,
      findingId: finding._id,
      title: body.title.trim(),
      actionPlan: body.actionPlan,
      assignedTo: body.assignedTo ? new Types.ObjectId(body.assignedTo) : undefined,
      targetDate: new Date(body.targetDate),
      status: 'proposed',
    });

    // Update finding status if open
    if (finding.status === 'open') {
      finding.status = 'in_remediation';
      await finding.save();
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'CORRECTIVE_ACTION_CREATED',
      resourceType: 'CorrectiveAction',
      resourceId: action._id.toString(),
      changes: { after: action.toObject() },
    });

    res.status(201).json({ success: true, data: action });
  }

  /**
   * Update corrective action and record verification
   */
  static async updateCorrectiveAction(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const { actionId } = req.params;
    const body = req.body;

    const action = await CorrectiveAction.findOne({ _id: actionId, organizationId: orgId });
    if (!action) {
      res.status(404).json({ success: false, error: { message: 'Corrective action not found' } });
      return;
    }

    const before = action.toObject();

    if (body.title) action.title = body.title.trim();
    if (body.actionPlan) action.actionPlan = body.actionPlan;
    if (body.assignedTo !== undefined) {
      action.assignedTo = body.assignedTo ? new Types.ObjectId(body.assignedTo) : undefined;
    }
    if (body.targetDate) action.targetDate = new Date(body.targetDate);
    if (body.status) action.status = body.status;

    // Authorized verification
    if (body.status === 'verified') {
      action.verifiedBy = user._id;
      action.verifiedAt = new Date();
      action.verificationNotes = body.verificationNotes || 'Verified by compliance reviewer';

      // Check if all actions for this finding are verified
      const otherUnverified = await CorrectiveAction.countDocuments({
        findingId: action.findingId,
        _id: { $ne: action._id },
        status: { $ne: 'verified' },
      });

      if (otherUnverified === 0) {
        await Finding.findByIdAndUpdate(action.findingId, { status: 'verified_closed' });
      }
    }

    await action.save();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'CORRECTIVE_ACTION_UPDATED',
      resourceType: 'CorrectiveAction',
      resourceId: action._id.toString(),
      changes: { before, after: action.toObject() },
    });

    res.json({ success: true, data: action });
  }
}
