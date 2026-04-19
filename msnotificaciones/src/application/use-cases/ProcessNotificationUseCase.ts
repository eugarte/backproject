import { Notification } from '@domain/entities/Notification';
import { INotificationRepository } from '@domain/repositories/INotificationRepository';
import { IEmailProvider, ISmsProvider, IPushProvider, IInAppProvider } from '@domain/services/INotificationProviders';
import { NotificationType, DeliveryStatus } from '@domain/enums';
import { IWebSocketService } from '@infrastructure/websocket/IWebSocketService';

export class ProcessNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly emailProvider: IEmailProvider,
    private readonly smsProvider: ISmsProvider,
    private readonly pushProvider: IPushProvider,
    private readonly inAppProvider: IInAppProvider,
    private readonly webSocketService: IWebSocketService,
  ) {}

  async execute(notificationId: string): Promise<boolean> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    notification.markAsSending();
    await this.notificationRepository.update(notification);

    try {
      let delivered = false;

      switch (notification.type) {
        case NotificationType.EMAIL:
          delivered = await this.sendEmail(notification);
          break;
        case NotificationType.SMS:
          delivered = await this.sendSms(notification);
          break;
        case NotificationType.PUSH:
          delivered = await this.sendPush(notification);
          break;
        case NotificationType.IN_APP:
          delivered = await this.sendInApp(notification);
          break;
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      if (delivered) {
        notification.markAsDelivered();
        await this.notificationRepository.update(notification);

        // Emit real-time event via WebSocket
        await this.webSocketService.emitToUser(notification.recipientId, 'notification:delivered', {
          notificationId: notification.id,
          type: notification.type,
          title: notification.title,
        });

        return true;
      } else {
        notification.markAsFailed();
        await this.notificationRepository.update(notification);
        return false;
      }
    } catch (error) {
      notification.markAsFailed();
      await this.notificationRepository.update(notification);
      throw error;
    }
  }

  private async sendEmail(notification: Notification): Promise<boolean> {
    const email = notification.metadata?.email;
    if (!email) {
      throw new Error('Email address not provided in metadata');
    }
    return this.emailProvider.sendEmail(notification, email);
  }

  private async sendSms(notification: Notification): Promise<boolean> {
    const phoneNumber = notification.metadata?.phoneNumber;
    if (!phoneNumber) {
      throw new Error('Phone number not provided in metadata');
    }
    return this.smsProvider.sendSms(notification, phoneNumber);
  }

  private async sendPush(notification: Notification): Promise<boolean> {
    const deviceToken = notification.metadata?.deviceToken;
    if (!deviceToken) {
      throw new Error('Device token not provided in metadata');
    }
    return this.pushProvider.sendPush(notification, deviceToken);
  }

  private async sendInApp(notification: Notification): Promise<boolean> {
    const inAppDelivered = await this.inAppProvider.sendInApp(notification);
    
    // Also emit via WebSocket for real-time updates
    await this.webSocketService.emitToUser(notification.recipientId, 'notification:new', {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      priority: notification.priority,
      createdAt: notification.createdAt,
    });

    return inAppDelivered;
  }
}
