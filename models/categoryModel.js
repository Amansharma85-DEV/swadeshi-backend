const pool = require('../config/db');

const getAllCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  return rows;
};

const getCategoryById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
};

const createCategory = async (name, description) => {
  const [result] = await pool.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description || null]
  );
  return { id: result.insertId, name, description };
};

const updateCategory = async (id, name, description) => {
  const [result] = await pool.query(
    'UPDATE categories SET name = ?, description = ? WHERE id = ?',
    [name, description || null, id]
  );
  return result.affectedRows > 0;
};

const deleteCategory = async (id) => {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
