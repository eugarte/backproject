import { SystemClient, CatalogValue } from '../../infrastructure/system/SystemClient';

/**
 * Delivery Status - Obtiene valores del catálogo 'delivery_status' de mssistemas
 * Fallback a valores por defecto si mssistemas no está disponible
 */
export class DeliveryStatusCatalog {
  private static client: SystemClient | null = null;
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

  static setClient(client: SystemClient): void {
    DeliveryStatusCatalog.client = client;
  }

  static async initialize(): Promise<void> {
    if (DeliveryStatusCatalog.initialized) return;

    try {
      if (DeliveryStatusCatalog.client) {
        const values = await DeliveryStatusCatalog.client.getCatalogValues('delivery_status');
        if (values.length > 0) {
          DeliveryStatusCatalog.cachedValues.clear();
          values.forEach((v: CatalogValue) => {
            DeliveryStatusCatalog.cachedValues.set(v.code.toUpperCase(), v.code);
          });
          console.log('[DeliveryStatusCatalog] Loaded from mssistemas:', Array.from(DeliveryStatusCatalog.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[DeliveryStatusCatalog] Failed to load from mssistemas, using defaults:', error);
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

    if (DeliveryStatusCatalog.client) {
      return await DeliveryStatusCatalog.client.validateCatalogValue('delivery_status', code);
    }

    return Object.values(DeliveryStatusCatalog.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (DeliveryStatusCatalog.cachedValues.size > 0) {
      return Array.from(DeliveryStatusCatalog.cachedValues.values());
    }
    return Object.values(DeliveryStatusCatalog.DEFAULT_VALUES);
  }
}
