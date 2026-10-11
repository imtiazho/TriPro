import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { ComplianceObligation } from '../models/ComplianceObligation';
import { ComplianceTask } from '../models/ComplianceTask';
import { EvidenceDocument } from '../models/EvidenceDocument';
import { Policy } from '../models/Policy';
import { EmployeeComplianceRecord } from '../models/EmployeeComplianceRecord';
import { Vendor } from '../models/Vendor';
import { Risk } from '../models/Risk';
import { Finding } from '../models/Finding';
import { CorrectiveAction } from '../models/CorrectiveAction';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { ROLES } from '../constants/roles';

async function seed() {
  console.log('🌱 Starting database seed script...');
  await connectDatabase();

  try {
    // Clear demo data
    console.log('Cleaning existing demo data...');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@(tripro\.local|apexdigital\.com\.bd|globalcompliance\.io)/ } }),
      Organization.deleteMany({ slug: 'apex-digital' }),
      OrganizationMembership.deleteMany({}),
      ComplianceObligation.deleteMany({}),
      ComplianceTask.deleteMany({}),
      EvidenceDocument.deleteMany({}),
      Policy.deleteMany({}),
      EmployeeComplianceRecord.deleteMany({}),
      Vendor.deleteMany({}),
      Risk.deleteMany({}),
      Finding.deleteMany({}),
      CorrectiveAction.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('Creating demo organization (Apex Digital Solutions Ltd.)...');
    const org = await Organization.create({
      name: 'Apex Digital Solutions Ltd.',
      slug: 'apex-digital',
      country: 'Bangladesh',
      industry: 'B2B Software & FinTech',
      subscriptionTier: 'growth',
      complianceFrameworks: [
        'Bangladesh Labour Act 2006',
        'National Cyber Security Act (Bangladesh)',
        'BIDA & Registrar of Joint Stock Companies (RJSC) Filings',
        'ISO/IEC 27001:2022',
        'SOC 2 Type II',
      ],
      settings: {
        notificationPreferences: {
          emailAlerts: true,
          daysBeforeExpiryWarning: 30,
          overdueTaskReminders: true,
        },
        timezone: 'Asia/Dhaka',
        fiscalYearStart: 'July',
      },
      status: 'active',
    });

    console.log('Creating demo users...');
    const orgAdmin = await User.create({
      firebaseUid: 'demo-orgadmin-uid',
      email: 'orgadmin@apexdigital.com.bd',
      displayName: 'Tanvir Hossain (Founder & CEO)',
      role: ROLES.ORGANIZATION_ADMIN,
      currentOrgId: org._id,
      status: 'active',
    });

    const complianceMgr = await User.create({
      firebaseUid: 'demo-compliance-uid',
      email: 'compliance@apexdigital.com.bd',
      displayName: 'Farhana Ahmed (Compliance Officer)',
      role: ROLES.COMPLIANCE_MANAGER,
      currentOrgId: org._id,
      status: 'active',
    });

    const hrMgr = await User.create({
      firebaseUid: 'demo-hr-uid',
      email: 'hr@apexdigital.com.bd',
      displayName: 'Nusrat Jahan (HR Coordinator)',
      role: ROLES.HR_MANAGER,
      currentOrgId: org._id,
      status: 'active',
    });

    const vendorMgr = await User.create({
      firebaseUid: 'demo-vendor-uid',
      email: 'vendor@apexdigital.com.bd',
      displayName: 'Kazi Mofizul (Procurement Lead)',
      role: ROLES.VENDOR_MANAGER,
      currentOrgId: org._id,
      status: 'active',
    });

    const employee = await User.create({
      firebaseUid: 'demo-employee-uid',
      email: 'rahim.chowdhury@apexdigital.com.bd',
      displayName: 'Rahim Chowdhury (Senior Developer)',
      role: ROLES.EMPLOYEE,
      currentOrgId: org._id,
      status: 'active',
    });

    const auditor = await User.create({
      firebaseUid: 'demo-auditor-uid',
      email: 'auditor@globalcompliance.io',
      displayName: 'Michael Chang (Lead External Auditor)',
      role: ROLES.AUDITOR,
      currentOrgId: org._id,
      status: 'active',
    });

    // Memberships
    await OrganizationMembership.insertMany([
      { organizationId: org._id, userId: orgAdmin._id, role: ROLES.ORGANIZATION_ADMIN, department: 'Executive' },
      { organizationId: org._id, userId: complianceMgr._id, role: ROLES.COMPLIANCE_MANAGER, department: 'Legal & Compliance' },
      { organizationId: org._id, userId: hrMgr._id, role: ROLES.HR_MANAGER, department: 'People & Culture' },
      { organizationId: org._id, userId: vendorMgr._id, role: ROLES.VENDOR_MANAGER, department: 'Operations' },
      { organizationId: org._id, userId: employee._id, role: ROLES.EMPLOYEE, department: 'Engineering' },
      { organizationId: org._id, userId: auditor._id, role: ROLES.AUDITOR, department: 'External Assurance' },
    ]);

    org.ownerId = orgAdmin._id;
    await org.save();

    console.log('Creating realistic compliance obligations...');
    const now = new Date();
    const obligation1 = await ComplianceObligation.create({
      organizationId: org._id,
      title: 'Annual Statutory Service Book Verification (BD Labour Act Sec 6)',
      description: 'Audit service books and formal appointment letters for all full-time employees in accordance with Section 6 of Bangladesh Labour Act 2006.',
      framework: 'Bangladesh Labour Act 2006',
      category: 'Labor & Employment',
      priority: 'high',
      status: 'in_progress',
      assignedTo: hrMgr._id,
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days
      recurrence: 'annual',
      history: [{ changedBy: complianceMgr._id, newStatus: 'in_progress', note: 'Initiated annual service book audit', changedAt: now }],
    });

    const obligation2 = await ComplianceObligation.create({
      organizationId: org._id,
      title: 'National Cyber Security Act (NCSA) Data Classification & Security Audit',
      description: 'Execute mandatory quarterly review of critical information infrastructure (CII) and customer data encryption at rest under Bangladesh Cyber Security rules.',
      framework: 'National Cyber Security Act (Bangladesh)',
      category: 'Data Protection & Cybersecurity',
      priority: 'critical',
      status: 'pending_review',
      assignedTo: complianceMgr._id,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      recurrence: 'quarterly',
      history: [{ changedBy: complianceMgr._id, newStatus: 'pending_review', note: 'Evidence package submitted for review', changedAt: now }],
    });

    const obligation3 = await ComplianceObligation.create({
      organizationId: org._id,
      title: 'BIDA Foreign Commercial Office & Trade License Renewal',
      description: 'Ensure annual municipal trade license and Bangladesh Investment Development Authority (BIDA) registrations are renewed before fiscal deadline.',
      framework: 'BIDA & RJSC Filings',
      category: 'Corporate & Tax',
      priority: 'medium',
      status: 'compliant',
      assignedTo: orgAdmin._id,
      dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      recurrence: 'annual',
      history: [{ changedBy: orgAdmin._id, newStatus: 'compliant', note: 'License renewal certificate received and validated', changedAt: now }],
    });

    const obligation4 = await ComplianceObligation.create({
      organizationId: org._id,
      title: 'ISO/IEC 27001 Access Control & MFA Enforcement',
      description: 'Verify 100% multi-factor authentication (MFA) enforcement across GitHub, AWS, Google Workspace, and internal VPNs.',
      framework: 'ISO/IEC 27001:2022',
      category: 'Data Protection & Cybersecurity',
      priority: 'critical',
      status: 'compliant',
      assignedTo: employee._id,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      recurrence: 'monthly',
      history: [{ changedBy: employee._id, newStatus: 'compliant', note: 'All IAM users verified with hardware/app MFA', changedAt: now }],
    });

    const obligation5 = await ComplianceObligation.create({
      organizationId: org._id,
      title: 'Workplace Fire & Emergency Evacuation Drill Compliance',
      description: 'Conduct bi-annual fire drill and inspect emergency extinguishers at Dhaka office in compliance with factory & commercial establishment safety norms.',
      framework: 'Bangladesh Labour Act 2006',
      category: 'Environmental & Safety',
      priority: 'medium',
      status: 'needs_attention',
      assignedTo: hrMgr._id,
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Overdue!
      recurrence: 'annual',
      history: [{ changedBy: hrMgr._id, newStatus: 'needs_attention', note: 'Drill delayed due to vendor rescheduling', changedAt: now }],
    });

    console.log('Creating compliance tasks...');
    await ComplianceTask.create({
      organizationId: org._id,
      obligationId: obligation1._id,
      title: 'Collect signed service book copies for Q3 new hires',
      description: 'Verify employee signatures and passport/NID copies attached to official register.',
      assignedTo: hrMgr._id,
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      recurrence: 'none',
      activityHistory: [{ actorId: hrMgr._id, action: 'TASK_STARTED', comment: 'Audit started for 12 new hires', createdAt: now }],
    });

    await ComplianceTask.create({
      organizationId: org._id,
      obligationId: obligation5._id,
      title: 'Schedule certified fire marshal inspection',
      description: 'Engage building management and schedule building inspection before next week.',
      assignedTo: hrMgr._id,
      priority: 'critical',
      status: 'todo',
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Overdue
      recurrence: 'none',
      activityHistory: [{ actorId: complianceMgr._id, action: 'TASK_CREATED', comment: 'Escalated due to deadline', createdAt: now }],
    });

    await ComplianceTask.create({
      organizationId: org._id,
      obligationId: obligation4._id,
      title: 'Revoke inactive API tokens and rotate AWS KMS master keys',
      description: 'Execute quarterly cryptographic key rotation routine.',
      assignedTo: employee._id,
      priority: 'high',
      status: 'completed',
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      completedBy: employee._id,
      recurrence: 'quarterly',
      activityHistory: [{ actorId: employee._id, action: 'TASK_COMPLETED', comment: 'Rotated 4 KMS keys successfully', createdAt: now }],
    });

    console.log('Creating evidence documents...');
    const evidence1 = await EvidenceDocument.create({
      organizationId: org._id,
      obligationId: obligation3._id,
      fileName: 'Trade_License_Dhaka_North_2025_2026.pdf',
      originalName: 'Trade_License_Dhaka_North_2025_2026.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      storageKey: 'mock-trade-license.pdf',
      storageProvider: 'local',
      uploadedBy: orgAdmin._id,
      expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      status: 'valid',
      description: 'Official verified Trade License renewal certificate',
      tags: ['Trade License', 'RJSC', 'Tax'],
    });

    const evidence2 = await EvidenceDocument.create({
      organizationId: org._id,
      obligationId: obligation4._id,
      fileName: 'AWS_IAM_MFA_Enforcement_Report.pdf',
      originalName: 'AWS_IAM_MFA_Enforcement_Report.pdf',
      fileSize: 489200,
      mimeType: 'application/pdf',
      storageKey: 'mock-aws-mfa.pdf',
      storageProvider: 'local',
      uploadedBy: employee._id,
      expiryDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // Expiring in 20 days!
      status: 'valid',
      description: 'Automated IAM audit export confirming MFA compliance',
      tags: ['Security', 'ISO27001', 'AWS'],
    });

    // Link evidence to obligation
    await ComplianceObligation.findByIdAndUpdate(obligation3._id, { $addToSet: { evidenceIds: evidence1._id } });
    await ComplianceObligation.findByIdAndUpdate(obligation4._id, { $addToSet: { evidenceIds: evidence2._id } });

    console.log('Creating HR compliance employee records...');
    await EmployeeComplianceRecord.create({
      organizationId: org._id,
      userId: employee._id,
      employeeCode: 'EMP-001',
      fullName: 'Rahim Chowdhury',
      email: 'rahim.chowdhury@apexdigital.com.bd',
      department: 'Engineering',
      designation: 'Senior Software Architect',
      joiningDate: new Date('2023-01-15'),
      status: 'active',
      statutoryRequirements: [
        { name: 'Written Appointment Letter (BD Labour Act Sec 5)', isMet: true, verifiedAt: new Date('2023-01-15') },
        { name: 'Service Book Created & Maintained (BD Labour Act Sec 6)', isMet: true, verifiedAt: new Date('2023-01-20') },
        { name: 'National ID (NID) & Address Verification', isMet: true, verifiedAt: new Date('2023-01-15') },
        { name: 'Workplace Health & Occupational Safety Briefing', isMet: true, verifiedAt: new Date('2024-02-10') },
        { name: 'Code of Conduct & Confidentiality Acknowledgment', isMet: true, verifiedAt: new Date('2023-01-15') },
      ],
      trainings: [
        { topic: 'Information Security & OWASP Top 10 Awareness', completedDate: new Date('2025-01-10'), expiryDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000) },
        { topic: 'Workplace Harassment Prevention & Labour Rights', completedDate: new Date('2024-11-05') },
      ],
    });

    console.log('Creating vendors (TPRM)...');
    await Vendor.create({
      organizationId: org._id,
      name: 'Amazon Web Services (AWS)',
      category: 'Cloud Provider',
      contactPerson: 'Enterprise Support Desk',
      email: 'aws-support@amazon.com',
      assignedOwnerId: complianceMgr._id,
      riskLevel: 'high',
      riskScore: 78,
      status: 'active',
      contractStartDate: new Date('2024-01-01'),
      contractExpiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // Expiring in 15 days!
      reviewDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      checklist: [
        { item: 'Data Processing Agreement (DPA) signed', completed: true },
        { item: 'SOC 2 Type II Report Reviewed', completed: true },
        { item: 'ISO 27001 Certification on file', completed: true },
      ],
      lastReviewDecision: 'approved',
    });

    await Vendor.create({
      organizationId: org._id,
      name: 'Local Payment Gateway Solutions Ltd.',
      category: 'Legal & Financial',
      contactPerson: 'Shabbir Rahman',
      email: 'shabbir@localgateway.com.bd',
      assignedOwnerId: vendorMgr._id,
      riskLevel: 'critical',
      riskScore: 88,
      status: 'under_review',
      contractStartDate: new Date('2024-06-01'),
      contractExpiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      checklist: [
        { item: 'Bangladesh Bank PSO License Verified', completed: true },
        { item: 'PCI-DSS Attestation of Compliance (AOC)', completed: false },
        { item: 'Annual Penetration Testing Report', completed: false },
      ],
      lastReviewDecision: 'conditional',
    });

    console.log('Creating Risk register entries...');
    await Risk.create({
      organizationId: org._id,
      title: 'Payment Gateway API Disruption or Regulatory Suspension',
      description: 'Risk that local payment processing partner loses Bangladesh Bank PSO compliance, disrupting customer subscription renewals.',
      category: 'Vendor / Third-Party',
      likelihood: 3,
      impact: 5,
      riskScore: 15,
      riskLevel: 'high',
      status: 'mitigating',
      ownerId: vendorMgr._id,
      mitigationPlan: 'Maintain multi-gateway redundancy with secondary approved aggregator.',
      reviewDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    });

    await Risk.create({
      organizationId: org._id,
      title: 'Inadvertent Production PII Leakage in Log Aggregators',
      description: 'Customer contact details or national ID numbers logged into debugging platforms without masking.',
      category: 'Security & Privacy',
      likelihood: 2,
      impact: 4,
      riskScore: 8,
      riskLevel: 'medium',
      status: 'mitigating',
      ownerId: employee._id,
      mitigationPlan: 'Implemented automated regex redactor in Winston/Pino logger streams.',
      reviewDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    });

    console.log('Creating Findings and Corrective Actions (CAPA)...');
    const finding1 = await Finding.create({
      organizationId: org._id,
      title: 'Outdated Emergency Evacuation Floor Maps in Dhaka Office Annex',
      description: 'Physical inspection noted that 2nd floor emergency evacuation diagrams do not reflect recent server room partition changes.',
      source: 'Internal Inspection',
      severity: 'medium',
      status: 'in_remediation',
      identifiedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      ownerId: hrMgr._id,
      rootCause: 'Office layout reconfiguration was completed without notifying safety coordinator.',
      linkedObligationId: obligation5._id,
    });

    await CorrectiveAction.create({
      organizationId: org._id,
      findingId: finding1._id,
      title: 'Reprint and mount laminated floor plans at all fire exit stairwells',
      actionPlan: 'Hire certified signage vendor to print updated diagrams and install near stairs.',
      assignedTo: hrMgr._id,
      targetDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
    });

    console.log('Creating internal Policies...');
    await Policy.create({
      organizationId: org._id,
      title: 'Enterprise Information Security & Acceptable Use Policy',
      code: 'SEC-POL-001',
      category: 'Security & Privacy',
      version: '2.1',
      status: 'published',
      ownerId: complianceMgr._id,
      content: 'This policy defines mandatory requirements for endpoint security, screen lock passwords, MFA, remote work guidelines, and proprietary data handling.',
      effectiveDate: new Date('2025-01-01'),
      reviewDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      acknowledgments: [
        { userId: employee._id, acknowledgedAt: new Date('2025-01-05'), ipAddress: '103.112.54.12' },
        { userId: hrMgr._id, acknowledgedAt: new Date('2025-01-06'), ipAddress: '103.112.54.13' },
      ],
    });

    await Policy.create({
      organizationId: org._id,
      title: 'Workplace Equal Opportunity & Anti-Harassment Policy (Labour Act Aligned)',
      code: 'HR-POL-003',
      category: 'Human Resources',
      version: '1.2',
      status: 'published',
      ownerId: hrMgr._id,
      content: 'Apex Digital is committed to an equitable and respectful workplace conforming to Supreme Court directives and Bangladesh Labour Act safeguards.',
      effectiveDate: new Date('2024-07-01'),
      reviewDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
      acknowledgments: [
        { userId: employee._id, acknowledgedAt: new Date('2024-07-10'), ipAddress: '103.112.54.12' },
      ],
    });

    console.log('Creating in-app notifications...');
    await Notification.create({
      organizationId: org._id,
      recipientId: hrMgr._id,
      title: 'Fire Safety Drill Deadline Overdue',
      message: 'The compliance obligation "Workplace Fire & Emergency Evacuation Drill" is past its due date. Please take corrective action.',
      type: 'overdue',
      link: '/compliance',
    });

    await Notification.create({
      organizationId: org._id,
      recipientId: complianceMgr._id,
      title: 'Contract Expiry Notice: Amazon Web Services (AWS)',
      message: 'Vendor contract for AWS is expiring in 15 days. Review and renewal required.',
      type: 'expiry',
      link: '/vendors',
    });

    console.log('Creating initial Audit Trail...');
    await AuditLog.create({
      organizationId: org._id,
      actorId: orgAdmin._id,
      actorEmail: orgAdmin.email,
      actorRole: orgAdmin.role,
      action: 'ORGANIZATION_INITIALIZED',
      resourceType: 'Organization',
      resourceId: org._id.toString(),
      changes: { after: { name: org.name, slug: org.slug } },
      ipAddress: '127.0.0.1',
    });

    console.log('\n✅ Database successfully seeded with realistic enterprise compliance data!');
    console.log('-------------------------------------------------------------------------');
    console.log('Organization: Apex Digital Solutions Ltd. (Slug: apex-digital)');
    console.log('Org-Admin:    orgadmin@apexdigital.com.bd');
    console.log('Compliance:   compliance@apexdigital.com.bd');
    console.log('HR Manager:   hr@apexdigital.com.bd');
    console.log('Vendor Mgr:   vendor@apexdigital.com.bd');
    console.log('Employee:     rahim.chowdhury@apexdigital.com.bd');
    console.log('Auditor:      auditor@globalcompliance.io');
    console.log('-------------------------------------------------------------------------\n');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await disconnectDatabase();
  }
}

seed();
