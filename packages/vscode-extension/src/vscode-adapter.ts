import * as vscode from 'vscode';
import type { IDEAdapter, FileInfo } from '@vmetrics/extension-core';

export class VSCodeAdapter implements IDEAdapter {
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  // Event callbacks
  private onFileOpenCallback?: (file: FileInfo) => void;
  private onFileCloseCallback?: (file: FileInfo) => void;
  private onFileSaveCallback?: (file: FileInfo) => void;
  private onFileEditCallback?: (file: FileInfo, lines: number, chars: number) => void;
  private onWindowFocusCallback?: () => void;
  private onWindowBlurCallback?: () => void;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'vmetrics.showQuickPick';
    context.subscriptions.push(this.statusBarItem);

    this.setupEventListeners();
  }

  getName(): string {
    return 'vscode';
  }

  private setupEventListeners(): void {
    // Active editor change
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.onFileOpenCallback) {
          const fileInfo = this.getFileInfoFromDocument(editor.document);
          if (fileInfo) {
            this.onFileOpenCallback(fileInfo);
          }
        }
      })
    );

    // Document save
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (this.onFileSaveCallback) {
          const fileInfo = this.getFileInfoFromDocument(document);
          if (fileInfo) {
            this.onFileSaveCallback(fileInfo);
          }
        }
      })
    );

    // Document close
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        if (this.onFileCloseCallback) {
          const fileInfo = this.getFileInfoFromDocument(document);
          if (fileInfo) {
            this.onFileCloseCallback(fileInfo);
          }
        }
      })
    );

    // Text changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (this.onFileEditCallback && event.contentChanges.length > 0) {
          const fileInfo = this.getFileInfoFromDocument(event.document);
          if (fileInfo) {
            let linesChanged = 0;
            let charsTyped = 0;

            for (const change of event.contentChanges) {
              linesChanged += Math.abs(
                change.range.end.line - change.range.start.line
              ) + (change.text.split('\n').length - 1);
              charsTyped += change.text.length;
            }

            this.onFileEditCallback(fileInfo, linesChanged, charsTyped);
          }
        }
      })
    );

    // Window focus
    this.disposables.push(
      vscode.window.onDidChangeWindowState((state) => {
        if (state.focused && this.onWindowFocusCallback) {
          this.onWindowFocusCallback();
        } else if (!state.focused && this.onWindowBlurCallback) {
          this.onWindowBlurCallback();
        }
      })
    );
  }

  private getFileInfoFromDocument(document: vscode.TextDocument): FileInfo | null {
    // Skip non-file schemes (output, debug, etc.)
    if (document.uri.scheme !== 'file') {
      return null;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const relativePath = workspaceFolder
      ? vscode.workspace.asRelativePath(document.uri, false)
      : undefined;

    return {
      file: document.uri.fsPath,
      fileName: document.fileName.split(/[/\\]/).pop() || document.fileName,
      fileExtension: document.fileName.split('.').pop() || '',
      language: document.languageId,
      relativePath,
      project: workspaceFolder?.name || 'Unknown',
      workspaceName: workspaceFolder?.name,
      workspacePath: workspaceFolder?.uri.fsPath,
    };
  }

  // ============================================================================
  // Event Registration
  // ============================================================================

  onFileOpen(callback: (file: FileInfo) => void): void {
    this.onFileOpenCallback = callback;
  }

  onFileClose(callback: (file: FileInfo) => void): void {
    this.onFileCloseCallback = callback;
  }

  onFileSave(callback: (file: FileInfo) => void): void {
    this.onFileSaveCallback = callback;
  }

  onFileEdit(callback: (file: FileInfo, lines: number, chars: number) => void): void {
    this.onFileEditCallback = callback;
  }

  onWindowFocus(callback: () => void): void {
    this.onWindowFocusCallback = callback;
  }

  onWindowBlur(callback: () => void): void {
    this.onWindowBlurCallback = callback;
  }

  // ============================================================================
  // File Helpers
  // ============================================================================

  getActiveFileInfo(): FileInfo | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;
    return this.getFileInfoFromDocument(editor.document);
  }

  getWorkspaceInfo(): { name: string; path: string } | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return null;

    return {
      name: folders[0].name,
      path: folders[0].uri.fsPath,
    };
  }

  // ============================================================================
  // Storage
  // ============================================================================

  async getSecret(key: string): Promise<string | undefined> {
    return this.context.secrets.get(key);
  }

  async setSecret(key: string, value: string): Promise<void> {
    await this.context.secrets.store(key, value);
  }

  async deleteSecret(key: string): Promise<void> {
    await this.context.secrets.delete(key);
  }

  getGlobalState<T>(key: string): T | undefined {
    return this.context.globalState.get<T>(key);
  }

  async setGlobalState<T>(key: string, value: T): Promise<void> {
    await this.context.globalState.update(key, value);
  }

  // ============================================================================
  // UI
  // ============================================================================

  showStatusBarItem(text: string, tooltip?: string): void {
    this.statusBarItem.text = text;
    if (tooltip) {
      this.statusBarItem.tooltip = tooltip;
    }
    this.statusBarItem.show();
  }

  hideStatusBarItem(): void {
    this.statusBarItem.hide();
  }

  showNotification(message: string, type: 'info' | 'warning' | 'error'): void {
    switch (type) {
      case 'info':
        vscode.window.showInformationMessage(message);
        break;
      case 'warning':
        vscode.window.showWarningMessage(message);
        break;
      case 'error':
        vscode.window.showErrorMessage(message);
        break;
    }
  }

  // ============================================================================
  // Auth
  // ============================================================================

  async authenticateWithGitHub(): Promise<string> {
    const session = await vscode.authentication.getSession('github', ['read:user', 'user:email'], {
      createIfNone: true,
    });

    return session.accessToken;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.statusBarItem.dispose();
  }
}
