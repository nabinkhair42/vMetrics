import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { corsMiddleware } from './config/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRoutes } from './routes/auth.routes.js';
import { activityRoutes } from './routes/activity.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { initializeWebSocket } from './websocket/index.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(corsMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/api/activity', activityRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// Store io instance on app for use in routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         vMetrics API Server              ║
╠══════════════════════════════════════════╣
║  HTTP:      http://localhost:${PORT}        ║
║  WebSocket: ws://localhost:${PORT}          ║
║  Health:    http://localhost:${PORT}/health ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for Vercel
export default app;
