import { Router } from 'express';
import { FeatureFlagController } from '../controllers/FeatureFlagController';
import { optionalAuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();
const controller = new FeatureFlagController();

// Public routes for other services
router.post('/:key/evaluate', optionalAuthMiddleware, controller.evaluate);

export default router;
