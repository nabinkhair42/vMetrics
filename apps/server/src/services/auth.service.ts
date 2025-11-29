import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export class AuthService {
  async exchangeCodeForToken(code: string): Promise<string> {
    // Exchange code for GitHub access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new AppError(401, 'Failed to exchange code for token', 'OAUTH_FAILED');
    }

    const tokenData = await tokenResponse.json() as GitHubTokenResponse;

    if (!tokenData.access_token) {
      throw new AppError(401, 'Invalid authorization code', 'INVALID_CODE');
    }

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new AppError(401, 'Failed to get user info', 'USER_FETCH_FAILED');
    }

    const githubUser = await userResponse.json() as GitHubUser;

    // Upsert user in database
    const user = await this.upsertUser(githubUser);

    // Generate JWT
    return generateToken({
      user_id: user.id,
      github_id: user.github_id,
      username: user.username,
      email: user.email || undefined,
    });
  }

  async authenticateWithGitHubToken(githubToken: string): Promise<string> {
    // Get GitHub user info with the provided token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new AppError(401, 'Invalid GitHub token', 'INVALID_GITHUB_TOKEN');
    }

    const githubUser = await userResponse.json() as GitHubUser;

    // Upsert user in database
    const user = await this.upsertUser(githubUser);

    // Generate JWT
    return generateToken({
      user_id: user.id,
      github_id: user.github_id,
      username: user.username,
      email: user.email || undefined,
    });
  }

  private async upsertUser(githubUser: GitHubUser) {
    const now = new Date().toISOString();
    const githubId = String(githubUser.id);

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('github_id', githubId)
      .single();

    if (existing) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          username: githubUser.login,
          email: githubUser.email,
          name: githubUser.name,
          avatar_url: githubUser.avatar_url,
          updated_at: now,
        })
        .eq('github_id', githubId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        github_id: githubId,
        username: githubUser.login,
        email: githubUser.email,
        name: githubUser.name,
        avatar_url: githubUser.avatar_url,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize streak for new user
    await supabase.from('streaks').insert({
      user_id: data.id,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: now.split('T')[0],
      created_at: now,
      updated_at: now,
    });

    // Create default goal
    await supabase.from('goals').insert({
      user_id: data.id,
      type: 'daily_minutes',
      target: 120, // 2 hours default
      current: 0,
      is_active: true,
      start_date: now,
      created_at: now,
      updated_at: now,
    });

    return data;
  }

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async verifyToken(token: string) {
    const { verifyToken } = await import('../middleware/auth.js');
    const payload = verifyToken(token);

    if (!payload) {
      throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
    }

    const user = await this.getUserById(payload.user_id);
    return { user, payload };
  }
}

export const authService = new AuthService();
