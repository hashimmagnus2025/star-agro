import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection(dbconfig);
    console.log('✓ Database connection successful');

    // Check if table exists
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      console.log('✗ users table does not exist');
    } else {
      console.log('✓ users table exists');
      
      // Get table structure
      const [columns] = await connection.query('DESCRIBE users');
      console.log('\nTable structure:');
      console.table(columns);
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabase();
