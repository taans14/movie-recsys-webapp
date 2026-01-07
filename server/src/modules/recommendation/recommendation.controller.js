import * as recommenderService from './recommendation.service.js';
import redis from '../../config/redis.js';

const getOrSetCache = async (key, cb, ttl = 300) => {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(cachedData);
    }

    console.log(`Cache MISS: ${key}`);
    const freshData = await cb();

    if (freshData) {
      await redis.set(key, JSON.stringify(freshData), 'EX', ttl);
    }

    return freshData;
  } catch (error) {
    console.error('Redis Error (falling back to live data):', error);
    return await cb(); // Fallback: just run the function without cache
  }
};



export const getHybrid = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    // extracting "hidden" queries from POST body
    const { tmdbId, limit = 10 } = req.body;

    // Unique Key: Includes User ID AND Target Movie ID
    const key = `rec:hybrid:${userId}:${tmdbId}:${limit}`;

    const result = await getOrSetCache(key, async () => {
      return await recommenderService.fetchHybridRecommendations(userId, tmdbId, limit);
    }, 60 * 5); // Cache for 5 minutes (Personalized data changes often)

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getForYou = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { limit = 20 } = req.query;

    // Unique Key: Specific to this user
    const key = `rec:foryou:${userId}:${limit}`;

    const result = await getOrSetCache(key, async () => {
      return await recommenderService.fetchForYouRecommendations(userId, limit);
    }, 60 * 10); // Cache for 10 minutes

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTrending = async (req, res, next) => {
  try {
    const { timeWindow = 'week', limit = 20 } = req.query;

    // Unique Key: Global (same for all users)
    const key = `rec:trending:${timeWindow}:${limit}`;

    const result = await getOrSetCache(key, async () => {
      return await recommenderService.fetchTrendingMovies(timeWindow, limit);
    }, 60 * 60); // Cache for 1 hour (Trending doesn't change fast)

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getSimilarMovies = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id.toString() : 'guest';
    const { tmdbId, limit = 10 } = req.body;

    if (!tmdbId) {
      return res.status(400).json({ message: "tmdbId is required" });
    }

    // Unique Key: Handles Guest vs Logged In + POST body data
    const key = `rec:similar:${userId}:${tmdbId}:${limit}`;

    const result = await getOrSetCache(key, async () => {
      const actualUserId = userId === 'guest' ? null : userId;
      return await recommenderService.fetchHybridRecommendations(actualUserId, tmdbId, limit);
    }, 60 * 30); // Cache for 30 minutes

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDiscovery = async (req, res, next) => {
  try {
    const { type, value, limit = 20 } = req.query;

    const key = `rec:discover:${type}:${value || 'all'}:${limit}`;

    const result = await getOrSetCache(key, async () => {
      switch (type) {
        case 'country':
          return await recommenderService.fetchByCountry(value, limit);
        case 'genre':
          return await recommenderService.fetchByGenre(value, limit);
        case 'top-rated':
          return await recommenderService.fetchTopRated(limit);
        default:
          throw new Error("Invalid discovery type"); // Handle inside helper catch or here
      }
    }, 60 * 60 * 24); // Cache for 24 HOURS (Static data)

    if (!result) return res.status(400).json({ message: "Invalid discovery type" });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMetadata = async (req, res, next) => {
  try {
    const { type } = req.query;

    // Very static data, cache for a long time
    const key = `rec:metadata:${type}`;

    const result = await getOrSetCache(key, async () => {
      if (type === 'genres') {
        return await recommenderService.fetchAvailableGenres();
      } else if (type === 'countries') {
        return await recommenderService.fetchAvailableCountries();
      }
      return null;
    }, 60 * 60 * 24 * 7); // Cache for 7 DAYS

    if (!result) return res.status(400).json({ message: "Invalid metadata type" });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
