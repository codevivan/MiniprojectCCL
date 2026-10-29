import { 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand, 
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamoClient.js';
import { config } from '../config/env.js';

const TABLE_NAME = config.aws.tables.users;

export const userRepo = {
  async create(user) {
    const item = {
      userId: user.userId,
      email: user.email.toLowerCase().trim(),
      name: user.name.trim(),
      studentId: user.studentId ? user.studentId.trim() : null,
      canteenName: user.canteenName ? user.canteenName.trim() : null,
      role: user.role, // 'STUDENT' or 'OWNER'
      passwordHash: user.passwordHash,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE'
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(userId)'
    });

    await dynamoDb.send(command);
    return item;
  },

  async getById(userId) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId }
    });
    const res = await dynamoDb.send(command);
    return res?.Item || null;
  },

  async getByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail
        }
      });

      const res = await dynamoDb.send(command);
      if (res && res.Items && res.Items.length > 0) {
        const found = res.Items.find(u => u.email && u.email.toLowerCase().trim() === normalizedEmail);
        if (found) return found;
      }
    } catch {
      // Fallback to scan if GSI is not available in local mode
    }

    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME
    });
    const scanRes = await dynamoDb.send(scanCmd);
    const items = scanRes?.Items || [];
    return items.find(u => u.email && u.email.toLowerCase().trim() === normalizedEmail) || null;
  },

  async getByStudentId(studentId) {
    if (!studentId) return null;
    const cleanId = studentId.trim().toUpperCase();

    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME
    });
    const scanRes = await dynamoDb.send(scanCmd);
    const items = scanRes.Items || [];

    return items.find(u => 
      u.role === 'STUDENT' && 
      u.studentId && 
      u.studentId.trim().toUpperCase() === cleanId
    ) || null;
  },

  async findStudentByEmailOrId(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim();

    // Check by email first
    const byEmail = await this.getByEmail(clean);
    if (byEmail) {
      return byEmail;
    }

    // Check by student ID
    return await this.getByStudentId(clean);
  },

  async getOwnerCount() {
    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#r = :role',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':role': 'OWNER' }
    });
    const res = await dynamoDb.send(scanCmd);
    return res.Items ? res.Items.length : 0;
  },

  async getOwner() {
    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#r = :role',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':role': 'OWNER' }
    });
    const res = await dynamoDb.send(scanCmd);
    return res.Items && res.Items.length > 0 ? res.Items[0] : null;
  },

  async listStudents() {
    const scanCmd = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#r = :role',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':role': 'STUDENT' }
    });
    const res = await dynamoDb.send(scanCmd);
    return (res.Items || []).map(u => ({
      userId: u.userId,
      name: u.name,
      studentId: u.studentId,
      email: u.email,
      createdAt: u.createdAt,
      status: u.status
    }));
  },

  async updatePassword(userId, newPasswordHash) {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: 'SET passwordHash = :p, updatedAt = :u',
      ExpressionAttributeValues: {
        ':p': newPasswordHash,
        ':u': new Date().toISOString()
      }
    });
    await dynamoDb.send(command);
    return true;
  }
};
