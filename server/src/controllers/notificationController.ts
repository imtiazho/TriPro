import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

export class NotificationController {
  /**
   * Get user's notifications
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { unreadOnly, limit = 50 } = req.query as any;

    const query: any = { recipientId: user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(100, parseInt(limit, 10) || 50))
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: user._id,
      isRead: false,
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, error: { message: 'Notification not found' } });
      return;
    }

    res.json({ success: true, data: notification });
  }

  /**
   * Mark all notifications as read for current user
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    await Notification.updateMany(
      { recipientId: user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  }
}
