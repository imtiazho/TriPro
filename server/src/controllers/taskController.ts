import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ComplianceTask } from '../models/ComplianceTask';
import { ComplianceObligation } from '../models/ComplianceObligation';
import { NotificationService } from '../services/notificationService';
import { AuditService } from '../services/auditService';
import { CacheService } from '../cache/nodeCache';

export class TaskController {
  /**
   * List tasks with filters (status, priority, assignedTo, overdue)
   */
  static async getTasks(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { status, priority, assignedTo, isOverdue, page = 1, limit = 20 } = req.query as any;

    const query: any = { organizationId: orgId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = new Types.ObjectId(assignedTo);

    if (isOverdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $in: ['todo', 'in_progress', 'under_review'] };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      ComplianceTask.find(query)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('assignedTo', 'displayName email')
        .populate('obligationId', 'title category framework')
        .lean(),
      ComplianceTask.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * Create compliance task
   */
  static async createTask(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const { obligationId, title, description, assignedTo, priority, dueDate, recurrence } = req.body;

    const task = await ComplianceTask.create({
      organizationId: orgId,
      obligationId: obligationId ? new Types.ObjectId(obligationId) : undefined,
      title: title.trim(),
      description: description || '',
      assignedTo: assignedTo ? new Types.ObjectId(assignedTo) : undefined,
      priority: priority || 'medium',
      status: 'todo',
      dueDate: new Date(dueDate),
      recurrence: recurrence || 'none',
      activityHistory: [
        {
          actorId: user._id,
          action: 'TASK_CREATED',
          comment: 'Task created',
          createdAt: new Date(),
        },
      ],
    });

    // If linked to obligation, add to linkedTaskIds
    if (obligationId) {
      await ComplianceObligation.findByIdAndUpdate(obligationId, {
        $addToSet: { linkedTaskIds: task._id },
      });
    }

    // Send assignment notification if assigned
    if (assignedTo && assignedTo.toString() !== user._id.toString()) {
      await NotificationService.send({
        organizationId: orgId,
        recipientId: assignedTo,
        title: 'New Compliance Task Assigned',
        message: `You were assigned the task: "${title}". Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'assignment',
        link: '/tasks',
      });
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'TASK_CREATED',
      resourceType: 'ComplianceTask',
      resourceId: task._id.toString(),
      changes: { after: task.toObject() },
    });

    res.status(201).json({ success: true, data: task });
  }

  /**
   * Update task status or details
   */
  static async updateTask(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const user = req.user!;
    const { id } = req.params;
    const { status, title, description, assignedTo, priority, dueDate, comment } = req.body;

    const task = await ComplianceTask.findOne({ _id: id, organizationId: orgId });
    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }

    const before = task.toObject();

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo ? new Types.ObjectId(assignedTo) : undefined;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);

    if (status && status !== task.status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
        task.completedBy = user._id;
      }
      task.activityHistory.push({
        actorId: user._id,
        action: `STATUS_CHANGED_TO_${status.toUpperCase()}`,
        comment: comment || `Status updated to ${status}`,
        createdAt: new Date(),
      });
    } else if (comment) {
      task.activityHistory.push({
        actorId: user._id,
        action: 'COMMENT_ADDED',
        comment,
        createdAt: new Date(),
      });
    }

    await task.save();

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'TASK_UPDATED',
      resourceType: 'ComplianceTask',
      resourceId: task._id.toString(),
      changes: { before, after: task.toObject() },
    });

    res.json({ success: true, data: task });
  }

  /**
   * Delete task
   */
  static async deleteTask(req: Request, res: Response): Promise<void> {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const task = await ComplianceTask.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }

    CacheService.invalidateTenant(orgId.toString());

    await AuditService.log(req, {
      action: 'TASK_DELETED',
      resourceType: 'ComplianceTask',
      resourceId: id,
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  }
}
