const { S3Client } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config();

const hasS3Config = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_S3_BUCKET
);

let s3Client = null;

if (hasS3Config) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  console.log('✅ Amazon S3 Client initialized.');
} else {
  console.warn('⚠️ Amazon S3 credentials missing. File uploads will fallback to local storage or URL references.');
}

module.exports = { s3Client, hasS3Config, bucketName: process.env.AWS_S3_BUCKET };
