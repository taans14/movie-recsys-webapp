import Joi from 'joi';

const createRatingDto = Joi.object({
  movieId: Joi.string().required(),
  userId: Joi.string().required(),
  rating: Joi.number().min(1).max(10).required()
});

export default createRatingDto;
