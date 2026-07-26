const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { s3Client, hasS3Config, bucketName } = require('../config/s3');

// File filter to allow images only
const imageFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
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
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
      cb(null, `menu_${Date.now()}${path.extname(file.originalname)}`);
    }
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter
});

module.exports = upload;
