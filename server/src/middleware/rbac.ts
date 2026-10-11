import { Request, Response, NextFunction } from 'express';
import { Permission, ROLE_PERMISSIONS } from '../constants/permissions';
import { ROLES, UserRole } from '../constants/roles';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const role = (req.userRole || req.user.role) as UserRole;

    // Super-admin has all permissions
    if (role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const allowedPermissions = ROLE_PERMISSIONS[role] || [];
    if (!allowedPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: Role '${role}' lacks permission '${permission}'`,
        },
      });
      return;
    }

    next();
  };
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const role = (req.userRole || req.user.role) as UserRole;

    if (role === ROLES.SUPER_ADMIN || allowedRoles.includes(role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Forbidden: Role '${role}' is not authorized for this resource`,
      },
    });
  };
}
