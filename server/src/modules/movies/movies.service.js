import Movie from "./movies.schema.js";

export const createMovie = async (movieData) => {
  const movie = new Movie(movieData);
  return await movie.save();
};

export const getAllMovies = async (limit = 20, page = 1) => {
  const skip = (page - 1) * limit;
  return await Movie.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
};

export const getMovieById = async (tmdbId) => {
  return Movie.findOne({ tmdbId: Number(tmdbId) });
};

export const updateMovie = async (tmdbId, data) => {
  return Movie.findOneAndUpdate({ tmdbId: Number(tmdbId) }, data, {
    new: true,
  });
};

export const deleteMovie = async (tmdbId) => {
  return Movie.findOneAndDelete({ tmdbId: Number(tmdbId) });
};

export const getTrending = async (limit = 10) => {
  // Sort by popularity (descending)
  return await Movie.find().sort({ popularity: -1 }).limit(limit);
};

export const getTopRated = async (limit = 10) => {
  // Sort by voteAverage (descending)
  return await Movie.find().sort({ voteAverage: -1 }).limit(limit);
};

export const searchMovies = async (query) => {
  if (!query) return [];

  // 1. Helper to escape special regex characters (e.g., if user types "Batman+")
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2. Create "Fuzzy" Pattern
  // Step A: Split query by spaces OR hyphens (e.g., "spider man" -> ["spider", "man"])
  const words = query.trim().split(/[\s\-]+/);

  // Step B: Rejoin with a pattern that matches spaces, hyphens, or nothing
  // Result: "spider[\s\-]*man"
  // This matches: "Spider-Man", "Spider Man", and even "Spiderman"
  const fuzzyQuery = words.map(escapeRegex).join('[\\s\\-]*');

  const regex = new RegExp(fuzzyQuery, 'i');

  const movies = await Movie.find({
    $or: [
      { title: regex },
      { originalTitle: regex },
      { 'keywords.name': regex },
      { overview: regex },
      { tagline: regex }
    ]
  })
  .select('title originalTitle posterPath backdropPath voteAverage releaseDate id tmdbId')
  .limit(20) 
  .sort({ popularity: -1 });

  return movies;
};