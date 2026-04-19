import { Notification } from '@domain/entities/Notification';
import { INotificationRepository, NotificationFilters } from '@domain/repositories/INotificationRepository';
import { IMessageQueueService } from '@infrastructure/queue/IMessageQueueService';
import { CreateNotificationDto } from '../dtos/NotificationDto';

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly messageQueueService: IMessageQueueService,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<Notification> {
    const notification = new Notification({
      recipientId: dto.recipientId,
      type: dto.type,
      title: dto.title,
      content: dto.content,
      priority: dto.priority,
      metadata: dto.metadata,
      scheduledAt: dto.scheduledAt,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Queue notification for processing
    await this.messageQueueService.enqueueNotification(savedNotification);

    return savedNotification;
  }
}

export class GetNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(filters: NotificationFilters): Promise<Notification[]> {
    return this.notificationRepository.findAll(filters);
  }
}

export class GetNotificationByIdUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(id: string): Promise<Notification | null> {
    return this.notificationRepository.findById(id);
  }
}

export class MarkNotificationAsReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(id: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      return null;
    }

    notification.markAsRead();
    return this.notificationRepository.update(notification);
  }
}

export class MarkAllNotificationsAsReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(recipientId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(recipientId);
  }
}
