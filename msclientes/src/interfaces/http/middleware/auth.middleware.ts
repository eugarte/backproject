import { Request, Response, NextFunction } from 'express';
import { JwtAuthService, JwtPayload } from '../../infrastructure/auth/jwt-auth.service';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      requestId?: string;
    }
  }
}

export const createAuthMiddleware = (authService: JwtAuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
        return;
      }

      const token = parts[1];
      const payload = authService.verifyToken(token);
      
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

export const requirePermission = (authService: JwtAuthService, permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!authService.hasPermission(req.user, permission)) {
      res.status(403).json({ error: `Permission required: ${permission}` });
      return;
    }

    next();
  };
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
