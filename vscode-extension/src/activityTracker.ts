import * as vscode from 'vscode';
import { ActivityEvent } from './types';
import * as path from 'path';

export class ActivityTracker {
  private currentFile: string | undefined;
  private currentLanguage: string | undefined;
  private currentProject: string | undefined;
  private sessionId: string;
  private lastActivityTime: number;
  private fileStartTime: number | undefined;
  private isIdle: boolean = false;
  private idleTimeout: NodeJS.Timeout | undefined;
  private typingTimeout: NodeJS.Timeout | undefined;
  private readonly disposables: vscode.Disposable[] = [];
  
  // Enhanced tracking
  private textChangeCount: number = 0;
  private linesChangedCount: number = 0;
  private charactersTypedCount: number = 0;

  constructor(
    private onActivity: (event: ActivityEvent) => void,
    private machineId: string,
    private userId: string,
    private idleTimeoutMs: number = 5 * 60 * 1000 // 5 minutes
  ) {
    this.lastActivityTime = Date.now();
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
    this.emitSessionStart();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Track active editor changes (file open/switch)
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.handleActiveEditorChange(editor);
      })
    );

    // Track document changes (typing/editing)
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

    // Track document opens
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        this.handleDocumentOpen(document);
      })
    );

    // Track document closes
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.handleDocumentClose(document);
      })
    );

    // Track window focus changes
    this.disposables.push(
      vscode.window.onDidChangeWindowState((state) => {
        this.handleWindowStateChange(state);
      })
    );

    // Track workspace changes
    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        this.handleWorkspaceChange(event);
      })
    );

    // Initialize with current editor if any
    if (vscode.window.activeTextEditor) {
      this.handleActiveEditorChange(vscode.window.activeTextEditor);
    }
  }

  private extractFileInfo(document: vscode.TextDocument) {
    try {
      const filePath = document.uri.fsPath;
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(fileName).slice(1);
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      const workspaceName = workspaceFolder?.name;
      const workspacePath = workspaceFolder?.uri.fsPath;
      const relativePath = workspaceFolder ? 
        path.relative(workspaceFolder.uri.fsPath, filePath) : filePath;
      const rootFolder = workspaceName;

      return {
        file: filePath,
        fileName,
        fileExtension,
        language: document.languageId,
        relativePath,
        project: this.currentProject || workspaceName,
        workspaceName,
        workspacePath,
        rootFolder
      };
    } catch (error) {
      console.error('Error extracting file info:', error);
      // Return minimal info to prevent crashes
      return {
        file: document.uri.fsPath,
        fileName: path.basename(document.uri.fsPath),
        language: document.languageId
      };
    }
  }

  private createBaseEvent(type: ActivityEvent['type'], additionalData: Partial<ActivityEvent> = {}): ActivityEvent {
    return {
      type,
      timestamp: Date.now(),
      machineId: this.machineId,
      userId: this.userId,
      sessionId: this.sessionId,
      isActive: !this.isIdle,
      ...additionalData
    };
  }

  private handleActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    this.updateActivity();

    if (editor) {
      const fileInfo = this.extractFileInfo(editor.document);
      
      // Check if this is a different file
      if (this.currentFile !== fileInfo.file) {
        // Close previous file if any
        if (this.currentFile) {
          this.emitFileClose();
        }

        // Open new file
        this.currentFile = fileInfo.file;
        this.currentLanguage = fileInfo.language;
        this.currentProject = fileInfo.project;
        this.fileStartTime = Date.now();
        
        this.emitFileOpen(fileInfo);
      }
    } else {
      // No active editor
      if (this.currentFile) {
        this.emitFileClose();
        this.currentFile = undefined;
        this.currentLanguage = undefined;
        this.fileStartTime = undefined;
      }
    }
  }

  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    try {
      if (event.document.uri.scheme !== 'file') {
        return; // Skip non-file documents
      }

      this.updateActivity();
      
      const fileInfo = this.extractFileInfo(event.document);
      
      // Count changes
      let totalChanges = 0;
      let linesChanged = new Set<number>();
      let charactersTyped = 0;

      event.contentChanges.forEach(change => {
        totalChanges++;
        
        // Count lines affected
        const startLine = change.range.start.line;
        const endLine = change.range.end.line;
        for (let i = startLine; i <= endLine; i++) {
          linesChanged.add(i);
        }
        
        // Count characters typed (approximate)
        charactersTyped += change.text.length;
      });

      this.textChangeCount += totalChanges;
      this.linesChangedCount = Math.max(this.linesChangedCount, linesChanged.size);
      this.charactersTypedCount += charactersTyped;

      // Emit text change event (debounced)
      this.debouncedTextChangeEvent(fileInfo, {
        linesChanged: linesChanged.size,
        charactersTyped
      });
    } catch (error) {
      console.error('Error handling document change:', error);
      // Continue tracking but log the error
    }
  }

  private debouncedTextChangeEvent(fileInfo: any, changeData: any): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.emitTextChange(fileInfo, changeData);
    }, 1000); // Debounce for 1 second
  }

  private handleDocumentSave(document: vscode.TextDocument): void {
    try {
      if (document.uri.scheme !== 'file') {
        return;
      }

      this.updateActivity();
      const fileInfo = this.extractFileInfo(document);
      this.emitFileSave(fileInfo);
    } catch (error) {
      console.error('Error handling document save:', error);
      // Continue tracking but log the error
    }
  }

  private handleDocumentOpen(document: vscode.TextDocument): void {
    try {
      if (document.uri.scheme !== 'file') {
        return;
      }

      this.updateActivity();
      // File open is handled by handleActiveEditorChange
    } catch (error) {
      console.error('Error handling document open:', error);
    }
  }

  private handleDocumentClose(document: vscode.TextDocument): void {
    try {
      if (document.uri.scheme !== 'file') {
        return;
      }

      if (this.currentFile === document.uri.fsPath) {
        this.emitFileClose();
        this.currentFile = undefined;
        this.currentLanguage = undefined;
        this.fileStartTime = undefined;
      }
    } catch (error) {
      console.error('Error handling document close:', error);
      // Reset state even if error occurs
      this.currentFile = undefined;
      this.currentLanguage = undefined;
      this.fileStartTime = undefined;
    }
  }

  private handleWindowStateChange(state: vscode.WindowState): void {
    if (state.focused) {
      this.emitFocus();
      if (this.isIdle) {
        this.endIdleState();
      }
    } else {
      this.emitBlur();
    }
    this.updateActivity();
  }

  private handleWorkspaceChange(event: vscode.WorkspaceFoldersChangeEvent): void {
    this.updateActivity();
    
    const workspaces = vscode.workspace.workspaceFolders?.map(folder => ({
      name: folder.name,
      path: folder.uri.fsPath
    })) || [];

    this.onActivity(this.createBaseEvent('workspace_change', {
      metadata: {
        workspaces,
        added: event.added.map(f => ({ name: f.name, path: f.uri.fsPath })),
        removed: event.removed.map(f => ({ name: f.name, path: f.uri.fsPath }))
      }
    }));
  }

  // Event emission methods
  private emitSessionStart(): void {
    this.onActivity(this.createBaseEvent('session_start', {
      metadata: {
        vscodeVersion: vscode.version,
        workspaces: vscode.workspace.workspaceFolders?.map(f => ({
          name: f.name,
          path: f.uri.fsPath
        })) || []
      }
    }));
  }

  private emitFileOpen(fileInfo: any): void {
    this.onActivity(this.createBaseEvent('file_open', fileInfo));
  }

  private emitFileClose(): void {
    const duration = this.fileStartTime ? Date.now() - this.fileStartTime : undefined;
    
    this.onActivity(this.createBaseEvent('file_close', {
      file: this.currentFile,
      language: this.currentLanguage,
      project: this.currentProject,
      duration,
      linesChanged: this.linesChangedCount,
      charactersTyped: this.charactersTypedCount
    }));

    // Reset counters
    this.textChangeCount = 0;
    this.linesChangedCount = 0;
    this.charactersTypedCount = 0;
  }

  private emitFileSave(fileInfo: any): void {
    this.onActivity(this.createBaseEvent('file_save', fileInfo));
  }

  private emitTextChange(fileInfo: any, changeData: any): void {
    this.onActivity(this.createBaseEvent('text_change', {
      ...fileInfo,
      ...changeData
    }));
  }

  private emitFileEdit(fileInfo: any): void {
    this.onActivity(this.createBaseEvent('file_edit', fileInfo));
  }

  private emitFocus(): void {
    this.onActivity(this.createBaseEvent('focus', {
      file: this.currentFile,
      language: this.currentLanguage,
      project: this.currentProject
    }));
  }

  private emitBlur(): void {
    this.onActivity(this.createBaseEvent('blur', {
      file: this.currentFile,
      language: this.currentLanguage,
      project: this.currentProject
    }));
  }

  private updateActivity(): void {
    const now = Date.now();
    this.lastActivityTime = now;

    if (this.isIdle) {
      this.endIdleState();
    }

    this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      this.startIdleState();
    }, this.idleTimeoutMs);
  }

  private startIdleState(): void {
    if (!this.isIdle) {
      this.isIdle = true;
      this.onActivity(this.createBaseEvent('idle_start', {
        file: this.currentFile,
        language: this.currentLanguage,
        project: this.currentProject
      }));
    }
  }

  private endIdleState(): void {
    if (this.isIdle) {
      const idleDuration = Date.now() - this.lastActivityTime;
      this.isIdle = false;
      
      this.onActivity(this.createBaseEvent('idle_end', {
        file: this.currentFile,
        language: this.currentLanguage,
        project: this.currentProject,
        duration: idleDuration
      }));
    }
  }

  public dispose(): void {
    // Emit session end
    this.onActivity(this.createBaseEvent('session_end', {
      metadata: {
        sessionDuration: Date.now() - (this.lastActivityTime - this.idleTimeoutMs)
      }
    }));

    // Clean up timers
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Dispose all event listeners
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables.length = 0;
  }

  public getCurrentActivity() {
    return {
      file: this.currentFile,
      language: this.currentLanguage,
      project: this.currentProject,
      isIdle: this.isIdle,
      sessionId: this.sessionId,
      lastActivity: this.lastActivityTime
    };
  }
}
