const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const { s3Client, hasS3Config, bucketName } = require('../config/s3');

// File filter accepting JPG, JPEG, PNG, WEBP, GIF, SVG
const imageFilter = (req, file, cb) => {
  if (!file) return cb(null, true);
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.svg'];
  const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

  if (allowedExtensions.includes(ext) || allowedMimetypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  
  cb(new Error(`Invalid image format (${ext || file.mimetype}). Allowed formats: JPG, JPEG, PNG, WEBP, GIF, SVG.`));
};

// 1. Local disk storage (Always available on EC2)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const cleanExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`);
  }
});

const diskUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: imageFilter
});

// 2. S3 Storage (Optional)
let s3Upload = null;
if (hasS3Config && s3Client) {
  try {
    const s3Storage = multerS3({
      s3: s3Client,
      bucket: bucketName,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const cleanExt = path.extname(file.originalname).toLowerCase() || '.jpg';
        const fileName = `menu-items/${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`;
        cb(null, fileName);
      }
    });

    s3Upload = multer({
      storage: s3Storage,
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: imageFilter
    });
  } catch (e) {
    console.warn('⚠️ S3 storage setup failed:', e.message);
  }
}

// Bulletproof Fail-safe Upload Middleware: Tries S3, falls back to disk storage on any AWS credential/bucket error
const uploadSingleImage = (req, res, next) => {
  if (s3Upload) {
    s3Upload.single('image')(req, res, (err) => {
      if (err) {
        console.warn('⚠️ AWS S3 Upload failed (Fallback to local EC2 storage):', err.message);
        return diskUpload.single('image')(req, res, (diskErr) => {
          if (diskErr) {
            return res.status(400).json({
              success: false,
              message: diskErr.message || 'Image upload failed',
              errors: [diskErr.message]
            });
          }
          next();
        });
      }
      next();
    });
  } else {
    diskUpload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Image upload failed',
          errors: [err.message]
        });
      }
      next();
    });
  }
};

module.exports = {
  uploadSingleImage,
  diskUpload,
  s3Upload
};
