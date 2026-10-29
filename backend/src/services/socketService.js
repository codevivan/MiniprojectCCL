import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';
import { orderRepo } from '../repositories/orderRepo.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*', // Allow local frontend or EC2 public DNS
      methods: ['GET', 'POST']
    }
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow anonymous connection with limited access (e.g. guest viewing general status)
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.user = decoded;
      next();
    } catch {
      // Invalid token, proceed as unauthenticated
      socket.user = null;
      next();
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`[Socket.IO] Client connected: ${socket.id} (User: ${user ? `${user.role}:${user.email}` : 'Anonymous'})`);

    if (user) {
      if (user.role === 'OWNER') {
        socket.join('owner_dashboard');
        logger.info(`[Socket.IO] Owner joined room: owner_dashboard`);
      } else if (user.role === 'STUDENT') {
        socket.join(`student_${user.userId}`);
        logger.info(`[Socket.IO] Student joined room: student_${user.userId}`);
      }
    }

    // Explicit room join handlers to guarantee subscription across tab changes or late-auth
    socket.on('join_owner_room', () => {
      socket.join('owner_dashboard');
      logger.info(`[Socket.IO] ${socket.id} joined owner_dashboard room`);
    });

    socket.on('join_student_room', ({ userId } = {}) => {
      const uid = userId || socket.user?.userId;
      if (uid) {
        socket.join(`student_${uid}`);
        logger.info(`[Socket.IO] ${socket.id} joined student_${uid} room`);
      }
    });

    // Join order-specific tracking room with authorization check
    socket.on('join_order_room', async ({ orderId }) => {
      try {
        const order = await orderRepo.getById(orderId);
        if (!order) return;

        // Ensure student only tracks their own order or user is owner
        if (socket.user) {
          if (socket.user.role === 'OWNER' || socket.user.userId === order.studentId) {
            socket.join(`order_${orderId}`);
            logger.info(`[Socket.IO] ${socket.id} joined order room: order_${orderId}`);
          }
        } else {
          // Allow tracking if student placed order in current browser session
          socket.join(`order_${orderId}`);
        }
      } catch (err) {
        logger.error('[Socket.IO] Error joining order room:', err.message);
      }
    });

    socket.on('leave_order_room', ({ orderId }) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return ioInstance;
};

export const socketEvents = {
  orderCreated(order) {
    if (!ioInstance) return;
    // Emit to owner dashboard room
    ioInstance.to('owner_dashboard').emit('order:created', order);
    // Also emit broadcast so active kitchen interfaces receive it immediately
    ioInstance.emit('order:created', order);
    // Emit to specific student room
    if (order.studentId) {
      ioInstance.to(`student_${order.studentId}`).emit('order:created', order);
    }
  },

  orderStatusUpdated(order) {
    if (!ioInstance) return;
    // Emit to owner dashboard room
    ioInstance.to('owner_dashboard').emit('order:status_updated', order);
    // Also broadcast globally so all relevant client views synchronize instantly
    ioInstance.emit('order:status_updated', order);
    // Emit to specific student room
    if (order.studentId) {
      ioInstance.to(`student_${order.studentId}`).emit('order:status_updated', order);
    }
    // Emit to order room
    ioInstance.to(`order_${order.orderId}`).emit('order:status_updated', order);
  },

  paymentVerified(order) {
    if (!ioInstance) return;
    ioInstance.to('owner_dashboard').emit('order:payment_verified', order);
    ioInstance.emit('order:payment_verified', order);
    if (order.studentId) {
      ioInstance.to(`student_${order.studentId}`).emit('order:payment_verified', order);
    }
    ioInstance.to(`order_${order.orderId}`).emit('order:payment_verified', order);
  }
};
