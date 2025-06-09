import * as vscode from 'vscode';
import { ActivityEvent } from './types';

export class ActivityTracker {
  private currentFile: string | undefined;
  private currentLanguage: string | undefined;
  private lastActivityTime: number;
  private fileStartTime: number | undefined;
  private isIdle: boolean = false;
  private idleTimeout: NodeJS.Timeout | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private onActivity: (event: ActivityEvent) => void,
    private machineId: string,
    private idleTimeoutMs: number = 5 * 60 * 1000 // 5 minutes
  ) {
    this.lastActivityTime = Date.now();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Track active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.handleActiveEditorChange(editor);
      })
    );

    // Track document changes (editing)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.handleDocumentChange(event);
      })
    );

    // Track document saves
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        this.handleDocumentSave(document);
      })
    );

    // Track window focus changes
    this.disposables.push(
      vscode.window.onDidChangeWindowState((state) => {
        this.handleWindowStateChange(state);
      })
    );

    // Track document opens
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        this.handleDocumentOpen(document);
      })
    );

    // Start tracking the current active editor if any
    if (vscode.window.activeTextEditor) {
      this.handleActiveEditorChange(vscode.window.activeTextEditor);
    }
  }

  private handleActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    const now = Date.now();
    
    // End previous file session if any
    if (this.currentFile && this.fileStartTime) {
      const duration = now - this.fileStartTime;
      this.emitEvent({
        type: 'file_close',
        timestamp: now,
        file: this.currentFile,
        language: this.currentLanguage,
        duration
      });
    }

    if (editor) {
      this.currentFile = this.getRelativeFilePath(editor.document.uri);
      this.currentLanguage = editor.document.languageId;
      this.fileStartTime = now;
      
      this.emitEvent({
        type: 'file_open',
        timestamp: now,
        file: this.currentFile,
        language: this.currentLanguage,
        project: this.getProjectName(editor.document.uri)
      });
    } else {
      this.currentFile = undefined;
      this.currentLanguage = undefined;
      this.fileStartTime = undefined;
    }

    this.updateActivity();
  }

  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    if (event.document === vscode.window.activeTextEditor?.document) {
      this.emitEvent({
        type: 'file_edit',
        timestamp: Date.now(),
        file: this.getRelativeFilePath(event.document.uri),
        language: event.document.languageId,
        project: this.getProjectName(event.document.uri)
      });
      
      this.updateActivity();
    }
  }

  private handleDocumentSave(document: vscode.TextDocument): void {
    this.emitEvent({
      type: 'file_save',
      timestamp: Date.now(),
      file: this.getRelativeFilePath(document.uri),
      language: document.languageId,
      project: this.getProjectName(document.uri)
    });
    
    this.updateActivity();
  }

  private handleWindowStateChange(state: vscode.WindowState): void {
    const now = Date.now();
    
    if (state.focused) {
      this.emitEvent({
        type: 'focus',
        timestamp: now
      });
      
      if (this.isIdle) {
        this.isIdle = false;
        this.emitEvent({
          type: 'idle_end',
          timestamp: now
        });
      }
    } else {
      this.emitEvent({
        type: 'blur',
        timestamp: now
      });
      
      // Immediately go idle when window loses focus
      this.startIdleState();
    }
    
    this.updateActivity();
  }

  private handleDocumentOpen(document: vscode.TextDocument): void {
    // Only track if it's the active document to avoid noise
    if (document === vscode.window.activeTextEditor?.document) {
      this.emitEvent({
        type: 'file_open',
        timestamp: Date.now(),
        file: this.getRelativeFilePath(document.uri),
        language: document.languageId,
        project: this.getProjectName(document.uri)
      });
    }
  }

  private updateActivity(): void {
    this.lastActivityTime = Date.now();
    
    // Reset idle timeout
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    
    // If we were idle, mark as active again
    if (this.isIdle) {
      this.isIdle = false;
      this.emitEvent({
        type: 'idle_end',
        timestamp: this.lastActivityTime
      });
    }
    
    // Set new idle timeout
    this.idleTimeout = setTimeout(() => {
      this.startIdleState();
    }, this.idleTimeoutMs);
  }

  private startIdleState(): void {
    if (!this.isIdle) {
      this.isIdle = true;
      this.emitEvent({
        type: 'idle_start',
        timestamp: Date.now()
      });
    }
  }

  private emitEvent(event: Omit<ActivityEvent, 'machineId'>): void {
    const fullEvent: ActivityEvent = {
      ...event,
      machineId: this.machineId
    };
    
    this.onActivity(fullEvent);
  }

  private getRelativeFilePath(uri: vscode.Uri): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
      return vscode.workspace.asRelativePath(uri, false);
    }
    return uri.fsPath;
  }

  private getProjectName(uri: vscode.Uri): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
      return workspaceFolder.name;
    }
    return 'Unknown';
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
  }
}
