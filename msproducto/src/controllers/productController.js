const productService = require('../services/productService');

class ProductController {
    
    async list(req, res, next) {
        try {
            const filters = {
                categoryId: req.query.category_id,
                brand: req.query.brand,
                minPrice: req.query.min_price,
                maxPrice: req.query.max_price,
                status: req.query.status || 'active',
                searchQuery: req.query.q,
                isFeatured: req.query.is_featured === 'true'
            };
            
            // Extraer atributos dinámicos del query
            const attributes = {};
            for (const [key, value] of Object.entries(req.query)) {
                if (key.startsWith('attr_')) {
                    attributes[key.replace('attr_', '')] = value;
                }
            }
            if (Object.keys(attributes).length > 0) {
                filters.attributes = attributes;
            }
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 100),
                sortBy: req.query.sort_by,
                sortOrder: req.query.sort_order
            };
            
            const result = await productService.search(filters, options);
            
            res.json({
                success: true,
                data: result.data.map(p => p.toJSON()),
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const product = await productService.findById(req.params.id);
            
            // Registrar vista si hay cliente autenticado
            if (req.headers['x-client-id']) {
                await productService.recordView(
                    req.headers['x-client-id'],
                    req.params.id,
                    {
                        sessionId: req.headers['x-session-id'],
                        ip: req.ip,
                        userAgent: req.headers['user-agent'],
                        referrer: req.headers.referer
                    }
                );
            }
            
            res.json({
                success: true,
                data: product.toJSON()
            });
        } catch (error) {
            next(error);
        }
    }

    async getBySlug(req, res, next) {
        try {
            const product = await productService.findBySlug(req.params.slug);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: product.toJSON()
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const product = await productService.create(req.body);
            
            res.status(201).json({
                success: true,
                data: product.toJSON()
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: error.errors
                });
            }
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'SKU o slug ya existe'
                });
            }
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const product = await productService.update(req.params.id, req.body);
            
            res.json({
                success: true,
                data: product.toJSON()
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: error.errors
                });
            }
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await productService.delete(req.params.id);
            
            res.json({
                success: true,
                message: 'Producto eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // ===== RELACIONES CLIENTE-PRODUCTO =====
    
    async addToFavorites(req, res, next) {
        try {
            const clientId = req.headers['x-client-id'] || req.body.clientId;
            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere clientId'
                });
            }
            
            await productService.addToFavorites(
                clientId,
                req.params.id,
                req.body.notes
            );
            
            res.json({
                success: true,
                message: 'Agregado a favoritos'
            });
        } catch (error) {
            next(error);
        }
    }

    async removeFromFavorites(req, res, next) {
        try {
            const clientId = req.headers['x-client-id'] || req.body.clientId;
            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere clientId'
                });
            }
            
            await productService.removeFromFavorites(clientId, req.params.id);
            
            res.json({
                success: true,
                message: 'Eliminado de favoritos'
            });
        } catch (error) {
            next(error);
        }
    }

    async getClientFavorites(req, res, next) {
        try {
            const clientId = req.headers['x-client-id'] || req.params.clientId;
            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere clientId'
                });
            }
            
            const result = await productService.getClientFavorites(clientId, {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            });
            
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async isFavorite(req, res, next) {
        try {
            const clientId = req.headers['x-client-id'] || req.query.clientId;
            const isFav = await productService.isFavorite(clientId, req.params.id);
            
            res.json({
                success: true,
                isFavorite: isFav
            });
        } catch (error) {
            next(error);
        }
    }

    async getViewHistory(req, res, next) {
        try {
            const clientId = req.headers['x-client-id'] || req.params.clientId;
            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere clientId'
                });
            }
            
            const result = await productService.getViewHistory(clientId, {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            });
            
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async addReview(req, res, next) {
        try {
            const reviewData = {
                clientId: req.headers['x-client-id'] || req.body.clientId,
                productId: req.params.id,
                variantId: req.body.variantId,
                orderId: req.body.orderId,
                rating: req.body.rating,
                title: req.body.title,
                comment: req.body.comment,
                pros: req.body.pros,
                cons: req.body.cons,
                isVerifiedPurchase: req.body.isVerifiedPurchase,
                images: req.body.images
            };
            
            const reviewId = await productService.addReview(reviewData);
            
            res.status(201).json({
                success: true,
                message: 'Reseña agregada',
                reviewId
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
        }
    }

    async getReviews(req, res, next) {
        try {
            const result = await productService.getProductReviews(req.params.id, {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                approvedOnly: req.query.approved !== 'false'
            });
            
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async createPriceAlert(req, res, next) {
        try {
            const clientId = req.headers['x-client-id'] || req.body.clientId;
            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere clientId'
                });
            }
            
            await productService.createPriceAlert(
                clientId,
                req.params.id,
                req.body.targetPrice
            );
            
            res.json({
                success: true,
                message: 'Alerta de precio creada'
            });
        } catch (error) {
            next(error);
        }
    }

    async getPriceAlerts(req, res, next) {
        try {
            const clientId = req.headers['x-client-id'] || req.params.clientId;
            if (!clientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere clientId'
                });
            }
            
            const alerts = await productService.getPriceAlerts(clientId);
            
            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();