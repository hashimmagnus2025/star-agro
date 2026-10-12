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

// Lets a District Representative's scope be narrowed to a specific subset of talukas
// (instead of the whole district) so an admin can split one district between multiple
// District Representatives. UNIQUE(taluka_id) enforces that a taluka is only ever
// claimed by one representative's jurisdiction row at a time.
export const createJurisdictionTalukasTable = async () => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS jurisdiction_talukas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_jurisdiction_id INT NOT NULL,
        taluka_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_taluka_assignment (taluka_id),
        INDEX idx_user_jurisdiction (user_jurisdiction_id),
        FOREIGN KEY (user_jurisdiction_id) REFERENCES user_jurisdictions(id) ON DELETE CASCADE,
        FOREIGN KEY (taluka_id) REFERENCES talukas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
  } catch (error) {
    console.error('❌ Error creating jurisdiction_talukas table:', error.message);
  }
};

// Same idea as jurisdiction_talukas, one level down: lets a Taluka Representative's scope
// be narrowed to a specific subset of villages (instead of the whole taluka) so a taluka
// can be split between multiple Taluka Representatives. UNIQUE(village_id) enforces that
// a village is only ever claimed by one representative's jurisdiction row at a time.
export const createJurisdictionVillagesTable = async () => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS jurisdiction_villages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_jurisdiction_id INT NOT NULL,
        village_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_village_assignment (village_id),
        INDEX idx_user_jurisdiction (user_jurisdiction_id),
        FOREIGN KEY (user_jurisdiction_id) REFERENCES user_jurisdictions(id) ON DELETE CASCADE,
        FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
  } catch (error) {
    console.error('❌ Error creating jurisdiction_villages table:', error.message);
  }
};

export const getAssignedTalukaIdsForJurisdiction = async (userJurisdictionId) => {
  const [rows] = await pool.query(
    'SELECT taluka_id FROM jurisdiction_talukas WHERE user_jurisdiction_id = ?',
    [userJurisdictionId]
  );
  return rows.map((row) => row.taluka_id);
};

// Products/users are linked to their district/taluka/village by NAME (plain text columns
// on `users`), not by id — so product-approval scoping needs the assigned subset's NAMES,
// not ids. Resolves a District Representative's taluka subset straight to taluka_name.
export const getAssignedTalukaNamesForJurisdiction = async (userJurisdictionId) => {
  const [rows] = await pool.query(
    `SELECT t.taluka_name
     FROM jurisdiction_talukas jt
     JOIN talukas t ON t.id = jt.taluka_id
     WHERE jt.user_jurisdiction_id = ?`,
    [userJurisdictionId]
  );
  return rows.map((row) => row.taluka_name);
};

// Same idea for a Taluka Representative's village subset.
export const getAssignedVillageNamesForJurisdiction = async (userJurisdictionId) => {
  const [rows] = await pool.query(
    `SELECT v.village_name
     FROM jurisdiction_villages jv
     JOIN villages v ON v.id = jv.village_id
     WHERE jv.user_jurisdiction_id = ?`,
    [userJurisdictionId]
  );
  return rows.map((row) => row.village_name);
};

