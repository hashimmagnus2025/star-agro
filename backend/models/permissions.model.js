import pool from '../config/db.js';
 
export const createPermissionsTable = async () =>{
    const sql = `
    CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
       
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
    )
  `;
  return pool.query(sql);
};


export const insertPermission = async (permission) =>{
    const sql = `
    INSERT INTO permissions (name, description) VALUES (?, ?)
  `;
  const values = [permission.name, permission.description];
  return pool.query(sql, values);
};

const DEFAULT_PERMISSIONS = [
  { name: 'product.view', description: 'View products' },
  { name: 'product.create', description: 'Create products' },
  { name: 'product.edit', description: 'Edit products' },
  { name: 'product.delete', description: 'Delete products' },
  { name: 'crop.view', description: 'View crops' },
  { name: 'crop.create', description: 'Create crops' },
  { name: 'crop.edit', description: 'Edit crops' },
  { name: 'crop.delete', description: 'Delete crops' },
  { name: 'service.view', description: 'View services' },
  { name: 'service.create', description: 'Create services' },
  { name: 'service.edit', description: 'Edit services' },
  { name: 'service.delete', description: 'Delete services' },
  { name: 'user.view', description: 'View users' },
  { name: 'user.create', description: 'Create users' },
  { name: 'user.edit', description: 'Edit users' },
  { name: 'user.delete', description: 'Delete users' },
  { name: 'taluka.view', description: 'View Taluka Representatives in "My Team"' },
  { name: 'village.view', description: 'View Village Representatives in "My Team"' },
];

// One-time seed: inserts the fixed permission list if not already present.
export const seedDefaultPermissions = async () => {
  const [existing] = await pool.query('SELECT name FROM permissions WHERE deleted_at IS NULL');
  const existingNames = new Set(existing.map((row) => row.name));
  const missing = DEFAULT_PERMISSIONS.filter((permission) => !existingNames.has(permission.name));

  for (const permission of missing) {
    await insertPermission(permission);
  }
};

export const getPermissionByName = async (name) =>{
    const [rows] = await pool.query('SELECT * FROM permissions WHERE name = ? AND deleted_at IS NULL LIMIT 1', [name]);
    return rows[0] || null;
}

export const getPermissionById = async (id) =>{
    const [rows] = await pool.query('SELECT * FROM permissions WHERE id = ? AND deleted_at IS NULL', [id]);
    return rows[0] || null;
}

export const getAllPermissions = async () =>{
    const [rows] = await pool.query('SELECT * FROM permissions WHERE deleted_at IS NULL');
    return rows;
}

export const updatePermission = async (id, permission) =>{
    const sql = `
    UPDATE permissions SET name = ?, description = ? WHERE id = ? AND deleted_at IS NULL
  `;
  const values = [permission.name, permission.description, id];
  return pool.query(sql, values);
}

export const deletePermission = async (id) =>{
    const sql = `
    UPDATE permissions SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL
  `;
  return pool.query(sql, [id]);
}   

