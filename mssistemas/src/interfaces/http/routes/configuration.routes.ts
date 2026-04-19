import { Router } from 'express';
import { ConfigurationController } from '../controllers/ConfigurationController';
import { authMiddleware, requireRoles } from '../middleware/AuthMiddleware';

const router = Router();
const controller = new ConfigurationController();

// Protected routes
router.post('/', authMiddleware, requireRoles('admin', 'developer'), controller.create);
router.get('/', authMiddleware, controller.findAll);
router.get('/resolve', authMiddleware, controller.getMostSpecific);
router.get('/:id', authMiddleware, controller.findById);
router.put('/:id', authMiddleware, requireRoles('admin', 'developer'), controller.update);
router.delete('/:id', authMiddleware, requireRoles('admin'), controller.delete);

export default router;
