import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5050,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5175',
  
  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'eu-north-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    dynamoEndpoint: process.env.DYNAMODB_ENDPOINT || '', // Optional: for DynamoDB Local (e.g. http://localhost:8000)
    tables: {
      users: process.env.DYNAMO_TABLE_USERS || 'CampusBite_Users',
      menu: process.env.DYNAMO_TABLE_MENU || 'CampusBite_Menu',
      orders: process.env.DYNAMO_TABLE_ORDERS || 'CampusBite_Orders',
      tokens: process.env.DYNAMO_TABLE_TOKENS || 'CampusBite_Tokens',
      payments: process.env.DYNAMO_TABLE_PAYMENTS || 'CampusBite_Payments',
      suggestions: process.env.DYNAMO_TABLE_SUGGESTIONS || 'CampusBite_Suggestions',
      settings: process.env.DYNAMO_TABLE_SETTINGS || 'CampusBite_Settings'
    },
    s3: {
      bucket: process.env.S3_BUCKET_NAME || 'campusbite-food-images-2026',
      region: process.env.AWS_REGION || 'eu-north-1'
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID || '',
      clientId: process.env.COGNITO_CLIENT_ID || '',
      region: process.env.AWS_REGION || 'eu-north-1'
    },
    sns: {
      topicArn: process.env.SNS_TOPIC_ARN || 'arn:aws:sns:eu-north-1:245594728929:CampusBite_OrderAlerts'
    },
    cloudwatch: {
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/campusbite/backend-api'
    },
    vpcFlowLogs: {
      logGroupName: process.env.VPC_FLOW_LOGS_GROUP || '/campusbite/vpc-flow-logs'
    }
  },

  // JWT configuration for local development / testing fallback mode
  jwt: {
    secret: process.env.JWT_SECRET || 'campusbite-super-secret-ccl-demo-key-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Owner invitation / registration security code
  ownerRegistrationCode: process.env.OWNER_REGISTRATION_CODE || 'CAMPUS-OWNER-2026'
};
