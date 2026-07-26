const categoryModel = require('../models/categoryModel');

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryModel.getAllCategories();
    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const newCategory = await categoryModel.createCategory(name, description);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: newCategory }
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await categoryModel.updateCategory(id, name, description);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        errors: []
      });
    }
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await categoryModel.deleteCategory(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        errors: []
      });
    }
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
