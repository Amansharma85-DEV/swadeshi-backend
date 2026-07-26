const dashboardModel = require('../models/dashboardModel');

const getDashboardData = async (req, res, next) => {
  try {
    const stats = await dashboardModel.getDashboardStats();
    res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardData };
