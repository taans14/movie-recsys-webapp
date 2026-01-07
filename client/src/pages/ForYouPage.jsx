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
        const res = await axiosClient.get('/recommendation/for-you', {
          params: { limit: 20, page }
        });

        let data = res.data || res || [];
        if (data.data && Array.isArray(data.data)) {
          setMovies(data.data);
          setFilteredMovies(data.data);
          if (data.pagination) setTotalPages(data.pagination.totalPages);
        } else if (Array.isArray(data)) {
          setMovies(data);
          setFilteredMovies(data);
          setTotalPages(data.length === 20 ? page + 1 : page);
        }
      } catch (error) {
        console.error("Fetch failed", error);
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

        <FilterBar movies={movies} onFilterChange={setFilteredMovies} />

        {loading ? (
          <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-red-600 rounded-full border-t-transparent"></div></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredMovies.map(m => (
                <div key={m.id || m.tmdbId} className="h-[350px]">
                  <MovieCard movie={m} className="w-full h-full" />
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

export default ForYouPage;
