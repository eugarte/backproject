import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../../infrastructure/services/jwt.service';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; roles: string[]; permissions?: string[] };
    }
  }
}

const jwtService = new JwtService();

/**
 * Middleware to authenticate JWT token
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = undefined;
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token format' });
    return;
  }

  const token = parts[1];

  try {
    const payload = await jwtService.verifyToken(token);
    
    req.user = {
      id: payload.sub,
      email: payload.email || '',
      roles: payload.roles || [],
      permissions: (payload as any).permissions || [],
    };
    
    next();
  } catch (error: any) {
    const message = error.message || '';
    
    if (message.toLowerCase().includes('expired')) {
      res.status(401).json({ error: 'Unauthorized', message: 'Token has expired' });
    } else {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    return;
  }
  next();
}

/**
 * Middleware factory to require specific role(s)
 */
export function requireRole(roles: string | string[]) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }
    
    const hasRole = req.user.roles.some(role => requiredRoles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

/**
 * Middleware factory to require specific permission(s)
 */
export function requirePermission(permissions: string | string[]) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermissions = requiredPermissions.every(p => userPermissions.includes(p));
    
    if (!hasPermissions) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Missing required permission: ${requiredPermissions.join(', ')}` 
      });
      return;
    }
    
    next();
  };
}

// Export alias for backward compatibility
export { authMiddleware as authenticateToken };
