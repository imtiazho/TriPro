import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'deadline'
  | 'overdue'
  | 'expiry'
  | 'assignment'
  | 'status_change'
  | 'audit'
  | 'system';

export interface INotification extends Document {
  organizationId: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['deadline', 'overdue', 'expiry', 'assignment', 'status_change', 'audit', 'system'],
      default: 'system',
      index: true,
    },
    link: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ organizationId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
