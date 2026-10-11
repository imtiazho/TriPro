import mongoose, { Document, Schema, Types } from 'mongoose';

export type VendorRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type VendorStatus = 'active' | 'under_review' | 'suspended' | 'offboarded';

export interface IVendor extends Document {
  organizationId: Types.ObjectId;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone?: string;
  assignedOwnerId?: Types.ObjectId;
  riskLevel: VendorRiskLevel;
  riskScore: number;
  status: VendorStatus;
  contractStartDate?: Date;
  contractExpiryDate?: Date;
  reviewDate?: Date;
  checklist: Array<{
    item: string;
    completed: boolean;
    verifiedAt?: Date;
  }>;
  reviewNotes?: string;
  lastReviewDecision?: 'approved' | 'conditional' | 'rejected' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Cloud Provider',
        'SaaS Software',
        'Professional Services',
        'Hardware / IT',
        'Legal & Financial',
        'Other',
      ],
      default: 'SaaS Software',
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    assignedOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 50, // 0-100 decision support score
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'under_review', 'suspended', 'offboarded'],
      default: 'active',
      index: true,
    },
    contractStartDate: {
      type: Date,
    },
    contractExpiryDate: {
      type: Date,
      index: true,
    },
    reviewDate: {
      type: Date,
    },
    checklist: [
      {
        item: { type: String, required: true },
        completed: { type: Boolean, default: false },
        verifiedAt: { type: Date },
      },
    ],
    reviewNotes: {
      type: String,
      default: '',
    },
    lastReviewDecision: {
      type: String,
      enum: ['approved', 'conditional', 'rejected', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

VendorSchema.index({ organizationId: 1, status: 1, contractExpiryDate: 1 });
VendorSchema.index({ organizationId: 1, riskLevel: 1, status: 1 });
VendorSchema.index({ organizationId: 1, name: 1 });

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
