import { PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { cloudWatchClient, isAwsConfigured } from '../config/aws.js';
import { config } from '../config/env.js';

const SENSITIVE_KEYS = ['password', 'passwordHash', 'cvv', 'cardnumber', 'secret', 'authorization', 'token'];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))) {
      clean[k] = '***REDACTED***';
    } else if (typeof v === 'object') {
      clean[k] = sanitize(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export const logger = {
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  },
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  },
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  },

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      message,
      meta: sanitize(meta)
    };

    // Standard stdout for EC2/CloudWatch Agent collection
    const line = `[${timestamp}] [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(entry.meta) : ''}`;
    if (level === 'ERROR') {
      console.error(line);
    } else if (level === 'WARN') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
};

/**
 * Express Request Logger Middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logData = {
      method,
      url,
      statusCode,
      durationMs: duration,
      ip: ip || req.connection.remoteAddress,
      userId: req.user?.userId || 'anonymous'
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${method} ${url} -> ${statusCode} (${duration}ms)`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${method} ${url} -> ${statusCode} (${duration}ms)`, logData);
    } else {
      logger.info(`HTTP ${method} ${url} -> ${statusCode} (${duration}ms)`, logData);
    }
  });

  next();
};
