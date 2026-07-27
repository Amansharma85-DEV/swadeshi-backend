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

let storage;

if (hasS3Config && s3Client) {
  storage = multerS3({
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
} else {
  // Local disk storage fallback
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const cleanExt = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`);
    }
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: imageFilter
});

module.exports = upload;
