import { PublishCommand, SubscribeCommand } from '@aws-sdk/client-sns';
import { snsClient } from '../config/aws.js';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';

export const snsService = {
  /**
   * Automatically subscribes a user's email to the Amazon SNS topic
   * so they receive instant order confirmation email notifications.
   * AWS SNS automatically dispatches a subscription confirmation email.
   */
  async subscribeEmail(email) {
    if (!email || !config.aws.sns.topicArn) {
      return { success: false, reason: 'INVALID_EMAIL_OR_TOPIC' };
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, reason: 'INVALID_EMAIL_FORMAT' };
    }

    try {
      const command = new SubscribeCommand({
        TopicArn: config.aws.sns.topicArn,
        Protocol: 'email',
        Endpoint: cleanEmail,
        ReturnSubscriptionArn: true
      });

      const res = await snsClient.send(command);
      logger.info(`[Amazon SNS] Subscribed ${cleanEmail} to topic (SubscriptionArn: ${res.SubscriptionArn || 'PendingConfirmation'})`);
      return { success: true, subscriptionArn: res.SubscriptionArn };
    } catch (err) {
      logger.warn(`[Amazon SNS Notice] Failed to auto-subscribe email ${cleanEmail}: ${err.message}`);
      return { success: false, error: err.message };
    }
  },

  /**
   * Publishes an Order Success receipt to Amazon SNS
   * Dispatches formatted confirmation email to student & canteen subscribers
   */
  async publishOrderCreated(order) {
    if (!config.aws.sns.topicArn) {
      return { success: false, reason: 'SNS_TOPIC_NOT_CONFIGURED' };
    }

    const itemLines = (order.items || [])
      .map((it, idx) => `  ${idx + 1}. ${it.name} x${it.quantity || 1}  -  ₹${it.subtotal || it.price}`)
      .join('\n');

    const orderDate = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const trackingUrl = `http://16.16.207.70/track/${order.orderId}`;

    const subject = `[CampusBite] Order Placed Successfully! Token #${order.tokenNumber} (₹${order.totalAmount})`;

    const message = 
`============================================================
           CAMPUSBITE - CANTEEN ORDER CONFIRMATION
      Fr. Conceicao Rodrigues College of Engineering (CRCE)
============================================================

Hello ${order.studentName || 'Student'},

Your canteen order has been placed successfully and sent to the kitchen!

------------------------------------------------------------
ORDER & PICKUP DETAILS:
------------------------------------------------------------
Token Number      : #${order.tokenNumber}
Order Reference   : ${order.orderId}
Order Time        : ${orderDate}
Payment Method    : ${order.paymentMethod || 'UPI'} (${order.paymentStatus || 'PAID'})
Estimated Pickup  : ~${order.estimatedPrepTime || 10} minutes

------------------------------------------------------------
ITEMS ORDERED:
------------------------------------------------------------
${itemLines || '  1. Hot Meal Selection x1'}

------------------------------------------------------------
TOTAL AMOUNT PAID : ₹${order.totalAmount}
------------------------------------------------------------

PICKUP INSTRUCTIONS:
1. Track live order status on the CampusBite web app:
   ${trackingUrl}
2. When your token status shows "READY FOR PICKUP",
   head to the cafeteria food counter.
3. Present Token #${order.tokenNumber} to collect your fresh food!

Thank you for choosing CampusBite!
CampusBite Smart Cafeteria Pre-Order System | Bandra, Mumbai
============================================================`;

    try {
      const command = new PublishCommand({
        TopicArn: config.aws.sns.topicArn,
        Subject: subject,
        Message: message,
        MessageAttributes: {
          EventType: { DataType: 'String', StringValue: 'ORDER_SUCCESSFUL' },
          TokenNumber: { DataType: 'String', StringValue: String(order.tokenNumber) },
          PaymentMethod: { DataType: 'String', StringValue: String(order.paymentMethod || 'UPI') },
          TotalAmount: { DataType: 'Number', StringValue: String(order.totalAmount) },
          StudentEmail: { DataType: 'String', StringValue: String(order.studentEmail || '') }
        }
      });

      const res = await snsClient.send(command);
      logger.info(`[Amazon SNS] Successfully published Order Success email alert for Token #${order.tokenNumber} (MessageId: ${res.MessageId})`);
      return { success: true, messageId: res.MessageId };
    } catch (err) {
      logger.warn(`[Amazon SNS Notice] Failed to publish order success alert: ${err.message}`);
      return { success: false, error: err.message };
    }
  },

  /**
   * Publishes an order status update event (silent - status updates stay in-app via WebSocket
   * to avoid email inbox clutter, as email is strictly reserved for order success)
   */
  async publishOrderStatusUpdated(order, newStatus) {
    // Only log internally; email is reserved strictly for successful order placement
    logger.debug(`[Amazon SNS] In-app status transition: Token #${order.tokenNumber} -> ${newStatus}`);
    return { success: true, skipped: true, reason: 'STATUS_EMAIL_SUPPRESSED' };
  }
};
