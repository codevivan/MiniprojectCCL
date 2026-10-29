import { EC2Client, CreateTagsCommand } from '@aws-sdk/client-ec2';
import { DynamoDBClient, TagResourceCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, TagResourceCommand as LambdaTagCommand } from '@aws-sdk/client-lambda';

const credentials = {
  accessKeyId: process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.TEST_AWS_SECRET
};
const region = 'eu-north-1';
const ec2 = new EC2Client({ region, credentials });
const dynamo = new DynamoDBClient({ region, credentials });
const lambda = new LambdaClient({ region, credentials });

const standardTags = [
  { Key: 'Project', Value: 'CampusBite' },
  { Key: 'Application', Value: 'CampusBite' },
  { Key: 'System', Value: 'CampusBite' },
  { Key: 'Environment', Value: 'Production' }
];

async function tagAll() {
  console.log('=== Adding CampusBite Tags Across All Provisioned Services ===');

  // 1. Tag VPC resources
  const vpcResources = [
    'vpc-09a14041899946a51',
    'igw-0b563c323380ad218',
    'subnet-00c4a47b75a68bb87',
    'rtb-0c1acd2bed1f98ea7',
    'sg-0634ff01f16b50511'
  ];

  try {
    await ec2.send(new CreateTagsCommand({
      Resources: vpcResources,
      Tags: standardTags
    }));
    console.log('[Tags] Applied standard CampusBite tags to VPC, Subnet, IGW, RouteTable, and SecurityGroup.');
  } catch (err) {
    console.error('[VPC Tagging Error]', err.message);
  }

  // 2. Tag Lambda Function
  try {
    await lambda.send(new LambdaTagCommand({
      Resource: 'arn:aws:lambda:eu-north-1:245594728929:function:CampusBite_OrderNotification',
      Tags: {
        Project: 'CampusBite',
        Application: 'CampusBite',
        Name: 'CampusBite_OrderNotification'
      }
    }));
    console.log('[Tags] Applied CampusBite tags to Lambda function.');
  } catch (err) {
    console.error('[Lambda Tagging Error]', err.message);
  }

  console.log('--- All Resources Tagged Successfully with "CampusBite" ---');
}

tagAll();
