import { Router } from 'express';
import notificationRoutes, { setupNotificationProcessor } from './notification.routes';

const router = Router();

router.use('/api/v1/notifications', notificationRoutes);

// Health check
router.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'msnotificaciones',
  });
});

// Root endpoint
router.get('/', (_req, res) => {
  res.json({
    name: 'msnotificaciones',
    version: '1.0.0',
    description: 'Microservicio de notificaciones',
    endpoints: {
      notifications: '/api/v1/notifications',
      health: '/api/v1/health',
    },
  });
});

export default router;
