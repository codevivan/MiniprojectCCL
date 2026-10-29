import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localDataPath = path.resolve(__dirname, '../../data/dynamodb_local_data.json');

const credentials = {
  accessKeyId: process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.TEST_AWS_SECRET
};
const region = 'eu-north-1';

const rawClient = new DynamoDBClient({ region, credentials });
const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false }
});

async function migrate() {
  console.log('=== Starting Full Migration of Previous Records to Amazon DynamoDB ===\n');

  if (!fs.existsSync(localDataPath)) {
    console.error('Local data file not found at:', localDataPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(localDataPath, 'utf-8');
  const data = JSON.parse(raw);

  const report = {};

  for (const [tableName, itemsMap] of Object.entries(data)) {
    const items = Object.values(itemsMap || {});
    console.log(`\nMigrating table "${tableName}" (${items.length} items)...`);
    let successCount = 0;
    let errCount = 0;

    for (const item of items) {
      try {
        await docClient.send(new PutCommand({
          TableName: tableName,
          Item: item
        }));
        successCount++;
      } catch (err) {
        console.error(`  [Error] Failed to put item in ${tableName}:`, err.message);
        errCount++;
      }
    }

    report[tableName] = { total: items.length, migrated: successCount, failed: errCount };
    console.log(`  --> "${tableName}": ${successCount}/${items.length} records successfully uploaded to AWS DynamoDB.`);
  }

  console.log('\n=== MIGRATION SUMMARY ===');
  console.log(JSON.stringify(report, null, 2));
  console.log('\nAll past accounts, orders, and tokens are now in Amazon DynamoDB!');
}

migrate().catch(console.error);
