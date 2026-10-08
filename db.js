import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbconfig = {
  host: "127.0.0.1",
  user: "magnusideas_staragro",
  password: "g5Vu&](bxjz~",
  database: "magnusideas_staragro",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbconfig);

export const testConnection = async () => {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
};

export default pool;