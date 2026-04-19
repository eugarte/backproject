-- =====================================================
-- Base de Datos: u755818637_dbseguridad
-- Microservicio: msseguridad (Seguridad y Autenticación)
-- Hostinger MySQL
-- Fecha: 2026-04-19
-- =====================================================

USE u755818637_dbseguridad;

-- =====================================================
-- CATÁLOGOS LOCALES (Reemplazan dependencia de mssistemas)
-- =====================================================

-- Catálogo: Roles de Usuario
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo: Estados de Usuario
CREATE TABLE IF NOT EXISTS user_status (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES PARA CATÁLOGOS
-- =====================================================

INSERT INTO user_roles (code, name, description, permissions, is_active, display_order) VALUES
    ('ADMIN', 'Administrador', 'Acceso completo al sistema', '["*"]', TRUE, 1),
    ('USER', 'Usuario', 'Usuario estándar del sistema', '["read", "profile:edit"]', TRUE, 2),
    ('MODERATOR', 'Moderador', 'Usuario con privilegios de moderación', '["read", "moderate", "content:edit"]', TRUE, 3),
    ('GUEST', 'Invitado', 'Usuario invitado con acceso limitado', '["read:public"]', TRUE, 4),
    ('DEVELOPER', 'Desarrollador', 'Usuario con acceso a funciones de desarrollo', '["read", "write", "debug", "api:access"]', TRUE, 5),
    ('SUPPORT', 'Soporte', 'Equipo de soporte al cliente', '["read", "support:tickets", "user:view"]', TRUE, 6);

INSERT INTO user_status (code, name, description, is_active, display_order) VALUES
    ('ACTIVE', 'Activo', 'Usuario activo y habilitado', TRUE, 1),
    ('INACTIVE', 'Inactivo', 'Usuario deshabilitado temporalmente', TRUE, 2),
    ('SUSPENDED', 'Suspendido', 'Usuario suspendido por violación de políticas', TRUE, 3),
    ('PENDING', 'Pendiente', 'Usuario pendiente de verificación de email', TRUE, 4),
    ('BANNED', 'Baneado', 'Usuario permanentemente baneado', TRUE, 5),
    ('LOCKED', 'Bloqueado', 'Usuario bloqueado por intentos fallidos', TRUE, 6);

-- =====================================================
-- TABLA PRINCIPAL: users (Usuarios)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Información de login
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Perfil
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    
    -- Estado
    status VARCHAR(50) DEFAULT 'PENDING',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP,
    
    -- MFA (Multi-Factor Authentication)
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes JSON,
    
    -- Seguridad
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_password_change TIMESTAMP,
    password_history JSON,
    
    -- Sesiones
    last_login_at TIMESTAMP NULL,
    last_login_ip VARCHAR(45),
    last_login_user_agent VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Índices
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: user_roles_mapping (Asignación de Roles)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles_mapping (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(36),
    expires_at TIMESTAMP NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_role (role_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: refresh_tokens (Tokens de Refresco JWT)
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Token
    token_hash VARCHAR(255) NOT NULL,
    family_id VARCHAR(36) NOT NULL,
    
    -- Estado
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    revoked_reason VARCHAR(255),
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- Seguridad
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_family (family_id),
    INDEX idx_expires (expires_at),
    INDEX idx_revoked (is_revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: user_sessions (Sesiones Activas)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Sesión
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    -- Dispositivo/Cliente
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    device_fingerprint VARCHAR(255),
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP NULL,
    logout_reason VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_token),
    INDEX idx_active (is_active),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: permissions (Permisos Detallados)
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_key (permission_key),
    INDEX idx_resource (resource),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: role_permissions (Permisos por Rol)
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(36),
    conditions JSON,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: audit_logs (Registro de Auditoría)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    
    -- Acción
    action VARCHAR(50) NOT NULL,
    action_category ENUM('auth', 'user', 'security', 'data', 'system') NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36),
    
    -- Detalles
    details JSON,
    old_values JSON,
    new_values JSON,
    
    -- Contexto
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    session_id VARCHAR(36),
    request_id VARCHAR(36),
    
    -- Resultado
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_category (action_category),
    INDEX idx_resource (resource, resource_id),
    INDEX idx_created (created_at),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: password_reset_tokens (Tokens de Recuperación)
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES: Usuarios y Permisos
-- =====================================================

-- Permisos básicos
INSERT INTO permissions (permission_key, name, description, resource, action) VALUES
('users:read', 'Ver usuarios', 'Permite ver información de usuarios', 'users', 'read'),
('users:create', 'Crear usuarios', 'Permite crear nuevos usuarios', 'users', 'create'),
('users:update', 'Editar usuarios', 'Permite modificar usuarios', 'users', 'update'),
('users:delete', 'Eliminar usuarios', 'Permite eliminar usuarios', 'users', 'delete'),
('roles:manage', 'Gestionar roles', 'Permite gestionar roles y permisos', 'roles', 'manage'),
('system:admin', 'Administración del sistema', 'Acceso completo al sistema', 'system', 'admin');

-- Usuario admin de ejemplo (password: Admin123!)
INSERT INTO users (id, email, password_hash, first_name, last_name, status, email_verified) VALUES
('user-admin-001', 'admin@aiproject.es', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G', 'Admin', 'Sistema', 'ACTIVE', TRUE);

-- Asignar rol ADMIN al usuario admin
INSERT INTO user_roles_mapping (user_id, role_id)
SELECT 'user-admin-001', id FROM user_roles WHERE code = 'ADMIN';
