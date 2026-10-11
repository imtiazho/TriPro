import { ROLE_PERMISSIONS, PERMISSIONS } from '../constants/permissions';
import { ROLES } from '../constants/roles';

describe('RBAC & Permission System Integrity', () => {
  test('Super-admin possesses all platform permissions', () => {
    const superAdminPerms = ROLE_PERMISSIONS[ROLES.SUPER_ADMIN];
    expect(superAdminPerms).toContain(PERMISSIONS.PLATFORM_ADMIN);
    expect(superAdminPerms).toContain(PERMISSIONS.PLATFORM_ORGS_MANAGE);
    expect(superAdminPerms).toContain(PERMISSIONS.ORG_SETTINGS_MANAGE);
  });

  test('Auditor role is strictly read-only and cannot mutate compliance records', () => {
    const auditorPerms = ROLE_PERMISSIONS[ROLES.AUDITOR];
    expect(auditorPerms).toContain(PERMISSIONS.COMPLIANCE_VIEW);
    expect(auditorPerms).toContain(PERMISSIONS.EVIDENCE_VIEW);
    expect(auditorPerms).toContain(PERMISSIONS.REPORT_VIEW);

    // Auditor must NOT have creation/mutation/deletion permissions
    expect(auditorPerms).not.toContain(PERMISSIONS.COMPLIANCE_CREATE);
    expect(auditorPerms).not.toContain(PERMISSIONS.COMPLIANCE_UPDATE);
    expect(auditorPerms).not.toContain(PERMISSIONS.COMPLIANCE_DELETE);
    expect(auditorPerms).not.toContain(PERMISSIONS.TASK_CREATE);
    expect(auditorPerms).not.toContain(PERMISSIONS.ORG_SETTINGS_MANAGE);
  });

  test('Employee role has least-privilege boundary', () => {
    const employeePerms = ROLE_PERMISSIONS[ROLES.EMPLOYEE];
    expect(employeePerms).toContain(PERMISSIONS.TASK_VIEW_ASSIGNED);
    expect(employeePerms).toContain(PERMISSIONS.POLICY_ACKNOWLEDGE);

    // Employee must NOT manage org or delete compliance
    expect(employeePerms).not.toContain(PERMISSIONS.COMPLIANCE_CREATE);
    expect(employeePerms).not.toContain(PERMISSIONS.COMPLIANCE_DELETE);
    expect(employeePerms).not.toContain(PERMISSIONS.ORG_MEMBERS_MANAGE);
    expect(employeePerms).not.toContain(PERMISSIONS.PLATFORM_ADMIN);
  });

  test('Compliance Manager can manage obligations and evidence but not platform orgs', () => {
    const compPerms = ROLE_PERMISSIONS[ROLES.COMPLIANCE_MANAGER];
    expect(compPerms).toContain(PERMISSIONS.COMPLIANCE_CREATE);
    expect(compPerms).toContain(PERMISSIONS.COMPLIANCE_UPDATE);
    expect(compPerms).toContain(PERMISSIONS.COMPLIANCE_VERIFY);
    expect(compPerms).toContain(PERMISSIONS.EVIDENCE_UPLOAD);

    expect(compPerms).not.toContain(PERMISSIONS.PLATFORM_ADMIN);
    expect(compPerms).not.toContain(PERMISSIONS.PLATFORM_ORGS_MANAGE);
  });
});
