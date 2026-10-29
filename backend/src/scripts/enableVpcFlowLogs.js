import { EC2Client, CreateFlowLogsCommand, DescribeFlowLogsCommand } from '@aws-sdk/client-ec2';
import { CloudWatchLogsClient, CreateLogGroupCommand, PutRetentionPolicyCommand } from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, CreateRoleCommand, PutRolePolicyCommand, GetRoleCommand } from '@aws-sdk/client-iam';

const credentials = (process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY) ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.TEST_AWS_SECRET
} : undefined;

const region = process.env.AWS_REGION || 'eu-north-1';
const vpcId = 'vpc-09a14041899946a51';
const logGroupName = '/campusbite/vpc-flow-logs';
const roleName = 'CampusBite-VPC-FlowLogs-Role';

const ec2 = new EC2Client({ region, credentials });
const cwl = new CloudWatchLogsClient({ region, credentials });
const iam = new IAMClient({ region, credentials });

async function enableVpcFlowLogs() {
  console.log('\n======================================================');
  console.log('[VPC] Enabling Amazon VPC Flow Logs for CampusBite-VPC');
  console.log('======================================================');

  // 1. Create CloudWatch Log Group for VPC Flow Logs
  console.log('--> Step 1: Creating CloudWatch Log Group:', logGroupName);
  try {
    await cwl.send(new CreateLogGroupCommand({ logGroupName }));
    console.log('✔ Created CloudWatch Log Group:', logGroupName);
  } catch (err) {
    if (err.name === 'ResourceAlreadyExistsException') {
      console.log('✔ CloudWatch Log Group already exists.');
    } else {
      console.warn('Notice creating log group:', err.message);
    }
  }

  // Set 14-day retention policy
  try {
    await cwl.send(new PutRetentionPolicyCommand({ logGroupName, retentionInDays: 14 }));
    console.log('✔ Applied 14-day retention policy on VPC Flow Logs.');
  } catch (err) {
    console.warn('Notice setting retention policy:', err.message);
  }

  // 2. Create IAM Role for VPC Flow Logs
  console.log('\n--> Step 2: Creating IAM Role for VPC Flow Logs delivery...');
  const trustPolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
        Action: 'sts:AssumeRole'
      }
    ]
  });

  let roleArn = '';
  try {
    const roleRes = await iam.send(new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: trustPolicy,
      Description: 'IAM Role permitting VPC Flow Logs to deliver network traffic logs to CloudWatch Logs'
    }));
    roleArn = roleRes.Role.Arn;
    console.log('✔ Created IAM Role:', roleName);
  } catch (err) {
    if (err.name === 'EntityAlreadyExistsException') {
      const getRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      roleArn = getRes.Role.Arn;
      console.log('✔ IAM Role already exists:', roleArn);
    } else {
      throw err;
    }
  }

  // Attach policy to IAM Role
  const permissionsPolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams'
        ],
        Resource: '*'
      }
    ]
  });

  await iam.send(new PutRolePolicyCommand({
    RoleName: roleName,
    PolicyName: 'CampusBiteVPCFlowLogsDeliveryPolicy',
    PolicyDocument: permissionsPolicy
  }));
  console.log('✔ Attached VPC Flow Logs delivery permissions policy.');

  // Wait 10 seconds for IAM role propagation in AWS
  console.log('Waiting 10s for IAM role replication in AWS...');
  await new Promise(r => setTimeout(r, 10000));

  // 3. Create VPC Flow Log on CampusBite-VPC
  console.log('\n--> Step 3: Enabling Flow Logs on CampusBite-VPC (All Traffic: ACCEPT + REJECT)...');
  const flowLogRes = await ec2.send(new CreateFlowLogsCommand({
    ResourceIds: [vpcId],
    ResourceType: 'VPC',
    TrafficType: 'ALL',
    LogDestinationType: 'cloud-watch-logs',
    LogGroupName: logGroupName,
    DeliverLogsPermissionArn: roleArn,
    TagSpecifications: [
      {
        ResourceType: 'vpc-flow-log',
        Tags: [
          { Key: 'Name', Value: 'CampusBite-VPC-FlowLogs' },
          { Key: 'Project', Value: 'CampusBite' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'ManagedBy', Value: 'AWS-Integration' }
        ]
      }
    ]
  }));

  const flowLogId = flowLogRes.FlowLogIds?.[0];
  console.log('✔ VPC Flow Log Created successfully! ID:', flowLogId);

  // 4. Verify Active Flow Logs
  const activeFlowLogs = await ec2.send(new DescribeFlowLogsCommand({
    Filter: [{ Name: 'resource-id', Values: [vpcId] }]
  }));

  console.log('\n======================================================');
  console.log('Active VPC Flow Logs on CampusBite-VPC:');
  console.log(JSON.stringify(activeFlowLogs.FlowLogs, null, 2));
  console.log('======================================================\n');
}

enableVpcFlowLogs().catch(err => {
  console.error('[Error enabling VPC Flow Logs]', err);
  process.exit(1);
});
