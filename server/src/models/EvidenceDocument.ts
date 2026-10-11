import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEvidenceDocument extends Document {
  organizationId: Types.ObjectId;
  obligationId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  storageProvider: 'local' | 's3' | 'gcs';
  uploadedBy: Types.ObjectId;
  expiryDate?: Date;
  status: 'valid' | 'expired' | 'pending_review' | 'superseded';
  version: number;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceDocumentSchema = new Schema<IEvidenceDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    obligationId: {
      type: Schema.Types.ObjectId,
      ref: 'ComplianceObligation',
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'ComplianceTask',
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeComplianceRecord',
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'gcs'],
      default: 'local',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['valid', 'expired', 'pending_review', 'superseded'],
      default: 'valid',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

EvidenceDocumentSchema.index({ organizationId: 1, expiryDate: 1 });
EvidenceDocumentSchema.index({ organizationId: 1, status: 1 });
EvidenceDocumentSchema.index({ organizationId: 1, obligationId: 1 });

export const EvidenceDocument = mongoose.model<IEvidenceDocument>(
  'EvidenceDocument',
  EvidenceDocumentSchema
);
