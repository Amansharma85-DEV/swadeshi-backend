const menuModel = require('../models/menuModel');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, hasS3Config, bucketName } = require('../config/s3');

// Helper to delete image from S3
const deleteS3Image = async (s3Key) => {
  if (hasS3Config && s3Client && s3Key) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: s3Key }));
      console.log(`✅ Deleted S3 object: ${s3Key}`);
    } catch (err) {
      console.error(`❌ S3 Delete Error for key ${s3Key}:`, err.message);
    }
  }
};

const getMenu = async (req, res, next) => {
  try {
    const items = await menuModel.getAllMenuItems();
    res.status(200).json({
      success: true,
      message: 'Menu items fetched successfully',
      data: { menu: items }
    });
  } catch (error) {
    next(error);
  }
};

const getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await menuModel.getMenuItemById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
        errors: []
      });
    }
    res.status(200).json({
      success: true,
      data: { menuItem: item }
    });
  } catch (error) {
    next(error);
  }
};

// Helper to build secure HTTPS image URL for uploads
const buildImageUrl = (req, file) => {
  if (!file) return '';
  if (file.location) return file.location;
  const host = req.get('host') || 'swadeshikitchen.shop';
  const proto = (req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' || host.includes('swadeshikitchen.shop')) ? 'https' : req.protocol;
  return `${proto}://${host}/uploads/${file.filename}`;
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const imageUrl = buildImageUrl(req, req.file);

    console.log('✅ Direct image upload success:', imageUrl);
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: req.file.filename || req.file.key
      }
    });
  } catch (err) {
    console.error('❌ Direct image upload error:', err);
    next(err);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const { category_id, name, description, price, tag, is_veg, is_bestseller, is_available, image_url: bodyUrl } = req.body;

    let image_url = bodyUrl || null;
    let s3_key = null;

    if (req.file) {
      image_url = buildImageUrl(req, req.file);
      s3_key = req.file.key || null;
    }

    console.log('📝 Creating menu item with image_url:', image_url);

    const newItem = await menuModel.createMenuItem({
      category_id: parseInt(category_id || 1, 10),
      name,
      description: description || null,
      price: parseFloat(price),
      image_url,
      s3_key,
      tag: tag || 'Standard',
      is_veg: is_veg === undefined ? true : (is_veg === 'true' || is_veg === true),
      is_bestseller: is_bestseller === undefined ? false : (is_bestseller === 'true' || is_bestseller === true),
      is_available: is_available === undefined ? true : (is_available === 'true' || is_available === true)
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { menuItem: newItem }
    });
  } catch (error) {
    console.error('❌ Error creating menu item:', error);
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingItem = await menuModel.getMenuItemById(id);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
        errors: []
      });
    }

    const { category_id, name, description, price, tag, is_veg, is_bestseller, is_available, image_url: bodyUrl } = req.body;

    let image_url = bodyUrl !== undefined ? bodyUrl : existingItem.image_url;
    let s3_key = existingItem.s3_key;

    if (req.file) {
      if (existingItem.s3_key) {
        await deleteS3Image(existingItem.s3_key);
      }
      image_url = buildImageUrl(req, req.file);
      s3_key = req.file.key || null;
    }

    console.log(`📝 Updating menu item ID ${id} with image_url:`, image_url);

    await menuModel.updateMenuItem(id, {
      category_id: parseInt(category_id || existingItem.category_id, 10),
      name: name || existingItem.name,
      description: description !== undefined ? description : existingItem.description,
      price: price !== undefined ? parseFloat(price) : existingItem.price,
      image_url,
      s3_key,
      tag: tag || existingItem.tag,
      is_veg: is_veg !== undefined ? (is_veg === 'true' || is_veg === true) : existingItem.is_veg,
      is_bestseller: is_bestseller !== undefined ? (is_bestseller === 'true' || is_bestseller === true) : existingItem.is_bestseller,
      is_available: is_available !== undefined ? (is_available === 'true' || is_available === true) : existingItem.is_available
    });

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: { id, image_url }
    });
  } catch (error) {
    console.error(`❌ Error updating menu item ID ${id}:`, error);
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingItem = await menuModel.getMenuItemById(id);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
        errors: []
      });
    }

    if (existingItem.s3_key) {
      await deleteS3Image(existingItem.s3_key);
    }

    await menuModel.deleteMenuItem(id);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenu,
  getMenuItemById,
  uploadImage,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
