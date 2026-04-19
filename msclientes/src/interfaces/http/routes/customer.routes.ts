import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { GdprController } from '../controllers/gdpr.controller';
import { JwtAuthService } from '../../../infrastructure/auth/jwt-auth.service';
import { createAuthMiddleware, requirePermission } from '../middleware/auth.middleware';

export const createCustomerRoutes = (
  customerController: CustomerController,
  gdprController: GdprController,
  authService: JwtAuthService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(authService);

  // POST /api/v1/customers - Create customer
  router.post(
    '/',
    authMiddleware,
    requirePermission(authService, 'customers:create'),
    customerController.create
  );

  // GET /api/v1/customers - List customers (paginated, filtered)
  router.get(
    '/',
    authMiddleware,
    requirePermission(authService, 'customers:read'),
    customerController.list
  );

  // GET /api/v1/customers/:id - Get customer by ID
  router.get(
    '/:id',
    authMiddleware,
    requirePermission(authService, 'customers:read'),
    customerController.getById
  );

  // PATCH /api/v1/customers/:id - Update customer
  router.patch(
    '/:id',
    authMiddleware,
    requirePermission(authService, 'customers:update'),
    customerController.update
  );

  // DELETE /api/v1/customers/:id - Soft delete customer
  router.delete(
    '/:id',
    authMiddleware,
    requirePermission(authService, 'customers:delete'),
    customerController.delete
  );

  // POST /api/v1/customers/:id/anonymize - GDPR anonymize
  router.post(
    '/:id/anonymize',
    authMiddleware,
    requirePermission(authService, 'customers:gdpr'),
    customerController.anonymize
  );

  // GET /api/v1/customers/:id/export - GDPR data export
  router.get(
    '/:id/export',
    authMiddleware,
    requirePermission(authService, 'customers:gdpr'),
    customerController.exportData
  );

  return router;
};
