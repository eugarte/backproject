import { SignJWT, importPKCS8, importSPKI, jwtVerify } from 'jose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions?: string[];
  jti: string;
  iat?: number;
  exp?: number;
  type?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JwtService {
  private privateKey: string;
  private publicKey: string;
  private accessExpiration: string;
  private refreshExpiration: string;
  private issuer: string;
  private audience: string;

  constructor(privateKey?: string, publicKey?: string) {
    if (privateKey && publicKey) {
      this.privateKey = privateKey;
      this.publicKey = publicKey;
    } else {
      const keysPath = process.env.JWT_KEYS_PATH || './keys';
      
      try {
        this.privateKey = readFileSync(join(keysPath, 'private.pem'), 'utf8');
        this.publicKey = readFileSync(join(keysPath, 'public.pem'), 'utf8');
      } catch (error) {
        logger.warn('JWT keys not found, using environment variables...');
        this.privateKey = process.env.JWT_PRIVATE_KEY || '';
        this.publicKey = process.env.JWT_PUBLIC_KEY || '';
      }
    }

    this.accessExpiration = process.env.JWT_ACCESS_EXPIRATION || '15m';
    this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
    this.issuer = process.env.JWT_ISSUER || 'msseguridad';
    this.audience = process.env.JWT_AUDIENCE || 'msseguridad-api';
  }

  async sign(payload: Record<string, any>, options: { expiresIn: string }): Promise<string> {
    const privateKey = await importPKCS8(this.privateKey, 'RS256');
    
    const jwt = new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime(options.expiresIn)
      .setIssuer(this.issuer)
      .setAudience(this.audience);

    return await jwt.sign(privateKey);
  }

  async generateTokens(userId: string, email: string, roles: string[]): Promise<Tokens> {
    const jti = uuidv4();
    
    const accessPayload: TokenPayload = {
      sub: userId,
      email,
      roles,
      jti,
    };

    const accessToken = await this.sign(accessPayload, { expiresIn: this.accessExpiration });

    const refreshToken = await this.sign(
      { sub: userId, jti: uuidv4(), type: 'refresh' },
      { expiresIn: this.refreshExpiration }
    );

    // Calculate expiresIn in seconds
    const expiresInMatch = this.accessExpiration.match(/^(\d+)([mhd])$/);
    let expiresIn = 900; // default 15 min
    if (expiresInMatch) {
      const value = parseInt(expiresInMatch[1]);
      const unit = expiresInMatch[2];
      switch (unit) {
        case 'm': expiresIn = value * 60; break;
        case 'h': expiresIn = value * 3600; break;
        case 'd': expiresIn = value * 86400; break;
      }
    }

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const publicKey = await importSPKI(this.publicKey, 'RS256');
    
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: this.issuer,
      audience: this.audience,
    });

    return payload as unknown as TokenPayload;
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(json) as TokenPayload;
    } catch {
      return null;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const payload = await this.verifyToken(refreshToken);
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const accessPayload: TokenPayload = {
      sub: payload.sub,
      email: payload.email || '',
      roles: payload.roles || [],
      jti: uuidv4(),
    };

    const accessToken = await this.sign(accessPayload, { expiresIn: this.accessExpiration });

    // Calculate expiresIn
    const expiresInMatch = this.accessExpiration.match(/^(\d+)([mhd])$/);
    let expiresIn = 900;
    if (expiresInMatch) {
      const value = parseInt(expiresInMatch[1]);
      const unit = expiresInMatch[2];
      switch (unit) {
        case 'm': expiresIn = value * 60; break;
        case 'h': expiresIn = value * 3600; break;
        case 'd': expiresIn = value * 86400; break;
      }
    }

    return {
      accessToken,
      expiresIn,
    };
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload?.exp) return true;
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  getTokenRemainingTime(token: string): number {
    try {
      const payload = this.decodeToken(token);
      if (!payload?.exp) return 0;
      return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    } catch {
      return 0;
    }
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    return await this.sign(
      { sub: userId, type: 'password_reset', jti: uuidv4() },
      { expiresIn: '1h' }
    );
  }

  async generateEmailVerificationToken(userId: string): Promise<string> {
    return await this.sign(
      { sub: userId, type: 'email_verification', jti: uuidv4() },
      { expiresIn: '24h' }
    );
  }

  async verifyPasswordResetToken(token: string): Promise<string> {
    const payload = await this.verifyToken(token);
    if (payload.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    return payload.sub;
  }

  async verifyEmailVerificationToken(token: string): Promise<string> {
    const payload = await this.verifyToken(token);
    if (payload.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }
    return payload.sub;
  }
}