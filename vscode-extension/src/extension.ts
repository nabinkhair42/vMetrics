import * as vscode from 'vscode';
import { AuthService } from './authService';
import { ActivityTracker } from './activityTracker';
import { WebSocketClient } from './webSocketClient';
import { ActivityEvent, UserSession, Config } from './types';

export class ProductivityTracker {
  private authService: AuthService;
  private activityTracker: ActivityTracker | undefined;
  private webSocketClient: WebSocketClient | undefined;
  private statusBarItem: vscode.StatusBarItem;
  private currentSession: UserSession | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.authService = new AuthService(context);
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 
      100
    );
    this.statusBarItem.command = 'productivityTracker.showStats';
    this.context.subscriptions.push(this.statusBarItem);
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Show welcome message for first-time users
    await this.showWelcomeMessageIfFirstTime();
    
    // Check if user is already logged in
    const session = await this.authService.getStoredSession();
    if (session) {
      await this.startTracking(session);
    } else {
      this.updateStatusBar('Click to login', false);
      this.statusBarItem.command = 'productivityTracker.login';
    }
    
    this.statusBarItem.show();
  }

  private async showWelcomeMessageIfFirstTime(): Promise<void> {
    const hasShownWelcome = this.context.globalState.get('hasShownWelcome', false);
    
    if (!hasShownWelcome) {
      const action = await vscode.window.showInformationMessage(
        '🎯 Welcome to Productivity Tracker! Track your coding activity and improve your productivity.',
        'Get Started',
        'View Dashboard',
        'Later'
      );
      
      if (action === 'Get Started') {
        await this.login();
      } else if (action === 'View Dashboard') {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
      }
      
      this.context.globalState.update('hasShownWelcome', true);
    }
  }

  async login(): Promise<void> {
    try {
      const session = await this.authService.login();
      if (session) {
        await this.startTracking(session);
        vscode.window.showInformationMessage('Successfully logged in to Productivity Tracker');
      }
    } catch (error) {
      console.error('Login failed:', error);
      vscode.window.showErrorMessage('Login failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    this.stopTracking();
    await this.authService.logout();
    this.updateStatusBar('Click to login', false);
    this.statusBarItem.command = 'productivityTracker.login';
  }

  private async startTracking(session: UserSession): Promise<void> {
    this.currentSession = session;
    
    try {
      // Get configuration
      const config = this.getConfiguration();
      
      // Get machine ID
      const machineId = await this.authService.getMachineId();
      
      // Initialize WebSocket client
      this.webSocketClient = new WebSocketClient(config, session);
      await this.webSocketClient.connect();
      
      // Initialize activity tracker
      this.activityTracker = new ActivityTracker(
        (event: ActivityEvent) => this.handleActivityEvent(event),
        machineId,
        config.idleTimeoutMinutes * 60 * 1000
      );
      
      this.updateStatusBar('Tracking...', true);
      this.statusBarItem.command = 'productivityTracker.showStats';
      
      console.log('Productivity tracking started');
      
    } catch (error) {
      console.error('Failed to start tracking:', error);
      vscode.window.showErrorMessage('Failed to start productivity tracking');
    }
  }

  private stopTracking(): void {
    if (this.activityTracker) {
      this.activityTracker.dispose();
      this.activityTracker = undefined;
    }
    
    if (this.webSocketClient) {
      this.webSocketClient.disconnect();
      this.webSocketClient = undefined;
    }
    
    this.currentSession = undefined;
    console.log('Productivity tracking stopped');
  }

  private handleActivityEvent(event: ActivityEvent): void {
    if (this.webSocketClient) {
      this.webSocketClient.sendEvent(event);
    }
    
    // Update status bar with current activity
    if (event.type === 'file_open' && event.file) {
      const fileName = event.file.split('/').pop() || event.file;
      this.updateStatusBar(`Tracking: ${fileName}`, true);
    }
  }

  private getConfiguration(): Config {
    const config = vscode.workspace.getConfiguration('productivityTracker');
    return {
      serverUrl: config.get('serverUrl', 'ws://localhost:3001'),
      idleTimeoutMinutes: config.get('idleTimeoutMinutes', 5)
    };
  }

  private updateStatusBar(text: string, isTracking: boolean): void {
    const icon = isTracking ? '$(pulse)' : '$(account)';
    this.statusBarItem.text = `${icon} ${text}`;
    this.statusBarItem.backgroundColor = isTracking 
      ? undefined 
      : new vscode.ThemeColor('statusBarItem.warningBackground');
    
    // Update tooltip with more information
    if (isTracking) {
      this.statusBarItem.tooltip = 'Productivity Tracker: Active\nClick to view stats';
    } else {
      this.statusBarItem.tooltip = 'Productivity Tracker: Not logged in\nClick to login';
    }
  }

  async showStats(): Promise<void> {
    if (this.webSocketClient && this.webSocketClient.isConnectedToServer()) {
      // Show quick stats in status bar or request detailed stats
      const action = await vscode.window.showQuickPick([
        {
          label: '📊 View Dashboard',
          description: 'Open productivity dashboard in browser'
        },
        {
          label: '📈 Quick Stats',
          description: 'Show today\'s stats in notification'
        },
        {
          label: '⚙️ Settings',
          description: 'Configure tracking preferences'
        },
        {
          label: '🚪 Logout',
          description: 'Stop tracking and logout'
        }
      ], {
        placeHolder: 'Productivity Tracker - Choose an action'
      });

      if (action) {
        switch (action.label) {
          case '📊 View Dashboard':
            vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000/dashboard'));
            break;
          case '📈 Quick Stats':
            this.webSocketClient.requestStats();
            break;
          case '⚙️ Settings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'productivityTracker');
            break;
          case '🚪 Logout':
            await this.logout();
            break;
        }
      }
    } else if (this.currentSession) {
      vscode.window.showWarningMessage('Connecting to server...');
    } else {
      const action = await vscode.window.showInformationMessage(
        'Please login to start tracking your productivity',
        'Login',
        'View Dashboard'
      );
      
      if (action === 'Login') {
        await this.login();
      } else if (action === 'View Dashboard') {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
      }
    }
  }

  async openDashboard(): Promise<void> {
    const dashboardUrl = 'http://localhost:3000/dashboard';
    vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
    
    if (!this.currentSession) {
      vscode.window.showInformationMessage(
        'Dashboard opened! You may need to login there to view your data.',
        'Login to Extension'
      ).then(action => {
        if (action === 'Login to Extension') {
          this.login();
        }
      });
    }
  }

  async toggleTracking(): Promise<void> {
    if (this.currentSession) {
      const action = await vscode.window.showWarningMessage(
        'This will stop tracking and logout. Continue?',
        'Yes, Stop Tracking',
        'Cancel'
      );
      
      if (action === 'Yes, Stop Tracking') {
        await this.logout();
      }
    } else {
      await this.login();
    }
  }

  dispose(): void {
    this.stopTracking();
    this.statusBarItem.dispose();
  }
}

// Extension activation
export function activate(context: vscode.ExtensionContext) {
  console.log('Productivity Tracker extension is now active');
  
  const tracker = new ProductivityTracker(context);
  
  // Register commands
  const commands = [
    vscode.commands.registerCommand('productivityTracker.login', () => tracker.login()),
    vscode.commands.registerCommand('productivityTracker.logout', () => tracker.logout()),
    vscode.commands.registerCommand('productivityTracker.showStats', () => tracker.showStats()),
    vscode.commands.registerCommand('productivityTracker.openDashboard', () => tracker.openDashboard()),
    vscode.commands.registerCommand('productivityTracker.toggleTracking', () => tracker.toggleTracking())
  ];
  
  commands.forEach(cmd => context.subscriptions.push(cmd));
  context.subscriptions.push(tracker);
}

export function deactivate() {
  console.log('Productivity Tracker extension is now deactivated');
}
