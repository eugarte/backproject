import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/AuthMiddleware';
import { ConfigurationController } from '../controllers/ConfigurationController';

const router = Router();
const controller = new ConfigurationController();

// Public route (no auth required for microservices)
router.get('/public/configurations/:service/:env/:key', controller.getPublicConfiguration);

// Protected routes
router.use(authMiddleware);

router.post('/', requireRole(['admin', 'developer']), controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.put('/:id', requireRole(['admin', 'developer']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.remove);
router.get('/:id/history', controller.getHistory);

export default router;