import { SystemClient, CatalogValue } from '../../infrastructure/system/SystemClient';

/**
 * Notification Type - Obtiene valores del catálogo 'notification_types' de mssistemas
 * Fallback a valores por defecto si mssistemas no está disponible
 */
export class NotificationTypeCatalog {
  private static client: SystemClient | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    IN_APP: 'in_app',
  };

  static setClient(client: SystemClient): void {
    NotificationTypeCatalog.client = client;
  }

  static async initialize(): Promise<void> {
    if (NotificationTypeCatalog.initialized) return;

    try {
      if (NotificationTypeCatalog.client) {
        const values = await NotificationTypeCatalog.client.getCatalogValues('notification_types');
        if (values.length > 0) {
          NotificationTypeCatalog.cachedValues.clear();
          values.forEach((v: CatalogValue) => {
            NotificationTypeCatalog.cachedValues.set(v.code.toUpperCase(), v.code);
          });
          console.log('[NotificationTypeCatalog] Loaded from mssistemas:', Array.from(NotificationTypeCatalog.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[NotificationTypeCatalog] Failed to load from mssistemas, using defaults:', error);
    }

    NotificationTypeCatalog.initialized = true;
  }

  static get EMAIL(): string {
    return NotificationTypeCatalog.cachedValues.get('EMAIL') || NotificationTypeCatalog.DEFAULT_VALUES.EMAIL;
  }

  static get SMS(): string {
    return NotificationTypeCatalog.cachedValues.get('SMS') || NotificationTypeCatalog.DEFAULT_VALUES.SMS;
  }

  static get PUSH(): string {
    return NotificationTypeCatalog.cachedValues.get('PUSH') || NotificationTypeCatalog.DEFAULT_VALUES.PUSH;
  }

  static get IN_APP(): string {
    return NotificationTypeCatalog.cachedValues.get('IN_APP') || NotificationTypeCatalog.DEFAULT_VALUES.IN_APP;
  }

  static async validate(code: string): Promise<boolean> {
    if (!NotificationTypeCatalog.initialized) {
      await NotificationTypeCatalog.initialize();
    }

    if (NotificationTypeCatalog.client) {
      return await NotificationTypeCatalog.client.validateCatalogValue('notification_types', code);
    }

    return Object.values(NotificationTypeCatalog.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (NotificationTypeCatalog.cachedValues.size > 0) {
      return Array.from(NotificationTypeCatalog.cachedValues.values());
    }
    return Object.values(NotificationTypeCatalog.DEFAULT_VALUES);
  }
}
