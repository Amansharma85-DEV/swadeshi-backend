const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
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

// 1. Local disk storage (Always primary parser to prevent stream EOF / Unexpected end of form errors)
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

// Single Image Upload Middleware with Dual-Engine (S3 + EC2 Local Disk)
const uploadSingleImage = (req, res, next) => {
  diskUpload.single('image')(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer stream parsing error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed',
        errors: [err.message]
      });
    }

    if (!req.file) {
      return next();
    }

    // Try AWS S3 upload if S3 credentials & bucket configured
    if (hasS3Config && s3Client) {
      try {
        const fileStream = fs.createReadStream(req.file.path);
        const cleanExt = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const s3Key = `menu-items/${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`;

        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileStream,
          ContentType: req.file.mimetype
        }));

        const region = process.env.AWS_REGION || 'ap-south-1';
        req.file.location = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
        req.file.key = s3Key;
        console.log(`✅ Uploaded to AWS S3: ${req.file.location}`);
      } catch (s3Err) {
        console.warn(`⚠️ AWS S3 upload warning (Falling back to EC2 local disk storage):`, s3Err.message);
      }
    }

    next();
  });
};

module.exports = {
  uploadSingleImage,
  diskUpload
};
