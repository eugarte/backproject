import { Notification } from '@domain/entities/Notification';

export interface IMessageQueueService {
  enqueueNotification(notification: Notification): Promise<void>;
  setupNotificationProcessor(processor: (notificationId: string) => Promise<void>): void;
  close(): Promise<void>;
}
