import pool from '../config/db.js';

export const createReviewsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      reviewer_user_id BIGINT UNSIGNED NOT NULL,
      target_user_id BIGINT UNSIGNED NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      comment TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_seller_review (reviewer_user_id, target_user_id),
      KEY idx_target_user_id (target_user_id),
      KEY idx_reviewer_user_id (reviewer_user_id),
      CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);
};

export const addSellerReview = async (reviewerUserId, targetUserId, rating, comment) => {
  const sql = `
    INSERT INTO reviews (reviewer_user_id, target_user_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [reviewerUserId, targetUserId, rating, comment || null]);
  return result;
};

export const getReviewByUserAndSeller = async (reviewerUserId, targetUserId) => {
  const sql = `
    SELECT *
    FROM reviews
    WHERE reviewer_user_id = ? AND target_user_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [reviewerUserId, targetUserId]);
  return rows[0] || null;
};

export const getReviewsBySeller = async (targetUserId) => {
  const sql = `
    SELECT r.*, u.name AS reviewer_name, u.first_name, u.last_name, u.profile_image
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_user_id
    WHERE r.target_user_id = ?
    ORDER BY r.created_at DESC
  `;

  const [rows] = await pool.query(sql, [targetUserId]);
  return rows;
};

export const getSellerReviewSummary = async (targetUserId) => {
  const sql = `
    SELECT
      ROUND(AVG(rating), 1) AS average_rating,
      COUNT(*) AS total_reviews
    FROM reviews
    WHERE target_user_id = ?
  `;

  const [rows] = await pool.query(sql, [targetUserId]);
  return rows[0] || { average_rating: 0, total_reviews: 0 };
};
