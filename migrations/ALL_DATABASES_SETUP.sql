-- =====================================================
-- MIGRACIÓN: Todas las tablas para backproject
-- Hostinger MySQL - 5 Bases de Datos
-- Fecha: 2026-04-19
-- =====================================================

-- =====================================================
-- 1. u755818637_dbproductos (msproducto)
-- =====================================================

USE u755818637_dbproductos;

-- Tabla: product_types (tipos de producto)
CREATE TABLE IF NOT EXISTS product_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    has_variants BOOLEAN DEFAULT FALSE,
    has_attributes BOOLEAN DEFAULT TRUE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: attribute_definitions (definición de atributos)
CREATE TABLE IF NOT EXISTS attribute_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_type_id INT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'date', 'select', 'multiselect') NOT NULL,
    validation_rules JSON,
    is_required BOOLEAN DEFAULT FALSE,
    is_filterable BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE CASCADE,
    INDEX idx_product_type (product_type_id),
    INDEX idx_code (code),
    UNIQUE KEY uk_product_type_code (product_type_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_type_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(15,4) NOT NULL DEFAULT 0,
    compare_at_price DECIMAL(15,4),
    cost_price DECIMAL(15,4),
    stock_quantity INT DEFAULT 0,
    stock_status ENUM('in_stock', 'out_of_stock', 'low_stock') DEFAULT 'in_stock',
    weight_kg DECIMAL(10,3),
    dimensions_cm JSON,
    attributes JSON,
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    seo_keywords VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (product_type_id) REFERENCES product_types(id),
    INDEX idx_sku (sku),
    INDEX idx_slug (slug),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_price (price),
    INDEX idx_stock_status (stock_status),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_search (name, description, seo_keywords)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: product_categories (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS product_categories (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: product_images
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    variant_attributes JSON NOT NULL,
    price DECIMAL(15,4),
    stock_quantity INT DEFAULT 0,
    stock_status ENUM('in_stock', 'out_of_stock', 'low_stock') DEFAULT 'in_stock',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_sku (sku),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: client_favorites (relación cliente-producto)
CREATE TABLE IF NOT EXISTS client_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    product_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_client_product (client_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: product_views (historial de vistas)
CREATE TABLE IF NOT EXISTS product_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36),
    product_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_product (product_id),
    INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: product_reviews (reseñas)
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_client_product_review (client_id, product_id),
    INDEX idx_product (product_id),
    INDEX idx_rating (rating),
    INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos iniciales: product_types
INSERT INTO product_types (name, slug, description, has_variants, has_attributes) VALUES
('Electrónica', 'electronica', 'Productos electrónicos y tecnología', TRUE, TRUE),
('Ropa', 'ropa', 'Prendas de vestir y accesorios', TRUE, TRUE),
('Hogar', 'hogar', 'Artículos para el hogar', FALSE, TRUE),
('Alimentos', 'alimentos', 'Productos alimenticios', FALSE, FALSE);

-- Datos iniciales: categories
INSERT INTO categories (name, slug, description, is_active, display_order) VALUES
('Destacados', 'destacados', 'Productos destacados', TRUE, 1),
('Nuevos', 'nuevos', 'Nuevos productos', TRUE, 2),
('Ofertas', 'ofertas', 'Productos en oferta', TRUE, 3);

-- =====================================================
-- 2. u755818637_dbclientes (msclientes)
-- =====================================================

USE u755818637_dbclientes;

-- Tabla: customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    tax_id VARCHAR(50),
    tax_id_type VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'es',
    status ENUM('active', 'inactive', 'suspended', 'anonymized') DEFAULT 'active',
    customer_type ENUM('individual', 'company') DEFAULT 'individual',
    company_name VARCHAR(200),
    industry VARCHAR(100),
    annual_revenue DECIMAL(15,2),
    employee_count INT,
    marketing_consent BOOLEAN DEFAULT FALSE,
    data_processing_consent BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP NULL,
    gdpr_compliant BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    -- 8 campos personalizados
    custom_varchar VARCHAR(255),
    custom_int INT,
    custom_decimal DECIMAL(15,4),
    custom_datetime DATETIME,
    custom_bool BOOLEAN,
    custom_text TEXT,
    custom_json JSON,
    custom_date DATE,
    
    INDEX idx_email (email),
    INDEX idx_tax_id (tax_id),
    INDEX idx_status (status),
    INDEX idx_customer_code (customer_code),
    INDEX idx_created_at (created_at),
    INDEX idx_custom_varchar (custom_varchar),
    INDEX idx_custom_int (custom_int),
    INDEX idx_custom_datetime (custom_datetime),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: addresses
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    address_type ENUM('home', 'work', 'billing', 'shipping') DEFAULT 'home',
    street_address VARCHAR(255) NOT NULL,
    street_address_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country_code VARCHAR(2) DEFAULT 'ES',
    is_default BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_type (address_type),
    INDEX idx_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: contacts
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    contact_type ENUM('email', 'phone', 'mobile', 'fax') NOT NULL,
    contact_value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    can_marketing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_type (contact_type),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: documents
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    issuing_country VARCHAR(2),
    issue_date DATE,
    expiry_date DATE,
    file_url VARCHAR(500),
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_type (document_type),
    INDEX idx_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100),
    performed_by_type ENUM('user', 'system', 'api') DEFAULT 'user',
    changes JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: consent_records
CREATE TABLE IF NOT EXISTS consent_records (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    document_version VARCHAR(50),
    withdrawal_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_type (consent_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. u755818637_dbnotifica (msnotificaciones)
-- =====================================================

USE u755818637_dbnotifica;

-- Catálogos locales (reemplazan dependencia de mssistemas)
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

-- Datos iniciales para catálogos
INSERT INTO notification_types (code, label, description, is_active, display_order) VALUES
    ('EMAIL', 'Email', 'Notificación por correo electrónico', TRUE, 1),
    ('SMS', 'SMS', 'Notificación por mensaje de texto', TRUE, 2),
    ('PUSH', 'Push', 'Notificación push móvil', TRUE, 3),
    ('IN_APP', 'In-App', 'Notificación dentro de la aplicación', TRUE, 4);

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
    ('CRITICAL', 'Crítica', 'Prioridad crítica', TRUE, 4);

-- Tabla: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipient_id VARCHAR(36) NOT NULL,
    recipient_type ENUM('user', 'customer', 'guest') DEFAULT 'user',
    notification_type_id VARCHAR(36) NOT NULL,
    priority_level_id VARCHAR(36) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT,
    template_id VARCHAR(36),
    channel VARCHAR(50) NOT NULL,
    delivery_status_id VARCHAR(36) NOT NULL,
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id),
    FOREIGN KEY (priority_level_id) REFERENCES priority_levels(id),
    FOREIGN KEY (delivery_status_id) REFERENCES delivery_status(id),
    INDEX idx_recipient (recipient_id, recipient_type),
    INDEX idx_status (delivery_status_id),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    notification_type_id VARCHAR(36) NOT NULL,
    subject_template VARCHAR(255) NOT NULL,
    content_template TEXT NOT NULL,
    content_html_template TEXT,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id),
    INDEX idx_type (notification_type_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. u755818637_dbseguridad (msseguridad)
-- =====================================================

USE u755818637_dbseguridad;

-- Catálogos locales (reemplazan dependencia de mssistemas)
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

-- Datos iniciales
INSERT INTO user_roles (code, name, description, permissions, is_active, display_order) VALUES
    ('ADMIN', 'Administrador', 'Acceso completo al sistema', '["*"]', TRUE, 1),
    ('USER', 'Usuario', 'Usuario estándar', '["read"]', TRUE, 2),
    ('MODERATOR', 'Moderador', 'Privilegios de moderación', '["read", "moderate"]', TRUE, 3),
    ('GUEST', 'Invitado', 'Acceso limitado', '["read:public"]', TRUE, 4),
    ('DEVELOPER', 'Desarrollador', 'Acceso a desarrollo', '["read", "write", "debug"]', TRUE, 5);

INSERT INTO user_status (code, name, description, is_active, display_order) VALUES
    ('ACTIVE', 'Activo', 'Usuario habilitado', TRUE, 1),
    ('INACTIVE', 'Inactivo', 'Usuario deshabilitado', TRUE, 2),
    ('SUSPENDED', 'Suspendido', 'Suspendido por violación', TRUE, 3),
    ('PENDING', 'Pendiente', 'Pendiente de verificación', TRUE, 4),
    ('BANNED', 'Baneado', 'Permanentemente baneado', TRUE, 5);

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: user_roles_mapping (relación many-to-many)
CREATE TABLE IF NOT EXISTS user_roles_mapping (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(36),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    family_id VARCHAR(36) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    revoked_reason VARCHAR(255),
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_family (family_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. u755818637_dbsistemas (mssistemas)
-- =====================================================

USE u755818637_dbsistemas;

-- Tabla: configurations
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_service_env_key (service_id, environment, config_key),
    INDEX idx_service (service_id),
    INDEX idx_environment (environment),
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: feature_flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    strategy_type ENUM('boolean', 'percentage', 'user_list', 'time_based') DEFAULT 'boolean',
    strategy_config JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (flag_key),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: catalogs (catálogos genéricos)
CREATE TABLE IF NOT EXISTS catalogs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    catalog_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (catalog_key),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: catalog_values
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

-- Tabla: services (registro de microservicios)
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    service_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    base_url VARCHAR(255),
    health_check_url VARCHAR(255),
    version VARCHAR(50),
    status ENUM('active', 'inactive', 'deprecated') DEFAULT 'active',
    last_heartbeat TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (service_key),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: secrets (credenciales encriptadas)
CREATE TABLE IF NOT EXISTS secrets (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    secret_key VARCHAR(100) NOT NULL UNIQUE,
    encrypted_value TEXT NOT NULL,
    description VARCHAR(255),
    service_ids JSON,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (secret_key),
    INDEX idx_active (is_active),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar catálogos iniciales para compatibilidad
INSERT INTO catalogs (catalog_key, name, description) VALUES
('notification_types', 'Tipos de Notificación', 'Canales de notificación'),
('delivery_status', 'Estados de Entrega', 'Estados del envío de notificaciones'),
('priority_levels', 'Niveles de Prioridad', 'Urgencia de notificaciones'),
('user_roles', 'Roles de Usuario', 'Roles del sistema de seguridad'),
('user_status', 'Estados de Usuario', 'Estados de cuenta de usuario');

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
