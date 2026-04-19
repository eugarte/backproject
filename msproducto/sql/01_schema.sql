-- ============================================
-- MICROSERVICIO: msproducto
-- BASE DE DATOS: MySQL 8.0
-- DESCRIPCION: Esquema completo con relaciones cliente-producto
-- ============================================

-- Crear database (ejecutar manualmente en phpMyAdmin o mysql)
-- CREATE DATABASE IF NOT EXISTS msproducto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE msproducto;

-- ============================================
-- 1. CATEGORÍAS JERÁRQUICAS
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    parent_id INT UNSIGNED NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. DEFINICIÓN DE ATRIBUTOS (METADATA)
-- ============================================
CREATE TABLE IF NOT EXISTS attribute_definitions (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    category_id INT UNSIGNED NULL COMMENT 'NULL = atributo global',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre visible',
    code VARCHAR(50) NOT NULL COMMENT 'Key en JSON',
    description TEXT,
    data_type ENUM('string', 'number', 'boolean', 'date', 'enum', 'multiselect', 'json') NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    is_filterable BOOLEAN DEFAULT FALSE COMMENT '¿Se puede usar en filtros?',
    is_searchable BOOLEAN DEFAULT FALSE COMMENT '¿Se puede buscar?',
    default_value JSON,
    validation_rules JSON COMMENT '{min, max, pattern}',
    options JSON COMMENT 'Para enum/multiselect',
    sort_order INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_code (code),
    UNIQUE KEY uk_category_code (category_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. PRODUCTOS (MODELO HÍBRIDO)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    
    -- Identificación
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- Relaciones
    category_id INT UNSIGNED NOT NULL,
    brand VARCHAR(100),
    
    -- Precios (indexados para búsquedas)
    price DECIMAL(12,2) NOT NULL,
    compare_at_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Inventario
    stock INT DEFAULT 0,
    stock_alert_level INT DEFAULT 10,
    track_inventory BOOLEAN DEFAULT TRUE,
    
    -- Atributos dinámicos (JSON)
    attributes JSON CHECK (JSON_VALID(attributes)),
    
    -- Contenido
    short_description TEXT,
    description LONGTEXT,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    
    -- Estado
    status ENUM('draft', 'active', 'inactive', 'discontinued') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Métricas
    view_count INT UNSIGNED DEFAULT 0,
    sales_count INT UNSIGNED DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 5.0,
    review_count INT UNSIGNED DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    
    -- Índices base
    INDEX idx_category_status (category_id, status),
    INDEX idx_brand (brand),
    INDEX idx_price (price),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. VARIANTES DE PRODUCTO
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    variant_attributes JSON NOT NULL COMMENT '{"color": "red", "size": "M"}',
    price DECIMAL(12,2),
    compare_at_price DECIMAL(12,2),
    stock INT DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. IMÁGENES DE PRODUCTO
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    variant_id INT UNSIGNED NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. RELACIONES CLIENTE-PRODUCTO: FAVORITOS ⭐
-- ============================================
CREATE TABLE IF NOT EXISTS client_favorites (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    client_id INT UNSIGNED NOT NULL COMMENT 'ID del cliente (desde msclientes)',
    product_id INT UNSIGNED NOT NULL,
    product_sku VARCHAR(100) NOT NULL COMMENT 'Cache del SKU',
    product_name VARCHAR(255) NOT NULL COMMENT 'Cache del nombre',
    product_image VARCHAR(500) COMMENT 'Cache de imagen principal',
    product_price DECIMAL(12,2) COMMENT 'Cache del precio al agregar',
    notes TEXT COMMENT 'Notas del cliente sobre el producto',
    is_notified_low_stock BOOLEAN DEFAULT FALSE,
    notify_price_changes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_product (product_id),
    INDEX idx_client_product (client_id, product_id),
    UNIQUE KEY uk_client_product (client_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. RELACIONES CLIENTE-PRODUCTO: HISTORIAL DE VISTAS 👁️
-- ============================================
CREATE TABLE IF NOT EXISTS product_views (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    client_id INT UNSIGNED COMMENT 'NULL = usuario anónimo',
    product_id INT UNSIGNED NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(12,2) NOT NULL COMMENT 'Precio al momento de ver',
    session_id VARCHAR(255) COMMENT 'Para tracking anónimo',
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_product (product_id),
    INDEX idx_viewed_at (viewed_at),
    INDEX idx_client_recent (client_id, viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. RELACIONES CLIENTE-PRODUCTO: VALORACIONES/RESEÑAS ⭐⭐⭐
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    client_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    variant_id INT UNSIGNED NULL,
    order_id INT UNSIGNED COMMENT 'Referencia a orden (mscompras)',
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    comment TEXT,
    pros TEXT COMMENT 'Pros del producto',
    cons TEXT COMMENT 'Contras del producto',
    is_verified_purchase BOOLEAN DEFAULT FALSE COMMENT '¿Compró el producto?',
    is_approved BOOLEAN DEFAULT FALSE COMMENT 'Aprobado por admin',
    helpful_count INT UNSIGNED DEFAULT 0,
    images JSON COMMENT 'Array de URLs de imágenes de la reseña',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_client (client_id),
    INDEX idx_product (product_id),
    INDEX idx_rating (rating),
    INDEX idx_verified (is_verified_purchase),
    INDEX idx_approved (is_approved),
    UNIQUE KEY uk_client_product_review (client_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. RELACIONES CLIENTE-PRODUCTO: NOTIFICACIONES DE PRECIO 💰
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    client_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    target_price DECIMAL(12,2) COMMENT 'Precio objetivo (NULL = cualquier bajada)',
    is_active BOOLEAN DEFAULT TRUE,
    notified_at TIMESTAMP NULL COMMENT 'Cuándo se notificó',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_product (product_id),
    INDEX idx_active (is_active),
    UNIQUE KEY uk_client_product_alert (client_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. VISTAS ÚTILES
-- ============================================
CREATE OR REPLACE VIEW v_products_full AS
SELECT 
    p.*,
    c.name AS category_name,
    c.slug AS category_slug,
    COALESCE(
        (SELECT image_url FROM product_images 
         WHERE product_id = p.id AND is_primary = TRUE LIMIT 1),
        (SELECT image_url FROM product_images 
         WHERE product_id = p.id ORDER BY sort_order LIMIT 1)
    ) AS primary_image,
    (SELECT COUNT(*) FROM product_reviews 
     WHERE product_id = p.id AND is_approved = TRUE) AS approved_reviews
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Vista de productos favoritos con info completa
CREATE OR REPLACE VIEW v_client_favorites_full AS
SELECT 
    cf.*,
    p.price AS current_price,
    p.stock AS current_stock,
    p.status AS product_status,
    CASE 
        WHEN p.price < cf.product_price THEN 'lower'
        WHEN p.price > cf.product_price THEN 'higher'
        ELSE 'same'
    END AS price_trend
FROM client_favorites cf
JOIN products p ON cf.product_id = p.id;

-- ============================================
-- DATOS DE PRUEBA
-- ============================================

-- Categorías
INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Electrónica', 'electronica', 'Productos electrónicos y tecnología'),
(2, 'Laptops', 'laptops', 'Computadoras portátiles', 1),
(3, 'Smartphones', 'smartphones', 'Teléfonos inteligentes', 1),
(4, 'Ropa', 'ropa', 'Vestimenta y accesorios'),
(5, 'Camisetas', 'camisetas', 'Camisetas de todos los estilos', 4)
ON DUPLICATE KEY UPDATE name=name;

-- Definición de atributos
INSERT INTO attribute_definitions (category_id, name, code, data_type, is_required, is_filterable, validation_rules) VALUES
-- Atributos para Laptops
(2, 'Procesador', 'cpu', 'string', TRUE, TRUE, '{"maxLength": 100}'),
(2, 'Memoria RAM', 'ram_gb', 'number', TRUE, TRUE, '{"min": 1, "max": 128}'),
(2, 'Almacenamiento', 'storage', 'string', TRUE, FALSE, NULL),
(2, 'Pantalla (pulgadas)', 'screen_size', 'number', TRUE, TRUE, '{"min": 10, "max": 18}'),
(2, 'Tarjeta Gráfica', 'gpu', 'string', FALSE, TRUE, NULL),
(2, 'Color', 'color', 'string', FALSE, TRUE, NULL),
(2, 'Peso (kg)', 'weight_kg', 'number', FALSE, FALSE, '{"min": 0.1, "max": 5}'),

-- Atributos para Camisetas
(5, 'Color', 'color', 'string', TRUE, TRUE, NULL),
(5, 'Talla', 'size', 'enum', TRUE, TRUE, '{"options": ["XS", "S", "M", "L", "XL", "XXL"]}'),
(5, 'Material', 'material', 'string', FALSE, TRUE, NULL),
(5, 'Peso (kg)', 'weight_kg', 'number', FALSE, FALSE, '{"min": 0.05, "max": 1}')

ON DUPLICATE KEY UPDATE name=name;

-- Productos de prueba
INSERT INTO products (sku, name, slug, category_id, brand, price, stock, attributes, status) VALUES
('LAP-DEL-XPS15-001', 'Dell XPS 15 9530', 'dell-xps-15-9530', 2, 'Dell', 1899.99, 25,
 '{"cpu": "Intel Core i9-13900H", "ram_gb": 32, "storage": "1TB NVMe SSD", "screen_size": 15.6, "gpu": "NVIDIA RTX 4060", "color": "Silver", "weight_kg": 1.86}',
 'active'),

('LAP-MAC-PRO16-001', 'MacBook Pro 16', 'macbook-pro-16', 2, 'Apple', 2499.00, 15,
 '{"cpu": "M3 Pro", "ram_gb": 18, "storage": "512GB SSD", "screen_size": 16, "color": "Space Black", "weight_kg": 2.14}',
 'active'),

('SHI-NIK-DRY-001', 'Nike Dri-FIT Tee', 'nike-dri-fit-tee', 5, 'Nike', 35.00, 500,
 '{"color": "Black", "size": "M", "material": "100% Polyester", "weight_kg": 0.15}',
 'active'),

('SHI-ADI-COT-001', 'Adidas Cotton Tee', 'adidas-cotton-tee', 5, 'Adidas', 28.00, 350,
 '{"color": "White", "size": "L", "material": "100% Cotton", "weight_kg": 0.18}',
 'active')

ON DUPLICATE KEY UPDATE name=name;

-- Relaciones cliente-producto de prueba
INSERT INTO client_favorites (client_id, product_id, product_sku, product_name, product_price, notes) VALUES
(1, 1, 'LAP-DEL-XPS15-001', 'Dell XPS 15 9530', 1899.99, 'Comprar cuando baje de 1800'),
(1, 3, 'SHI-NIK-DRY-001', 'Nike Dri-FIT Tee', 35.00, 'Para el gimnasio');

INSERT INTO product_views (client_id, product_id, product_sku, product_name, product_price, session_id) VALUES
(1, 1, 'LAP-DEL-XPS15-001', 'Dell XPS 15 9530', 1899.99, 'sess_123'),
(1, 2, 'LAP-MAC-PRO16-001', 'MacBook Pro 16', 2499.00, 'sess_123'),
(2, 1, 'LAP-DEL-XPS15-001', 'Dell XPS 15 9530', 1899.99, 'sess_456');

INSERT INTO product_reviews (client_id, product_id, rating, title, comment, is_verified_purchase, is_approved) VALUES
(1, 1, 5, 'Excelente laptop', 'La mejor laptop que he tenido, super rápida', TRUE, TRUE),
(2, 1, 4, 'Muy buena', 'Pero un poco cara', FALSE, TRUE);
