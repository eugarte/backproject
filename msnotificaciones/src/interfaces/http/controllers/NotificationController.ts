import { Request, Response } from 'express';
import { CreateNotificationUseCase, GetNotificationsUseCase, GetNotificationByIdUseCase, MarkNotificationAsReadUseCase, MarkAllNotificationsAsReadUseCase } from '@application/use-cases/NotificationUseCases';
import { CreateNotificationDto } from '@application/dtos/NotificationDto';
import { DeliveryStatus, NotificationType, PriorityLevel } from '@domain/enums';

export class NotificationController {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly getNotificationByIdUseCase: GetNotificationByIdUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllNotificationsAsReadUseCase: MarkAllNotificationsAsReadUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateNotificationDto = req.body;
      const notification = await this.createNotificationUseCase.execute(dto);
      res.status(201).json({
        id: notification.id,
        recipientId: notification.recipientId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        priority: notification.priority,
        status: notification.status,
        createdAt: notification.createdAt,
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        recipientId: req.query.recipientId as string,
        type: req.query.type as NotificationType,
        status: req.query.status as DeliveryStatus,
        unreadOnly: req.query.unread === 'true',
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const notifications = await this.getNotificationsUseCase.execute(filters);
      res.json({
        data: notifications.map(n => ({
          id: n.id,
          recipientId: n.recipientId,
          type: n.type,
          title: n.title,
          content: n.content,
          priority: n.priority,
          status: n.status,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
        count: notifications.length,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await this.getNotificationByIdUseCase.execute(id);
      
      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({
        id: notification.id,
        recipientId: notification.recipientId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        priority: notification.priority,
        status: notification.status,
        metadata: notification.metadata,
        deliveredAt: notification.deliveredAt,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await this.markNotificationAsReadUseCase.execute(id);
      
      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({
        id: notification.id,
        status: notification.status,
        readAt: notification.readAt,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId } = req.body;
      if (!recipientId) {
        res.status(400).json({ error: 'recipientId is required' });
        return;
      }

      const count = await this.markAllNotificationsAsReadUseCase.execute(recipientId);
      res.json({ markedAsRead: count });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
