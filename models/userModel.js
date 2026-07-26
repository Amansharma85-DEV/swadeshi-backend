const pool = require('../config/db');

const findAdminByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
};

const findAdminById = async (id) => {
  const [rows] = await pool.query('SELECT id, name, email, created_at FROM admins WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

const updateAdminPassword = async (id, hashedPassword) => {
  const [result] = await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, id]);
  return result.affectedRows > 0;
};

module.exports = {
  findAdminByEmail,
  findAdminById,
  updateAdminPassword
};
