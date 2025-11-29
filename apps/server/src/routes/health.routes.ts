import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Quick database ping
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
      });
    }

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Root endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'vMetrics API',
    version: '1.0.0',
    docs: '/docs',
    health: '/health',
  });
});

export const healthRoutes = router;
