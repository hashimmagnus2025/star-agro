import db from '../config/db.js';

export const createStatesTable = async () => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS states (
        id MEDIUMINT(8) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country_id MEDIUMINT(8) UNSIGNED NOT NULL,
        country_code CHAR(2) NOT NULL,
        fips_code VARCHAR(255) DEFAULT NULL,
        iso2 VARCHAR(255) DEFAULT NULL,
        type VARCHAR(191) DEFAULT NULL,
        latitude DECIMAL(10,8) DEFAULT NULL,
        longitude DECIMAL(11,8) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        flag TINYINT(1) NOT NULL DEFAULT 1,
        wikiDataId VARCHAR(255) DEFAULT NULL,
        INDEX idx_country_id (country_id)
      )`
    );
  } catch (error) {
    console.error('❌ Error creating states table:', error.message);
  }
};

export const getAllStates = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, country_id, country_code, fips_code, iso2, type,
              latitude, longitude, flag, wikiDataId, created_at, updated_at
       FROM states
       ORDER BY name ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching states:', error);
    throw error;
  }
};

export const getStatesByCountry = async (countryId) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, country_id, country_code, fips_code, iso2, type,
              latitude, longitude, flag, wikiDataId, created_at, updated_at
       FROM states
       WHERE country_id = ?
       ORDER BY name ASC`,
      [countryId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching states by country:', error);
    throw error;
  }
};

export const getStateById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, country_id, country_code, fips_code, iso2, type,
              latitude, longitude, flag, wikiDataId, created_at, updated_at
       FROM states
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching state:', error);
    throw error;
  }
};

export const createState = async ({
  name,
  country_id,
  country_code,
  fips_code,
  iso2,
  type,
  latitude,
  longitude,
  flag,
  wikiDataId,
}) => {
  try {
    const [result] = await db.query(
      `INSERT INTO states (name, country_id, country_code, fips_code, iso2, type, latitude, longitude, flag, wikiDataId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        country_id,
        country_code,
        fips_code || null,
        iso2 || null,
        type || null,
        latitude || null,
        longitude || null,
        flag === undefined ? 1 : flag,
        wikiDataId || null,
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating state:', error);
    throw error;
  }
};

export const updateState = async (id, {
  name,
  country_id,
  country_code,
  fips_code,
  iso2,
  type,
  latitude,
  longitude,
  flag,
  wikiDataId,
}) => {
  try {
    const [result] = await db.query(
      `UPDATE states
       SET name = ?, country_id = ?, country_code = ?, fips_code = ?, iso2 = ?, type = ?,
           latitude = ?, longitude = ?, flag = ?, wikiDataId = ?
       WHERE id = ?`,
      [
        name,
        country_id,
        country_code,
        fips_code || null,
        iso2 || null,
        type || null,
        latitude || null,
        longitude || null,
        flag === undefined ? 1 : flag,
        wikiDataId || null,
        id,
      ]
    );
    return result;
  } catch (error) {
    console.error('Error updating state:', error);
    throw error;
  }
};

export const deleteState = async (id) => {
  try {
    const [result] = await db.query(`DELETE FROM states WHERE id = ?`, [id]);
    return result;
  } catch (error) {
    console.error('Error deleting state:', error);
    throw error;
  }
};
