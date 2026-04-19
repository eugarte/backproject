import { JwtService } from '@infrastructure/services/jwt.service';
import * as jose from 'jose';

jest.mock('jose');

describe('JwtService', () => {
  let jwtService: JwtService;
  const mockPrivateKey = 'mock-private-key';
  const mockPublicKey = 'mock-public-key';

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService = new JwtService(mockPrivateKey, mockPublicKey);
  });

  describe('sign', () => {
    it('should sign a token with payload', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('signed-token'),
      };
      
      (jose.SignJWT as jest.Mock).mockImplementation(() => mockSignJWT);
      (jose.importPKCS8 as jest.Mock).mockResolvedValue('imported-key');

      const payload = { sub: 'user-123', email: 'test@example.com' };
      const result = await jwtService.sign(payload, { expiresIn: '1h' });

      expect(jose.importPKCS8).toHaveBeenCalledWith(mockPrivateKey, 'RS256');
      expect(result).toBe('signed-token');
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('mock-token'),
      };
      
      (jose.SignJWT as jest.Mock).mockImplementation(() => mockSignJWT);
      (jose.importPKCS8 as jest.Mock).mockResolvedValue('imported-key');

      const result = await jwtService.generateTokens(
        'user-123',
        'test@example.com',
        ['user', 'admin']
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
        jti: 'token-id',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

      const result = await jwtService.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should throw error for invalid token', async () => {
      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(jwtService.verifyToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = 'header.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature';
      const result = jwtService.decodeToken(token);

      expect(result).toHaveProperty('sub');
    });

    it('should return null for invalid token', () => {
      const result = jwtService.decodeToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = 'header.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.signature';
      expect(jwtService.isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = 'header.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })).toString('base64url') + '.signature';
      expect(jwtService.isTokenExpired(token)).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockPayload = {
        sub: 'user-123',
        type: 'refresh',
        jti: 'refresh-token-id',
      };

      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('new-access-token'),
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });
      (jose.importPKCS8 as jest.Mock).mockResolvedValue('imported-key');
      (jose.SignJWT as jest.Mock).mockImplementation(() => mockSignJWT);

      const result = await jwtService.refreshAccessToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw error for non-refresh token', async () => {
      const mockPayload = {
        sub: 'user-123',
        type: 'access',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

      await expect(jwtService.refreshAccessToken('access-token')).rejects.toThrow('Invalid token type');
    });
  });

  describe('getTokenRemainingTime', () => {
    it('should return remaining time for valid token', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = 'header.' + Buffer.from(JSON.stringify({ exp })).toString('base64url') + '.signature';
      const result = jwtService.getTokenRemainingTime(token);

      expect(result).toBeGreaterThan(3500);
      expect(result).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const exp = Math.floor(Date.now() / 1000) - 3600;
      const token = 'header.' + Buffer.from(JSON.stringify({ exp })).toString('base64url') + '.signature';
      const result = jwtService.getTokenRemainingTime(token);

      expect(result).toBe(0);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate password reset token', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('reset-token'),
      };

      (jose.importPKCS8 as jest.Mock).mockResolvedValue('imported-key');
      (jose.SignJWT as jest.Mock).mockImplementation(() => mockSignJWT);

      const result = await jwtService.generatePasswordResetToken('user-123');

      expect(result).toBe('reset-token');
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate email verification token', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('verification-token'),
      };

      (jose.importPKCS8 as jest.Mock).mockResolvedValue('imported-key');
      (jose.SignJWT as jest.Mock).mockImplementation(() => mockSignJWT);

      const result = await jwtService.generateEmailVerificationToken('user-123');

      expect(result).toBe('verification-token');
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify password reset token and return userId', async () => {
      const mockPayload = {
        sub: 'user-123',
        type: 'password_reset',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

      const result = await jwtService.verifyPasswordResetToken('reset-token');

      expect(result).toBe('user-123');
    });

    it('should throw error for non-password-reset token', async () => {
      const mockPayload = {
        sub: 'user-123',
        type: 'access',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

      await expect(jwtService.verifyPasswordResetToken('access-token')).rejects.toThrow('Invalid token type');
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('should verify email verification token and return userId', async () => {
      const mockPayload = {
        sub: 'user-123',
        type: 'email_verification',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

      const result = await jwtService.verifyEmailVerificationToken('verification-token');

      expect(result).toBe('user-123');
    });

    it('should throw error for non-email-verification token', async () => {
      const mockPayload = {
        sub: 'user-123',
        type: 'access',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('imported-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

      await expect(jwtService.verifyEmailVerificationToken('access-token')).rejects.toThrow('Invalid token type');
    });
  });
});