import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';
import { Film, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';

import useDocumentTitle from '../hooks/useDocumentTitle';

export default function WatchlistPage() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle('My Watchlist');

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await axiosClient.get('/watchlists');
        const data = Array.isArray(res) ? res : (res.data || []);
        // Normalize structure: watchlist endpoint often returns { movieId: { ...movieData } }
        // Ensure we pass the Movie Object to filter bar, not the wrapper
        const normalized = data.map(item => item.movieId || item);
        setMovies(normalized);
        setFilteredMovies(normalized);
      } catch (err) {
        console.error("Failed to load watchlist", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-10 px-4 md:px-8">
      <Header />
      <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => window.history.back()} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Film className="text-blue-500 fill-current" />
            Your Watchlist
          </h1>
        </div>

        <FilterBar movies={movies} onFilterChange={setFilteredMovies} />

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredMovies.map(movie => (
              <div key={movie._id || movie.id} className="relative">
                <MovieCard movie={movie} className="aspect-[2/3]" />
              </div>
            ))}
            {filteredMovies.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-20">No movies found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
