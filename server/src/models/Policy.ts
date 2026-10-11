import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPolicy extends Document {
  organizationId: Types.ObjectId;
  title: string;
  code: string;
  category: string;
  version: string;
  status: 'draft' | 'under_review' | 'published' | 'archived';
  ownerId: Types.ObjectId;
  content: string;
  attachmentId?: Types.ObjectId;
  reviewDate?: Date;
  effectiveDate?: Date;
  acknowledgments: Array<{
    userId: Types.ObjectId;
    acknowledgedAt: Date;
    ipAddress?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General Governance',
    },
    version: {
      type: String,
      default: '1.0',
    },
    status: {
      type: String,
      enum: ['draft', 'under_review', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    attachmentId: {
      type: Schema.Types.ObjectId,
      ref: 'EvidenceDocument',
    },
    reviewDate: {
      type: Date,
      index: true,
    },
    effectiveDate: {
      type: Date,
    },
    acknowledgments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        acknowledgedAt: { type: Date, default: Date.now },
        ipAddress: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

PolicySchema.index({ organizationId: 1, status: 1 });
PolicySchema.index({ organizationId: 1, reviewDate: 1 });
PolicySchema.index({ organizationId: 1, code: 1 });

export const Policy = mongoose.model<IPolicy>('Policy', PolicySchema);
