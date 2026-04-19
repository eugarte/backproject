import { RefreshToken, TokenStatus } from '@domain/entities/refresh-token';

describe('RefreshToken Entity', () => {
  let token: RefreshToken;

  beforeEach(() => {
    token = new RefreshToken();
    token.id = 'token-1';
    token.userId = 'user-1';
    token.tokenHash = 'hashed-token-string';
    token.familyId = 'family-1';
    token.status = TokenStatus.ACTIVE;
    token.isRevoked = false;
    token.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    token.createdAt = new Date();
  });

  describe('basic properties', () => {
    it('should have id property', () => {
      expect(token.id).toBe('token-1');
    });

    it('should have userId', () => {
      expect(token.userId).toBe('user-1');
    });

    it('should have tokenHash', () => {
      expect(token.tokenHash).toBe('hashed-token-string');
    });

    it('should have familyId', () => {
      expect(token.familyId).toBe('family-1');
    });
  });

  describe('status', () => {
    it('should have ACTIVE status by default', () => {
      expect(token.status).toBe(TokenStatus.ACTIVE);
    });

    it('should change to REVOKED', () => {
      token.status = TokenStatus.REVOKED;
      token.isRevoked = true;
      expect(token.status).toBe(TokenStatus.REVOKED);
    });

    it('should check if valid', () => {
      expect(token.isValid()).toBe(true);
    });

    it('should not be valid if revoked', () => {
      token.isRevoked = true;
      token.status = TokenStatus.REVOKED;
      expect(token.isValid()).toBe(false);
    });

    it('should not be valid if expired', () => {
      token.expiresAt = new Date(Date.now() - 1000);
      expect(token.isValid()).toBe(false);
    });
  });

  describe('expiration', () => {
    it('should check if expired', () => {
      token.expiresAt = new Date(Date.now() - 1000);
      expect(token.isExpired()).toBe(true);
    });

    it('should not be expired if future date', () => {
      expect(token.isExpired()).toBe(false);
    });
  });

  describe('revoke', () => {
    it('should revoke with reason', () => {
      token.revoke('User logout');
      expect(token.isRevoked).toBe(true);
      expect(token.status).toBe(TokenStatus.REVOKED);
      expect(token.revokedReason).toBe('User logout');
      expect(token.revokedAt).toBeInstanceOf(Date);
    });
  });
});
