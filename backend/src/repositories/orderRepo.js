import { 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand, 
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamoClient.js';
import { config } from '../config/env.js';

const TABLE_NAME = config.aws.tables.orders;

export const orderRepo = {
  async create(order) {
    const now = new Date().toISOString();
    const item = {
      orderId: order.orderId,
      tokenNumber: order.tokenNumber,
      studentId: order.studentId,
      studentName: order.studentName || 'Student',
      studentEmail: order.studentEmail || '',
      studentCollegeId: order.studentCollegeId || '',
      items: order.items,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount || 0),
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod, // UPI, CREDIT_CARD, DEBIT_CARD, CASH
      paymentStatus: order.paymentStatus, // PAID, PENDING, FAILED
      orderStatus: order.orderStatus || 'ORDER_CONFIRMED', // ORDER_CONFIRMED, PREPARING, READY_FOR_PICKUP, COMPLETED, CANCELLED
      paymentReference: order.paymentReference || null,
      estimatedPrepTime: order.estimatedPrepTime || 15,
      idempotencyKey: order.idempotencyKey || null,
      createdAt: order.createdAt || now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(orderId)'
    });

    await dynamoDb.send(command);
    return item;
  },

  async getById(orderId) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { orderId }
    });
    const res = await dynamoDb.send(command);
    return res.Item || null;
  },

  async getByIdempotencyKey(key) {
    if (!key) return null;
    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'idempotencyKey = :k',
      ExpressionAttributeValues: { ':k': key }
    });
    const res = await dynamoDb.send(scanCmd);
    return res.Items && res.Items.length > 0 ? res.Items[0] : null;
  },

  async getStudentOrders(studentId) {
    // Attempt Query on StudentOrdersIndex
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'StudentOrdersIndex',
        KeyConditionExpression: 'studentId = :sid',
        ExpressionAttributeValues: { ':sid': studentId },
        ScanIndexForward: false // newest first
      });
      const res = await dynamoDb.send(command);
      if (res.Items && res.Items.length > 0) {
        return res.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } catch {
      // Fallback to scan if index not created in AWS yet
    }

    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'studentId = :sid',
      ExpressionAttributeValues: { ':sid': studentId }
    });
    const scanRes = await dynamoDb.send(scanCmd);
    return (scanRes.Items || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getAllOrders({ status, paymentStatus, date } = {}) {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });

    const res = await dynamoDb.send(command);
    let items = res.Items || [];

    if (status && status !== 'ALL') {
      items = items.filter(o => o.orderStatus === status);
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      items = items.filter(o => o.paymentStatus === paymentStatus);
    }

    if (date) {
      items = items.filter(o => o.createdAt.startsWith(date));
    }

    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getActiveOrders() {
    const all = await this.getAllOrders();
    return all.filter(o => ['ORDER_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.orderStatus));
  },

  async updateOrderStatus(orderId, newStatus) {
    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'SET orderStatus = :s, updatedAt = :u',
      ExpressionAttributeValues: {
        ':s': newStatus,
        ':u': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const res = await dynamoDb.send(command);
    return res.Attributes;
  },

  async verifyCashPayment(orderId, verifiedBy) {
    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'SET paymentStatus = :p, cashVerifiedAt = :v, cashVerifiedBy = :vb, updatedAt = :u',
      ExpressionAttributeValues: {
        ':p': 'PAID',
        ':v': now,
        ':vb': verifiedBy,
        ':u': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const res = await dynamoDb.send(command);
    return res.Attributes;
  },

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAllOrders();

    const totalOrders = all.length;
    const activeOrders = all.filter(o => ['ORDER_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.orderStatus)).length;
    const completedOrders = all.filter(o => o.orderStatus === 'COMPLETED').length;
    const cancelledOrders = all.filter(o => o.orderStatus === 'CANCELLED').length;

    const todayOrders = all.filter(o => o.createdAt.startsWith(today));
    const todayOrderCount = todayOrders.length;

    // Verified revenue: only count orders where paymentStatus === 'PAID'
    const todayRevenue = todayOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const allTimeVerifiedRevenue = all
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const pendingCashPaymentsCount = all.filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING').length;

    // Popular items calculation
    const itemMap = {};
    for (const ord of all) {
      if (ord.orderStatus !== 'CANCELLED' && Array.isArray(ord.items)) {
        for (const it of ord.items) {
          if (!itemMap[it.name]) {
            itemMap[it.name] = { name: it.name, count: 0, revenue: 0, category: it.category };
          }
          itemMap[it.name].count += it.quantity || 1;
          itemMap[it.name].revenue += (it.price || 0) * (it.quantity || 1);
        }
      }
    }

    const popularItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      todayOrderCount,
      todayRevenue,
      allTimeVerifiedRevenue,
      pendingCashPaymentsCount,
      popularItems
    };
  }
};
