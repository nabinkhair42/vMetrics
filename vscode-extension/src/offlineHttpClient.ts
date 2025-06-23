import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { ActivityEvent, UserSession, Config } from './types';

export class OfflineHttpClient {
  private reconnectTimeout: NodeJS.Timeout | undefined;
  private readonly eventQueue: ActivityEvent[] = [];
  private isConnected = false;
  private readonly maxRetries = 5;
  private retryCount = 0;
  private pollInterval: NodeJS.Timeout | undefined;
  private offlineStoragePath: string;
  private statusBarItem: vscode.StatusBarItem;
  private syncInProgress = false;

  constructor(
    private config: Config,
    private session: UserSession,
    private context: vscode.ExtensionContext
  ) {
    // Initialize offline storage
    this.offlineStoragePath = path.join(context.globalStoragePath, 'offline_events.json');
    
    // Create status bar item for sync status
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    this.loadOfflineEvents();
  }

  private async loadOfflineEvents(): Promise<void> {
    try {
      if (fs.existsSync(this.offlineStoragePath)) {
        const data = await fs.promises.readFile(this.offlineStoragePath, 'utf8');
        const events = JSON.parse(data);
        this.eventQueue.push(...events);
        if (this.eventQueue.length > 0) {
          this.updateStatusBar(`${this.eventQueue.length} events pending sync`);
        }
      }
    } catch (error) {
      console.error('Failed to load offline events:', error);
    }
  }

  private async saveOfflineEvents(): Promise<void> {
    try {
      await fs.promises.mkdir(path.dirname(this.offlineStoragePath), { recursive: true });
      await fs.promises.writeFile(
        this.offlineStoragePath,
        JSON.stringify(this.eventQueue),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save offline events:', error);
    }
  }

  private updateStatusBar(message: string): void {
    this.statusBarItem.text = `$(sync) ${message}`;
    this.statusBarItem.show();
  }

  async connect(): Promise<boolean> {
    try {
      const isServerReachable = await this.testServerConnection();
      if (isServerReachable) {
        this.isConnected = true;
        this.retryCount = 0;
        this.startPolling();
        
        // Show connecting status while syncing
        if (this.eventQueue.length > 0) {
          this.updateStatusBar(`Syncing ${this.eventQueue.length} events...`);
        }
        
        // Sync offline data
        await this.flushEventQueue();
        
        this.statusBarItem.hide();
        return true;
      } else {
        throw new Error('Server not reachable');
      }
    } catch (error) {
      console.error('Failed to connect to server:', error);
      this.updateStatusBar('Working offline');
      this.scheduleReconnect();
      return false;
    }
  }

  private async testServerConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const url = new URL(this.config.serverUrl + '/health');
      const requestModule = url.protocol === 'https:' ? https : http;
      
      const req = requestModule.get(url, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  private startPolling(): void {
    // Poll server every 30 seconds to maintain connection
    this.pollInterval = setInterval(async () => {
      const isReachable = await this.testServerConnection();
      if (!isReachable && this.isConnected) {
        this.isConnected = false;
        this.updateStatusBar('Working offline');
        this.scheduleReconnect();
      } else if (isReachable && !this.isConnected) {
        await this.connect(); // Attempt to reconnect and sync
      }
    }, 30000);
  }

  sendEvent(event: ActivityEvent): void {
    if (this.isConnected && !this.syncInProgress) {
      this.sendEventToServer(event).catch(error => {
        console.error('Failed to send event:', error);
        this.eventQueue.push(event);
        this.saveOfflineEvents();
        this.updateStatusBar(`${this.eventQueue.length} events pending sync`);
      });
    } else {
      // Queue the event if not connected or sync in progress
      this.eventQueue.push(event);
      this.saveOfflineEvents();
      
      if (!this.isConnected) {
        this.updateStatusBar(`${this.eventQueue.length} events pending sync (offline)`);
      }
      
      // Limit queue size to prevent memory issues
      if (this.eventQueue.length > 1000) {
        this.eventQueue.shift(); // Remove oldest event
        this.saveOfflineEvents();
      }
    }
  }

  private async sendEventToServer(event: ActivityEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.serverUrl + '/api/activity');
      const requestModule = url.protocol === 'https:' ? https : http;
      
      const postData = JSON.stringify(event);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${this.session.token}`
        }
      };

      const req = requestModule.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0 || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    const total = this.eventQueue.length;
    let processed = 0;

    try {
      while (this.eventQueue.length > 0 && this.isConnected) {
        const batch = this.eventQueue.slice(0, 10); // Process in batches of 10
        
        await Promise.all(
          batch.map(event => this.sendEventToServer(event))
        );
        
        this.eventQueue.splice(0, batch.length);
        await this.saveOfflineEvents();
        
        processed += batch.length;
        this.updateStatusBar(`Syncing events: ${processed}/${total}`);
      }
      
      if (this.eventQueue.length === 0) {
        this.statusBarItem.hide();
      } else {
        this.updateStatusBar(`${this.eventQueue.length} events pending sync`);
      }
    } catch (error) {
      console.error('Error during sync:', error);
      this.updateStatusBar(`Sync failed - ${this.eventQueue.length} events pending`);
    } finally {
      this.syncInProgress = false;
    }
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      this.updateStatusBar('Working offline - sync paused');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000); // Exponential backoff, max 30s
    this.retryCount++;

    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.retryCount})`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, delay);
  }

  async requestStats(): Promise<void> {
    if (this.isConnected) {
      try {
        const stats = await this.getStatsFromServer();
        this.showStats(stats);
      } catch (error) {
        vscode.window.showWarningMessage('Failed to get stats from server - working offline');
      }
    } else {
      vscode.window.showWarningMessage('Currently working offline - stats not available');
    }
  }

  private async getStatsFromServer(): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.serverUrl + '/api/activity/dashboard/today');
      const requestModule = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.session.token}`
        }
      };

      const req = requestModule.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  private showStats(stats: any): void {
    // Implementation depends on your stats display logic
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    
    this.isConnected = false;
    this.statusBarItem.hide();
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  async sendSessionData(sessionData: any): Promise<void> {
    if (this.isConnected) {
      return new Promise((resolve, reject) => {
        const url = new URL(this.config.serverUrl + '/api/activity/session');
        const requestModule = url.protocol === 'https:' ? https : http;
        
        const postData = JSON.stringify(sessionData);
        
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${this.session.token}`
          }
        };

        const req = requestModule.request(options, (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });

        req.on('error', reject);
        req.setTimeout(30000, () => { // Longer timeout for session data
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
      });
    } else {
      // Queue session data for later sync
      this.eventQueue.push({
        type: 'session_data',
        data: sessionData,
        timestamp: Date.now()
      } as any);
      await this.saveOfflineEvents();
      this.updateStatusBar(`${this.eventQueue.length} events pending sync (offline)`);
    }
  }

  async sendStatusUpdate(statusData: any): Promise<void> {
    if (this.isConnected) {
      return new Promise((resolve, reject) => {
        const url = new URL(this.config.serverUrl + '/api/activity/status');
        const requestModule = url.protocol === 'https:' ? https : http;
        
        const postData = JSON.stringify(statusData);
        
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${this.session.token}`
          }
        };

        const req = requestModule.request(options, (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
      });
    } else {
      // Queue status update for later sync
      this.eventQueue.push({
        type: 'status_update',
        data: statusData,
        timestamp: Date.now()
      } as any);
      await this.saveOfflineEvents();
      this.updateStatusBar(`${this.eventQueue.length} events pending sync (offline)`);
    }
  }
} 