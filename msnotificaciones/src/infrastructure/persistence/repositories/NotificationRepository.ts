import { Notification } from '@domain/entities/Notification';
import { INotificationRepository, NotificationFilters } from '@domain/repositories/INotificationRepository';
import { NotificationEntity } from '../entities/NotificationEntity';
import { AppDataSource } from '../config/data-source';
import { Repository, Between, LessThan, IsNull, Not } from 'typeorm';
import { DeliveryStatus, NotificationType } from '@domain/enums';

export class NotificationRepository implements INotificationRepository {
  private repository: Repository<NotificationEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(NotificationEntity);
  }

  private toDomain(entity: NotificationEntity): Notification {
    return new Notification({
      id: entity.id,
      recipientId: entity.recipientId,
      type: entity.type as NotificationType,
      title: entity.title,
      content: entity.content,
      priority: entity.priority as any,
      status: entity.status as DeliveryStatus,
      metadata: entity.metadata,
      scheduledAt: entity.scheduledAt,
      deliveredAt: entity.deliveredAt,
      readAt: entity.readAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(domain: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = domain.id;
    entity.recipientId = domain.recipientId;
    entity.type = domain.type;
    entity.title = domain.title;
    entity.content = domain.content;
    entity.priority = domain.priority;
    entity.status = domain.status;
    entity.metadata = domain.metadata;
    entity.scheduledAt = domain.scheduledAt ?? undefined;
    entity.deliveredAt = domain.deliveredAt ?? undefined;
    entity.readAt = domain.readAt ?? undefined;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(filters?: NotificationFilters): Promise<Notification[]> {
    const where: any = {};

    if (filters?.recipientId) {
      where.recipientId = filters.recipientId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.fromDate && filters?.toDate) {
      where.createdAt = Between(filters.fromDate, filters.toDate);
    }
    if (filters?.unreadOnly) {
      where.readAt = IsNull();
    }

    const entities = await this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map(e => this.toDomain(e));
  }

  async save(notification: Notification): Promise<Notification> {
    const entity = this.toEntity(notification);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(notification: Notification): Promise<Notification> {
    const entity = this.toEntity(notification);
    const updated = await this.repository.save(entity);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await this.repository.update(
      { recipientId, readAt: IsNull() },
      { readAt: new Date(), updatedAt: new Date() }
    );
    return result.affected || 0;
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.repository.count({
      where: { recipientId, readAt: IsNull() },
    });
  }
}
