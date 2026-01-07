import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';
import axiosClient from '../api/axiosClient';

import useDocumentTitle from '../hooks/useDocumentTitle';

const CountryPage = () => {
  const { countryCode, countryName } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useDocumentTitle(`Movies from ${decodeURIComponent(countryName)}`);

  // Reset page if country changes
  useEffect(() => {
    setPage(1);
  }, [countryCode]);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const res = await axiosClient.get('/recommendation/discover', {
          params: {
            type: 'country',
            value: countryCode,
            limit: 20,
            page: page
          }
        });

        if (res.data && Array.isArray(res.data)) {
          setMovies(res.data);

          // --- FIX HERE ---
          if (res.pagination && res.pagination.totalPages) {
            setTotalPages(res.pagination.totalPages);
          } else {
            // Fallback: If 20 items, allow next page
            setTotalPages(res.data.length === 20 ? page + 1 : page);
          }
          // ----------------

        } else if (Array.isArray(res)) {
          setMovies(res);
          setTotalPages(res.length === 20 ? page + 1 : page);
        }

      } catch (error) {
        console.error("Country fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    if (countryCode) fetchMovies();
  }, [countryCode, page]);

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <Header />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-3xl font-bold mb-8 border-l-4 border-red-600 pl-4">
          Movies from {decodeURIComponent(countryName)}
        </h1>

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {movies.length > 0 ? (
                movies.map(m => (
                  <div key={m.id || m.tmdbId} className="h-[350px]">
                    <MovieCard movie={m} className="w-full h-full" />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 col-span-full">No movies found for this country.</p>
              )}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CountryPage;
