// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import corsMiddleware from './config/cors';

// Import configurations and services
import connectDB from './config/database';

// Import individual route modules
import authRoutes from './routes/auth';
import activityNewRoutes from './routes/activityNew';
import * as RootHealth from './routes/health-root';

const app: express.Application = express();

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Database connection with error handling
let isConnected = false;

const ensureDbConnection = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
};

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(corsMiddleware);



// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Passport middleware (required for GitHub OAuth)
app.use(passport.initialize());
// Note: We don't use passport.session() for serverless compatibility



// Middleware to ensure database connection before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({ error: 'Database connection unavailable' });
  }
});

// Health check endpoint (should be before other routes)
app.use('/health', RootHealth.HealthRoot);

// Authentication routes - matches API expectations (before root route)
app.use('/auth', authRoutes);

// Activity routes - mount under /api/activity to match frontend API calls
app.use('/api/activity', activityNewRoutes);

// Legacy auth routes for compatibility (if needed)
app.use('/api/auth', authRoutes);

// Root endpoint (should be after specific routes)
app.get('/', RootHealth.RootRoute);

// 404 handler for unmatched routes
app.use('*', RootHealth.NotFoundRoute);



// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// For serverless deployment (Vercel), export the app
export default app;

// For local development, start the server
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  });

  // Graceful shutdown for local development
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}
