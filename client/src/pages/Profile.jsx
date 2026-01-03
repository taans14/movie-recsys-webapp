import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { User, Film, Star, ChevronRight } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import Header from '../components/Header';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ratedMovies, setRatedMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ratedRes, watchlistRes] = await Promise.all([
          axiosClient.get('/ratings/me'),
          axiosClient.get('/watchlists')
        ]);

        console.log(ratedRes);

        setRatedMovies(Array.isArray(ratedRes) ? ratedRes : (ratedRes.data || []));
        setWatchlist(Array.isArray(watchlistRes) ? watchlistRes : (watchlistRes.data || []));
      } catch (error) {
        console.error("Error fetching profile data", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (!user) return <div className="text-white text-center pt-20">Please log in to view profile.</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-10 px-4 md:px-8">
      <Header/>
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
        
        {/* Rated Movies Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-red-500">
              <Star className="w-6 h-6 fill-current" />
              Recently Rated
            </h2>
            <button 
              onClick={() => navigate('/profile/rated')}
              className="flex items-center text-sm text-gray-400 hover:text-white transition group"
            >
              View All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ratedMovies.slice(0, 5).map(movie => (
              <div key={movie._id} className="relative">
                <MovieCard movie={movie.movieId} className="aspect-[2/3]" />
                <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md">
                   Your Rating: {movie.rating}
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
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-500">
              <Film className="w-6 h-6 fill-current" />
              Watchlist
            </h2>
            <button 
              onClick={() => navigate('/profile/watchlist')}
              className="flex items-center text-sm text-gray-400 hover:text-white transition group"
            >
              View All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist.slice(0, 5).map(movie => (
              <MovieCard movie={movie.movieId}/>
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