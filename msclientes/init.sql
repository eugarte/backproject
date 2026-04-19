-- Init script for msclientes database
-- Creates all required tables for Customer Management with GDPR compliance
-- Includes 8 flexible custom fields for future extensibility

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
    customer_type ENUM('individual', 'business') DEFAULT 'individual',
    company_name VARCHAR(200),
    industry VARCHAR(100),
    annual_revenue DECIMAL(15, 2),
    employee_count INT,
    credit_score INT,
    credit_limit DECIMAL(15, 2),
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date TIMESTAMP NULL,
    gdpr_consent_version VARCHAR(20),
    marketing_consent BOOLEAN DEFAULT FALSE,
    data_processing_consent BOOLEAN DEFAULT FALSE,
    anonymized_at TIMESTAMP NULL,
    anonymized_reason VARCHAR(255),
    
    -- 8 CAMPOS PERSONALIZADOS FLEXIBLES
    custom_varchar VARCHAR(255) NULL COMMENT 'Campo personalizado texto corto',
    custom_int INT NULL COMMENT 'Campo personalizado numérico entero',
    custom_decimal DECIMAL(15, 4) NULL COMMENT 'Campo personalizado decimal',
    custom_datetime DATETIME NULL COMMENT 'Campo personalizado fecha/hora',
    custom_bool BOOLEAN NULL COMMENT 'Campo personalizado booleano',
    custom_text TEXT NULL COMMENT 'Campo personalizado texto largo',
    custom_json JSON NULL COMMENT 'Campo personalizado estructurado JSON',
    custom_date DATE NULL COMMENT 'Campo personalizado fecha',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    updated_by VARCHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(36),
    INDEX idx_email (email),
    INDEX idx_tax_id (tax_id),
    INDEX idx_status (status),
    INDEX idx_customer_code (customer_code),
    INDEX idx_created_at (created_at),
    INDEX idx_custom_varchar (custom_varchar),
    INDEX idx_custom_int (custom_int),
    INDEX idx_custom_datetime (custom_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    address_type ENUM('billing', 'shipping', 'home', 'work', 'other') DEFAULT 'home',
    street VARCHAR(255) NOT NULL,
    street_number VARCHAR(20),
    apartment VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_postal_code (postal_code),
    INDEX idx_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    contact_type ENUM('email', 'phone', 'mobile', 'fax', 'social_media', 'other') NOT NULL,
    value VARCHAR(255) NOT NULL,
    label VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    can_contact BOOLEAN DEFAULT TRUE,
    contact_schedule VARCHAR(100),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_contact_type (contact_type),
    INDEX idx_value (value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    document_type ENUM('id_card', 'passport', 'tax_id', 'business_license', 'proof_of_address', 'contract', 'consent_form', 'other') NOT NULL,
    document_number VARCHAR(100),
    issuing_country VARCHAR(100),
    issuing_authority VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    encryption_key_id VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(100),
    verification_date TIMESTAMP NULL,
    metadata JSON,
    gdpr_category ENUM('identity', 'financial', 'sensitive', 'contractual', 'consent') DEFAULT 'identity',
    retention_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_document_type (document_type),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_gdpr_category (gdpr_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_tags (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    tag_value VARCHAR(100),
    tag_category VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_tag_name (tag_name),
    UNIQUE KEY unique_customer_tag (customer_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_preferences (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    preference_category VARCHAR(50) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_category_key (preference_category, preference_key),
    UNIQUE KEY unique_customer_preference (customer_id, preference_category, preference_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_history (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    credit_bureau VARCHAR(100) NOT NULL,
    score INT,
    score_date DATE NOT NULL,
    report_reference VARCHAR(255),
    report_data JSON,
    risk_level ENUM('low', 'medium', 'high', 'very_high'),
    recommendations TEXT,
    checked_by VARCHAR(36),
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_score_date (score_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    action_details JSON,
    old_values JSON,
    new_values JSON,
    performed_by VARCHAR(36),
    performed_by_type ENUM('user', 'system', 'api', 'batch'),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    request_id VARCHAR(100),
    correlation_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gdpr_related BOOLEAN DEFAULT FALSE,
    data_subject_id VARCHAR(36),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp),
    INDEX idx_performed_by (performed_by),
    INDEX idx_gdpr (gdpr_related),
    INDEX idx_data_subject (data_subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consent_records (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    consent_text TEXT NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    proof_document_id VARCHAR(36),
    legal_basis ENUM('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_consent_type (consent_type),
    INDEX idx_granted_at (granted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default data
INSERT INTO customer_preferences (id, customer_id, preference_category, preference_key, preference_value)
VALUES 
    ('pref-001', 'customer-001', 'notifications', 'email_enabled', 'true'),
    ('pref-002', 'customer-001', 'notifications', 'sms_enabled', 'false')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;