const categoryRepository = require('../repositories/categoryRepository');

class CategoryController {
    
    async list(req, res, next) {
        try {
            const options = {
                parentId: req.query.parent_id === 'null' ? null : req.query.parent_id,
                activeOnly: req.query.active !== 'false'
            };
            
            let categories;
            if (req.query.tree === 'true') {
                categories = await categoryRepository.findTree();
            } else {
                categories = await categoryRepository.findAll(options);
            }
            
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const category = await categoryRepository.findById(req.params.id);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }
            
            res.json({
                success: true,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const id = await categoryRepository.create(req.body);
            const category = await categoryRepository.findById(id);
            
            res.status(201).json({
                success: true,
                data: category
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Slug ya existe'
                });
            }
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const category = await categoryRepository.update(req.params.id, req.body);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }
            
            res.json({
                success: true,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const deleted = await categoryRepository.delete(req.params.id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }
            
            res.json({
                success: true,
                message: 'Categoría eliminada'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CategoryController();