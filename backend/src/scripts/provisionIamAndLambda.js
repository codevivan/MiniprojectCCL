import { IAMClient, CreateRoleCommand, PutRolePolicyCommand, CreateInstanceProfileCommand, AddRoleToInstanceProfileCommand, GetRoleCommand, AttachRolePolicyCommand } from '@aws-sdk/client-iam';
import { LambdaClient, CreateFunctionCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = {
  accessKeyId: process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.TEST_AWS_SECRET
};
const region = 'eu-north-1';
const iam = new IAMClient({ region, credentials });
const lambda = new LambdaClient({ region, credentials });

const ec2TrustPolicy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { Service: 'ec2.amazonaws.com' },
      Action: 'sts:AssumeRole'
    }
  ]
});

const lambdaTrustPolicy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { Service: 'lambda.amazonaws.com' },
      Action: 'sts:AssumeRole'
    }
  ]
});

async function setup() {
  console.log('=== [1/3] Provisioning IAM Role & Instance Profile for EC2 ===');
  const ec2RoleName = 'CampusBite-EC2-Role';
  let ec2RoleArn = '';

  try {
    const roleRes = await iam.send(new CreateRoleCommand({
      RoleName: ec2RoleName,
      AssumeRolePolicyDocument: ec2TrustPolicy,
      Description: 'IAM Role for CampusBite EC2 backend with DynamoDB, S3, CloudWatch, and Lambda permissions'
    }));
    ec2RoleArn = roleRes.Role.Arn;
    console.log('[IAM] Created EC2 Role:', ec2RoleName);
  } catch (err) {
    if (err.name === 'EntityAlreadyExistsException') {
      const getRes = await iam.send(new GetRoleCommand({ RoleName: ec2RoleName }));
      ec2RoleArn = getRes.Role.Arn;
      console.log('[IAM] EC2 Role already exists:', ec2RoleArn);
    } else {
      console.error('[IAM Error creating role]', err.name, err.message);
    }
  }

  // Attach policy to EC2 role
  const policyPath = path.resolve(__dirname, '../../aws/iam/ec2-instance-role-policy.json');
  const policyDoc = fs.readFileSync(policyPath, 'utf-8');
  try {
    await iam.send(new PutRolePolicyCommand({
      RoleName: ec2RoleName,
      PolicyName: 'CampusBiteEC2AccessPolicy',
      PolicyDocument: policyDoc
    }));
    console.log('[IAM] Attached CampusBiteEC2AccessPolicy inline to', ec2RoleName);
  } catch (err) {
    console.error('[IAM Error putting policy]', err.name, err.message);
  }

  // Create Instance Profile
  try {
    await iam.send(new CreateInstanceProfileCommand({
      InstanceProfileName: ec2RoleName
    }));
    console.log('[IAM] Created Instance Profile:', ec2RoleName);
  } catch (err) {
    if (err.name === 'EntityAlreadyExistsException') {
      console.log('[IAM] Instance Profile already exists.');
    } else {
      console.error('[IAM Error creating instance profile]', err.name, err.message);
    }
  }

  // Add role to instance profile
  try {
    await iam.send(new AddRoleToInstanceProfileCommand({
      InstanceProfileName: ec2RoleName,
      RoleName: ec2RoleName
    }));
    console.log('[IAM] Added Role to Instance Profile.');
  } catch (err) {
    if (err.name === 'LimitExceededException' || err.message.includes('Cannot exceed quota')) {
      console.log('[IAM] Role is already in Instance Profile.');
    } else {
      console.log('[IAM Notice]', err.message);
    }
  }

  console.log('\n=== [2/3] Provisioning IAM Role for Lambda Function ===');
  const lambdaRoleName = 'CampusBite-Lambda-Role';
  let lambdaRoleArn = '';

  try {
    const lRoleRes = await iam.send(new CreateRoleCommand({
      RoleName: lambdaRoleName,
      AssumeRolePolicyDocument: lambdaTrustPolicy,
      Description: 'Execution role for CampusBite Order Notification Lambda function'
    }));
    lambdaRoleArn = lRoleRes.Role.Arn;
    console.log('[IAM] Created Lambda Role:', lambdaRoleName);
  } catch (err) {
    if (err.name === 'EntityAlreadyExistsException') {
      const getRes = await iam.send(new GetRoleCommand({ RoleName: lambdaRoleName }));
      lambdaRoleArn = getRes.Role.Arn;
      console.log('[IAM] Lambda Role already exists:', lambdaRoleArn);
    } else {
      console.error('[IAM Error creating Lambda role]', err.name, err.message);
    }
  }

  // Attach basic execution policy
  try {
    await iam.send(new AttachRolePolicyCommand({
      RoleName: lambdaRoleName,
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    }));
    console.log('[IAM] Attached AWSLambdaBasicExecutionRole to', lambdaRoleName);
  } catch (err) {
    console.error('[IAM Error attaching Lambda policy]', err.name, err.message);
  }

  console.log('\n=== [3/3] Deploying AWS Lambda Function ===');
  const zipPath = path.resolve(__dirname, '../../aws/lambda/orderNotification.zip');
  const zipBytes = fs.readFileSync(zipPath);

  // Wait 10 seconds for IAM role propagation
  console.log('Waiting 10 seconds for IAM role propagation...');
  await new Promise(r => setTimeout(r, 10000));

  const functionName = 'CampusBite_OrderNotification';
  try {
    const fn = await lambda.send(new CreateFunctionCommand({
      FunctionName: functionName,
      Runtime: 'nodejs20.x',
      Role: lambdaRoleArn,
      Handler: 'orderNotification.handler',
      Code: { ZipFile: zipBytes },
      Description: 'CampusBite asynchronous order notification background task',
      Timeout: 15,
      MemorySize: 128
    }));
    console.log('[Lambda] Function created successfully:', fn.FunctionArn);
  } catch (err) {
    if (err.name === 'ResourceConflictException') {
      console.log('[Lambda] Function already exists.');
    } else {
      console.error('[Lambda Error creating function]', err.name, err.message);
    }
  }

  console.log('\n--- Setup Completed Successfully! ---');
}

setup();
