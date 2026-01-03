import Rating from "./ratings.schema.js";
import Movie from "../movies/movies.schema.js";

const updateMovieAverage = async (movieId) => {
  const stats = await Rating.aggregate([
    { $match: { movieId: movieId } },
    {
      $group: {
        _id: "$movieId",
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      voteAverage: Math.round(stats[0].averageRating * 10) / 10,
      voteCount: stats[0].count,
    });
  }
};

export const addRating = async (userId, { movieId, rating }) => {
  const savedRating = await Rating.findOneAndUpdate(
    { userId, movieId },
    { rating },
    { new: true, upsert: true }
  );

  await updateMovieAverage(savedRating.movieId);

  return savedRating;
};

export const getUserRatings = async (userId) => {
  const ratings = await Rating.find({ userId })
    .populate('movieId')
    .sort({ createdAt: -1 });

  return ratings.filter((rating) => rating.movieId);
};
