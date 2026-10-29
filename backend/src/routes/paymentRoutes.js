import express from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireRole('OWNER'), paymentController.getPaymentHistory);

export default router;
