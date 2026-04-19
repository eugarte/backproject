import { RefreshToken } from '../entities/refresh-token';

export interface ITokenRepository {
  findById(id: string): Promise<RefreshToken | null>;
  findByTokenHash(hash: string): Promise<RefreshToken | null>;
  findByFamilyId(familyId: string): Promise<RefreshToken[]>;
  findActiveByUserId(userId: string): Promise<RefreshToken[]>;
  save(token: RefreshToken): Promise<RefreshToken>;
  revoke(id: string, reason: string): Promise<void>;
  revokeFamily(familyId: string, reason: string): Promise<void>;
  revokeAllUserTokens(userId: string, reason: string): Promise<void>;
  deleteExpired(): Promise<number>;
}