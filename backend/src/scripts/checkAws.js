import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeKeyPairsCommand } from '@aws-sdk/client-ec2';
import { CognitoIdentityProviderClient, ListUserPoolsCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

const credentials = {
  accessKeyId: process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.TEST_AWS_SECRET
};
const region = 'eu-north-1';

async function inspect() {
  const report = {};

  // 1. EC2 & VPC
  try {
    const ec2 = new EC2Client({ region, credentials });
    const instances = await ec2.send(new DescribeInstancesCommand({}));
    const running = [];
    (instances.Reservations || []).forEach(r => {
      (r.Instances || []).forEach(i => {
        running.push({
          id: i.InstanceId,
          type: i.InstanceType,
          state: i.State?.Name,
          publicIp: i.PublicIpAddress || 'None',
          privateIp: i.PrivateIpAddress,
          keyName: i.KeyName,
          tags: i.Tags
        });
      });
    });
    report.ec2Instances = running;

    const vpcs = await ec2.send(new DescribeVpcsCommand({}));
    report.vpcs = (vpcs.Vpcs || []).map(v => ({ id: v.VpcId, cidr: v.CidrBlock, isDefault: v.IsDefault, tags: v.Tags }));

    const subnets = await ec2.send(new DescribeSubnetsCommand({}));
    report.subnets = (subnets.Subnets || []).map(s => ({ id: s.SubnetId, vpcId: s.VpcId, cidr: s.CidrBlock, az: s.AvailabilityZone, publicIpOnLaunch: s.MapPublicIpOnLaunch }));

    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({}));
    report.securityGroups = (sgs.SecurityGroups || []).map(g => ({ id: g.GroupId, name: g.GroupName, vpcId: g.VpcId, description: g.Description }));

    const keys = await ec2.send(new DescribeKeyPairsCommand({}));
    report.keyPairs = (keys.KeyPairs || []).map(k => k.KeyName);
  } catch (err) {
    report.ec2Error = { name: err.name, message: err.message };
  }

  // 2. Cognito
  try {
    const cognito = new CognitoIdentityProviderClient({ region, credentials });
    const pools = await cognito.send(new ListUserPoolsCommand({ MaxResults: 10 }));
    report.userPools = pools.UserPools || [];
  } catch (err) {
    report.cognitoError = { name: err.name, message: err.message };
  }

  // 3. DynamoDB
  try {
    const dynamo = new DynamoDBClient({ region, credentials });
    const tables = await dynamo.send(new ListTablesCommand({}));
    report.dynamoTables = tables.TableNames || [];
  } catch (err) {
    report.dynamoError = { name: err.name, message: err.message };
  }

  // 4. S3
  try {
    const s3 = new S3Client({ region, credentials });
    await s3.send(new HeadBucketCommand({ Bucket: 'campusbite-food-images-2026' }));
    report.s3BucketVerified = true;
  } catch (err) {
    report.s3Error = { name: err.name, message: err.message };
  }

  // 5. Lambda
  try {
    const lambda = new LambdaClient({ region, credentials });
    const funcs = await lambda.send(new ListFunctionsCommand({}));
    report.lambdaFunctions = (funcs.Functions || []).map(f => f.FunctionName);
  } catch (err) {
    report.lambdaError = { name: err.name, message: err.message };
  }

  // 6. CloudWatch Logs
  try {
    const cw = new CloudWatchLogsClient({ region, credentials });
    const logs = await cw.send(new DescribeLogGroupsCommand({ limit: 10 }));
    report.logGroups = (logs.logGroups || []).map(g => g.logGroupName);
  } catch (err) {
    report.cwError = { name: err.name, message: err.message };
  }

  console.log('--- RESOURCE REPORT START ---');
  console.log(JSON.stringify(report, null, 2));
  console.log('--- RESOURCE REPORT END ---');
}

inspect();
