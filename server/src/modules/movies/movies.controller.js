import * as movieService from './movies.service.js';
import createMovieDto from './dto/createMovie.dto.js';
import updateMovieDto from './dto/updateMovie.dto.js';

export const create = async (req, res) => {
  try {
    const { error, value } = createMovieDto.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const movie = await movieService.createMovie(value);
    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const movies = await movieService.getAllMovies(limit, page);
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const findOne = async (req, res) => {
  try {
    const movie = await movieService.getMovieById(req.params.tmdb_id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.status(200).json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { error, value } = updateMovieDto.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updatedMovie = await movieService.updateMovie(req.params.tmdb_id, value);
    if (!updatedMovie) return res.status(404).json({ message: 'Movie not found' });

    res.status(200).json(updatedMovie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const deleted = await movieService.deleteMovie(req.params.tmdb_id);
    if (!deleted) return res.status(404).json({ message: 'Movie not found' });
    res.status(200).json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrending = async (req, res) => {
  try {
    const movies = await movieService.getTrending();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTopRated = async (req, res) => {
  try {
    const movies = await movieService.getTopRated();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const search = async (req, res) => {
  try {
    const { q } = req.query; // Get search term from query params (e.g., ?q=batman)
    
    if (!q) {
      return res.status(400).json({ message: "Search query 'q' is required" });
    }

    const results = await movieService.searchMovies(q);
    res.status(200).json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error during search" });
  }
};