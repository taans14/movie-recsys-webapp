import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Loader2, Film } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import Header from '../components/Header';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchMovies = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get(`/movies/search?q=${encodeURIComponent(query)}`);
        // Handle array response directly or nested in data
        const results = Array.isArray(response) ? response : (response.data || []);
        setMovies(results);
      } catch (err) {
        console.error("Search failed:", err);
        setError("An error occurred while searching.");
      } finally {
        setLoading(false);
      }
    };

    searchMovies();
  }, [query]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-10 px-4 md:px-8">
      <Header/>
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-200 border-l-4 border-red-600 pl-4">
            Search Results for: <span className="text-white italic">"{query}"</span>
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">{error}</div>
        ) : movies.length === 0 ? (
          <div className="text-center text-gray-500 py-20 flex flex-col items-center">
             <Film className="w-16 h-16 mb-4 opacity-20" />
             <p className="text-xl">No movies found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <div key={movie._id || movie.id} className="aspect-[2/3]">
                <MovieCard movie={movie} className="w-full h-full shadow-lg" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}