import db from '../config/db.js';

export const createDistrictsTable = async () => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS districts (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        state_id BIGINT UNSIGNED DEFAULT NULL,
        district_code INT DEFAULT NULL,
        district_name VARCHAR(255) DEFAULT NULL,
        status ENUM('Active','Inactive') DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT NULL,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_state_id (state_id)
      )`
    );
  } catch (error) {
    console.error('❌ Error creating districts table:', error.message);
  }
};

export const getAllDistricts = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, state_id, district_code, district_name, status, created_at, updated_at
       FROM districts
       ORDER BY district_name ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

export const getDistrictsByState = async (stateId) => {
  try {
    const [rows] = await db.query(
      `SELECT id, state_id, district_code, district_name, status, created_at, updated_at
       FROM districts
       WHERE state_id = ? AND status = 'Active'
       ORDER BY district_name ASC`,
      [stateId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching districts by state:', error);
    throw error;
  }
};

export const getDistrictById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT id, state_id, district_code, district_name, status, created_at, updated_at
       FROM districts
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching district:', error);
    throw error;
  }
};

export const createDistrict = async ({ state_id, district_code, district_name, status }) => {
  try {
    const [result] = await db.query(
      `INSERT INTO districts (state_id, district_code, district_name, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [state_id, district_code || null, district_name, status || 'Active']
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating district:', error);
    throw error;
  }
};

export const updateDistrict = async (id, { state_id, district_code, district_name, status }) => {
  try {
    const [result] = await db.query(
      `UPDATE districts
       SET state_id = ?, district_code = ?, district_name = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [state_id, district_code || null, district_name, status || 'Active', id]
    );
    return result;
  } catch (error) {
    console.error('Error updating district:', error);
    throw error;
  }
};

export const deleteDistrict = async (id) => {
  try {
    const [result] = await db.query(`DELETE FROM districts WHERE id = ?`, [id]);
    return result;
  } catch (error) {
    console.error('Error deleting district:', error);
    throw error;
  }
};
