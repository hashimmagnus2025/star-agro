import db from '../config/db.js';

export const createCountriesTable = async () => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS countries (
        id MEDIUMINT(8) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        iso3 CHAR(3) DEFAULT NULL,
        numeric_code CHAR(3) DEFAULT NULL,
        iso2 CHAR(2) DEFAULT NULL,
        phonecode VARCHAR(255) DEFAULT NULL,
        capital VARCHAR(255) DEFAULT NULL,
        currency VARCHAR(255) DEFAULT NULL,
        currency_name VARCHAR(255) DEFAULT NULL,
        currency_symbol VARCHAR(255) DEFAULT NULL,
        tld VARCHAR(255) DEFAULT NULL,
        native VARCHAR(255) DEFAULT NULL,
        region VARCHAR(255) DEFAULT NULL,
        region_id MEDIUMINT(8) UNSIGNED DEFAULT NULL,
        subregion VARCHAR(255) DEFAULT NULL,
        subregion_id MEDIUMINT(8) UNSIGNED DEFAULT NULL,
        nationality VARCHAR(255) DEFAULT NULL,
        timezones TEXT DEFAULT NULL,
        translations TEXT DEFAULT NULL,
        latitude DECIMAL(10,8) DEFAULT NULL,
        longitude DECIMAL(11,8) DEFAULT NULL,
        emoji VARCHAR(191) DEFAULT NULL,
        emojiU VARCHAR(191) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        flag TINYINT(1) NOT NULL DEFAULT 1,
        wikiDataId VARCHAR(255) DEFAULT NULL
      )`
    );
  } catch (error) {
    console.error('❌ Error creating countries table:', error.message);
  }
};

const COUNTRY_COLUMNS = `id, name, iso3, numeric_code, iso2, phonecode, capital, currency,
       currency_name, currency_symbol, tld, native, region, region_id, subregion,
       subregion_id, nationality, timezones, translations, latitude, longitude,
       emoji, emojiU, flag, wikiDataId, created_at, updated_at`;

export const getAllCountries = async () => {
  try {
    const [rows] = await db.query(
      `SELECT ${COUNTRY_COLUMNS} FROM countries ORDER BY name ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

export const getCountryById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT ${COUNTRY_COLUMNS} FROM countries WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching country:', error);
    throw error;
  }
};

export const createCountry = async ({
  name,
  iso3,
  numeric_code,
  iso2,
  phonecode,
  capital,
  currency,
  currency_name,
  currency_symbol,
  tld,
  native: nativeName,
  region,
  region_id,
  subregion,
  subregion_id,
  nationality,
  timezones,
  translations,
  latitude,
  longitude,
  emoji,
  emojiU,
  flag,
  wikiDataId,
}) => {
  try {
    const [result] = await db.query(
      `INSERT INTO countries (
        name, iso3, numeric_code, iso2, phonecode, capital, currency, currency_name,
        currency_symbol, tld, native, region, region_id, subregion, subregion_id,
        nationality, timezones, translations, latitude, longitude, emoji, emojiU,
        flag, wikiDataId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        iso3 || null,
        numeric_code || null,
        iso2 || null,
        phonecode || null,
        capital || null,
        currency || null,
        currency_name || null,
        currency_symbol || null,
        tld || null,
        nativeName || null,
        region || null,
        region_id || null,
        subregion || null,
        subregion_id || null,
        nationality || null,
        timezones || null,
        translations || null,
        latitude || null,
        longitude || null,
        emoji || null,
        emojiU || null,
        flag === undefined ? 1 : flag,
        wikiDataId || null,
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating country:', error);
    throw error;
  }
};

export const updateCountry = async (id, {
  name,
  iso3,
  numeric_code,
  iso2,
  phonecode,
  capital,
  currency,
  currency_name,
  currency_symbol,
  tld,
  native: nativeName,
  region,
  region_id,
  subregion,
  subregion_id,
  nationality,
  timezones,
  translations,
  latitude,
  longitude,
  emoji,
  emojiU,
  flag,
  wikiDataId,
}) => {
  try {
    const [result] = await db.query(
      `UPDATE countries
       SET name = ?, iso3 = ?, numeric_code = ?, iso2 = ?, phonecode = ?, capital = ?,
           currency = ?, currency_name = ?, currency_symbol = ?, tld = ?, native = ?,
           region = ?, region_id = ?, subregion = ?, subregion_id = ?, nationality = ?,
           timezones = ?, translations = ?, latitude = ?, longitude = ?, emoji = ?,
           emojiU = ?, flag = ?, wikiDataId = ?
       WHERE id = ?`,
      [
        name,
        iso3 || null,
        numeric_code || null,
        iso2 || null,
        phonecode || null,
        capital || null,
        currency || null,
        currency_name || null,
        currency_symbol || null,
        tld || null,
        nativeName || null,
        region || null,
        region_id || null,
        subregion || null,
        subregion_id || null,
        nationality || null,
        timezones || null,
        translations || null,
        latitude || null,
        longitude || null,
        emoji || null,
        emojiU || null,
        flag === undefined ? 1 : flag,
        wikiDataId || null,
        id,
      ]
    );
    return result;
  } catch (error) {
    console.error('Error updating country:', error);
    throw error;
  }
};

export const deleteCountry = async (id) => {
  try {
    const [result] = await db.query(`DELETE FROM countries WHERE id = ?`, [id]);
    return result;
  } catch (error) {
    console.error('Error deleting country:', error);
    throw error;
  }
};
