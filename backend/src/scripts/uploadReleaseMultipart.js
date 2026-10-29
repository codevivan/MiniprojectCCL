import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

async function uploadRelease() {
  console.log('=== [1/3] Packaging Production Code ===');
  const tempDir = path.resolve(projectRoot, 'temp_release');
  const zipFile = path.resolve(projectRoot, 'campusbite-release.zip');

  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  if (fs.existsSync(zipFile)) fs.rmSync(zipFile, { force: true });

  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'backend'), { recursive: true });

  execSync(`powershell -Command "Copy-Item -Recurse '${path.join(projectRoot, 'backend', 'src')}' '${path.join(tempDir, 'backend', 'src')}'"`);
  fs.mkdirSync(path.join(tempDir, 'backend', 'public', 'uploads'), { recursive: true });
  execSync(`powershell -Command "Copy-Item -Recurse '${path.join(projectRoot, 'backend', 'public', 'dist')}' '${path.join(tempDir, 'backend', 'public', 'dist')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', 'package.json')}' '${path.join(tempDir, 'backend', 'package.json')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', 'package-lock.json')}' '${path.join(tempDir, 'backend', 'package-lock.json')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', '.env')}' '${path.join(tempDir, 'backend', '.env')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'ecosystem.config.cjs')}' '${path.join(tempDir, 'ecosystem.config.cjs')}'"`);

  console.log('=== [2/3] Compressing to campusbite-release.zip ===');
  execSync(`powershell -Command "Compress-Archive -Path '${path.join(tempDir, '*')}' -DestinationPath '${zipFile}' -Force"`);

  const stats = fs.statSync(zipFile);
  console.log(`Package Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  console.log('=== [3/3] Uploading via S3 Multipart Upload ===');
  const fileStream = fs.createReadStream(zipFile);
  const parallelUpload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: 'deploy/campusbite-release.zip',
      Body: fileStream,
      ContentType: 'application/zip'
    },
    partSize: 5 * 1024 * 1024,
    queueSize: 4
  });

  parallelUpload.on('httpUploadProgress', (progress) => {
    const pct = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
    console.log(`Uploaded: ${(progress.loaded / 1024 / 1024).toFixed(2)} MB (${pct}%)`);
  });

  const result = await parallelUpload.done();
  console.log('[S3 SUCCESS] Release uploaded to:', result.Location || `s3://${bucket}/deploy/campusbite-release.zip`);

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(zipFile, { force: true });
}

uploadRelease().catch(err => {
  console.error('[Upload Error]', err);
  process.exit(1);
});
