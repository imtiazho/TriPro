import mongoose, { Document, Schema, Types } from 'mongoose';
import { VALID_ROLES } from '../constants/roles';

export interface IInvitation extends Document {
  organizationId: Types.ObjectId;
  email: string;
  role: string;
  token: string;
  department?: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

InvitationSchema.index({ organizationId: 1, email: 1 });

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
