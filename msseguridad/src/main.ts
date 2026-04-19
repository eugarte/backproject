import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { AppDataSource } from '@infrastructure/config/database';
import { logger } from '@infrastructure/services/logger';
import { errorHandler } from '@infrastructure/http/middleware/error-handler';
import { requestLogger } from '@infrastructure/http/middleware/request-logger';
import { metricsMiddleware } from '@infrastructure/http/middleware/metrics';
import authRoutes from '@interfaces/http/routes/auth.routes';

// mssistemas integration
import { SystemClient } from '@infrastructure/system/SystemClient';
import { UserStatus } from '@domain/enums/UserStatus';
import { UserRole } from '@domain/enums/UserRole';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// mssistemas client
let systemClient: SystemClient | null = null;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW || '900000') / 1000),
    });
  },
});
app.use(limiter);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Metrics
app.use(metricsMiddleware);

// Health checks
app.get('/health', async (_req, res) => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query('SELECT 1');
    }
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: AppDataSource.isInitialized ? 'connected' : 'not_initialized',
        cache: 'memory (lru-cache)',
        mssistemas: systemClient?.getServiceId() ? 'connected' : 'not_connected',
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'One or more services are unavailable',
    });
  }
});

app.get('/ready', async (_req, res) => {
  res.status(200).json({ ready: true });
});

// Metrics endpoint
app.get('/metrics', (_req, res) => {
  res.status(200).send('# Metrics endpoint placeholder');
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling
app.use(errorHandler);

// Initialize mssistemas integration
async function initializeMssistemas(): Promise<void> {
  try {
    const mssistemasUrl = process.env.MSSISTEMAS_URL;
    const mssistemasApiKey = process.env.MSSISTEMAS_API_KEY;
    const serviceName = process.env.SERVICE_NAME || 'msseguridad';
    const serviceVersion = process.env.SERVICE_VERSION || process.env.npm_package_version || '1.0.0';

    if (!mssistemasUrl || !mssistemasApiKey) {
      logger.warn('mssistemas integration disabled: MSSISTEMAS_URL or MSSISTEMAS_API_KEY not set');
      return;
    }

    systemClient = new SystemClient({
      baseUrl: mssistemasUrl,
      apiKey: mssistemasApiKey,
      serviceName,
      serviceVersion,
      environment: process.env.NODE_ENV || 'development',
    });

    // Set client for enums
    UserStatus.setClient(systemClient);
    UserRole.setClient(systemClient);

    // Initialize enums with catalog values
    await UserStatus.initialize();
    await UserRole.initialize();

    // Register service in mssistemas
    await systemClient.registerService({
      description: 'Microservicio de seguridad y autenticación',
      baseUrl: process.env.SERVICE_BASE_URL || `http://localhost:${PORT}`,
      healthCheckUrl: '/health',
    });

    // Start heartbeat
    const heartbeatInterval = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000');
    systemClient.startHeartbeat(heartbeatInterval);

    logger.info('mssistemas integration initialized', {
      serviceId: systemClient.getServiceId(),
      serviceName,
      heartbeatInterval,
    });
  } catch (error) {
    logger.error('Failed to initialize mssistemas integration', { error });
    // Don't fail startup if mssistemas is unavailable
    systemClient = null;
  }
}

// Database connection and server start
async function bootstrap() {
  try {
    // Connect to database (only if not already initialized)
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connected successfully');
    } else {
      logger.info('Database already initialized');
    }

    logger.info('Memory cache initialized (lru-cache)');

    // Initialize mssistemas integration
    await initializeMssistemas();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 msseguridad server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      });
    });
  } catch (error: any) {
    console.error('ERROR DETAILS:', error);
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  // Stop heartbeat
  if (systemClient) {
    systemClient.stopHeartbeat();
  }
  
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  // Stop heartbeat
  if (systemClient) {
    systemClient.stopHeartbeat();
  }
  
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

bootstrap();
