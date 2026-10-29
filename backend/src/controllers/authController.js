import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userRepo } from '../repositories/userRepo.js';
import { settingsRepo } from '../repositories/settingsRepo.js';
import { snsService } from '../services/snsService.js';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.studentId || null
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const authController = {
  /**
   * Student Registration
   * - Validates input
   * - Checks for duplicate email AND duplicate studentId
   * - Saves securely in DynamoDB
   * - Does not auto-authenticate; directs student to login with credentials
   */
  async studentRegister(req, res) {
    try {
      const { name, email, studentId, password, confirmPassword } = req.body;

      if (!name || !email || !studentId || !password) {
        return res.status(400).json({
          success: false,
          error: 'Full name, email address, Student ID, and password are required.'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match. Please re-enter your password.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.'
        });
      }

      // Check duplicate email
      const existingEmail = await userRepo.getByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.'
        });
      }

      // Check duplicate Student ID
      const existingStudentId = await userRepo.getByStudentId(studentId);
      if (existingStudentId) {
        return res.status(409).json({
          success: false,
          error: `A student account with Student ID "${studentId.trim()}" is already registered. Please sign in instead.`
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = `usr_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      const newUser = await userRepo.create({
        userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        studentId: studentId.trim().toUpperCase(),
        role: 'STUDENT',
        passwordHash
      });

      logger.info(`Student registered successfully: ${newUser.email} (${newUser.studentId})`);

      // Automatically enroll student email into Amazon SNS order notifications
      snsService.subscribeEmail(newUser.email).catch(err => {
        logger.warn(`[Amazon SNS Notice] Auto-subscribe on register error for ${newUser.email}: ${err.message}`);
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Please sign in with your registered credentials.',
        user: {
          userId: newUser.userId,
          email: newUser.email,
          name: newUser.name,
          studentId: newUser.studentId,
          role: newUser.role
        }
      });
    } catch (err) {
      logger.error('Student registration error:', { error: err.message });
      return res.status(500).json({
        success: false,
        error: 'Registration failed due to a server error. Please try again.'
      });
    }
  },

  /**
   * Student Login
   * - Accepts Email OR Student ID
   * - Verifies password hash
   * - Emits clear error if invalid credentials
   */
  async studentLogin(req, res) {
    try {
      const { email, password } = req.body;
      const identifier = email ? email.trim() : '';

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please enter your email or Student ID and password.'
        });
      }

      // Find student by email or roll ID
      const user = await userRepo.findStudentByEmailOrId(identifier);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Account not found. Please verify your email or Student ID, or create an account.'
        });
      }

      if (user.role !== 'STUDENT') {
        return res.status(403).json({
          success: false,
          error: 'This account is registered as a Canteen Owner. Please use the Owner Sign In portal.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Incorrect password. Please verify your password and try again.'
        });
      }

      const token = generateToken(user);
      logger.info(`Student authenticated: ${user.email} (${user.studentId})`);

      // Ensure student email is subscribed to Amazon SNS order alerts
      snsService.subscribeEmail(user.email).catch(err => {
        logger.warn(`[Amazon SNS Notice] Auto-subscribe on login error for ${user.email}: ${err.message}`);
      });

      return res.json({
        success: true,
        message: 'Signed in successfully!',
        token,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          studentId: user.studentId,
          role: user.role
        }
      });
    } catch (err) {
      logger.error('Student login error:', { error: err.message });
      return res.status(500).json({
        success: false,
        error: 'Login failed due to a server error.'
      });
    }
  },

  /**
   * Owner Registration
   * - Validates full name, canteen name, email, password, confirmPassword
   * - No invitation/registration code required
   * - Saves Owner account securely in DynamoDB with bcrypt
   * - Enforces least-privilege role assignment
   */
  async ownerRegister(req, res) {
    try {
      const { name, canteenName, email, password, confirmPassword } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Full name, email address, and password are required.'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match. Please re-enter your password.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Owner password must be at least 6 characters long.'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check duplicate email
      const existing = await userRepo.getByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = `own_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      const owner = await userRepo.create({
        userId,
        email: normalizedEmail,
        name: name.trim(),
        canteenName: canteenName ? canteenName.trim() : 'CampusBite College Canteen',
        role: 'OWNER',
        passwordHash
      });

      // Update canteen settings with canteenName if provided
      if (canteenName && canteenName.trim()) {
        try {
          await settingsRepo.updateSettings({ 
            canteenName: canteenName.trim(),
            isOrderingAvailable: true 
          });
        } catch {
          // non-blocking
        }
      }

      logger.info(`Owner registered successfully: ${owner.email}`);

      // Auto-subscribe canteen owner email to Amazon SNS order alerts
      snsService.subscribeEmail(owner.email).catch(err => {
        logger.warn(`[Amazon SNS Notice] Auto-subscribe on owner register error: ${err.message}`);
      });

      return res.status(201).json({
        success: true,
        message: 'Owner account created successfully! Please sign in with your credentials.',
        user: {
          userId: owner.userId,
          email: owner.email,
          name: owner.name,
          role: owner.role
        }
      });
    } catch (err) {
      logger.error('Owner registration error:', { error: err.message });
      return res.status(500).json({
        success: false,
        error: 'Owner registration failed due to a server error.'
      });
    }
  },

  /**
   * Owner Login
   */
  async ownerLogin(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Owner email and password are required.'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await userRepo.getByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Owner account not found. Please verify your email or create an account.'
        });
      }

      if (user.role !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: 'This account is registered as a Student. Please use the Student Login portal.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Incorrect password. Please verify your password and try again.'
        });
      }

      const token = generateToken(user);
      logger.info(`Owner authenticated: ${user.email}`);

      // Ensure owner email is subscribed to Amazon SNS order alerts
      snsService.subscribeEmail(user.email).catch(err => {
        logger.warn(`[Amazon SNS Notice] Auto-subscribe on owner login error: ${err.message}`);
      });

      return res.json({
        success: true,
        message: 'Welcome to the Owner Administrative Dashboard.',
        token,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (err) {
      logger.error('Owner login error:', { error: err.message });
      return res.status(500).json({
        success: false,
        error: 'Owner login failed due to a server error.'
      });
    }
  },

  /**
   * Check Owner Status
   */
  async checkOwnerStatus(req, res) {
    try {
      const ownerCount = await userRepo.getOwnerCount();
      return res.json({
        success: true,
        hasOwner: ownerCount > 0,
        ownerCount
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to verify Owner account status.'
      });
    }
  },

  /**
   * Current Authenticated User Profile
   */
  async getMe(req, res) {
    try {
      const user = await userRepo.getById(req.user.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      return res.json({
        success: true,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          studentId: user.studentId,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
    }
  }
};
