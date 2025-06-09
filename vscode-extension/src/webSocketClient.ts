import * as vscode from 'vscode';
import { ActivityEvent, UserSession, Config } from './types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | undefined;
  private readonly eventQueue: ActivityEvent[] = [];
  private isConnected = false;
  private readonly maxRetries = 5;
  private retryCount = 0;

  constructor(
    private config: Config,
    private session: UserSession
  ) {}

  async connect(): Promise<boolean> {
    try {
      const wsUrl = this.config.serverUrl.replace('http', 'ws') + '/ws/activity';
      this.ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(this.session.token)}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected to server');
        this.isConnected = true;
        this.retryCount = 0;
        
        // Send any queued events
        this.flushEventQueue();
        
        vscode.window.showInformationMessage('Connected to Productivity Tracker server');
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('Failed to parse server message:', error);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
      return false;
    }
  }

  sendEvent(event: ActivityEvent): void {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch (error) {
        console.error('Failed to send event:', error);
        // Queue the event for retry
        this.eventQueue.push(event);
      }
    } else {
      // Queue the event if not connected
      this.eventQueue.push(event);
      
      // Limit queue size to prevent memory issues
      if (this.eventQueue.length > 1000) {
        this.eventQueue.shift(); // Remove oldest event
      }
    }
  }

  private flushEventQueue(): void {
    if (this.eventQueue.length > 0) {
      console.log(`Sending ${this.eventQueue.length} queued events`);
      
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          this.sendEvent(event);
        }
      }
    }
  }

  private handleServerMessage(message: any): void {
    switch (message.type) {
      case 'ack':
        // Server acknowledged an event
        break;
      case 'stats':
        // Server sent current stats
        this.showStats(message.data);
        break;
      default:
        console.log('Unknown message from server:', message);
    }
  }

  private showStats(stats: any): void {
    const { todayMinutes, currentFile, activeProjects } = stats;
    const hours = Math.floor(todayMinutes / 60);
    const minutes = todayMinutes % 60;
    
    const message = `Today: ${hours}h ${minutes}m coding time. Current file: ${currentFile || 'None'}`;
    vscode.window.showInformationMessage(message);
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

  requestStats(): void {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'request_stats' }));
    } else {
      vscode.window.showWarningMessage('Not connected to server');
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }
}
