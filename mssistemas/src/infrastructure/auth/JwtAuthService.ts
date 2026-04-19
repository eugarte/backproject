import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  service?: string;
  iat?: number;
  exp?: number;
}

export class JwtAuthService {
  private secret: string;
  private issuer: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.issuer = process.env.JWT_ISSUER || 'msseguridad';
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string | number = '24h'): string {
    return jwt.sign(payload, this.secret, {
      issuer: this.issuer,
      expiresIn: expiresIn as any,
    });
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
    
    return null;
  }
}