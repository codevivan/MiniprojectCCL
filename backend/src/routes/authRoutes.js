import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Student Authentication
router.post('/student/register', authController.studentRegister);
router.post('/student/login', authController.studentLogin);

// Owner Authentication
router.get('/owner/status', authController.checkOwnerStatus);
router.post('/owner/register', authController.ownerRegister);
router.post('/owner/setup', authController.ownerRegister); // backward-compatible alias
router.post('/owner/login', authController.ownerLogin);

// Current User Profile
router.get('/me', authenticate, authController.getMe);

export default router;
