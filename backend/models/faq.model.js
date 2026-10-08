import pool  from '../config/db.js';


export const createFaqTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS faq (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        question_english TEXT NOT NULL,
        answer_english TEXT NOT NULL,
        question_Marathi TEXT NOT NULL,
        answer_Marathi TEXT NOT NULL,
        question_Hindi TEXT NOT NULL,
        answer_Hindi TEXT NOT NULL,
        type VARCHAR(100) DEFAULT 'General FAQs',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);

  const [columns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'question_english'`);
  if (columns.length === 0) {
    await pool.query(`ALTER TABLE faq ADD COLUMN question_english TEXT NOT NULL`);
  }

    const [answerEnglishColumns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'answer_english'`);
    if (answerEnglishColumns.length === 0) {
        await pool.query(`ALTER TABLE faq ADD COLUMN answer_english TEXT NOT NULL`);
    }

    const [questionMarathiColumns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'question_Marathi'`);
    if (questionMarathiColumns.length === 0) {
        await pool.query(`ALTER TABLE faq ADD COLUMN question_Marathi TEXT NOT NULL`);
    }

    const [answerMarathiColumns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'answer_Marathi'`);
    if (answerMarathiColumns.length === 0) {
        await pool.query(`ALTER TABLE faq ADD COLUMN answer_Marathi TEXT NOT NULL`);
    }

    const [questionHindiColumns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'question_Hindi'`);
    if (questionHindiColumns.length === 0) {
        await pool.query(`ALTER TABLE faq ADD COLUMN question_Hindi TEXT NOT NULL`);
    }

    const [answerHindiColumns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'answer_Hindi'`);
    if (answerHindiColumns.length === 0) {
        await pool.query(`ALTER TABLE faq ADD COLUMN answer_Hindi TEXT NOT NULL`);
    }

    const [statusColumns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'status'`);
    if (statusColumns.length === 0) {
        await pool.query(`ALTER TABLE faq ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'`);
    }

    const [typeColumns] = await pool.query(`SHOW COLUMNS FROM faq LIKE 'type'`);
    if (typeColumns.length === 0) {
        await pool.query(`ALTER TABLE faq ADD COLUMN type VARCHAR(100) DEFAULT 'General FAQs'`);
    }

};


export const insertFaq = async ({ question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type, status }) => {
    const sql = `
      INSERT INTO faq (question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type || 'General FAQs', status || 'active']);
    return result.insertId;
}


export const getAllFaqs = async () => {
    const sql = `
      SELECT * FROM faq
    `;
    const [rows] = await pool.query
(sql);
    return rows;
}

export const getFaqById = async (id) => {
    const sql = `
      SELECT * FROM faq WHERE id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
}

export const updateFaq = async (id, { question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type, status }) => {
    const sql = `
      UPDATE faq
        SET question_english = ?, answer_english = ?, question_Marathi = ?, answer_Marathi = ?, question_Hindi = ?, answer_Hindi = ?, type = ?, status = ?
    WHERE id = ?
    `;
    await pool.query(sql, [question_english, answer_english, question_Marathi, answer_Marathi, question_Hindi, answer_Hindi, type || 'General FAQs', status || 'active', id]);
}

export const deleteFaq = async (id) => {
    const sql = `
      DELETE FROM faq WHERE id = ?
    `;
    await pool.query(sql, [id]);
}










