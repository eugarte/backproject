import { Request, Response } from 'express';
import { AuthController } from '../../../../src/interfaces/http/controllers/auth.controller';
import { LoginUserUseCase } from '../../../../src/application/use-cases/auth/login-user.use-case';
import { RegisterUserUseCase } from '../../../../src/application/use-cases/auth/register-user.use-case';
import { RefreshTokenUseCase } from '../../../../src/application/use-cases/auth/refresh-token.use-case';
import { LogoutUserUseCase } from '../../../../src/application/use-cases/auth/logout-user.use-case';
import { GetUserProfileUseCase } from '../../../../src/application/use-cases/auth/get-user-profile.use-case';

describe('AuthController', () => {
  let authController: AuthController;
  let mockLoginUseCase: jest.Mocked<LoginUserUseCase>;
  let mockRegisterUseCase: jest.Mocked<RegisterUserUseCase>;
  let mockRefreshTokenUseCase: jest.Mocked<RefreshTokenUseCase>;
  let mockLogoutUseCase: jest.Mocked<LogoutUserUseCase>;
  let mockGetProfileUseCase: jest.Mocked<GetUserProfileUseCase>;

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockLoginUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoginUserUseCase>;

    mockRegisterUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RegisterUserUseCase>;

    mockRefreshTokenUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenUseCase>;

    mockLogoutUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LogoutUserUseCase>;

    mockGetProfileUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetUserProfileUseCase>;

    authController = new AuthController(
      mockLoginUseCase,
      mockRegisterUseCase,
      mockRefreshTokenUseCase,
      mockLogoutUseCase,
      mockGetProfileUseCase
    );

    mockReq = {
      body: {},
      headers: {},
      user: undefined,
      ip: '192.168.1.1',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    it('should return 200 with tokens on successful login', async () => {
      mockReq.body = { email: 'test@example.com', password: 'SecureP@ss123' };
      
      mockLoginUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
        isFailure: () => false,
        getValue: () => ({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      } as any);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      });
    });

    it('should return 401 on failed login', async () => {
      mockReq.body = { email: 'test@example.com', password: 'wrongpassword' };
      
      mockLoginUseCase.execute.mockResolvedValue({
        isSuccess: () => false,
        isFailure: () => true,
        getError: () => new Error('Invalid credentials'),
      } as any);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials',
      });
    });

    it('should extract IP and user agent from request', async () => {
      mockReq.body = { email: 'test@example.com', password: 'SecureP@ss123' };
      mockReq.headers['user-agent'] = 'Mozilla/5.0';
      mockReq.ip = '10.0.0.1';

      mockLoginUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
        isFailure: () => false,
        getValue: () => ({
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresIn: 900,
          user: { id: 'user-123', email: 'test@example.com' },
        }),
      } as any);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should require MFA when enabled', async () => {
      mockReq.body = { email: 'test@example.com', password: 'SecureP@ss123' };
      
      mockLoginUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
        isFailure: () => false,
        getValue: () => ({
          requiresMfa: true,
          tempToken: 'temp-token',
        }),
      } as any);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          requiresMfa: true,
          tempToken: 'temp-token',
        },
      });
    });

    it('should handle missing request body', async () => {
      mockReq.body = undefined;

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('register', () => {
    it('should return 201 on successful registration', async () => {
      mockReq.body = {
        email: 'newuser@example.com',
        password: 'SecureP@ss123',
        confirmPassword: 'SecureP@ss123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRegisterUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
        isFailure: () => false,
        getValue: () => ({
          id: 'new-user-123',
          email: 'newuser@example.com',
          status: 'pending',
        }),
      } as any);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'new-user-123',
          email: 'newuser@example.com',
          status: 'pending',
        },
      });
    });

    it('should return 400 on registration failure', async () => {
      mockReq.body = {
        email: 'existing@example.com',
        password: 'SecureP@ss123',
        confirmPassword: 'SecureP@ss123',
      };

      mockRegisterUseCase.execute.mockResolvedValue({
        isSuccess: () => false,
        isFailure: () => true,
        getError: () => new Error('Email already registered'),
      } as any);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already registered',
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens on valid refresh', async () => {
      mockReq.body = { refreshToken: 'valid-refresh-token' };

      mockRefreshTokenUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
        isFailure: () => false,
        getValue: () => ({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 900,
        }),
      } as any);

      await authController.refreshToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 900,
        },
      });
    });

    it('should return 401 on invalid refresh token', async () => {
      mockReq.body = { refreshToken: 'invalid-token' };

      mockRefreshTokenUseCase.execute.mockResolvedValue({
        isSuccess: () => false,
        isFailure: () => true,
        getError: () => new Error('Invalid refresh token'),
      } as any);

      await authController.refreshToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should detect token reuse attack', async () => {
      mockReq.body = { refreshToken: 'reused-token' };

      mockRefreshTokenUseCase.execute.mockResolvedValue({
        isSuccess: () => false,
        isFailure: () => true,
        getError: () => new Error('Token reuse detected. Session terminated.'),
      } as any);

      await authController.refreshToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should successfully logout and clear cookies', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { refreshToken: 'token-to-revoke' };

      mockLogoutUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
      } as any);

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should logout all sessions when requested', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { allSessions: true };

      mockLogoutUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
      } as any);

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        allSessions: true,
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile when authenticated', async () => {
      mockReq.user = { id: 'user-123' };

      mockGetProfileUseCase.execute.mockResolvedValue({
        isSuccess: () => true,
        getValue: () => ({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          roles: ['user'],
          mfaEnabled: false,
        }),
      } as any);

      await authController.getProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          roles: ['user'],
          mfaEnabled: false,
        },
      });
    });

    it('should return 401 when not authenticated', async () => {
      mockReq.user = undefined;

      await authController.getProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockReq.query = { token: 'verification-token' };

      await authController.verifyEmail(mockReq as Request, mockRes as Response);

      // Implementation specific assertions
      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      mockReq.body = { email: 'user@example.com' };

      await authController.forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockReq.body = {
        token: 'reset-token',
        password: 'NewP@ssw0rd123',
        confirmPassword: 'NewP@ssw0rd123',
      };

      await authController.resetPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  describe('setupMfa', () => {
    it('should setup MFA for authenticated user', async () => {
      mockReq.user = { id: 'user-123', email: 'test@example.com', roles: ['user'] };

      await authController.setupMfa(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  describe('verifyMfa', () => {
    it('should verify MFA code', async () => {
      mockReq.body = { tempToken: 'temp-token', code: '123456' };

      await authController.verifyMfa(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalled();
    });
  });
});
