import pool from '../config/db.js';

export const createJobsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS job_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      state VARCHAR(255) DEFAULT NULL,
      district VARCHAR(255) DEFAULT NULL,
      taluka VARCHAR(255) DEFAULT NULL,
      village VARCHAR(255) DEFAULT NULL,
      applying_for VARCHAR(100) NOT NULL,
      subject VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      cv_file VARCHAR(500) DEFAULT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);
};

export const insertJobApplication = async (application) => {
  const sql = `
    INSERT INTO job_applications
      (first_name, last_name, phone, email, state, district, taluka, village, applying_for, subject, description, cv_file)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    application.first_name,
    application.last_name,
    application.phone,
    application.email,
    application.state || null,
    application.district || null,
    application.taluka || null,
    application.village || null,
    application.applying_for,
    application.subject || null,
    application.description || null,
    application.cv_file || null,
  ];
  return pool.query(sql, values);
};

export const getAllJobApplications = async () => {
  const [rows] = await pool.query('SELECT * FROM job_applications ORDER BY created_at DESC');
  return rows;
};

export const getJobApplicationById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM job_applications WHERE id = ?', [id]);
  return rows[0] || null;
};

export const updateJobApplicationStatus = async (id, status) => {
  return pool.query('UPDATE job_applications SET status = ? WHERE id = ?', [status, id]);
};

export const deleteJobApplication = async (id) => {
  return pool.query('DELETE FROM job_applications WHERE id = ?', [id]);
};
