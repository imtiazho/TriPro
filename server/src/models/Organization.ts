import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  country: string;
  industry: string;
  subscriptionTier: 'starter' | 'growth' | 'enterprise';
  complianceFrameworks: string[];
  settings: {
    notificationPreferences?: {
      emailAlerts?: boolean;
      daysBeforeExpiryWarning?: number;
      overdueTaskReminders?: boolean;
    };
    timezone?: string;
    fiscalYearStart?: string;
  };
  status: 'active' | 'suspended';
  ownerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
      default: 'Bangladesh',
    },
    industry: {
      type: String,
      default: 'Technology / B2B SaaS',
    },
    subscriptionTier: {
      type: String,
      enum: ['starter', 'growth', 'enterprise'],
      default: 'growth',
    },
    complianceFrameworks: {
      type: [String],
      default: [
        'Bangladesh Labour Act 2006',
        'National Cyber Security Act (Bangladesh)',
        'BIDA & Corporate Filings',
        'ISO/IEC 27001',
      ],
    },
    settings: {
      notificationPreferences: {
        emailAlerts: { type: Boolean, default: true },
        daysBeforeExpiryWarning: { type: Number, default: 30 },
        overdueTaskReminders: { type: Boolean, default: true },
      },
      timezone: { type: String, default: 'Asia/Dhaka' },
      fiscalYearStart: { type: String, default: 'July' },
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
