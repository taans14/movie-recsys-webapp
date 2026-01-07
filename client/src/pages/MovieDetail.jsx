import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star,
  Clock,
  Calendar,
  Play,
  Heart,
  ArrowLeft,
  User,
  Video,
  Check,
} from "lucide-react";
import Header from "../components/Header";
import MovieList from "../components/MovieList";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import axiosClient from "../api/axiosClient";

import useDocumentTitle from '../hooks/useDocumentTitle';

const getEnv = (key, defaultValue) => {
  try {
    return import.meta.env[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

const IMG_URL = getEnv("VITE_IMG_URL", "https://image.tmdb.org/t/p/w500");
const BACKDROP_URL = IMG_URL.replace("w500", "original");

// --- Helpers ---
const getYouTubeId = (url) => {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recommendation State
  const [similarMovies, setSimilarMovies] = useState([]);

  // Rating State
  const [userRating, setUserRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Watchlist State
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useDocumentTitle(movie ? movie.title : 'Movie Details');

  // --- 1. Fetch Movie Data ---
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/movies/${id}`);
        const movieData = response.data || response;
        setMovie(movieData);
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Failed to load movie details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovie();
    }
  }, [id]);

  // --- 2. Fetch User Interactions (Watchlist & Ratings) ---
  useEffect(() => {
    const fetchUserInteractions = async () => {
      if (!user || !movie) return;

      try {
        const watchlistRes = await axiosClient.get("/watchlists");
        if (watchlistRes) {
          const watchlistData = Array.isArray(watchlistRes)
            ? watchlistRes
            : watchlistRes.data || [];

          const foundInWatchlist = watchlistData.some((item) => {
            const movieItem = item.movieId || item.movie || item;
            if (
              movie._id &&
              (movieItem === movie._id || movieItem._id === movie._id)
            ) {
              return true;
            }
            const itemTmdbId = movieItem.tmdbId || movieItem.id;
            if (itemTmdbId && id && itemTmdbId == id) {
              return true;
            }
            return false;
          });

          setIsInWatchlist(foundInWatchlist);
        }

        const ratingsRes = await axiosClient.get("/ratings/me");
        const ratingsData = Array.isArray(ratingsRes)
          ? ratingsRes
          : ratingsRes.data || [];

        const foundRating = ratingsData.find((r) => {
          const rMovieId =
            r.movieId && r.movieId._id ? r.movieId._id : r.movieId;
          return rMovieId === movie._id;
        });

        if (foundRating) {
          setUserRating(foundRating.rating || foundRating.userRating);
        }
      } catch (err) {
        console.error("Error fetching user interactions:", err);
      }
    };

    fetchUserInteractions();
  }, [user, movie, id]);

  // --- 3. Fetch Recommendations ---
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!id) return;
      try {
        const response = await axiosClient.post("/recommendation/similar", {
          tmdbId: parseInt(id),
          limit: 12,
        });
        const data = response.data || response;
        setSimilarMovies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      }
    };

    fetchRecommendations();
  }, [id]);

  // --- Handle Rating Submission ---
  const handleRate = async (value) => {
    if (!user) {
      showNotification("Please login to rate movies.", "error");
      return;
    }
    if (isSubmittingRating) return;
    setIsSubmittingRating(true);

    try {
      await axiosClient.post("/ratings", {
        movieId: movie._id,
        userId: user._id,
        rating: value,
      });

      setUserRating(value);
      showNotification(`Rating of ${value} submitted successfully!`, "success");
    } catch (err) {
      console.error("Error submitting rating:", err);
      if (err.response && err.response.status === 401) {
        showNotification("Please login to rate movies.", "error");
      } else {
        showNotification("Failed to submit rating.", "error");
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // --- Handle Watchlist Toggle ---
  const handleToggleWatchlist = async () => {
    if (!user) {
      showNotification("Please login to add to watchlist.", "error");
      return;
    }
    if (watchlistLoading) return;
    setWatchlistLoading(true);

    try {
      if (isInWatchlist) {
        await axiosClient.delete(`/watchlists/${movie._id}`);
        setIsInWatchlist(false);
        showNotification("Removed from Watchlist", "info");
      } else {
        await axiosClient.post("/watchlists", { movieId: movie._id });
        setIsInWatchlist(true);
        showNotification("Added to Watchlist", "success");
      }
    } catch (err) {
      console.error("Error updating watchlist:", err);
      showNotification("Failed to update watchlist.", "error");
    } finally {
      setWatchlistLoading(false);
    }
  };

  // --- Helper: Image URLs ---
  const getPoster = (path) => `${IMG_URL}${path}`;
  const getBackdrop = (path) => (path ? `${BACKDROP_URL}${path}` : "");
  const getProfile = (path) => (path ? `${IMG_URL}${path}` : null);

  // --- Helper: Formatters ---
  const formatRuntime = (mins) => {
    if (!mins) return "N/A";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const trailerId = React.useMemo(() => {
    if (!movie) return null;
    const url = movie.trailerUrl || movie.trailer_url;
    if (url) {
      const id = getYouTubeId(url);
      if (id) return id;
    }
    if (movie.videos && Array.isArray(movie.videos.results)) {
      const trailer = movie.videos.results.find(
        (v) => v.site === "YouTube" && v.type === "Trailer"
      );
      if (trailer) return trailer.key;
    }
    return null;
  }, [movie]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <p className="text-xl text-red-500 mb-4">{error || "Movie not found"}</p>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <Header />

      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
        {/* Backdrop Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url(${getBackdrop(movie.backdropPath)})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="relative h-full container mx-auto px-4 flex flex-col md:flex-row items-end md:items-center pb-12 md:pb-0 pt-20">
          {/* Poster */}
          <div className="hidden md:block w-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-900/50 mr-10 relative group">
            <img
              src={getPoster(movie.posterPath)}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 max-w-3xl">
            {/* UPDATED BACK BUTTON */}
            <button
              onClick={() => window.history.back()}
              className="mb-6 text-sm text-gray-400 hover:text-white flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-700 hover:border-red-600 transition-all w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Browse
            </button>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 leading-tight">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-lg text-slate-300 italic mb-6">"{movie.tagline}"</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-slate-300 mb-8">
              <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded">
                <Star className="w-4 h-4 fill-current" />
                <span>{movie.voteAverage?.toFixed(1)}</span>
                <span className="text-slate-500 font-normal ml-1">({movie.voteCount})</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{formatRuntime(movie.runtime)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>
                  {movie.releaseDate
                    ? new Date(movie.releaseDate).getFullYear()
                    : "N/A"}
                </span>
              </div>

              {movie.status && (
                <span className="px-2 py-0.5 border border-slate-700 rounded text-xs uppercase tracking-wider text-slate-400">
                  {movie.status}
                </span>
              )}
            </div>

            {/* --- CLICKABLE GENRES --- */}
            <div className="flex flex-wrap gap-2 mb-8">
              {movie.genres?.map((genre) => (
                <Link
                  key={genre.id}
                  to={`/genre/${genre.id}/${encodeURIComponent(genre.name)}`}
                  className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm font-medium border border-red-600/30 hover:bg-red-600 hover:text-white transition-colors"
                >
                  {genre.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {trailerId && (
                <button
                  onClick={() => {
                    const trailerEl = document.getElementById("trailer-section");
                    if (trailerEl) trailerEl.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-red-600/20"
                >
                  <Play className="w-5 h-5 fill-current" /> Watch Trailer
                </button>
              )}

              <button
                onClick={handleToggleWatchlist}
                disabled={watchlistLoading}
                className={`px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border 
                  ${isInWatchlist
                    ? "bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30"
                    : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                  }`}
              >
                {watchlistLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : isInWatchlist ? (
                  <>
                    <Check className="w-5 h-5" /> In Watchlist
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" /> Add to Watchlist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- DETAILS GRID --- */}
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-12">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-8 bg-red-600 rounded-full"></span>
              Storyline
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              {movie.overview || "No overview available."}
            </p>
          </section>

          {/* Trailer */}
          {trailerId && (
            <section id="trailer-section">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Video className="w-6 h-6 text-red-600" />
                Official Trailer
              </h2>
              <div className="aspect-video w-full bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${trailerId}`}
                  title={`${movie.title} Trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </section>
          )}

          {/* Cast */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-8 bg-red-600 rounded-full"></span>
              Top Cast
            </h2>

            <div className="flex overflow-x-auto pb-6 gap-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {movie.cast?.length > 0 ? (
                movie.cast.slice(0, 15).map((person) => (
                  <Link
                    to={`/person/${person.id}/${encodeURIComponent(person.name)}`}
                    key={person.id}
                    className="w-36 shrink-0 group block"
                  >
                    <div className="w-full h-48 bg-slate-800 rounded-xl overflow-hidden mb-3 relative">
                      {person.profilePath ? (
                        <img
                          src={getProfile(person.profilePath)}
                          alt={person.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-semibold truncate text-sm group-hover:text-red-500 transition-colors" title={person.name}>
                      {person.name}
                    </h3>
                    <p className="text-slate-400 text-xs truncate" title={person.character}>
                      {person.character}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-slate-500 italic">No cast information available.</p>
              )}
            </div>
          </section>

          {/* Rating */}
          <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Rate this Movie</h3>
                <p className="text-slate-400 text-sm">What did you think of {movie.title}?</p>
              </div>
              {userRating > 0 && (
                <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20">
                  You rated this
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {[...Array(10)].map((_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= (ratingHover || userRating);
                return (
                  <button
                    key={i}
                    onClick={() => handleRate(starValue)}
                    onMouseEnter={() => setRatingHover(starValue)}
                    onMouseLeave={() => setRatingHover(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    disabled={isSubmittingRating}
                  >
                    <Star
                      className={`w-6 h-6 md:w-8 md:h-8 ${isFilled ? "text-yellow-500 fill-current" : "text-slate-700"}`}
                    />
                  </button>
                );
              })}
              <span className="ml-3 text-2xl font-bold text-yellow-500">
                {ratingHover || userRating || 0}
              </span>
              <span className="text-slate-600 text-sm self-end mb-1">/ 10</span>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Movie Info</h3>
            <div className="space-y-4">
              <div>
                <span className="text-slate-500 text-sm block mb-1">Original Title</span>
                <span className="text-slate-200">{movie.originalTitle || movie.title}</span>
              </div>
              <div>
                <span className="text-slate-500 text-sm block mb-1">Status</span>
                <span className="text-slate-200">{movie.status || "Released"}</span>
              </div>
              <div>
                <span className="text-slate-500 text-sm block mb-1">Release Date</span>
                <span className="text-slate-200">{formatDate(movie.releaseDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-sm block mb-1">Original Language</span>
                <span className="text-slate-200 uppercase">{movie.originalLanguage || "EN"}</span>
              </div>
            </div>
          </div>

          {/* --- CLICKABLE KEYWORDS --- */}
          {movie.keywords?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {movie.keywords.map((kw) => (
                  <Link
                    key={kw.id}
                    to={`/search?q=${encodeURIComponent(kw.name)}`}
                    className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded hover:text-white transition cursor-pointer hover:bg-slate-700"
                  >
                    #{kw.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Directors */}
          {movie.directors?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">
                Director{movie.directors.length > 1 ? "s" : ""}
              </h3>
              <ul className="space-y-3">
                {movie.directors.map((person) => (
                  <li key={person.id}>
                    <Link
                      to={`/person/${person.id}/${encodeURIComponent(person.name)}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden ring-0 group-hover:ring-2 ring-red-600 transition-all">
                        {person.profilePath ? (
                          <img
                            src={getProfile(person.profilePath)}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                      </div>
                      <span className="text-slate-200 font-medium group-hover:text-red-500 transition-colors">
                        {person.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {similarMovies.length > 0 && (
        <div className="container mx-auto px-4 mt-8 pt-12 border-t border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-red-600 rounded-full"></span>
            You Might Also Like
          </h2>
          <MovieList data={similarMovies} />
        </div>
      )}
    </div>
  );
}
