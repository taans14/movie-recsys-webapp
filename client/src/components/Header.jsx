import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User, ChevronDown } from 'lucide-react';
import axiosClient from '../api/axiosClient';

function Header() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Dropdown Data State
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);

  // Dropdown Visibility State
  const [showGenres, setShowGenres] = useState(false);
  const [showCountries, setShowCountries] = useState(false);

  // Fetch Dropdown Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gRes, cRes] = await Promise.all([
          axiosClient.get('/recommendation/genres'),
          axiosClient.get('/recommendation/countries')
        ]);
        setGenres(gRes.data || gRes || []);
        setCountries(cRes.data || cRes || []);
      } catch (err) {
        console.error("Failed to load header metadata", err);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  return (
    <header className='p-4 bg-black/95 backdrop-blur-sm flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-md border-b border-gray-800'>
      <div className='flex items-center space-x-8'>
        <Link to="/">
          <h1 className='text-[30px] uppercase font-bold text-red-600 cursor-pointer tracking-tighter'>
            Movie
          </h1>
        </Link>

        {/* --- NAVIGATION LINKS & DROPDOWNS --- */}
        <nav className="hidden md:flex items-center gap-6">

          {/* Genre Dropdown */}
          <div className="relative group" onMouseLeave={() => setShowGenres(false)}>
            <button
              className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition"
              onMouseEnter={() => setShowGenres(true)}
              onClick={() => setShowGenres(!showGenres)}
            >
              Genre <ChevronDown className="w-4 h-4" />
            </button>

            {showGenres && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl grid grid-cols-1 max-h-[300px] overflow-y-auto z-50">
                {genres.map(g => (
                  <Link
                    key={g.id}
                    to={`/genre/${g.id}/${encodeURIComponent(g.name)}`}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 block border-b border-gray-800/50 last:border-0"
                    onClick={() => setShowGenres(false)}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Country Dropdown */}
          <div className="relative group" onMouseLeave={() => setShowCountries(false)}>
            <button
              className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition"
              onMouseEnter={() => setShowCountries(true)}
              onClick={() => setShowCountries(!showCountries)}
            >
              Country <ChevronDown className="w-4 h-4" />
            </button>

            {showCountries && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-h-[300px] overflow-y-auto z-50">
                {countries.map(c => (
                  <Link
                    key={c.iso_3166_1}
                    to={`/country/${c.iso_3166_1}/${encodeURIComponent(c.english_name || c.name)}`}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 block border-b border-gray-800/50 last:border-0"
                    onClick={() => setShowCountries(false)}
                  >
                    {c.english_name || c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Static Links */}
          <Link to="/trending" className="text-gray-300 hover:text-white font-medium transition">
            Trending
          </Link>
          <Link to="/top-rated" className="text-gray-300 hover:text-white font-medium transition">
            Top Rated
          </Link>
        </nav>
      </div>

      <div className='flex items-center gap-4 md:gap-6'>
        {/* Search Form */}
        <form onSubmit={handleSearch} className='flex items-center bg-gray-900 border border-gray-700 rounded-full overflow-hidden focus-within:border-red-600 transition-colors'>
          <input
            type='text'
            placeholder='Search movies...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='py-2 px-4 text-sm text-white bg-transparent outline-none w-32 md:w-64 placeholder-gray-500'
          />
          <button type="submit" className='p-2 pr-4 text-gray-400 hover:text-white transition'>
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Auth Section */}
        {user ? (
          <div className='flex items-center gap-4'>
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:border-red-600 hover:bg-gray-700 transition-all group"
              title="Go to Profile"
            >
              <User className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
            </Link>
            <button
              onClick={handleLogout}
              className='text-xs font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md transition'
            >
              Logout
            </button>
          </div>
        ) : (
          <div className='flex items-center gap-3'>
            <Link to="/login" className='text-sm text-gray-300 hover:text-white transition font-medium'>
              Login
            </Link>
            <Link to="/signup" className='bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-full transition font-medium'>
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
