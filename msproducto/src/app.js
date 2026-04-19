const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('../routes');
const errorHandler = require('../middleware/errorHandler');
const { healthCheck } = require('../config/database');

const app = express();

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        message: 'Demasiadas peticiones, intente más tarde'
    }
});
app.use(limiter);

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
    const dbHealth = await healthCheck();
    res.json({
        success: true,
        service: process.env.APP_NAME || 'msproducto',
        version: process.env.APP_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
        database: dbHealth
    });
});

const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(apiPrefix, routes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

app.use(errorHandler);

process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing gracefully');
    process.exit(0);
});

module.exports = app;