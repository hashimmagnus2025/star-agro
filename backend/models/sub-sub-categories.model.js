import db from '../config/db.js';

export const createSubSubCategoriesTable = async () => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS sub_sub_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_hindi VARCHAR(255) DEFAULT NULL,
        name_marathi VARCHAR(255) DEFAULT NULL,
        description TEXT,
        sub_category_id INT NOT NULL,
        image VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE CASCADE
      )`
    );
    try {
      await db.query('ALTER TABLE sub_sub_categories ADD COLUMN image VARCHAR(255) DEFAULT NULL');
    } catch (alterError) {
      if (!/Duplicate column name|Column \'image\' already exists/i.test(alterError.message)) {
        throw alterError;
      }
    }
    try {
      await db.query("ALTER TABLE sub_sub_categories ADD COLUMN name_hindi VARCHAR(255) DEFAULT NULL");
    } catch (alterError) {
      if (!/Duplicate column name|Column 'name_hindi' already exists/i.test(alterError.message)) {
        throw alterError;
      }
    }
    try {
      await db.query("ALTER TABLE sub_sub_categories ADD COLUMN name_marathi VARCHAR(255) DEFAULT NULL");
    } catch (alterError) {
      if (!/Duplicate column name|Column 'name_marathi' already exists/i.test(alterError.message)) {
        throw alterError;
      }
    }
  
  } catch (error) {
    console.error('❌ Error creating sub_sub_categories table:', error.message);
  }
};

export const getAllSubSubCategories = async () => {
  try {
    const [rows] = await db.query(
      `SELECT 
        ssc.id,
        ssc.name,
        ssc.name_hindi,
        ssc.name_marathi,
        ssc.description,
        ssc.sub_category_id,
        ssc.image,
        ssc.created_at,
        ssc.updated_at,
        sc.name AS sub_category_name,
        sc.category_id,
        c.name AS category_name
      FROM sub_sub_categories ssc
      LEFT JOIN sub_categories sc ON ssc.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      ORDER BY ssc.created_at DESC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching sub-sub-categories:', error);
    throw error;
  }
};

export const getSubSubCategoriesBySubCategory = async (subCategoryId) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        ssc.id,
        ssc.name,
        ssc.name_hindi,
        ssc.name_marathi,
        ssc.description,
        ssc.sub_category_id,
        ssc.image,
        ssc.created_at,
        ssc.updated_at,
        sc.name AS sub_category_name,
        sc.category_id,
        c.name AS category_name
      FROM sub_sub_categories ssc
      LEFT JOIN sub_categories sc ON ssc.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE ssc.sub_category_id = ?
      ORDER BY ssc.created_at DESC`,
      [subCategoryId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching sub-sub-categories by sub-category:', error);
    throw error;
  }
};

export const getSubSubCategoryById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        ssc.id,
        ssc.name,
        ssc.name_hindi,
        ssc.name_marathi,
        ssc.description,
        ssc.sub_category_id,
        ssc.image,
        ssc.created_at,
        ssc.updated_at,
        sc.name AS sub_category_name,
        sc.category_id,
        c.name AS category_name
      FROM sub_sub_categories ssc
      LEFT JOIN sub_categories sc ON ssc.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE ssc.id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching sub-sub-category:', error);
    throw error;
  }
};

export const createSubSubCategory = async (name, name_hindi, name_marathi, description, sub_category_id, image) => {
  try {
    const [result] = await db.query(
      `INSERT INTO sub_sub_categories (name, name_hindi, name_marathi, description, sub_category_id, image) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, name_hindi || null, name_marathi || null, description, sub_category_id, image || null]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating sub-sub-category:', error);
    throw error;
  }
};

export const updateSubSubCategory = async (id, name, name_hindi, name_marathi, description, sub_category_id, image) => {
  try {
    await db.query(
      `UPDATE sub_sub_categories 
       SET name = ?, name_hindi = ?, name_marathi = ?, description = ?, sub_category_id = ?, image = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, name_hindi || null, name_marathi || null, description, sub_category_id, image || null, id]
    );
  } catch (error) {
    console.error('Error updating sub-sub-category:', error);
    throw error;
  }
};

export const deleteSubSubCategory = async (id) => {
  try {
    await db.query(
      `DELETE FROM sub_sub_categories WHERE id = ?`,
      [id]
    );
  } catch (error) {
    console.error('Error deleting sub-sub-category:', error);
    throw error;
  }
};
