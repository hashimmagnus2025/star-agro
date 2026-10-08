import pool from '../config/db.js';

export const createJurisdictionTable = async () => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS user_jurisdictions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL UNIQUE,
        role_name VARCHAR(100) NOT NULL,
        scope_type ENUM('district','taluka','village') NOT NULL,
        scope_id INT NOT NULL,
        assigned_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_scope (scope_type, scope_id)
      )`
    );
  } catch (error) {
    console.error('❌ Error creating user_jurisdictions table:', error.message);
  }
};

export const upsertJurisdiction = async ({ user_id, role_name, scope_type, scope_id, assigned_by }) => {
  const sql = `
    INSERT INTO user_jurisdictions (user_id, role_name, scope_type, scope_id, assigned_by)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE role_name = ?, scope_type = ?, scope_id = ?, assigned_by = ?
  `;
  return pool.query(sql, [
    user_id, role_name, scope_type, scope_id, assigned_by || null,
    role_name, scope_type, scope_id, assigned_by || null,
  ]);
};

export const getJurisdictionByUserId = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM user_jurisdictions WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

export const getAllJurisdictions = async () => {
  const [rows] = await pool.query('SELECT * FROM user_jurisdictions');
  return rows;
};

export const deleteJurisdictionByUserId = async (userId) => {
  return pool.query('DELETE FROM user_jurisdictions WHERE user_id = ?', [userId]);
};

// Resolves a scope (district/taluka/village id) up the hierarchy to its full name chain,
// so a rep's text-based location (district/taluka/village columns on `users`) can be matched.
export const resolveScopeNames = async ({ scope_type, scope_id }) => {
  if (scope_type === 'village') {
    const [rows] = await pool.query(
      `SELECT v.village_name, t.taluka_name, d.district_name
       FROM villages v
       JOIN talukas t ON t.id = v.taluka_id
       JOIN districts d ON d.id = t.district_id
       WHERE v.id = ?`,
      [scope_id]
    );
    const row = rows[0];
    return row
      ? { village_name: row.village_name, taluka_name: row.taluka_name, district_name: row.district_name }
      : { village_name: null, taluka_name: null, district_name: null };
  }

  if (scope_type === 'taluka') {
    const [rows] = await pool.query(
      `SELECT t.taluka_name, d.district_name
       FROM talukas t
       JOIN districts d ON d.id = t.district_id
       WHERE t.id = ?`,
      [scope_id]
    );
    const row = rows[0];
    return row
      ? { village_name: null, taluka_name: row.taluka_name, district_name: row.district_name }
      : { village_name: null, taluka_name: null, district_name: null };
  }

  if (scope_type === 'district') {
    const [rows] = await pool.query('SELECT district_name FROM districts WHERE id = ?', [scope_id]);
    const row = rows[0];
    return { village_name: null, taluka_name: null, district_name: row ? row.district_name : null };
  }

  return { village_name: null, taluka_name: null, district_name: null };
};

export const getTalukaRepsInDistrict = async (districtId) => {
  const [rows] = await pool.query(
    `SELECT
       u.id, u.name, u.first_name, u.last_name, u.phone, u.email, uj.role_name,
       t.id AS taluka_id, t.taluka_name,
       (
         SELECT COUNT(*)
         FROM user_jurisdictions village_uj
         JOIN villages v ON v.id = village_uj.scope_id AND village_uj.scope_type = 'village'
         WHERE v.taluka_id = t.id
       ) AS village_rep_count
     FROM user_jurisdictions uj
     JOIN talukas t ON t.id = uj.scope_id AND uj.scope_type = 'taluka'
     JOIN users u ON u.id = uj.user_id AND u.deleted_at IS NULL
     WHERE t.district_id = ?
     ORDER BY t.taluka_name ASC`,
    [districtId]
  );
  return rows;
};

export const getVillageRepsInTaluka = async (talukaId) => {
  const [rows] = await pool.query(
    `SELECT
       u.id, u.name, u.first_name, u.last_name, u.phone, u.email, uj.role_name,
       uj.scope_id AS village_id, v.village_name
     FROM user_jurisdictions uj
     JOIN villages v ON v.id = uj.scope_id AND uj.scope_type = 'village'
     JOIN users u ON u.id = uj.user_id AND u.deleted_at IS NULL
     WHERE v.taluka_id = ?
     ORDER BY v.village_name ASC`,
    [talukaId]
  );
  return rows;
};

export const getTalukaById = async (talukaId) => {
  const [rows] = await pool.query(
    'SELECT id, district_id, taluka_name FROM talukas WHERE id = ?',
    [talukaId]
  );
  return rows[0] || null;
};

export const getVillageById = async (villageId) => {
  const [rows] = await pool.query(
    `SELECT v.id, v.taluka_id, t.district_id, v.village_name, t.taluka_name, d.district_name
     FROM villages v
     JOIN talukas t ON t.id = v.taluka_id
     JOIN districts d ON d.id = t.district_id
     WHERE v.id = ?`,
    [villageId]
  );
  return rows[0] || null;
};

export const getUsersInVillage = async ({ village_name, taluka_name, district_name }) => {
  const [rows] = await pool.query(
    `SELECT id, name, first_name, last_name, email, phone, role, document_status, created_at
     FROM users
     WHERE village = ? AND taluka = ? AND district = ? AND deleted_at IS NULL
     ORDER BY id DESC`,
    [village_name, taluka_name, district_name]
  );
  return rows;
};
