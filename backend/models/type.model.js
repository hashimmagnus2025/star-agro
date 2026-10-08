import pool from '../config/db.js';

export const createTypeTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS types (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_hindi VARCHAR(255) DEFAULT NULL,
      name_marathi VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);

  const [columns] = await pool.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'types'
      AND COLUMN_NAME IN ('name_hindi', 'name_marathi')
  `);
  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existingColumns.has('name_hindi')) {
    await pool.query('ALTER TABLE types ADD COLUMN name_hindi VARCHAR(255) DEFAULT NULL AFTER name');
  }
  if (!existingColumns.has('name_marathi')) {
    await pool.query('ALTER TABLE types ADD COLUMN name_marathi VARCHAR(255) DEFAULT NULL AFTER name_hindi');
  }
};

export const insertType = async ({ name, name_hindi, name_marathi, description, status }) => {
  const sql = `
    INSERT INTO types (name, name_hindi, name_marathi, description, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [name, name_hindi || null, name_marathi || null, description || null, status || 'Active']);
  return result.insertId;
};

export const getAllTypes = async () => {
  const sql = `SELECT * FROM types ORDER BY id DESC`;
  const [rows] = await pool.query(sql);
  return rows;
};

export const getTypeById = async (id) => {
  const sql = `SELECT * FROM types WHERE id = ?`;
  const [rows] = await pool.query(sql, [id]);
  return rows[0];
};

export const updateType = async (id, { name, name_hindi, name_marathi, description, status }) => {
  const sql = `UPDATE types SET name = ?, name_hindi = ?, name_marathi = ?, description = ?, status = ? WHERE id = ?`;
  await pool.query(sql, [name, name_hindi || null, name_marathi || null, description || null, status || 'Active', id]);
};

export const deleteType = async (id) => {
  const sql = `DELETE FROM types WHERE id = ?`;
  await pool.query(sql, [id]);
};
