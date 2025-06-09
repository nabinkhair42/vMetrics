// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import * as WebSocket from 'ws';

// Import configurations and services
import connectDB from './config/database';
import { authenticateWebSocket } from './middleware/auth';
import { ActivityService } from './services/ActivityService';
import { ActivityEvent, UserStats } from './types';

// Import routes
import authRoutes from './routes/auth';
import activityRoutes from './routes/activity';

const app = express();
const wsInstance = expressWs(app);
const wsApp = wsInstance.app as any;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP'
// });
// app.use('/api', limiter);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};
app.use(cors(corsOptions));

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

// Initialize services
const activityService = new ActivityService();

// Store active WebSocket connections
const activeConnections = new Map<string, WebSocket>();

// WebSocket endpoint for activity tracking
wsApp.ws('/ws/activity', (ws: WebSocket, req: express.Request) => {
  let userId: string | null = null;
  let isAuthenticated = false;

  console.log('New WebSocket connection');

  // Handle authentication
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (token) {
    const user = authenticateWebSocket(token);
    if (user) {
      userId = user.userId;
      isAuthenticated = true;
      activeConnections.set(userId, ws);
      console.log(`User ${user.username} connected via WebSocket`);
      
      // Send connection confirmation
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Successfully connected to Productivity Tracker' 
      }));
    } else {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Authentication failed' 
      }));
      ws.close();
      return;
    }
  } else {
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Authentication token required' 
    }));
    ws.close();
    return;
  }

  // Handle incoming messages
  ws.on('message', async (message: WebSocket.Data) => {
    if (!isAuthenticated || !userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not authenticated' 
      }));
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'request_stats') {
        // Send current stats to client
        const stats = await activityService.getUserStats(userId);
        ws.send(JSON.stringify({ 
          type: 'stats', 
          data: stats 
        }));
      } else {
        // Handle activity event
        const event: ActivityEvent = data;
        await activityService.saveActivity(userId, event);
        
        // Send acknowledgment
        ws.send(JSON.stringify({ 
          type: 'ack', 
          timestamp: event.timestamp 
        }));
        
        console.log(`Activity saved: ${event.type} for user ${userId}`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process message' 
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    if (userId) {
      activeConnections.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (userId) {
      activeConnections.delete(userId);
    }
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/activity', activityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connections: activeConnections.size
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'VSCode Productivity Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      activity: '/api/activity',
      websocket: '/ws/activity',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket endpoint: ws://localhost:${PORT}/ws/activity`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
