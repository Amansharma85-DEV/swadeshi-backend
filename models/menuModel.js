const pool = require('../config/db');

const ensureSchema = async () => {
  try {
    await pool.query('ALTER TABLE menu_items MODIFY COLUMN image_url LONGTEXT');
  } catch (e) {
    // Ignore if column already LONGTEXT
  }
};

const getAllMenuItems = async () => {
  const query = `
    SELECT m.*, c.name as category_name
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    ORDER BY c.name ASC, m.name ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

const getMenuItemById = async (id) => {
  const query = `
    SELECT m.*, c.name as category_name
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    WHERE m.id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

const createMenuItem = async (data) => {
  await ensureSchema();
  const { category_id, name, description, price, image_url, s3_key, tag, is_veg, is_bestseller, is_available } = data;
  const query = `
    INSERT INTO menu_items (category_id, name, description, price, image_url, s3_key, tag, is_veg, is_bestseller, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(query, [
    category_id,
    name,
    description || null,
    price,
    image_url || null,
    s3_key || null,
    tag || 'Standard',
    is_veg !== undefined ? is_veg : true,
    is_bestseller !== undefined ? is_bestseller : false,
    is_available !== undefined ? is_available : true
  ]);
  return { id: result.insertId, ...data };
};

const updateMenuItem = async (id, data) => {
  await ensureSchema();
  const { category_id, name, description, price, image_url, s3_key, tag, is_veg, is_bestseller, is_available } = data;
  const query = `
    UPDATE menu_items
    SET category_id = ?, name = ?, description = ?, price = ?,
        image_url = IFNULL(?, image_url),
        s3_key = IFNULL(?, s3_key),
        tag = ?,
        is_veg = ?,
        is_bestseller = ?,
        is_available = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(query, [
    category_id,
    name,
    description,
    price,
    image_url !== undefined && image_url !== '' ? image_url : null,
    s3_key || null,
    tag || 'Standard',
    is_veg !== undefined ? is_veg : true,
    is_bestseller !== undefined ? is_bestseller : false,
    is_available !== undefined ? is_available : true,
    id
  ]);
  return result.affectedRows > 0;
};

const deleteMenuItem = async (id) => {
  const [result] = await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
