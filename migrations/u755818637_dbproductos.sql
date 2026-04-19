-- =====================================================
-- Base de Datos: u755818637_dbproductos
-- Microservicio: msproducto (Catálogo de Productos)
-- Hostinger MySQL
-- Fecha: 2026-04-19
-- =====================================================

USE u755818637_dbproductos;

-- =====================================================
-- TABLA: product_types (Tipos de Producto)
-- =====================================================
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

-- =====================================================
-- TABLA: attribute_definitions (Definición de Atributos)
-- =====================================================
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

-- =====================================================
-- TABLA: products (Productos)
-- =====================================================
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

-- =====================================================
-- TABLA: categories (Categorías)
-- =====================================================
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

-- =====================================================
-- TABLA: product_categories (Relación Producto-Categoría)
-- =====================================================
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

-- =====================================================
-- TABLA: product_images (Imágenes de Productos)
-- =====================================================
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

-- =====================================================
-- TABLA: product_variants (Variantes de Productos)
-- =====================================================
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

-- =====================================================
-- TABLA: client_favorites (Favoritos de Clientes)
-- =====================================================
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

-- =====================================================
-- TABLA: product_views (Historial de Vistas)
-- =====================================================
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

-- =====================================================
-- TABLA: product_reviews (Reseñas de Productos)
-- =====================================================
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

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Tipos de producto
INSERT INTO product_types (name, slug, description, has_variants, has_attributes) VALUES
('Electrónica', 'electronica', 'Productos electrónicos y tecnología', TRUE, TRUE),
('Ropa', 'ropa', 'Prendas de vestir y accesorios', TRUE, TRUE),
('Hogar', 'hogar', 'Artículos para el hogar', FALSE, TRUE),
('Alimentos', 'alimentos', 'Productos alimenticios', FALSE, FALSE);

-- Categorías
INSERT INTO categories (name, slug, description, is_active, display_order) VALUES
('Destacados', 'destacados', 'Productos destacados', TRUE, 1),
('Nuevos', 'nuevos', 'Nuevos productos', TRUE, 2),
('Ofertas', 'ofertas', 'Productos en oferta', TRUE, 3);

-- Atributos para Electrónica
INSERT INTO attribute_definitions (product_type_id, name, code, data_type, is_required, is_filterable, display_order) VALUES
(1, 'Color', 'color', 'select', FALSE, TRUE, 1),
(1, 'Memoria RAM', 'ram', 'select', FALSE, TRUE, 2),
(1, 'Almacenamiento', 'storage', 'select', FALSE, TRUE, 3);

-- Atributos para Ropa
INSERT INTO attribute_definitions (product_type_id, name, code, data_type, is_required, is_filterable, display_order) VALUES
(2, 'Talla', 'size', 'select', TRUE, TRUE, 1),
(2, 'Color', 'color', 'select', TRUE, TRUE, 2),
(2, 'Material', 'material', 'select', FALSE, TRUE, 3);

-- Producto de ejemplo
INSERT INTO products (product_type_id, sku, name, slug, description, price, stock_quantity, stock_status, is_active, is_featured, attributes) VALUES
(1, 'PHONE-001', 'Smartphone Pro Max', 'smartphone-pro-max', 'Teléfono inteligente de última generación', 999.99, 50, 'in_stock', TRUE, TRUE, '{"color": "negro", "ram": "8GB", "storage": "256GB"}'),
(1, 'LAPTOP-001', 'Laptop Ultra Slim', 'laptop-ultra-slim', 'Laptop ligera y potente', 1299.99, 25, 'in_stock', TRUE, TRUE, '{"color": "plata", "ram": "16GB", "storage": "512GB"}'),
(2, 'SHIRT-001', 'Camisa Casual', 'camisa-casual', 'Camisa de algodón cómoda', 29.99, 100, 'in_stock', TRUE, FALSE, '{"size": "M", "color": "azul", "material": "algodon"}');

-- Relaciones producto-categoría
INSERT INTO product_categories (product_id, category_id, is_primary) VALUES
(1, 1, TRUE),
(2, 1, TRUE),
(3, 2, TRUE);
