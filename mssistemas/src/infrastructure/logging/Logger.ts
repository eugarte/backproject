import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Console format for development
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logs directory if it doesn't exist
const logsDir = process.env.LOGS_DIR || './logs';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'mssistemas' },
  format: combine(
    timestamp(),
    errors({ stack: true })
  ),
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: `${logsDir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: json(),
    }),
    // Combined logs
    new DailyRotateFile({
      filename: `${logsDir}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: json(),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    })
  );
}

export const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    new DailyRotateFile({
      filename: `${logsDir}/audit-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d', // Keep audit logs longer
      format: json(),
    }),
  ],
});

export const logError = (error: Error, context?: Record<string, any>): void => {
  logger.error(error.message, { stack: error.stack, ...context });
};

export const logInfo = (message: string, metadata?: Record<string, any>): void => {
  logger.info(message, metadata);
};

export const logAudit = (action: string, details: Record<string, any>): void => {
  auditLogger.info(action, details);
};
