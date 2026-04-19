import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../../infrastructure/logging/winston.logger';

export const createErrorMiddleware = (logger: Logger) => {
  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    });

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';
    
    if (err.name === 'ValidationError') {
      res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        ...(isDev && { stack: err.stack }),
      });
      return;
    }

    if (err.name === 'UnauthorizedError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: isDev ? err.message : 'Something went wrong',
      ...(isDev && { stack: err.stack }),
    });
  };
};

export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
