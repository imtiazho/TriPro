import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { logger } from '../utils/logger';

export interface CreateNotificationParams {
  organizationId: string | Types.ObjectId;
  recipientId: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export class NotificationService {
  static async send(params: CreateNotificationParams): Promise<void> {
    try {
      await Notification.create({
        organizationId: new Types.ObjectId(params.organizationId.toString()),
        recipientId: new Types.ObjectId(params.recipientId.toString()),
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
        isRead: false,
      });
      logger.info({ recipientId: params.recipientId, title: params.title }, 'Notification created');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to create notification');
    }
  }

  static async sendBulk(notifications: CreateNotificationParams[]): Promise<void> {
    try {
      if (notifications.length === 0) return;
      const docs = notifications.map((n) => ({
        organizationId: new Types.ObjectId(n.organizationId.toString()),
        recipientId: new Types.ObjectId(n.recipientId.toString()),
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: false,
      }));
      await Notification.insertMany(docs);
      logger.info({ count: docs.length }, 'Bulk notifications created');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to insert bulk notifications');
    }
  }
}
