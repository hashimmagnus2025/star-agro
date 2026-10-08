import pool from '../config/db.js';

export const createAdvertisementDurationTable = async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS advertisement_durations (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		duration INT UNSIGNED DEFAULT NULL,
		label VARCHAR(100) NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'Active',
		created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  
    const [durationColumns] = await pool.query(`SHOW COLUMNS FROM advertisement_durations LIKE 'duration'`);
    if (durationColumns.length > 0 && durationColumns[0].Null !== 'YES') {
        await pool.query('ALTER TABLE advertisement_durations MODIFY duration INT UNSIGNED DEFAULT NULL');
    }
};

export const insertAdvertisementDuration = async ({ duration, label, status }) => {
    const [result] = await pool.query(
        'INSERT INTO advertisement_durations (duration, label, status) VALUES (?, ?, ?)',
        [duration, label, status || 'Active']
    );
    return result.insertId;
};

export const getAllAdvertisementDurations = async () => {
    const [rows] = await pool.query('SELECT * FROM advertisement_durations ORDER BY id ASC');
    return rows;
};

export const getAdvertisementDurationById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM advertisement_durations WHERE id = ?', [id]);
    return rows[0];
};

export const updateAdvertisementDuration = async (id, { duration, label, status }) => {
    await pool.query(
        'UPDATE advertisement_durations SET duration = ?, label = ?, status = ? WHERE id = ?',
        [duration, label, status, id]
    );
};

export const deleteAdvertisementDuration = async (id) => {
    await pool.query('DELETE FROM advertisement_durations WHERE id = ?', [id]);
};

export const isAdvertisementDurationInUse = async (id) => {
    const [[{ adCount }]] = await pool.query('SELECT COUNT(*) AS adCount FROM advertisements WHERE ad_duration_id = ?', [id]);
    if (adCount > 0) return true;
    const [[{ priceCount }]] = await pool.query('SELECT COUNT(*) AS priceCount FROM advertisement_prices WHERE ad_duration_id = ?', [id]);
    return priceCount > 0;
};
