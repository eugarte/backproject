import { AppDataSource } from '../../infrastructure/persistence/config/data-source';
import { NotificationTypeRepository } from '../../infrastructure/persistence/repositories/NotificationTypeRepository';

/**
 * Notification Type - Obtiene valores del catálogo 'notification_types' de la base de datos local
 * Fallback a valores por defecto si la BD no está disponible
 */
export class NotificationTypeCatalog {
  private static repository: NotificationTypeRepository | null = null;
  private static cachedValues: Map<string, string> = new Map();
  private static initialized = false;

  // Valores por defecto (fallback)
  private static readonly DEFAULT_VALUES = {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    IN_APP: 'in_app',
  };

  static initializeRepository(dataSource = AppDataSource): void {
    if (dataSource.isInitialized) {
      NotificationTypeCatalog.repository = new NotificationTypeRepository(dataSource);
    }
  }

  static async initialize(): Promise<void> {
    if (NotificationTypeCatalog.initialized) return;

    try {
      if (!NotificationTypeCatalog.repository && AppDataSource.isInitialized) {
        NotificationTypeCatalog.initializeRepository();
      }

      if (NotificationTypeCatalog.repository) {
        const codes = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];
        const values = await NotificationTypeCatalog.repository.findByCodes(codes);
        
        // Verificar que values sea un Map válido
        if (values && values instanceof Map && values.size > 0) {
          NotificationTypeCatalog.cachedValues.clear();
          values.forEach((value, key) => {
            NotificationTypeCatalog.cachedValues.set(key, value);
          });
          console.log('[NotificationTypeCatalog] Loaded from database:', Array.from(NotificationTypeCatalog.cachedValues.entries()));
        }
      }
    } catch (error) {
      console.warn('[NotificationTypeCatalog] Failed to load from database, using defaults:', error);
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

    if (NotificationTypeCatalog.repository) {
      try {
        const isValid = await NotificationTypeCatalog.repository.validateCode(code);
        // Si el repositorio retorna un valor válido, usarlo; de lo contrario, usar defaults
        if (typeof isValid === 'boolean') {
          return isValid;
        }
      } catch (error) {
        // Si hay error en el repositorio, caer al fallback
        console.warn('[NotificationTypeCatalog] Repository validation failed, using defaults');
      }
    }

    return Object.values(NotificationTypeCatalog.DEFAULT_VALUES).includes(code);
  }

  static getAll(): string[] {
    if (NotificationTypeCatalog.cachedValues.size > 0) {
      return Array.from(NotificationTypeCatalog.cachedValues.values());
    }
    return Object.values(NotificationTypeCatalog.DEFAULT_VALUES);
  }

  static reset(): void {
    NotificationTypeCatalog.cachedValues.clear();
    NotificationTypeCatalog.initialized = false;
    NotificationTypeCatalog.repository = null;
  }
}