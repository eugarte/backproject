import { LoginUserUseCase } from '@application/use-cases/auth/login-user.use-case';
import { UserRepository } from '@domain/repositories/user-repository.interface';
import { User, UserStatus } from '@domain/entities/user';
import { JwtService } from '@infrastructure/services/jwt.service';
import bcrypt from 'bcrypt';

// Simple token repository interface for the use case
interface TokenRepository {
  save(token: any): Promise<any>;
  revokeFamily?(familyId: string): Promise<void>;
}

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokenRepository: jest.Mocked<TokenRepository>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockTokenRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<TokenRepository>;

    mockJwtService = {
      generateTokens: jest.fn(),
      verifyToken: jest.fn(),
      sign: jest.fn(),
      decodeToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      isTokenExpired: jest.fn(),
      getTokenRemainingTime: jest.fn(),
      generatePasswordResetToken: jest.fn(),
      generateEmailVerificationToken: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
      verifyEmailVerificationToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    useCase = new LoginUserUseCase(
      mockUserRepository,
      mockTokenRepository,
      mockJwtService
    );
  });

  describe('execute', () => {
    it('should login with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('ValidP@ssw0rd123', 12);
      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';
      user.passwordHash = passwordHash;
      user.status = UserStatus.ACTIVE;
      user.failedAttempts = 0;
      user.mfaEnabled = false;
      user.roles = [];

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockJwtService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      });

      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidP@ssw0rd123',
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const value = result.getValue();
        expect(value?.accessToken).toBe('access-token');
        expect(value?.refreshToken).toBe('refresh-token');
      }
    });

    it('should throw error for invalid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await useCase.execute({
        email: 'nonexistent@example.com',
        password: 'password',
      });

      expect(result.isFailure()).toBe(true);
    });

    it('should throw error for inactive user', async () => {
      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';
      user.passwordHash = 'hashed-password';
      user.status = UserStatus.PENDING;

      mockUserRepository.findByEmail.mockResolvedValue(user);

      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'ValidP@ssw0rd123',
      });

      expect(result.isFailure()).toBe(true);
    });
  });
});