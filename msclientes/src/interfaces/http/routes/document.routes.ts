import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { DocumentController } from '../controllers/document.controller';
import { JwtAuthService } from '../../../infrastructure/auth/jwt-auth.service';
import { createAuthMiddleware, requirePermission } from '../middleware/auth.middleware';

export const createDocumentRoutes = (
  documentController: DocumentController,
  authService: JwtAuthService,
  uploadDir: string
): Router => {
  const router = Router({ mergeParams: true });
  const authMiddleware = createAuthMiddleware(authService);
  
  const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      }
      cb(new Error('Only images and documents are allowed'));
    },
  });

  // POST /api/v1/customers/:id/documents - Upload document
  router.post(
    '/',
    authMiddleware,
    requirePermission(authService, 'customers:update'),
    upload.single('document'),
    documentController.upload
  );

  // GET /api/v1/customers/:id/documents - Get customer documents
  router.get(
    '/',
    authMiddleware,
    requirePermission(authService, 'customers:read'),
    documentController.getByCustomer
  );

  return router;
};