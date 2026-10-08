import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { createSellerReview, getSellerReviews } from '../controllers/review.controller.js';

const router = express.Router();

router.post('/', protect, createSellerReview);
router.get('/:targetUserId', getSellerReviews);

export default router;
