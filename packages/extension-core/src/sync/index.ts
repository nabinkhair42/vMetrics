import type { LocalSession, SerializedSession, TrackerConfig } from '../types/index.js';

export interface SyncResult {
  success: boolean;
  newAchievements?: Array<{ type: string; unlocked_at: string }>;
  error?: string;
}

export interface OfflineStorage {
  save(sessions: SerializedSession[]): Promise<void>;
  load(): Promise<SerializedSession[]>;
  clear(): Promise<void>;
}

export class SyncService {
  private serverUrl: string;
  private token: string | null = null;
  private machineId: string;
  private isOnline: boolean = true;
  private offlineQueue: SerializedSession[] = [];
  private offlineStorage: OfflineStorage | undefined;

  constructor(
    config: Pick<TrackerConfig, 'serverUrl'>,
    machineId: string,
    offlineStorage?: OfflineStorage
  ) {
    this.serverUrl = config.serverUrl;
    this.machineId = machineId;
    this.offlineStorage = offlineStorage;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      this.isOnline = response.ok;
      return this.isOnline;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  serializeSession(session: LocalSession, currentFile?: string, currentProject?: string): SerializedSession {
    return {
      session_id: session.sessionId,
      start_time: new Date(session.startTime).toISOString(),
      end_time: new Date().toISOString(),
      duration_ms: Date.now() - session.startTime,
      summary: {
        total_minutes: session.summary.totalMinutes,
        files_worked: Array.from(session.summary.filesWorked),
        languages: Object.fromEntries(session.summary.languages),
        projects: Object.fromEntries(session.summary.projects),
        save_count: session.summary.saveCount,
        edit_count: session.summary.editCount,
        lines_changed: session.summary.linesChanged,
        characters_typed: session.summary.charactersTyped,
      },
      is_active: true,
      current_file: currentFile || null,
      current_project: currentProject || null,
      machine_id: this.machineId,
    };
  }

  async syncSession(session: LocalSession, currentFile?: string, currentProject?: string): Promise<SyncResult> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    const serialized = this.serializeSession(session, currentFile, currentProject);

    // Check connection
    const isHealthy = await this.checkHealth();

    if (!isHealthy) {
      // Queue for offline sync
      await this.queueOffline(serialized);
      return { success: true, error: 'Queued for offline sync' };
    }

    // Try to sync queued sessions first
    await this.flushOfflineQueue();

    // Sync current session
    return this.sendSession(serialized);
  }

  private async sendSession(session: SerializedSession): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.serverUrl}/api/activity/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(session),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Server returned ${response.status}: ${error}`);
      }

      const result = await response.json() as { new_achievements?: Array<{ type: string; unlocked_at: string }> };

      return {
        success: true,
        newAchievements: result.new_achievements,
      };
    } catch (error) {
      // Queue for retry
      await this.queueOffline(session);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendStatusUpdate(sessionId: string, currentFile?: string, currentProject?: string): Promise<void> {
    if (!this.token || !this.isOnline) return;

    try {
      await fetch(`${this.serverUrl}/api/activity/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          current_file: currentFile || null,
          current_project: currentProject || null,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Ignore status update failures
    }
  }

  async endSession(sessionId: string): Promise<void> {
    if (!this.token) return;

    try {
      await fetch(`${this.serverUrl}/api/activity/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Log but don't throw
      console.error('Failed to end session on server');
    }
  }

  // ============================================================================
  // Offline Queue Management
  // ============================================================================

  private async queueOffline(session: SerializedSession): Promise<void> {
    this.offlineQueue.push(session);

    if (this.offlineStorage) {
      await this.offlineStorage.save(this.offlineQueue);
    }
  }

  async loadOfflineQueue(): Promise<void> {
    if (this.offlineStorage) {
      this.offlineQueue = await this.offlineStorage.load();
    }
  }

  async flushOfflineQueue(): Promise<number> {
    if (this.offlineQueue.length === 0) return 0;

    let synced = 0;
    const remaining: SerializedSession[] = [];

    for (const session of this.offlineQueue) {
      const result = await this.sendSession(session);

      if (result.success) {
        synced++;
      } else {
        remaining.push(session);
      }
    }

    this.offlineQueue = remaining;

    if (this.offlineStorage) {
      if (remaining.length === 0) {
        await this.offlineStorage.clear();
      } else {
        await this.offlineStorage.save(remaining);
      }
    }

    return synced;
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  isConnected(): boolean {
    return this.isOnline;
  }
}

export * from '../types/index.js';
