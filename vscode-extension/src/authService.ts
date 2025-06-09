import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { UserSession } from './types';

export class AuthService {
  private static readonly SESSION_KEY = 'productivityTracker.session';
  private static readonly MACHINE_ID_KEY = 'productivityTracker.machineId';
  
  constructor(private context: vscode.ExtensionContext) {}

  async login(): Promise<UserSession | null> {
    try {
      // Use VSCode's GitHub authentication API
      const githubSession = await vscode.authentication.getSession('github', ['user:email'], { 
        createIfNone: true 
      });

      if (githubSession) {
        // Send GitHub token to our backend to validate and get our JWT
        const response = await this.authenticateWithBackend(githubSession.accessToken);
        
        if (response) {
          const userSession: UserSession = {
            userId: response.user.id,
            token: response.token,
            email: response.user.email,
            username: response.user.username
          };

          // Store session securely
          await this.context.secrets.store(AuthService.SESSION_KEY, JSON.stringify(userSession));
          
          console.log(`✅ User authenticated: ${userSession.username}`);
          return userSession;
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      vscode.window.showErrorMessage('Authentication failed. Please try again.');
    }

    return null;
  }

  private async authenticateWithBackend(githubToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const http = require('http');
      
      const postData = JSON.stringify({ githubToken });
      const url = new URL('http://localhost:3001/api/auth/vscode-login');
      const requestModule = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = requestModule.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            reject(new Error(`Authentication failed: HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Authentication timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  async logout(): Promise<void> {
    try {
      await this.context.secrets.delete(AuthService.SESSION_KEY);
      vscode.window.showInformationMessage('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async getStoredSession(): Promise<UserSession | null> {
    try {
      const sessionData = await this.context.secrets.get(AuthService.SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('Failed to retrieve stored session:', error);
    }
    return null;
  }

  async getMachineId(): Promise<string> {
    let machineId = await this.context.globalState.get<string>(AuthService.MACHINE_ID_KEY);
    
    if (!machineId) {
      // Generate a simple UUID-like string using crypto
      machineId = crypto.randomBytes(16).toString('hex');
      await this.context.globalState.update(AuthService.MACHINE_ID_KEY, machineId);
    }
    
    return machineId;
  }

  async isLoggedIn(): Promise<boolean> {
    const session = await this.getStoredSession();
    return session !== null;
  }
}
