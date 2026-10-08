import pool from '../config/db.js';

export const createSubCategoriesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS sub_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_hindi VARCHAR(255) DEFAULT NULL,
      name_marathi VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      description_hindi TEXT DEFAULT NULL,
        description_marathi TEXT DEFAULT NULL,
      category_id INT NOT NULL,
      image VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_subcategory_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);
  try {
    await pool.query('ALTER TABLE sub_categories ADD COLUMN image VARCHAR(255) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'image' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
  try {
    await pool.query("ALTER TABLE sub_categories ADD COLUMN name_hindi VARCHAR(255) DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'name_hindi' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
  try {
    await pool.query("ALTER TABLE sub_categories ADD COLUMN name_marathi VARCHAR(255) DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'name_marathi' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }

  try {
    await pool.query(
      "ALTER TABLE sub_categories ADD COLUMN description_hindi TEXT DEFAULT NULL"
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
      "ALTER TABLE sub_categories ADD COLUMN description_marathi TEXT DEFAULT NULL"
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

export const insertSubCategory = async (subCategory) => {
  const sql = `
    INSERT INTO sub_categories (name, name_hindi, name_marathi, description, description_hindi, description_marathi, category_id, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return pool.query(sql, [
    subCategory.name,
    subCategory.name_hindi || null,
    subCategory.name_marathi || null,
    subCategory.description || null,
    subCategory.description_hindi || null,
    subCategory.description_marathi || null,
    subCategory.category_id,
    subCategory.image || null,
  ]);
};

export const getAllSubCategories = async () => {
  const sql = `
    SELECT
      sc.id,
      sc.name,
      sc.name_hindi,
      sc.name_marathi,
      sc.description,
      sc.description_hindi,
      sc.description_marathi,
      sc.category_id,
      sc.image,
      c.name AS category_name,
      sc.created_at,
      sc.updated_at
    FROM sub_categories sc
    JOIN categories c ON sc.category_id = c.id
    ORDER BY sc.created_at DESC
  `;
  const [rows] = await pool.query(sql);
  return rows;
};

export const getSubCategoriesByCategory = async (categoryId) => {
  const sql = `
    SELECT
      sc.id,
      sc.name,
      sc.name_hindi,
      sc.name_marathi,
      sc.description,
      sc.description_hindi,
      sc.description_marathi,
      sc.category_id,
      sc.image,
      c.name AS category_name,
      sc.created_at,
      sc.updated_at
    FROM sub_categories sc
    JOIN categories c ON sc.category_id = c.id
    WHERE sc.category_id = ?
    ORDER BY sc.created_at DESC
  `;
  const [rows] = await pool.query(sql, [categoryId]);
  return rows;
};

export const getSubCategoryById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM sub_categories WHERE id = ?', [id]);
  return rows[0] || null;
};

export const updateSubCategory = async (id, subCategory) => {
  const sql = `
    UPDATE sub_categories
    SET name = ?, name_hindi = ?, name_marathi = ?, description = ?, description_hindi = ?, description_marathi = ?, category_id = ?, image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return pool.query(sql, [
    subCategory.name,
    subCategory.name_hindi || null,
    subCategory.name_marathi || null,
    subCategory.description || null,
    subCategory.description_hindi || null,
    subCategory.description_marathi || null,
    subCategory.category_id,
    subCategory.image || null,
    id,
  ]);
};

export const deleteSubCategory = async (id) => {
  const sql = 'DELETE FROM sub_categories WHERE id = ?';
  return pool.query(sql, [id]);
};
