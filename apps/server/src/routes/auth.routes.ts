import { Router, type IRouter, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router: IRouter = Router();

// GitHub OAuth - redirect to GitHub
router.get('/github', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email',
    state: crypto.randomUUID(),
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// GitHub OAuth callback
router.get('/github/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/auth/error?message=Missing+code`);
    }

    const token = await authService.exchangeCodeForToken(code);

    // Redirect to frontend with token
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/auth/error?message=Authentication+failed`);
  }
});

// VSCode extension login with GitHub token
const vscodeLoginSchema = z.object({
  github_token: z.string().min(1),
});

router.post('/vscode-login', async (req: Request, res: Response) => {
  try {
    const { github_token } = vscodeLoginSchema.parse(req.body);
    const token = await authService.authenticateWithGitHubToken(github_token);

    res.json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors,
      });
    }
    throw error;
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.user_id);

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.user!.user_id);

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
  });
});

// Logout (client-side only for JWT, but endpoint for future use)
router.post('/logout', authenticateToken, (_req: Request, res: Response) => {
  res.json({ success: true });
});

export const authRoutes: IRouter = router;
