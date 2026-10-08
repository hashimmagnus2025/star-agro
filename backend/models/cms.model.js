import pool from '../config/db.js';

export const createCmsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS cms_content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page VARCHAR(100) NOT NULL,
      section VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) DEFAULT NULL,
      subtitle VARCHAR(255) DEFAULT NULL,
      content TEXT,
      image_url TEXT,
      button_text VARCHAR(100) DEFAULT NULL,  
      button_link VARCHAR(255) DEFAULT NULL,
      order_index INT DEFAULT 0,
      text_1 TEXT DEFAULT NULL,
      text_2 TEXT DEFAULT NULL,
      text_3 TEXT DEFAULT NULL,
      text_4 TEXT DEFAULT NULL,
      text_5 TEXT DEFAULT NULL,
      text_6 TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);

  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM cms_content');
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('text_1')) {
      await pool.query('ALTER TABLE cms_content ADD COLUMN text_1 TEXT DEFAULT NULL AFTER order_index');
      console.log('Added text_1 column to cms_content table');
    }
    if (!columnNames.includes('text_2')) {
      await pool.query('ALTER TABLE cms_content ADD COLUMN text_2 TEXT DEFAULT NULL AFTER text_1');
      console.log('Added text_2 column to cms_content table');
    }
    if (!columnNames.includes('text_3')) {
      await pool.query('ALTER TABLE cms_content ADD COLUMN text_3 TEXT DEFAULT NULL AFTER text_2');
      console.log('Added text_3 column to cms_content table');
    }
    if (!columnNames.includes('text_4')) {
      await pool.query('ALTER TABLE cms_content ADD COLUMN text_4 TEXT DEFAULT NULL AFTER text_3');
      console.log('Added text_4 column to cms_content table');
    }
    if (!columnNames.includes('text_5')) {
      await pool.query('ALTER TABLE cms_content ADD COLUMN text_5 TEXT DEFAULT NULL AFTER text_4');
      console.log('Added text_5 column to cms_content table');
    }
    if (!columnNames.includes('text_6')) {
      await pool.query('ALTER TABLE cms_content ADD COLUMN text_6 TEXT DEFAULT NULL AFTER text_5');
      console.log('Added text_6 column to cms_content table');
    }
  } catch (err) {
    console.error('Error altering cms_content table:', err);
  }
};

export const insertCmsContent = async (content) => {
  const sql = `
    INSERT INTO cms_content (
      page, section, type,language, title, subtitle, content, image_url, button_text, button_link, order_index, text_1, text_2, text_3, text_4, text_5, text_6
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    content.page,
    content.section,
    content.type,
    content.language,
    content.title,
    content.subtitle,
    content.content,
    content.image_url,
    content.button_text,
    content.button_link,
    content.order_index || 0,
    content.text_1 || null,
    content.text_2 || null,
    content.text_3 || null,
    content.text_4 || null,
    content.text_5 || null,
    content.text_6 || null,
  ];
  return pool.query(sql, values);
};

export const getCmsContentById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM cms_content WHERE id = ? AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

export const getAllCmsContent = async () => {
  const [rows] = await pool.query('SELECT * FROM cms_content WHERE deleted_at IS NULL ORDER BY page, order_index, id');
  return rows;
};

export const getCmsContentByPage = async (
  page,
  language = 'en'
) => {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM cms_content
      WHERE page = ?
      AND language = ?
      AND deleted_at IS NULL
      ORDER BY order_index,id
    `,
    [page, language]
  );

  return rows;
};

export const updateCmsContent = async (id, content) => {
  const sql = `
    UPDATE cms_content SET
      page = ?,
      section = ?,
      type = ?,
      title = ?,
      subtitle = ?,
      content = ?,
      image_url = ?,
      button_text = ?,
      button_link = ?,
      order_index = ?,
      text_1 = ?,
      text_2 = ?,
      text_3 = ?,
      text_4 = ?,
      text_5 = ?,
      text_6 = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `;
  const values = [
    content.page,
    content.section,
    content.type,
    content.title,
    content.subtitle,
    content.content,
    content.image_url,
    content.button_text,
    content.button_link,
    content.order_index || 0,
    content.text_1 || null,
    content.text_2 || null,
    content.text_3 || null,
    content.text_4 || null,
    content.text_5 || null,
    content.text_6 || null,
    id,
  ];
  return pool.query(sql, values);
};

export const deleteCmsContent = async (id) => {
  const sql = 'UPDATE cms_content SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL';
  return pool.query(sql, [id]);
};
