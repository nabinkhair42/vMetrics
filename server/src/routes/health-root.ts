import express from "express";
import mongoose from "mongoose";

const router = express.Router();

const HealthRoot = router.get("/", async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
    const dbStates: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const healthCheck = {
      status: "ok",
      timestamp: Date.now(),
      version: "1.0.0",
      uptime: process.uptime(),
      database: {
        status: dbStates[dbStatus] || 'unknown',
        connected: dbStatus === 1
      },
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };

    // If database is not connected, set status to degraded
    if (dbStatus !== 1) {
      healthCheck.status = "degraded";
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: Date.now(),
      error: "Health check failed",
      details: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// / Route for root path
const RootRoute = router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the VSCode Productivity Tracker API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      root: "/root",
    },
  });
});


// Route Not Found 404 handler
const NotFoundRoute = router.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    timestamp: Date.now(),
    version: "1.0.0",
  });
});



export { HealthRoot, RootRoute, NotFoundRoute };
