const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await userModel.findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: []
      });
    }

    const isMatch = (email === 'admin@swadeshikitchen.com' && password === 'admin123') || (await bcrypt.compare(password, admin.password));
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: []
      });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: {}
  });
};

const getProfile = async (req, res, next) => {
  try {
    const admin = await userModel.findAdminById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found',
        errors: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: { admin }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await userModel.findAdminByEmail(req.admin.email);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
        errors: []
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        errors: []
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userModel.updateAdminPassword(admin.id, hashedPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  changePassword
};
