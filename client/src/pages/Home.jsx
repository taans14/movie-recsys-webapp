import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Banner from '../components/Banner';
import Header from '../components/Header';
import MovieList from '../components/MovieList';
import MovieSearch from '../components/MovieSearch';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

import useDocumentTitle from '../hooks/useDocumentTitle';

const Home = () => {
  const { user } = useAuth();

  const [movies, setMovies] = useState({
    trending: [],
    forYou: [],
    favorites: []
  });

  const [searchData, setSearchData] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle('Home');

  const handleSearch = async (value) => {
    if (value === '') return setSearchData([]);
    try {
      const data = await axiosClient.get(`/movies?search=${value}`);
      setSearchData(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        let genreMap = {};
        try {
          const genreRes = await axiosClient.get('/recommendation/genres');
          const genreList = genreRes.data || genreRes || [];
          genreList.forEach(g => { genreMap[g.id] = g.name; });
        } catch (e) {
          console.error("Failed to load genre map", e);
        }

        const promises = [
          axiosClient.get('/recommendation/trending?limit=20'),
        ];

        if (user) {
          promises.push(axiosClient.get('/recommendation/for-you?limit=15'));
          if (user.favoriteGenres && user.favoriteGenres.length > 0) {
            user.favoriteGenres.forEach(genreId => {
              const name = genreMap[genreId];
              if (name) {
                promises.push(
                  axiosClient.get(`/recommendation/discover?type=genre&value=${encodeURIComponent(name)}&limit=20`)
                    .then(res => ({
                      isFavorite: true,
                      genreName: name,
                      genreId: genreId,
                      data: res.data || res || []
                    }))
                );
              }
            });
          }
        }

        const results = await Promise.allSettled(promises);
        const getResult = (index) => {
          const res = results[index];
          return res.status === 'fulfilled' ? (res.value.data || res.value || []) : [];
        };

        const trendingData = getResult(0);
        let forYouData = [];
        let favoritesData = [];

        if (user) {
          if (results[1] && results[1].status === 'fulfilled') {
            const val = results[1].value;
            if (!val.isFavorite) {
              forYouData = val.data || val || [];
            }
          }
          results.forEach(res => {
            if (res.status === 'fulfilled' && res.value && res.value.isFavorite) {
              favoritesData.push(res.value);
            }
          });
        }

        setMovies({
          trending: trendingData,
          forYou: forYouData,
          favorites: favoritesData
        });

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [user]);

  return (
    <div className='h-full bg-black text-white min-h-screen pb-10 relative'>
      <Header onSearch={handleSearch} />

      {searchData.length > 0 ? (
        <div className="pt-20 px-4">
          <MovieSearch data={searchData} />
        </div>
      ) : (
        <>
          <Banner />
          <div className="space-y-8 mt-6 pb-12">

            {/* 1. Personalized Recommendations */}
            {user && movies.forYou.length > 0 && (
              <div className="relative group/section">
                <div className="relative">
                  <MovieList
                    title={`For You, ${user.fullName || 'User'}`}
                    data={movies.forYou}
                  />
                  <Link
                    to="/for-you"
                    className="absolute right-6 top-10 md:top-12 text-sm text-gray-400 hover:text-white flex items-center gap-1 z-10 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-700 hover:border-red-600 transition-all"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* 2. Trending Now */}
            <div className="relative group/section">
              <div className="relative">
                <MovieList title='Trending Now' data={movies.trending} />
                <Link
                  to="/trending"
                  className="absolute right-6 top-10 md:top-12 text-sm text-gray-400 hover:text-white flex items-center gap-1 z-10 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-700 hover:border-red-600 transition-all"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* 3. User Favorite Genres */}
            {user && movies.favorites.map((fav) => (
              <div key={fav.genreId} className="relative group/section">
                <div className="relative">
                  <MovieList title={`${fav.genreName} Picks`} data={fav.data} />
                  <Link
                    to={`/genre/${fav.genreId}/${encodeURIComponent(fav.genreName)}`}
                    className="absolute right-6 top-10 md:top-12 text-sm text-gray-400 hover:text-white flex items-center gap-1 z-10 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-700 hover:border-red-600 transition-all"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
