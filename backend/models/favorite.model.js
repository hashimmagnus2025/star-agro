import pool from '../config/db.js';

export const createFavoritesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS favorites (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_product (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);
};

export const insertFavorite = async (userId, productId) => {
  const sql = `INSERT INTO favorites (user_id, product_id) VALUES (?, ?)`;
  return pool.query(sql, [userId, productId]);
};

export const deleteFavorite = async (userId, productId) => {
  const sql = `DELETE FROM favorites WHERE user_id = ? AND product_id = ?`;
  return pool.query(sql, [userId, productId]);
};

export const getFavoriteByUserProduct = async (userId, productId) => {
  const sql = `SELECT * FROM favorites WHERE user_id = ? AND product_id = ? LIMIT 1`;
  const [rows] = await pool.query(sql, [userId, productId]);
  return rows[0] || null;
};

export const getFavoritesByUser = async (userId) => {
  const sql = `
    SELECT f.id AS favorite_id, p.*
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows;
};
