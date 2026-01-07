import Rating from "./ratings.schema.js";
import Movie from "../movies/movies.schema.js";

const updateMovieVotes = async (movieId) => {
  // 1. Aggregate User Ratings (Stored as 0-5, convert to 0-10)
  const stats = await Rating.aggregate([
    { $match: { movieId } },
    {
      $group: {
        _id: "$movieId",
        avgRating: { $avg: "$rating" }, // Average of 0-5 scale
        count: { $sum: 1 },
      },
    },
  ]);

  // Extract user stats (default to 0 if no ratings exist)
  const userStats = stats.length > 0 ? stats[0] : { avgRating: 0, count: 0 };
  const userVoteAverage = userStats.avgRating * 2; // Convert 0-5 -> 0-10
  const userVoteCount = userStats.count;

  // 2. Fetch Movie for TMDB Stats
  const movie = await Movie.findById(movieId);
  if (!movie) return;

  // Get TMDB stats (Default to 0 to prevent NaN)
  const tmdbVoteAvg = movie.tmdbVoteAverage || 0;
  const tmdbVoteCnt = movie.tmdbVoteCount || 0;

  // 3. Calculate Combined Weighted Average
  const totalCount = tmdbVoteCnt + userVoteCount;
  
  let combinedAverage = 0;
  if (totalCount > 0) {
    // (TMDB Score * TMDB Count) + (User Score * User Count)
    const tmdbMass = tmdbVoteAvg * tmdbVoteCnt;
    const userMass = userVoteAverage * userVoteCount;
    
    combinedAverage = (tmdbMass + userMass) / totalCount;
  }

  // 4. Update Movie Document
  await Movie.findByIdAndUpdate(movieId, {
    // User specific fields
    userVoteAverage: Math.round(userVoteAverage * 10) / 10,
    userVoteCount: userVoteCount,

    // Combined fields (used for sorting/filtering)
    voteAverage: Math.round(combinedAverage * 10) / 10,
    voteCount: totalCount
  });
};

export const addRating = async (userId, { movieId, rating }) => {
  const normalizedRating = rating / 2;

  const savedRating = await Rating.findOneAndUpdate(
    { userId, movieId },
    { rating: normalizedRating },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await updateMovieVotes(movieId);

  return savedRating;
};

export const getUserRatings = async (userId) => {
  const ratings = await Rating.find({ userId })
    .populate("movieId")
    .sort({ createdAt: -1 })
    .lean();

  return ratings
    .filter((r) => r.movieId) // Filter out deleted movies
    .map((r) => ({
      ...r,
      rating: r.rating * 2, // Convert 0-5 -> 0-10 for frontend
      movie: r.movieId // Rename populated field to 'movie' for clarity if needed
    }));
};