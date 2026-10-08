import pool from '../config/db.js';

export const createFaqCategoriesTable = async () => {
	await pool.query(`CREATE TABLE IF NOT EXISTS faq_categories (
		id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		faqcategoryname VARCHAR(255) NOT NULL,
		description TEXT DEFAULT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'Active',
		created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};

export const insertFaqCategory = async ({ faqcategoryname, description, status }) => {
	const [result] = await pool.query('INSERT INTO faq_categories (faqcategoryname, description, status) VALUES (?, ?, ?)', [faqcategoryname, description || null, status || 'Active']);
	return result.insertId;
};

export const getAllFaqCategories = async () => {
	const [rows] = await pool.query('SELECT * FROM faq_categories ORDER BY id ASC');
	return rows;
};

export const getFaqCategoryById = async (id) => {
	const [rows] = await pool.query('SELECT * FROM faq_categories WHERE id = ?', [id]);
	return rows[0];
};

export const updateFaqCategory = async (id, { faqcategoryname, description, status }) => {
	await pool.query('UPDATE faq_categories SET faqcategoryname = ?, description = ?, status = ? WHERE id = ?', [faqcategoryname, description || null, status, id]);
};

export const deleteFaqCategory = async (id) => {
	await pool.query('DELETE FROM faq_categories WHERE id = ?', [id]);
};
