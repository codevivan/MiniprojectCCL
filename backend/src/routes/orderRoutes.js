import express from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Student order actions
router.post('/', authenticate, requireRole('STUDENT'), orderController.createOrder);
router.get('/my-orders', authenticate, requireRole('STUDENT'), orderController.getMyOrders);

// View order (Owner or student owner of the order)
router.get('/:id', authenticate, orderController.getOrder);

// Owner actions
router.patch('/:id/status', authenticate, requireRole('OWNER'), orderController.updateStatus);
router.patch('/:id/verify-cash', authenticate, requireRole('OWNER'), orderController.verifyCashPayment);

export default router;
