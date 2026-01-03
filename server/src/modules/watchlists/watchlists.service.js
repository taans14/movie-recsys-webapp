import Watchlist from './watchlists.schema.js';

export const addToWatchlist = async (userId, movieId) => {
  // Check duplication
  const exists = await Watchlist.findOne({ userId, movieId });
  if (exists) return exists;

  return await Watchlist.create({ userId, movieId });
};

export const removeFromWatchlist = async (userId, movieId) => {
  return await Watchlist.findOneAndDelete({ userId, movieId });
};

export const getUserWatchlist = async (userId) => {
  return await Watchlist.find({ userId })
    .populate('movieId')
    .sort({ addedAt: -1 });
};