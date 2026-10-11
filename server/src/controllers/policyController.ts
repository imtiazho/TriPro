import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Policy } from '../models/Policy';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class PolicyController {
  /**
   * List policies with filters
   */
  static async getPolicies(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { category, status, search, page = 1, limit = 20 } = req.query as any;

    const query: any = { organizationId: orgId };

    if (category) query.category = category;
    if (status) query.status = status;

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [policies, total] = await Promise.all([
      Policy.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('ownerId', 'displayName email')
        .populate('attachmentId', 'fileName originalName fileSize')
        .lean(),
      Policy.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: policies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Create internal compliance policy
   */
  static async createPolicy(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const body = req.body;

    const policy = await Policy.create({
      organizationId: orgId,
      title: body.title.trim(),
      code: body.code.trim().toUpperCase(),
      category: body.category || 'General Governance',
      version: body.version || '1.0',
      status: body.status || 'draft',
      ownerId: user._id,
      content: body.content || '',
      attachmentId: body.attachmentId ? new Types.ObjectId(body.attachmentId) : undefined,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      acknowledgments: [],
    });

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'POLICY_CREATED',
      resourceType: 'Policy',
      resourceId: policy._id.toString(),
      changes: { after: policy.toObject() },
    });

    res.status(201).json({ success: true, data: policy });
  }

  /**
   * Update policy
   */
  static async updatePolicy(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const body = req.body;

    const policy = await Policy.findOne({ _id: id, organizationId: orgId });
    if (!policy) {
      res.status(404).json({ success: false, error: { message: 'Policy not found' } });
      return;
    }

    const before = policy.toObject();

    if (body.title) policy.title = body.title.trim();
    if (body.code) policy.code = body.code.trim().toUpperCase();
    if (body.category) policy.category = body.category;
    if (body.version) policy.version = body.version;
    if (body.status) policy.status = body.status;
    if (body.content !== undefined) policy.content = body.content;
    if (body.attachmentId !== undefined) {
      policy.attachmentId = body.attachmentId ? new Types.ObjectId(body.attachmentId) : undefined;
    }
    if (body.reviewDate) policy.reviewDate = new Date(body.reviewDate);
    if (body.effectiveDate) policy.effectiveDate = new Date(body.effectiveDate);

    await policy.save();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'POLICY_UPDATED',
      resourceType: 'Policy',
      resourceId: policy._id.toString(),
      changes: { before, after: policy.toObject() },
    });

    res.json({ success: true, data: policy });
  }

  /**
   * Record employee policy acknowledgment
   */
  static async acknowledgePolicy(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const { id } = req.params;

    const policy = await Policy.findOne({ _id: id, organizationId: orgId });
    if (!policy) {
      res.status(404).json({ success: false, error: { message: 'Policy not found' } });
      return;
    }

    // Check if already acknowledged
    const existing = policy.acknowledgments.find(
      (a) => a.userId.toString() === user._id.toString()
    );

    if (existing) {
      res.json({
        success: true,
        message: 'Policy has already been acknowledged.',
        data: policy,
      });
      return;
    }

    policy.acknowledgments.push({
      userId: user._id,
      acknowledgedAt: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    await policy.save();

    await AuditService.log(req, {
      action: 'POLICY_ACKNOWLEDGED',
      resourceType: 'Policy',
      resourceId: policy._id.toString(),
    });

    res.json({
      success: true,
      message: 'Policy successfully acknowledged.',
      data: policy,
    });
  }
}
