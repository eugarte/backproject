module.exports = (err, req, res, next) => {
    console.error('Error:', err);
    
    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Registro duplicado'
        });
    }
    
    // MySQL foreign key constraint
    if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Referencia no válida'
        });
    }
    
    // MySQL data too long
    if (err.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({
            success: false,
            message: 'Dato demasiado largo'
        });
    }
    
    // Validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message,
            errors: err.errors || []
        });
    }
    
    // Not found
    if (err.status === 404) {
        return res.status(404).json({
            success: false,
            message: err.message || 'Recurso no encontrado'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};