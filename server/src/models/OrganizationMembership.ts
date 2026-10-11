import mongoose, { Document, Schema, Types } from 'mongoose';
import { DEFAULT_ROLE, UserRole, VALID_ROLES } from '../constants/roles';

export interface IOrganizationMembership extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: UserRole;
  department?: string;
  status: 'active' | 'invited' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMembershipSchema = new Schema<IOrganizationMembership>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      default: DEFAULT_ROLE,
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'disabled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a user only has one membership per organization
OrganizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
OrganizationMembershipSchema.index({ organizationId: 1, role: 1 });
OrganizationMembershipSchema.index({ userId: 1, status: 1 });

export const OrganizationMembership = mongoose.model<IOrganizationMembership>(
  'OrganizationMembership',
  OrganizationMembershipSchema
);
