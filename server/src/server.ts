// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import compression from 'compression';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import passport from 'passport';
import corsMiddleware from './config/cors';

import * as RootHealth from "./routes/health-root";

// Import configurations and services
import connectDB from './config/database';

// Import routes
import activityNewRoutes from './routes/activityNew';
import authRoutes from './routes/auth';

const app: express.Application = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint for VSCode extension
app.use('/health', RootHealth.HealthRoot);

// Root endpoint for VSCode extension
app.use('/', RootHealth.RootRoute);

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/activity', activityNewRoutes); 

app.use('/auth', authRoutes);

// 404 handler
app.use('*', RootHealth.NotFoundRoute);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});


const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
