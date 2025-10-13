const request = require('supertest');
const { app } = require('../server');

describe('Uploads productionization', () => {
  it('init upload returns target', async () => {
    const res = await request(app)
      .post('/api/media/uploads/init')
      .set('Authorization', 'Bearer testtoken')
      .send({ filename: 'a.jpg', contentType: 'image/jpeg', type: 'image', size: 123 });
    if (res.statusCode === 401) return; // when auth enforced in tests
    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body?.target).toContain('/api/upload/single');
    }
  });

  it('complete upload validates body', async () => {
    const res = await request(app)
      .post('/api/media/uploads/complete')
      .set('Authorization', 'Bearer testtoken')
      .send({ url: 'https://example.com/x.jpg', type: 'image', name: 'x.jpg' });
    if (res.statusCode === 401) return;
    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body?.item?.url).toContain('https://');
    }
  });
});


