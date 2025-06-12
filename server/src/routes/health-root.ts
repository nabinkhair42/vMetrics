import express from "express";

const router = express.Router();

const HealthRoot = router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: Date.now(),
    version: "1.0.0",
    uptime: process.uptime(),
  });
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
