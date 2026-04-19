import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/infrastructure/http/middleware/error-handler';
import { DomainError } from '../../../src/domain/errors/domain-error';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('DomainError handling', () => {
    it('should handle DomainError with correct status code', () => {
      const error = new DomainError('User not found', 404, 'USER_NOT_FOUND');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should handle validation errors', () => {
      const error = new DomainError('Invalid email format', 400, 'VALIDATION_ERROR');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle authentication errors', () => {
      const error = new DomainError('Invalid credentials', 401, 'AUTHENTICATION_ERROR');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle authorization errors', () => {
      const error = new DomainError('Insufficient permissions', 403, 'FORBIDDEN');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should handle conflict errors', () => {
      const error = new DomainError('Email already exists', 409, 'CONFLICT');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic Error as 500', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });

    it('should handle errors without message', () => {
      const error = new Error();

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle null errors', () => {
      errorHandler(null as any, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle undefined errors', () => {
      errorHandler(undefined as any, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('TypeORM errors', () => {
    it('should handle duplicate key error', () => {
      const error = new Error('ER_DUP_ENTRY: Duplicate entry');
      error.name = 'QueryFailedError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
      });
    });

    it('should handle foreign key constraint error', () => {
      const error = new Error('ER_NO_REFERENCED_ROW: Cannot add or update child row');
      error.name = 'QueryFailedError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'FOREIGN_KEY_CONSTRAINT',
        message: 'Referenced resource does not exist',
      });
    });

    it('should handle not null constraint error', () => {
      const error = new Error('ER_BAD_NULL_ERROR: Column cannot be null');
      error.name = 'QueryFailedError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('JWT errors', () => {
    it('should handle JWT expired error', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      });
    });

    it('should handle JWT invalid error', () => {
      const error = new Error('invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'INVALID_TOKEN',
        message: 'Token is invalid',
      });
    });

    it('should handle NotBeforeError', () => {
      const error = new Error('jwt not active');
      error.name = 'NotBeforeError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Validation errors', () => {
    it('should handle express-validator errors', () => {
      const error: any = new Error('Validation failed');
      error.statusCode = 422;
      error.errors = [
        { param: 'email', msg: 'Invalid email' },
        { param: 'password', msg: 'Too short' },
      ];

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [
          { param: 'email', msg: 'Invalid email' },
          { param: 'password', msg: 'Too short' },
        ],
      });
    });
  });

  describe('Rate limiting errors', () => {
    it('should handle rate limit exceeded', () => {
      const error: any = new Error('Too many requests');
      error.statusCode = 429;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      });
    });
  });

  describe('Error masking in production', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose stack traces in production', () => {
      const error = new Error('Sensitive database error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.any(String),
        })
      );
    });

    it('should mask internal error details', () => {
      const error = new Error('Connection to db.internal.com:5432 failed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });
  });

  describe('Error logging', () => {
    it('should log errors for monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
