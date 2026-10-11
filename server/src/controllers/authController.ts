import { Request, Response } from 'express';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { AuditService } from '../services/auditService';

export class AuthController {
  /**
   * Return verified current user profile, their memberships, and active org
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    // Find memberships
    const memberships = await OrganizationMembership.find({
      userId: user._id,
      status: 'active',
    })
      .populate('organizationId', 'name slug country industry subscriptionTier status')
      .lean();

    let currentOrg = null;
    if (user.currentOrgId) {
      currentOrg = await Organization.findById(user.currentOrgId).lean();
    } else if (memberships.length > 0) {
      currentOrg = memberships[0].organizationId;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          currentOrgId: user.currentOrgId,
        },
        currentOrganization: currentOrg,
        memberships: memberships.map((m) => ({
          organization: m.organizationId,
          role: m.role,
          department: m.department,
        })),
      },
    });
  }

  /**
   * Update profile display name or preferences
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { displayName } = req.body;

    if (displayName && typeof displayName === 'string') {
      user.displayName = displayName.trim();
      await user.save();
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  }

  /**
   * Switch active organization workspace
   */
  static async switchOrganization(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { organizationId } = req.body;

    if (!organizationId) {
      res.status(400).json({ success: false, error: { message: 'Organization ID is required' } });
      return;
    }

    const membership = await OrganizationMembership.findOne({
      userId: user._id,
      organizationId,
      status: 'active',
    });

    if (!membership && user.role !== 'super-admin') {
      res.status(403).json({
        success: false,
        error: { message: 'You are not a member of this organization' },
      });
      return;
    }

    user.currentOrgId = organizationId;
    await user.save();

    await AuditService.log(req, {
      action: 'SWITCH_ORGANIZATION',
      resourceType: 'Organization',
      resourceId: organizationId,
      organizationId,
    });

    res.json({
      success: true,
      message: 'Workspace switched successfully',
      data: { currentOrgId: organizationId },
    });
  }
}
