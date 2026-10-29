import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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

async function packageAndUpload() {
  console.log('=== [1/3] Preparing Production Release Package ===');
  const tempDir = path.resolve(projectRoot, 'temp_release');
  const zipFile = path.resolve(projectRoot, 'campusbite-release.zip');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  if (fs.existsSync(zipFile)) {
    fs.rmSync(zipFile, { force: true });
  }

  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'backend'), { recursive: true });

  // Copy backend source, compiled frontend dist (excluding 16MB raw images), package configs, and environment
  console.log('Copying backend code and compiled frontend assets...');
  execSync(`powershell -Command "Copy-Item -Recurse '${path.join(projectRoot, 'backend', 'src')}' '${path.join(tempDir, 'backend', 'src')}'"`);
  fs.mkdirSync(path.join(tempDir, 'backend', 'public', 'dist', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'backend', 'public', 'uploads'), { recursive: true });
  execSync(`powershell -Command "Copy-Item -Recurse '${path.join(projectRoot, 'backend', 'public', 'dist', 'assets', '*')}' '${path.join(tempDir, 'backend', 'public', 'dist', 'assets')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', 'public', 'dist', 'index.html')}' '${path.join(tempDir, 'backend', 'public', 'dist', 'index.html')}'"`);
  if (fs.existsSync(path.join(projectRoot, 'backend', 'public', 'dist', 'favicon.svg'))) {
    execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', 'public', 'dist', 'favicon.svg')}' '${path.join(tempDir, 'backend', 'public', 'dist', 'favicon.svg')}'"`);
  }
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', 'package.json')}' '${path.join(tempDir, 'backend', 'package.json')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', 'package-lock.json')}' '${path.join(tempDir, 'backend', 'package-lock.json')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'backend', '.env')}' '${path.join(tempDir, 'backend', '.env')}'"`);
  execSync(`powershell -Command "Copy-Item '${path.join(projectRoot, 'ecosystem.config.cjs')}' '${path.join(tempDir, 'ecosystem.config.cjs')}'"`);

  console.log('=== [2/3] Compressing release package ===');
  execSync(`powershell -Command "Compress-Archive -Path '${path.join(tempDir, '*')}' -DestinationPath '${zipFile}' -Force"`);

  const stats = fs.statSync(zipFile);
  console.log(`Package created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  console.log('=== [3/3] Uploading release package to Amazon S3 ===');
  const fileStream = fs.readFileSync(zipFile);
  const s3Key = 'deploy/campusbite-release.zip';

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    Body: fileStream,
    ContentType: 'application/zip'
  }));

  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: s3Key }));
  console.log(`[S3 Upload SUCCESS] s3://${bucket}/${s3Key} (Size: ${head.ContentLength} bytes)`);

  // Cleanup temp files
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(zipFile, { force: true });

  console.log('\n--- Release Package Ready for EC2 Deployment ---');
}

packageAndUpload().catch(err => {
  console.error('[Packaging Error]', err);
  process.exit(1);
});
