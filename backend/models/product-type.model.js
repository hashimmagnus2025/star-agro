import pool from '../config/db.js';

export const createProductTypeTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS product_types (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        type VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
    
    await pool.query(sql);

    const [columns] = await pool.query(`SHOW COLUMNS FROM product_types LIKE 'description'`);
    if (columns.length === 0) {
        await pool.query(`ALTER TABLE product_types ADD COLUMN description TEXT DEFAULT NULL`);
    }
    const [updatedAtColumns] = await pool.query(`SHOW COLUMNS FROM product_types LIKE 'updated_at'`);
    if (updatedAtColumns.length === 0) {
        await pool.query(`ALTER TABLE product_types ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    }
};

export const insertProductType = async ({ name, description, type }) => {
    const sql = `
      INSERT INTO product_types (name, description, type)
        VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [name, description, type]);
    return result.insertId;
}

export const getAllProductTypes = async () => {
    const sql = `
      SELECT * FROM product_types
    `;
    const [rows] = await pool.query(sql);
    return rows;
}

export const getProductTypeById = async (id) => {
    const sql = `
      SELECT * FROM product_types WHERE id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
}

export const updateProductType = async (id, { name, description, type }) => {
    const sql = `
      UPDATE product_types SET name = ?, description = ?, type = ? WHERE id = ?
    `;
    await pool.query(sql, [name, description, type, id]);
}

export const deleteProductType = async (id) => {
    const sql = `
      DELETE FROM product_types WHERE id = ?
    `;
    await pool.query(sql, [id]);
}







     
