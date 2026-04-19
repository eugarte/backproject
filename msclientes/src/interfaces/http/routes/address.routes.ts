import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';
import { JwtAuthService } from '../../../infrastructure/auth/jwt-auth.service';
import { createAuthMiddleware, requirePermission } from '../middleware/auth.middleware';

export const createAddressRoutes = (
  addressController: AddressController,
  authService: JwtAuthService
): Router => {
  const router = Router({ mergeParams: true });
  const authMiddleware = createAuthMiddleware(authService);

  // POST /api/v1/customers/:id/addresses - Add address
  router.post(
    '/',
    authMiddleware,
    requirePermission(authService, 'customers:update'),
    addressController.create
  );

  // GET /api/v1/customers/:id/addresses - Get customer addresses
  router.get(
    '/',
    authMiddleware,
    requirePermission(authService, 'customers:read'),
    addressController.getByCustomer
  );

  return router;
};