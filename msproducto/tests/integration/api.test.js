const request = require('supertest');
const app = require('../src/app');

describe('Integration Tests', () => {
    
    describe('Health Check', () => {
        test('GET /health - debe retornar status healthy', async () => {
            const res = await request(app)
                .get('/health')
                .expect(200);
            
            expect(res.body.success).toBe(true);
            expect(res.body.service).toBe('msproducto');
        });
    });

    describe('Products API', () => {
        test('GET /api/v1/products - debe listar productos', async () => {
            const res = await request(app)
                .get('/api/v1/products')
                .expect(200);
            
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toBeDefined();
        });

        test('GET /api/v1/products/:id - debe retornar un producto', async () => {
            // Primero creamos un producto
            const createRes = await request(app)
                .post('/api/v1/products')
                .send({
                    sku: 'TEST-001',
                    name: 'Producto Test',
                    slug: 'producto-test',
                    categoryId: 1,
                    brand: 'TestBrand',
                    price: 99.99,
                    stock: 100,
                    attributes: { color: 'red', size: 'M' },
                    status: 'active'
                });
            
            const productId = createRes.body.data.id;
            
            const res = await request(app)
                .get(`/api/v1/products/${productId}`)
                .expect(200);
            
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(productId);
            expect(res.body.data.sku).toBe('TEST-001');
        });

        test('POST /api/v1/products - debe crear producto', async () => {
            const res = await request(app)
                .post('/api/v1/products')
                .send({
                    sku: 'TEST-002',
                    name: 'Producto Nuevo',
                    slug: 'producto-nuevo',
                    categoryId: 1,
                    brand: 'Marca',
                    price: 49.99,
                    stock: 50,
                    attributes: { color: 'blue' },
                    status: 'active'
                })
                .expect(201);
            
            expect(res.body.success).toBe(true);
            expect(res.body.data.sku).toBe('TEST-002');
            expect(res.body.data.attributes.color).toBe('blue');
        });

        test('POST /api/v1/products - debe rechazar SKU duplicado', async () => {
            await request(app)
                .post('/api/v1/products')
                .send({
                    sku: 'TEST-DUP',
                    name: 'Producto',
                    slug: 'producto-dup-1',
                    categoryId: 1,
                    price: 10
                });
            
            const res = await request(app)
                .post('/api/v1/products')
                .send({
                    sku: 'TEST-DUP',
                    name: 'Producto Duplicado',
                    slug: 'producto-dup-2',
                    categoryId: 1,
                    price: 20
                })
                .expect(409);
            
            expect(res.body.success).toBe(false);
        });
    });

    describe('Categories API', () => {
        test('GET /api/v1/categories - debe listar categorías', async () => {
            const res = await request(app)
                .get('/api/v1/categories')
                .expect(200);
            
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('Client-Product Relations', () => {
        test('POST /api/v1/products/:id/favorite - debe agregar a favoritos', async () => {
            // Crear producto primero
            const createRes = await request(app)
                .post('/api/v1/products')
                .send({
                    sku: 'FAV-001',
                    name: 'Producto Favorito',
                    slug: 'producto-fav',
                    categoryId: 1,
                    price: 100,
                    status: 'active'
                });
            
            const productId = createRes.body.data.id;
            
            const res = await request(app)
                .post(`/api/v1/products/${productId}/favorite`)
                .send({ clientId: 1, notes: 'Me gusta este producto' })
                .expect(200);
            
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Agregado a favoritos');
        });

        test('GET /api/v1/clients/:clientId/favorites - debe listar favoritos', async () => {
            const res = await request(app)
                .get('/api/v1/clients/1/favorites')
                .expect(200);
            
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
});