import * as vscode from 'vscode';
import {
  ActivityTracker,
  SyncService,
  AuthService,
  generateMachineId,
  formatDuration,
  type LocalSession,
  type ActivityEvent,
  type TrackerConfig,
} from '@vmetrics/extension-core';
import { VSCodeAdapter } from './vscode-adapter';

// Constants
const TOKEN_KEY = 'vmetrics.auth.token';
const MACHINE_ID_KEY = 'vmetrics.machineId';

// Extension state
let adapter: VSCodeAdapter;
let tracker: ActivityTracker | null = null;
let syncService: SyncService;
let authService: AuthService;
let machineId: string;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('vMetrics: Activating extension...');

  // Initialize adapter
  adapter = new VSCodeAdapter(context);

  // Get or create machine ID
  machineId = adapter.getGlobalState<string>(MACHINE_ID_KEY) || generateMachineId();
  await adapter.setGlobalState(MACHINE_ID_KEY, machineId);

  // Get configuration
  const config = getConfig();

  // Initialize services
  syncService = new SyncService({ serverUrl: config.serverUrl }, machineId);

  authService = new AuthService(
    { serverUrl: config.serverUrl },
    {
      getToken: () => adapter.getSecret(TOKEN_KEY),
      setToken: (token) => adapter.setSecret(TOKEN_KEY, token),
      deleteToken: () => adapter.deleteSecret(TOKEN_KEY),
    }
  );

  // Try to restore session
  const session = await authService.initialize();

  if (session) {
    syncService.setToken(session.token);
    adapter.showStatusBarItem('$(check) vMetrics', `Logged in as ${session.username}`);

    // Auto-start tracking if configured
    if (config.trackOnStartup) {
      startTracking(config);
    }
  } else {
    adapter.showStatusBarItem('$(sign-in) vMetrics', 'Click to login');
  }

  // Register commands
  registerCommands(context, config);

  console.log('vMetrics: Extension activated');
}

function getConfig(): TrackerConfig & { dashboardUrl: string; showNotifications: boolean; trackOnStartup: boolean } {
  const vsConfig = vscode.workspace.getConfiguration('vmetrics');

  return {
    serverUrl: vsConfig.get('serverUrl', 'https://api.vmetrics.dev'),
    dashboardUrl: vsConfig.get('dashboardUrl', 'https://vmetrics.dev'),
    idleTimeoutMinutes: vsConfig.get('idleTimeoutMinutes', 5),
    syncIntervalSeconds: vsConfig.get('syncIntervalSeconds', 90),
    maxBatchSize: 30,
    showNotifications: vsConfig.get('showNotifications', true),
    trackOnStartup: vsConfig.get('trackOnStartup', true),
  };
}

