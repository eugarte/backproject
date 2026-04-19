-- =====================================================
-- Base de Datos: u755818637_dbclientes
-- Microservicio: msclientes (Gestión de Clientes)
-- Hostinger MySQL
-- Fecha: 2026-04-19
-- =====================================================

USE u755818637_dbclientes;

-- =====================================================
-- TABLA: customers (Clientes)
-- =====================================================
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

-- =====================================================
-- TABLA: addresses (Direcciones)
-- =====================================================
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

-- =====================================================
-- TABLA: contacts (Contactos)
-- =====================================================
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

-- =====================================================
-- TABLA: documents (Documentos)
-- =====================================================
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

-- =====================================================
-- TABLA: customer_tags (Etiquetas de Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_tags (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY uk_customer_tag (customer_id, tag),
    INDEX idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: customer_preferences (Preferencias)
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_preferences (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    preference_key VARCHAR(50) NOT NULL,
    preference_value VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY uk_customer_preference (customer_id, preference_key),
    INDEX idx_key (preference_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: credit_history (Historial Crediticio)
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_history (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    credit_limit DECIMAL(15,2),
    current_balance DECIMAL(15,2) DEFAULT 0,
    available_credit DECIMAL(15,2),
    payment_terms INT DEFAULT 30,
    risk_score INT,
    last_review_date DATE,
    next_review_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_risk_score (risk_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: audit_logs (Registro de Auditoría)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSON,
    new_values JSON,
    performed_by VARCHAR(100),
    performed_by_type ENUM('user', 'system', 'api') DEFAULT 'user',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: consent_records (Registro de Consentimientos GDPR)
-- =====================================================
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
-- DATOS INICIALES
-- =====================================================

-- Cliente de ejemplo
INSERT INTO customers (id, customer_code, first_name, last_name, email, phone, status, customer_type) VALUES
('cust-001', 'CUST-2024-000001', 'Juan', 'Pérez', 'juan.perez@email.com', '+34600123456', 'active', 'individual'),
('cust-002', 'CUST-2024-000002', 'María', 'García', 'maria.garcia@email.com', '+34600789012', 'active', 'individual'),
('cust-003', 'CUST-2024-000003', 'Empresa ABC', NULL, 'contacto@empresaabc.com', '+34900123456', 'active', 'company');

-- Direcciones de ejemplo
INSERT INTO addresses (id, customer_id, address_type, street_address, city, postal_code, country_code, is_default) VALUES
('addr-001', 'cust-001', 'home', 'Calle Mayor 123', 'Madrid', '28001', 'ES', TRUE),
('addr-002', 'cust-001', 'work', 'Av. Empresarial 45', 'Madrid', '28002', 'ES', FALSE),
('addr-003', 'cust-002', 'home', 'Plaza España 10', 'Barcelona', '08001', 'ES', TRUE);

-- Contactos de ejemplo
INSERT INTO contacts (id, customer_id, contact_type, contact_value, is_primary, is_verified) VALUES
('cont-001', 'cust-001', 'email', 'juan.perez@email.com', TRUE, TRUE),
('cont-002', 'cust-001', 'mobile', '+34600123456', TRUE, TRUE),
('cont-003', 'cust-002', 'email', 'maria.garcia@email.com', TRUE, TRUE);
