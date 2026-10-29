import express from 'express';
import { settingsController } from '../controllers/settingsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', settingsController.getSettings);
router.put('/', authenticate, requireRole('OWNER'), settingsController.updateSettings);

export default router;
