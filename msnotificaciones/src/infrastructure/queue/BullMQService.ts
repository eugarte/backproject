import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { Notification } from '@domain/entities/Notification';
import { IMessageQueueService } from './IMessageQueueService';
import { LoggerService } from '../logging/LoggerService';

export class BullMQService implements IMessageQueueService {
  private connection: IORedis;
  private notificationQueue: Queue;
  private worker: Worker | null = null;

  constructor() {
    this.connection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

    this.notificationQueue = new Queue('notifications', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    LoggerService.info('BullMQ initialized');
  }

  async enqueueNotification(notification: Notification): Promise<void> {
    await this.notificationQueue.add(
      'send-notification',
      { notificationId: notification.id },
      {
        priority: notification.isHighPriority() ? 1 : 10,
        delay: notification.scheduledAt
          ? Math.max(0, notification.scheduledAt.getTime() - Date.now())
          : 0,
      }
    );
    LoggerService.info(`Notification ${notification.id} enqueued`, { notificationId: notification.id });
  }

  setupNotificationProcessor(processor: (notificationId: string) => Promise<void>): void {
    this.worker = new Worker(
      'notifications',
      async (job: Job<{ notificationId: string }>) => {
        const { notificationId } = job.data;
        LoggerService.info(`Processing notification ${notificationId}`, { jobId: job.id, notificationId });
        await processor(notificationId);
      },
      {
        connection: this.connection,
        concurrency: 5,
      }
    );

    this.worker.on('completed', (job) => {
      LoggerService.info(`Job ${job.id} completed`, { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      LoggerService.error(`Job ${job?.id} failed`, err instanceof Error ? err : new Error(String(err)));
    });

    LoggerService.info('BullMQ worker started');
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    await this.notificationQueue.close();
    await this.connection.quit();
    LoggerService.info('BullMQ closed');
  }
}
