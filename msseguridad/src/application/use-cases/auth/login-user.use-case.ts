import { UserStatus } from '../../../domain/enums/UserStatus';
import { RefreshToken } from '../../../domain/entities/refresh-token';
import { UserRepository } from '../../../domain/repositories/user-repository.interface';
import { JwtService } from '../../../infrastructure/services/jwt.service';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

interface Result<T> {
  isSuccess(): boolean;
  isFailure(): boolean;
  getValue(): T | null;
  getError(): Error | null;
}

class SuccessResult<T> implements Result<T> {
  constructor(private value: T) {}
  isSuccess(): boolean { return true; }
  isFailure(): boolean { return false; }
  getValue(): T { return this.value; }
  getError(): null { return null; }
}

class FailureResult<T> implements Result<T> {
  constructor(private error: Error) {}
  isSuccess(): boolean { return false; }
  isFailure(): boolean { return true; }
  getValue(): null { return null; }
  getError(): Error { return this.error; }
}

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresMfa?: boolean;
}

// Simple token repository interface for the use case
interface TokenRepository {
  save(token: RefreshToken): Promise<RefreshToken>;
  revokeFamily?(familyId: string): Promise<void>;
}

export class LoginUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private tokenRepository: TokenRepository,
    private jwtService: JwtService
  ) {}

  async execute(input: LoginInput): Promise<Result<LoginOutput>> {
    try {
      // Find user
      const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
      
      if (!user) {
        return new FailureResult(new Error('Invalid credentials'));
      }

      // Check if locked
      if (user.isLocked()) {
        return new FailureResult(new Error('Account is locked. Try again later.'));
      }

      // Check status
      if (user.status !== UserStatus.ACTIVE) {
        return new FailureResult(new Error('Account is not active'));
      }

      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash).catch(() => false);
      
      if (!isValidPassword) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        
        // Lock after 5 failed attempts
        if (user.failedAttempts >= 5) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + 30);
          user.lockedUntil = lockUntil;
        }
        
        if (this.userRepository.update) {
          await this.userRepository.update(user);
        }
        
        return new FailureResult(new Error('Invalid credentials'));
      }

      // Check MFA
      if (user.mfaEnabled) {
        return new SuccessResult({
          accessToken: '',
          refreshToken: '',
          expiresIn: 0,
          requiresMfa: true,
        });
      }

      // Reset failed attempts
      user.failedAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date();
      
      if (this.userRepository.update) {
        await this.userRepository.update(user);
      }

      // Generate tokens
      const tokens = await this.jwtService.generateTokens(
        user.id,
        user.email,
        user.roles?.map(r => r.slug) || []
      );

      // Save refresh token
      const refreshToken = new RefreshToken();
      refreshToken.id = uuidv4();
      refreshToken.userId = user.id;
      refreshToken.tokenHash = await bcrypt.hash(tokens.refreshToken, 12);
      refreshToken.familyId = uuidv4();
      refreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      refreshToken.ipAddress = input.ipAddress || null;
      refreshToken.userAgent = input.userAgent || null;
      refreshToken.isRevoked = false;
      
      await this.tokenRepository.save(refreshToken);

      return new SuccessResult({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error: any) {
      return new FailureResult(new Error(error.message || 'Login failed'));
    }
  }
}