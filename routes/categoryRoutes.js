const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Public: GET /api/categories
router.get('/', categoryController.getCategories);

// Protected: POST /api/categories
router.post(
  '/',
  protect,
  [
    body('name').notEmpty().withMessage('Category name is required'),
    validate
  ],
  categoryController.createCategory
);

// Protected: PUT /api/categories/:id
router.put(
  '/:id',
  protect,
  [
    body('name').notEmpty().withMessage('Category name is required'),
    validate
  ],
  categoryController.updateCategory
);

// Protected: DELETE /api/categories/:id
router.delete('/:id', protect, categoryController.deleteCategory);

module.exports = router;
