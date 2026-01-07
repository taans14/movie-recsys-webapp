import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  tmdbId: { type: Number, unique: true, index: true }, 
  imdbId: { type: String, unique: true, sparse: true }, 
  title: { type: String, required: true, trim: true, index: true },
  originalTitle: String,
  overview: String,
  tagline: String, 
  
  releaseDate: Date,
  runtime: Number,
  status: String,
  
  genres: [{
    id: Number,
    name: String
  }],
  keywords: [{ 
    id: Number,
    name: String
  }],

  cast: [{
    id: Number,
    name: String,
    character: String,
    profilePath: String,
    order: Number 
  }],
  directors: [{
    id: Number,
    name: String,
    profilePath: String
  }],

  tmdbVoteAverage: { type: Number, default: 0 },
  tmdbVoteCount: { type: Number, default: 0 },

  userVoteAverage: { type: Number, default: 0 },
  userVoteCount: { type: Number, default: 0 },

  voteAverage: { type: Number, default: 0, index: true },
  voteCount: { type: Number, default: 0 },
  
  popularity: { type: Number, default: 0 },

  posterPath: String,
  backdropPath: String,
  
  production_countries: [{
    iso_3166_1: String,
    name: String
  }]
  
}, {
  timestamps: true,
  collection: 'movies'
});

// Text index for search
movieSchema.index({ title: 'text', overview: 'text', 'keywords.name': 'text' });

export default mongoose.model('Movie', movieSchema);