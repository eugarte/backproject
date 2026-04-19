-- Migración de catálogos para msnotificaciones
-- Fecha: 2026-04-19
-- Descripción: Crea las tablas de catálogos locales para eliminar dependencia de mssistemas

-- ============================================
-- Tabla: notification_types
-- ============================================
CREATE TABLE IF NOT EXISTS notification_types (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notification_types_code (code),
    INDEX idx_notification_types_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: delivery_status
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_status (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_delivery_status_code (code),
    INDEX idx_delivery_status_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: priority_levels
-- ============================================
CREATE TABLE IF NOT EXISTS priority_levels (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_priority_levels_code (code),
    INDEX idx_priority_levels_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Datos iniciales: notification_types
-- ============================================
INSERT INTO notification_types (code, label, description, is_active, `order`) VALUES
    ('EMAIL', 'Email', 'Notificación por correo electrónico', TRUE, 1),
    ('SMS', 'SMS', 'Notificación por mensaje de texto', TRUE, 2),
    ('PUSH', 'Push', 'Notificación push móvil', TRUE, 3),
    ('IN_APP', 'In-App', 'Notificación dentro de la aplicación', TRUE, 4);

-- ============================================
-- Datos iniciales: delivery_status
-- ============================================
INSERT INTO delivery_status (code, label, description, is_active, `order`) VALUES
    ('PENDING', 'Pendiente', 'Notificación en cola pendiente', TRUE, 1),
    ('QUEUED', 'Encolada', 'Notificación encolada para envío', TRUE, 2),
    ('SENDING', 'Enviando', 'Notificación en proceso de envío', TRUE, 3),
    ('DELIVERED', 'Entregada', 'Notificación entregada exitosamente', TRUE, 4),
    ('FAILED', 'Fallida', 'Notificación con error de entrega', TRUE, 5),
    ('RETRYING', 'Reintentando', 'Notificación en reintento', TRUE, 6),
    ('CANCELLED', 'Cancelada', 'Notificación cancelada', TRUE, 7);

-- ============================================
-- Datos iniciales: priority_levels
-- ============================================
INSERT INTO priority_levels (code, label, description, is_active, `order`) VALUES
    ('LOW', 'Baja', 'Prioridad baja', TRUE, 1),
    ('MEDIUM', 'Media', 'Prioridad media', TRUE, 2),
    ('HIGH', 'Alta', 'Prioridad alta', TRUE, 3),
    ('CRITICAL', 'Crítica', 'Prioridad crítica', TRUE, 4);
