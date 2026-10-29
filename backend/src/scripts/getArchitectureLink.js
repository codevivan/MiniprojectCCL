import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

const credentials = (process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY) ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.TEST_AWS_SECRET
} : undefined;

const region = process.env.AWS_REGION || 'eu-north-1';
const bucket = process.env.S3_BUCKET_NAME || 'campusbite-food-images-2026';
const s3 = new S3Client({ region, credentials });

async function uploadAndGetUrl() {
  const imgPath = path.resolve(projectRoot, 'campusbite_architecture.jpg');
  if (!fs.existsSync(imgPath)) {
    throw new Error('Image not found at ' + imgPath);
  }

  const fileData = fs.readFileSync(imgPath);
  const key = 'info/campusbite_architecture.jpg';

  console.log(`Uploading ${imgPath} to s3://${bucket}/${key}...`);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileData,
    ContentType: 'image/jpeg'
  }));

  // Generate 7-day presigned download link
  const getCmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: 'attachment; filename="CampusBite_Architecture.jpg"'
  });

  const presignedUrl = await getSignedUrl(s3, getCmd, { expiresIn: 604800 });
  console.log('\n--- ARCHITECTURE DOWNLOAD LINK ---');
  console.log(presignedUrl);
  console.log('----------------------------------\n');
}

uploadAndGetUrl().catch(console.error);
