const pool = require('../config/db');

const createOrder = async (orderData, itemsData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const orderCode = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const insertOrderQuery = `
      INSERT INTO orders (order_code, customer_name, customer_phone, customer_address, customer_note,
                          subtotal, discount, delivery_fee, grand_total, payment_method, delivery_method, coupon_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;

    const [orderResult] = await connection.query(insertOrderQuery, [
      orderCode,
      orderData.customer_name,
      orderData.customer_phone,
      orderData.customer_address,
      orderData.customer_note || null,
      orderData.subtotal,
      orderData.discount || 0.00,
      orderData.delivery_fee || 0.00,
      orderData.grand_total,
      orderData.payment_method || 'Cash on Delivery',
      orderData.delivery_method || 'Home Delivery',
      orderData.coupon_code || null
    ]);

    const orderId = orderResult.insertId;

    const insertItemQuery = `
      INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, subtotal)
      VALUES ?
    `;

    const [validMenuItems] = await connection.query('SELECT id FROM menu_items');
    const validIds = new Set(validMenuItems.map(m => m.id));

    const itemValues = itemsData.map(item => {
      const qty = parseInt(item.quantity || 1, 10);
      const price = parseFloat(item.unit_price || item.price || 0);
      const sub = parseFloat(item.subtotal || (qty * price) || 0);
      const name = item.item_name || item.name || 'Delicious Dish';
      const menuItemId = item.menu_item_id && validIds.has(Number(item.menu_item_id)) ? Number(item.menu_item_id) : null;
      return [
        orderId,
        menuItemId,
        name,
        qty,
        price,
        sub
      ];
    });

    await connection.query(insertItemQuery, [itemValues]);

    await connection.commit();
    connection.release();

    return { id: orderId, order_code: orderCode };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

const getAllOrders = async (status, search) => {
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY created_at DESC';

  const [orders] = await pool.query(query, params);
  if (orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  const [allItems] = await pool.query('SELECT * FROM order_items WHERE order_id IN (?)', [orderIds]);

  const itemsByOrderId = {};
  allItems.forEach(item => {
    if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
    itemsByOrderId[item.order_id].push({
      id: item.id,
      name: item.item_name,
      item_name: item.item_name,
      quantity: item.quantity,
      price: parseFloat(item.unit_price || 0),
      unit_price: parseFloat(item.unit_price || 0),
      subtotal: parseFloat(item.subtotal || 0)
    });
  });

  return orders.map(order => ({
    ...order,
    items: itemsByOrderId[order.id] || []
  }));
};

const getOrderById = async (id) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (orders.length === 0) return null;

  const order = orders[0];
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
  order.items = items.map(item => ({
    id: item.id,
    name: item.item_name,
    item_name: item.item_name,
    quantity: item.quantity,
    price: parseFloat(item.unit_price || 0),
    unit_price: parseFloat(item.unit_price || 0),
    subtotal: parseFloat(item.subtotal || 0)
  }));

  return order;
};

const updateOrderStatus = async (id, status) => {
  const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
};

const deleteOrder = async (id) => {
  const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};
