import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { activityService } from '../services/activity.service.js';
import { goalService } from '../services/goal.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { SessionUpdateRequestSchema, StatusUpdateRequestSchema } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Update/create session with aggregated data
router.post('/session', async (req: Request, res: Response) => {
  const data = SessionUpdateRequestSchema.parse(req.body);
  const userId = req.user!.user_id;

  await activityService.updateSession(userId, data);

  // Update goals
  await goalService.updateGoalsFromActivity(userId, data.summary.total_minutes);

  // Check for new achievements
  const newAchievements = await goalService.checkAchievements(userId);

  res.json({
    success: true,
    new_achievements: newAchievements,
  });
});

// End session
router.post('/session/end', async (req: Request, res: Response) => {
  const schema = z.object({
    session_id: z.string().uuid(),
  });

  const { session_id } = schema.parse(req.body);
  await activityService.endSession(req.user!.user_id, session_id);

  res.json({ success: true });
});

// Lightweight status update (real-time)
router.post('/status', async (req: Request, res: Response) => {
  const data = StatusUpdateRequestSchema.parse(req.body);

  // Just acknowledge - status is sent via WebSocket
  res.json({
    success: true,
    received: {
      session_id: data.session_id,
      current_file: data.current_file,
      current_project: data.current_project,
    },
  });
});

// Get dashboard data
router.get('/dashboard/:timeRange', async (req: Request, res: Response) => {
  const timeRangeSchema = z.enum(['today', 'week', 'month']);
  const timeRange = timeRangeSchema.parse(req.params.timeRange);

  const data = await activityService.getDashboardData(req.user!.user_id, timeRange);
  res.json(data);
});

// Get recent sessions
router.get('/sessions/recent', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const sessions = await activityService.getRecentSessions(req.user!.user_id, limit);

  res.json({ sessions });
});

// Get goals
router.get('/goals', async (req: Request, res: Response) => {
  const goals = await goalService.getActiveGoals(req.user!.user_id);
  res.json({ goals });
});

// Create goal
router.post('/goals', async (req: Request, res: Response) => {
  const schema = z.object({
    type: z.enum(['daily_minutes', 'weekly_minutes', 'streak_days', 'project_focus', 'language_learning']),
    target: z.number().positive(),
  });

  const { type, target } = schema.parse(req.body);
  const goal = await goalService.createGoal(req.user!.user_id, type, target);

  res.json({ goal });
});

// Get achievement definitions
router.get('/achievements/definitions', async (_req: Request, res: Response) => {
  const definitions = await goalService.getAchievementDefinitions();
  res.json({ definitions });
});

export const activityRoutes = router;
