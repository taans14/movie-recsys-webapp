import Joi from 'joi';

const createMovieDto = Joi.object({
  tmdbId: Joi.number().integer().required(),
  imdbId: Joi.string().allow('', null),
  title: Joi.string().required().trim(),
  originalTitle: Joi.string().allow('', null),
  overview: Joi.string().allow('', null),
  tagline: Joi.string().allow('', null),
  
  releaseDate: Joi.date().iso().allow(null),
  runtime: Joi.number().allow(null),
  status: Joi.string().allow('', null),

  genres: Joi.array().items(
    Joi.object({
      id: Joi.number(),
      name: Joi.string()
    })
  ),
  keywords: Joi.array().items(
    Joi.object({
      id: Joi.number(),
      name: Joi.string()
    })
  ),
  cast: Joi.array().items(
    Joi.object({
      id: Joi.number(),
      name: Joi.string(),
      character: Joi.string().allow('', null),
      profilePath: Joi.string().allow('', null),
      order: Joi.number()
    })
  ),
  directors: Joi.array().items(
    Joi.object({
      id: Joi.number(),
      name: Joi.string(),
      profilePath: Joi.string().allow('', null)
    })
  ),

  voteAverage: Joi.number().min(0).max(10),
  voteCount: Joi.number().integer(),
  popularity: Joi.number(),

  posterPath: Joi.string().allow('', null),
  backdropPath: Joi.string().allow('', null),

  production_countries: Joi.array().items(
    Joi.object({
        iso_3166_1: Joi.string(),
        name: Joi.string()
    })
  )
});

export default createMovieDto;