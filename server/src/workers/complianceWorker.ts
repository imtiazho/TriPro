import { Worker } from 'bullmq';
import { redisClient } from '../queues/complianceQueue';
import { ComplianceTask } from '../models/ComplianceTask';
import { EvidenceDocument } from '../models/EvidenceDocument';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

let worker: Worker | null = null;
let localSchedulerTimer: NodeJS.Timeout | null = null;

export async function processExpiryAndOverdueChecks(): Promise<void> {
  logger.info('Running compliance expiry and overdue task checks...');
  try {
    const now = new Date();
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Check overdue tasks
    const overdueTasks = await ComplianceTask.find({
      dueDate: { $lt: now },
      status: { $in: ['todo', 'in_progress', 'under_review'] },
    }).limit(100);

    for (const task of overdueTasks) {
      if (task.assignedTo) {
        await NotificationService.send({
          organizationId: task.organizationId,
          recipientId: task.assignedTo,
          title: 'Overdue Compliance Task Alert',
          message: `Task "${task.title}" is overdue (was due on ${task.dueDate.toLocaleDateString()}). Please take action.`,
          type: 'overdue',
          link: '/tasks',
        });
      }
    }

    // 2. Check expiring documents
    const expiringDocs = await EvidenceDocument.find({
      expiryDate: { $gte: now, $lte: thirtyDaysAhead },
      status: 'valid',
    }).limit(100);

    for (const doc of expiringDocs) {
      if (doc.uploadedBy) {
        await NotificationService.send({
          organizationId: doc.organizationId,
          recipientId: doc.uploadedBy,
          title: 'Evidence Document Expiry Warning',
          message: `Document "${doc.fileName}" will expire on ${doc.expiryDate?.toLocaleDateString()}. Please prepare renewed documentation.`,
          type: 'expiry',
          link: '/evidence',
        });
      }
    }

    logger.info(
      { overdueCount: overdueTasks.length, expiringDocCount: expiringDocs.length },
      'Completed compliance health background scan'
    );
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Error during compliance check run');
  }
}

export function startComplianceWorker(): void {
  if (redisClient && redisClient.status === 'ready') {
    worker = new Worker(
      'compliance-jobs',
      async (job) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing BullMQ job');
        if (job.name === 'check-expiries-and-deadlines') {
          await processExpiryAndOverdueChecks();
        }
      },
      {
        connection: redisClient as any,
        concurrency: 5,
      }
    );

    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, error: err.message }, 'BullMQ job failed');
    });

    logger.info('BullMQ compliance worker started');
  } else {
    // Development local scheduler: run periodic background scan every 30 minutes
    logger.info('Starting local in-memory periodic scanner for compliance deadlines (30 min interval)');
    localSchedulerTimer = setInterval(processExpiryAndOverdueChecks, 30 * 60 * 1000);
  }
}

export async function stopComplianceWorker(): Promise<void> {
  if (localSchedulerTimer) {
    clearInterval(localSchedulerTimer);
    localSchedulerTimer = null;
  }
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('BullMQ worker closed');
  }
}
