import { Notification } from '../entities/Notification';
import { DeliveryStatus, NotificationType } from '../enums';

export interface NotificationFilters {
  recipientId?: string;
  type?: NotificationType;
  status?: DeliveryStatus;
  fromDate?: Date;
  toDate?: Date;
  unreadOnly?: boolean;
}

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findAll(filters?: NotificationFilters): Promise<Notification[]>;
  save(notification: Notification): Promise<Notification>;
  update(notification: Notification): Promise<Notification>;
  delete(id: string): Promise<boolean>;
  markAllAsRead(recipientId: string): Promise<number>;
  countUnread(recipientId: string): Promise<number>;
}
