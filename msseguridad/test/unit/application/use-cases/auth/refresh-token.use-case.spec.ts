import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { TokenRepository } from '@domain/repositories/token-repository.interface';
import { UserRepository } from '@domain/repositories/user-repository.interface';
import { JwtService } from '@infrastructure/services/jwt.service';
import { RefreshToken } from '@domain/entities/refresh-token';
import { User, UserStatus } from '@domain/entities/user';