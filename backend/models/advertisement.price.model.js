import pool from '../config/db.js';

export const createAdvertisementPriceTable = async () => {
	await pool.query(`CREATE TABLE IF NOT EXISTS advertisement_prices (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		ad_size_id BIGINT UNSIGNED NOT NULL,
		ad_duration_id BIGINT UNSIGNED NOT NULL,
		price DECIMAL(10, 2) NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'Active',
		created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

	const [indexes] = await pool.query("SHOW INDEX FROM advertisement_prices WHERE Key_name = 'uniq_size_duration'");
	if (indexes.length === 0) {
		const [duplicates] = await pool.query(
			'SELECT ad_size_id, ad_duration_id FROM advertisement_prices GROUP BY ad_size_id, ad_duration_id HAVING COUNT(*) > 1'
		);
		if (duplicates.length === 0) {
			await pool.query('ALTER TABLE advertisement_prices ADD UNIQUE KEY uniq_size_duration (ad_size_id, ad_duration_id)');
		}
	}
};

export const insertAdvertisementPrice = async ({ adSizeId, adDurationId, price, status }) => {
	const [result] = await pool.query(
		'INSERT INTO advertisement_prices (ad_size_id, ad_duration_id, price, status) VALUES (?, ?, ?, ?)',
		[adSizeId, adDurationId, price, status || 'Active']
	);
	return result.insertId;
};

export const getAllAdvertisementPrices = async () => {
	const [rows] = await pool.query(`
		SELECT prices.*, sizes.width, sizes.height, sizes.status AS size_status,
			durations.duration, durations.label, durations.status AS duration_status
		FROM advertisement_prices prices
		LEFT JOIN advertisement_sizes sizes ON sizes.id = prices.ad_size_id
		LEFT JOIN advertisement_durations durations ON durations.id = prices.ad_duration_id
		ORDER BY prices.id ASC
	`);
	return rows;
};

export const getAdvertisementPriceBySizeAndDuration = async (adSizeId, adDurationId) => {
	const [rows] = await pool.query(
		'SELECT * FROM advertisement_prices WHERE ad_size_id = ? AND ad_duration_id = ? AND status = \'Active\' LIMIT 1',
		[adSizeId, adDurationId]
	);
	return rows[0];
};

export const findDuplicateAdvertisementPrice = async (adSizeId, adDurationId, excludeId) => {
	const [rows] = await pool.query(
		'SELECT * FROM advertisement_prices WHERE ad_size_id = ? AND ad_duration_id = ? AND id != ? LIMIT 1',
		[adSizeId, adDurationId, excludeId || 0]
	);
	return rows[0];
};

export const getAdvertisementPriceById = async (id) => {
	const [rows] = await pool.query('SELECT * FROM advertisement_prices WHERE id = ?', [id]);
	return rows[0];
};

export const updateAdvertisementPrice = async (id, { adSizeId, adDurationId, price, status }) => {
	await pool.query(
		'UPDATE advertisement_prices SET ad_size_id = ?, ad_duration_id = ?, price = ?, status = ? WHERE id = ?',
		[adSizeId, adDurationId, price, status, id]
	);
};

export const deleteAdvertisementPrice = async (id) => {
	await pool.query('DELETE FROM advertisement_prices WHERE id = ?', [id]);
};
