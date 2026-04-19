import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';

describe('API Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('msclientes');
    });
  });

  describe('API Documentation', () => {
    it('should return API docs', async () => {
      const response = await request(app)
        .get('/api/v1/docs')
        .expect(200);

      expect(response.body.service).toBe('msclientes');
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('Customer Endpoints (Protected)', () => {
    it('should require authentication for customers list', async () => {
      await request(app)
        .get('/api/v1/customers')
        .expect(401);
    });

    it('should require authentication for customer creation', async () => {
      await request(app)
        .post('/api/v1/customers')
        .send({ firstName: 'John', lastName: 'Doe' })
        .expect(401);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-route')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });
});