// Replaces the full set of talukas assigned to a District Representative's jurisdiction
// row. Relies on the caller (assignJurisdiction) having already checked that none of
// talukaIds are claimed by a different representative — the UNIQUE constraint is the
// last-resort guard against a race, not the primary check.
export const setJurisdictionTalukas = async (userJurisdictionId, talukaIds) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM jurisdiction_talukas WHERE user_jurisdiction_id = ?', [userJurisdictionId]);
    if (talukaIds.length > 0) {
      const values = talukaIds.map((talukaId) => [userJurisdictionId, talukaId]);
      await connection.query('INSERT INTO jurisdiction_talukas (user_jurisdiction_id, taluka_id) VALUES ?', [values]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// All talukas in a district, each flagged with who (if anyone) already manages it as
// part of a District Representative's assigned subset — so the admin's taluka picker
// can exclude talukas already claimed by a different representative. `excludeUserId`
// is the representative currently being edited, so their own existing picks still show
// as available/pre-selected rather than "taken".
export const getTalukasWithAssignmentStatus = async (districtId, excludeUserId) => {
  const [rows] = await pool.query(
    `SELECT
       t.id, t.taluka_name,
       uj.user_id AS assigned_user_id,
       u.name AS assigned_user_name
     FROM talukas t
     LEFT JOIN jurisdiction_talukas jt ON jt.taluka_id = t.id
     LEFT JOIN user_jurisdictions uj ON uj.id = jt.user_jurisdiction_id
     LEFT JOIN users u ON u.id = uj.user_id
     WHERE t.district_id = ? AND t.status = 'Active'
     ORDER BY t.taluka_name ASC`,
    [districtId]
  );

  return rows.map((row) => ({
    id: row.id,
    taluka_name: row.taluka_name,
    assigned_user_id: row.assigned_user_id || null,
    taken_by: row.assigned_user_id && Number(row.assigned_user_id) !== Number(excludeUserId)
      ? { user_id: row.assigned_user_id, name: row.assigned_user_name }
      : null,
  }));
};

export const getAssignedVillageIdsForJurisdiction = async (userJurisdictionId) => {
  const [rows] = await pool.query(
    'SELECT village_id FROM jurisdiction_villages WHERE user_jurisdiction_id = ?',
    [userJurisdictionId]
  );
  return rows.map((row) => row.village_id);
};

// Replaces the full set of villages assigned to a Taluka Representative's jurisdiction
// row. Relies on the caller (assignJurisdiction) having already checked that none of
// villageIds are claimed by a different representative — the UNIQUE constraint is the
// last-resort guard against a race, not the primary check.
export const setJurisdictionVillages = async (userJurisdictionId, villageIds) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM jurisdiction_villages WHERE user_jurisdiction_id = ?', [userJurisdictionId]);
    if (villageIds.length > 0) {
      const values = villageIds.map((villageId) => [userJurisdictionId, villageId]);
      await connection.query('INSERT INTO jurisdiction_villages (user_jurisdiction_id, village_id) VALUES ?', [values]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// All villages in a taluka, each flagged with who (if anyone) already manages it as
// part of a Taluka Representative's assigned subset — so the admin's village picker
// can exclude villages already claimed by a different representative. `excludeUserId`
// is the representative currently being edited, so their own existing picks still show
// as available/pre-selected rather than "taken".
export const getVillagesWithAssignmentStatus = async (talukaId, excludeUserId) => {
  const [rows] = await pool.query(
    `SELECT
       v.id, v.village_name,
       uj.user_id AS assigned_user_id,
       u.name AS assigned_user_name
     FROM villages v
     LEFT JOIN jurisdiction_villages jv ON jv.village_id = v.id
     LEFT JOIN user_jurisdictions uj ON uj.id = jv.user_jurisdiction_id
     LEFT JOIN users u ON u.id = uj.user_id
     WHERE v.taluka_id = ? AND v.status = 'active'
     ORDER BY v.village_name ASC`,
    [talukaId]
  );

  return rows.map((row) => ({
    id: row.id,
    village_name: row.village_name,
    assigned_user_id: row.assigned_user_id || null,
    taken_by: row.assigned_user_id && Number(row.assigned_user_id) !== Number(excludeUserId)
      ? { user_id: row.assigned_user_id, name: row.assigned_user_name }
      : null,
  }));
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

// Same shape as getTalukaRepsInDistrict, but scoped to a specific District Representative's
// assigned taluka subset rather than every taluka in the district.
export const getTalukaRepsForTalukaIds = async (talukaIds) => {
  if (!talukaIds.length) return [];

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
     WHERE t.id IN (?)
     ORDER BY t.taluka_name ASC`,
    [talukaIds]
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

// Same shape as getVillageRepsInTaluka, but scoped to a specific Taluka Representative's
// assigned village subset rather than every village in the taluka.
export const getVillageRepsForVillageIds = async (villageIds) => {
  if (!villageIds.length) return [];

  const [rows] = await pool.query(
    `SELECT
       u.id, u.name, u.first_name, u.last_name, u.phone, u.email, uj.role_name,
       uj.scope_id AS village_id, v.village_name
     FROM user_jurisdictions uj
     JOIN villages v ON v.id = uj.scope_id AND uj.scope_type = 'village'
     JOIN users u ON u.id = uj.user_id AND u.deleted_at IS NULL
     WHERE v.id IN (?)
     ORDER BY v.village_name ASC`,
    [villageIds]
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
