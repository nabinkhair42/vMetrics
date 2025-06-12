import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Activity, ActivitySession, DailySummary } from '../models/Activity';
import { ActivityService } from '../services/ActivityService';

const router = express.Router();
const activityService = new ActivityService();

// Smart session-based activity tracking
router.post('/session', authenticateToken as any, async (req: any, res: Response) => {
  try {
    // Handle both wrapper format and direct format for compatibility
    const sessionData = req.body.sessionData || req.body;
    const userId = req.user!.userId;
    
    console.log('📊 Received session data:', {
      sessionId: sessionData.sessionId,
      duration: sessionData.duration,
      totalMinutes: sessionData.summary?.totalMinutes,
      userId: userId
    });
    
    // Validate required sessionId
    if (!sessionData.sessionId) {
      return res.status(400).json({ 
        error: 'Missing sessionId in session data',
        received: Object.keys(sessionData)
      });
    }
    
    // Create or update session
    const session = await ActivitySession.findOneAndUpdate(
      { 
        userId,
        sessionId: sessionData.sessionId,
        machineId: sessionData.machineId
      },
      {
        ...sessionData,
        userId,
        lastActivity: new Date(),
        isActive: true
      },
      { 
        upsert: true, 
        new: true 
      }
    );

    // Update daily summary
    await activityService.updateDailySummary(userId, sessionData);
    
    res.json({ 
      success: true, 
      sessionId: session.sessionId,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Session update error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Real-time status update (lightweight)
router.post('/status', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { currentFile, currentProject, sessionId } = req.body;
    const userId = req.user!.userId;

    await ActivitySession.findOneAndUpdate(
      { userId, sessionId },
      {
        currentFile,
        currentProject,
        lastActivity: new Date(),
        isActive: true
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get live team status
router.get('/status/team', authenticateToken as any, async (req: any, res: Response) => {
  try {
    // Only show sessions active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const liveStatuses = await ActivitySession.find({
      isActive: true,
      lastActivity: { $gte: fiveMinutesAgo }
    })
    .populate('userId', 'username email')
    .select('userId currentFile currentProject workspaceName lastActivity')
    .sort({ lastActivity: -1 })
    .limit(50);

    res.json(liveStatuses);
  } catch (error) {
    console.error('Team status error:', error);
    res.status(500).json({ error: 'Failed to get team status' });
  }
});

// Get user dashboard data
router.get('/dashboard/:timeRange?', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const timeRange = req.params.timeRange || 'today';
    const userId = req.user!.userId;
    
    const dashboardData = await activityService.getDashboardData(userId, timeRange);
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Batch activity endpoint (legacy support)
router.post('/batch', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { activities } = req.body;
    const userId = req.user!.userId;
    
    // Process batch activities into session data
    const sessionSummary = activityService.aggregateActivities(activities);
    
    // Create session
    const session = await ActivitySession.create({
      ...sessionSummary,
      userId,
      lastActivity: new Date(),
      isActive: true
    });
    
    res.json({ 
      success: true, 
      sessionId: session.sessionId,
      activitiesProcessed: activities.length
    });
  } catch (error) {
    console.error('Batch activity error:', error);
    res.status(500).json({ error: 'Failed to process batch activities' });
  }
});

// End session
router.post('/session/end', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user!.userId;
    
    await ActivitySession.findOneAndUpdate(
      { userId, sessionId },
      {
        endTime: new Date(),
        isActive: false
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get recent sessions
router.get('/sessions/recent', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const sessions = await ActivitySession.find({ userId })
      .sort({ startTime: -1 })
      .limit(limit)
      .select('sessionId startTime endTime duration summary currentFile currentProject workspaceName isActive');
    
    res.json(sessions);
  } catch (error) {
    console.error('Recent sessions error:', error);
    res.status(500).json({ error: 'Failed to get recent sessions' });
  }
});

// Get recent activities
router.get('/activities/recent', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const activities = await activityService.getRecentActivity(userId, limit);
    
    res.json(activities);
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ error: 'Failed to get recent activities' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    version: 'v2-sessions'
  });
});

export default router;
