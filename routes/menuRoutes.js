const express = require('express');
const { body } = require('express-validator');
const menuController = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Public: GET /api/menu
router.get('/', menuController.getMenu);

// Public: GET /api/menu/:id
router.get('/:id', menuController.getMenuItemById);

// Protected: POST /api/menu
router.post(
  '/',
  protect,
  upload.single('image'),
  [
    body('category_id').notEmpty().isNumeric().withMessage('Valid category_id is required'),
    body('name').notEmpty().withMessage('Item name is required'),
    body('price').notEmpty().isNumeric().withMessage('Valid price is required'),
    validate
  ],
  menuController.createMenuItem
);

// Protected: PUT /api/menu/:id
router.put(
  '/:id',
  protect,
  upload.single('image'),
  [
    body('category_id').optional().isNumeric().withMessage('Valid category_id is required'),
    body('price').optional().isNumeric().withMessage('Valid price is required'),
    validate
  ],
  menuController.updateMenuItem
);

// Protected: DELETE /api/menu/:id
router.delete('/:id', protect, menuController.deleteMenuItem);

module.exports = router;
