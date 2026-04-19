import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';
import { authMiddleware, requireRoles } from '../middleware/AuthMiddleware';

const router = Router();
const controller = new HealthController();

// Public health check
router.get('/', controller.health);

// Protected dashboard
router.get('/dashboard', authMiddleware, requireRoles('admin', 'developer'), controller.dashboard);

// Cleanup - admin only
router.post('/cleanup', authMiddleware, requireRoles('admin'), controller.cleanup);

export default router;
