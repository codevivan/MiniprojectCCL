import { PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamoClient.js';
import { config } from '../config/env.js';

const TABLE_NAME = config.aws.tables.suggestions;

export const suggestionRepo = {
  async create(sugg) {
    const now = new Date().toISOString();
    const item = {
      suggestionId: sugg.suggestionId,
      studentId: sugg.studentId,
      studentName: sugg.studentName,
      studentEmail: sugg.studentEmail || '',
      category: sugg.category,
      subject: sugg.subject.trim(),
      description: sugg.description.trim(),
      rating: sugg.rating ? Number(sugg.rating) : null,
      status: 'NEW', // NEW, REVIEWED, IMPLEMENTED
      adminResponse: null,
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

  async getStudentSuggestions(studentId) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'studentId = :sid',
      ExpressionAttributeValues: { ':sid': studentId }
    });
    const res = await dynamoDb.send(command);
    return (res.Items || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getAll({ status, category } = {}) {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });
    const res = await dynamoDb.send(command);
    let items = res.Items || [];

    if (status && status !== 'ALL') {
      items = items.filter(s => s.status === status);
    }
    if (category && category !== 'ALL') {
      items = items.filter(s => s.category === category);
    }

    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateStatus(suggestionId, status, adminResponse = null) {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { suggestionId },
      UpdateExpression: 'SET #st = :st, adminResponse = :ar, updatedAt = :u',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':st': status,
        ':ar': adminResponse,
        ':u': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const res = await dynamoDb.send(command);
    return res.Attributes;
  }
};
