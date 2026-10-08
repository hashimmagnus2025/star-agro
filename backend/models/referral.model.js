import pool from '../config/db.js';

export const createReferralsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS referrals (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      referrer_id BIGINT UNSIGNED NOT NULL,
      referred_user_id BIGINT UNSIGNED NOT NULL,
      referral_code VARCHAR(50),
      points_awarded INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_referrals_referrer_id (referrer_id),
      INDEX idx_referrals_referred_user_id (referred_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);
};

export const insertReferral = async ({ referrerId, referredUserId, referralCode, pointsAwarded }) => {
  const sql = `
    INSERT INTO referrals (referrer_id, referred_user_id, referral_code, points_awarded)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [referrerId, referredUserId, referralCode, pointsAwarded]);
  return result.insertId;
};

export const getReferralsByReferrerId = async (referrerId) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.points_awarded, r.created_at,
            u.id AS referred_user_id, u.name AS referred_name, u.email AS referred_email
     FROM referrals r
     JOIN users u ON u.id = r.referred_user_id
     WHERE r.referrer_id = ?
     ORDER BY r.created_at DESC`,
    [referrerId]
  );
  return rows;
};

export const getReferralStats = async (referrerId) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total_referrals, COALESCE(SUM(points_awarded), 0) AS total_points
     FROM referrals WHERE referrer_id = ?`,
    [referrerId]
  );
  return {
    totalReferrals: Number(rows[0]?.total_referrals || 0),
    totalPoints: Number(rows[0]?.total_points || 0),
  };
};
