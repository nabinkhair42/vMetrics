import express, { Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { ActivityService } from '../services/ActivityService';

const router = express.Router();
const activityService = new ActivityService();

// POST endpoint to receive activity events from VSCode extension
router.post('/', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const activityEvent = req.body;
    
    // Validate required fields
    if (!activityEvent.type || !activityEvent.timestamp) {
      return res.status(400).json({ error: 'Missing required fields: type, timestamp' });
    }

    // Add user ID from authenticated token
    activityEvent.userId = req.user!.userId;
    
    console.log(`📊 Received activity event: ${activityEvent.type} from user ${req.user!.userId}`);
    
    // Save the activity event
    await activityService.saveActivity(req.user!.userId, activityEvent);
    
    res.status(201).json({ success: true, message: 'Activity event saved' });
  } catch (error) {
    console.error('Error saving activity event:', error);
    res.status(500).json({ error: 'Failed to save activity event' });
  }
});

// Health check endpoint for VSCode extension connection testing
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Get user stats
router.get('/stats', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const stats = await activityService.getUserStats(req.user!.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get daily stats
router.get('/daily', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await activityService.getDailyStats(req.user!.userId, days);
    res.json(stats);
  } catch (error) {
    console.error('Error getting daily stats:', error);
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

// Get project stats
router.get('/projects', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await activityService.getProjectStats(req.user!.userId, days);
    res.json(stats);
  } catch (error) {
    console.error('Error getting project stats:', error);
    res.status(500).json({ error: 'Failed to get project stats' });
  }
});

// Get user summary stats
router.get('/summary', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const range = req.query.range as string || 'today';
    const stats = await activityService.getUserStats(req.user!.userId);
    
    // Add additional summary calculations based on range
    const summary = {
      todayMinutes: stats.todayMinutes,
      todayFiles: stats.activeProjects.length, // Approximate
      todayProjects: stats.activeProjects.length,
      activeProject: stats.currentFile ? stats.activeProjects[0] : undefined,
      longestSession: 0, // TODO: Calculate from activities
      trends: {
        time: stats.todayMinutes > 60 ? 1 : -1, // Simple trend
        files: stats.activeProjects.length > 3 ? 1 : -1,
        projects: stats.activeProjects.length
      }
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// Get language stats
router.get('/languages', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await activityService.getLanguageStats(req.user!.userId, days);
    res.json(stats);
  } catch (error) {
    console.error('Error getting language stats:', error);
    res.status(500).json({ error: 'Failed to get language stats' });
  }
});

// Get time series data
router.get('/timeseries', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await activityService.getDailyStats(req.user!.userId, days);
    res.json(stats);
  } catch (error) {
    console.error('Error getting timeseries data:', error);
    res.status(500).json({ error: 'Failed to get timeseries data' });
  }
});

// Get recent activity
router.get('/recent', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await activityService.getRecentActivity(req.user!.userId, limit);
    res.json(activities);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({ error: 'Failed to get recent activity' });
  }
});

export default router;
