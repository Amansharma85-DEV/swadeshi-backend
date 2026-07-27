const express = require('express');
const { body } = require('express-validator');
const menuController = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Safe Multer upload wrapper to catch upload errors cleanly
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload error',
        errors: [err.message]
      });
    }
    next();
  });
};

// Public: GET /api/menu
router.get('/', menuController.getMenu);

// Public: GET /api/menu/:id
router.get('/:id', menuController.getMenuItemById);

// Public/Protected: POST /api/menu/upload - Direct File Upload Endpoint
router.post('/upload', handleUpload, menuController.uploadImage);

// POST /api/menu - Create Menu Item
router.post(
  '/',
  handleUpload,
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
  handleUpload,
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
