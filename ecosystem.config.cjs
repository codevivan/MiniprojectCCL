module.exports = {
  apps: [
    {
      name: 'campusbite-backend',
      script: 'src/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5050,
        USE_DYNAMODB: 'true',
        USE_AWS: 'true',
        AWS_REGION: 'eu-north-1',
        S3_BUCKET_NAME: 'campusbite-food-images-2026',
        LAMBDA_NOTIFICATION_FUNCTION: 'CampusBite_OrderNotification',
        CLOUDWATCH_LOG_GROUP: '/campusbite/backend-api'
      }
    }
  ]
};
