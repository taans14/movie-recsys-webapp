import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

// --- Configuration ---
const IMG_URL = import.meta.env.VITE_IMG_URL || 'https://image.tmdb.org/t/p/w500';

const BACKDROP_URL = IMG_URL.replace('w500', 'original');

// --- Inline SVG Components ---
const StarIcon = ({ full, half }) => {
  if (half) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500">
         <defs>
          <linearGradient id="halfGrad">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="#4b5563" /> 
          </linearGradient>
        </defs>
        <path fill="url(#halfGrad)" fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={full ? "currentColor" : "none"} stroke="currentColor" strokeWidth={full ? "0" : "1.5"} className={`w-5 h-5 ${full ? 'text-yellow-500' : 'text-gray-500'}`}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
};

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white hover:scale-110 transition-transform drop-shadow-lg">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
  </svg>
);

const Banner = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Use the configured axiosClient
        // This will automatically use the API_URL and Authorization header
        const response = await axiosClient.get('/movies/trending');
        
        // Handle various response structures (standard vs custom backend wrapper)
        const results = Array.isArray(response) 
          ? response 
          : (response.results || response.data || []);

        if (results.length > 0) {
          setMovies(results.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch banner movies:", error);
      }
    };

    fetchMovies();
  }, []);

  // Auto-play Carousel Logic
  useEffect(() => {
    if (movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [movies]);

  // Helper to resolve URLs (handles relative TMDB paths)
  const getImageUrl = (path, type = 'poster') => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Already absolute
    
    // Choose base URL based on type
    const baseUrl = type === 'backdrop' ? BACKDROP_URL : IMG_URL;
    return `${baseUrl}${path}`;
  };

  const renderStars = (voteAverage) => {
    const score = (voteAverage || 0) / 2; 
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
        if (score >= i) {
            stars.push(<StarIcon key={`star-${i}`} full={true} />);
        } else if (score >= i - 0.5) {
            stars.push(<StarIcon key={`star-${i}`} full={false} half={true} />);
        } else {
             stars.push(<StarIcon key={`star-${i}`} full={false} />);
        }
    }
    return stars;
  };

  const handleDotClick = (index) => {
      setCurrentIndex(index);
  };

  const handleNavigate = (movie) => {
    if (!movie) return;
    const movieId = movie.tmdbId || movie.id;
    if (movieId) {
      navigate(`/movie/${movieId}`);
    }
  };

  if (movies.length === 0) return null;

  const currentMovie = movies[currentIndex];
  
  // Safely access properties (support both snake_case from TMDB and camelCase from custom API)
  const backdropPath = currentMovie.backdrop_path || currentMovie.backdropPath;
  const posterPath = currentMovie.poster_path || currentMovie.posterPath;
  const voteAverage = currentMovie.vote_average || currentMovie.voteAverage;

  const backgroundUrl = getImageUrl(backdropPath || posterPath, 'backdrop');
  const posterUrl = getImageUrl(posterPath, 'poster');

  return (
    <div 
        className='md:h-[600px] h-[800px] w-full bg-cover bg-center bg-no-repeat relative mt-[75px] transition-all duration-700 ease-in-out'
        style={{ 
            backgroundImage: `url('${backgroundUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}
    >
      <div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30' />
      
      <div className='flex flex-col md:flex-row items-center justify-between absolute md:top-1/2 top-16 -translate-x-1/2 left-1/2 md:-translate-y-1/2 w-full px-4 md:px-10 z-10'>
        
        {/* Left Content */}
        <div className='md:w-[50%] w-full mb-10 md:mb-0 text-center md:text-left'>
          <div className='flex flex-col space-y-6 items-center md:items-start'>
            <span className='bg-red-600/90 py-1 px-4 text-white text-sm font-semibold rounded uppercase tracking-wider shadow-lg'>
              Trending Now
            </span>
            <div className='flex flex-col space-y-4 w-full'>
              <h1 className='text-[32px] md:text-[50px] font-bold text-white leading-tight drop-shadow-xl'>
                {currentMovie.title}
              </h1>
              
              <div className='flex items-center justify-center md:justify-start space-x-1'>
                {renderStars(voteAverage)}
                <span className='text-gray-300 ml-2 text-sm'>
                    ({voteAverage?.toFixed(1)}/10)
                </span>
              </div>
              
              <p className='text-gray-200 line-clamp-3 md:line-clamp-4 max-w-xl text-sm md:text-lg drop-shadow-md mx-auto md:mx-0'>
                {currentMovie.overview}
              </p>
            </div>

            <div className='flex items-center space-x-4'>
              <button 
                onClick={() => handleNavigate(currentMovie)}
                className='py-3 px-8 bg-gray-600/70 hover:bg-gray-600 text-white font-bold transition rounded shadow-lg backdrop-blur-sm'
              >
                More Info
              </button>
            </div>
          </div>
        </div>

        {/* Right Content (Poster) */}
        <div className='md:w-[40%] w-full flex items-center justify-center md:justify-end mt-6 md:mt-0 hidden md:flex'>
          <div 
            className='w-[200px] h-[300px] md:w-[300px] md:h-[450px] relative group cursor-pointer perspective-1000'
            onClick={() => handleNavigate(currentMovie)}
          >
            <div className="relative w-full h-full transform transition-transform duration-500 hover:scale-105 rounded-xl shadow-2xl overflow-hidden border-2 border-white/10 bg-black">
                {/* Play button overlay removed as requested */}
                <img
                src={posterUrl}
                alt={currentMovie.title}
                className='object-cover w-full h-full'
                // onError={(e) => {
                //     e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
                // }}
                />
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20'>
        {movies.map((_, index) => (
            <button 
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-red-600 w-8' : 'bg-gray-400/50 hover:bg-white w-2'}`}
            />
        ))}
      </div>
    </div>
  );
};

export default Banner;