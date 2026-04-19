/**
 * Error Handler Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { DomainError } from '@domain/errors/domain-error';
import { logger } from '@infrastructure/services/logger';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error occurred', { error: err.message, stack: err.stack });

  if (err instanceof DomainError) {
    res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expired' });
    return;
  }

  // TypeORM errors
  if (err.name === 'QueryFailedError') {
    res.status(500).json({ error: 'Database error' });
    return;
  }

  // Default error
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
  });
}
