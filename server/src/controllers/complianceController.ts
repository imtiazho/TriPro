import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ComplianceObligation } from '../models/ComplianceObligation';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class ComplianceController {
  /**
   * List compliance obligations with pagination and compound index filtering
   */
  static async getObligations(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const {
      status,
      category,
      priority,
      framework,
      search,
      page = 1,
      limit = 20,
      includeArchived = 'false',
    } = req.query as any;

    const query: any = {
      organizationId: orgId,
    };

    if (includeArchived !== 'true') {
      query.isArchived = false;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (framework) query.framework = framework;

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { framework: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [obligations, total] = await Promise.all([
      ComplianceObligation.find(query)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('assignedTo', 'displayName email')
        .populate('evidenceIds', 'fileName originalName fileSize status expiryDate')
        .lean(),
      ComplianceObligation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: obligations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Get single obligation by ID with linked tasks, risks, and evidence
   */
  static async getObligationById(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: { message: 'Invalid obligation ID' } });
      return;
    }

    const obligation = await ComplianceObligation.findOne({
      _id: id,
      organizationId: orgId,
    })
      .populate('assignedTo', 'displayName email')
      .populate('evidenceIds')
      .populate('linkedTaskIds')
      .populate('linkedRiskIds')
      .populate('linkedPolicyIds')
      .populate('history.changedBy', 'displayName email')
      .lean();

    if (!obligation) {
      res.status(404).json({ success: false, error: { message: 'Compliance obligation not found' } });
      return;
    }

    res.json({ success: true, data: obligation });
  }

  /**
   * Create new compliance obligation
   */
  static async createObligation(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const body = req.body;

    const obligation = await ComplianceObligation.create({
      organizationId: orgId,
      title: body.title,
      description: body.description,
      framework: body.framework || 'General Compliance',
      category: body.category || 'Labor & Employment',
      priority: body.priority || 'medium',
      status: body.status || 'not_started',
      assignedTo: body.assignedTo ? new Types.ObjectId(body.assignedTo) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      recurrence: body.recurrence || 'none',
      evidenceIds: body.evidenceIds || [],
      history: [
        {
          changedBy: user._id,
          newStatus: body.status || 'not_started',
          note: 'Obligation created',
          changedAt: new Date(),
        },
      ],
    });

    // Invalidate dashboard metrics cache
    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'OBLIGATION_CREATED',
      resourceType: 'ComplianceObligation',
      resourceId: obligation._id.toString(),
      changes: { after: obligation.toObject() },
    });

    res.status(201).json({ success: true, data: obligation });
  }

  /**
   * Update compliance obligation with status transition history
   */
  static async updateObligation(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const { id } = req.params;
    const body = req.body;

    const obligation = await ComplianceObligation.findOne({
      _id: id,
      organizationId: orgId,
    });

    if (!obligation) {
      res.status(404).json({ success: false, error: { message: 'Compliance obligation not found' } });
      return;
    }

    const before = obligation.toObject();

    // Check status transition
    if (body.status && body.status !== obligation.status) {
      obligation.history.push({
        changedBy: user._id,
        previousStatus: obligation.status,
        newStatus: body.status,
        note: body.statusNote || 'Status updated',
        changedAt: new Date(),
      });
      obligation.status = body.status;
    }

    if (body.title) obligation.title = body.title.trim();
    if (body.description) obligation.description = body.description;
    if (body.framework) obligation.framework = body.framework;
    if (body.category) obligation.category = body.category;
    if (body.priority) obligation.priority = body.priority;
    if (body.assignedTo !== undefined) {
      obligation.assignedTo = body.assignedTo ? new Types.ObjectId(body.assignedTo) : undefined;
    }
    if (body.dueDate) obligation.dueDate = new Date(body.dueDate);
    if (body.reviewDate) obligation.reviewDate = new Date(body.reviewDate);
    if (body.recurrence) obligation.recurrence = body.recurrence;
    if (body.isArchived !== undefined) obligation.isArchived = body.isArchived;

    await obligation.save();

    // Invalidate cache
    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'OBLIGATION_UPDATED',
      resourceType: 'ComplianceObligation',
      resourceId: obligation._id.toString(),
      changes: { before, after: obligation.toObject() },
    });

    res.json({ success: true, data: obligation });
  }

  /**
   * Archive compliance obligation
   */
  static async archiveObligation(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const obligation = await ComplianceObligation.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      { isArchived: true },
      { new: true }
    );

    if (!obligation) {
      res.status(404).json({ success: false, error: { message: 'Obligation not found' } });
      return;
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'OBLIGATION_ARCHIVED',
      resourceType: 'ComplianceObligation',
      resourceId: id,
    });

    res.json({ success: true, message: 'Obligation archived successfully' });
  }
}
