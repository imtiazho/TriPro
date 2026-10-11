export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ORGANIZATION_ADMIN: 'organization-admin',
  COMPLIANCE_MANAGER: 'compliance-manager',
  HR_MANAGER: 'hr-manager',
  VENDOR_MANAGER: 'vendor-manager',
  EMPLOYEE: 'employee',
  AUDITOR: 'auditor',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const VALID_ROLES: UserRole[] = Object.values(ROLES);

export const DEFAULT_ROLE: UserRole = ROLES.EMPLOYEE;
