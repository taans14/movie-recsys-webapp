import request from 'supertest';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/config/redis.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
    call: jest.fn().mockImplementation((command) => {
      if (command === 'SCRIPT') {
        return Promise.resolve('dummy_sha_string_123');
      }
      return Promise.resolve([1, 2000]);
    }),
  },
}));

jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const createApp = (await import('../../src/app.js')).default;

describe('Integration: Discover API', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /discover - should return 200 and movies', async () => {
    const axios = (await import('axios')).default;
    axios.get.mockResolvedValue({
      data: { success: true, data: [{ tmdbId: 999, title: 'Test Movie' }] }
    });

    const res = await request(app).get('/api/v1/recommendation/discover?type=country&value=US');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      expect(res.body.data[0].title).toBe('Test Movie');
    }
  });
});
