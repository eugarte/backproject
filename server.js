/**
 * Entry Point para Hostinger Node.js Hosting
 * msproducto - Microservicio de Catálogo de Productos
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');

// Configuración desde variables de entorno Hostinger
const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || 'msproducto';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';

// Configuración de Base de Datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'u755818637_dbproductos',
    user: process.env.DB_USER || 'u755818637_usrproductos',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// Crear pool de conexiones
let pool;
try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Database pool created');
} catch (error) {
    console.error('❌ Error creating database pool:', error.message);
}

// Health check de BD
async function healthCheck() {
    try {
        if (!pool) return { status: 'disconnected', error: 'No pool' };
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        return { status: 'connected', timestamp: new Date().toISOString() };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
}

// Crear app Express
const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        message: 'Demasiadas peticiones, intente más tarde'
    }
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// RUTAS
// =====================================================

// Health Check
app.get('/health', async (req, res) => {
    const dbHealth = await healthCheck();
    res.json({
        success: true,
        service: APP_NAME,
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        database: dbHealth,
        status: 'running'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: APP_NAME,
        version: APP_VERSION,
        message: 'Backend API - Hostinger Node.js',
        endpoints: {
            health: '/health',
            api: '/api/v1'
        }
    });
});

// API v1
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Productos
app.get(`${apiPrefix}/products`, async (req, res) => {
    try {
        if (!pool) throw new Error('Database not connected');
        const [rows] = await pool.execute(
            'SELECT id, sku, name, slug, price, stock_quantity, stock_status, is_active FROM products WHERE is_active = TRUE ORDER BY id DESC LIMIT 100'
        );
        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get(`${apiPrefix}/products/:id`, async (req, res) => {
    try {
        if (!pool) throw new Error('Database not connected');
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Categorías
app.get(`${apiPrefix}/categories`, async (req, res) => {
    try {
        if (!pool) throw new Error('Database not connected');
        const [rows] = await pool.execute(
            'SELECT id, name, slug, description, is_active FROM categories WHERE is_active = TRUE ORDER BY display_order, id'
        );
        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tipos de producto
app.get(`${apiPrefix}/product-types`, async (req, res) => {
    try {
        if (!pool) throw new Error('Database not connected');
        const [rows] = await pool.execute(
            'SELECT id, name, slug, description, has_variants, has_attributes FROM product_types WHERE is_active = TRUE'
        );
        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        console.error('Error fetching product types:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing gracefully');
    if (pool) pool.end();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ${APP_NAME} v${APP_VERSION} running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
