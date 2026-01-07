import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import movieRoutes from '../modules/movies/movies.routes.js';
import userRoutes from '../modules/users/users.routes.js';
import ratingRoutes from '../modules/ratings/ratings.routes.js';
import watchlistRoutes from '../modules/watchlists/watchlists.routes.js';
import historyRoutes from "../modules/histories/histories.routes.js";
import recommednationRoutes from "../modules/recommendation/recommendation.routes.js";
import { authLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/movies', movieRoutes);
router.use('/ratings', ratingRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/histories', historyRoutes);
router.use('/recommendation', recommednationRoutes);

export default router;
