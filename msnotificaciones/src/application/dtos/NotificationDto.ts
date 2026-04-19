import { Notification } from '@domain/entities/Notification';
import { NotificationType, PriorityLevel } from '@domain/enums';

export interface CreateNotificationDto {
  recipientId: string;
  type: NotificationType;
  title: string;
  content: string;
  priority?: PriorityLevel;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
}

export interface UpdateNotificationDto {
  title?: string;
  content?: string;
  priority?: PriorityLevel;
  status?: string;
  metadata?: Record<string, any>;
}
