import mongoose, { Document, Schema, Types } from 'mongoose';

export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FindingStatus = 'open' | 'action_plan_pending' | 'in_remediation' | 'verified_closed';

export interface IFinding extends Document {
  organizationId: Types.ObjectId;
  title: string;
  description: string;
  source: string;
  severity: FindingSeverity;
  status: FindingStatus;
  identifiedDate: Date;
  ownerId?: Types.ObjectId;
  rootCause?: string;
  linkedObligationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FindingSchema = new Schema<IFinding>(
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
    description: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: [
        'Compliance Audit',
        'Risk Review',
        'Vendor Assessment',
        'Internal Inspection',
        'External Regulator',
      ],
      default: 'Compliance Audit',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'action_plan_pending', 'in_remediation', 'verified_closed'],
      default: 'open',
      index: true,
    },
    identifiedDate: {
      type: Date,
      default: Date.now,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    rootCause: {
      type: String,
      default: '',
    },
    linkedObligationId: {
      type: Schema.Types.ObjectId,
      ref: 'ComplianceObligation',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FindingSchema.index({ organizationId: 1, severity: 1, status: 1 });
FindingSchema.index({ organizationId: 1, status: 1 });

export const Finding = mongoose.model<IFinding>('Finding', FindingSchema);
