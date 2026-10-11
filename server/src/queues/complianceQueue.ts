import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let redisClient: IORedis | null = null;
let complianceQueue: Queue | null = null;

if (env.REDIS_URL) {
  try {
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    redisClient.connect().then(() => {
      logger.info('Connected to Redis for BullMQ background queues');
    }).catch((err) => {
      logger.warn({ error: err.message }, 'Redis connection failed. Background jobs will run on lightweight in-memory scheduler.');
      redisClient = null;
    });

    complianceQueue = new Queue('compliance-jobs', {
      connection: redisClient as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  } catch (err) {
    logger.warn('Redis queue initialization skipped (no Redis available). Running in local mode.');
  }
} else {
  logger.info('REDIS_URL not configured. Background jobs will use lightweight periodic cron scheduler.');
}

export { complianceQueue, redisClient };

/**
 * Dispatch background job or execute immediate fallback
 */
export async function dispatchBackgroundJob(
  jobName: string,
  data: Record<string, any>,
  fallbackHandler?: () => Promise<void>
): Promise<void> {
  if (complianceQueue && redisClient?.status === 'ready') {
    try {
      await complianceQueue.add(jobName, data, {
        jobId: `${jobName}:${data.id || Date.now()}`,
      });
      logger.info({ jobName, dataId: data.id }, 'BullMQ job enqueued');
      return;
    } catch (err) {
      logger.warn({ err }, 'Failed to enqueue BullMQ job, running fallback');
    }
  }

  // Graceful local execution fallback
  if (fallbackHandler) {
    setImmediate(async () => {
      try {
        await fallbackHandler();
      } catch (error) {
        logger.error({ jobName, error: (error as Error).message }, 'Fallback background job execution failed');
      }
    });
  }
}
