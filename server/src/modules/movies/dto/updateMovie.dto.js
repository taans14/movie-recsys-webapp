import Joi from 'joi';

const updateMovieDto = Joi.object({
  title: Joi.string().trim(),
  overview: Joi.string(),
  tagline: Joi.string(),
  releaseDate: Joi.date().iso(),
  runtime: Joi.number(),
  
  tmdbVoteAverage: Joi.number().min(0).max(10),
  tmdbVoteCount: Joi.number().integer(),
  
  posterPath: Joi.string(),
  backdropPath: Joi.string(),
  status: Joi.string()
}).min(1);

export default updateMovieDto;