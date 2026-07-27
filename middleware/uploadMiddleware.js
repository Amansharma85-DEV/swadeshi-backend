const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const { s3Client, hasS3Config, bucketName } = require('../config/s3');

// File filter to allow image files
const imageFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|svg/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp, gif, svg) are allowed!'));
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
      const fileName = `menu-items/${Date.now()}_${path.basename(file.originalname)}`;
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
      const cleanExt = path.extname(file.originalname).toLowerCase() || '.png';
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
