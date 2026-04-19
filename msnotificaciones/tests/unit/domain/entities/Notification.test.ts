import { Notification } from '../../../../src/domain/entities/Notification';
import { DeliveryStatus, PriorityLevel, NotificationType } from '../../../../src/domain/enums';

describe('Notification Entity', () => {
  describe('Creation', () => {
    it('should create a notification with valid properties', () => {
      const notification = new Notification({
        id: 'notif-001',
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test Title',
        content: 'Test content',
        priority: PriorityLevel.MEDIUM,
        status: DeliveryStatus.PENDING,
      });

      expect(notification.id).toBe('notif-001');
      expect(notification.type).toBe(NotificationType.EMAIL);
      expect(notification.recipientId).toBe('user-123');
      expect(notification.title).toBe('Test Title');
      expect(notification.status).toBe(DeliveryStatus.PENDING);
      expect(notification.priority).toBe(PriorityLevel.MEDIUM);
    });

    it('should set default priority to MEDIUM', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      expect(notification.priority).toBe(PriorityLevel.MEDIUM);
    });

    it('should set default status to PENDING', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      expect(notification.status).toBe(DeliveryStatus.PENDING);
    });

    it('should generate id if not provided', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      expect(notification.id).toMatch(/^notif_/);
    });
  });

  describe('Status Changes', () => {
    it('should change status from PENDING to QUEUED', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      notification.markAsQueued();
      expect(notification.status).toBe(DeliveryStatus.QUEUED);
    });

    it('should change status to SENDING', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      notification.markAsSending();
      expect(notification.status).toBe(DeliveryStatus.SENDING);
    });

    it('should change status to DELIVERED', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      notification.markAsDelivered();
      expect(notification.status).toBe(DeliveryStatus.DELIVERED);
      expect(notification.deliveredAt).toBeInstanceOf(Date);
    });

    it('should mark as read', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      notification.markAsRead();
      expect(notification.readAt).toBeInstanceOf(Date);
    });

    it('should mark as failed', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      notification.markAsFailed();
      expect(notification.status).toBe(DeliveryStatus.FAILED);
    });

    it('should mark as retrying', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      notification.markAsRetrying();
      expect(notification.status).toBe(DeliveryStatus.RETRYING);
    });
  });

  describe('State Checks', () => {
    it('should check if delivered', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      expect(notification.isDelivered()).toBe(false);
      notification.markAsDelivered();
      expect(notification.isDelivered()).toBe(true);
    });

    it('should check if pending', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
        status: DeliveryStatus.PENDING,
      });

      expect(notification.isPending()).toBe(true);
      notification.markAsQueued();
      expect(notification.isPending()).toBe(false);
    });

    it('should check high priority', () => {
      const lowPriority = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
        priority: PriorityLevel.LOW,
      });

      const highPriority = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
        priority: PriorityLevel.HIGH,
      });

      const criticalPriority = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
        priority: PriorityLevel.CRITICAL,
      });

      expect(lowPriority.isHighPriority()).toBe(false);
      expect(highPriority.isHighPriority()).toBe(true);
      expect(criticalPriority.isHighPriority()).toBe(true);
    });
  });

  describe('Metadata', () => {
    it('should store and retrieve metadata', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
        metadata: {
          templateId: 'tpl-001',
          campaignId: 'camp-123',
        },
      });

      expect(notification.metadata).toEqual({
        templateId: 'tpl-001',
        campaignId: 'camp-123',
      });
    });

    it('should handle empty metadata', () => {
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
      });

      expect(notification.metadata).toEqual({});
    });
  });

  describe('Scheduling', () => {
    it('should handle scheduled notifications', () => {
      const scheduledAt = new Date(Date.now() + 3600000);
      const notification = new Notification({
        type: NotificationType.EMAIL,
        recipientId: 'user-123',
        title: 'Test',
        content: 'Content',
        scheduledAt,
      });

      expect(notification.scheduledAt).toEqual(scheduledAt);
    });
  });
});
