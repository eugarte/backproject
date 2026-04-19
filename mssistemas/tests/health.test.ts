import request from 'supertest';
import { Express } from 'express';
import { app } from '../src/main';

describe('Health Check', () => {
  it('should return 200 for health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('UP');
  });
});