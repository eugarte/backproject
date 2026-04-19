import { AppDataSource } from '../../infrastructure/persistence/config/data-source';
import { DeliveryStatusRepository } from '../../infrastructure/persistence/repositories/DeliveryStatusRepository';

/**
 * Delivery Status - Obtiene valores del catálogo 'delivery_status' de la base de datos local
 * Fallback a valores por defecto si la BD no está disponible
 */
export class DeliveryStatusCatalog {
  private static repository: DeliveryStatusRepository | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    PENDING: 'pending',
    QUEUED: 'queued',
    SENDING: 'sending',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    RETRYING: 'retrying',
    CANCELLED: 'cancelled',
  };

  static initializeRepository(dataSource = AppDataSource): void {
    if (dataSource.isInitialized) {
      DeliveryStatusCatalog.repository = new DeliveryStatusRepository(dataSource);
    }
  }

  static async initialize(): Promise<void> {
    if (DeliveryStatusCatalog.initialized) return;

    try {
      if (!DeliveryStatusCatalog.repository && AppDataSource.isInitialized) {
        DeliveryStatusCatalog.initializeRepository();
      }

      if (DeliveryStatusCatalog.repository) {
        const codes = ['PENDING', 'QUEUED', 'SENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'CANCELLED'];
        const values = await DeliveryStatusCatalog.repository.findByCodes(codes);
        
        // Verificar que values sea un Map válido
        if (values && values instanceof Map && values.size > 0) {
          DeliveryStatusCatalog.cachedValues.clear();
          values.forEach((value, key) => {
            DeliveryStatusCatalog.cachedValues.set(key, value);
          });
          console.log('[DeliveryStatusCatalog] Loaded from database:', Array.from(DeliveryStatusCatalog.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[DeliveryStatusCatalog] Failed to load from database, using defaults:', error);
    }

    DeliveryStatusCatalog.initialized = true;
  }

  static get PENDING(): string {
    return DeliveryStatusCatalog.cachedValues.get('PENDING') || DeliveryStatusCatalog.DEFAULT_VALUES.PENDING;
  }

  static get QUEUED(): string {
    return DeliveryStatusCatalog.cachedValues.get('QUEUED') || DeliveryStatusCatalog.DEFAULT_VALUES.QUEUED;
  }

  static get SENDING(): string {
    return DeliveryStatusCatalog.cachedValues.get('SENDING') || DeliveryStatusCatalog.DEFAULT_VALUES.SENDING;
  }

  static get DELIVERED(): string {
    return DeliveryStatusCatalog.cachedValues.get('DELIVERED') || DeliveryStatusCatalog.DEFAULT_VALUES.DELIVERED;
  }

  static get FAILED(): string {
    return DeliveryStatusCatalog.cachedValues.get('FAILED') || DeliveryStatusCatalog.DEFAULT_VALUES.FAILED;
  }

  static get RETRYING(): string {
    return DeliveryStatusCatalog.cachedValues.get('RETRYING') || DeliveryStatusCatalog.DEFAULT_VALUES.RETRYING;
  }

  static get CANCELLED(): string {
    return DeliveryStatusCatalog.cachedValues.get('CANCELLED') || DeliveryStatusCatalog.DEFAULT_VALUES.CANCELLED;
  }

  static async validate(code: string): Promise<boolean> {
    if (!DeliveryStatusCatalog.initialized) {
      await DeliveryStatusCatalog.initialize();
    }

    if (DeliveryStatusCatalog.repository) {
      try {
        const isValid = await DeliveryStatusCatalog.repository.validateCode(code);
        if (typeof isValid === 'boolean') {
          return isValid;
        }
      } catch (error) {
        console.warn('[DeliveryStatusCatalog] Repository validation failed, using defaults');
      }
    }

    return Object.values(DeliveryStatusCatalog.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (DeliveryStatusCatalog.cachedValues.size > 0) {
      return Array.from(DeliveryStatusCatalog.cachedValues.values());
    }
    return Object.values(DeliveryStatusCatalog.DEFAULT_VALUES);
  }

  static reset(): void {
    DeliveryStatusCatalog.cachedValues.clear();
    DeliveryStatusCatalog.initialized = false;
    DeliveryStatusCatalog.repository = null;
  }
}