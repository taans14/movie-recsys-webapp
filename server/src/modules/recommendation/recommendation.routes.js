import express from 'express';
import * as controller from './recommendation.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/for-you', protect, controller.getForYou);
router.post('/hybrid', protect, controller.getHybrid);

router.post('/similar', controller.getSimilarMovies);

router.get('/trending', controller.getTrending);
router.get('/discover', controller.getDiscovery);

router.get('/metadata', controller.getMetadata);
router.get('/genres', controller.getGenres);
router.get('/countries', controller.getCountries);

export default router;
