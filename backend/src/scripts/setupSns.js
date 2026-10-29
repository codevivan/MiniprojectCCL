import { SNSClient, CreateTopicCommand, SetTopicAttributesCommand, PublishCommand, ListTopicsCommand } from '@aws-sdk/client-sns';
import { IAMClient, PutRolePolicyCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';

const credentials = (process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY) ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.TEST_AWS_SECRET
} : undefined;

const region = process.env.AWS_REGION || 'eu-north-1';

const sns = new SNSClient({ region, credentials });
const iam = new IAMClient({ region, credentials });

async function setupSns() {
  console.log('\n======================================================');
  console.log('[SNS] Provisioning Amazon SNS for CampusBite');
  console.log('======================================================');

  // 1. Create SNS Topic
  console.log('--> Step 1: Creating SNS Topic: CampusBite_OrderAlerts...');
  const createTopicRes = await sns.send(new CreateTopicCommand({
    Name: 'CampusBite_OrderAlerts',
    Attributes: {
      DisplayName: 'CampusBite'
    },
    Tags: [
      { Key: 'Project', Value: 'CampusBite' },
      { Key: 'Environment', Value: 'Production' },
      { Key: 'System', Value: 'CampusBite-Canteen' },
      { Key: 'ManagedBy', Value: 'AWS-Integration' }
    ]
  }));

  const topicArn = createTopicRes.TopicArn;
  console.log('✔ SNS Topic Created / Verified:', topicArn);

  // 2. Update IAM Role for EC2
  console.log('\n--> Step 2: Updating IAM permissions on CampusBite-EC2-Role...');
  const ec2RoleName = 'CampusBite-EC2-Role';
  const updatedPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "CampusBiteDynamoDBAccess",
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeTable"
        ],
        Resource: [
          "arn:aws:dynamodb:eu-north-1:*:table/CampusBite_*",
          "arn:aws:dynamodb:eu-north-1:*:table/CampusBite_*/index/*"
        ]
      },
      {
        Sid: "CampusBiteS3AssetStorage",
        Effect: "Allow",
        Action: [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        Resource: [
          "arn:aws:s3:::campusbite-food-images-2026",
          "arn:aws:s3:::campusbite-food-images-2026/*"
        ]
      },
      {
        Sid: "CampusBiteSNSPublishAccess",
        Effect: "Allow",
        Action: [
          "sns:Publish",
          "sns:GetTopicAttributes",
          "sns:ListSubscriptionsByTopic"
        ],
        Resource: "arn:aws:sns:eu-north-1:*:CampusBite_*"
      },
      {
        Sid: "CampusBiteCloudWatchLogging",
        Effect: "Allow",
        Action: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        Resource: "arn:aws:logs:eu-north-1:*:log-group:/campusbite/*"
      }
    ]
  };

  await iam.send(new PutRolePolicyCommand({
    RoleName: ec2RoleName,
    PolicyName: 'CampusBiteEC2AccessPolicy',
    PolicyDocument: JSON.stringify(updatedPolicy, null, 2)
  }));
  console.log('✔ Updated IAM policy: Granted sns:Publish permissions to EC2 role.');

  // 3. Test Publishing a Verification Alert
  console.log('\n--> Step 3: Publishing test verification alert to SNS topic...');
  const testMessage = {
    event: 'SNS_VERIFICATION',
    service: 'CampusBite Canteen Pre-Order Engine',
    timestamp: new Date().toISOString(),
    message: 'Amazon SNS integration verified successfully for CampusBite order notification alerts.'
  };

  const pubRes = await sns.send(new PublishCommand({
    TopicArn: topicArn,
    Subject: 'CampusBite System Alert: SNS Active',
    Message: JSON.stringify(testMessage, null, 2),
    MessageAttributes: {
      EventType: {
        DataType: 'String',
        StringValue: 'SYSTEM_VERIFICATION'
      },
      Environment: {
        DataType: 'String',
        StringValue: 'Production'
      }
    }
  }));

  console.log('✔ Published Test Alert! Message ID:', pubRes.MessageId);
  console.log('\n======================================================');
  console.log('SNS Topic ARN:', topicArn);
  console.log('======================================================');

  return topicArn;
}

setupSns().catch(err => {
  console.error('[SNS Setup Error]', err);
  process.exit(1);
});
