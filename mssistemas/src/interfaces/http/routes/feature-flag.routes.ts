import { Router } from 'express';
import { FeatureFlagController } from '../controllers/FeatureFlagController';
import { authMiddleware, requireRoles, optionalAuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();
const controller = new FeatureFlagController();

// Protected routes
router.post('/', authMiddleware, requireRoles('admin', 'developer'), controller.create);
router.get('/', authMiddleware, controller.findAll);
router.get('/:id', authMiddleware, controller.findById);
router.get('/by-key/:key', authMiddleware, controller.findByKey);
router.put('/:id', authMiddleware, requireRoles('admin', 'developer'), controller.update);
router.post('/:id/toggle', authMiddleware, requireRoles('admin', 'developer'), controller.toggle);
router.delete('/:id', authMiddleware, requireRoles('admin'), controller.delete);

// Public evaluation
router.post('/:key/evaluate', optionalAuthMiddleware, controller.evaluate);

export default router;
