import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { createServer } from 'http';

import { initializeDatabase } from './infrastructure/persistence/config/data-source';
import { LoggerService } from './infrastructure/logging/LoggerService';
import { WebSocketService } from './infrastructure/websocket/WebSocketService';
import routes from './interfaces/http/routes';
import { setupNotificationProcessor } from './interfaces/http/routes/notification.routes';

// mssistemas integration
import { SystemClient } from './infrastructure/system/SystemClient';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3003;

// mssistemas client
let systemClient: SystemClient | null = null;

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize WebSocket
const webSocketService = new WebSocketService(server);

// Setup notification processor with WebSocket
setupNotificationProcessor(webSocketService);

// Routes
app.use(routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  LoggerService.error('Unhandled error', err instanceof Error ? err : new Error(String(err)));
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize mssistemas integration
async function initializeMssistemas(): Promise<void> {
  try {
    const mssistemasUrl = process.env.MSSISTEMAS_URL;
    const mssistemasApiKey = process.env.MSSISTEMAS_API_KEY;
    const serviceName = process.env.SERVICE_NAME || 'msnotificaciones';
    const serviceVersion = process.env.SERVICE_VERSION || process.env.npm_package_version || '1.0.0';

    if (!mssistemasUrl || !mssistemasApiKey) {
      LoggerService.warn('mssistemas integration disabled: MSSISTEMAS_URL or MSSISTEMAS_API_KEY not set');
      return;
    }

    systemClient = new SystemClient({
      baseUrl: mssistemasUrl,
      apiKey: mssistemasApiKey,
      serviceName,
      serviceVersion,
      environment: process.env.NODE_ENV || 'development',
    });

    // Register service in mssistemas
    await systemClient.registerService({
      description: 'Microservicio de notificaciones con Email, SMS, Push, In-App + WebSocket',
      baseUrl: process.env.SERVICE_BASE_URL || `http://localhost:${PORT}`,
      healthCheckUrl: '/api/v1/health',
    });

    // Start heartbeat
    const heartbeatInterval = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000');
    systemClient.startHeartbeat(heartbeatInterval);

    LoggerService.info('mssistemas integration initialized', {
      serviceId: systemClient.getServiceId(),
      serviceName,
      heartbeatInterval,
    });
  } catch (error) {
    LoggerService.error('Failed to initialize mssistemas integration', error instanceof Error ? error : undefined);
    systemClient = null;
  }
}

// Start server
async function bootstrap() {
  try {
    // Initialize database
    await initializeDatabase();
    LoggerService.info('Database initialized successfully');

    // Initialize mssistemas integration
    await initializeMssistemas();

    // Start server
    server.listen(PORT, () => {
      LoggerService.info(`🚀 msnotificaciones server running on port ${PORT}`);
      LoggerService.info(`WebSocket server initialized`);
      LoggerService.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    LoggerService.error('Failed to start server', error instanceof Error ? error : undefined);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  LoggerService.info('SIGTERM received, shutting down gracefully');
  
  if (systemClient) {
    systemClient.stopHeartbeat();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  LoggerService.info('SIGINT received, shutting down gracefully');
  
  if (systemClient) {
    systemClient.stopHeartbeat();
  }
  
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  LoggerService.error('Uncaught Exception', error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  LoggerService.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)));
  process.exit(1);
});

bootstrap();
