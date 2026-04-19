const Product = require('../../src/models/Product');

describe('Product Model', () => {
    test('debe crear instancia con datos mínimos', () => {
        const data = {
            id: 1,
            sku: 'TEST-001',
            name: 'Producto Test',
            slug: 'producto-test',
            category_id: 1,
            price: 99.99,
            stock: 100,
            attributes: '{"color": "red"}',
            status: 'active'
        };
        
        const product = new Product(data);
        
        expect(product.id).toBe(1);
        expect(product.sku).toBe('TEST-001');
        expect(product.attributes.color).toBe('red');
    });

    test('debe parsear JSON de atributos', () => {
        const data = {
            id: 1,
            sku: 'TEST',
            name: 'Test',
            slug: 'test',
            category_id: 1,
            price: 10,
            attributes: '{"cpu": "Intel i7", "ram_gb": 16}'
        };
        
        const product = new Product(data);
        
        expect(product.attributes.cpu).toBe('Intel i7');
        expect(product.attributes.ram_gb).toBe(16);
    });

    test('debe retornar valor por defecto si atributo no existe', () => {
        const data = {
            id: 1,
            sku: 'TEST',
            name: 'Test',
            slug: 'test',
            category_id: 1,
            price: 10,
            attributes: '{}'
        };
        
        const product = new Product(data);
        
        expect(product.getAttribute('color', 'default')).toBe('default');
    });

    test('toJSON debe retornar estructura correcta', () => {
        const data = {
            id: 1,
            sku: 'TEST-001',
            name: 'Producto',
            slug: 'producto',
            category_id: 1,
            brand: 'Marca',
            price: 99.99,
            stock: 100,
            status: 'active'
        };
        
        const product = new Product(data);
        const json = product.toJSON();
        
        expect(json).toHaveProperty('pricing');
        expect(json).toHaveProperty('stock');
        expect(json.pricing.price).toBe(99.99);
    });
});