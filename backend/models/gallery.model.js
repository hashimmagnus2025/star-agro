

import pool from '../config/db.js';

export const createGalleryTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS gallery (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        image VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);
};

export const insertGalleryItem = async ({ title, description, image }) => {
    const sql = `
      INSERT INTO gallery (title, description, image)
        VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [title, description, image]);
    return result.insertId;
}

export const getAllGalleryItems = async () => {
    const sql = `
      SELECT * FROM gallery
    `;
    const [rows] = await pool.query(sql);
    return rows;
}

export const getGalleryItemById = async (id) => {
    const sql = `
      SELECT * FROM gallery WHERE id = ? 
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
}

export const updateGalleryItem = async (id, { title, description, image }) => {
    const sql = `
      UPDATE gallery SET title = ?, description = ?, image = ? WHERE id = ?
    `;
    const [result] = await pool.query(sql, [title, description, image, id]);
    return result.affectedRows > 0;
}

export const deleteGalleryItem = async (id) => {
    const sql = `
      DELETE FROM gallery WHERE id = ?
    `;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
}


