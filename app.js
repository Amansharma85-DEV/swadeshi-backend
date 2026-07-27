const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CORS Configuration - Allow all frontend origins (GitHub Pages, localhost 3000/3001/5173)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers (Increased to 50mb for high-res photo uploads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder for fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errors: []
  }
});

app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Universal Key-Value Settings Storage for Multi-Device Admin Sync
const fs = require('fs');
const settingsFilePath = path.join(__dirname, 'uploads', 'settings.json');

function readSettingsFile() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      return JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading settings file:', e);
  }
  return {};
}

function writeSettingsFile(data) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing settings file:', e);
  }
}

app.get('/api/settings/:key', (req, res) => {
  const store = readSettingsFile();
  const key = req.params.key;
  res.status(200).json({
    success: true,
    data: { key, value: store[key] || null }
  });
});

app.post('/api/settings/:key', (req, res) => {
  const store = readSettingsFile();
  const key = req.params.key;
  store[key] = req.body.value;
  writeSettingsFile(store);
  res.status(200).json({
    success: true,
    message: `Setting ${key} updated successfully`,
    data: { key, value: store[key] }
  });
});

// DB Schema Migration Endpoint
app.get('/api/migrate-db', async (req, res) => {
  try {
    const pool = require('./config/db');
    await pool.query('ALTER TABLE menu_items MODIFY COLUMN image_url LONGTEXT');
    await pool.query('ALTER TABLE categories MODIFY COLUMN description LONGTEXT');
    res.status(200).json({
      success: true,
      message: 'Database columns altered to LONGTEXT successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Swadeshi Kitchen API server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    errors: []
  });
});

// Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
