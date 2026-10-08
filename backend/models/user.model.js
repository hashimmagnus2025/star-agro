import pool from '../config/db.js';

export const getDefaultUserPoints = () => {
  const parsed = Number.parseInt(process.env.POINTS || '20', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
};

export const generateUniqueReferralCode = async () => {
  let referralCode = '';
  let isDuplicate = true;

  while (isDuplicate) {
    referralCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    const [rows] = await pool.query('SELECT id FROM users WHERE referral_code = ? LIMIT 1', [referralCode]);
    isDuplicate = rows.length > 0;
  }

  return referralCode;
};

export const backfillMissingReferralCodes = async () => {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE deleted_at IS NULL AND (referral_code IS NULL OR TRIM(referral_code) = "")'
  );

  if (!rows.length) {
    return 0;
  }

  for (const row of rows) {
    const referralCode = await generateUniqueReferralCode();
    await pool.query(
      'UPDATE users SET referral_code = ? WHERE id = ? AND (referral_code IS NULL OR TRIM(referral_code) = "")',
      [referralCode, row.id]
    );
  }

  return rows.length;
};



export const createUserTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      profile_image VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(255),
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      gender VARCHAR(50) DEFAULT NULL,
      date_of_birth DATE DEFAULT NULL,
      state VARCHAR(255) DEFAULT NULL,
      district VARCHAR(255) DEFAULT NULL,
      taluka VARCHAR(255) DEFAULT NULL,
      village VARCHAR(255) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      document_file VARCHAR(255) DEFAULT NULL,
      points INT UNSIGNED NOT NULL DEFAULT 20,
      fcm_token VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      INDEX email_index (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);

  try {
    await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user' AFTER password");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'role' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
  try {
    await pool.query("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) AFTER last_name");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'profile_image' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }

  const columnsToAdd = [
    ["gender", "VARCHAR(50) DEFAULT NULL"],
    ["date_of_birth", "DATE DEFAULT NULL"],
    ["state", "VARCHAR(255) DEFAULT NULL"],
    ["district", "VARCHAR(255) DEFAULT NULL"],
    ["taluka", "VARCHAR(255) DEFAULT NULL"],
    ["village", "VARCHAR(255) DEFAULT NULL"],
    ["address", "TEXT DEFAULT NULL"],
    ["document_file", "VARCHAR(255) DEFAULT NULL"],
    ["document_status", "VARCHAR(20) DEFAULT 'Pending'"],
    ["referral_code", "VARCHAR(50) DEFAULT NULL"],
    ["points", "INT UNSIGNED NOT NULL DEFAULT 20"],
    ["has_solar_dryer", "VARCHAR(10) DEFAULT NULL"],
    ["interested_in_solar_dryer", "VARCHAR(10) DEFAULT NULL"],
    ["how_know_about_us", "VARCHAR(50) DEFAULT NULL"],
    ["language", "VARCHAR(10) DEFAULT 'en'"],
    ["latitude", "DECIMAL(10, 7) DEFAULT NULL"],
    ["longitude", "DECIMAL(10, 7) DEFAULT NULL"],

  ];

  for (const [columnName, definition] of columnsToAdd) {
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`);
    } catch (alterError) {
      if (!/Duplicate column name|Column '.*' already exists/i.test(alterError.message)) {
        throw alterError;
      }
    }
  }

  await pool.query(
    'UPDATE users SET points = ? WHERE points IS NULL',
    [getDefaultUserPoints()]
  );
  await backfillMissingReferralCodes();
};

export const insertUser = async (user) => {
  const referralCode = user.referral_code && String(user.referral_code).trim()
    ? user.referral_code
    : await generateUniqueReferralCode();
  const points = user.points !== undefined ? user.points : getDefaultUserPoints();

  const sql = `
    INSERT INTO users (
      name, first_name, last_name, email, phone, password, profile_image,
      gender, date_of_birth, state, district, taluka, village, address,
      latitude, longitude, has_solar_dryer, interested_in_solar_dryer, how_know_about_us,
      document_file, referral_code, points
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    user.name,
    user.first_name,
    user.last_name,
    user.email,
    user.phone,
    user.password || null,
    user.profile_image,
    user.gender || null,
    user.date_of_birth || null,
    user.state || null,
    user.district || null,
    user.taluka || null,
    user.village || null,
    user.address || null,
    user.latitude ?? null,
    user.longitude ?? null,
    user.has_solar_dryer || null,
    user.interested_in_solar_dryer || null,
    user.how_know_about_us || null,
    user.document_file || null,
    referralCode,
    points,
  ];

  return pool.query(sql, values);
};

export const getUserById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
  return rows[0] || null;
};

