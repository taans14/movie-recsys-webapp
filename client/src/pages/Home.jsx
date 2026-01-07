import React, { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Header from '../components/Header';
import MovieList from '../components/MovieList';
import MovieSearch from '../components/MovieSearch';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  
  // Store all movie categories in a single state object for cleaner management
  const [movies, setMovies] = useState({
    trending: [],
    topRated: [],
    action: [],
    comedy: [],
    animation: [],
    korean: [],
    forYou: []
  });

  const [searchData, setSearchData] = useState([]);
  const [loading, setLoading] = useState(true);

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

        // Define all the fetch promises
        // We use the new /recommendation endpoints you set up
        const promises = [
          axiosClient.get('/recommendation/trending?limit=20'),
          axiosClient.get('/recommendation/discover?type=top-rated&limit=20'),
          axiosClient.get('/recommendation/discover?type=genre&value=Action&limit=20'),
          axiosClient.get('/recommendation/discover?type=genre&value=Comedy&limit=20'),
          axiosClient.get('/recommendation/discover?type=genre&value=Animation&limit=20'),
          axiosClient.get('/recommendation/discover?type=country&value=KR&limit=20'),
        ];

        // If user is logged in, add the personalized "For You" fetch
        if (user) {
          promises.push(axiosClient.get('/recommendation/for-you?limit=15'));
        }

        // Execute all requests in parallel
        const results = await Promise.all(promises);

        // Helper to extract data array safely (handles { success: true, data: [...] } response structure)
        const getData = (res) => (res && res.data ? res.data : res || []);

        // Update state
        setMovies({
          trending: getData(results[0]),
          topRated: getData(results[1]),
          action: getData(results[2]),
          comedy: getData(results[3]),
          animation: getData(results[4]),
          korean: getData(results[5]),
          // If user exists, 'forYou' is the last item (index 6), otherwise empty
          forYou: user && results[6] ? getData(results[6]) : []
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
      
      {/* Search Result View */}
      {searchData.length > 0 ? (
        <div className="pt-20 px-4">
           <MovieSearch data={searchData} />
        </div>
      ) : (
        /* Main Home View */
        <>
          <Banner />
          
          <div className="space-y-8 mt-6 pb-12">
            {/* 1. Personalized Recommendations (Only for logged-in users) */}
            {user && movies.forYou.length > 0 && (
              <MovieList 
                title={`For You, ${user.fullName || 'User'}`} 
                data={movies.forYou} 
              />
            )}

            {/* 2. Standard Sections */}
            <MovieList title='Trending Now' data={movies.trending} />
            <MovieList title='Top Rated' data={movies.topRated} />
            
            {/* 3. Genre Based Lists */}
            <MovieList title='Action Hits' data={movies.action} />
            <MovieList title='Animation & Family' data={movies.animation} />
            <MovieList title='Comedy Favorites' data={movies.comedy} />
            
            {/* 4. Regional Content */}
            <MovieList title='Popular Korean Movies' data={movies.korean} />
          </div>
        </>
      )}
    </div>
  );
};

export default Home;