import winston from 'winston';

const { combine, timestamp, json, printf, colorize } = winston.format;

const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const jsonFormat = combine(
  timestamp(),
  json()
);

const logger = winston.createLogger({
  level: logLevel,
  format: isDevelopment ? consoleFormat : jsonFormat,
  defaultMeta: {
    service: 'msnotificaciones',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console(),
  ],
});

export class LoggerService {
  static info(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  static warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }

  static error(message: string, error?: Error, meta?: any): void {
    logger.error(message, { ...meta, error: error?.message, stack: error?.stack });
  }

  static debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }
}
