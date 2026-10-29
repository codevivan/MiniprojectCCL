import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { s3Service } from '../services/s3Service.js';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../public/uploads');

// Ensure local uploads directory exists for fallback
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadController = {
  /**
   * Upload Food Image (Owner only)
   *
   * Accepts: multipart/form-data with field 'image'
   * Validates: File format (JPEG, PNG, WebP) and size (< 5MB)
   * Target: Amazon S3 (eu-north-1, campusbite-food-images-2026)
   * Fallback: Local /public/uploads/ if AWS credentials or bucket pending
   */
  async uploadFoodImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file uploaded. Please select a valid JPEG, PNG, or WebP image.'
        });
      }

      const file = req.file;

      // 1. Strict MIME type validation
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported image format (${file.mimetype}). Only JPEG, PNG, and WebP images are allowed.`
        });
      }

      // 2. Strict file size validation
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          error: 'Image file size exceeds the 5MB limit. Please compress or select a smaller image.'
        });
      }

      // 3. Attempt Amazon S3 upload first
      try {
        const s3Result = await s3Service.uploadFoodImage({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype
        });

        return res.status(201).json({
          success: true,
          storageProvider: 'AMAZON_S3',
          region: s3Result.region,
          bucket: s3Result.bucket,
          imageKey: s3Result.s3Key,
          s3Key: s3Result.s3Key,
          imageUrl: s3Result.proxyUrl, // Secure proxy URL that streams private S3 image
          message: 'Food image uploaded successfully to Amazon S3.'
        });
      } catch (s3Error) {
        // Handle S3 failure gracefully with clear diagnostics
        const isAuthOrConfigIssue = [
          'CredentialsProviderError',
          'AccessDenied',
          'NoSuchBucket',
          'InvalidAccessKeyId',
          'SignatureDoesNotMatch',
          'S3_NOT_CONFIGURED'
        ].includes(s3Error.name || s3Error.code);

        logger.warn(`[S3 Upload] S3 unavailable (${s3Error.name || s3Error.message}). Utilizing local fallback.`);

        // Fallback to local storage so application never breaks during offline demo or before AWS setup
        const fileExt = (path.extname(file.originalname) || '.jpg').toLowerCase();
        const localFileName = `food-${uuidv4().slice(0, 8)}-${Date.now()}${fileExt}`;
        const localFilePath = path.join(LOCAL_UPLOADS_DIR, localFileName);

        fs.writeFileSync(localFilePath, file.buffer);
        const localUrl = `/uploads/${localFileName}`;

        return res.status(201).json({
          success: true,
          storageProvider: 'LOCAL_FALLBACK',
          imageKey: `food-items/${localFileName}`,
          s3Key: `food-items/${localFileName}`,
          imageUrl: localUrl,
          warning: isAuthOrConfigIssue
            ? `AWS S3 connection pending (${s3Error.name || s3Error.message}). Image saved locally.`
            : undefined,
          message: 'Image uploaded successfully.'
        });
      }
    } catch (err) {
      logger.error('[Upload] Unexpected upload failure:', { error: err.message });
      return res.status(500).json({
        success: false,
        error: 'Failed to process image upload. Please try again.'
      });
    }
  },

  /**
   * Secure Image Retrieval Proxy
   * Streams private food images from S3 or local uploads
   * Endpoint: GET /api/uploads/image?key=food-items/...
   */
  async getImage(req, res) {
    try {
      const key = req.query.key || req.params.key;
      if (!key) {
        return res.status(400).json({ success: false, error: 'Query parameter "key" is required.' });
      }

      // Security check: Prevent path traversal
      const normalizedKey = key.replace(/^\/+/, '');
      if (normalizedKey.includes('..') || (!normalizedKey.startsWith('food-items/') && !normalizedKey.startsWith('uploads/'))) {
        return res.status(403).json({ success: false, error: 'Invalid or forbidden image key.' });
      }

      // 1. Try S3 Stream
      try {
        const { stream, contentType, contentLength } = await s3Service.getObjectStream(normalizedKey);
        res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
        return stream.pipe(res);
      } catch (s3Error) {
        // If not in S3, check local uploads directory
        const localName = path.basename(normalizedKey);
        const localPath = path.join(LOCAL_UPLOADS_DIR, localName);
        if (fs.existsSync(localPath)) {
          return res.sendFile(localPath);
        }

        return res.status(404).json({
          success: false,
          error: 'Image not found in S3 bucket or local storage.'
        });
      }
    } catch (err) {
      logger.error('[S3 Stream] Error serving image:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to retrieve image.' });
    }
  },

  /**
   * Generate Presigned GET URL for private S3 images
   * Endpoint: GET /api/uploads/presigned-url?key=food-items/...
   */
  async getPresignedUrl(req, res) {
    try {
      const key = req.query.key;
      if (!key) {
        return res.status(400).json({ success: false, error: 'Query parameter "key" is required.' });
      }

      const presignedUrl = await s3Service.getPresignedGetUrl(key, 3600);
      return res.json({
        success: true,
        key,
        presignedUrl,
        expiresInSeconds: 3600
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: `Failed to generate presigned URL: ${err.message}`
      });
    }
  }
};
