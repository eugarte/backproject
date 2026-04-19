-- =====================================================
-- Base de Datos: u755818637_dbsistemas
-- Microservicio: mssistemas (Configuración del Sistema)
-- Hostinger MySQL
-- Fecha: 2026-04-19
-- =====================================================

USE u755818637_dbsistemas;

-- =====================================================
-- TABLA: configurations (Configuraciones por Servicio)
-- =====================================================
CREATE TABLE IF NOT EXISTS configurations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    service_id VARCHAR(50),
    environment VARCHAR(50) DEFAULT 'production',
    config_key VARCHAR(100) NOT NULL,
    config_value JSON NOT NULL,
    value_type ENUM('string', 'number', 'boolean', 'json', 'array') DEFAULT 'string',
    description VARCHAR(255),
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_service_env_key (service_id, environment, config_key),
    INDEX idx_service (service_id),
    INDEX idx_environment (environment),
    INDEX idx_key (config_key),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: feature_flags (Banderas de Características)
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    
    -- Estrategia de activación
    strategy_type ENUM('boolean', 'percentage', 'user_list', 'time_based') DEFAULT 'boolean',
    strategy_config JSON,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    enabled_globally BOOLEAN DEFAULT FALSE,
    
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (flag_key),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: catalogs (Catálogos Genéricos)
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    catalog_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    service_id VARCHAR(50),
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (catalog_key),
    INDEX idx_service (service_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: catalog_values (Valores de Catálogos)
-- =====================================================
CREATE TABLE IF NOT EXISTS catalog_values (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    catalog_id VARCHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    display_order INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE,
    UNIQUE KEY uk_catalog_code (catalog_id, code),
    INDEX idx_catalog (catalog_id),
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: services (Registro de Microservicios)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    service_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    
    -- Endpoints
    base_url VARCHAR(255),
    health_check_url VARCHAR(255),
    api_version VARCHAR(20),
    
    -- Versión y estado
    version VARCHAR(50),
    status ENUM('active', 'inactive', 'deprecated', 'maintenance') DEFAULT 'active',
    
    -- Heartbeat
    last_heartbeat TIMESTAMP NULL,
    heartbeat_interval_seconds INT DEFAULT 60,
    
    -- Metadata
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (service_key),
    INDEX idx_status (status),
    INDEX idx_heartbeat (last_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: secrets (Credenciales y Secrets)
-- =====================================================
CREATE TABLE IF NOT EXISTS secrets (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    secret_key VARCHAR(100) NOT NULL UNIQUE,
    encrypted_value TEXT NOT NULL,
    description VARCHAR(255),
    
    -- Scope
    service_ids JSON,
    environment VARCHAR(50) DEFAULT 'production',
    
    -- Rotación
    expires_at TIMESTAMP NULL,
    last_rotated_at TIMESTAMP,
    rotate_interval_days INT DEFAULT 90,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (secret_key),
    INDEX idx_environment (environment),
    INDEX idx_active (is_active),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: system_logs (Logs del Sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    service_id VARCHAR(50),
    log_level ENUM('debug', 'info', 'warning', 'error', 'critical') NOT NULL,
    message TEXT NOT NULL,
    context JSON,
    stack_trace TEXT,
    user_id VARCHAR(36),
    session_id VARCHAR(36),
    request_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service (service_id),
    INDEX idx_level (log_level),
    INDEX idx_created (created_at),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: maintenance_windows (Ventanas de Mantenimiento)
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_windows (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    service_id VARCHAR(50),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Programación
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Estado
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    is_notification_sent BOOLEAN DEFAULT FALSE,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_service (service_id),
    INDEX idx_status (status),
    INDEX idx_starts (starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Catálogos de sistema (referencia para otros microservicios)
INSERT INTO catalogs (catalog_key, name, description, is_system, is_active) VALUES
('notification_types', 'Tipos de Notificación', 'Canales de notificación disponibles', TRUE, TRUE),
('delivery_status', 'Estados de Entrega', 'Estados del envío de notificaciones', TRUE, TRUE),
('priority_levels', 'Niveles de Prioridad', 'Urgencia de notificaciones', TRUE, TRUE),
('user_roles', 'Roles de Usuario', 'Roles del sistema de seguridad', TRUE, TRUE),
('user_status', 'Estados de Usuario', 'Estados de cuenta de usuario', TRUE, TRUE);

-- Configuraciones globales por defecto
INSERT INTO configurations (service_id, environment, config_key, config_value, value_type, description) VALUES
(NULL, 'production', 'rate_limit_window', '60000', 'number', 'Ventana de rate limiting en milisegundos'),
(NULL, 'production', 'rate_limit_max', '100', 'number', 'Máximo de peticiones por ventana'),
('msproducto', 'production', 'items_per_page', '20', 'number', 'Items por página en listados'),
('msclientes', 'production', 'gdpr_retention_days', '2555', 'number', 'Días de retención GDPR (7 años)'),
('msseguridad', 'production', 'max_login_attempts', '5', 'number', 'Intentos de login antes de bloqueo'),
('msseguridad', 'production', 'lockout_duration_minutes', '30', 'number', 'Duración de bloqueo en minutos');

-- Feature flags por defecto
INSERT INTO feature_flags (flag_key, name, description, strategy_type, strategy_config, enabled_globally) VALUES
('new_dashboard', 'Nuevo Dashboard', 'Nueva interfaz de dashboard', 'boolean', '{"enabled": false}', FALSE),
('beta_api', 'API Beta', 'Endpoints de API en versión beta', 'user_list', '{"users": []}', FALSE),
('dark_mode', 'Modo Oscuro', 'Tema oscuro de la aplicación', 'boolean', '{"enabled": true}', TRUE);

-- Registrar microservicios
INSERT INTO services (service_key, name, description, base_url, api_version, version, status, heartbeat_interval_seconds) VALUES
('msproducto', 'Microservicio de Productos', 'Gestión de catálogo de productos', 'http://localhost:3000', 'v1', '1.0.0', 'active', 60),
('msclientes', 'Microservicio de Clientes', 'Gestión de clientes y CRM', 'http://localhost:3001', 'v1', '1.0.0', 'active', 60),
('msnotificaciones', 'Microservicio de Notificaciones', 'Envío de notificaciones multicanal', 'http://localhost:3002', 'v1', '1.0.0', 'active', 60),
('msseguridad', 'Microservicio de Seguridad', 'Autenticación y autorización', 'http://localhost:3003', 'v1', '1.0.0', 'active', 60),
('mssistemas', 'Microservicio de Sistemas', 'Configuración y catálogos', 'http://localhost:3004', 'v1', '1.0.0', 'active', 60);
