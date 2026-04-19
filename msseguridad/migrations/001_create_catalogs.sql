-- Migración de catálogos para msseguridad
-- Fecha: 2026-04-19
-- Descripción: Crea las tablas de catálogos locales para eliminar dependencia de mssistemas

-- ============================================
-- Tabla: user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_roles_code (code),
    INDEX idx_user_roles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: user_status
-- ============================================
CREATE TABLE IF NOT EXISTS user_status (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_status_code (code),
    INDEX idx_user_status_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Datos iniciales: user_roles
-- ============================================
INSERT INTO user_roles (code, name, description, permissions, is_active, `order`) VALUES
    ('ADMIN', 'Administrador', 'Acceso completo al sistema', '["*"]', TRUE, 1),
    ('USER', 'Usuario', 'Usuario estándar del sistema', '["read"]', TRUE, 2),
    ('MODERATOR', 'Moderador', 'Usuario con privilegios de moderación', '["read", "moderate"]', TRUE, 3),
    ('GUEST', 'Invitado', 'Usuario invitado con acceso limitado', '["read:public"]', TRUE, 4),
    ('DEVELOPER', 'Desarrollador', 'Usuario con acceso a funciones de desarrollo', '["read", "write", "debug"]', TRUE, 5);

-- ============================================
-- Datos iniciales: user_status
-- ============================================
INSERT INTO user_status (code, name, description, is_active, `order`) VALUES
    ('ACTIVE', 'Activo', 'Usuario activo y habilitado', TRUE, 1),
    ('INACTIVE', 'Inactivo', 'Usuario deshabilitado temporalmente', TRUE, 2),
    ('SUSPENDED', 'Suspendido', 'Usuario suspendido por violación de políticas', TRUE, 3),
    ('PENDING', 'Pendiente', 'Usuario pendiente de verificación', TRUE, 4),
    ('BANNED', 'Baneado', 'Usuario permanentemente baneado', TRUE, 5);
