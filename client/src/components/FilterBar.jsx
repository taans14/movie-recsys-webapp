import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

const FilterBar = ({ movies, onFilterChange, showGenre = true, showCountry = true }) => {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);

  // Extract available options from the current movie list
  useEffect(() => {
    if (!movies) return;

    const genres = new Set();
    const countries = new Set();

    movies.forEach(movie => {
      if (movie.genres) {
        movie.genres.forEach(g => genres.add(g.name));
      }
      if (movie.production_countries) {
        movie.production_countries.forEach(c => countries.add(c.name));
      }
    });

    setAvailableGenres(Array.from(genres).sort());
    setAvailableCountries(Array.from(countries).sort());
  }, [movies]);

  // Apply filters whenever selection changes
  useEffect(() => {
    let filtered = movies;

    if (selectedGenre) {
      filtered = filtered.filter(m =>
        m.genres?.some(g => g.name === selectedGenre)
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter(m =>
        m.production_countries?.some(c => c.name === selectedCountry)
      );
    }

    onFilterChange(filtered);
  }, [selectedGenre, selectedCountry, movies, onFilterChange]);

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedCountry('');
  };

  if (availableGenres.length === 0 && availableCountries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
      <div className="flex items-center gap-2 text-gray-400">
        <Filter className="w-5 h-5" />
        <span className="text-sm font-medium">Filter by:</span>
      </div>

      {showGenre && (
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-red-600"
        >
          <option value="">All Genres</option>
          {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      )}

      {showCountry && (
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-red-600"
        >
          <option value="">All Countries</option>
          {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {(selectedGenre || selectedCountry) && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors ml-auto"
        >
          <X className="w-4 h-4" /> Clear
        </button>
      )}
    </div>
  );
};

export default FilterBar;
