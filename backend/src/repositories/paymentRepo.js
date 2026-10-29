import { PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamoClient.js';
import { config } from '../config/env.js';

const TABLE_NAME = config.aws.tables.payments;

export const paymentRepo = {
  async recordPayment(payment) {
    const now = new Date().toISOString();
    const item = {
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      tokenNumber: payment.tokenNumber,
      studentId: payment.studentId,
      studentName: payment.studentName,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus, // 'PAID' or 'PENDING'
      transactionRef: payment.transactionRef || `DEMO_TXN_${Date.now()}`,
      isSimulated: true,
      notes: payment.notes || 'Simulated Demo Payment for College Project',
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    });

    await dynamoDb.send(command);
    return item;
  },

  async getById(paymentId) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { paymentId }
    });
    const res = await dynamoDb.send(command);
    return res.Item || null;
  },

  async getAll({ method, status } = {}) {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });
    const res = await dynamoDb.send(command);
    let items = res.Items || [];

    if (method && method !== 'ALL') {
      items = items.filter(p => p.paymentMethod === method);
    }

    if (status && status !== 'ALL') {
      items = items.filter(p => p.paymentStatus === status);
    }

    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async verifyCashPayment(orderId, verifiedBy) {
    // Find payment record corresponding to orderId
    const all = await this.getAll();
    const pay = all.find(p => p.orderId === orderId);
    if (!pay) return null;

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { paymentId: pay.paymentId },
      UpdateExpression: 'SET paymentStatus = :p, verifiedBy = :vb, updatedAt = :u',
      ExpressionAttributeValues: {
        ':p': 'PAID',
        ':vb': verifiedBy,
        ':u': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const res = await dynamoDb.send(command);
    return res.Attributes;
  }
};
