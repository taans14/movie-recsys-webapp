import * as ratingService from "./ratings.service.js";
import createRatingDto from "./dto/createRating.dto.js";

export const addRating = async (req, res) => {
  try {
    const { error, value } = createRatingDto.validate(req.body);
    if (error) {
      console.log(error);
      return res.status(400).json({ message: error.details[0].message });
    }

    const rating = await ratingService.addRating(req.user._id, value);
    res.status(200).json(rating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyRatings = async (req, res) => {
  try {
    const ratings = await ratingService.getUserRatings(req.user._id);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
