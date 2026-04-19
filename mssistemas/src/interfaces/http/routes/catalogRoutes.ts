import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/AuthMiddleware';
import { CatalogController } from '../controllers/CatalogController';

const router = Router();
const controller = new CatalogController();

// Public routes (no auth required)
router.get('/public/catalogs/:key/values', controller.getPublicValues);
router.post('/public/catalogs/:key/validate', controller.validateValue);

// Protected routes (require auth)
router.use(authMiddleware);

router.post('/', requireRole(['admin', 'developer']), controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.put('/:id', requireRole(['admin', 'developer']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.remove);
router.get('/:id/values', controller.getValues);
router.post('/:id/values', requireRole(['admin', 'developer']), controller.createValue);
router.put('/values/:valueId', requireRole(['admin', 'developer']), controller.updateValue);
router.delete('/values/:valueId', requireRole(['admin']), controller.removeValue);

export default router;