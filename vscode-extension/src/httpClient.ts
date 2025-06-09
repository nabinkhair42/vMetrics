import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { ActivityEvent, UserSession, Config } from './types';

export class HttpClient {
  private reconnectTimeout: NodeJS.Timeout | undefined;
  private readonly eventQueue: ActivityEvent[] = [];
  private isConnected = false;
  private readonly maxRetries = 5;
  private retryCount = 0;
  private pollInterval: NodeJS.Timeout | undefined;

  constructor(
    private config: Config,
    private session: UserSession
  ) {}

  async connect(): Promise<boolean> {
    try {
      // Test connection to server
      const isServerReachable = await this.testServerConnection();
      if (isServerReachable) {
        this.isConnected = true;
        this.retryCount = 0;
        this.startPolling();
        
        // Send any queued events
        this.flushEventQueue();
        
        vscode.window.showInformationMessage('Connected to Productivity Tracker server');
        return true;
      } else {
        throw new Error('Server not reachable');
      }
    } catch (error) {
      console.error('Failed to connect to server:', error);
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
      if (!isReachable) {
        this.isConnected = false;
        this.scheduleReconnect();
      }
    }, 30000);
  }

  sendEvent(event: ActivityEvent): void {
    if (this.isConnected) {
      this.sendEventToServer(event).catch(error => {
        console.error('Failed to send event:', error);
        // Queue the event for retry
        this.eventQueue.push(event);
      });
    } else {
      // Queue the event if not connected
      this.eventQueue.push(event);
      
      // Limit queue size to prevent memory issues
      if (this.eventQueue.length > 1000) {
        this.eventQueue.shift(); // Remove oldest event
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

  private flushEventQueue(): void {
    if (this.eventQueue.length > 0) {
      console.log(`Sending ${this.eventQueue.length} queued events`);
      
      const eventsToSend = [...this.eventQueue];
      this.eventQueue.length = 0; // Clear the queue
      
      eventsToSend.forEach(event => {
        this.sendEvent(event);
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      vscode.window.showErrorMessage('Failed to connect to Productivity Tracker server after multiple attempts');
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
        vscode.window.showWarningMessage('Failed to get stats from server');
      }
    } else {
      vscode.window.showWarningMessage('Not connected to server');
    }
  }

  private async getStatsFromServer(): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.serverUrl + '/api/activity/stats');
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
    const { todayMinutes, currentFile, activeProjects } = stats;
    const hours = Math.floor(todayMinutes / 60);
    const minutes = todayMinutes % 60;
    
    const message = `Today: ${hours}h ${minutes}m coding time. Current file: ${currentFile || 'None'}`;
    vscode.window.showInformationMessage(message);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    
    this.isConnected = false;
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }
}
