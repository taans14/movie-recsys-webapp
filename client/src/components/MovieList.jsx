import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieList = ({ title, data }) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className='text-white p-10 mb-10 relative group/list'>
      <h2 className='uppercase text-xl font-bold mb-4 border-l-4 border-red-600 pl-3'>{title}</h2>
      
      {/* Scroll Buttons */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-2 top-[60%] -translate-y-1/2 z-20 bg-black/60 hover:bg-red-600/90 p-2 rounded-full hidden group-hover/list:block transition-all shadow-lg backdrop-blur-sm"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button 
        onClick={() => scroll('right')}
        className="absolute right-2 top-[60%] -translate-y-1/2 z-20 bg-black/60 hover:bg-red-600/90 p-2 rounded-full hidden group-hover/list:block transition-all shadow-lg backdrop-blur-sm"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className='flex items-center space-x-4 overflow-x-auto pb-6 pt-2 scroll-smooth no-scrollbar'
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {data && data.length > 0 ? (
          data.map((item) => (
            <div 
              key={item._id || item.id} 
              className="w-[200px] min-w-[200px] h-[300px]"
            >
              <MovieCard movie={item} className="w-full h-full" />
            </div>
          ))
        ) : (
          <div className="w-full text-gray-500 py-10 italic">No movies available</div>
        )}
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

MovieList.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.array,
};

export default MovieList;