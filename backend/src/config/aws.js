import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { config } from './env.js';

// Base AWS Client Config
const clientConfig = {
  region: config.aws.region,
};

// Use explicit credentials if provided, otherwise AWS SDK resolves via EC2 instance profile or local AWS config
if (config.aws.accessKeyId && config.aws.secretAccessKey) {
  clientConfig.credentials = {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  };
}

// DynamoDB Client
const dynamoConfig = { ...clientConfig };
if (config.aws.dynamoEndpoint) {
  dynamoConfig.endpoint = config.aws.dynamoEndpoint;
}

export const rawDynamoClient = new DynamoDBClient(dynamoConfig);
export const docClient = DynamoDBDocumentClient.from(rawDynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

// S3 Client
export const s3Client = new S3Client(clientConfig);

// SNS Client (Order Alerts Pub/Sub)
export const snsClient = new SNSClient(clientConfig);

// CloudWatch Logs Client
export const cloudWatchClient = new CloudWatchLogsClient(clientConfig);

// Status helper to check if real AWS environment or explicit credentials are active
export const isAwsConfigured = () => {
  return Boolean(
    process.env.USE_AWS === 'true' ||
    process.env.NODE_ENV === 'production' ||
    (config.aws.accessKeyId && config.aws.secretAccessKey) ||
    process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    process.env.AWS_EXECUTION_ENV
  );
};
