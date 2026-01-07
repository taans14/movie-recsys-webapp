import express from 'express';
import * as userController from './users.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get("/me", protect, userController.getMe);

export default router;
