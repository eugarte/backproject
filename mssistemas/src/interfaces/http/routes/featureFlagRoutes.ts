import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/AuthMiddleware';
import { FeatureFlagController } from '../controllers/FeatureFlagController';

const router = Router();
const controller = new FeatureFlagController();

// Public route (no auth required for microservices)
router.post('/public/feature-flags/evaluate', controller.evaluate);

// Protected routes
router.use(authMiddleware);

router.post('/', requireRole(['admin', 'developer']), controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.put('/:id', requireRole(['admin', 'developer']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.remove);
router.post('/:id/toggle', requireRole(['admin', 'developer']), controller.toggle);

export default router;