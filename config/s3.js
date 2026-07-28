const { S3Client } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config();

// Helper to filter out placeholder strings like "your_aws_access_key_id"
const isRealCredential = (val) => {
  if (!val) return false;
  const lower = val.trim().toLowerCase();
  if (lower.startsWith('your_') || lower.startsWith('your-') || lower.includes('placeholder') || lower.includes('change_me') || lower === 'xxxx') {
    return false;
  }
  return true;
};

// Only enable S3 if explicitly requested and VALID real credentials exist
const hasS3Config = Boolean(
  process.env.USE_S3_STORAGE === 'true' &&
  isRealCredential(process.env.AWS_ACCESS_KEY_ID) &&
  isRealCredential(process.env.AWS_SECRET_ACCESS_KEY) &&
  process.env.AWS_REGION &&
  process.env.AWS_S3_BUCKET
);

let s3Client = null;

if (hasS3Config) {
  try {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    console.log('✅ Real Amazon S3 Client initialized.');
  } catch (e) {
    console.warn('⚠️ S3 Client initialization failed:', e.message);
    s3Client = null;
  }
} else {
  console.log('ℹ️ Placeholder/missing S3 keys detected. EC2 Local Disk Storage active (/uploads).');
}

module.exports = { s3Client, hasS3Config: Boolean(s3Client), bucketName: process.env.AWS_S3_BUCKET };
