import axios from "axios";
import Movie from "../movies/movies.schema.js";

const RECOMMENDER_URL = process.env.RECOMMENDER_SERVICE_URL;

export const fetchHybridRecommendations = async (
  userId,
  tmdbId,
  top_n = 10,
) => {
  try {
    const payload = {
      tmdbId,
      top_n,
      user_id: userId ? userId.toString() : null,
    };

    const response = await axios.post(
      `${RECOMMENDER_URL}/recommend/hybrid`,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Recommender Service Error (Hybrid):", error.message);
    return { success: false, data: [] };
  }
};

export const fetchByGenre = async (genreIdOrName, page = 1, limit = 20) => {
  try {
    const response = await axios.get(`${RECOMMENDER_URL}/discover/by-genre`, {
      params: {
        genre: genreIdOrName,
        page,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Recommender Service Error (Genre):", error.message);
    return { success: false, data: [], pagination: {} };
  }
};

export const fetchByCountry = async (countryCode, page = 1, limit = 20) => {
  try {
    const response = await axios.get(`${RECOMMENDER_URL}/discover/by-country`, {
      params: {
        country: countryCode,
        page,
        limit,
      },
    });
    // Python now returns { success: true, data: [...], pagination: {...} }
    return response.data;
  } catch (error) {
    console.error("Recommender Service Error (Country):", error.message);
    return { success: false, data: [], pagination: {} };
  }
};

export const fetchTopRated = async (limit = 20) => {
  const response = await axios.get(`${RECOMMENDER_URL}/discover/top-rated`, {
    params: { limit },
  });
  return response.data;
};

export const fetchAvailableGenres = async () => {
  const response = await axios.get(`${RECOMMENDER_URL}/discover/genres`);
  console.log(RECOMMENDER_URL);
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
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Recommender Service Error (For You):", error.message);
    return { success: false, data: [] };
  }
};

export const fetchTrendingMovies = async (timeWindow = "week", limit = 20) => {
  try {
    const response = await axios.get(`${RECOMMENDER_URL}/discover/trending`, {
      params: {
        time_window: timeWindow,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Recommender Service Error (Trending):", error.message);
    throw new Error("Failed to fetch trending movies");
  }
};

export const fetchByPerson = async (personId, page = 1, limit = 20) => {
  try {
    const response = await axios.get(`${RECOMMENDER_URL}/discover/by-person`, {
      params: {
        person_id: personId,
        page,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Recommender Service Error (Person):", error.message);
    return { success: false, data: [], pagination: {} };
  }
};
