import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { UserSession } from './types';

export class AuthService {
  private static readonly SESSION_KEY = 'productivityTracker.session';
  private static readonly MACHINE_ID_KEY = 'productivityTracker.machineId';
  
  constructor(private context: vscode.ExtensionContext) {}

  async login(): Promise<UserSession | null> {
    try {
      // Use VSCode's GitHub authentication API
      const session = await vscode.authentication.getSession('github', ['user:email'], { 
        createIfNone: true 
      });

      if (session) {
        const userSession: UserSession = {
          userId: session.account.id,
          token: session.accessToken,
          email: session.account.label,
          username: session.account.label
        };

        // Store session securely
        await this.context.secrets.store(AuthService.SESSION_KEY, JSON.stringify(userSession));
        
        return userSession;
      }
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      vscode.window.showErrorMessage('Failed to authenticate with GitHub');
    }
    
    return null;
  }

  async logout(): Promise<void> {
    await this.context.secrets.delete(AuthService.SESSION_KEY);
    vscode.window.showInformationMessage('Logged out successfully');
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
      machineId = uuidv4();
      await this.context.globalState.update(AuthService.MACHINE_ID_KEY, machineId);
    }
    
    return machineId;
  }

  async isLoggedIn(): Promise<boolean> {
    const session = await this.getStoredSession();
    return session !== null;
  }
}
