import { cacheClient } from '@infrastructure/config/cache';

describe('Cache Client', () => {
  beforeEach(() => {
    cacheClient.clear();
  });

  describe('session management', () => {
    it('should set and get session', async () => {
      await cacheClient.setSession('session-1', { userId: '123' }, 3600);
      const session = await cacheClient.getSession('session-1');
      expect(session).toEqual({ userId: '123' });
    });

    it('should return null for non-existent session', async () => {
      const session = await cacheClient.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('should delete session', async () => {
      await cacheClient.setSession('session-1', { userId: '123' }, 3600);
      await cacheClient.deleteSession('session-1');
      const session = await cacheClient.getSession('session-1');
      expect(session).toBeNull();
    });
  });

  describe('rate limiting', () => {
    it('should increment rate limit counter', async () => {
      const count1 = await cacheClient.incrementRateLimit('ip-1', 900);
      expect(count1).toBe(1);
      
      const count2 = await cacheClient.incrementRateLimit('ip-1', 900);
      expect(count2).toBe(2);
    });

    it('should get rate limit count', async () => {
      await cacheClient.incrementRateLimit('ip-1', 900);
      const count = await cacheClient.getRateLimitCount('ip-1');
      expect(count).toBe(1);
    });
  });

  describe('token blacklist', () => {
    it('should blacklist token', async () => {
      await cacheClient.blacklistToken('token-1', 3600);
      const isBlacklisted = await cacheClient.isTokenBlacklisted('token-1');
      expect(isBlacklisted).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      const isBlacklisted = await cacheClient.isTokenBlacklisted('token-2');
      expect(isBlacklisted).toBe(false);
    });
  });
});