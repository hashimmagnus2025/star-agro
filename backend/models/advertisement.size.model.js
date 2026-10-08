import pool from '../config/db.js';

export const createAdvertisementSizeTable = async () => {
	await pool.query(`CREATE TABLE IF NOT EXISTS advertisement_sizes (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		width INT UNSIGNED NOT NULL,
		height INT UNSIGNED NOT NULL,
		type VARCHAR(20) NOT NULL DEFAULT 'Horizontal',
		status VARCHAR(20) NOT NULL DEFAULT 'Active',
		created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

	const [columns] = await pool.query("SHOW COLUMNS FROM advertisement_sizes LIKE 'type'");
	if (columns.length === 0) {
		await pool.query("ALTER TABLE advertisement_sizes ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'Horizontal' AFTER height");
		await pool.query("UPDATE advertisement_sizes SET type = IF(width < height, 'Vertical', 'Horizontal')");
	}
};

export const insertAdvertisementSize = async ({ width, height, type, status }) => {
	const [result] = await pool.query('INSERT INTO advertisement_sizes (width, height, type, status) VALUES (?, ?, ?, ?)', [width, height, type || 'Horizontal', status || 'Active']);
	return result.insertId;
};

export const getAllAdvertisementSizes = async () => {
	const [rows] = await pool.query('SELECT * FROM advertisement_sizes ORDER BY id ASC');
	return rows;
};

export const getAdvertisementSizeById = async (id) => {
	const [rows] = await pool.query('SELECT * FROM advertisement_sizes WHERE id = ?', [id]);
	return rows[0];
};

export const updateAdvertisementSize = async (id, { width, height, type, status }) => {
	await pool.query('UPDATE advertisement_sizes SET width = ?, height = ?, type = ?, status = ? WHERE id = ?', [width, height, type, status, id]);
};

export const deleteAdvertisementSize = async (id) => {
	await pool.query('DELETE FROM advertisement_sizes WHERE id = ?', [id]);
};

export const isAdvertisementSizeInUse = async (id) => {
	const [[{ adCount }]] = await pool.query('SELECT COUNT(*) AS adCount FROM advertisements WHERE ad_size_id = ?', [id]);
	if (adCount > 0) return true;
	const [[{ priceCount }]] = await pool.query('SELECT COUNT(*) AS priceCount FROM advertisement_prices WHERE ad_size_id = ?', [id]);
	return priceCount > 0;
};
