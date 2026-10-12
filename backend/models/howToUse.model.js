import pool from '../config/db.js';

export const createHowToUseTable = async () => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS how_to_use (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT DEFAULT NULL,
			video_url VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`);
};

export const insertHowToUse = async ({ title, description, video_url }) => {
	const [result] = await pool.query(
		'INSERT INTO how_to_use (title, description, video_url) VALUES (?, ?, ?)',
		[title, description || null, video_url]
	);
	return result.insertId;
};

export const getAllHowToUse = async () => {
	const [rows] = await pool.query('SELECT * FROM how_to_use ORDER BY created_at ASC, id ASC');
	return rows;
};

export const getHowToUseById = async (id) => {
	const [rows] = await pool.query('SELECT * FROM how_to_use WHERE id = ?', [id]);
	return rows[0];
};

export const updateHowToUse = async (id, { title, description, video_url }) => {
	const [result] = await pool.query(
		'UPDATE how_to_use SET title = ?, description = ?, video_url = ? WHERE id = ?',
		[title, description || null, video_url, id]
	);
	return result.affectedRows > 0;
};

export const deleteHowToUse = async (id) => {
	const [result] = await pool.query('DELETE FROM how_to_use WHERE id = ?', [id]);
	return result.affectedRows > 0;
};
