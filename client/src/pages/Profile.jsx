import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axiosClient from '../api/axiosClient';
import { User, Film, Star, ChevronRight, Heart } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import Header from '../components/Header';

import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [ratedMovies, setRatedMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  // Genre Selection State
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useDocumentTitle('My Profile');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratedRes, watchlistRes, genresRes] = await Promise.all([
          axiosClient.get('/ratings/me'),
          axiosClient.get('/watchlists'),
          axiosClient.get('/recommendation/genres')
        ]);

        setRatedMovies(Array.isArray(ratedRes) ? ratedRes : (ratedRes.data || []));
        setWatchlist(Array.isArray(watchlistRes) ? watchlistRes : (watchlistRes.data || []));
        setAllGenres(genresRes.data || genresRes || []);

        if (user && user.favoriteGenres) {
          setSelectedGenres(user.favoriteGenres);
        }
      } catch (error) {
        console.error("Error fetching profile data", error);
      }
    };

    if (user) fetchData();
  }, [user]);

  const toggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(prev => prev.filter(id => id !== genreId));
    } else {
      if (selectedGenres.length >= 3) {
        showNotification("You can only select up to 3 genres", "info");
        return;
      }
      setSelectedGenres(prev => [...prev, genreId]);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      await updateProfile({ favoriteGenres: selectedGenres });
      showNotification("Preferences saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save genres", error);
      showNotification(error.response?.data?.message || "Failed to save preferences", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div className="text-white text-center pt-20">Please log in to view profile.</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-10 px-4 md:px-8">
      <Header />

      {/* Header Info */}
      <div className="container mx-auto mb-12">
        <div className="flex items-center gap-6 bg-gray-900 p-8 rounded-2xl border border-gray-800">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl font-bold">
            {user.fullName ? user.fullName[0].toUpperCase() : <User />}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto space-y-12">

        {/* Favorite Genres Selection */}
        <section className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
                <Heart className="w-6 h-6 text-red-600 fill-current" />
                Favorite Genres
              </h2>
              <p className="text-sm text-gray-400">Select up to 3 genres to customize your home feed.</p>
            </div>
            <button
              onClick={savePreferences}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {allGenres.map(genre => {
              const isSelected = selectedGenres.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500'
                    }`}
                >
                  {genre.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </section>

        {/* Rated Movies Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 fill-current" />
              Recently Rated
            </h2>
            <Link
              to="/profile/rated"
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-700 hover:border-red-600 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ratedMovies.slice(0, 5).map(movie => (
              <div key={movie._id} className="relative">
                <MovieCard movie={movie.movieId} />
                <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  ★ {movie.rating}
                </div>
              </div>
            ))}
            {ratedMovies.length === 0 && (
              <p className="text-gray-500 col-span-full italic">You haven't rated any movies yet.</p>
            )}
          </div>
        </section>

        {/* Watchlist Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Film className="w-6 h-6 fill-current" />
              Watchlist
            </h2>
            <Link
              to="/profile/watchlist"
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-700 hover:border-red-600 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist.slice(0, 5).map(movie => (
              <div key={movie._id} className="">
                <MovieCard movie={movie.movieId} />
              </div>
            ))}
            {watchlist.length === 0 && (
              <p className="text-gray-500 col-span-full italic">Your watchlist is empty.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
