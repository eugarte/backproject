const { query, transaction } = require('../config/database');
const Product = require('../models/Product');

class ProductRepository {
    
    async create(data) {
        const sql = `
            INSERT INTO products 
            (sku, name, slug, category_id, brand, price, compare_at_price, cost_price,
             stock, attributes, short_description, description, 
             meta_title, meta_description, status, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            data.sku,
            data.name,
            data.slug,
            data.categoryId,
            data.brand,
            data.price,
            data.compareAtPrice || null,
            data.costPrice || null,
            data.stock || 0,
            JSON.stringify(data.attributes || {}),
            data.shortDescription || null,
            data.description || null,
            data.metaTitle || null,
            data.metaDescription || null,
            data.status || 'draft',
            data.isFeatured || false
        ];
        
        const result = await query(sql, params);
        return this.findById(result.insertId);
    }

    async findById(id, includeRelations = true) {
        const sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `;
        
        const rows = await query(sql, [id]);
        if (rows.length === 0) return null;
        
        const product = new Product(rows[0]);
        
        if (includeRelations) {
            product.category = {
                id: product.categoryId,
                name: rows[0].category_name,
                slug: rows[0].category_slug
            };
            product.images = await this.getProductImages(id);
            product.variants = await this.getProductVariants(id);
        }
        
        return product;
    }