function registerCommands(context: vscode.ExtensionContext, config: ReturnType<typeof getConfig>): void {
  // Login command
  context.subscriptions.push(
    vscode.commands.registerCommand('vmetrics.login', async () => {
      try {
        adapter.showStatusBarItem('$(loading~spin) vMetrics', 'Logging in...');

        // Get GitHub token via VS Code's built-in auth
        const githubToken = await adapter.authenticateWithGitHub();

        // Exchange for vMetrics token
        const session = await authService.loginWithGitHubToken(githubToken);
        syncService.setToken(session.token);

        adapter.showStatusBarItem('$(check) vMetrics', `Logged in as ${session.username}`);

        if (config.showNotifications) {
          vscode.window.showInformationMessage(`vMetrics: Welcome, ${session.username}!`);
        }

        // Start tracking
        if (config.trackOnStartup) {
          startTracking(config);
        }
      } catch (error) {
        adapter.showStatusBarItem('$(error) vMetrics', 'Login failed');
        vscode.window.showErrorMessage(
          `vMetrics: Login failed - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    })
  );

  // Logout command
  context.subscriptions.push(
    vscode.commands.registerCommand('vmetrics.logout', async () => {
      // Stop tracking
      if (tracker) {
        tracker.dispose();
        tracker = null;
      }

      // Logout
      await authService.logout();
      syncService.setToken(null);

      adapter.showStatusBarItem('$(sign-in) vMetrics', 'Click to login');

      if (config.showNotifications) {
        vscode.window.showInformationMessage('vMetrics: Logged out successfully');
      }
    })
  );

  // Toggle tracking command
  context.subscriptions.push(
    vscode.commands.registerCommand('vmetrics.toggleTracking', () => {
      if (!authService.isAuthenticated()) {
        vscode.commands.executeCommand('vmetrics.login');
        return;
      }

      if (tracker?.isActive()) {
        stopTracking();
      } else {
        startTracking(config);
      }
    })
  );

  // Open dashboard command
  context.subscriptions.push(
    vscode.commands.registerCommand('vmetrics.openDashboard', () => {
      vscode.env.openExternal(vscode.Uri.parse(config.dashboardUrl));
    })
  );

  // Show stats command
  context.subscriptions.push(
    vscode.commands.registerCommand('vmetrics.showStats', async () => {
      if (!authService.isAuthenticated()) {
        vscode.window.showWarningMessage('vMetrics: Please login first');
        return;
      }

      const session = tracker?.getSession();

      if (session) {
        const totalTime = formatDuration(session.summary.totalMinutes);
        const languages = Array.from(session.summary.languages.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([lang, mins]) => `${lang}: ${formatDuration(mins)}`)
          .join(', ');

        vscode.window.showInformationMessage(
          `vMetrics Today: ${totalTime} | ${session.summary.filesWorked.size} files | ${languages || 'No languages yet'}`
        );
      } else {
        vscode.window.showInformationMessage('vMetrics: No active session');
      }
    })
  );

  // Quick pick menu
  context.subscriptions.push(
    vscode.commands.registerCommand('vmetrics.showQuickPick', async () => {
      const isAuthenticated = authService.isAuthenticated();
      const isTracking = tracker?.isActive() || false;

      const items: vscode.QuickPickItem[] = [];

      if (isAuthenticated) {
        items.push(
          {
            label: `$(dashboard) Open Dashboard`,
            description: 'View detailed analytics in browser',
          },
          {
            label: `$(graph) Show Today's Stats`,
            description: 'Quick view of your progress',
          },
          {
            label: isTracking ? '$(debug-pause) Pause Tracking' : '$(play) Start Tracking',
            description: isTracking ? 'Stop tracking activity' : 'Resume tracking activity',
          },
          {
            label: '$(sign-out) Logout',
            description: 'Sign out of vMetrics',
          }
        );
      } else {
        items.push({
          label: '$(github) Login with GitHub',
          description: 'Connect your GitHub account to start tracking',
        });
      }

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'vMetrics',
      });

      if (!selected) return;

      switch (selected.label) {
        case '$(github) Login with GitHub':
          vscode.commands.executeCommand('vmetrics.login');
          break;
        case '$(dashboard) Open Dashboard':
          vscode.commands.executeCommand('vmetrics.openDashboard');
          break;
        case "$(graph) Show Today's Stats":
          vscode.commands.executeCommand('vmetrics.showStats');
          break;
        case '$(play) Start Tracking':
        case '$(debug-pause) Pause Tracking':
          vscode.commands.executeCommand('vmetrics.toggleTracking');
          break;
        case '$(sign-out) Logout':
          vscode.commands.executeCommand('vmetrics.logout');
          break;
      }
    })
  );
}

function startTracking(config: ReturnType<typeof getConfig>): void {
  if (tracker?.isActive()) return;

  tracker = new ActivityTracker(
    adapter,
    machineId,
    {
      idleTimeoutMinutes: config.idleTimeoutMinutes,
      syncIntervalSeconds: config.syncIntervalSeconds,
      maxBatchSize: config.maxBatchSize,
    },
    {
      onActivity: (event: ActivityEvent) => {
        // Update status bar with current file
        if (event.fileName) {
          adapter.showStatusBarItem(
            `$(graph) ${event.fileName}`,
            `vMetrics: Tracking ${event.project || 'Unknown Project'}`
          );
        }
      },
      onSessionSync: async (session: LocalSession) => {
        const fileInfo = adapter.getActiveFileInfo();
        const result = await syncService.syncSession(
          session,
          fileInfo?.file,
          fileInfo?.project
        );

        // Show achievement notifications
        if (result.newAchievements && result.newAchievements.length > 0 && config.showNotifications) {
          for (const achievement of result.newAchievements) {
            vscode.window.showInformationMessage(
              `🏆 Achievement Unlocked: ${achievement.type}!`
            );
          }
        }
      },
      onIdleStart: () => {
        adapter.showStatusBarItem('$(clock) vMetrics: Idle', 'Tracking paused - waiting for activity');
      },
      onIdleEnd: () => {
        const fileInfo = adapter.getActiveFileInfo();
        if (fileInfo) {
          adapter.showStatusBarItem(
            `$(graph) ${fileInfo.fileName}`,
            `vMetrics: Tracking ${fileInfo.project}`
          );
        }
      },
    }
  );

  tracker.startSession();
  adapter.showStatusBarItem('$(graph) vMetrics: Active', 'Tracking your coding activity');

  if (config.showNotifications) {
    vscode.window.showInformationMessage('vMetrics: Tracking started');
  }
}

function stopTracking(): void {
  if (!tracker?.isActive()) return;

  tracker.endSession();
  adapter.showStatusBarItem('$(circle-slash) vMetrics: Paused', 'Click to resume tracking');

  const config = getConfig();
  if (config.showNotifications) {
    vscode.window.showInformationMessage('vMetrics: Tracking paused');
  }
}

export function deactivate(): void {
  console.log('vMetrics: Deactivating extension...');

  // Stop and sync tracking
  if (tracker) {
    tracker.dispose();
    tracker = null;
  }

  // Cleanup adapter
  adapter?.dispose();

  console.log('vMetrics: Extension deactivated');
}
