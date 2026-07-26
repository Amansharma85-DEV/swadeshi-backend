const pool = require('../config/db');

const getDashboardStats = async () => {
  const [totalOrdersRes] = await pool.query('SELECT COUNT(*) as count FROM orders');
  const [totalRevenueRes] = await pool.query('SELECT SUM(grand_total) as total FROM orders WHERE status != "Cancelled"');
  const [pendingOrdersRes] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = "Pending"');
  const [completedOrdersRes] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = "Delivered"');
  const [cancelledOrdersRes] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE status = "Cancelled"');
  const [totalMenuItemsRes] = await pool.query('SELECT COUNT(*) as count FROM menu_items');
  const [totalCategoriesRes] = await pool.query('SELECT COUNT(*) as count FROM categories');

  return {
    totalOrders: totalOrdersRes[0].count || 0,
    totalRevenue: parseFloat(totalRevenueRes[0].total || 0),
    pendingOrders: pendingOrdersRes[0].count || 0,
    completedOrders: completedOrdersRes[0].count || 0,
    cancelledOrders: cancelledOrdersRes[0].count || 0,
    totalMenuItems: totalMenuItemsRes[0].count || 0,
    totalCategories: totalCategoriesRes[0].count || 0
  };
};

module.exports = { getDashboardStats };
