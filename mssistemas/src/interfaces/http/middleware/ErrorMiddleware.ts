import { Request, Response, NextFunction } from 'express';
import { WinstonLogger } from '../../infrastructure/logging/WinstonLogger';

const logger = new WinstonLogger();

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorMiddleware = (
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  logger.error(`[Error] ${req.method} ${req.path}`, {
    statusCode,
    message,
    stack: error.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDevelopment && { stack: error.stack }),
  });
};

export const createError = (message: string, statusCode: number, code?: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
