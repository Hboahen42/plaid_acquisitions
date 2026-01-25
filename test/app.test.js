import request from 'supertest';
import app from '#src/app.js';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Mozilla/5.0')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app)
        .get('/api')
        .set('User-Agent', 'Mozilla/5.0')
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Plaid Acquisitions API is running!'
      );
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .set('User-Agent', 'Mozilla/5.0')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found!');
    });
  });
});
