import {
  insertFavorite,
  deleteFavorite,
  getFavoriteByUserProduct,
  getFavoritesByUser,
} from '../models/favorite.model.js';

export const toggleFavorite = async (req, res) => {
  const userId = req.user?.id;
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  try {

    const existingFavorite = await getFavoriteByUserProduct(userId, productId);

    if (existingFavorite) {
      await deleteFavorite(userId, productId);
      return res.status(200).json({ favorite: false, message: 'Product removed from favorites' });
    }

    await insertFavorite(userId, productId);
    return res.status(201).json({ favorite: true, message: 'Product added to favorites' });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return res.status(500).json({ message: 'Unable to toggle favorite' });
  }
};

export const getFavoriteStatus = async (req, res) => {
  const userId = req.user?.id;
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  try {
    const favorite = await getFavoriteByUserProduct(userId, productId);
    return res.status(200).json({ favorite: Boolean(favorite) });
  } catch (error) {
    console.error('Error fetching favorite status:', error);
    return res.status(500).json({ message: 'Unable to fetch favorite status' });
  }
};

export const getUserFavorites = async (req, res) => {
  const userId = req.user?.id;

  try {
    const favorites = await getFavoritesByUser(userId);
    return res.status(200).json(favorites);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return res.status(500).json({ message: 'Unable to fetch favorites' });
  }
};
