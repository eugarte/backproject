import { Router } from 'express';
import { TaxIdController } from '../controllers/tax-id.controller';
import { JwtAuthService } from '../../../infrastructure/auth/jwt-auth.service';
import { createAuthMiddleware, requirePermission } from '../middleware/auth.middleware';

export const createTaxIdRoutes = (
  taxIdController: TaxIdController,
  authService: JwtAuthService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(authService);

  // POST /api/v1/customers/validate/tax-id - Validate tax ID
  router.post(
    '/validate/tax-id',
    authMiddleware,
    requirePermission(authService, 'customers:read'),
    taxIdController.validate
  );

  return router;
};