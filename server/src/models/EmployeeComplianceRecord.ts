import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmployeeComplianceRecord extends Document {
  organizationId: Types.ObjectId;
  userId?: Types.ObjectId;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: Date;
  status: 'active' | 'on_leave' | 'terminated';
  statutoryRequirements: Array<{
    name: string;
    isMet: boolean;
    verifiedAt?: Date;
    notes?: string;
  }>;
  trainings: Array<{
    topic: string;
    completedDate: Date;
    expiryDate?: Date;
    certificateDocId?: Types.ObjectId;
  }>;
  documents: Array<{
    docType: string;
    fileName: string;
    documentId?: Types.ObjectId;
    expiryDate?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeComplianceRecordSchema = new Schema<IEmployeeComplianceRecord>(
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
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
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
    department: {
      type: String,
      required: true,
      default: 'General',
    },
    designation: {
      type: String,
      required: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'terminated'],
      default: 'active',
      index: true,
    },
    statutoryRequirements: [
      {
        name: { type: String, required: true },
        isMet: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        notes: { type: String },
      },
    ],
    trainings: [
      {
        topic: { type: String, required: true },
        completedDate: { type: Date, required: true },
        expiryDate: { type: Date },
        certificateDocId: { type: Schema.Types.ObjectId, ref: 'EvidenceDocument' },
      },
    ],
    documents: [
      {
        docType: { type: String, required: true },
        fileName: { type: String, required: true },
        documentId: { type: Schema.Types.ObjectId, ref: 'EvidenceDocument' },
        expiryDate: { type: Date },
      },
    ],
  },
  {
    timestamps: true,
  }
);

EmployeeComplianceRecordSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
EmployeeComplianceRecordSchema.index({ organizationId: 1, department: 1 });
EmployeeComplianceRecordSchema.index({ organizationId: 1, status: 1 });

export const EmployeeComplianceRecord = mongoose.model<IEmployeeComplianceRecord>(
  'EmployeeComplianceRecord',
  EmployeeComplianceRecordSchema
);
