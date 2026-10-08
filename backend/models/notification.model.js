import pool from '../config/db.js';

export const createNotificationsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT DEFAULT NULL,
      product_id INT DEFAULT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);

  try {
    await pool.query('ALTER TABLE notifications ADD COLUMN data JSON DEFAULT NULL AFTER type');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'data' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
};

// `data` carries the variables (item name, etc.) the frontend needs to render a
// translated title/message for known notification types; free-text fallback stays in title/message.
export const createNotification = async ({ userId, type, title, message, productId, data }) => {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, product_id, data) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, title, message || null, productId || null, data ? JSON.stringify(data) : null]
  );
  return result.insertId;
};

export const getNotificationsByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    [userId]
  );
  return rows;
};

export const getUnreadNotificationCount = async (userId) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return rows[0]?.count || 0;
};

export const markNotificationAsRead = async (id, userId) => {
  return pool.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
};

export const markAllNotificationsAsRead = async (userId) => {
  return pool.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
};
