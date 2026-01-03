import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MovieProvider } from "./context/MovieDetailContext";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import MovieDetail from "./pages/MovieDetail";
import SearchPage from "./pages/Search";
import ProfilePage from "./pages/Profile";
import RatedMoviesPage from "./pages/RatedMovies";
import WatchlistPage from "./pages/Watchlist";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MovieProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/search" element={<SearchPage/>} />
            <Route path="/profile" element={<ProfilePage/>} />

            <Route path="/profile/rated" element={<RatedMoviesPage/>} />
            <Route path="/profile/watchlist" element={<WatchlistPage/>} />
          </Routes>
        </MovieProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
