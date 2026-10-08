
import pool from '../config/db.js';

 export const createRolesTable = async () =>{

    const sql = `
    CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,  
        name VARCHAR(255) NOT NULL,
        description TEXT,
        permissions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
    )
  `;
  return pool.query(sql);
};

export const insertRole = async (role) =>{
    const sql = `
    INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)
  `;
  const values = [role.name, role.description, role.permissions];
  return pool.query(sql, values);
};
    
export const getRoleById = async (id) =>{
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ? AND deleted_at IS NULL', [id]);
    return rows[0] || null;
}

export const getRoleByName = async (name) =>{
    const [rows] = await pool.query('SELECT * FROM roles WHERE name = ? AND deleted_at IS NULL LIMIT 1', [name]);
    return rows[0] || null;
}

export const getAllRoles = async () =>{
    const [rows] = await pool.query('SELECT * FROM roles WHERE deleted_at IS NULL');
    return rows;
}

export const updateRole = async (id, role) =>{
    const sql = `
    UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ? AND deleted_at IS NULL 
    `;
    const values = [role.name, role.description, role.permissions, id]; 
    return pool.query(sql, values);
}

export const deleteRole = async (id) =>{
    const sql = `
    UPDATE roles SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL
  `;
  return pool.query(sql, [id]);
}

// One-time seed: creates the default 'farmer' role with product/crop permissions if it doesn't exist yet.
export const seedDefaultRoles = async () => {
  const farmerRole = await getRoleByName('farmer');
  if (!farmerRole) {
    await insertRole({
      name: 'farmer',
      description: 'Farmer - can manage their own products and crops',
      permissions: 'product.view,product.create,product.edit,product.delete,crop.view,crop.create,crop.edit,crop.delete',
    });
  }
}

