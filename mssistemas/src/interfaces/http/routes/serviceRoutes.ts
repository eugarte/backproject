import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/AuthMiddleware';
import { ServiceController } from '../controllers/ServiceController';

const router = Router();
const controller = new ServiceController();

router.use(authMiddleware);

router.post('/', requireRole(['admin', 'developer']), controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.put('/:id', requireRole(['admin', 'developer']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.remove);
router.post('/:id/heartbeat', controller.heartbeat);
router.get('/:id/health', controller.getHealth);

export default router;