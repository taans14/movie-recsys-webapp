import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';
import { Star, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';

import useDocumentTitle from '../hooks/useDocumentTitle';

export default function RatedMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle('My Ratings');

  useEffect(() => {
    const fetchRated = async () => {
      try {
        const res = await axiosClient.get('/ratings/me');
        const data = Array.isArray(res) ? res : (res.data || []);
        // Normalize: extract movie object from rating wrapper
        const normalized = data.map(item => ({
          ...item.movieId,
          userRating: item.rating // Keep rating info attached
        }));
        setMovies(normalized);
        setFilteredMovies(normalized);
      } catch (err) {
        console.error("Failed to load ratings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRated();
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
            <Star className="text-yellow-500 fill-current" />
            Your Rated Movies
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
                <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  Your Rating: {movie.userRating}
                </div>
              </div>
            ))}
            {filteredMovies.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-20">No rated movies found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
