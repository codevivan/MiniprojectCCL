import { CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { rawDynamoClient } from '../config/aws.js';
import { config } from '../config/env.js';

const tables = [
  {
    TableName: config.aws.tables.users,
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: config.aws.tables.menu,
    KeySchema: [{ AttributeName: 'itemId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'itemId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: config.aws.tables.orders,
    KeySchema: [{ AttributeName: 'orderId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'orderId', AttributeType: 'S' },
      { AttributeName: 'studentId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StudentOrdersIndex',
        KeySchema: [
          { AttributeName: 'studentId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: config.aws.tables.tokens,
    KeySchema: [{ AttributeName: 'tokenDate', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'tokenDate', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: config.aws.tables.payments,
    KeySchema: [{ AttributeName: 'paymentId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'paymentId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: config.aws.tables.suggestions,
    KeySchema: [{ AttributeName: 'suggestionId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'suggestionId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: config.aws.tables.settings,
    KeySchema: [{ AttributeName: 'settingKey', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'settingKey', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  }
];

export async function createAllTables() {
  console.log('--- Provisioning DynamoDB Tables for CampusBite ---');
  try {
    const listRes = await rawDynamoClient.send(new ListTablesCommand({}));
    const existingTables = listRes.TableNames || [];

    for (const tableDef of tables) {
      if (existingTables.includes(tableDef.TableName)) {
        console.log(`[DynamoDB] Table "${tableDef.TableName}" already exists.`);
      } else {
        console.log(`[DynamoDB] Creating table "${tableDef.TableName}"...`);
        await rawDynamoClient.send(new CreateTableCommand(tableDef));
        console.log(`[DynamoDB] Table "${tableDef.TableName}" creation initiated successfully.`);
      }
    }
    console.log('--- Table provisioning completed ---');
  } catch (err) {
    console.error('[DynamoDB Setup Error]', err.message);
  }
}

if (process.argv[1]?.endsWith('createTables.js')) {
  createAllTables().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
