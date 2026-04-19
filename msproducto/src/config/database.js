const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    
    connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 15,
    queueLimit: 0,
    waitForConnections: true,
    
    connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    acquireTimeout: 10000,
    idleTimeout: 600000,
    
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    
    typeCast: function(field, next) {
        if (field.type === 'JSON') {
            const value = field.string();
            return value ? JSON.parse(value) : null;
        }
        return next();
    }
});

const query = async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
};

const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const healthCheck = async () => {
    try {
        await pool.execute('SELECT 1');
        return { status: 'healthy', database: 'connected' };
    } catch (error) {
        return { status: 'unhealthy', database: 'disconnected', error: error.message };
    }
};

module.exports = { pool, query, transaction, healthCheck };