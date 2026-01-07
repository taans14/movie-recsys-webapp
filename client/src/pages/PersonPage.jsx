import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';
import axiosClient from '../api/axiosClient';
import { User } from 'lucide-react';

import useDocumentTitle from '../hooks/useDocumentTitle';

const IMG_URL = import.meta.env.VITE_IMG_URL || 'https://image.tmdb.org/t/p/w500';

const PersonPage = () => {
  const { personId, name } = useParams();
  const location = useLocation();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Try to get profile image from previous page (state), or default to null
  const [profilePath, setProfilePath] = useState(location.state?.profilePath || null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useDocumentTitle(decodeURIComponent(name));

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const res = await axiosClient.get('/recommendation/discover', {
          params: {
            type: 'person',
            personId: personId,
            limit: 20,
            page: page
          }
        });

        // 1. Extract Movies List
        let movieList = [];
        if (res.data && Array.isArray(res.data)) {
          movieList = res.data;
        } else if (Array.isArray(res)) {
          movieList = res;
        }
        setMovies(movieList);

        // 2. Extract Pagination (Look at 'res', NOT 'movieList')
        if (res.pagination && res.pagination.totalPages) {
          setTotalPages(res.pagination.totalPages);
        } else {
          // Fallback: If backend didn't send count, guess based on list length
          setTotalPages(movieList.length === 20 ? page + 1 : page);
        }

        // 3. Fallback Profile Image Logic
        if (!profilePath && movieList.length > 0) {
          const targetId = Number(personId);
          for (const movie of movieList) {
            const castMember = movie.cast?.find(p => p.id === targetId);
            if (castMember?.profilePath) {
              setProfilePath(castMember.profilePath);
              break;
            }
            const director = movie.directors?.find(p => p.id === targetId);
            if (director?.profilePath) {
              setProfilePath(director.profilePath);
              break;
            }
          }
        }
      } catch (error) {
        console.error("Person fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    if (personId) fetchMovies();
  }, [personId, page]);

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <Header />
      <div className="container mx-auto px-4 pt-24">

        {/* Person Header Card */}
        <div className="flex items-center gap-6 mb-10 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
          <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-red-600 flex items-center justify-center shrink-0 overflow-hidden">
            {profilePath ? (
              <img
                src={`${IMG_URL}${profilePath}`}
                alt={decodeURIComponent(name)}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-500" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">{decodeURIComponent(name)}</h1>
            <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Filmography</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-8 bg-red-600 rounded-full"></span>
          Known For
        </h2>

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
                <p className="text-gray-500 col-span-full italic">No movies found for this person.</p>
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

export default PersonPage;