export const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
  return rows[0] || null;
};

export const getUserByPhone = async (phone) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL', [phone]);
  return rows[0] || null;
};

export const getUserByReferralCode = async (referralCode) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE referral_code = ? AND deleted_at IS NULL LIMIT 1', [referralCode]);
  return rows[0] || null;
};

export const addUserPoints = async (id, pointsToAdd) => {
  const user = await getUserById(id);
  if (!user) return null;

  const nextPoints = Number(user.points || 0) + Number(pointsToAdd || 0);
  await pool.query('UPDATE users SET points = ? WHERE id = ?', [nextPoints, id]);
  return nextPoints;
};

export const updateUser = async (id, user) => {
  const existingUser = await getUserById(id);
  const referralCode = user.referral_code !== undefined
    ? user.referral_code
    : existingUser?.referral_code ?? null;
  const points = user.points !== undefined
    ? user.points
    : existingUser?.points ?? getDefaultUserPoints();

  const role = user.role !== undefined ? user.role : existingUser?.role ?? 'user';
  const hasSolarDryer = user.has_solar_dryer !== undefined ? user.has_solar_dryer : existingUser?.has_solar_dryer ?? null;
  const interestedInSolarDryer = user.interested_in_solar_dryer !== undefined
    ? user.interested_in_solar_dryer
    : existingUser?.interested_in_solar_dryer ?? null;
  const howKnowAboutUs = user.how_know_about_us !== undefined
    ? user.how_know_about_us
    : existingUser?.how_know_about_us ?? null;
  const language = user.language !== undefined ? user.language : existingUser?.language ?? 'en';
  const documentStatus = user.document_status !== undefined
    ? user.document_status
    : existingUser?.document_status ?? 'Pending';
  const latitude = user.latitude !== undefined ? user.latitude : existingUser?.latitude ?? null;
  const longitude = user.longitude !== undefined ? user.longitude : existingUser?.longitude ?? null;

  const sql = `
    UPDATE users SET
      name = ?, first_name = ?, last_name = ?, email = ?, phone = ?, password = ?, profile_image = ?,
      gender = ?, date_of_birth = ?, state = ?, district = ?, taluka = ?, village = ?, address = ?,
      document_file = ?, document_status = ?, referral_code = ?, points = ?, role = ?, has_solar_dryer = ?, interested_in_solar_dryer = ?,
      how_know_about_us = ?, language = ?, latitude = ?, longitude = ?
    WHERE id = ?
  `;

  const values = [
    user.name,
    user.first_name,
    user.last_name,
    user.email,
    user.phone,
    user.password,
    user.profile_image,
    user.gender ?? null,
    user.date_of_birth ?? null,
    user.state ?? null,
    user.district ?? null,
    user.taluka ?? null,
    user.village ?? null,
    user.address ?? null,
    user.document_file ?? null,
    documentStatus,
    referralCode,
    points,
    role,
    hasSolarDryer,
    interestedInSolarDryer,
    howKnowAboutUs,
    language,
    latitude,
    longitude,
    id,
  ];

  return pool.query(sql, values);
};

export const updateUserDocumentStatus = async (id, status) => {
  return pool.query('UPDATE users SET document_status = ? WHERE id = ?', [status, id]);
};

export const softDeleteUser = async (id) => {
  return pool.query('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
};

export const getAllUsers = async () => {
  const [rows] = await pool.query(`
    SELECT
      id, name, first_name, last_name, email, phone, role, gender, date_of_birth,
      state, district, taluka, village, address, profile_image, document_file,
      document_status, referral_code, points, has_solar_dryer,
      interested_in_solar_dryer, how_know_about_us, language, latitude, longitude,
      created_at, updated_at
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `);
  return rows;
};

export const getUsersByRole = async (roleNames) => {
  const roles = Array.isArray(roleNames) ? roleNames : [roleNames];
  if (!roles.length) return [];
  const placeholders = roles.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, name, first_name, last_name, email, phone, role, fcm_token, language, latitude, longitude FROM users WHERE role IN (${placeholders}) AND deleted_at IS NULL`,
    roles
  );
  return rows;
};
