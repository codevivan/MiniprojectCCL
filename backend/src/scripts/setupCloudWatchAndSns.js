import { CloudWatchClient, PutMetricAlarmCommand, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, GetTopicAttributesCommand, TagResourceCommand as SnsTagCommand } from '@aws-sdk/client-sns';

const credentials = (process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY) ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.TEST_AWS_SECRET
} : undefined;

const region = process.env.AWS_REGION || 'eu-north-1';
const instanceId = 'i-0113a8711a2f8b53c';
const snsTopicArn = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:eu-north-1:245594728929:CampusBite_OrderAlerts';
const logGroupName = '/campusbite/backend-api';

const cw = new CloudWatchClient({ region, credentials });
const cwl = new CloudWatchLogsClient({ region, credentials });
const sns = new SNSClient({ region, credentials });

async function setup() {
  console.log('\n======================================================');
  console.log('[AWS Integration] CloudWatch & Amazon SNS Full Setup');
  console.log('======================================================');

  // 1. Ensure CloudWatch Log Stream
  console.log('\n--> Step 1: Initializing CloudWatch Log Stream...');
  const streamName = `CampusBite-API-${new Date().toISOString().slice(0, 10)}`;
  try {
    await cwl.send(new CreateLogStreamCommand({
      logGroupName,
      logStreamName: streamName
    }));
    console.log(`✔ Created Log Stream: ${streamName} in ${logGroupName}`);
  } catch (err) {
    if (err.name === 'ResourceAlreadyExistsException') {
      console.log(`✔ Log Stream already exists: ${streamName}`);
    } else {
      console.warn('Notice creating log stream:', err.message);
    }
  }

  // Push an initialization log event
  await cwl.send(new PutLogEventsCommand({
    logGroupName,
    logStreamName: streamName,
    logEvents: [
      {
        timestamp: Date.now(),
        message: JSON.stringify({
          service: 'CampusBite',
          level: 'INFO',
          event: 'CLOUDWATCH_INTEGRATION_VERIFIED',
          targetRegion: region,
          timestamp: new Date().toISOString()
        })
      }
    ]
  }));
  console.log('✔ Pushed live verification log to CloudWatch.');

  // 2. Create CloudWatch Alarms connected to Amazon SNS
  console.log('\n--> Step 2: Creating CloudWatch Alarms routed to Amazon SNS...');

  // Alarm 1: EC2 High CPU Utilization
  const cpuAlarmName = 'CampusBite_EC2_HighCPU_Alarm';
  await cw.send(new PutMetricAlarmCommand({
    AlarmName: cpuAlarmName,
    AlarmDescription: 'CampusBite EC2 CPU Utilization Exceeded 80% Threshold - Triggers Amazon SNS Alert',
    ActionsEnabled: true,
    AlarmActions: [snsTopicArn],
    OKActions: [snsTopicArn],
    MetricName: 'CPUUtilization',
    Namespace: 'AWS/EC2',
    Statistic: 'Average',
    Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
    Period: 300,
    EvaluationPeriods: 1,
    Threshold: 80.0,
    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    Tags: [
      { Key: 'Name', Value: cpuAlarmName },
      { Key: 'Project', Value: 'CampusBite' },
      { Key: 'Environment', Value: 'Production' },
      { Key: 'ManagedBy', Value: 'AWS-Integration' }
    ]
  }));
  console.log(`✔ Created CloudWatch Alarm: ${cpuAlarmName} (Monitors EC2 ${instanceId} -> Notifies SNS)`);

  // Alarm 2: DynamoDB Orders Table Request Throttling
  const dynamoAlarmName = 'CampusBite_DynamoDB_ThrottledRequests_Alarm';
  await cw.send(new PutMetricAlarmCommand({
    AlarmName: dynamoAlarmName,
    AlarmDescription: 'CampusBite DynamoDB Orders Table Request Throttling - Triggers Amazon SNS Alert',
    ActionsEnabled: true,
    AlarmActions: [snsTopicArn],
    OKActions: [snsTopicArn],
    MetricName: 'ThrottledRequests',
    Namespace: 'AWS/DynamoDB',
    Statistic: 'Sum',
    Dimensions: [{ Name: 'TableName', Value: 'CampusBite_Orders' }],
    Period: 60,
    EvaluationPeriods: 1,
    Threshold: 1.0,
    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    Tags: [
      { Key: 'Name', Value: dynamoAlarmName },
      { Key: 'Project', Value: 'CampusBite' },
      { Key: 'Environment', Value: 'Production' },
      { Key: 'ManagedBy', Value: 'AWS-Integration' }
    ]
  }));
  console.log(`✔ Created CloudWatch Alarm: ${dynamoAlarmName} (Monitors DynamoDB -> Notifies SNS)`);

  // 3. Verify SNS Topic Attributes & Tags
  console.log('\n--> Step 3: Verifying Amazon SNS Topic...');
  const topicAttrs = await sns.send(new GetTopicAttributesCommand({ TopicArn: snsTopicArn }));
  console.log(`✔ SNS Topic Confirmed: ${snsTopicArn}`);
  console.log('   Display Name:', topicAttrs.Attributes?.DisplayName);
  console.log('   Subscriptions Confirmed:', topicAttrs.Attributes?.SubscriptionsConfirmed || 0);

  // 4. Verify Active Alarms
  const alarmsRes = await cw.send(new DescribeAlarmsCommand({
    AlarmNamePrefix: 'CampusBite'
  }));
  console.log('\n======================================================');
  console.log('Active CampusBite CloudWatch Alarms:');
  (alarmsRes.MetricAlarms || []).forEach(a => {
    console.log(` • ${a.AlarmName} [${a.StateValue}] -> Actions: ${a.AlarmActions.join(', ')}`);
  });
  console.log('======================================================\n');
}

setup().catch(err => {
  console.error('[Setup Error]', err);
  process.exit(1);
});
