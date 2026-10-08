import pool from '../config/db.js';

export const createGeneralSettingsTable = async () => {
  const [rows] = await pool.query(`
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'general_settings'
  `);

  if (rows[0]?.count === 0) {
    await pool.query(`
      CREATE TABLE general_settings (
        id INT PRIMARY KEY DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) DEFAULT NULL,
        company_email VARCHAR(255) NOT NULL,
        company_phone VARCHAR(255) NOT NULL,
        address TEXT DEFAULT NULL,
        company_address TEXT DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        gst VARCHAR(50) DEFAULT NULL,
        description TEXT NOT NULL,
        logo VARCHAR(500) DEFAULT NULL,
        favicon VARCHAR(500) DEFAULT NULL,
        whatsapp_api_url VARCHAR(500) DEFAULT NULL,
        whatsapp_api_key VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO general_settings (id, name, company_name, company_email, company_phone, description)
      VALUES (1, 'Star Agro', 'Star Agro', 'contact@staragro.com', '+91 00000 00000', 'Default site description')
    `);
  } else {
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'general_settings'
    `);

    const existingColumns = columns.map((col) => col.COLUMN_NAME);

    const renameIfExists = async (from, to, definition) => {
      if (existingColumns.includes(from) && !existingColumns.includes(to)) {
        await pool.query(`ALTER TABLE general_settings CHANGE COLUMN ${from} ${to} ${definition}`);
        existingColumns.push(to);
      }
    };

    await renameIfExists('site_name', 'name', 'VARCHAR(255) NOT NULL');
    await renameIfExists('site_description', 'description', 'TEXT NOT NULL');
    await renameIfExists('contact_email', 'company_email', 'VARCHAR(255) NOT NULL');
    await renameIfExists('contact_phone', 'company_phone', 'VARCHAR(255) NOT NULL');
    await renameIfExists('company_logo', 'logo', 'VARCHAR(500) DEFAULT NULL');

    const addIfMissing = async (column, definition) => {
      if (!existingColumns.includes(column)) {
        await pool.query(`ALTER TABLE general_settings ADD COLUMN ${column} ${definition}`);
        existingColumns.push(column);
      }
    };

    await addIfMissing('company_name', 'VARCHAR(255) DEFAULT NULL');
    await addIfMissing('address', 'TEXT DEFAULT NULL');
    await addIfMissing('company_address', 'TEXT DEFAULT NULL');
    await addIfMissing('location', 'VARCHAR(255) DEFAULT NULL');
    await addIfMissing('gst', 'VARCHAR(50) DEFAULT NULL');
    await addIfMissing('favicon', 'VARCHAR(500) DEFAULT NULL');
    await addIfMissing('whatsapp_api_url', 'VARCHAR(500) DEFAULT NULL');
    await addIfMissing('whatsapp_api_key', 'VARCHAR(500) DEFAULT NULL');
  }
};

export const getGeneralSettingsModel = async () => {
  const [rows] = await pool.query('SELECT * FROM general_settings');
  return rows;
};

export const updateGeneralSettingsModel = async (data) => {
  const {
    name,
    company_name,
    company_email,
    company_phone,
    address,
    company_address,
    location,
    gst,
    description,
    logo,
    favicon,
    whatsapp_api_url,
    whatsapp_api_key,
  } = data;

  const [result] = await pool.query(
    `UPDATE general_settings
     SET
       name = ?,
       company_name = ?,
       company_email = ?,
       company_phone = ?,
       address = ?,
       company_address = ?,
       location = ?,
       gst = ?,
       description = ?,
       logo = ?,
       favicon = ?,
       whatsapp_api_url = ?,
       whatsapp_api_key = ?
     WHERE id = 1`,
    [
      name,
      company_name,
      company_email,
      company_phone,
      address,
      company_address,
      location,
      gst,
      description,
      logo,
      favicon,
      whatsapp_api_url,
      whatsapp_api_key,
    ]
  );

  return result;
};
