import { Router } from 'express';
import { SecretController } from '../controllers/SecretController';
import { authMiddleware, requireRoles } from '../middleware/AuthMiddleware';

const router = Router();
const controller = new SecretController();

// Protected routes
router.post('/', authMiddleware, requireRoles('admin'), controller.create);
router.get('/', authMiddleware, requireRoles('admin', 'developer'), controller.findAll);
router.get('/:id', authMiddleware, requireRoles('admin', 'developer'), controller.findById);
router.get('/:id/value', authMiddleware, requireRoles('admin'), controller.getValue);
router.put('/:id', authMiddleware, requireRoles('admin'), controller.update);
router.post('/:id/rotate', authMiddleware, requireRoles('admin'), controller.rotate);
router.delete('/:id', authMiddleware, requireRoles('admin'), controller.delete);

export default router;
