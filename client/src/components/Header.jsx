import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User } from 'lucide-react';

function Header() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent form submission refresh
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm(''); // Optional: clear search bar after search
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
            <button
              type="submit"
              className='p-2 pr-4 text-gray-400 hover:text-white transition'
            >
              <Search className="w-4 h-4" />
            </button>
        </form>

        {/* Auth Section */}
        {user ? (
            <div className='flex items-center gap-4'>
                {/* Profile Logo Link */}
                <Link 
                    to="/profile" 
                    className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:border-red-600 hover:bg-gray-700 transition-all group"
                    title="Go to Profile"
                >
                    <User className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                </Link>

                <span className='text-gray-300 text-sm hidden md:block'>
                    {user.fullName}
                </span>
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