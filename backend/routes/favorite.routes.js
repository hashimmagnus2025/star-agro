import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { toggleFavorite, getFavoriteStatus, getUserFavorites } from '../controllers/favorite.controller.js';

const router = express.Router();

router.post('/:productId', protect, toggleFavorite);
router.get('/status/:productId', protect, getFavoriteStatus);
router.get('/', protect, getUserFavorites);

export default router;
