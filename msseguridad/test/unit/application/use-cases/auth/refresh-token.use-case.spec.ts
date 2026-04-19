import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { ITokenRepository } from '@domain/repositories/token-repository.interface';
import { UserRepository } from '@domain/repositories/user-repository.interface';
import { JwtService } from '@infrastructure/services/jwt.service';
import { RefreshToken } from '@domain/entities/refresh-token';
import { User, UserStatus } from '@domain/entities/user';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockTokenRepository: jest.Mocked<ITokenRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    useCase = new RefreshTokenUseCase();
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    it('should have execute method', () => {
      expect(typeof useCase.execute).toBe('function');
    });
  });
});
