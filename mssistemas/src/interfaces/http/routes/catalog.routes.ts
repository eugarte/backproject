import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';
import { authMiddleware, requireRoles } from '../middleware/AuthMiddleware';

const router = Router();
const controller = new CatalogController();

// Public routes
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.get('/by-key/:key', controller.findByKey);

// Protected routes
router.post('/', authMiddleware, requireRoles('admin', 'developer'), controller.create);
router.put('/:id', authMiddleware, requireRoles('admin', 'developer'), controller.update);
router.delete('/:id', authMiddleware, requireRoles('admin'), controller.delete);

export default router;
