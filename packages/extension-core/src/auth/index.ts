import type { UserSession, TrackerConfig } from '../types/index.js';

export interface AuthStorage {
  getToken(): Promise<string | undefined>;
  setToken(token: string): Promise<void>;
  deleteToken(): Promise<void>;
}

export class AuthService {
  private serverUrl: string;
  private storage: AuthStorage;
  private session: UserSession | null = null;

  constructor(config: Pick<TrackerConfig, 'serverUrl'>, storage: AuthStorage) {
    this.serverUrl = config.serverUrl;
    this.storage = storage;
  }

  async initialize(): Promise<UserSession | null> {
    const token = await this.storage.getToken();

    if (!token) {
      return null;
    }

    // Verify token
    const session = await this.verifyToken(token);

    if (session) {
      this.session = session;
    } else {
      // Token is invalid, clear it
      await this.storage.deleteToken();
    }

    return this.session;
  }

  async loginWithGitHubToken(githubToken: string): Promise<UserSession> {
    const response = await fetch(`${this.serverUrl}/auth/vscode-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ github_token: githubToken }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Login failed: ${error}`);
    }

    const { token } = await response.json() as { token: string };

    // Verify and decode the token
    const session = await this.verifyToken(token);

    if (!session) {
      throw new Error('Invalid token received from server');
    }

    // Store the token
    await this.storage.setToken(token);
    this.session = session;

    return session;
  }

  async logout(): Promise<void> {
    if (this.session) {
      try {
        await fetch(`${this.serverUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await this.storage.getToken()}`,
          },
        });
      } catch {
        // Ignore logout errors
      }
    }

    await this.storage.deleteToken();
    this.session = null;
  }

  private async verifyToken(token: string): Promise<UserSession | null> {
    try {
      const response = await fetch(`${this.serverUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const { user } = await response.json() as {
        user: { id: string; username: string; email?: string; avatar_url?: string }
      };

      // Decode token payload
      const payload = this.decodeToken(token);

      if (!payload) {
        return null;
      }

      return {
        token,
        userId: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        expiresAt: payload.exp * 1000,
      };
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): { exp: number; user_id: string } | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch {
      return null;
    }
  }

  getSession(): UserSession | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    if (!this.session) return false;

    // Check if token is expired
    if (this.session.expiresAt < Date.now()) {
      this.session = null;
      return false;
    }

    return true;
  }

  async getToken(): Promise<string | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    return this.session?.token || null;
  }
}

export * from '../types/index.js';
