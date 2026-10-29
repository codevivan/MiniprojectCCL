import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { initSocket } from './services/socketService.js';
import { logger } from './middleware/logger.js';
import { dynamoDb } from './repositories/dynamoClient.js';

const server = http.createServer(app);

// Initialize Socket.IO with server
initSocket(server);

server.listen(config.port, () => {
  logger.info(`====================================================`);
  logger.info(`  CampusBite Canteen Pre-Order & Token Server       `);
  logger.info(`  Tagline: Order Smart. Skip the Queue.             `);
  logger.info(`====================================================`);
  logger.info(`[Server] Running on http://localhost:${config.port}`);
  logger.info(`[Environment] ${config.env}`);
  logger.info(`[DynamoDB] ${dynamoDb.isCloudMode() ? 'AWS Cloud Mode' : 'Local Persistent Demo Mode'}`);
  logger.info(`[Health Check] http://localhost:${config.port}/api/health`);
  logger.info(`====================================================`);
});

// Process handlers for clean termination on EC2 / PM2
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server.');
  server.close(() => {
    logger.info('HTTP server closed cleanly.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason: reason?.message || reason });
});
