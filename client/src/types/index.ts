export type UserRole =
  | 'super-admin'
  | 'organization-admin'
  | 'compliance-manager'
  | 'hr-manager'
  | 'vendor-manager'
  | 'employee'
  | 'auditor';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  currentOrgId?: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  country: string;
  industry: string;
  subscriptionTier: 'starter' | 'growth' | 'enterprise';
  complianceFrameworks: string[];
  settings?: {
    notificationPreferences?: {
      emailAlerts?: boolean;
      daysBeforeExpiryWarning?: number;
      overdueTaskReminders?: boolean;
    };
    timezone?: string;
    fiscalYearStart?: string;
  };
  status: 'active' | 'suspended';
}

export type ObligationStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'compliant'
  | 'non_compliant'
  | 'needs_attention';

export interface ComplianceObligation {
  _id: string;
  title: string;
  description: string;
  framework: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: ObligationStatus;
  assignedTo?: { _id: string; displayName: string; email: string };
  dueDate: string;
  reviewDate?: string;
  recurrence: 'none' | 'monthly' | 'quarterly' | 'annual';
  evidenceIds?: Array<{ _id: string; fileName: string; originalName: string; fileSize: number; status: string; expiryDate?: string }>;
  linkedTaskIds?: any[];
  linkedRiskIds?: any[];
  linkedPolicyIds?: any[];
  history?: Array<{
    changedBy: { displayName: string; email: string };
    newStatus: string;
    previousStatus?: string;
    note?: string;
    changedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceTask {
  _id: string;
  title: string;
  description?: string;
  obligationId?: { _id: string; title: string; category: string };
  assignedTo?: { _id: string; displayName: string; email: string };
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'under_review' | 'completed' | 'cancelled';
  dueDate: string;
  completedAt?: string;
  recurrence?: string;
  activityHistory?: Array<{
    action: string;
    comment?: string;
    createdAt: string;
  }>;
}

export interface EvidenceDocument {
  _id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  uploadedBy?: { displayName: string; email: string };
  obligationId?: { _id: string; title: string };
  expiryDate?: string;
  status: 'valid' | 'expired' | 'pending_review' | 'superseded';
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface Vendor {
  _id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone?: string;
  assignedOwnerId?: { _id: string; displayName: string; email: string };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  status: 'active' | 'under_review' | 'suspended' | 'offboarded';
  contractStartDate?: string;
  contractExpiryDate?: string;
  reviewDate?: string;
  checklist: Array<{ item: string; completed: boolean; verifiedAt?: string }>;
  reviewNotes?: string;
  lastReviewDecision?: 'approved' | 'conditional' | 'rejected' | 'pending';
}

export interface Risk {
  _id: string;
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'mitigating' | 'accepted' | 'resolved';
  ownerId?: { _id: string; displayName: string; email: string };
  mitigationPlan: string;
  relatedObligationId?: { _id: string; title: string };
  reviewDate?: string;
}

export interface Finding {
  _id: string;
  title: string;
  description: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'action_plan_pending' | 'in_remediation' | 'verified_closed';
  identifiedDate: string;
  ownerId?: { _id: string; displayName: string; email: string };
  rootCause?: string;
  correctiveActions?: CorrectiveAction[];
}

export interface CorrectiveAction {
  _id: string;
  title: string;
  actionPlan: string;
  assignedTo?: { _id: string; displayName: string; email: string };
  targetDate: string;
  status: 'proposed' | 'in_progress' | 'completed' | 'verified';
  verifiedBy?: { _id: string; displayName: string };
  verifiedAt?: string;
}

export interface Policy {
  _id: string;
  title: string;
  code: string;
  category: string;
  version: string;
  status: 'draft' | 'under_review' | 'published' | 'archived';
  ownerId?: { _id: string; displayName: string; email: string };
  content: string;
  effectiveDate?: string;
  reviewDate?: string;
  acknowledgments?: Array<{ userId: string; acknowledgedAt: string }>;
}

export interface EmployeeComplianceRecord {
  _id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  statutoryRequirements: Array<{ name: string; isMet: boolean; verifiedAt?: string; notes?: string }>;
  trainings: Array<{ topic: string; completedDate: string; expiryDate?: string }>;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  healthScore: number;
  obligations: {
    total: number;
    compliant: number;
    non_compliant: number;
    in_progress: number;
    pending_review: number;
    not_started: number;
    needs_attention: number;
    byCategory: Array<{ category: string; count: number }>;
  };
  tasks: {
    overdue: number;
    upcoming: number;
    completed: number;
  };
  evidence: {
    expiring: number;
    missing: number;
  };
  risks: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  capa: {
    openFindings: number;
    pendingCorrectiveActions: number;
  };
  vendors: {
    total: number;
    critical: number;
    underReview: number;
  };
  hr: {
    total: number;
    active: number;
  };
  recentActivity: Array<{
    _id: string;
    action: string;
    resourceType: string;
    actorEmail: string;
    actorRole: string;
    createdAt: string;
  }>;
}
