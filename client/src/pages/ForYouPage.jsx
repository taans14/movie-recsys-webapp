import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

import useDocumentTitle from '../hooks/useDocumentTitle';

const ForYouPage = () => {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useDocumentTitle('Recommended For You');

  useEffect(() => {
    if (!user) return;

    const fetchMovies = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        // FIX 1: Normalize Pagination
        // If we are on page 1, we don't send 'page' param to mimic Home page behavior.
        // If your backend uses 0-based indexing, this fixes the "skipping first 20 items" bug.
        const params = { limit: 20 };
        if (page > 1) {
          params.page = page;
        }

        console.log("Fetching with params:", params);

        const res = await axiosClient.get('/recommendation/for-you', { params });

        // Robust data extraction
        const responseData = res.data || res;
        let movieData = [];
        let paginationData = {};

        if (responseData.data && Array.isArray(responseData.data)) {
          movieData = responseData.data;
          paginationData = responseData.pagination || {};
        } else if (Array.isArray(responseData)) {
          movieData = responseData;
        } else if (responseData.movies && Array.isArray(responseData.movies)) {
          movieData = responseData.movies;
        }

        console.log("Movies received:", movieData.length);

        setMovies(movieData);
        // FIX 2: Ensure filteredMovies is set immediately so UI isn't blank
        setFilteredMovies(movieData);

        if (paginationData.totalPages) {
          setTotalPages(paginationData.totalPages);
        } else {
          setTotalPages(movieData.length > 0 ? page + 1 : page);
        }

      } catch (error) {
        console.error("Fetch recommended movies failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [user, page]);

  if (!user) return <div className="text-white pt-32 text-center">Please log in.</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <Header />
      <div className="container mx-auto px-4 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-purple-600 rounded-full">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Recommended For You</h1>
        </div>

        {/* FilterBar */}
        {movies.length > 0 && (
          <FilterBar movies={movies} onFilterChange={setFilteredMovies} />
        )}

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin h-10 w-10 border-4 border-red-600 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <>
            {movies.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <p className="text-xl">No recommendations found yet.</p>
                <p className="text-sm mt-2">
                  {/* Debug Message to help you confirm if Home is actually different */}
                  (If you see movies on Home but not here, check the Console Logs for "Fetching with params")
                </p>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <p>No movies match your current filters.</p>
                <button
                  onClick={() => setFilteredMovies(movies)}
                  className="text-red-500 hover:underline mt-2"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredMovies.map((m, index) => (
                  <div key={m.id || m.tmdbId || m._id || index} className="h-[350px]">
                    <MovieCard movie={m} className="w-full h-full" />
                  </div>
                ))}
              </div>
            )}

            {movies.length > 0 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ForYouPage;
