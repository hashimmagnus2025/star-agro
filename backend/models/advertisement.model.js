import pool from '../config/db.js';

export const createAdvertisementTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS advertisements (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      startdate DATE DEFAULT NULL,
      enddate DATE DEFAULT NULL,
      description TEXT DEFAULT NULL,
      image VARCHAR(255) DEFAULT NULL,
      type VARCHAR(20) DEFAULT 'image',
      image_size VARCHAR(50) DEFAULT NULL,
      keywords TEXT DEFAULT NULL,
      duration VARCHAR(50) DEFAULT NULL,
      price DECIMAL(10,2) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Active',
      tags TEXT DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);

  const [columns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'startdate'`);
  if (columns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN startdate DATE DEFAULT NULL`);
  }

  const [endDateColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'enddate'`);
  if (endDateColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN enddate DATE DEFAULT NULL`);
  }

  const [tagsColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'tags'`);
  if (tagsColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN tags TEXT DEFAULT NULL`);
  }

  const [durationColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'duration'`);
  if (durationColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN duration VARCHAR(50) DEFAULT NULL`);
  }

  const [priceColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'price'`);
  if (priceColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN price DECIMAL(10,2) DEFAULT NULL`);
  }

  const [pageColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'page'`);
  if (pageColumns.length > 0) {
    await pool.query(`ALTER TABLE advertisements DROP COLUMN page`);
  }

  const [statusColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'status'`);
  if (statusColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN status VARCHAR(50) DEFAULT 'Active'`);
  }

  const [adSizeIdColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'ad_size_id'`);
  if (adSizeIdColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN ad_size_id BIGINT UNSIGNED DEFAULT NULL`);
  }

  const [adDurationIdColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'ad_duration_id'`);
  if (adDurationIdColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN ad_duration_id BIGINT UNSIGNED DEFAULT NULL`);
  }

  const [typeColumns] = await pool.query(`SHOW COLUMNS FROM advertisements LIKE 'type'`);
  if (typeColumns.length === 0) {
    await pool.query(`ALTER TABLE advertisements ADD COLUMN type VARCHAR(20) DEFAULT 'image'`);
  }
};

const SELECT_WITH_JOINS = `
  SELECT advertisements.*,
    sizes.width AS size_width, sizes.height AS size_height, sizes.type AS size_type,
    durations.duration AS duration_value, durations.label AS duration_label
  FROM advertisements
  LEFT JOIN advertisement_sizes sizes ON sizes.id = advertisements.ad_size_id
  LEFT JOIN advertisement_durations durations ON durations.id = advertisements.ad_duration_id
`;

export const insertAdvertisement = async ({ title, description, image, type, image_size, keywords, duration, price, status, startdate, enddate, tags, adSizeId, adDurationId }) => {
    const sql = `
      INSERT INTO advertisements (title, description, image, type, image_size, keywords, duration, price, status, startdate, enddate, tags, ad_size_id, ad_duration_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [title, description, image, type || 'image', image_size, keywords, duration, price, status || 'Active', startdate, enddate, tags, adSizeId || null, adDurationId || null]);
    return result.insertId;
}

export const getAllAdvertisements = async () => {
    const [rows] = await pool.query(SELECT_WITH_JOINS);
    return rows;
}

export const getActiveAdvertisements = async () => {
    const sql = `
      ${SELECT_WITH_JOINS}
      WHERE advertisements.status = 'Active'
        AND (advertisements.startdate IS NULL OR advertisements.startdate <= CURDATE())
        AND (advertisements.enddate IS NULL OR advertisements.enddate >= CURDATE())
    `;
    const [rows] = await pool.query(sql);
    return rows;
}

export const getAdvertisementById = async (id) => {
    const sql = `${SELECT_WITH_JOINS} WHERE advertisements.id = ?`;
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
}
export const updateAdvertisement = async (id, { title, description, image, type, image_size, keywords, duration, price, status, startdate, enddate, tags, adSizeId, adDurationId }) => {
    const sql = `
      UPDATE advertisements
        SET title = ?, description = ?, image = ?, type = ?, image_size = ?, keywords = ?, duration = ?, price = ?, status = ?, startdate = ?, enddate = ?, tags = ?, ad_size_id = ?, ad_duration_id = ?
    WHERE id = ?
    `;
    await pool.query(sql, [title, description, image, type || 'image', image_size, keywords, duration, price, status || 'Active', startdate, enddate, tags, adSizeId || null, adDurationId || null, id]);
}

export const deleteAdvertisement = async (id) => {
    const sql = `
      DELETE FROM advertisements WHERE id = ?
    `;
    await pool.query(sql, [id]);
}










