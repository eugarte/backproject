const { query } = require('../config/database');

class AttributeRepository {
    
    async create(data) {
        const sql = `
            INSERT INTO attribute_definitions 
            (category_id, name, code, description, data_type, is_required, is_filterable, is_searchable, default_value, validation_rules, options, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await query(sql, [
            data.categoryId || null,
            data.name,
            data.code,
            data.description || null,
            data.dataType,
            data.isRequired || false,
            data.isFilterable || false,
            data.isSearchable || false,
            data.defaultValue ? JSON.stringify(data.defaultValue) : null,
            data.validationRules ? JSON.stringify(data.validationRules) : null,
            data.options ? JSON.stringify(data.options) : null,
            data.sortOrder || 0
        ]);
        
        return result.insertId;
    }

    async findById(id) {
        const rows = await query('SELECT * FROM attribute_definitions WHERE id = ?', [id]);
        return rows[0] || null;
    }

    async findByCategory(categoryId) {
        const sql = `
            SELECT * FROM attribute_definitions 
            WHERE category_id = ? OR category_id IS NULL
            ORDER BY category_id IS NULL, sort_order ASC
        `;
        return await query(sql, [categoryId]);
    }

    async findGlobal() {
        return await query('SELECT * FROM attribute_definitions WHERE category_id IS NULL ORDER BY sort_order ASC');
    }

    async update(id, updateData) {
        const allowedFields = {
            name: 'name',
            code: 'code',
            description: 'description',
            dataType: 'data_type',
            isRequired: 'is_required',
            isFilterable: 'is_filterable',
            isSearchable: 'is_searchable',
            defaultValue: 'default_value',
            validationRules: 'validation_rules',
            options: 'options',
            sortOrder: 'sort_order'
        };
        
        const updates = [];
        const params = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields[key] && value !== undefined) {
                updates.push(`${allowedFields[key]} = ?`);
                const val = ['defaultValue', 'validationRules', 'options'].includes(key) 
                    ? JSON.stringify(value) 
                    : value;
                params.push(val);
            }
        }
        
        if (updates.length === 0) return null;
        
        params.push(id);
        const sql = `UPDATE attribute_definitions SET ${updates.join(', ')} WHERE id = ?`;
        await query(sql, params);
        
        return this.findById(id);
    }

    async delete(id) {
        const result = await query('DELETE FROM attribute_definitions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new AttributeRepository();