import pool from "../config/db.js";

export const createServiceInquiriesTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS service_inquiries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      service_id BIGINT DEFAULT NULL,
      user_id BIGINT DEFAULT NULL,
      name VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(255) DEFAULT NULL,
      message TEXT DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
    await pool.query(sql);
};

export const createServiceInquiry = async (inquiryData) => {
    const sql = `
    INSERT INTO service_inquiries (service_id, user_id, name, email, phone, message)
    VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        inquiryData.service_id,
        inquiryData.user_id,
        inquiryData.name,
        inquiryData.email,
        inquiryData.phone,
        inquiryData.message,
    ];

    const [result] = await pool.query(sql, values);
    return result.insertId;
};

export const getServiceInquiriesByServiceId = async (serviceId) => {
    const sql = `
    SELECT * FROM service_inquiries
    WHERE service_id = ?
    ORDER BY created_at DESC
  `;

    const [rows] = await pool.query(sql, [serviceId]);
    return rows;
};

export const getServiceInquiriesByUserId = async (userId) => {
    const sql = `
    SELECT * FROM service_inquiries
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

    const [rows] = await pool.query(sql, [userId]);
    return rows;
};
