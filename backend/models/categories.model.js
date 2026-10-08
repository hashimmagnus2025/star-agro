import pool from '../config/db.js';

export const createCategoriesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_hindi VARCHAR(255) DEFAULT NULL,
      name_marathi VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
        description_hindi TEXT DEFAULT NULL,
        description_marathi TEXT DEFAULT NULL,
      image_url VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);
  try {
    await pool.query('ALTER TABLE categories ADD COLUMN image_url VARCHAR(255) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'image_url' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
  try {
    await pool.query("ALTER TABLE categories ADD COLUMN name_hindi VARCHAR(255) DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'name_hindi' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
  try {
    await pool.query("ALTER TABLE categories ADD COLUMN name_marathi VARCHAR(255) DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'name_marathi' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }

  try {
    await pool.query(
      "ALTER TABLE categories ADD COLUMN description_hindi TEXT DEFAULT NULL"
    );
  } catch (alterError) {
    if (
      !/Duplicate column name|Column 'description_hindi' already exists/i.test(
        alterError.message
      )
    ) {
      throw alterError;
    }
  }

  try {
    await pool.query(
      "ALTER TABLE categories ADD COLUMN description_marathi TEXT DEFAULT NULL"
    );
  } catch (alterError) {
    if (
      !/Duplicate column name|Column 'description_marathi' already exists/i.test(
        alterError.message
      )
    ) {
      throw alterError;
    }
  }
};

export const insertCategory = async (category) => {
  const sql = `
    INSERT INTO categories (name, name_hindi, name_marathi, description, description_hindi, description_marathi, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  return pool.query(sql, [
    category.name,
    category.name_hindi || null,
    category.name_marathi || null,
    category.description || null,
    category.description_hindi || null,
    category.description_marathi || null,
    category.image_url || null,
  ]);
};

export const getAllCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
  return rows;
};

export const getCategoryById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
};

export const updateCategory = async (id, category) => {
  const sql = `
    UPDATE categories
    SET name = ?, name_hindi = ?, name_marathi = ?, description = ?, description_hindi = ?, description_marathi = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return pool.query(sql, [
    category.name,
    category.name_hindi || null,
    category.name_marathi || null,
    category.description || null,
    category.description_hindi || null,
    category.description_marathi || null,
    category.image_url || null,
    id,
  ]);
};

export const deleteCategory = async (id) => {
  const sql = 'DELETE FROM categories WHERE id = ?';
  return pool.query(sql, [id]);
};
