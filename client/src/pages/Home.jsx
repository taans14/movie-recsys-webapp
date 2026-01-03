import React, { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Header from '../components/Header';
import MovieList from '../components/MovieList';
import MovieSearch from '../components/MovieSearch';
import axiosClient from '../api/axiosClient';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [searchData, setSearchData] = useState([]);

  const handleSearch = async (value) => {
    if (value === '') return setSearchData([]);
    try {
      // Call backend search: /api/v1/movies?search=...
      const data = await axiosClient.get(`/movies?search=${value}`);
      setSearchData(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [trending, topRated] = await Promise.all([
          axiosClient.get('/movies/trending'),
          axiosClient.get('/movies/top-rated')
        ]);

        setTrendingMovies(trending);
        setTopRatedMovies(topRated);
      } catch (error) {
        console.log('Error fetching home data:', error);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className='h-full bg-black text-white min-h-screen pb-10 relative'>
      <Header onSearch={handleSearch} />
      <Banner />
      {searchData.length === 0 && (
        <>
          <MovieList title='HOT' data={trendingMovies} />
          <MovieList title='RECOMMENDED' data={topRatedMovies} />
        </>
      )}

      {searchData.length > 0 && <MovieSearch data={searchData} />}
    </div>
  );
};

export default Home;