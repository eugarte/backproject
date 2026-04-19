import { RefreshTokenRequest, RefreshTokenResponse } from '@application/dtos/auth.dto';
import { AppDataSource } from '@infrastructure/config/database';
import { RefreshToken, TokenStatus } from '@domain/entities/refresh-token';
import { AuditLog, AuditAction, AuditStatus } from '@domain/entities/audit-log';
import { JwtService } from '@infrastructure/services/jwt.service';
import { User } from '@domain/entities/user';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@infrastructure/services/logger';

export class RefreshTokenUseCase {
  private jwtService = new JwtService();
  
  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const tokenRepository = AppDataSource.getRepository(RefreshToken);
    const userRepository = AppDataSource.getRepository(User);
    const auditLogRepository = AppDataSource.getRepository(AuditLog);
    
    try {
      const tokens = await tokenRepository.find({
        where: { status: TokenStatus.ACTIVE },
        relations: ['user'],
      });
      
      let matchedToken: RefreshToken | null = null;
      for (const token of tokens) {
        if (await bcrypt.compare(request.refreshToken, token.tokenHash)) {
          matchedToken = token;
          break;
        }
      }
      
      if (!matchedToken) {
        throw new Error('Invalid refresh token');
      }
      
      if (matchedToken.isExpired()) {
        matchedToken.status = TokenStatus.EXPIRED;
        await tokenRepository.save(matchedToken as any);
        throw new Error('Refresh token expired');
      }
      
      if (matchedToken.isRevoked) {
        await tokenRepository.update(
          { familyId: matchedToken.familyId },
          { isRevoked: true, status: TokenStatus.REVOKED, revokedReason: 'Token reuse detected' }
        );
        await auditLogRepository.save({
          userId: matchedToken.userId,
          action: AuditAction.SECURITY_ALERT,
          resource: 'token',
          status: AuditStatus.WARNING,
          message: 'Token reuse detected - entire family revoked',
        });
        throw new Error('Token has been revoked');
      }
      
      const user = await userRepository.findOne({
        where: { id: matchedToken.userId },
        relations: ['roles'],
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      matchedToken.status = TokenStatus.USED;
      matchedToken.usedAt = new Date();
      await tokenRepository.save(matchedToken as any);
      
      const newTokens = await this.jwtService.generateTokens(
        user.id,
        user.email,
        user.roles?.map(r => r.slug) || []
      );
      
      const newRefreshToken = tokenRepository.create({
        id: uuidv4(),
        userId: user.id,
        tokenHash: await bcrypt.hash(newTokens.refreshToken, 12),
        familyId: matchedToken.familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await tokenRepository.save(newRefreshToken as any);
      
      await auditLogRepository.save({
        userId: user.id,
        action: AuditAction.TOKEN_REFRESH,
        resource: 'token',
        status: AuditStatus.SUCCESS,
      });
      
      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Token refresh error', { error });
      throw error;
    }
  }
}