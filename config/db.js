const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'swadeshi_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(async (connection) => {
    console.log('✅ Connected to MySQL database successfully.');
    try {
      await connection.query('ALTER TABLE menu_items MODIFY COLUMN image_url LONGTEXT');
      console.log('✅ Altered menu_items.image_url column to LONGTEXT for image uploads.');
    } catch (e) {
      console.warn('Note on menu_items alter:', e.message);
    }
    connection.release();
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MySQL database:', err.message);
  });

module.exports = pool;
