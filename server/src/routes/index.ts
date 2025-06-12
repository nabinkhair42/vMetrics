import * as authRoutes from './auth';
import * as activityNewRoutes from './activityNew';
import * as healthRoutes from './health-root';

import { Router } from 'express';

const router: Router = Router();
// Health check route
router.use('/health', healthRoutes.HealthRoot);

// Root route
router.use('/', healthRoutes.RootRoute);

// Authentication routes

router.use('/auth', authRoutes.default);

// Activity tracking routes
router.use('/activity', activityNewRoutes.default);

// 404 Not Found handler
router.use('*', healthRoutes.NotFoundRoute);

// Export the router
export default router;

