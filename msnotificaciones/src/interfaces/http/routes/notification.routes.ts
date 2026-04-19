import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { CreateNotificationUseCase, GetNotificationsUseCase, GetNotificationByIdUseCase, MarkNotificationAsReadUseCase, MarkAllNotificationsAsReadUseCase } from '@application/use-cases/NotificationUseCases';
import { NotificationRepository } from '@infrastructure/persistence/repositories/NotificationRepository';
import { BullMQService } from '@infrastructure/queue/BullMQService';
import { ProcessNotificationUseCase } from '@application/use-cases/ProcessNotificationUseCase';
import { SendGridProvider } from '@infrastructure/providers/SendGridProvider';
import { TwilioProvider } from '@infrastructure/providers/TwilioProvider';
import { FirebaseProvider } from '@infrastructure/providers/FirebaseProvider';
import { InAppProvider } from '@infrastructure/providers/InAppProvider';
import { WebSocketService } from '@infrastructure/websocket/WebSocketService';

const router = Router();

// Initialize repositories and services
const notificationRepository = new NotificationRepository();
const messageQueueService = new BullMQService();
const emailProvider = new SendGridProvider();
const smsProvider = new TwilioProvider();
const pushProvider = new FirebaseProvider();
const inAppProvider = new InAppProvider();

// WebSocket service will be set from main.ts
let webSocketService: WebSocketService | null = null;

// Initialize use cases
const createNotificationUseCase = new CreateNotificationUseCase(
  notificationRepository,
  messageQueueService
);
const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);
const getNotificationByIdUseCase = new GetNotificationByIdUseCase(notificationRepository);
const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(notificationRepository);
const markAllNotificationsAsReadUseCase = new MarkAllNotificationsAsReadUseCase(notificationRepository);

// Controller
const notificationController = new NotificationController(
  createNotificationUseCase,
  getNotificationsUseCase,
  getNotificationByIdUseCase,
  markNotificationAsReadUseCase,
  markAllNotificationsAsReadUseCase
);

// Routes
router.post('/', notificationController.create.bind(notificationController));
router.get('/', notificationController.findAll.bind(notificationController));
router.get('/:id', notificationController.findById.bind(notificationController));
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

// Setup notification processor
export function setupNotificationProcessor(wsService: WebSocketService): void {
  webSocketService = wsService;
  
  const processNotificationUseCase = new ProcessNotificationUseCase(
    notificationRepository,
    emailProvider,
    smsProvider,
    pushProvider,
    inAppProvider,
    wsService
  );

  messageQueueService.setupNotificationProcessor(async (notificationId: string) => {
    await processNotificationUseCase.execute(notificationId);
  });
}

export default router;
export { messageQueueService };
