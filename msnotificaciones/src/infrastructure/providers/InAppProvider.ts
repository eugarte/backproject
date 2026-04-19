import { Notification } from '@domain/entities/Notification';
import { IInAppProvider } from '@domain/services/INotificationProviders';
import { LoggerService } from '../logging/LoggerService';

export class InAppProvider implements IInAppProvider {
  async sendInApp(notification: Notification): Promise<boolean> {
    // In-app notifications are stored in the database and retrieved via API
    // This provider just confirms the notification is ready for in-app display
    LoggerService.info(`In-app notification ready`, { notificationId: notification.id, recipientId: notification.recipientId });
    return true;
  }
}
