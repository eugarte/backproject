const { query, transaction } = require('../config/database');

class CategoryRepository {
    
    async create(data) {
        const sql = `
            INSERT INTO categories (parent_id, name, slug, description, image_url, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await query(sql, [
            data.parentId || null,
            data.name,
            data.slug,
            data.description || null,
            data.imageUrl || null,
            data.sortOrder || 0,
            data.isActive !== undefined ? data.isActive : true
        ]);
        
        return result.insertId;
    }

    async findById(id) {
        const sql = `
            SELECT c.*, p.name as parent_name
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            WHERE c.id = ?
        `;
        const rows = await query(sql, [id]);
        return rows[0] || null;
    }

    async findBySlug(slug) {
        const rows = await query('SELECT * FROM categories WHERE slug = ?', [slug]);
        return rows[0] || null;
    }

    async findAll(options = {}) {
        const { parentId = null, activeOnly = true } = options;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (parentId !== undefined) {
            whereClause += ' AND parent_id ' + (parentId === null ? 'IS NULL' : '= ?');
            if (parentId !== null) params.push(parentId);
        }
        
        if (activeOnly) {
            whereClause += ' AND is_active = TRUE';
        }
        
        const sql = `
            SELECT c.*, 
                (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as child_count,
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND status = 'active') as product_count
            FROM categories c
            ${whereClause}
            ORDER BY c.sort_order ASC, c.name ASC
        `;
        
        return await query(sql, params);
    }

    async findTree() {
        const categories = await this.findAll({ parentId: null, activeOnly: true });
        
        for (const category of categories) {
            category.children = await this.findChildren(category.id);
        }
        
        return categories;
    }

    async findChildren(parentId) {
        const children = await this.findAll({ parentId, activeOnly: true });
        
        for (const child of children) {
            child.children = await this.findChildren(child.id);
        }
        
        return children;
    }

    async update(id, updateData) {
        const allowedFields = {
            parentId: 'parent_id',
            name: 'name',
            slug: 'slug',
            description: 'description',
            imageUrl: 'image_url',
            sortOrder: 'sort_order',
            isActive: 'is_active'
        };
        
        const updates = [];
        const params = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields[key] && value !== undefined) {
                updates.push(`${allowedFields[key]} = ?`);
                params.push(value);
            }
        }
        
        if (updates.length === 0) return null;
        
        params.push(id);
        const sql = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
        await query(sql, params);
        
        return this.findById(id);
    }

    async delete(id) {
        return await transaction(async (conn) => {
            // Mover productos a categoría padre o null
            const [category] = await conn.execute('SELECT parent_id FROM categories WHERE id = ?', [id]);
            const newParentId = category[0]?.parent_id || null;
            
            await conn.execute(
                'UPDATE products SET category_id = ? WHERE category_id = ?',
                [newParentId, id]
            );
            
            // Mover subcategorías a nivel del padre
            await conn.execute(
                'UPDATE categories SET parent_id = ? WHERE parent_id = ?',
                [newParentId, id]
            );
            
            // Eliminar atributos específicos de la categoría
            await conn.execute('DELETE FROM attribute_definitions WHERE category_id = ?', [id]);
            
            const [result] = await conn.execute('DELETE FROM categories WHERE id = ?', [id]);
            return result.affectedRows > 0;
        });
    }
}

module.exports = new CategoryRepository();