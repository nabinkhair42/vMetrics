import * as vscode from 'vscode';
import { AuthService } from './authService';
import { ActivityTracker } from './activityTracker';
import { HttpClient } from './httpClient';
import { ActivityEvent, UserSession, Config } from './types';

// Local storage interface for smart batching
interface LocalSession {
  sessionId: string;
  startTime: number;
  activities: ActivityEvent[];
  summary: {
    totalMinutes: number;
    filesWorked: Set<string>;
    languages: Map<string, number>;
    projects: Map<string, number>;
    saveCount: number;
    editCount: number;
    linesChanged: number;
    charactersTyped: number;
  };
}

export class ProductivityTracker {
  private authService: AuthService;
  private activityTracker: ActivityTracker | undefined;
  private httpClient: HttpClient | undefined;
  private statusBarItem: vscode.StatusBarItem;
  private currentSession: UserSession | undefined;
  
  // Local storage for smart batching
  private localSession: LocalSession | undefined;
  private syncTimer: NodeJS.Timeout | undefined;
  private readonly SYNC_INTERVAL = 90 * 1000; // 90 seconds (1.5 minutes) for better reliability
  private readonly MAX_ACTIVITIES_BUFFER = 30; // Smaller buffer for more frequent syncing

  constructor(private context: vscode.ExtensionContext) {
    console.log('🏗️ Initializing ProductivityTracker...');
    
    this.authService = new AuthService(context);
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 
      100
    );
    this.statusBarItem.command = 'productivityTracker.showStats';
    this.context.subscriptions.push(this.statusBarItem);
    
    console.log('📊 Status bar item created');
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('🔄 Initializing extension...');
    
    // Show welcome message for first-time users
    await this.showWelcomeMessageIfFirstTime();
    
    // Check if user is already logged in
    const session = await this.authService.getStoredSession();
    if (session) {
      console.log('👤 User session found, starting tracking...');
      await this.startTracking(session);
    } else {
      console.log('🔒 No user session, showing login prompt...');
      this.updateStatusBar('Click to login', false);
      this.statusBarItem.command = 'productivityTracker.login';
    }
    
    this.statusBarItem.show();
    console.log('✅ Status bar item is now visible');
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
      
      // Initialize HTTP client
      this.httpClient = new HttpClient(config, session);
      await this.httpClient.connect();
      
      // Initialize activity tracker
      this.activityTracker = new ActivityTracker(
        (event: ActivityEvent) => this.handleActivityEvent(event),
        machineId,
        session.userId,
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
    // Sync final session data before stopping
    if (this.localSession) {
      this.syncSessionData(true);
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = undefined;
    }

    if (this.activityTracker) {
      this.activityTracker.dispose();
      this.activityTracker = undefined;
    }
    
    if (this.httpClient) {
      this.httpClient.disconnect();
      this.httpClient = undefined;
    }
    
    this.currentSession = undefined;
    this.localSession = undefined;
    console.log('Productivity tracking stopped');
  }

  private handleActivityEvent(event: ActivityEvent): void {
    // Initialize local session if needed
    if (!this.localSession) {
      this.initializeLocalSession(event);
    }

    // Add to local buffer
    this.addToLocalSession(event);

    // Smart batching: sync if buffer is full or specific events occur
    const shouldSync = 
      this.localSession!.activities.length >= this.MAX_ACTIVITIES_BUFFER ||
      event.type === 'session_end' ||
      event.type === 'idle_start' ||
      (event.type === 'file_close' && event.duration && event.duration > 5 * 60 * 1000); // 5+ min sessions

    if (shouldSync) {
      this.syncSessionData();
    }

    // Send lightweight status updates for real-time features
    if (event.type === 'file_open' || event.type === 'focus') {
      this.sendStatusUpdate(event);
    }
    
    // Update status bar with current activity
    if (event.type === 'file_open' && event.file) {
      const fileName = event.file.split('/').pop() || event.file;
      this.updateStatusBar(`Tracking: ${fileName}`, true);
    }
  }

  private initializeLocalSession(event: ActivityEvent): void {
    this.localSession = {
      sessionId: event.sessionId,
      startTime: Date.now(),
      activities: [],
      summary: {
        totalMinutes: 0,
        filesWorked: new Set<string>(),
        languages: new Map<string, number>(),
        projects: new Map<string, number>(),
        saveCount: 0,
        editCount: 0,
        linesChanged: 0,
        charactersTyped: 0
      }
    };

    // Start periodic sync
    this.startSyncTimer();
  }

