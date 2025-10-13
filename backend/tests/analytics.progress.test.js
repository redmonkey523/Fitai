const request = require('supertest');
const { app } = require('../server');

describe('GET /api/analytics/progress', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/analytics/progress');
    expect(res.statusCode).toBe(401);
  });
});


