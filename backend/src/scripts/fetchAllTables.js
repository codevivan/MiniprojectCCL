import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, ListTopicsCommand, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const credentials = (process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY) ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.TEST_AWS_SECRET
} : undefined;

const region = process.env.AWS_REGION || 'eu-north-1';

const rawDynamo = new DynamoDBClient({ region, credentials });
const docClient = DynamoDBDocumentClient.from(rawDynamo);
const sns = new SNSClient({ region, credentials });
const cwl = new CloudWatchLogsClient({ region, credentials });
const cw = new CloudWatchClient({ region, credentials });
const s3 = new S3Client({ region, credentials });

async function fetchAll() {
  console.log('========================================================================');
  console.log(`=== CampusBite — Comprehensive AWS Services Inspector (eu-north-1) ===`);
  console.log('========================================================================\n');

  const report = {};

  // 1. Amazon DynamoDB Tables
  console.log('--> [1/5] Scanning Amazon DynamoDB Tables...');
  const listRes = await rawDynamo.send(new ListTablesCommand({}));
  const tables = (listRes.TableNames || []).filter(t => t.startsWith('CampusBite_'));
  report.dynamoDB = {};
  for (const tableName of tables) {
    try {
      const scanRes = await docClient.send(new ScanCommand({ TableName: tableName, Limit: 50 }));
      report.dynamoDB[tableName] = {
        totalItemsCount: scanRes.Count || 0,
        samplePreview: (scanRes.Items || []).slice(0, 3)
      };
    } catch (err) {
      report.dynamoDB[tableName] = { error: err.message };
    }
  }

  // 2. Amazon SNS Topics & Attributes
  console.log('--> [2/5] Inspecting Amazon SNS (Pub/Sub Messaging)...');
  const topicsRes = await sns.send(new ListTopicsCommand({}));
  const cbTopics = (topicsRes.Topics || []).filter(t => t.TopicArn?.includes('CampusBite'));
  report.sns = {};
  for (const t of cbTopics) {
    try {
      const attrs = await sns.send(new GetTopicAttributesCommand({ TopicArn: t.TopicArn }));
      report.sns[t.TopicArn] = {
        topicName: t.TopicArn.split(':').pop(),
        displayName: attrs.Attributes?.DisplayName || 'None',
        subscriptionsConfirmed: attrs.Attributes?.SubscriptionsConfirmed || 0,
        status: 'ACTIVE'
      };
    } catch (err) {
      report.sns[t.TopicArn] = { error: err.message };
    }
  }

  // 3. Amazon CloudWatch Logs
  console.log('--> [3/5] Inspecting Amazon CloudWatch Log Groups & Streams...');
  const logsRes = await cwl.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: '/campusbite' }));
  report.cloudWatchLogs = {};
  for (const g of (logsRes.logGroups || [])) {
    try {
      const streamsRes = await cwl.send(new DescribeLogStreamsCommand({ logGroupName: g.logGroupName, limit: 5 }));
      report.cloudWatchLogs[g.logGroupName] = {
        retentionInDays: g.retentionInDays,
        storedBytes: g.storedBytes,
        activeStreams: (streamsRes.logStreams || []).map(s => s.logStreamName)
      };
    } catch (err) {
      report.cloudWatchLogs[g.logGroupName] = { error: err.message };
    }
  }

  // 4. Amazon CloudWatch Metric Alarms
  console.log('--> [4/5] Inspecting Amazon CloudWatch Alarms...');
  const alarmsRes = await cw.send(new DescribeAlarmsCommand({ AlarmNamePrefix: 'CampusBite' }));
  report.cloudWatchAlarms = (alarmsRes.MetricAlarms || []).map(a => ({
    alarmName: a.AlarmName,
    metric: `${a.Namespace}/${a.MetricName}`,
    threshold: `${a.ComparisonOperator} ${a.Threshold}`,
    state: a.StateValue,
    notificationActions: a.AlarmActions
  }));

  // 5. Amazon S3 Bucket & Objects
  console.log('--> [5/5] Inspecting Amazon S3 (campusbite-food-images-2026)...');
  try {
    const s3Res = await s3.send(new ListObjectsV2Command({ Bucket: 'campusbite-food-images-2026' }));
    report.s3Bucket = {
      bucketName: 'campusbite-food-images-2026',
      totalObjects: (s3Res.Contents || []).length,
      sampleObjects: (s3Res.Contents || []).slice(0, 10).map(o => `${o.Key} (${(o.Size / 1024).toFixed(1)} KB)`)
    };
  } catch (err) {
    report.s3Bucket = { error: err.message };
  }

  console.log('\n========================================================================');
  console.log('=== COMPLETE CAMPUSBITE AWS SERVICES REPORT ===');
  console.log('========================================================================\n');
  console.log(JSON.stringify(report, null, 2));
}

fetchAll().catch(console.error);
