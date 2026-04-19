import { Request, Response, NextFunction } from 'express';
import { AuditLogRepository } from '@infrastructure/persistence/repositories/AuditLogRepository';
import { AuditLog, AuditActorType } from '@domain/entities/AuditLog';
import { AuthRequest } from './AuthMiddleware';

const auditRepository = new AuditLogRepository();

export const auditMiddleware = (entityType: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original end function
    const originalEnd = res.end.bind(res);
    
    // Override end to capture response
    res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
      // Restore original end
      res.end = originalEnd;
      
      // Log if successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const auditLog = new AuditLog({
          entityType: entityType as any,
          entityId: req.params.id || req.body.id || 'unknown',
          action,
          actor: req.user?.userId,
          actorType: req.user ? AuditActorType.USER : AuditActorType.SERVICE,
          ipAddress: req.ip,
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
          },
        });
        
        // Fire and forget - don't block response
        auditRepository.save(auditLog).catch(console.error);
      }
      
      return originalEnd(chunk, encoding, cb);
    };
    
    next();
  };
};