  private addToLocalSession(event: ActivityEvent): void {
    if (!this.localSession) return;

    // Add to activities buffer
    this.localSession.activities.push(event);

    // Update summary
    const summary = this.localSession.summary;
    
    if (event.file) {
      summary.filesWorked.add(event.file);
    }

    if (event.language) {
      const current = summary.languages.get(event.language) || 0;
      const duration = event.duration || 0;
      summary.languages.set(event.language, current + duration / 60000);
    }

    if (event.project) {
      const current = summary.projects.get(event.project) || 0;
      const duration = event.duration || 0;
      summary.projects.set(event.project, current + duration / 60000);
    }

    if (event.type === 'file_save') summary.saveCount++;
    if (event.type === 'file_edit') summary.editCount++;
    if (event.linesChanged) summary.linesChanged += event.linesChanged;
    if (event.charactersTyped) summary.charactersTyped += event.charactersTyped;
    if (event.duration) summary.totalMinutes += event.duration / 60000;
  }

  private async syncSessionData(final: boolean = false): Promise<void> {
    if (!this.localSession || !this.httpClient) return;

    try {
      // Convert Map to Object for JSON serialization
      const sessionData = {
        sessionId: this.localSession.sessionId,
        startTime: new Date(this.localSession.startTime),
        endTime: new Date(),
        duration: Date.now() - this.localSession.startTime,
        summary: {
          totalMinutes: Math.round(this.localSession.summary.totalMinutes),
          filesWorked: Array.from(this.localSession.summary.filesWorked),
          languages: Object.fromEntries(this.localSession.summary.languages),
          projects: Object.fromEntries(this.localSession.summary.projects),
          saveCount: this.localSession.summary.saveCount,
          editCount: this.localSession.summary.editCount,
          linesChanged: this.localSession.summary.linesChanged,
          charactersTyped: this.localSession.summary.charactersTyped
        },
        isActive: !final,
        activitiesCount: this.localSession.activities.length,
        machineId: await this.authService.getMachineId()
      };

      // Only sync if there's meaningful data (at least 1 minute or activity)
      if (sessionData.summary.totalMinutes < 1 && sessionData.activitiesCount === 0) {
        console.log('⏭️ Skipping sync - no meaningful activity data');
        return;
      }

      // Send to new session endpoint
      console.log('🚀 Sending session data to server:', {
        sessionId: sessionData.sessionId,
        duration: Math.round(sessionData.duration / 1000) + 's',
        totalMinutes: sessionData.summary.totalMinutes,
        filesWorked: sessionData.summary.filesWorked.length,
        activitiesCount: sessionData.activitiesCount
      });
      
      await this.httpClient.sendSessionData(sessionData);

      // Clear activities buffer after successful sync (keep summary for continuation)
      this.localSession.activities = [];

      console.log(`📤 Synced session data successfully: ${sessionData.summary.totalMinutes} minutes, ${sessionData.activitiesCount} activities`);

      if (final) {
        this.localSession = undefined;
      }
    } catch (error: any) {
      console.error('❌ Failed to sync session data:', error);
      
      // Show user-friendly error for specific cases
      if (error.message?.includes('timeout')) {
        console.log('⏳ Server timeout - will retry on next sync');
      } else if (error.message?.includes('Network')) {
        console.log('🌐 Network error - will retry when connection is restored');
      } else {
        console.log('💾 Unknown error - keeping data in buffer for retry');
      }
      
      // Keep data in buffer for retry (don't clear activities)
    }
  }

