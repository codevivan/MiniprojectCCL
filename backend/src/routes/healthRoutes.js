import express from 'express';
import { dynamoDb } from '../repositories/dynamoClient.js';
import { isAwsConfigured } from '../config/aws.js';
import { config } from '../config/env.js';

const router = express.Router();
const startTime = Date.now();

router.get('/health', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  return res.json({
    status: 'HEALTHY',
    service: 'CampusBite Backend API',
    uptime: `${uptimeSeconds} seconds`,
    timestamp: new Date().toISOString(),
    environment: config.env,
    aws: {
      region: config.aws.region,
      isAwsConfigured: isAwsConfigured(),
      dynamoDbMode: dynamoDb.isCloudMode() ? 'AMAZON_DYNAMODB_CLOUD' : 'LOCAL_PERSISTENT_STORE',
      s3Bucket: config.aws.s3.bucket,
      notificationsEngine: 'AMAZON_EC2_NATIVE',
      snsConfigured: Boolean(config.aws.sns.topicArn),
      snsTopicArn: config.aws.sns.topicArn,
      vpcFlowLogs: config.aws.vpcFlowLogs.logGroupName,
      vpcFlowLogsActive: true,
      cognitoConfigured: Boolean(config.aws.cognito.userPoolId)
    },
    system: {
      nodeVersion: process.version,
      heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2)
    }
  });
});

export default router;
