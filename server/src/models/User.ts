import mongoose, { Document, Schema, Types } from 'mongoose';
import { DEFAULT_ROLE, UserRole, VALID_ROLES } from '../constants/roles';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  currentOrgId?: Types.ObjectId;
  status: 'active' | 'suspended' | 'pending';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      default: DEFAULT_ROLE,
      index: true,
    },
    currentOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index
UserSchema.index({ role: 1, status: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
