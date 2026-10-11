import { Request, Response } from 'express';
import { Organization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { User } from '../models/User';
import { Invitation } from '../models/Invitation';
import { AuditService } from '../services/auditService';
import { CacheService, CacheKeys } from '../cache/nodeCache';
import { ROLES } from '../constants/roles';
import { v4 as uuidv4 } from 'uuid';

export class OrganizationController {
  /**
   * Get current organization profile and compliance frameworks
   */
  static async getOrganization(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!.toString();

    const org = await CacheService.getOrSet(CacheKeys.orgSettings(orgId), async () => {
      return Organization.findById(orgId).lean();
    });

    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    res.json({ success: true, data: org });
  }

  /**
   * Update organization settings (admin only)
   */
  static async updateOrganization(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { name, country, industry, complianceFrameworks, settings } = req.body;

    const existing = await Organization.findById(orgId);
    if (!existing) {
      res.status(404).json({ success: false, error: { message: 'Organization not found' } });
      return;
    }

    const before = existing.toObject();

    if (name) existing.name = name.trim();
    if (country) existing.country = country;
    if (industry) existing.industry = industry;
    if (complianceFrameworks) existing.complianceFrameworks = complianceFrameworks;
    if (settings) existing.settings = { ...existing.settings, ...settings };

    await existing.save();

    // Invalidate tenant cache
    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'ORGANIZATION_UPDATED',
      resourceType: 'Organization',
      resourceId: orgId.toString(),
      changes: { before, after: existing.toObject() },
    });

    res.json({ success: true, data: existing });
  }

  /**
   * Get organization member directory
   */
  static async getMembers(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;

    const memberships = await OrganizationMembership.find({ organizationId: orgId })
      .populate('userId', 'displayName email role status lastLoginAt')
      .lean();

    const invitations = await Invitation.find({
      organizationId: orgId,
      status: 'pending',
    }).lean();

    res.json({
      success: true,
      data: {
        members: memberships.map((m: any) => ({
          membershipId: m._id,
          user: m.userId,
          role: m.role,
          department: m.department,
          status: m.status,
          joinedAt: m.createdAt,
        })),
        pendingInvitations: invitations,
      },
    });
  }

  /**
   * Invite member or assign role
   */
  static async inviteMember(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { email, role, department } = req.body;

    if (!email || !role) {
      res.status(400).json({ success: false, error: { message: 'Email and role are required' } });
      return;
    }

    if (role === ROLES.SUPER_ADMIN) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Super-admin role cannot be assigned through public or tenant organization APIs.' },
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Check if already member
      const existingMembership = await OrganizationMembership.findOne({
        organizationId: orgId,
        userId: user._id,
      });

      if (existingMembership) {
        res.status(409).json({
          success: false,
          error: { message: 'User is already a member of this organization.' },
        });
        return;
      }

      // Add to organization with specified role
      await OrganizationMembership.create({
        organizationId: orgId,
        userId: user._id,
        role,
        department,
        status: 'active',
      });

      if (!user.currentOrgId) {
        user.currentOrgId = orgId;
        user.role = role;
        await user.save();
      }
    } else {
      // Create pending invitation token
      await Invitation.create({
        organizationId: orgId,
        email: normalizedEmail,
        role,
        department,
        token: uuidv4(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
        invitedBy: req.user!._id,
      });
    }

    await AuditService.log(req, {
      action: 'MEMBER_INVITED',
      resourceType: 'User',
      resourceId: normalizedEmail,
      changes: { after: { email: normalizedEmail, role, department } },
    });

    res.status(201).json({
      success: true,
      message: `Invitation successfully processed for ${normalizedEmail}`,
    });
  }

  /**
   * Update member role in organization
   */
  static async updateMemberRole(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { membershipId } = req.params;
    const { role, department, status } = req.body;

    const membership = await OrganizationMembership.findOne({
      _id: membershipId,
      organizationId: orgId,
    });

    if (!membership) {
      res.status(404).json({ success: false, error: { message: 'Membership not found' } });
      return;
    }

    if (role === ROLES.SUPER_ADMIN) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Cannot elevate users to super-admin through member management APIs. Use CLI bootstrap.' },
      });
      return;
    }

    const before = membership.toObject();

    if (role) membership.role = role;
    if (department !== undefined) membership.department = department;
    if (status) membership.status = status;

    await membership.save();

    // Also update User record role if this is their current org
    const user = await User.findById(membership.userId);
    if (user && user.currentOrgId?.toString() === orgId.toString()) {
      if (role) user.role = role;
      await user.save();
    }

    await AuditService.log(req, {
      action: 'MEMBER_ROLE_UPDATED',
      resourceType: 'OrganizationMembership',
      resourceId: membershipId,
      changes: { before, after: membership.toObject() },
    });

    res.json({ success: true, data: membership });
  }
}
