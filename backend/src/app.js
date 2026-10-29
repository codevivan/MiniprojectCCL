import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { requestLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import suggestionRoutes from './routes/suggestionRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and utility middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'idempotency-key']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve static uploads and food images
app.use('/images', express.static(path.resolve(__dirname, '../public/images')));
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

// Request logging (CloudWatch-ready)
app.use(requestLogger);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

// Production React Frontend Static Hosting & SPA Routing
const possibleDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../public/dist'),
  path.resolve(__dirname, '../dist')
];
const frontendDist = possibleDistPaths.find(p => fs.existsSync(p));

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') || 
      req.path.startsWith('/uploads') || 
      req.path.startsWith('/images') || 
      req.path.startsWith('/socket.io')
    ) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root route for API standalone mode
  app.get('/', (req, res) => {
    res.json({
      name: 'CampusBite API',
      tagline: 'Order Smart. Skip the Queue.',
      version: '1.0.0',
      documentation: '/api/health',
      status: 'OPERATIONAL'
    });
  });
}

// Centralized 404 & error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
