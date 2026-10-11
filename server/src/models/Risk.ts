import mongoose, { Document, Schema, Types } from 'mongoose';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'open' | 'mitigating' | 'accepted' | 'resolved';

export interface IRisk extends Document {
  organizationId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  likelihood: number; // 1 to 5
  impact: number; // 1 to 5
  riskScore: number; // 1 to 25
  riskLevel: RiskLevel;
  status: RiskStatus;
  ownerId?: Types.ObjectId;
  mitigationPlan: string;
  relatedObligationId?: Types.ObjectId;
  relatedVendorId?: Types.ObjectId;
  reviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RiskSchema = new Schema<IRisk>(
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
    category: {
      type: String,
      required: true,
      enum: [
        'Regulatory',
        'Operational',
        'Security & Privacy',
        'Financial',
        'Vendor / Third-Party',
      ],
      default: 'Regulatory',
    },
    likelihood: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3,
    },
    impact: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3,
    },
    riskScore: {
      type: Number,
      required: true,
      default: 9,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'mitigating', 'accepted', 'resolved'],
      default: 'open',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    mitigationPlan: {
      type: String,
      default: '',
    },
    relatedObligationId: {
      type: Schema.Types.ObjectId,
      ref: 'ComplianceObligation',
      index: true,
    },
    relatedVendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
    },
    reviewDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate riskScore and riskLevel before saving
RiskSchema.pre('save', function (next) {
  this.riskScore = this.likelihood * this.impact;
  if (this.riskScore >= 20) {
    this.riskLevel = 'critical';
  } else if (this.riskScore >= 12) {
    this.riskLevel = 'high';
  } else if (this.riskScore >= 6) {
    this.riskLevel = 'medium';
  } else {
    this.riskLevel = 'low';
  }
  next();
});

RiskSchema.index({ organizationId: 1, riskLevel: 1, status: 1 });
RiskSchema.index({ organizationId: 1, status: 1 });
RiskSchema.index({ organizationId: 1, category: 1 });

export const Risk = mongoose.model<IRisk>('Risk', RiskSchema);
