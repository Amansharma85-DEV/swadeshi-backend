const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Public: POST /api/orders (Customer places order)
router.post(
  '/',
  [
    body('customer_name').notEmpty().withMessage('Customer name is required'),
    body('customer_phone').notEmpty().withMessage('Customer phone is required'),
    body('customer_address').notEmpty().withMessage('Customer address is required'),
    body('subtotal').isNumeric().withMessage('Valid subtotal is required'),
    body('grand_total').isNumeric().withMessage('Valid grand total is required'),
    body('items').isArray({ min: 1 }).withMessage('Items list must be a non-empty array'),
    validate
  ],
  orderController.createOrder
);

// Protected: GET /api/orders
router.get('/', protect, orderController.getOrders);

// Protected: GET /api/orders/:id
router.get('/:id', protect, orderController.getOrderById);

// Protected: PUT /api/orders/:id/status
router.put(
  '/:id/status',
  protect,
  [
    body('status').notEmpty().withMessage('Status is required'),
    validate
  ],
  orderController.updateStatus
);

// Protected: DELETE /api/orders/:id
router.delete('/:id', protect, orderController.deleteOrder);

module.exports = router;
