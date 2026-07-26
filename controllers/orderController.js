const orderModel = require('../models/orderModel');

const createOrder = async (req, res, next) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_address,
      customer_note,
      subtotal,
      discount,
      delivery_fee,
      grand_total,
      payment_method,
      delivery_method,
      coupon_code,
      items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
        errors: []
      });
    }

    const newOrder = await orderModel.createOrder(
      {
        customer_name,
        customer_phone,
        customer_address,
        customer_note,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount || 0),
        delivery_fee: parseFloat(delivery_fee || 0),
        grand_total: parseFloat(grand_total),
        payment_method,
        delivery_method,
        coupon_code
      },
      items
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order: newOrder }
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const orders = await orderModel.getAllOrders(status, search);

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderModel.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order details fetched successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${validStatuses.join(', ')}`,
        errors: []
      });
    }

    const updated = await orderModel.updateOrderStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: { id, status }
    });
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await orderModel.deleteOrder(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateStatus,
  deleteOrder
};
