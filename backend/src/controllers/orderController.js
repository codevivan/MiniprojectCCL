import { v4 as uuidv4 } from 'uuid';
import { orderRepo } from '../repositories/orderRepo.js';
import { menuRepo } from '../repositories/menuRepo.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { paymentRepo } from '../repositories/paymentRepo.js';
import { settingsRepo } from '../repositories/settingsRepo.js';
import { socketEvents } from '../services/socketService.js';
import { lambdaNotifier } from '../services/lambdaNotifier.js';
import { snsService } from '../services/snsService.js';
import { logger } from '../middleware/logger.js';

export const orderController = {
  /**
   * Create New Order with Backend Price Validation, Concurrency-Safe Token,
   * Idempotency check, and Simulated Payment Association
   */
  async createOrder(req, res) {
    try {
      const student = req.user;
      const { items, paymentMethod, idempotencyKey, paymentDetails } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Your cart is empty. Please select food items to order.'
        });
      }

      if (!['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'].includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment method selected.'
        });
      }

      // Check Canteen Open Status
      const settings = await settingsRepo.getSettings();
      if (settings.isTemporarilyClosed || !settings.isOrderingAvailable) {
        return res.status(403).json({
          success: false,
          error: 'Canteen is currently closed for new orders. Please check opening hours.'
        });
      }

      // Idempotency Check: Prevent duplicate order creation
      if (idempotencyKey) {
        const existingOrder = await orderRepo.getByIdempotencyKey(idempotencyKey);
        if (existingOrder) {
          logger.info(`Idempotent order replay requested for key: ${idempotencyKey}`);
          return res.json({
            success: true,
            isReplay: true,
            order: existingOrder
          });
        }
      }

      // Backend Price Calculation & Availability Verification
      let calculatedSubtotal = 0;
      let maxPrepTime = 10;
      const verifiedItems = [];

      for (const cartItem of items) {
        if (!cartItem.itemId || !cartItem.quantity || cartItem.quantity < 1) {
          return res.status(400).json({
            success: false,
            error: 'Invalid item quantity specified.'
          });
        }

        const dbItem = await menuRepo.getById(cartItem.itemId);
        if (!dbItem) {
          return res.status(400).json({
            success: false,
            error: `Item with ID ${cartItem.itemId} is no longer found on the menu.`
          });
        }

        if (!dbItem.isAvailable) {
          return res.status(400).json({
            success: false,
            error: `Sorry, "${dbItem.name}" is currently sold out and unavailable.`
          });
        }

        const itemSubtotal = dbItem.price * cartItem.quantity;
        calculatedSubtotal += itemSubtotal;

        if (dbItem.prepTimeMinutes && dbItem.prepTimeMinutes > maxPrepTime) {
          maxPrepTime = dbItem.prepTimeMinutes;
        }

        verifiedItems.push({
          itemId: dbItem.itemId,
          name: dbItem.name,
          category: dbItem.category,
          price: dbItem.price,
          quantity: cartItem.quantity,
          subtotal: itemSubtotal,
          imageUrl: dbItem.imageUrl
        });
      }

      const totalAmount = calculatedSubtotal; // Zero extra taxes for college student canteen
      const orderId = `ord_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

      // Generate Concurrency-Safe Sequential Token
      const tokenNumber = await tokenRepo.getNextToken();

      let paymentStatus = 'PENDING';
      let transactionRef = null;

      // Simulated Payment Processing
      if (paymentMethod === 'CASH') {
        paymentStatus = 'PENDING';
      } else {
        // Online Simulation (UPI, CREDIT_CARD, DEBIT_CARD)
        // Basic simulation validation
        if (paymentMethod === 'UPI') {
          if (!paymentDetails?.upiId || !paymentDetails.upiId.includes('@')) {
            return res.status(400).json({
              success: false,
              error: 'Please enter a valid demo UPI ID (e.g., student@okbank).'
            });
          }
        } else if (['CREDIT_CARD', 'DEBIT_CARD'].includes(paymentMethod)) {
          if (!paymentDetails?.cardNumber || paymentDetails.cardNumber.replace(/\s+/g, '').length < 12) {
            return res.status(400).json({
              success: false,
              error: 'Please enter a valid 16-digit demo card number.'
            });
          }
        }

        paymentStatus = 'PAID';
        transactionRef = `SIM_${paymentMethod}_${Date.now()}`;
      }

      // 1. Persist Order in DynamoDB
      const newOrder = await orderRepo.create({
        orderId,
        tokenNumber,
        studentId: student.userId,
        studentName: student.name,
        studentEmail: student.email,
        studentCollegeId: student.studentId,
        items: verifiedItems,
        subtotal: calculatedSubtotal,
        totalAmount,
        paymentMethod,
        paymentStatus,
        orderStatus: 'ORDER_CONFIRMED',
        paymentReference: transactionRef,
        estimatedPrepTime: maxPrepTime,
        idempotencyKey
      });

      // 2. Persist Payment Record in DynamoDB
      const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      await paymentRepo.recordPayment({
        paymentId,
        orderId: newOrder.orderId,
        tokenNumber: newOrder.tokenNumber,
        studentId: student.userId,
        studentName: student.name,
        amount: totalAmount,
        paymentMethod,
        paymentStatus,
        transactionRef: transactionRef || 'CASH_PENDING',
        notes: paymentMethod === 'CASH' 
          ? 'Cash order created. Awaiting student payment at counter.' 
          : `Simulated ${paymentMethod} demo payment successful.`
      });

      // 3. Emit Real-time Socket Event to Owner & Student
      socketEvents.orderCreated(newOrder);

      // 4. Trigger EC2 Native Background Notification & Amazon SNS Order Success Email
      lambdaNotifier.notifyOrderCreated(newOrder).catch(err => {
        logger.warn('Non-blocking local notification error:', { error: err.message });
      });

      if (newOrder.studentEmail) {
        snsService.subscribeEmail(newOrder.studentEmail).catch(() => {});
      }

      snsService.publishOrderCreated(newOrder).catch(err => {
        logger.warn('Non-blocking Amazon SNS order alert error:', { error: err.message });
      });

      logger.info(`Order placed successfully: ${newOrder.orderId} (Token: ${newOrder.tokenNumber}) - ₹${newOrder.totalAmount} via ${newOrder.paymentMethod}`);

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        order: newOrder
      });
    } catch (err) {
      logger.error('Order creation failed:', { error: err.message });
      return res.status(500).json({
        success: false,
        error: 'Order could not be processed due to a server error. Please try again.'
      });
    }
  },

  /**
   * Get Specific Order by ID
   */
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await orderRepo.getById(id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      // Security check: Student can only view their own order; Owner can view any
      if (req.user.role === 'STUDENT' && order.studentId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: You do not have permission to view this order.'
        });
      }

      return res.json({ success: true, order });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve order details.' });
    }
  },

  /**
   * Get Student's Own Order History
   */
  async getMyOrders(req, res) {
    try {
      const orders = await orderRepo.getStudentOrders(req.user.userId);
      return res.json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve your orders.' });
    }
  },

  /**
   * Owner: Update Order Status
   * Valid Transitions: ORDER_CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED / CANCELLED
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['ORDER_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const existing = await orderRepo.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      // Persist to DynamoDB first
      const updatedOrder = await orderRepo.updateOrderStatus(id, status);

      // Emit real-time socket update after successful persistence (UI updates live without sending email spam)
      socketEvents.orderStatusUpdated(updatedOrder);

      logger.info(`Owner updated order ${id} (Token: ${existing.tokenNumber}) status: ${existing.orderStatus} -> ${status}`);

      return res.json({
        success: true,
        message: `Order status updated to ${status}.`,
        order: updatedOrder
      });
    } catch (err) {
      logger.error('Failed to update order status:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to update order status.' });
    }
  },

  /**
   * Owner: Verify Cash Payment
   */
  async verifyCashPayment(req, res) {
    try {
      const { id } = req.params;
      const existing = await orderRepo.getById(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      if (existing.paymentMethod !== 'CASH') {
        return res.status(400).json({
          success: false,
          error: 'Only CASH orders can be manually verified at the counter.'
        });
      }

      if (existing.paymentStatus === 'PAID') {
        return res.status(400).json({
          success: false,
          error: 'This order is already marked as PAID.'
        });
      }

      // Persist verification in Order and Payment repositories
      const updatedOrder = await orderRepo.verifyCashPayment(id, req.user.email);
      await paymentRepo.verifyCashPayment(id, req.user.email);

      // Broadcast update
      socketEvents.paymentVerified(updatedOrder);

      logger.info(`Owner verified cash payment for Order ${id} (Token: ${existing.tokenNumber}) - ₹${existing.totalAmount}`);

      return res.json({
        success: true,
        message: 'Cash payment verified successfully.',
        order: updatedOrder
      });
    } catch (err) {
      logger.error('Failed to verify cash payment:', { error: err.message });
      return res.status(500).json({ success: false, error: 'Failed to verify payment.' });
    }
  }
};
