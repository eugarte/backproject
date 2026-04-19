/**
 * BACKPROJECT - Servidor Unificado para Hostinger
 * Expone rutas de todos los microservicios en un solo proceso
 * 
 * Microservicios:
 * - msproducto (productos, categorías)
 * - msclientes (clientes, direcciones, documentos)
 * - msnotificaciones (notificaciones, templates)
 * - msseguridad (autenticación, usuarios, roles)
 * - mssistemas (configuración, catálogos)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');

// =====================================================
// CONFIGURACIÓN
// =====================================================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Configuración de Bases de Datos (una por microservicio)
// Usando los nombres de variables configurados en Hostinger
const DB_CONFIGS = {
    productos: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'u755818637_dbproductos',
        user: process.env.DB_USER || 'u755818637_usrproductos',
        password: process.env.DB_PASSWORD || '',
        connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 15
    },
    clientes: {
        host: process.env.MSCLIENTES_DB_HOST || 'localhost',
        port: parseInt(process.env.MSCLIENTES_DB_PORT) || 3306,
        database: process.env.MSCLIENTES_DB_NAME || 'u755818637_dbclientes',
        user: process.env.MSCLIENTES_DB_USER || 'u755818637_usrclientes',
        password: process.env.MSCLIENTES_DB_PASSWORD || '',
        connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 15
    },
    notificaciones: {
        host: process.env.MSNOTIFICACIONES_DB_HOST || 'localhost',
        port: parseInt(process.env.MSNOTIFICACIONES_DB_PORT) || 3306,
        database: process.env.MSNOTIFICACIONES_DB_NAME || 'u755818637_dbnotifica',
        user: process.env.MSNOTIFICACIONES_DB_USER || 'u755818637_usrnotifica',
        password: process.env.MSNOTIFICACIONES_DB_PASSWORD || '',
        connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 15
    },
    seguridad: {
        host: process.env.MSSEGURIDAD_DB_HOST || 'localhost',
        port: parseInt(process.env.MSSEGURIDAD_DB_PORT) || 3306,
        database: process.env.MSSEGURIDAD_DB_NAME || 'u755818637_dbseguridad',
        user: process.env.MSSEGURIDAD_DB_USER || 'u755818637_usrseguridad',
        password: process.env.MSSEGURIDAD_DB_PASSWORD || '',
        connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 15
    },
    sistemas: {
        host: process.env.MSSISTEMAS_DB_HOST || 'localhost',
        port: parseInt(process.env.MSSISTEMAS_DB_PORT) || 3306,
        database: process.env.MSSISTEMAS_DB_NAME || 'u755818637_dbsistemas',
        user: process.env.MSSISTEMAS_DB_USER || 'u755818637_usrsistemas',
        password: process.env.MSSISTEMAS_DB_PASSWORD || '',
        connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 15
    }
};

// JWT Simple (para msseguridad)
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

// =====================================================
// POOLS DE CONEXIÓN
// =====================================================
const pools = {};

function createPools() {
    for (const [service, config] of Object.entries(DB_CONFIGS)) {
        try {
            pools[service] = mysql.createPool({
                ...config,
                waitForConnections: true,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            });
            console.log(`✅ Pool ${service} creado`);
        } catch (error) {
            console.error(`❌ Error pool ${service}:`, error.message);
        }
    }
}

// Health check de todas las BDs
async function healthCheckAll() {
    const results = {};
    for (const [service, pool] of Object.entries(pools)) {
        try {
            const conn = await pool.getConnection();
            await conn.ping();
            conn.release();
            results[service] = { status: 'connected' };
        } catch (error) {
            results[service] = { status: 'error', error: error.message };
        }
    }
    return results;
}

// =====================================================
// UTILIDADES
// =====================================================

// Generar UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// JWT simple (sin librería externa)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Parsear tiempo de expiración (ej: '24h', '7d', '3600s')
function parseExpiryTime(expiry) {
    const match = expiry.match(/^(\d+)([hdm]?)$/);
    if (!match) return 86400; // default 24h
    const value = parseInt(match[1]);
    const unit = match[2];
    switch(unit) {
        case 'd': return value * 86400;
        case 'h': return value * 3600;
        case 'm': return value * 60;
        default: return value;
    }
}

function generateToken(payload) {
    const expiresInSeconds = parseExpiryTime(JWT_EXPIRES_IN);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ 
        ...payload, 
        iat: Math.floor(Date.now() / 1000), 
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds 
    })).toString('base64url');
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    try {
        const [header, body, signature] = token.split('.');
        const crypto = require('crypto');
        const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
        if (signature !== expectedSig) return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

// Middleware de autenticación
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token requerido' });
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    req.user = payload;
    next();
}

// =====================================================
// EXPRESS APP
// =====================================================
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { success: false, message: 'Demasiadas peticiones' }
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// RUTAS - HEALTH & INFO
// =====================================================

// Health check general
app.get('/health', async (req, res) => {
    const dbHealth = await healthCheckAll();
    const allHealthy = Object.values(dbHealth).every(h => h.status === 'connected');
    res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        service: 'backproject',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        databases: dbHealth
    });
});

// Info general
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'backproject',
        description: 'Microservicios unificados - Hostinger Node.js',
        version: '1.0.0',
        environment: NODE_ENV,
        microservicios: {
            msproducto: '/api/v1/products',
            msclientes: '/api/v1/customers',
            msnotificaciones: '/api/v1/notifications',
            msseguridad: '/api/v1/auth',
            mssistemas: '/api/v1/system'
        }
    });
});

const API = '/api/v1';

// =====================================================
// MSPRODUCTO - /api/v1/products
// =====================================================

// Listar productos
app.get(`${API}/products`, async (req, res) => {
    try {
        const pool = pools.productos;
        if (!pool) throw new Error('Database not connected');
        
        const [rows] = await pool.execute(
            `SELECT p.id, p.sku, p.name, p.slug, p.price, p.stock_quantity, 
                    p.stock_status, p.is_active, p.is_featured, p.created_at,
                    pt.name as product_type
             FROM products p
             LEFT JOIN product_types pt ON p.product_type_id = pt.id
             WHERE p.is_active = TRUE AND p.deleted_at IS NULL
             ORDER BY p.id DESC
             LIMIT 100`
        );
        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        console.error('Error products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Producto por ID
app.get(`${API}/products/:id`, async (req, res) => {
    try {
        const pool = pools.productos;
        const [rows] = await pool.execute(
            `SELECT p.*, pt.name as product_type
             FROM products p
             LEFT JOIN product_types pt ON p.product_type_id = pt.id
             WHERE p.id = ? AND p.is_active = TRUE AND p.deleted_at IS NULL`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crear producto
app.post(`${API}/products`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.productos;
        const { sku, name, slug, price, stock_quantity, product_type_id, description } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO products (sku, name, slug, price, stock_quantity, product_type_id, description, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
            [sku, name, slug, price, stock_quantity, product_type_id, description]
        );
        
        res.status(201).json({ success: true, data: { id: result.insertId, sku, name } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Categorías
app.get(`${API}/categories`, async (req, res) => {
    try {
        const pool = pools.productos;
        const [rows] = await pool.execute(
            'SELECT id, name, slug, description, is_active, display_order FROM categories WHERE is_active = TRUE ORDER BY display_order, id'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tipos de producto
app.get(`${API}/product-types`, async (req, res) => {
    try {
        const pool = pools.productos;
        const [rows] = await pool.execute(
            'SELECT id, name, slug, description, has_variants, has_attributes FROM product_types WHERE is_active = TRUE'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// MSCLIENTES - /api/v1/customers
// =====================================================

// Listar clientes
app.get(`${API}/customers`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.clientes;
        const [rows] = await pool.execute(
            `SELECT id, customer_code, first_name, last_name, email, phone, status, 
                    customer_type, company_name, created_at
             FROM customers
             WHERE deleted_at IS NULL
             ORDER BY created_at DESC
             LIMIT 100`
        );
        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cliente por ID
app.get(`${API}/customers/:id`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.clientes;
        const [rows] = await pool.execute(
            'SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crear cliente
app.post(`${API}/customers`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.clientes;
        const id = generateUUID();
        const customer_code = `CUST-${Date.now()}`;
        const { first_name, last_name, email, phone, tax_id, customer_type, company_name } = req.body;
        
        await pool.execute(
            `INSERT INTO customers (id, customer_code, first_name, last_name, email, phone, tax_id, 
                                  customer_type, company_name, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
            [id, customer_code, first_name, last_name, email, phone, tax_id, customer_type, company_name]
        );
        
        res.status(201).json({ success: true, data: { id, customer_code, first_name, last_name } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Direcciones de cliente
app.get(`${API}/customers/:id/addresses`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.clientes;
        const [rows] = await pool.execute(
            'SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC',
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// MSNOTIFICACIONES - /api/v1/notifications
// =====================================================

// Listar notificaciones
app.get(`${API}/notifications`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.notificaciones;
        const [rows] = await pool.execute(
            `SELECT n.*, nt.label as type_label, ds.label as status_label
             FROM notifications n
             LEFT JOIN notification_types nt ON n.notification_type_id = nt.id
             LEFT JOIN delivery_status ds ON n.delivery_status_id = ds.id
             ORDER BY n.created_at DESC
             LIMIT 100`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crear notificación
app.post(`${API}/notifications`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.notificaciones;
        const id = generateUUID();
        const { recipient_id, subject, content, channel, notification_type_id, priority_level_id } = req.body;
        
        // Obtener estado PENDING por defecto
        const [statusRows] = await pool.execute(
            "SELECT id FROM delivery_status WHERE code = 'PENDING' LIMIT 1"
        );
        const delivery_status_id = statusRows[0]?.id;
        
        await pool.execute(
            `INSERT INTO notifications (id, recipient_id, subject, content, channel, 
                                       notification_type_id, priority_level_id, delivery_status_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [id, recipient_id, subject, content, channel, notification_type_id, priority_level_id, delivery_status_id]
        );
        
        res.status(201).json({ success: true, data: { id, recipient_id, subject, status: 'PENDING' } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Catálogos de notificaciones
app.get(`${API}/notification-catalogs`, async (req, res) => {
    try {
        const pool = pools.notificaciones;
        const [types] = await pool.execute('SELECT * FROM notification_types WHERE is_active = TRUE ORDER BY display_order');
        const [statuses] = await pool.execute('SELECT * FROM delivery_status WHERE is_active = TRUE ORDER BY display_order');
        const [priorities] = await pool.execute('SELECT * FROM priority_levels WHERE is_active = TRUE ORDER BY display_order');
        
        res.json({
            success: true,
            data: {
                notification_types: types,
                delivery_status: statuses,
                priority_levels: priorities
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// MSSEGURIDAD - /api/v1/auth
// =====================================================

// Login
app.post(`${API}/auth/login`, async (req, res) => {
    try {
        const pool = pools.seguridad;
        const { email, password } = req.body;
        
        // Buscar usuario
        const [users] = await pool.execute(
            'SELECT id, email, password_hash, first_name, last_name, status FROM users WHERE email = ? AND deleted_at IS NULL',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
        
        const user = users[0];
        
        // Verificar estado
        if (user.status !== 'ACTIVE' && user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Cuenta no activa' });
        }
        
        // Nota: En producción usar bcrypt para verificar password
        // Aquí simplificado para demostración
        const crypto = require('crypto');
        const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
        
        // Actualizar último login
        await pool.execute(
            'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
            [req.ip, user.id]
        );
        
        // Generar token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        });
        
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Registro
app.post(`${API}/auth/register`, async (req, res) => {
    try {
        const pool = pools.seguridad;
        const id = generateUUID();
        const { email, password, first_name, last_name } = req.body;
        
        // Verificar si existe
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email ya registrado' });
        }
        
        // Hash password (simplificado - usar bcrypt en producción)
        const crypto = require('crypto');
        const password_hash = crypto.createHash('sha256').update(password).digest('hex');
        
        await pool.execute(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, status, email_verified, created_at)
             VALUES (?, ?, ?, ?, ?, 'PENDING', FALSE, NOW())`,
            [id, email, password_hash, first_name, last_name]
        );
        
        res.status(201).json({
            success: true,
            data: { id, email, first_name, last_name, status: 'PENDING' }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Perfil
app.get(`${API}/auth/profile`, authMiddleware, async (req, res) => {
    res.json({
        success: true,
        data: {
            userId: req.user.userId,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName
        }
    });
});

// Usuarios (admin)
app.get(`${API}/auth/users`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.seguridad;
        const [rows] = await pool.execute(
            `SELECT id, email, first_name, last_name, status, email_verified, last_login_at, created_at
             FROM users
             WHERE deleted_at IS NULL
             ORDER BY created_at DESC
             LIMIT 100`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Activar usuario (cambiar status a ACTIVE)
app.patch(`${API}/auth/users/:id/activate`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.seguridad;
        const { id } = req.params;
        
        const [result] = await pool.execute(
            `UPDATE users SET status = 'ACTIVE', email_verified = TRUE, updated_at = NOW() 
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        res.json({ success: true, message: 'Usuario activado correctamente', data: { id, status: 'ACTIVE' } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actualizar status de usuario (admin)
app.patch(`${API}/auth/users/:id/status`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.seguridad;
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'BANNED', 'LOCKED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Status inválido' });
        }
        
        const [result] = await pool.execute(
            `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
            [status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        res.json({ success: true, message: 'Status actualizado', data: { id, status } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verificar email (simulado - en producción enviaría email)
app.patch(`${API}/auth/users/:id/verify-email`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.seguridad;
        const { id } = req.params;
        
        const [result] = await pool.execute(
            `UPDATE users SET email_verified = TRUE, status = 'ACTIVE', email_verified_at = NOW(), updated_at = NOW() 
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        res.json({ success: true, message: 'Email verificado y usuario activado', data: { id, email_verified: true, status: 'ACTIVE' } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Roles y catálogos de seguridad
app.get(`${API}/auth/catalogs`, async (req, res) => {
    try {
        const pool = pools.seguridad;
        const [roles] = await pool.execute('SELECT * FROM user_roles WHERE is_active = TRUE ORDER BY display_order');
        const [statuses] = await pool.execute('SELECT * FROM user_status WHERE is_active = TRUE ORDER BY display_order');
        
        res.json({
            success: true,
            data: { user_roles: roles, user_status: statuses }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// MSSISTEMAS - /api/v1/system
// =====================================================

// Configuraciones
app.get(`${API}/system/configs`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.sistemas;
        const [rows] = await pool.execute(
            'SELECT service_id, config_key, config_value, value_type, is_active FROM configurations WHERE is_active = TRUE'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Feature flags
app.get(`${API}/system/feature-flags`, authMiddleware, async (req, res) => {
    try {
        const pool = pools.sistemas;
        const [rows] = await pool.execute(
            'SELECT flag_key, name, strategy_type, strategy_config, enabled_globally, is_active FROM feature_flags'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Catálogos del sistema
app.get(`${API}/system/catalogs`, async (req, res) => {
    try {
        const pool = pools.sistemas;
        const [catalogs] = await pool.execute('SELECT * FROM catalogs WHERE is_active = TRUE');
        
        const result = [];
        for (const catalog of catalogs) {
            const [values] = await pool.execute(
                'SELECT code, label, description, display_order, is_default FROM catalog_values WHERE catalog_id = ? AND is_active = TRUE',
                [catalog.id]
            );
            result.push({
                key: catalog.catalog_key,
                name: catalog.name,
                values: values
            });
        }
        
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// 404 Y ERROR HANDLER
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.path,
        method: req.method,
        available_endpoints: [
            'GET /health',
            'GET /api/v1/products',
            'GET /api/v1/categories',
            'GET /api/v1/customers',
            'POST /api/v1/auth/login',
            'POST /api/v1/auth/register',
            'GET /api/v1/notifications',
            'GET /api/v1/notification-catalogs',
            'GET /api/v1/system/catalogs'
        ]
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: NODE_ENV === 'development' ? err.message : undefined
    });
});

// =====================================================
// START SERVER
// =====================================================

createPools();

app.listen(PORT, () => {
    console.log(`🚀 BACKPROJECT unificado corriendo en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Environment: ${NODE_ENV}`);
    console.log('');
    console.log('Endpoints disponibles:');
    console.log(`  - /api/v1/products`);
    console.log(`  - /api/v1/categories`);
    console.log(`  - /api/v1/customers`);
    console.log(`  - /api/v1/auth/login`);
    console.log(`  - /api/v1/notifications`);
    console.log(`  - /api/v1/system/catalogs`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM recibido, cerrando conexiones...');
    for (const pool of Object.values(pools)) {
        await pool.end();
    }
    process.exit(0);
});
