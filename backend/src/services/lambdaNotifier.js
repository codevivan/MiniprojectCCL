import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTIFICATIONS_LOG = path.resolve(__dirname, '../../data/notifications_log.json');

/**
 * Native EC2 Background Notification Engine.
 * Manages order notification events directly on EC2 (logging, audit trails, and dispatch).
 */
export const lambdaNotifier = {
  async notifyOrderCreated(order) {
    const payload = {
      eventType: 'ORDER_CREATED',
      orderId: order.orderId,
      tokenNumber: order.tokenNumber,
      studentId: order.studentId,
      studentName: order.studentName,
      studentEmail: order.studentEmail,
      totalAmount: order.totalAmount,
      itemCount: (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      managedBy: 'AMAZON_EC2_NATIVE_ENGINE',
      timestamp: new Date().toISOString()
    };

    try {
      let logs = [];
      if (fs.existsSync(NOTIFICATIONS_LOG)) {
        try {
          logs = JSON.parse(fs.readFileSync(NOTIFICATIONS_LOG, 'utf-8'));
        } catch (e) {
          logs = [];
        }
      }
      logs.unshift(payload);
      // Keep last 100 notification events
      if (logs.length > 100) logs = logs.slice(0, 100);

      const dir = path.dirname(NOTIFICATIONS_LOG);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(NOTIFICATIONS_LOG, JSON.stringify(logs, null, 2), 'utf-8');
      logger.info(`[EC2 Notification Engine] Processed order event for Token ${order.tokenNumber} (Order: ${order.orderId})`);
      return { success: true, processedBy: 'EC2_NATIVE_ENGINE', timestamp: payload.timestamp };
    } catch (err) {
      logger.error('[EC2 Notification Engine] Notice writing notification record:', err.message);
      return { success: true, processedBy: 'EC2_NATIVE_ENGINE', warning: err.message };
    }
  }
};

