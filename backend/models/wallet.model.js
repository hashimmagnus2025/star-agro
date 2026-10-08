import pool from '../config/db.js';

export const createWalletTables = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      points DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      currency VARCHAR(10) DEFAULT 'INR',
      payment_status VARCHAR(20) DEFAULT 'pending',
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(255),
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_wallet_user_id (user_id),
      INDEX idx_wallet_order_id (razorpay_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);
};

export const createWalletTransaction = async ({ userId, amount, points, currency = 'INR', orderId }) => {
  const sql = `
    INSERT INTO wallet_transactions (user_id, amount, points, currency, payment_status, razorpay_order_id)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `;

  const [result] = await pool.query(sql, [userId, amount, points, currency, orderId]);
  return result.insertId;
};

export const updateWalletTransaction = async ({ orderId, paymentId, signature, amount, points }) => {
  const sql = `
    UPDATE wallet_transactions
    SET payment_status = 'paid',
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        amount = ?,
        points = ?
    WHERE razorpay_order_id = ?
  `;

  await pool.query(sql, [paymentId, signature, amount, points, orderId]);
};

export const getWalletBalance = async (userId) => {
  const [rows] = await pool.query(
    'SELECT COALESCE(SUM(points), 0) AS total_points FROM wallet_transactions WHERE user_id = ? AND payment_status = "paid"',
    [userId]
  );

  return Number(rows[0]?.total_points || 0);
};

export const getTotalWalletBalance = async () => {
  const [rows] = await pool.query(
    'SELECT COALESCE(SUM(points), 0) AS total_points FROM wallet_transactions WHERE payment_status = "paid"'
  );

  return Number(rows[0]?.total_points || 0);
};

export const getWalletTransactions = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id, amount, points, payment_status, razorpay_order_id, razorpay_payment_id, created_at FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [userId]
  );

  return rows;
};
