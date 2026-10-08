import {
  addSellerReview,
  getReviewByUserAndSeller,
  getReviewsBySeller,
  getSellerReviewSummary,
} from '../models/review.model.js';

export const createSellerReview = async (req, res) => {
  const reviewerUserId = req.user?.id;
  const { target_user_id, rating, comment } = req.body;

  if (!reviewerUserId) {
    return res.status(401).json({ message: 'Please login to submit a review.' });
  }

  if (!target_user_id) {
    return res.status(400).json({ message: 'Seller ID is required.' });
  }

  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  if (String(reviewerUserId) === String(target_user_id)) {
    return res.status(400).json({ message: 'You cannot review your own profile.' });
  }

  try {
    const existingReview = await getReviewByUserAndSeller(reviewerUserId, target_user_id);
    if (existingReview) {
      return res.status(409).json({
        message: 'You have already reviewed this seller. One review per seller is allowed.',
        review: existingReview,
      });
    }

    const review = await addSellerReview(reviewerUserId, target_user_id, Number(rating), comment || '');
    const summary = await getSellerReviewSummary(target_user_id);

    return res.status(201).json({
      message: 'Review submitted successfully.',
      review,
      summary,
    });
  } catch (error) {
    console.error('Error creating seller review:', error);
    return res.status(500).json({ message: 'Unable to submit review.' });
  }
};

export const getSellerReviews = async (req, res) => {
  const { targetUserId } = req.params;

  if (!targetUserId) {
    return res.status(400).json({ message: 'Seller ID is required.' });
  }

  try {
    const [reviews, summary] = await Promise.all([
      getReviewsBySeller(targetUserId),
      getSellerReviewSummary(targetUserId),
    ]);

    return res.status(200).json({
      reviews,
      average_rating: Number(summary.average_rating || 0),
      total_reviews: Number(summary.total_reviews || 0),
    });
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    return res.status(500).json({ message: 'Unable to fetch seller reviews.' });
  }
};
