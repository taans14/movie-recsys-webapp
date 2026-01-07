import axios from 'axios';

const RECOMMENDER_URL = process.env.RECOMMENDER_SERVICE_URL;

export const fetchHybridRecommendations = async (userId, tmdbId, top_n = 10) => {
  try {
    const payload = {
      tmdbId,
      top_n,
      user_id: userId ? userId.toString() : null
    };

    const response = await axios.post(`${RECOMMENDER_URL}/recommend/hybrid`, payload);
    return response.data;
  } catch (error) {
    console.error('Recommender Service Error (Hybrid):', error.message);
    return { success: false, data: [] };
  }
};

export const fetchByCountry = async (countryCode, limit = 20) => {
  const response = await axios.get(`${RECOMMENDER_URL}/discover/by-country`, {
    params: { country: countryCode, limit }
  });
  return response.data;
};

export const fetchByGenre = async (genreIdOrName, limit = 20) => {
  const response = await axios.get(`${RECOMMENDER_URL}/discover/by-genre`, {
    params: { genre: genreIdOrName, limit }
  });
  return response.data;
};

export const fetchTopRated = async (limit = 20) => {
  const response = await axios.get(`${RECOMMENDER_URL}/discover/top-rated`, {
    params: { limit }
  });
  return response.data;
};

export const fetchAvailableGenres = async () => {
  const response = await axios.get(`${RECOMMENDER_URL}/discover/genres`);
  return response.data;
};

export const fetchAvailableCountries = async () => {
  const response = await axios.get(`${RECOMMENDER_URL}/discover/countries`);
  return response.data;
};

export const fetchForYouRecommendations = async (userId, limit = 20) => {
  try {
    const response = await axios.get(`${RECOMMENDER_URL}/recommend/for-you`, {
      params: {
        user_id: userId.toString(),
        limit
      },
    });
    return response.data;
  } catch (error) {
    console.error('Recommender Service Error (For You):', error.message);
    return { success: false, data: [] };
  }
};

export const fetchTrendingMovies = async (timeWindow = 'week', limit = 20) => {
  try {
    const response = await axios.get(`${RECOMMENDER_URL}/discover/trending`, {
      params: {
        time_window: timeWindow,
        limit
      },
    });
    return response.data;
  } catch (error) {
    console.error('Recommender Service Error (Trending):', error.message);
    throw new Error('Failed to fetch trending movies');
  }
};
