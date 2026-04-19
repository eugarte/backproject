const { healthCheck, query } = require('../../src/config/database');

describe('Database', () => {
    test('healthCheck debe retornar status', async () => {
        const result = await healthCheck();
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('database');
    });
});

module.exports = { query };