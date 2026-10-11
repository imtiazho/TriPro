import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { EmployeeComplianceRecord } from '../models/EmployeeComplianceRecord';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class HRController {
  /**
   * List employee compliance records
   */
  static async getEmployees(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { department, status, search, page = 1, limit = 20 } = req.query as any;

    const query: any = { organizationId: orgId };

    if (department) query.department = department;
    if (status) query.status = status;

    if (search && typeof search === 'string') {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      EmployeeComplianceRecord.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      EmployeeComplianceRecord.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Create employee compliance record with statutory templates
   */
  static async createEmployee(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { employeeCode, fullName, email, department, designation, joiningDate, statutoryRequirements } = req.body;

    // Default Bangladesh Labour Act statutory compliance checklist if not provided
    const defaultStatutory = [
      { name: 'Written Appointment Letter & Service Agreement (BD Labour Act Sec 5)', isMet: true },
      { name: 'Service Book Created & Maintained (BD Labour Act Sec 6)', isMet: false },
      { name: 'National ID (NID) & Address Verification', isMet: true },
      { name: 'Workplace Health & Occupational Safety Briefing', isMet: false },
      { name: 'Statutory Working Hours & Overtime Policy Acknowledgment', isMet: false },
    ];

    const record = await EmployeeComplianceRecord.create({
      organizationId: orgId,
      employeeCode: employeeCode.trim(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      department: department || 'General',
      designation: designation || 'Staff',
      joiningDate: new Date(joiningDate || Date.now()),
      status: 'active',
      statutoryRequirements: statutoryRequirements || defaultStatutory,
      trainings: [],
      documents: [],
    });

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'EMPLOYEE_RECORD_CREATED',
      resourceType: 'EmployeeComplianceRecord',
      resourceId: record._id.toString(),
      changes: { after: record.toObject() },
    });

    res.status(201).json({ success: true, data: record });
  }

  /**
   * Update employee compliance record (trainings, statutory items, status)
   */
  static async updateEmployee(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const body = req.body;

    const record = await EmployeeComplianceRecord.findOne({ _id: id, organizationId: orgId });
    if (!record) {
      res.status(404).json({ success: false, error: { message: 'Employee record not found' } });
      return;
    }

    const before = record.toObject();

    if (body.fullName) record.fullName = body.fullName.trim();
    if (body.department) record.department = body.department;
    if (body.designation) record.designation = body.designation;
    if (body.status) record.status = body.status;
    if (body.statutoryRequirements) record.statutoryRequirements = body.statutoryRequirements;
    if (body.trainings) record.trainings = body.trainings;
    if (body.documents) record.documents = body.documents;

    await record.save();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'EMPLOYEE_RECORD_UPDATED',
      resourceType: 'EmployeeComplianceRecord',
      resourceId: record._id.toString(),
      changes: { before, after: record.toObject() },
    });

    res.json({ success: true, data: record });
  }

  /**
   * Delete employee compliance record
   */
  static async deleteEmployee(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const record = await EmployeeComplianceRecord.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!record) {
      res.status(404).json({ success: false, error: { message: 'Employee record not found' } });
      return;
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'EMPLOYEE_RECORD_DELETED',
      resourceType: 'EmployeeComplianceRecord',
      resourceId: id,
    });

    res.json({ success: true, message: 'Employee record removed' });
  }
}
