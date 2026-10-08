import db from '../config/db.js';

export const createCitiesTable = async () => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS cities (
        id MEDIUMINT(8) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        state_id MEDIUMINT(8) UNSIGNED NOT NULL,
        state_code VARCHAR(255) NOT NULL,
        country_id MEDIUMINT(8) UNSIGNED NOT NULL,
        country_code CHAR(2) NOT NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT '2014-01-01 01:01:01',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        flag TINYINT(1) NOT NULL DEFAULT 1,
        wikiDataId VARCHAR(255) DEFAULT NULL,
        INDEX idx_state_id (state_id),
        INDEX idx_country_id (country_id)
      )`
    );
  } catch (error) {
    console.error('❌ Error creating cities table:', error.message);
  }
};

export const getAllCities = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, state_id, state_code, country_id, country_code,
              latitude, longitude, flag, wikiDataId, created_at, updated_at
       FROM cities
       ORDER BY name ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

export const getCitiesByState = async (stateId) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, state_id, state_code, country_id, country_code,
              latitude, longitude, flag, wikiDataId, created_at, updated_at
       FROM cities
       WHERE state_id = ?
       ORDER BY name ASC`,
      [stateId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching cities by state:', error);
    throw error;
  }
};

export const getCitiesByCountry = async (countryId) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, state_id, state_code, country_id, country_code,
              latitude, longitude, flag, wikiDataId, created_at, updated_at
       FROM cities
       WHERE country_id = ?
       ORDER BY name ASC`,
      [countryId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching cities by country:', error);
    throw error;
  }
};

export const getCityById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, state_id, state_code, country_id, country_code,
              latitude, longitude, flag, wikiDataId, created_at, updated_at
       FROM cities
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching city:', error);
    throw error;
  }
};

export const createCity = async ({
  name,
  state_id,
  state_code,
  country_id,
  country_code,
  latitude,
  longitude,
  flag,
  wikiDataId,
}) => {
  try {
    const [result] = await db.query(
      `INSERT INTO cities (name, state_id, state_code, country_id, country_code, latitude, longitude, flag, wikiDataId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        state_id,
        state_code,
        country_id,
        country_code,
        latitude,
        longitude,
        flag === undefined ? 1 : flag,
        wikiDataId || null,
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating city:', error);
    throw error;
  }
};

export const updateCity = async (id, {
  name,
  state_id,
  state_code,
  country_id,
  country_code,
  latitude,
  longitude,
  flag,
  wikiDataId,
}) => {
  try {
    const [result] = await db.query(
      `UPDATE cities
       SET name = ?, state_id = ?, state_code = ?, country_id = ?, country_code = ?,
           latitude = ?, longitude = ?, flag = ?, wikiDataId = ?
       WHERE id = ?`,
      [
        name,
        state_id,
        state_code,
        country_id,
        country_code,
        latitude,
        longitude,
        flag === undefined ? 1 : flag,
        wikiDataId || null,
        id,
      ]
    );
    return result;
  } catch (error) {
    console.error('Error updating city:', error);
    throw error;
  }
};

export const deleteCity = async (id) => {
  try {
    const [result] = await db.query(`DELETE FROM cities WHERE id = ?`, [id]);
    return result;
  } catch (error) {
    console.error('Error deleting city:', error);
    throw error;
  }
};
