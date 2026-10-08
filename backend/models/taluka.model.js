import db from '../config/db.js';

export const createTalukasTable = async () => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS talukas (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        district_id BIGINT UNSIGNED DEFAULT NULL,
        taluka_code INT DEFAULT NULL,
        taluka_name VARCHAR(255) DEFAULT NULL,
        status ENUM('Active','Inactive') DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT NULL,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_district_id (district_id)
      )`
    );
  } catch (error) {
    console.error('❌ Error creating talukas table:', error.message);
  }
};

export const getAllTalukas = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, district_id, taluka_code, taluka_name, status, created_at, updated_at
       FROM talukas
       ORDER BY taluka_name ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching talukas:', error);
    throw error;
  }
};

export const getTalukasByDistrict = async (districtId) => {
  try {
    const [rows] = await db.query(
      `SELECT id, district_id, taluka_code, taluka_name, status, created_at, updated_at
       FROM talukas
       WHERE district_id = ? AND status = 'Active'
       ORDER BY taluka_name ASC`,
      [districtId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching talukas by district:', error);
    throw error;
  }
};

export const getTalukaById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT id, district_id, taluka_code, taluka_name, status, created_at, updated_at
       FROM talukas
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching taluka:', error);
    throw error;
  }
};

export const createTaluka = async ({ district_id, taluka_code, taluka_name, status }) => {
  try {
    const [result] = await db.query(
      `INSERT INTO talukas (district_id, taluka_code, taluka_name, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [district_id, taluka_code || null, taluka_name, status || 'Active']
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating taluka:', error);
    throw error;
  }
};

export const updateTaluka = async (id, { district_id, taluka_code, taluka_name, status }) => {
  try {
    const [result] = await db.query(
      `UPDATE talukas
       SET district_id = ?, taluka_code = ?, taluka_name = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [district_id, taluka_code || null, taluka_name, status || 'Active', id]
    );
    return result;
  } catch (error) {
    console.error('Error updating taluka:', error);
    throw error;
  }
};

export const deleteTaluka = async (id) => {
  try {
    const [result] = await db.query(`DELETE FROM talukas WHERE id = ?`, [id]);
    return result;
  } catch (error) {
    console.error('Error deleting taluka:', error);
    throw error;
  }
};
