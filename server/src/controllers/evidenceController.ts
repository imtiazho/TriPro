import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { EvidenceDocument } from '../models/EvidenceDocument';
import { ComplianceObligation } from '../models/ComplianceObligation';
import { StorageService } from '../services/storageService';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class EvidenceController {
  /**
   * List evidence documents for the organization
   */
  static async getDocuments(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { obligationId, taskId, vendorId, employeeId, status, search, page = 1, limit = 20 } = req.query as any;

    const query: any = { organizationId: orgId };

    if (obligationId) query.obligationId = new Types.ObjectId(obligationId);
    if (taskId) query.taskId = new Types.ObjectId(taskId);
    if (vendorId) query.vendorId = new Types.ObjectId(vendorId);
    if (employeeId) query.employeeId = new Types.ObjectId(employeeId);
    if (status) query.status = status;

    if (search && typeof search === 'string') {
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      EvidenceDocument.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('uploadedBy', 'displayName email')
        .populate('obligationId', 'title category')
        .lean(),
      EvidenceDocument.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: docs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Upload evidence document with file and metadata
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      return;
    }

    const { obligationId, taskId, vendorId, employeeId, description, expiryDate, tags } = req.body;

    const parsedTags = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags || [];

    const doc = await EvidenceDocument.create({
      organizationId: orgId,
      obligationId: obligationId ? new Types.ObjectId(obligationId) : undefined,
      taskId: taskId ? new Types.ObjectId(taskId) : undefined,
      vendorId: vendorId ? new Types.ObjectId(vendorId) : undefined,
      employeeId: employeeId ? new Types.ObjectId(employeeId) : undefined,
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageKey: file.filename,
      storageProvider: 'local',
      uploadedBy: user._id,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      status: 'valid',
      description: description || '',
      tags: parsedTags,
    });

    // If attached to obligation, push to obligation.evidenceIds
    if (obligationId) {
      await ComplianceObligation.findByIdAndUpdate(obligationId, {
        $addToSet: { evidenceIds: doc._id },
      });
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'EVIDENCE_UPLOADED',
      resourceType: 'EvidenceDocument',
      resourceId: doc._id.toString(),
      changes: { after: { fileName: doc.originalName, size: doc.fileSize, mimeType: doc.mimeType } },
    });

    res.status(201).json({ success: true, data: doc });
  }

  /**
   * Secure download of evidence document
   */
  static async downloadDocument(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const doc = await EvidenceDocument.findOne({ _id: id, organizationId: orgId });
    if (!doc) {
      res.status(404).json({ success: false, error: { message: 'Document not found' } });
      return;
    }

    try {
      const filePath = StorageService.getFilePath(doc.storageKey);

      await AuditService.log(req, {
        action: 'EVIDENCE_DOWNLOADED',
        resourceType: 'EvidenceDocument',
        resourceId: doc._id.toString(),
      });

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ success: false, error: { message: 'File not found on storage server' } });
    }
  }

  /**
   * Delete evidence document
   */
  static async deleteDocument(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const doc = await EvidenceDocument.findOne({ _id: id, organizationId: orgId });
    if (!doc) {
      res.status(404).json({ success: false, error: { message: 'Document not found' } });
      return;
    }

    await StorageService.deleteFile(doc.storageKey);
    await doc.deleteOne();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'EVIDENCE_DELETED',
      resourceType: 'EvidenceDocument',
      resourceId: id,
    });

    res.json({ success: true, message: 'Evidence document removed successfully' });
  }
}
