import pool from "../config/db.js";

export const createProductInquiriesTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS product_inquiries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id BIGINT DEFAULT NULL,
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

export const createProductInquiry = async (inquiryData) => {
    const sql = `
    INSERT INTO product_inquiries (product_id, user_id, name, email, phone, message)
    VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        inquiryData.product_id,
        inquiryData.user_id,
        inquiryData.name,
        inquiryData.email,
        inquiryData.phone,
        inquiryData.message,
    ];

    const [result] = await pool.query(sql, values);
    return result.insertId;
};

export const getProductInquiriesByProductId = async (productId) => {
    const sql = `
    SELECT * FROM product_inquiries
    WHERE product_id = ?
    ORDER BY created_at DESC
  `;

    const [rows] = await pool.query(sql, [productId]);
    return rows;
};

export const getProductInquiriesByUserId = async (userId) => {
    const sql = `
    SELECT * FROM product_inquiries
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

    const [rows] = await pool.query(sql, [userId]);
    return rows;
};



