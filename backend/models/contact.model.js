
import pool from '../config/db.js';

export const createContactTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      subject VARCHAR(255) DEFAULT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);
};

export const insertContactMessage = async (message) => {
  const sql = `
    INSERT INTO contact_messages (name, email, phone, subject, message)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [message.name, message.email, message.phone || null, message.subject || null, message.message];
  return pool.query(sql, values);
};

export const getAllContactMessages = async () => {
  const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return rows;
};

export const getContactMessageById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
  return rows[0] || null;
};

