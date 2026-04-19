import { LogoutUserRequest } from '@application/dtos/auth.dto';
import { AppDataSource } from '@infrastructure/config/database';
import { RefreshToken, TokenStatus } from '@domain/entities/refresh-token';
import { AuditLog, AuditAction, AuditStatus } from '@domain/entities/audit-log';
import { cacheClient } from '@infrastructure/config/cache';
import bcrypt from 'bcrypt';
import { logger } from '@infrastructure/services/logger';

export class LogoutUserUseCase {
  async execute(request: LogoutUserRequest): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(RefreshToken);
    const auditLogRepository = AppDataSource.getRepository(AuditLog);
    
    try {
      if (request.allSessions) {
        await tokenRepository.update(
          { userId: request.userId, isRevoked: false },
          { 
            isRevoked: true, 
            status: TokenStatus.REVOKED,
            revokedReason: 'User logout from all sessions',
            revokedAt: new Date()
          }
        );
        
        // Clear user sessions from memory cache (single instance only)
        // NOTE: In multi-instance setup, this only clears local cache
        await cacheClient.deleteSession(`user:${request.userId}:*`);
        
        logger.info(`User ${request.userId} sessions cleared from local cache`);
        
        await auditLogRepository.save({
          userId: request.userId,
          action: AuditAction.LOGOUT,
          resource: 'auth',
          status: AuditStatus.SUCCESS,
          message: 'Logged out from all sessions',
        });
        
        logger.info(`User ${request.userId} logged out from all sessions`);
      } else if (request.refreshToken) {
        const tokens = await tokenRepository.find({
          where: { userId: request.userId, isRevoked: false },
        });
        
        for (const token of tokens) {
          if (await bcrypt.compare(request.refreshToken, token.tokenHash)) {
            token.isRevoked = true;
            token.status = TokenStatus.REVOKED;
            token.revokedReason = 'User logout';
            token.revokedAt = new Date();
            await tokenRepository.save(token);
            
            await auditLogRepository.save({
              userId: request.userId,
              action: AuditAction.LOGOUT,
              resource: 'auth',
              status: AuditStatus.SUCCESS,
              message: 'Logged out from single session',
            });
            
            logger.info(`User ${request.userId} logged out from single session`);
            break;
          }
        }
      }
    } catch (error) {
      logger.error('Logout error', { error, userId: request.userId });
      throw error;
    }
  }
}