    async findBySlug(slug) {
        const sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ?
        `;
        
        const rows = await query(sql, [slug]);
        if (rows.length === 0) return null;
        
        const product = new Product(rows[0]);
        product.category = {
            id: product.categoryId,
            name: rows[0].category_name,
            slug: rows[0].category_slug
        };
        
        return product;
    }

    async search(filters = {}, options = {}) {
        const {
            categoryId,
            brand,
            minPrice,
            maxPrice,
            status = 'active',
            attributes = {},
            searchQuery,
            isFeatured
        } = filters;
        
        const {
            page = 1,
            limit = 20,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;
        
        const whereClause = ['p.status = ?'];
        const params = [status];
        
        if (categoryId) {
            whereClause.push('p.category_id = ?');
            params.push(categoryId);
        }
        
        if (brand) {
            whereClause.push('p.brand = ?');
            params.push(brand);
        }
        
        if (minPrice !== undefined) {
            whereClause.push('p.price >= ?');
            params.push(minPrice);
        }
        
        if (maxPrice !== undefined) {
            whereClause.push('p.price <= ?');
            params.push(maxPrice);
        }
        
        if (isFeatured !== undefined) {
            whereClause.push('p.is_featured = ?');
            params.push(isFeatured);
        }
        
        if (searchQuery) {
            whereClause.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
            const like = `%${searchQuery}%`;
            params.push(like, like, like);
        }
        
        // Filtros por atributos JSON
        Object.entries(attributes).forEach(([key, value]) => {
            whereClause.push(`JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.${key}')) = ?`);
            params.push(value);
        });
        
        const whereString = whereClause.join(' AND ');
        const offset = (page - 1) * limit;
        
        const allowedSortFields = ['id', 'name', 'price', 'created_at', 'stock', 'view_count', 'rating'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        const sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE ${whereString}
            ORDER BY p.${safeSortBy} ${safeSortOrder}
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit), parseInt(offset));
        
        const rows = await query(sql, params);
        const products = rows.map(row => {
            const p = new Product(row);
            p.category = {
                id: p.categoryId,
                name: row.category_name,
                slug: row.category_slug
            };
            return p;
        });
        
        // Count
        const countSql = `SELECT COUNT(*) as total FROM products p WHERE ${whereString}`;
        const countParams = params.slice(0, -2);
        const countResult = await query(countSql, countParams);
        
        return {
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }

    async update(id, updateData) {
        const allowedFields = {
            name: 'name',
            slug: 'slug',
            categoryId: 'category_id',
            brand: 'brand',
            price: 'price',
            compareAtPrice: 'compare_at_price',
            costPrice: 'cost_price',
            stock: 'stock',
            attributes: 'attributes',
            shortDescription: 'short_description',
            description: 'description',
            metaTitle: 'meta_title',
            metaDescription: 'meta_description',
            status: 'status',
            isFeatured: 'is_featured'
        };
        
        const updates = [];
        const params = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields[key] && value !== undefined) {
                updates.push(`${allowedFields[key]} = ?`);
                params.push(key === 'attributes' ? JSON.stringify(value) : value);
            }
        }
        
        if (updates.length === 0) return null;
        
        params.push(id);
        
        const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
        await query(sql, params);
        
        return this.findById(id);
    }

    async delete(id) {
        return await transaction(async (conn) => {
            await conn.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
            await conn.execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
            await conn.execute('DELETE FROM client_favorites WHERE product_id = ?', [id]);
            await conn.execute('DELETE FROM product_views WHERE product_id = ?', [id]);
            await conn.execute('DELETE FROM product_reviews WHERE product_id = ?', [id]);
            await conn.execute('DELETE FROM price_alerts WHERE product_id = ?', [id]);
            
            const [result] = await conn.execute('DELETE FROM products WHERE id = ?', [id]);
            return result.affectedRows > 0;
        });
    }

    async incrementViewCount(id) {
        await query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);
    }

    async getProductImages(productId) {
        const sql = `
            SELECT * FROM product_images 
            WHERE product_id = ? 
            ORDER BY is_primary DESC, sort_order ASC
        `;
        return await query(sql, [productId]);
    }

    async getProductVariants(productId) {
        const sql = `
            SELECT * FROM product_variants 
            WHERE product_id = ? AND is_active = TRUE
            ORDER BY sort_order ASC
        `;
        return await query(sql, [productId]);
    }

    // ===== RELACIONES CLIENTE-PRODUCTO =====
    
    async addToFavorites(clientId, productId, notes = null) {
        const product = await this.findById(productId, false);
        if (!product) throw new Error('Producto no encontrado');
        
        const sql = `
            INSERT INTO client_favorites 
            (client_id, product_id, product_sku, product_name, product_image, product_price, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            notes = COALESCE(VALUES(notes), notes),
            updated_at = CURRENT_TIMESTAMP
        `;
        
        const image = await query(
            'SELECT image_url FROM product_images WHERE product_id = ? AND is_primary = TRUE LIMIT 1',
            [productId]
        );
        
        await query(sql, [
            clientId,
            productId,
            product.sku,
            product.name,
            image[0]?.image_url || null,
            product.price,
            notes
        ]);
        
        return this.getClientFavorites(clientId);
    }

    async removeFromFavorites(clientId, productId) {
        await query(
            'DELETE FROM client_favorites WHERE client_id = ? AND product_id = ?',
            [clientId, productId]
        );
        return true;
    }

    async getClientFavorites(clientId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        
        const sql = `
            SELECT cf.*, p.price as current_price, p.stock as current_stock, p.status as product_status
            FROM client_favorites cf
            JOIN products p ON cf.product_id = p.id
            WHERE cf.client_id = ?
            ORDER BY cf.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const rows = await query(sql, [clientId, parseInt(limit), parseInt(offset)]);
        
        const countSql = 'SELECT COUNT(*) as total FROM client_favorites WHERE client_id = ?';
        const countResult = await query(countSql, [clientId]);
        
        return {
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }

    async isFavorite(clientId, productId) {
        const rows = await query(
            'SELECT 1 FROM client_favorites WHERE client_id = ? AND product_id = ?',
            [clientId, productId]
        );
        return rows.length > 0;
    }

    async recordProductView(clientId, productId, sessionData = {}) {
        const product = await this.findById(productId, false);
        if (!product) return;
        
        const sql = `
            INSERT INTO product_views 
            (client_id, product_id, product_sku, product_name, product_price, session_id, ip_address, user_agent, referrer)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await query(sql, [
            clientId,
            productId,
            product.sku,
            product.name,
            product.price,
            sessionData.sessionId || null,
            sessionData.ip || null,
            sessionData.userAgent || null,
            sessionData.referrer || null
        ]);
        
        await this.incrementViewCount(productId);
    }

    async getClientViewHistory(clientId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        
        const sql = `
            SELECT pv.*, p.image_url as product_image
            FROM product_views pv
            LEFT JOIN (
                SELECT product_id, image_url 
                FROM product_images 
                WHERE is_primary = TRUE
            ) p ON pv.product_id = p.product_id
            WHERE pv.client_id = ?
            ORDER BY pv.viewed_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const rows = await query(sql, [clientId, parseInt(limit), parseInt(offset)]);
        
        const countSql = 'SELECT COUNT(*) as total FROM product_views WHERE client_id = ?';
        const countResult = await query(countSql, [clientId]);
        
        return {
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }

    async addReview(reviewData) {
        const sql = `
            INSERT INTO product_reviews 
            (client_id, product_id, variant_id, order_id, rating, title, comment, pros, cons, is_verified_purchase, images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await query(sql, [
            reviewData.clientId,
            reviewData.productId,
            reviewData.variantId || null,
            reviewData.orderId || null,
            reviewData.rating,
            reviewData.title || null,
            reviewData.comment || null,
            reviewData.pros || null,
            reviewData.cons || null,
            reviewData.isVerifiedPurchase || false,
            JSON.stringify(reviewData.images || [])
        ]);
        
        await this.updateProductRating(reviewData.productId);
        
        return result.insertId;
    }

    async getProductReviews(productId, options = {}) {
        const { page = 1, limit = 10, approvedOnly = true } = options;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE product_id = ?';
        if (approvedOnly) {
            whereClause += ' AND is_approved = TRUE';
        }
        
        const sql = `
            SELECT * FROM product_reviews
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const rows = await query(sql, [productId, parseInt(limit), parseInt(offset)]);
        
        const countSql = `SELECT COUNT(*) as total FROM product_reviews ${whereClause}`;
        const countResult = await query(countSql, [productId]);
        
        return {
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }

    async updateProductRating(productId) {
        const sql = `
            UPDATE products 
            SET rating = (
                SELECT AVG(rating) FROM product_reviews 
                WHERE product_id = ? AND is_approved = TRUE
            ),
            review_count = (
                SELECT COUNT(*) FROM product_reviews 
                WHERE product_id = ? AND is_approved = TRUE
            )
            WHERE id = ?
        `;
        
        await query(sql, [productId, productId, productId]);
    }

    async createPriceAlert(clientId, productId, targetPrice = null) {
        const product = await this.findById(productId, false);
        if (!product) throw new Error('Producto no encontrado');
        
        const sql = `
            INSERT INTO price_alerts (client_id, product_id, target_price)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE target_price = VALUES(target_price), is_active = TRUE
        `;
        
        await query(sql, [clientId, productId, targetPrice]);
        return true;
    }

    async getClientPriceAlerts(clientId) {
        const sql = `
            SELECT pa.*, p.name as product_name, p.price as current_price, p.sku
            FROM price_alerts pa
            JOIN products p ON pa.product_id = p.id
            WHERE pa.client_id = ? AND pa.is_active = TRUE
            ORDER BY pa.created_at DESC
        `;
        
        return await query(sql, [clientId]);
    }
}

module.exports = new ProductRepository();