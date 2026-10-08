import db from '../config/db.js';

export const createVillagesTable = async () => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS villages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        taluka_id BIGINT UNSIGNED NOT NULL,
        village_code INT NOT NULL,
        village_name VARCHAR(255) DEFAULT NULL,
        village_category ENUM('Rural','Urban','Unmapped','Both') DEFAULT NULL,
        status ENUM('active','inactive') NOT NULL,
        created_at TIMESTAMP NULL DEFAULT NULL,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_taluka_id (taluka_id)
      )`
    );
  } catch (error) {
    console.error('❌ Error creating villages table:', error.message);
  }
};

export const getAllVillages = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, taluka_id, village_code, village_name, village_category, status, created_at, updated_at
       FROM villages
       ORDER BY village_name ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching villages:', error);
    throw error;
  }
};

export const getVillagesByTaluka = async (talukaId) => {
  try {
    const [rows] = await db.query(
      `SELECT id, taluka_id, village_code, village_name, village_category, status, created_at, updated_at
       FROM villages
       WHERE taluka_id = ? AND status = 'active'
       ORDER BY village_name ASC`,
      [talukaId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching villages by taluka:', error);
    throw error;
  }
};

export const getVillageById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT id, taluka_id, village_code, village_name, village_category, status, created_at, updated_at
       FROM villages
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching village:', error);
    throw error;
  }
};

export const createVillage = async ({ taluka_id, village_code, village_name, village_category, status }) => {
  try {
    const [result] = await db.query(
      `INSERT INTO villages (taluka_id, village_code, village_name, village_category, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [taluka_id, village_code, village_name || null, village_category || null, status || 'active']
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating village:', error);
    throw error;
  }
};

export const updateVillage = async (id, { taluka_id, village_code, village_name, village_category, status }) => {
  try {
    const [result] = await db.query(
      `UPDATE villages
       SET taluka_id = ?, village_code = ?, village_name = ?, village_category = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [taluka_id, village_code, village_name || null, village_category || null, status || 'active', id]
    );
    return result;
  } catch (error) {
    console.error('Error updating village:', error);
    throw error;
  }
};

export const deleteVillage = async (id) => {
  try {
    const [result] = await db.query(`DELETE FROM villages WHERE id = ?`, [id]);
    return result;
  } catch (error) {
    console.error('Error deleting village:', error);
    throw error;
  }
};
