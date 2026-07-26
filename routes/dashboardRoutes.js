const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected: GET /api/dashboard
router.get('/', protect, dashboardController.getDashboardData);

module.exports = router;
