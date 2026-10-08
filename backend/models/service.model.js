import pool from '../config/db.js';

export const SERVICE_TYPES = ['Transport', 'machine', 'Labour', 'Guidance'];

export const createServicesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED DEFAULT NULL,
      service_type VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      price DECIMAL(10, 2) DEFAULT NULL,
      price_unit VARCHAR(50) DEFAULT NULL,
      contact_number VARCHAR(20) DEFAULT NULL,
      coverage_area VARCHAR(255) DEFAULT NULL,
      image_url VARCHAR(255) DEFAULT NULL,
      video_url VARCHAR(255) DEFAULT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);

  try {
    await pool.query('ALTER TABLE services ADD COLUMN video_url VARCHAR(255) DEFAULT NULL AFTER image_url');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'video_url' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
};

export const insertService = async (service) => {
  const sql = `
    INSERT INTO services
      (user_id, service_type, name, description, price, price_unit, contact_number, coverage_area, image_url, video_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
    service.user_id || null,
    service.service_type,
    service.name,
    service.description || null,
    service.price ?? null,
    service.price_unit || null,
    service.contact_number || null,
    service.coverage_area || null,
    service.image_url || null,
    service.video_url || null,
    service.status || 'Pending',
  ]);
  return result;
};

const SERVICE_WITH_USER_SELECT = `
  SELECT s.*,
    COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), '')) AS provider_name,
    u.phone AS provider_phone,
    u.document_status AS provider_document_status
  FROM services s
  LEFT JOIN users u ON s.user_id = u.id
`;

export const getAllServices = async () => {
  const [rows] = await pool.query(`${SERVICE_WITH_USER_SELECT} ORDER BY s.created_at DESC`);
  return rows;
};

export const getApprovedActiveServices = async () => {
  const [rows] = await pool.query(
    `${SERVICE_WITH_USER_SELECT} WHERE s.status = 'Approved' AND s.is_active = 1 ORDER BY s.created_at DESC`
  );
  return rows;
};

export const getServicesByUserId = async (userId) => {
  const [rows] = await pool.query(`${SERVICE_WITH_USER_SELECT} WHERE s.user_id = ? ORDER BY s.created_at DESC`, [userId]);
  return rows;
};

export const getServiceById = async (id) => {
  const [rows] = await pool.query(`${SERVICE_WITH_USER_SELECT} WHERE s.id = ?`, [id]);
  return rows[0] || null;
};

export const updateService = async (id, service) => {
  const sql = `
    UPDATE services
    SET service_type = ?, name = ?, description = ?, price = ?, price_unit = ?, contact_number = ?, coverage_area = ?, image_url = ?, video_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return pool.query(sql, [
    service.service_type,
    service.name,
    service.description || null,
    service.price ?? null,
    service.price_unit || null,
    service.contact_number || null,
    service.coverage_area || null,
    service.image_url || null,
    service.video_url || null,
    service.status || 'Pending',
    id,
  ]);
};

export const deleteService = async (id) => {
  return pool.query('DELETE FROM services WHERE id = ?', [id]);
};

export const updateServiceStatus = async (id, status) => {
  return pool.query('UPDATE services SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
};

export const updateServiceActive = async (id, isActive) => {
  return pool.query('UPDATE services SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [isActive ? 1 : 0, id]);
};
