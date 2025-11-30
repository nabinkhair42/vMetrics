import type {
  ActivityEvent,
  ActivityType,
  FileInfo,
  LocalSession,
  SessionSummary,
  IDEAdapter,
} from '../types/index.js';
import { generateId } from '../utils.js';

export interface TrackerEvents {
  onActivity: (event: ActivityEvent) => void;
  onSessionSync: (session: LocalSession) => void;
  onIdleStart: () => void;
  onIdleEnd: () => void;
}

export class ActivityTracker {
  private adapter: IDEAdapter;
  private session: LocalSession | null = null;
  private _machineId: string;

  // Tracking state
  private currentFile: FileInfo | null = null;
  private fileStartTime: number = 0;
  private _lastActivityTime: number = Date.now();
  private isIdle: boolean = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  // Metrics
  private textChangeCount: number = 0;
  private linesChangedCount: number = 0;
  private charactersTypedCount: number = 0;

  // Config
  private idleTimeoutMs: number;
  private syncIntervalMs: number;
  private maxBatchSize: number;

  // Event handlers
  private events: TrackerEvents;

  constructor(
    adapter: IDEAdapter,
    machineId: string,
    config: {
      idleTimeoutMinutes?: number;
      syncIntervalSeconds?: number;
      maxBatchSize?: number;
    } = {},
    events: TrackerEvents
  ) {
    this.adapter = adapter;
    this._machineId = machineId;
    this.events = events;

    this.idleTimeoutMs = (config.idleTimeoutMinutes || 5) * 60 * 1000;
    this.syncIntervalMs = (config.syncIntervalSeconds || 90) * 1000;
    this.maxBatchSize = config.maxBatchSize || 30;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // File events
    this.adapter.onFileOpen((file) => this.handleFileOpen(file));
    this.adapter.onFileClose((file) => this.handleFileClose(file));
    this.adapter.onFileSave((file) => this.handleFileSave(file));
    this.adapter.onFileEdit((file, lines, chars) => this.handleFileEdit(file, lines, chars));

    // Window events
    this.adapter.onWindowFocus(() => this.handleWindowFocus());
    this.adapter.onWindowBlur(() => this.handleWindowBlur());
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  startSession(): void {
    if (this.session) return;

    this.session = {
      sessionId: generateId(),
      startTime: Date.now(),
      activities: [],
      summary: this.createEmptySummary(),
    };

    this.recordActivity({ type: 'session_start', timestamp: Date.now() });
    this.adapter.showStatusBarItem('$(graph) vMetrics: Tracking', 'Click to view dashboard');

    // Start periodic sync
    this.startSyncTimer();
  }

  endSession(): void {
    if (!this.session) return;

    // Close current file if open
    if (this.currentFile) {
      this.handleFileClose(this.currentFile);
    }

    this.recordActivity({ type: 'session_end', timestamp: Date.now() });

    // Final sync
    this.syncSession();

    this.session = null;
    this.stopSyncTimer();
    this.adapter.showStatusBarItem('$(circle-slash) vMetrics: Paused', 'Click to start tracking');
  }

  isActive(): boolean {
    return this.session !== null;
  }

  getSession(): LocalSession | null {
    return this.session;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  private handleFileOpen(file: FileInfo): void {
    if (!this.session) return;

    this.resetIdleTimer();
    this.recordActivity({
      type: 'file_open',
      timestamp: Date.now(),
      ...this.extractFileInfo(file),
    });

    this.currentFile = file;
    this.fileStartTime = Date.now();
    this.textChangeCount = 0;
    this.linesChangedCount = 0;
    this.charactersTypedCount = 0;

    this.adapter.showStatusBarItem(
      `$(graph) ${file.fileName}`,
      `vMetrics: Tracking ${file.project}`
    );
  }

  private handleFileClose(file: FileInfo): void {
    if (!this.session) return;

    const durationMs = Date.now() - this.fileStartTime;
    const durationMinutes = durationMs / 60000;

    this.recordActivity({
      type: 'file_close',
      timestamp: Date.now(),
      ...this.extractFileInfo(file),
      durationMs,
      linesChanged: this.linesChangedCount,
      charactersTyped: this.charactersTypedCount,
    });

    // Update summary
    this.updateSummaryFromFile(file, durationMinutes);

    this.currentFile = null;
    this.fileStartTime = 0;
  }

  private handleFileSave(file: FileInfo): void {
    if (!this.session) return;

    this.resetIdleTimer();
    this.recordActivity({
      type: 'file_save',
      timestamp: Date.now(),
      ...this.extractFileInfo(file),
    });

    this.session.summary.saveCount++;

    // Trigger sync on save if we have enough activities
    if (this.session.activities.length >= this.maxBatchSize) {
      this.syncSession();
    }
  }

  private handleFileEdit(file: FileInfo, linesChanged: number, charsTyped: number): void {
    if (!this.session) return;

    this.resetIdleTimer();
    this.textChangeCount++;
    this.linesChangedCount += linesChanged;
    this.charactersTypedCount += charsTyped;

    // Only record edit events periodically to reduce noise
    if (this.textChangeCount % 10 === 0) {
      this.recordActivity({
        type: 'file_edit',
        timestamp: Date.now(),
        ...this.extractFileInfo(file),
        linesChanged: this.linesChangedCount,
        charactersTyped: this.charactersTypedCount,
      });
    }

    this.session.summary.editCount++;
    this.session.summary.linesChanged += linesChanged;
    this.session.summary.charactersTyped += charsTyped;
  }

  private handleWindowFocus(): void {
    if (!this.session) return;

    this.recordActivity({ type: 'focus', timestamp: Date.now() });

    if (this.isIdle) {
      this.isIdle = false;
      this.recordActivity({ type: 'idle_end', timestamp: Date.now() });
      this.events.onIdleEnd();
    }

    this.resetIdleTimer();
  }

  private handleWindowBlur(): void {
    if (!this.session) return;

    this.recordActivity({ type: 'blur', timestamp: Date.now() });
    this.startIdleTimer();
  }

  // ============================================================================
  // Idle Detection
  // ============================================================================

  private startIdleTimer(): void {
    this.stopIdleTimer();

    this.idleTimer = setTimeout(() => {
      if (!this.isIdle && this.session) {
        this.isIdle = true;
        this.recordActivity({ type: 'idle_start', timestamp: Date.now() });
        this.events.onIdleStart();
        this.syncSession(); // Sync when going idle
      }
    }, this.idleTimeoutMs);
  }

  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private resetIdleTimer(): void {
    this._lastActivityTime = Date.now();

    if (this.isIdle) {
      this.isIdle = false;
      this.recordActivity({ type: 'idle_end', timestamp: Date.now() });
      this.events.onIdleEnd();
    }

    this.startIdleTimer();
  }

  // ============================================================================
  // Sync
  // ============================================================================

  private syncTimer: ReturnType<typeof setInterval> | null = null;

  private startSyncTimer(): void {
    this.stopSyncTimer();

    this.syncTimer = setInterval(() => {
      this.syncSession();
    }, this.syncIntervalMs);
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  syncSession(): void {
    if (!this.session) return;

    // Update total minutes
    const sessionDurationMs = Date.now() - this.session.startTime;
    this.session.summary.totalMinutes = sessionDurationMs / 60000;

    this.events.onSessionSync(this.session);

    // Clear activities after sync
    this.session.activities = [];
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private recordActivity(event: Partial<ActivityEvent> & { type: ActivityType; timestamp: number }): void {
    if (!this.session) return;

    const activity: ActivityEvent = {
      ...event,
    };

    this.session.activities.push(activity);
    this.events.onActivity(activity);
  }

  private extractFileInfo(file: FileInfo): Partial<ActivityEvent> {
    return {
      file: file.file,
      fileName: file.fileName,
      fileExtension: file.fileExtension,
      language: file.language,
      project: file.project,
    };
  }

  private createEmptySummary(): SessionSummary {
    return {
      totalMinutes: 0,
      filesWorked: new Set(),
      languages: new Map(),
      projects: new Map(),
      saveCount: 0,
      editCount: 0,
      linesChanged: 0,
      charactersTyped: 0,
    };
  }

  private updateSummaryFromFile(file: FileInfo, durationMinutes: number): void {
    if (!this.session) return;

    const { summary } = this.session;

    // Add to files worked
    summary.filesWorked.add(file.file);

    // Update language time
    if (file.language) {
      const current = summary.languages.get(file.language) || 0;
      summary.languages.set(file.language, current + durationMinutes);
    }

    // Update project time
    if (file.project) {
      const current = summary.projects.get(file.project) || 0;
      summary.projects.set(file.project, current + durationMinutes);
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    this.endSession();
    this.stopIdleTimer();
    this.stopSyncTimer();
  }
}

export * from '../types/index.js';
