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

const errorHandler = require('./middleware/errorHandler');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// Trust Nginx reverse proxy headers (X-Forwarded-Proto, X-Forwarded-For)
app.set('trust proxy', true);

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

// Robust CORS Middleware Configuration
const corsOptions = {
  origin: true, // Allow any origin dynamically while reflecting it in response
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization', 'Cache-Control'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Explicit Fallback Headers Middleware for Preflight OPTIONS Requests
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Body Parsers (Increased to 50mb for high-res photo uploads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder for fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiter (Increased capacity & exempts authenticated admin operations)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // High capacity threshold (5,000 requests / 15 mins)
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean(req.headers.authorization || req.path.includes('/upload') || req.path.includes('/settings')),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errors: []
  }
});

app.use('/api', apiLimiter);

// Health Check Endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Swadeshi Kitchen API server is healthy',
    timestamp: new Date().toISOString()
  });
});

// AWS Configuration & S3 Status Diagnostic Endpoint (Protected)
app.get('/api/aws-status', protect, (req, res) => {
  const key = process.env.AWS_ACCESS_KEY_ID || '';
  const maskedKey = key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'NOT_SET';
  
  res.status(200).json({
    success: true,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      USE_S3_STORAGE: process.env.USE_S3_STORAGE || 'false',
      AWS_ACCESS_KEY_ID_EXISTS: Boolean(process.env.AWS_ACCESS_KEY_ID),
      AWS_ACCESS_KEY_ID_MASKED: maskedKey,
      AWS_SECRET_ACCESS_KEY_EXISTS: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
      AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'swadeshi-kitchen-assets'
    },
    s3_active: Boolean(require('./config/s3').s3Client)
  });
});

// Database Auto-Migration / Column Verification Endpoint (Protected)
const pool = require('./config/db');
app.get('/api/migrate-db', protect, async (req, res) => {
  try {
    await pool.query('ALTER TABLE menu_items MODIFY COLUMN image_url LONGTEXT');
    res.status(200).json({ success: true, message: 'Database schema migration complete: image_url is LONGTEXT' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database migration error' });
  }
});

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
    console.error('Error reading settings.json:', e);
  }
  return {};
}

function writeSettingsFile(data) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing settings.json:', e);
  }
}

app.get('/api/settings/:key', (req, res) => {
  const settings = readSettingsFile();
  const val = settings[req.params.key];
  res.status(200).json({
    success: true,
    data: { key: req.params.key, value: val !== undefined ? val : null }
  });
});

app.post('/api/settings/:key', (req, res) => {
  const settings = readSettingsFile();
  settings[req.params.key] = req.body.value;
  writeSettingsFile(settings);
  res.status(200).json({
    success: true,
    message: `Setting '${req.params.key}' updated successfully`,
    data: { key: req.params.key, value: req.body.value }
  });
});

// 404 Handler for Undefined Routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    errors: []
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
