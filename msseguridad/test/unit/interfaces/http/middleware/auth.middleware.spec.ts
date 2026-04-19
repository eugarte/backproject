import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireAuth, requirePermission, requireRole } from '../../../src/interfaces/http/middleware/auth.middleware';
import { JwtService } from '../../../src/infrastructure/services/jwt.service';

jest.mock('../../../src/infrastructure/services/jwt.service');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: undefined,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should set user and call next when valid token provided', async () => {
      const mockPayload = { 
        sub: 'user-123', 
        email: 'test@example.com',
        roles: ['user']
      };
      
      (JwtService.prototype.verify as jest.Mock).mockResolvedValue(mockPayload);
      
      mockReq.headers = { authorization: 'Bearer valid-token' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next when no authorization header', async () => {
      mockReq.headers = {};

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when token format is invalid', async () => {
      mockReq.headers = { authorization: 'InvalidFormat token' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      (JwtService.prototype.verify as jest.Mock).mockRejectedValue(
        new Error('Token expired')
      );
      
      mockReq.headers = { authorization: 'Bearer expired-token' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
    });

    it('should return 401 when token is invalid', async () => {
      (JwtService.prototype.verify as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );
      
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });

    it('should handle missing bearer prefix', async () => {
      mockReq.headers = { authorization: 'Basic dXNlcjpwYXNz' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should extract token after Bearer prefix', async () => {
      const mockPayload = { sub: 'user-123', email: 'test@example.com' };
      (JwtService.prototype.verify as jest.Mock).mockResolvedValue(mockPayload);
      
      mockReq.headers = { authorization: 'Bearer eyJhbGciOiJSUzI1NiIs...' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(JwtService.prototype.verify).toHaveBeenCalledWith('eyJhbGciOiJSUzI1NiIs...');
    });
  });

  describe('requireAuth', () => {
    it('should call next when user is authenticated', () => {
      mockReq.user = { id: 'user-123', email: 'test@example.com', roles: ['user'] };

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should call next when user has required role', () => {
      mockReq.user = { id: 'user-123', email: 'test@example.com', roles: ['admin'] };
      
      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next when user has one of multiple required roles', () => {
      mockReq.user = { id: 'user-123', email: 'test@example.com', roles: ['moderator'] };
      
      const middleware = requireRole(['admin', 'moderator']);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user lacks required role', () => {
      mockReq.user = { id: 'user-123', email: 'test@example.com', roles: ['user'] };
      
      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    });

    it('should return 403 when user has none of the required roles', () => {
      mockReq.user = { id: 'user-123', email: 'test@example.com', roles: ['user'] };
      
      const middleware = requireRole(['admin', 'moderator']);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      
      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requirePermission', () => {
    it('should call next when user has required permission', () => {
      mockReq.user = { 
        id: 'user-123', 
        email: 'test@example.com', 
        roles: ['user'],
        permissions: ['users:read']
      };
      
      const middleware = requirePermission('users:read');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user lacks required permission', () => {
      mockReq.user = { 
        id: 'user-123', 
        email: 'test@example.com', 
        roles: ['user'],
        permissions: ['users:read']
      };
      
      const middleware = requirePermission('users:delete');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Missing required permission: users:delete',
      });
    });

    it('should check all permissions when array provided', () => {
      mockReq.user = { 
        id: 'user-123', 
        email: 'test@example.com', 
        roles: ['admin'],
        permissions: ['users:read', 'users:write', 'users:delete']
      };
      
      const middleware = requirePermission(['users:read', 'users:write']);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when any permission is missing', () => {
      mockReq.user = { 
        id: 'user-123', 
        email: 'test@example.com', 
        roles: ['user'],
        permissions: ['users:read']
      };
      
      const middleware = requirePermission(['users:read', 'users:delete']);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
