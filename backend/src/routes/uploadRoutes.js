import express from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer for in-memory processing (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

/**
 * Image Upload Endpoints (Owner Only)
 * Both /food-image (specification) and /image (legacy frontend compatibility) are supported.
 */
router.post('/food-image', authenticate, requireRole('OWNER'), upload.single('image'), uploadController.uploadFoodImage);
router.post('/image', authenticate, requireRole('OWNER'), upload.single('image'), uploadController.uploadFoodImage);

/**
 * Image Retrieval Proxy
 * GET /api/uploads/image?key=food-items/...
 * Streams images securely from private S3 bucket or local fallback
 */
router.get('/image', uploadController.getImage);

/**
 * Presigned URL Generator (Owner Only)
 * GET /api/uploads/presigned-url?key=food-items/...
 */
router.get('/presigned-url', authenticate, requireRole('OWNER'), uploadController.getPresignedUrl);

export default router;
