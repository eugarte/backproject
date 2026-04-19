import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { AppDataSource } from './infrastructure/config/data-source';
import { JwtAuthService } from './infrastructure/auth/jwt-auth.service';
import { WinstonLogger } from './infrastructure/logging/winston.logger';
import { EventPublisher } from './domain/events/event-publisher';

import { TypeOrmCustomerRepository } from './infrastructure/persistence/repositories/customer.repository';
import { TypeOrmAddressRepository } from './infrastructure/persistence/repositories/address.repository';
// import { TypeOrmContactRepository } from './infrastructure/persistence/repositories/contact.repository';
import { TypeOrmDocumentRepository } from './infrastructure/persistence/repositories/document.repository';
import { TypeOrmAuditLogRepository } from './infrastructure/persistence/repositories/audit-log.repository';

import { TaxIdValidatorService } from './domain/services/tax-id-validator.service';

import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase, DeleteCustomerUseCase, AnonymizeCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { GetCustomerUseCase, GetCustomerByCodeUseCase, ListCustomersUseCase } from './application/use-cases/get-customer.use-case';
import { AddAddressUseCase, GetCustomerAddressesUseCase } from './application/use-cases/address.use-case';
import { UploadDocumentUseCase, GetCustomerDocumentsUseCase } from './application/use-cases/document.use-case';
import { GdprExportDataUseCase } from './application/use-cases/gdpr.use-case';
import { ValidateTaxIdUseCase } from './application/use-cases/validate-tax-id.use-case';

import { CustomerController } from './interfaces/http/controllers/customer.controller';
import { AddressController } from './interfaces/http/controllers/address.controller';
import { DocumentController } from './interfaces/http/controllers/document.controller';
import { GdprController } from './interfaces/http/controllers/gdpr.controller';
import { TaxIdController } from './interfaces/http/controllers/tax-id.controller';

import { createCustomerRoutes } from './interfaces/http/routes/customer.routes';
import { createAddressRoutes } from './interfaces/http/routes/address.routes';
import { createDocumentRoutes } from './interfaces/http/routes/document.routes';
import { createTaxIdRoutes } from './interfaces/http/routes/tax-id.routes';

import { requestIdMiddleware } from './interfaces/http/middleware/auth.middleware';
import { createErrorMiddleware, notFoundMiddleware } from './interfaces/http/middleware/error.middleware';

dotenv.config();

export async function createApp(): Promise<Application> {
  const app = express();
  const logger = new WinstonLogger();

  // Trust proxy for secure cookies behind reverse proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Logging middleware
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));

  // Body parsing middleware
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize database
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    logger.info('Database connection established');
  }

  // Initialize services
  const authService = new JwtAuthService({
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    issuer: process.env.JWT_ISSUER || 'msseguridad',
    audience: process.env.JWT_AUDIENCE || 'msclientes',
  });

  const eventPublisher = new EventPublisher();

  // Initialize repositories
  const customerRepository = new TypeOrmCustomerRepository();
  const addressRepository = new TypeOrmAddressRepository();
  // const contactRepository = new TypeOrmContactRepository(); // Reserved for future use
  const documentRepository = new TypeOrmDocumentRepository();
  const auditLogRepository = new TypeOrmAuditLogRepository();

  // Initialize domain services
  const taxIdValidator = new TaxIdValidatorService();

  // Initialize use cases
  const createCustomerUseCase = new CreateCustomerUseCase(
    customerRepository, auditLogRepository, eventPublisher, taxIdValidator
  );
  const updateCustomerUseCase = new UpdateCustomerUseCase(
    customerRepository, auditLogRepository, eventPublisher
  );
  const deleteCustomerUseCase = new DeleteCustomerUseCase(
    customerRepository, auditLogRepository, eventPublisher
  );
  const anonymizeCustomerUseCase = new AnonymizeCustomerUseCase(
    customerRepository, auditLogRepository, eventPublisher
  );
  const getCustomerUseCase = new GetCustomerUseCase(customerRepository);
  const getCustomerByCodeUseCase = new GetCustomerByCodeUseCase(customerRepository);
  const listCustomersUseCase = new ListCustomersUseCase(customerRepository);
  const addAddressUseCase = new AddAddressUseCase(
    addressRepository, customerRepository, auditLogRepository, eventPublisher
  );
  const getCustomerAddressesUseCase = new GetCustomerAddressesUseCase(addressRepository);
  const uploadDocumentUseCase = new UploadDocumentUseCase(
    documentRepository, customerRepository, auditLogRepository, eventPublisher
  );
  const getCustomerDocumentsUseCase = new GetCustomerDocumentsUseCase(documentRepository);
  const gdprExportUseCase = new GdprExportDataUseCase(
    customerRepository, auditLogRepository, eventPublisher
  );
  const validateTaxIdUseCase = new ValidateTaxIdUseCase(taxIdValidator);

  // Initialize controllers
  const customerController = new CustomerController(
    createCustomerUseCase,
    updateCustomerUseCase,
    deleteCustomerUseCase,
    anonymizeCustomerUseCase,
    getCustomerUseCase,
    getCustomerByCodeUseCase,
    listCustomersUseCase
  );
  const addressController = new AddressController(addAddressUseCase, getCustomerAddressesUseCase);
  const documentController = new DocumentController(uploadDocumentUseCase, getCustomerDocumentsUseCase);
  const gdprController = new GdprController(gdprExportUseCase);
  const taxIdController = new TaxIdController(validateTaxIdUseCase);

  // Health check endpoint (no auth required)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'msclientes',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  const apiV1 = express.Router();

  // Customer routes
  const customerRoutes = createCustomerRoutes(customerController, gdprController, authService);
  apiV1.use('/customers', customerRoutes);

  // Address routes (nested under customers)
  const addressRoutes = createAddressRoutes(addressController, authService);
  apiV1.use('/customers/:id/addresses', addressRoutes);

  // Document routes (nested under customers)
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const documentRoutes = createDocumentRoutes(documentController, authService, uploadDir);
  apiV1.use('/customers/:id/documents', documentRoutes);

  // Tax ID validation
  const taxIdRoutes = createTaxIdRoutes(taxIdController, authService);
  apiV1.use('/customers', taxIdRoutes);

  // Mount API v1
  app.use('/api/v1', apiV1);

  // API documentation endpoint
  app.get('/api/v1/docs', (_req, res) => {
    res.json({
      service: 'msclientes',
      version: '1.0.0',
      endpoints: {
        customers: {
          'POST /api/v1/customers': 'Create customer',
          'GET /api/v1/customers': 'List customers (paginated)',
          'GET /api/v1/customers/:id': 'Get customer by ID',
          'PATCH /api/v1/customers/:id': 'Update customer',
          'DELETE /api/v1/customers/:id': 'Soft delete customer',
          'POST /api/v1/customers/:id/addresses': 'Add address',
          'GET /api/v1/customers/:id/addresses': 'Get addresses',
          'POST /api/v1/customers/:id/documents': 'Upload document',
          'GET /api/v1/customers/:id/documents': 'Get documents',
          'POST /api/v1/customers/:id/anonymize': 'GDPR anonymize',
          'GET /api/v1/customers/:id/export': 'GDPR data export',
          'POST /api/v1/customers/validate/tax-id': 'Validate tax ID',
        },
      },
    });
  });

  // 404 handler
  app.use(notFoundMiddleware);

  // Error handler
  app.use(createErrorMiddleware(logger));

  return app;
}
