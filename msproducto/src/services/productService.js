const productRepository = require('../repositories/productRepository');
const attributeRepository = require('../repositories/attributeRepository');

class ProductService {
    
    async create(productData) {
        // Validar atributos si hay categoría
        if (productData.attributes && productData.categoryId) {
            const validation = await this.validateAttributes(
                productData.categoryId,
                productData.attributes
            );
            
            if (!validation.isValid) {
                const error = new Error('Validación de atributos fallida');
                error.name = 'ValidationError';
                error.errors = validation.errors;
                throw error;
            }
        }
        
        return await productRepository.create(productData);
    }

    async findById(id) {
        const product = await productRepository.findById(id);
        if (!product) {
            const error = new Error('Producto no encontrado');
            error.status = 404;
            throw error;
        }
        return product;
    }

    async search(filters, options) {
        return await productRepository.search(filters, options);
    }

    async update(id, updateData) {
        const existing = await productRepository.findById(id, false);
        if (!existing) {
            const error = new Error('Producto no encontrado');
            error.status = 404;
            throw error;
        }
        
        // Validar atributos si se actualizan
        if (updateData.attributes) {
            const categoryId = updateData.categoryId || existing.categoryId;
            const mergedAttrs = { ...existing.attributes, ...updateData.attributes };
            
            const validation = await this.validateAttributes(categoryId, mergedAttrs);
            if (!validation.isValid) {
                const error = new Error('Validación de atributos fallida');
                error.name = 'ValidationError';
                error.errors = validation.errors;
                throw error;
            }
        }
        
        return await productRepository.update(id, updateData);
    }

    async delete(id) {
        const deleted = await productRepository.delete(id);
        if (!deleted) {
            const error = new Error('Producto no encontrado');
            error.status = 404;
            throw error;
        }
        return deleted;
    }

    async validateAttributes(categoryId, attributes) {
        const definitions = await attributeRepository.findByCategory(categoryId);
        const errors = [];
        
        for (const def of definitions) {
            const value = attributes[def.code];
            
            // Validar requerido
            if (def.is_required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field: def.code,
                    message: `El atributo "${def.name}" es requerido`
                });
                continue;
            }
            
            if (!value && !def.is_required) continue;
            
            // Validar tipo de dato
            const typeError = this.validateDataType(value, def.data_type, def);
            if (typeError) {
                errors.push(typeError);
                continue;
            }
            
            // Validar reglas
            if (def.validation_rules) {
                const rules = typeof def.validation_rules === 'string' 
                    ? JSON.parse(def.validation_rules) 
                    : def.validation_rules;
                
                const ruleError = this.validateRules(value, rules, def);
                if (ruleError) errors.push(ruleError);
            }
            
            // Validar opciones enum
            if (def.data_type === 'enum' && def.options) {
                const options = typeof def.options === 'string' 
                    ? JSON.parse(def.options) 
                    : def.options;
                
                if (!options.includes(value)) {
                    errors.push({
                        field: def.code,
                        message: `"${def.name}" debe ser uno de: ${options.join(', ')}`
                    });
                }
            }
        }
        
        return { isValid: errors.length === 0, errors };
    }

    validateDataType(value, dataType, def) {
        switch (dataType) {
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    return {
                        field: def.code,
                        message: `"${def.name}" debe ser un número`
                    };
                }
                break;
                
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return {
                        field: def.code,
                        message: `"${def.name}" debe ser verdadero o falso`
                    };
                }
                break;
                
            case 'date':
                if (isNaN(Date.parse(value))) {
                    return {
                        field: def.code,
                        message: `"${def.name}" debe ser una fecha válida`
                    };
                }
                break;
                
            case 'array':
            case 'multiselect':
                if (!Array.isArray(value)) {
                    return {
                        field: def.code,
                        message: `"${def.name}" debe ser una lista`
                    };
                }
                break;
        }
        return null;
    }

    validateRules(value, rules, def) {
        if (rules.min !== undefined && value < rules.min) {
            return {
                field: def.code,
                message: `"${def.name}" debe ser mayor o igual a ${rules.min}`
            };
        }
        
        if (rules.max !== undefined && value > rules.max) {
            return {
                field: def.code,
                message: `"${def.name}" debe ser menor o igual a ${rules.max}`
            };
        }
        
        if (rules.maxLength && String(value).length > rules.maxLength) {
            return {
                field: def.code,
                message: `"${def.name}" no puede exceder ${rules.maxLength} caracteres`
            };
        }
        
        if (rules.pattern) {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(value)) {
                return {
                    field: def.code,
                    message: `"${def.name}" no tiene el formato válido`
                };
            }
        }
        
        return null;
    }

    // ===== MÉTODOS DE RELACIÓN CLIENTE-PRODUCTO =====
    
    async addToFavorites(clientId, productId, notes) {
        return await productRepository.addToFavorites(clientId, productId, notes);
    }

    async removeFromFavorites(clientId, productId) {
        return await productRepository.removeFromFavorites(clientId, productId);
    }

    async getClientFavorites(clientId, options) {
        return await productRepository.getClientFavorites(clientId, options);
    }

    async isFavorite(clientId, productId) {
        return await productRepository.isFavorite(clientId, productId);
    }

    async recordView(clientId, productId, sessionData) {
        return await productRepository.recordProductView(clientId, productId, sessionData);
    }

    async getViewHistory(clientId, options) {
        return await productRepository.getClientViewHistory(clientId, options);
    }

    async addReview(reviewData) {
        // Validar que el rating esté entre 1 y 5
        if (reviewData.rating < 1 || reviewData.rating > 5) {
            const error = new Error('El rating debe estar entre 1 y 5');
            error.name = 'ValidationError';
            throw error;
        }
        
        return await productRepository.addReview(reviewData);
    }

    async getProductReviews(productId, options) {
        return await productRepository.getProductReviews(productId, options);
    }

    async createPriceAlert(clientId, productId, targetPrice) {
        return await productRepository.createPriceAlert(clientId, productId, targetPrice);
    }

    async getPriceAlerts(clientId) {
        return await productRepository.getClientPriceAlerts(clientId);
    }
}

module.exports = new ProductService();