  private async sendStatusUpdate(event: ActivityEvent): Promise<void> {
    if (!this.httpClient || !this.localSession) return;

    try {
      await this.httpClient.sendStatusUpdate({
        currentFile: event.file,
        currentProject: event.project,
        sessionId: this.localSession.sessionId
      });
    } catch (error) {
      console.error('Failed to send status update:', error);
      // Non-critical, continue
    }
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.syncSessionData();
      this.startSyncTimer(); // Schedule next sync
    }, this.SYNC_INTERVAL);
  }

  private getConfiguration(): Config {
    const config = vscode.workspace.getConfiguration('productivityTracker');
    
    // Check for environment variables first (for development/deployment flexibility)
    // These can be set in terminal before launching VS Code or in system environment
    const serverUrl = process.env.PRODUCTIVITY_SERVER_URL || 
                     config.get('serverUrl', 'http://localhost:3001');
    
    const idleTimeoutMinutes = parseInt(process.env.PRODUCTIVITY_IDLE_TIMEOUT || '') || 
                              config.get('idleTimeoutMinutes', 5);
    
    // Additional environment variable support for sync settings
    const syncIntervalSeconds = parseInt(process.env.PRODUCTIVITY_SYNC_INTERVAL || '') || 
                               Math.round(this.SYNC_INTERVAL / 1000);
    
    console.log(`🔧 Configuration loaded:`, {
      serverUrl,
      idleTimeout: `${idleTimeoutMinutes}m`,
      syncInterval: `${syncIntervalSeconds}s`,
      source: process.env.PRODUCTIVITY_SERVER_URL ? 'environment' : 'vscode-settings'
    });
    
    return {
      serverUrl,
      idleTimeoutMinutes
    };
  }

  private updateStatusBar(text: string, isTracking: boolean): void {
    const icon = isTracking ? '$(graph)' : '$(sign-in)';
    this.statusBarItem.text = `${icon} ${text}`;
    this.statusBarItem.backgroundColor = isTracking 
      ? new vscode.ThemeColor('statusBarItem.prominentBackground')
      : new vscode.ThemeColor('statusBarItem.warningBackground');
    
    // Update tooltip with more information
    if (isTracking) {
      this.statusBarItem.tooltip = 'Productivity Tracker: Active - Tracking your coding activity\nClick to view stats';
    } else {
      this.statusBarItem.tooltip = 'Productivity Tracker: Not logged in\nClick to login with GitHub';
    }
  }

  async showStats(): Promise<void> {
    if (this.httpClient && this.httpClient.isConnectedToServer()) {
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
            this.httpClient.requestStats();
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
  console.log('🚀 Productivity Tracker extension is now active');
  
  try {
    const tracker = new ProductivityTracker(context);
    
    // Register commands with error handling
    const commands = [
      vscode.commands.registerCommand('productivityTracker.login', async () => {
        console.log('Command: productivityTracker.login executed');
        try {
          await tracker.login();
        } catch (error) {
          console.error('Login command error:', error);
          vscode.window.showErrorMessage(`Login failed: ${error}`);
        }
      }),
      vscode.commands.registerCommand('productivityTracker.logout', async () => {
        console.log('Command: productivityTracker.logout executed');
        try {
          await tracker.logout();
        } catch (error) {
          console.error('Logout command error:', error);
          vscode.window.showErrorMessage(`Logout failed: ${error}`);
        }
      }),
      vscode.commands.registerCommand('productivityTracker.showStats', async () => {
        console.log('Command: productivityTracker.showStats executed');
        try {
          await tracker.showStats();
        } catch (error) {
          console.error('Show stats command error:', error);
          vscode.window.showErrorMessage(`Show stats failed: ${error}`);
        }
      }),
      vscode.commands.registerCommand('productivityTracker.openDashboard', async () => {
        console.log('Command: productivityTracker.openDashboard executed');
        try {
          await tracker.openDashboard();
        } catch (error) {
          console.error('Open dashboard command error:', error);
          vscode.window.showErrorMessage(`Open dashboard failed: ${error}`);
        }
      }),
      vscode.commands.registerCommand('productivityTracker.toggleTracking', async () => {
        console.log('Command: productivityTracker.toggleTracking executed');
        try {
          await tracker.toggleTracking();
        } catch (error) {
          console.error('Toggle tracking command error:', error);
          vscode.window.showErrorMessage(`Toggle tracking failed: ${error}`);
        }
      })
    ];
    
    commands.forEach(cmd => context.subscriptions.push(cmd));
    context.subscriptions.push(tracker);
    
    console.log('✅ All commands registered successfully');
    
    // Show a confirmation that the extension loaded
    vscode.window.showInformationMessage('Productivity Tracker extension loaded successfully!');
    
  } catch (error) {
    console.error('❌ Extension activation failed:', error);
    vscode.window.showErrorMessage(`Productivity Tracker failed to activate: ${error}`);
  }
}

export function deactivate() {
  console.log('🛑 Productivity Tracker extension is now deactivated');
}
