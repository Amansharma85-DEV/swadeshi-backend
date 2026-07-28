const express = require('express');
const { body } = require('express-validator');
const menuController = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Public: GET /api/menu
router.get('/', menuController.getMenu);

// Public: GET /api/menu/:id
router.get('/:id', menuController.getMenuItemById);

// Public/Protected: POST /api/menu/upload - Direct File Upload Endpoint
router.post('/upload', uploadSingleImage, menuController.uploadImage);

// POST /api/menu - Create Menu Item
router.post(
  '/',
  uploadSingleImage,
  [
    body('name').notEmpty().withMessage('Item name is required'),
    body('price').notEmpty().withMessage('Valid price is required'),
    validate
  ],
  menuController.createMenuItem
);

// PUT /api/menu/:id - Update Menu Item
router.put(
  '/:id',
  uploadSingleImage,
  [
    body('category_id').optional(),
    body('price').optional(),
    validate
  ],
  menuController.updateMenuItem
);

// DELETE /api/menu/:id
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router;
