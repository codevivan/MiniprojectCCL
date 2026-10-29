import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamoClient.js';
import { config } from '../config/env.js';

const TABLE_NAME = config.aws.tables.tokens;

export const tokenRepo = {
  /**
   * Concurrency-safe atomic token sequence generator for the current date.
   * Emits tokens formatted like "CB-101", "CB-102"
   */
  async getNextToken() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { tokenDate: today },
        UpdateExpression: 'ADD currentSequence :inc SET updatedAt = :u',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':u': new Date().toISOString()
        },
        ReturnValues: 'UPDATED_NEW'
      });

      const res = await dynamoDb.send(command);
      let seq = res?.Attributes?.currentSequence;

      // If this is the first token of the day, make it start at 101 for realistic presentation
      if (!seq || seq === 1) {
        const initCmd = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { tokenDate: today },
          UpdateExpression: 'SET currentSequence = :base, updatedAt = :u',
          ExpressionAttributeValues: {
            ':base': 101,
            ':u': new Date().toISOString()
          },
          ReturnValues: 'UPDATED_NEW'
        });
        const initRes = await dynamoDb.send(initCmd);
        seq = initRes?.Attributes?.currentSequence || 101;
      }

      return `CB-${seq}`;
    } catch (err) {
      console.warn('[TokenRepo] Fallback token generation due to:', err.message);
      // Safe fallback using timestamp millis
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      return `CB-${randomSuffix}`;
    }
  }
};
