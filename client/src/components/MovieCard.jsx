import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// --- Configuration ---
const getEnv = (key, defaultValue) => {
  try {
    return import.meta.env[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

const IMG_URL = getEnv('VITE_IMG_URL', 'https://image.tmdb.org/t/p/w500');

const MovieCard = ({ movie, className = '' }) => {
  const navigate = useNavigate();

  const handleMovieClick = () => {
    // Prefer tmdbId if available (from backend), otherwise fall back to id (from TMDB API)
    const movieId = movie.tmdbId || movie.id;
    if (movieId) {
      navigate(`/movie/${movieId}`);
    } else {
      console.warn("No ID found for movie:", movie);
    }
  };

  // Handle image path logic (absolute vs relative)
  const posterPath = movie.posterPath || movie.poster_path;
  // const imageUrl = posterPath
  //   ? (posterPath.startsWith('http') ? posterPath : `${IMG_URL}${posterPath}`)
  //   : 'https://via.placeholder.com/200x300?text=No+Image';
  const imageUrl = `${IMG_URL}${posterPath}`;

  const title = movie.title || movie.originalTitle;

  return (
    <div 
      className={`relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900 ${className}`}
      onClick={handleMovieClick}
    >
      <div className='w-full h-full relative'>
        {/* Image */}
        <img
          src={imageUrl}
          alt={title}
          className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
          loading="lazy"
        />
        
        {/* Hover Gradient Overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
        
        {/* Title Overlay (Visible on Hover/Bottom) */}
        <div className='absolute bottom-0 left-0 w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300'>
          <p className='text-white font-bold text-sm line-clamp-2 drop-shadow-md'>
            {title}
          </p>
           {movie.voteAverage > 0 && (
             <span className="text-yellow-400 text-xs font-medium mt-1 block">
               ★ {movie.voteAverage.toFixed(1)}
             </span>
           )}
        </div>
      </div>
    </div>
  );
};

MovieCard.propTypes = {
  movie: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tmdbId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    posterPath: PropTypes.string,
    poster_path: PropTypes.string,
    title: PropTypes.string,
    originalTitle: PropTypes.string,
    voteAverage: PropTypes.number,
  }).isRequired,
  className: PropTypes.string,
};

export default MovieCard;