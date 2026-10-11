import { Request, Response } from 'express';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { ComplianceObligation } from '../models/ComplianceObligation';
import { AuditLog } from '../models/AuditLog';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class AdminController {
  /**
   * Super-admin platform overview stats
   */
  static async getPlatformStats(req: Request, res: Response): Promise<void> {
    const [totalOrgs, activeOrgs, totalUsers, totalObligations, totalAudits] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'active' }),
      User.countDocuments(),
      ComplianceObligation.countDocuments(),
      AuditLog.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalOrgs,
        activeOrgs,
        totalUsers,
        totalObligations,
        totalAudits,
        serverTime: new Date().toISOString(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      },
    });
  }

  /**
   * List all tenant organizations (super-admin)
   */
  static async getOrganizations(req: Request, res: Response): Promise<void> {
    const { status, search, page = 1, limit = 20 } = req.query as any;

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orgs, total] = await Promise.all([
      Organization.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('ownerId', 'displayName email')
        .lean(),
      Organization.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orgs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Create new organization as super-admin
   */
  static async createOrganization(req: Request, res: Response): Promise<void> {
    const { name, slug, country, industry, subscriptionTier, complianceFrameworks } = req.body;

    const existingSlug = await Organization.findOne({ slug: slug.toLowerCase().trim() });
    if (existingSlug) {
      res.status(409).json({ success: false, error: { message: 'Organization slug is already in use.' } });
      return;
    }

    const org = await Organization.create({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      country: country || 'Bangladesh',
      industry: industry || 'Technology',
      subscriptionTier: subscriptionTier || 'growth',
      complianceFrameworks: complianceFrameworks || [
        'Bangladesh Labour Act 2006',
        'National Cyber Security Act (Bangladesh)',
        'ISO/IEC 27001',
      ],
      ownerId: req.user!._id,
      status: 'active',
    });

    await AuditService.log(req, {
      action: 'PLATFORM_ORG_CREATED',
      resourceType: 'Organization',
      resourceId: org._id.toString(),
      changes: { after: org.toObject() },
    });

    res.status(201).json({ success: true, data: org });
  }

  /**
   * Update organization status (e.g. activate / suspend)
   */
  static async updateOrganizationStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    const before = org.toObject();
    org.status = status;
    await org.save();

    CacheService.invalidateTenant(id);

    await AuditService.log(req, {
      action: 'PLATFORM_ORG_STATUS_UPDATED',
      resourceType: 'Organization',
      resourceId: id,
      changes: { before, after: org.toObject() },
    });

    res.json({ success: true, data: org });
  }

  /**
   * List platform audit logs
   */
  static async getPlatformAuditLogs(req: Request, res: Response): Promise<void> {
    const { action, resourceType, page = 1, limit = 50 } = req.query as any;

    const query: any = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('organizationId', 'name slug')
        .populate('actorId', 'displayName email')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }
}
