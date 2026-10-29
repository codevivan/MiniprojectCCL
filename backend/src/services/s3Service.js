import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';

/**
 * Amazon S3 Service for CampusBite Food Images
 * Region: eu-north-1 (Stockholm)
 * Bucket: campusbite-food-images-2026 (Private Bucket)
 *
 * Uses the AWS SDK v3 Default Credential Provider Chain:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. Shared credentials file (~/.aws/credentials)
 * 3. IAM Role for Amazon EC2 (Instance Profile)
 */

const s3Region = config.aws.s3.region || process.env.AWS_REGION || 'eu-north-1';
const s3Bucket = config.aws.s3.bucket || process.env.S3_BUCKET_NAME || 'campusbite-food-images-2026';

// Initialize S3 Client with region.
// If explicit credentials are provided in env, use them; otherwise default credential provider chain resolves.
const clientConfig = {
  region: s3Region
};

if (config.aws.accessKeyId && config.aws.secretAccessKey) {
  clientConfig.credentials = {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  };
}

export const s3Client = new S3Client(clientConfig);

export const s3Service = {
  region: s3Region,
  bucket: s3Bucket,

  /**
   * Check whether S3 has required configuration
   */
  isConfigured() {
    return Boolean(s3Bucket && s3Region);
  },

  /**
   * Upload food image to private S3 bucket
   *
   * @param {Object} options
   * @param {Buffer} options.buffer - Raw image file buffer
   * @param {string} options.originalname - Original uploaded file name
   * @param {string} options.mimetype - Image MIME type (image/jpeg, image/png, image/webp)
   * @returns {Promise<{ s3Key: string, bucket: string, region: string, s3Uri: string, proxyUrl: string }>}
   */
  async uploadFoodImage({ buffer, originalname, mimetype }) {
    if (!this.isConfigured()) {
      const err = new Error('S3_NOT_CONFIGURED: S3_BUCKET_NAME or AWS_REGION is missing.');
      err.code = 'S3_NOT_CONFIGURED';
      throw err;
    }

    const ext = (path.extname(originalname) || '.jpg').toLowerCase();
    const safeKey = `food-items/${uuidv4().slice(0, 8)}-${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: safeKey,
      Body: buffer,
      ContentType: mimetype,
      Metadata: {
        'uploaded-by': 'CampusBite-Owner',
        'original-filename': path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_')
      }
    });

    try {
      await s3Client.send(command);
      logger.info(`[S3] Food image uploaded successfully to s3://${s3Bucket}/${safeKey}`);

      const s3Uri = `s3://${s3Bucket}/${safeKey}`;
      const proxyUrl = `/api/uploads/image?key=${encodeURIComponent(safeKey)}`;

      return {
        s3Key: safeKey,
        bucket: s3Bucket,
        region: s3Region,
        s3Uri,
        proxyUrl
      };
    } catch (error) {
      logger.error(`[S3] Upload failed for ${safeKey}:`, { error: error.message, code: error.name });
      throw error;
    }
  },

  /**
   * Generate short-lived presigned GET URL for secure, private browser access
   *
   * @param {string} key - S3 object key (e.g. food-items/...)
   * @param {number} expiresIn - Expiration in seconds (default: 3600 = 1 hour)
   * @returns {Promise<string>} Presigned URL
   */
  async getPresignedGetUrl(key, expiresIn = 3600) {
    if (!key || typeof key !== 'string') {
      throw new Error('Valid S3 key required.');
    }

    // Sanitize key: ensure no directory traversal and proper prefix
    const normalizedKey = key.replace(/^\/+/, '');
    if (!normalizedKey.startsWith('food-items/')) {
      throw new Error('Access denied: key must reside within food-items/ prefix.');
    }

    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: normalizedKey
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  },

  /**
   * Retrieve object stream from private S3 bucket for backend image proxy
   *
   * @param {string} key - S3 object key
   * @returns {Promise<{ stream: ReadableStream, contentType: string, contentLength: number }>}
   */
  async getObjectStream(key) {
    if (!key || typeof key !== 'string') {
      const err = new Error('Invalid key specified');
      err.statusCode = 400;
      throw err;
    }

    const normalizedKey = key.replace(/^\/+/, '');
    if (normalizedKey.includes('..') || !normalizedKey.startsWith('food-items/')) {
      const err = new Error('Forbidden object path traversal');
      err.statusCode = 403;
      throw err;
    }

    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: normalizedKey
    });

    const response = await s3Client.send(command);
    return {
      stream: response.Body,
      contentType: response.ContentType || 'image/jpeg',
      contentLength: response.ContentLength
    };
  }
};
