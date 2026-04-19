import { LRUCache } from 'lru-cache';
import { logger } from '../services/logger';

// Cache en memoria con TTL
const memoryCache = new LRUCache({
  max: 5000,                    // máximo de items
  ttl: 1000 * 60 * 60,        // 1 hora por defecto
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

// Para rate limiting (separado, TTL más corto)
const rateLimitCache = new LRUCache({
  max: 10000,
  ttl: 1000 * 60 * 15,        // 15 minutos ventana rate limit
});

export const cacheClient = {
  // Sesiones temporales (caché, no persistente)
  async getSession(sessionId: string): Promise<any> {
    const data = memoryCache.get(`session:${sessionId}`);
    return data || null;
  },

  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    memoryCache.set(`session:${sessionId}`, data, { ttl: ttl * 1000 });
  },

  async deleteSession(sessionId: string): Promise<void> {
    memoryCache.delete(`session:${sessionId}`);
  },

  // Rate limiting (en memoria, reinicio = reset)
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const current = (rateLimitCache.get(key) as number) || 0;
    const next = current + 1;
    rateLimitCache.set(key, next, { ttl: windowSeconds * 1000 });
    return next;
  },

  async getRateLimitCount(key: string): Promise<number> {
    return (rateLimitCache.get(key) as number) || 0;
  },

  // Token blacklist temporal (hasta expiración JWT)
  // NOTA: Para producción multi-instance, usar MySQL
  async blacklistToken(tokenId: string, expiresIn: number): Promise<void> {
    memoryCache.set(`blacklist:${tokenId}`, '1', { ttl: expiresIn * 1000 });
    logger.info(`Token blacklisted in memory cache`, { tokenId });
  },

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    return memoryCache.has(`blacklist:${tokenId}`);
  },

  // Utilidades
  clear(): void {
    memoryCache.clear();
    rateLimitCache.clear();
    logger.info('Memory caches cleared');
  },

  getStats() {
    return {
      cache: memoryCache.size,
      rateLimit: rateLimitCache.size,
    };
  },
};

// Compatibilidad con código existente (export legacy names)
export const redisClient = cacheClient;
export default cacheClient;
