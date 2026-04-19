-- =====================================================
-- Base de Datos: u755818637_dbnotifica
-- Microservicio: msnotificaciones (Notificaciones)
-- Hostinger MySQL
-- Fecha: 2026-04-19
-- =====================================================

USE u755818637_dbnotifica;

-- =====================================================
-- CATÁLOGOS LOCALES (Reemplazan dependencia de mssistemas)
-- =====================================================

-- Catálogo: Tipos de Notificación
CREATE TABLE IF NOT EXISTS notification_types (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo: Estados de Entrega
CREATE TABLE IF NOT EXISTS delivery_status (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo: Niveles de Prioridad
CREATE TABLE IF NOT EXISTS priority_levels (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
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

INSERT INTO notification_types (code, label, description, is_active, display_order) VALUES
    ('EMAIL', 'Email', 'Notificación por correo electrónico', TRUE, 1),
    ('SMS', 'SMS', 'Notificación por mensaje de texto', TRUE, 2),
    ('PUSH', 'Push', 'Notificación push móvil', TRUE, 3),
    ('IN_APP', 'In-App', 'Notificación dentro de la aplicación', TRUE, 4),
    ('WHATSAPP', 'WhatsApp', 'Notificación por WhatsApp', TRUE, 5);

INSERT INTO delivery_status (code, label, description, is_active, display_order) VALUES
    ('PENDING', 'Pendiente', 'Notificación en cola pendiente', TRUE, 1),
    ('QUEUED', 'Encolada', 'Notificación encolada para envío', TRUE, 2),
    ('SENDING', 'Enviando', 'Notificación en proceso de envío', TRUE, 3),
    ('DELIVERED', 'Entregada', 'Notificación entregada exitosamente', TRUE, 4),
    ('FAILED', 'Fallida', 'Notificación con error de entrega', TRUE, 5),
    ('RETRYING', 'Reintentando', 'Notificación en reintento', TRUE, 6),
    ('CANCELLED', 'Cancelada', 'Notificación cancelada', TRUE, 7);

INSERT INTO priority_levels (code, label, description, is_active, display_order) VALUES
    ('LOW', 'Baja', 'Prioridad baja', TRUE, 1),
    ('MEDIUM', 'Media', 'Prioridad media', TRUE, 2),
    ('HIGH', 'Alta', 'Prioridad alta', TRUE, 3),
    ('CRITICAL', 'Crítica', 'Prioridad crítica', TRUE, 4),
    ('URGENT', 'Urgente', 'Prioridad máxima', TRUE, 5);

-- =====================================================
-- TABLA PRINCIPAL: notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipient_id VARCHAR(36) NOT NULL,
    recipient_type ENUM('user', 'customer', 'guest') DEFAULT 'user',
    notification_type_id VARCHAR(36) NOT NULL,
    priority_level_id VARCHAR(36) NOT NULL,
    
    -- Contenido
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT,
    template_id VARCHAR(36),
    
    -- Canal y estado
    channel VARCHAR(50) NOT NULL,
    delivery_status_id VARCHAR(36) NOT NULL,
    
    -- Programación
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    
    -- Reintentos
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    error_message TEXT,
    
    -- Metadata
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id),
    FOREIGN KEY (priority_level_id) REFERENCES priority_levels(id),
    FOREIGN KEY (delivery_status_id) REFERENCES delivery_status(id),
    
    -- Índices
    INDEX idx_recipient (recipient_id, recipient_type),
    INDEX idx_status (delivery_status_id),
    INDEX idx_type (notification_type_id),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_created (created_at),
    INDEX idx_sent (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: notification_templates (Plantillas)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    notification_type_id VARCHAR(36) NOT NULL,
    
    -- Plantillas
    subject_template VARCHAR(255) NOT NULL,
    content_template TEXT NOT NULL,
    content_html_template TEXT,
    
    -- Variables y configuración
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id),
    INDEX idx_type (notification_type_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: notification_queue (Cola de Notificaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_queue (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    notification_id VARCHAR(36) NOT NULL,
    queue_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    processor_id VARCHAR(100),
    attempts INT DEFAULT 0,
    next_attempt_at TIMESTAMP,
    processed_at TIMESTAMP,
    error_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notification (notification_id),
    INDEX idx_status (queue_status),
    INDEX idx_next_attempt (next_attempt_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: notification_logs (Logs Detallados)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    notification_id VARCHAR(36) NOT NULL,
    log_type ENUM('info', 'warning', 'error', 'success') NOT NULL,
    message TEXT NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification (notification_id),
    INDEX idx_type (log_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES: Plantillas
-- =====================================================

INSERT INTO notification_templates (
    name, notification_type_id, subject_template, content_template, 
    content_html_template, variables, is_active
) 
SELECT 
    'Bienvenida Email',
    (SELECT id FROM notification_types WHERE code = 'EMAIL'),
    'Bienvenido a nuestra plataforma, {{name}}',
    'Hola {{name}},\n\nBienvenido a nuestra plataforma. Estamos emocionados de tenerte con nosotros.',
    '<h1>Bienvenido {{name}}</h1><p>Gracias por unirte a nuestra plataforma.</p>',
    '["name", "email"]',
    TRUE;
