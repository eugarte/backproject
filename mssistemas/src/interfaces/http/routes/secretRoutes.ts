import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/AuthMiddleware';
import { SecretController } from '../controllers/SecretController';

const router = Router();
const controller = new SecretController();

router.use(authMiddleware);

router.post('/', requireRole(['admin']), controller.create);
router.get('/', requireRole(['admin', 'developer']), controller.findAll);
router.get('/:id', requireRole(['admin']), controller.findOne);
router.put('/:id', requireRole(['admin']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.remove);
router.post('/:id/rotate', requireRole(['admin']), controller.rotate);

export default router;