import pool from './config/db.js';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node set-role.js <email> <role>');
  console.log('Example: node set-role.js test@example.com super_admin');
  process.exit(1);
}

const [email, role] = args;

async function setRole() {
  try {
    // Check if user exists
    const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
    if (users.length === 0) {
      console.error(`Error: User with email "${email}" not found.`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`Found user: ${user.name} (${user.email}), current role: "${user.role || 'user'}"`);

    // Update role
    await pool.query('UPDATE users SET role = ? WHERE email = ?', [role, email]);
    console.log(`Successfully updated role to: "${role}"`);

    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

setRole();
