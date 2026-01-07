import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/config/redis.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
    call: jest.fn(),
  },
}));

jest.unstable_mockModule('axios', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const recommendationService = await import('../../src/modules/recommendation/recommendation.service.js');
const axios = (await import('axios')).default;
const redis = (await import('../../src/config/redis.js')).default;

describe('Unit: Recommendation Service', () => {

  it('fetchHybridRecommendations - should return data when calls succeed', async () => {
    const mockData = [{ tmdbId: 101, title: 'Inception' }];
    axios.post.mockResolvedValue({ data: { success: true, data: mockData } });

    const result = await recommendationService.fetchHybridRecommendations('user123', 550, 10);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, data: mockData });
  });

  it('fetchHybridRecommendations - should throw error if Python service fails', async () => {
    axios.post.mockRejectedValue(new Error('Service Down'));

    const result = await recommendationService.fetchHybridRecommendations('user123', 550, 10);
    expect(result).toEqual({ success: false, data: [] });
  });
});
