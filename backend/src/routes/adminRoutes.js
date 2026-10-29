import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireRole('OWNER'));

router.get('/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/active-orders', adminController.getActiveOrders);
router.get('/all-orders', adminController.getAllOrders);
router.get('/students', adminController.getStudents);

export default router;
