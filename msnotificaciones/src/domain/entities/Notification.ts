import { NotificationType, PriorityLevel, DeliveryStatus } from '../enums';

export interface NotificationProps {
  id?: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  content: string;
  priority?: PriorityLevel;
  status?: DeliveryStatus;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  content: string;
  priority: PriorityLevel;
  status: DeliveryStatus;
  metadata: Record<string, any>;
  scheduledAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: NotificationProps) {
    this.id = props.id || this.generateId();
    this.recipientId = props.recipientId;
    this.type = props.type;
    this.title = props.title;
    this.content = props.content;
    this.priority = props.priority || PriorityLevel.MEDIUM;
    this.status = props.status || DeliveryStatus.PENDING;
    this.metadata = props.metadata || {};
    this.scheduledAt = props.scheduledAt;
    this.deliveredAt = props.deliveredAt;
    this.readAt = props.readAt;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  markAsQueued(): void {
    this.status = DeliveryStatus.QUEUED;
    this.updatedAt = new Date();
  }

  markAsSending(): void {
    this.status = DeliveryStatus.SENDING;
    this.updatedAt = new Date();
  }

  markAsDelivered(): void {
    this.status = DeliveryStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.updatedAt = new Date();
  }

  markAsFailed(): void {
    this.status = DeliveryStatus.FAILED;
    this.updatedAt = new Date();
  }

  markAsRetrying(): void {
    this.status = DeliveryStatus.RETRYING;
    this.updatedAt = new Date();
  }

  markAsRead(): void {
    this.readAt = new Date();
    this.updatedAt = new Date();
  }

  isDelivered(): boolean {
    return this.status === DeliveryStatus.DELIVERED;
  }

  isPending(): boolean {
    return this.status === DeliveryStatus.PENDING;
  }

  isHighPriority(): boolean {
    return this.priority === PriorityLevel.HIGH || this.priority === PriorityLevel.CRITICAL;
  }
}
