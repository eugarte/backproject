const attributeRepository = require('../repositories/attributeRepository');

class AttributeController {
    
    async list(req, res, next) {
        try {
            let attributes;
            
            if (req.query.category_id) {
                attributes = await attributeRepository.findByCategory(req.query.category_id);
            } else if (req.query.global === 'true') {
                attributes = await attributeRepository.findGlobal();
            } else {
                // Listar todos
                attributes = await attributeRepository.findAll();
            }
            
            res.json({
                success: true,
                data: attributes
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const attribute = await attributeRepository.findById(req.params.id);
            
            if (!attribute) {
                return res.status(404).json({
                    success: false,
                    message: 'Atributo no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: attribute
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const id = await attributeRepository.create(req.body);
            const attribute = await attributeRepository.findById(id);
            
            res.status(201).json({
                success: true,
                data: attribute
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const attribute = await attributeRepository.update(req.params.id, req.body);
            
            if (!attribute) {
                return res.status(404).json({
                    success: false,
                    message: 'Atributo no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: attribute
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const deleted = await attributeRepository.delete(req.params.id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Atributo no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Atributo eliminado'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AttributeController();