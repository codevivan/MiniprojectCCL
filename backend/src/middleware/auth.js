import jwt from 'jsonwebtoken';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from '../config/env.js';

let cognitoVerifier = null;

if (config.aws.cognito.userPoolId && config.aws.cognito.clientId) {
  try {
    cognitoVerifier = CognitoJwtVerifier.create({
      userPoolId: config.aws.cognito.userPoolId,
      tokenUse: 'id',
      clientId: config.aws.cognito.clientId,
    });
    console.log('[Auth] Amazon Cognito JWT Verifier initialized for production mode.');
  } catch (err) {
    console.warn('[Auth] Failed to initialize Cognito verifier, falling back to local JWT:', err.message);
  }
}

/**
 * Authentication Middleware
 * Validates JWT from Authorization: Bearer <token>
 * Supports both Amazon Cognito production tokens and local HMAC-SHA256 tokens
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No valid Bearer token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  // Try Cognito verification if configured
  if (cognitoVerifier) {
    try {
      const payload = await cognitoVerifier.verify(token);
      req.user = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name || payload['cognito:username'],
        role: payload['custom:role'] || (payload['cognito:groups']?.includes('Owners') ? 'OWNER' : 'STUDENT'),
        studentId: payload['custom:studentId'] || null,
        authProvider: 'AMAZON_COGNITO'
      };
      return next();
    } catch (cognitoErr) {
      if (process.env.AUTH_MODE === 'cognito') {
        console.warn('[Auth] Cognito token verification failed:', cognitoErr.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired Amazon Cognito token.'
        });
      }
      // If not strictly cognito-only, gracefully fallback to local/DynamoDB JWT
    }
  }

  // Standard JWT Verification (DynamoDB User Store)
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      studentId: decoded.studentId || null,
      authProvider: 'CAMPUSBITE_JWT'
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid token. Please sign in again.'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles e.g. 'OWNER', 'STUDENT'
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Requires one of [${allowedRoles.join(', ')}] role. Current role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Optional Auth - attaches user info if token provided, but allows guest access
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
  } catch {
    // ignore
  }
  next();
};
