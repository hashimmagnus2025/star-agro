import pool from '../config/db.js';

export const createAdvertisementInquiryTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS advertisement_inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      selected_size VARCHAR(100) DEFAULT NULL,
      message TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);
};

export const insertAdvertisementInquiry = async (inquiry) => {
  const sql = `
    INSERT INTO advertisement_inquiries (name, email, phone, selected_size, message)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    inquiry.name,
    inquiry.email,
    inquiry.phone || null,
    inquiry.selectedSize || null,
    inquiry.message || null,
  ];
  const [result] = await pool.query(sql, values);
  return result;
};

export const getAllAdvertisementInquiries = async () => {
  const [rows] = await pool.query('SELECT * FROM advertisement_inquiries ORDER BY created_at DESC');
  return rows;
};

export const getAdvertisementInquiryById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM advertisement_inquiries WHERE id = ?', [id]);
  return rows[0] || null;
};
