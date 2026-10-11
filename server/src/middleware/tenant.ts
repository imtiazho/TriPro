import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { ROLES } from '../constants/roles';

export async function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Platform Super-admin can optionally switch or view specific organization
    const requestedOrgId = req.headers['x-organization-id'] as string;

    if (user.role === ROLES.SUPER_ADMIN && requestedOrgId && Types.ObjectId.isValid(requestedOrgId)) {
      req.organizationId = new Types.ObjectId(requestedOrgId);
      return next();
    }

    // Target organization ID from user profile or header
    let targetOrgId = user.currentOrgId;

    if (requestedOrgId && Types.ObjectId.isValid(requestedOrgId)) {
      // Validate that the user is actually a member of this requested organization
      const membership = await OrganizationMembership.findOne({
        userId: user._id,
        organizationId: new Types.ObjectId(requestedOrgId),
        status: 'active',
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_FORBIDDEN',
            message: 'You are not an authorized member of the requested organization.',
          },
        });
        return;
      }

      targetOrgId = membership.organizationId;
    }

    if (!targetOrgId) {
      // Try to find any active membership for this user
      const anyMembership = await OrganizationMembership.findOne({
        userId: user._id,
        status: 'active',
      });

      if (anyMembership) {
        targetOrgId = anyMembership.organizationId;
        user.currentOrgId = targetOrgId;
        await user.save();
      }
    }

    if (!targetOrgId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'You do not belong to an active organization workspace. Please accept an invitation or create one.',
        },
      });
      return;
    }

    req.organizationId = new Types.ObjectId(targetOrgId.toString());
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TENANT_RESOLUTION_ERROR',
        message: 'Internal error resolving organization tenant context.',
      },
    });
  }
}
