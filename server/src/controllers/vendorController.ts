import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Vendor } from '../models/Vendor';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class VendorController {
  /**
   * List vendors with filters
   */
  static async getVendors(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { category, riskLevel, status, search, page = 1, limit = 20 } = req.query as any;

    const query: any = { organizationId: orgId };

    if (category) query.category = category;
    if (riskLevel) query.riskLevel = riskLevel;
    if (status) query.status = status;

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('assignedOwnerId', 'displayName email')
        .lean(),
      Vendor.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: vendors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Get vendor by ID
   */
  static async getVendorById(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const vendor = await Vendor.findOne({ _id: id, organizationId: orgId })
      .populate('assignedOwnerId', 'displayName email')
      .lean();

    if (!vendor) {
      res.status(404).json({ success: false, error: { message: 'Vendor not found' } });
      return;
    }

    res.json({ success: true, data: vendor });
  }

  /**
   * Create vendor record
   */
  static async createVendor(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const body = req.body;

    const defaultChecklist = [
      { item: 'Non-Disclosure Agreement (NDA) Executed', completed: true },
      { item: 'Service Level Agreement (SLA) & Data Protection Addendum', completed: false },
      { item: 'SOC 2 / ISO 27001 / Security Assessment Review', completed: false },
      { item: 'Business Continuity / Disaster Recovery Proof', completed: false },
    ];

    const vendor = await Vendor.create({
      organizationId: orgId,
      name: body.name.trim(),
      category: body.category || 'SaaS Software',
      contactPerson: body.contactPerson.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone,
      assignedOwnerId: body.assignedOwnerId ? new Types.ObjectId(body.assignedOwnerId) : undefined,
      riskLevel: body.riskLevel || 'medium',
      riskScore: body.riskScore || 50,
      status: body.status || 'active',
      contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : new Date(),
      contractExpiryDate: body.contractExpiryDate ? new Date(body.contractExpiryDate) : undefined,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      checklist: body.checklist || defaultChecklist,
      reviewNotes: body.reviewNotes || '',
      lastReviewDecision: body.lastReviewDecision || 'pending',
    });

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'VENDOR_CREATED',
      resourceType: 'Vendor',
      resourceId: vendor._id.toString(),
      changes: { after: vendor.toObject() },
    });

    res.status(201).json({ success: true, data: vendor });
  }

  /**
   * Update vendor record
   */
  static async updateVendor(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const body = req.body;

    const vendor = await Vendor.findOne({ _id: id, organizationId: orgId });
    if (!vendor) {
      res.status(404).json({ success: false, error: { message: 'Vendor not found' } });
      return;
    }

    const before = vendor.toObject();

    if (body.name) vendor.name = body.name.trim();
    if (body.category) vendor.category = body.category;
    if (body.contactPerson) vendor.contactPerson = body.contactPerson.trim();
    if (body.email) vendor.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) vendor.phone = body.phone;
    if (body.assignedOwnerId !== undefined) {
      vendor.assignedOwnerId = body.assignedOwnerId ? new Types.ObjectId(body.assignedOwnerId) : undefined;
    }
    if (body.riskLevel) vendor.riskLevel = body.riskLevel;
    if (body.riskScore !== undefined) vendor.riskScore = body.riskScore;
    if (body.status) vendor.status = body.status;
    if (body.contractStartDate) vendor.contractStartDate = new Date(body.contractStartDate);
    if (body.contractExpiryDate) vendor.contractExpiryDate = new Date(body.contractExpiryDate);
    if (body.reviewDate) vendor.reviewDate = new Date(body.reviewDate);
    if (body.checklist) vendor.checklist = body.checklist;
    if (body.reviewNotes !== undefined) vendor.reviewNotes = body.reviewNotes;
    if (body.lastReviewDecision) vendor.lastReviewDecision = body.lastReviewDecision;

    await vendor.save();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'VENDOR_UPDATED',
      resourceType: 'Vendor',
      resourceId: vendor._id.toString(),
      changes: { before, after: vendor.toObject() },
    });

    res.json({ success: true, data: vendor });
  }

  /**
   * Delete vendor record
   */
  static async deleteVendor(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const vendor = await Vendor.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!vendor) {
      res.status(404).json({ success: false, error: { message: 'Vendor not found' } });
      return;
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'VENDOR_DELETED',
      resourceType: 'Vendor',
      resourceId: id,
    });

    res.json({ success: true, message: 'Vendor removed successfully' });
  }
}
