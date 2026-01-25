/**
 * Build Manager - Orchestrates build processes for lectures and courses
 * 
 * Provides methods for:
 * - Building individual lectures
 * - Building entire courses
 * - Running development servers
 * - Real-time output with progress display
 * 
 * Uses ProcessHelper for command execution with real-time output.
 */

import * as vscode from 'vscode';
import type { CourseManager } from './CourseManager';
import type { LectureManager } from './LectureManager';
import { ProcessHelper } from '../utils/process';

/** Output channel name for build operations */
const BUILD_OUTPUT_CHANNEL = 'sli.dev Course Build';

/**
 * Build progress information for progress notifications
 */
export interface BuildProgress {
  /** Lecture name (optional, for course-level builds) */
  lecture?: string;
  /** Current build stage */
  stage: 'installing' | 'building' | 'copying' | 'complete';
  /** Progress percentage (0-100) */
  percent?: number;
}

/**
 * Build error information
 */
export interface BuildError {
  /** Error type */
  type: 'lecture-not-found' | 'npm-not-found' | 'build-failed' | 'timeout';
  /** Lecture name (if applicable) */
  lecture?: string;
  /** Error message */
  message: string;
  /** Process exit code */
  exitCode?: number;
}

/**
 * Build Manager handles building and running lectures/courses
 * with real-time output via VS Code Output Channel
 */
export class BuildManager {
  /** Output channel for build operations */
  private _outputChannel: vscode.OutputChannel | null = null;
  /** Status bar item for progress display */
  private _statusBarItem: vscode.StatusBarItem | null = null;

  /**
   * Creates a new BuildManager instance
   * @param courseManager - Course Manager instance
   * @param lectureManager - Lecture Manager instance
   */
  constructor(
    private readonly courseManager: CourseManager,
    private readonly lectureManager: LectureManager
  ) {
    // Create output channel for build operations
    this._outputChannel = vscode.window.createOutputChannel(BUILD_OUTPUT_CHANNEL);
  }

  // ============================================
  // Subtask 2.5: Output Integration Methods
  // ============================================

  /**
   * Gets the output channel for build operations
   * @returns The output channel instance
   */
  get outputChannel(): vscode.OutputChannel | null {
    return this._outputChannel;
  }

  /**
   * Attaches an external output channel for build output
   * Useful for integration with Tree View or other UI components
   * @param channel - The VS Code output channel to attach
   */
  attachOutput(channel: vscode.OutputChannel): void {
    this._outputChannel?.dispose();
    this._outputChannel = channel;
  }

  /**
   * Clears the output channel for a fresh build
   */
  clearOutput(): void {
    this._outputChannel?.clear();
  }

  /**
   * Gets current timestamp for log formatting
   * @returns Formatted timestamp string [HH:mm:ss]
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
  }

  /**
   * Appends a single line to the output channel with timestamp
   * @param message - The message to append
   */
  appendLine(message: string): void {
    const timestamp = this.getTimestamp();
    this._outputChannel?.appendLine(`${timestamp} ${message}`);
  }

  /**
   * Appends a multi-line block to the output channel with timestamp
   * @param block - The multi-line block to append
   */
  appendBlock(block: string): void {
    const timestamp = this.getTimestamp();
    const lines = block.split('\n');
    for (const line of lines) {
      this._outputChannel?.appendLine(`${timestamp} ${line}`);
    }
  }

  /**
   * Shows the output channel
   * @param preserveFocus - Whether to preserve focus (default: false)
   */
  showOutput(preserveFocus?: boolean): void {
    this._outputChannel?.show(preserveFocus);
  }

  /**
   * Shows build progress in status bar
   * @param progress - Build progress information
   */
  async showProgress(progress: BuildProgress): Promise<void> {
    if (!this._statusBarItem) {
      this._statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
      );
    }

    const lectureInfo = progress.lecture ? ` ${progress.lecture}` : '';
    const stageText = progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1);
    const percentText = progress.percent !== undefined ? ` ${progress.percent}%` : '';

    this._statusBarItem.text = `$(tools) Building${lectureInfo}: ${stageText}${percentText}`;
    this._statusBarItem.show();
  }

  /**
   * Hides the build progress status bar item
   */
  async hideProgress(): Promise<void> {
    if (this._statusBarItem) {
      this._statusBarItem.hide();
      this._statusBarItem.dispose();
      this._statusBarItem = null;
    }
  }

  /**
   * Handles build errors with proper formatting
   * @param error - The error that occurred
   * @param lecture - Lecture name (optional)
   * @returns BuildError object with structured error information
   */
  private async handleBuildError(error: unknown, lecture?: string): Promise<BuildError> {
    if (error instanceof Error && error.message) {
      // Check for specific error types
      if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        return {
          type: lecture ? 'lecture-not-found' : 'npm-not-found',
          lecture,
          message: error.message,
        };
      }
      if (error.message.includes('timeout')) {
        return {
          type: 'timeout',
          lecture,
          message: error.message,
        };
      }
    }

    // Default to build failed
    return {
      type: 'build-failed',
      lecture,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  /**
   * Displays a build error in the output channel and via notification
   * @param error - The build error to display
   */
  private async showBuildError(error: BuildError): Promise<void> {
    const prefix = error.lecture ? `Lecture "${error.lecture}": ` : '';
    this.appendLine(`✗ ${prefix}${error.message}`);

    await vscode.window.showErrorMessage(`Build failed: ${error.message}`);
  }

  /**
   * Builds a single lecture
   * Uses the output channel for real-time build progress
   * @param name - Lecture folder name
   * @returns Promise resolving when build completes
   * @throws Error if lecture doesn't exist or build fails
   */
  async buildLecture(name: string): Promise<void> {
    // Check if lecture exists
    if (!(await this.lectureManager.lectureExists(name))) {
      const error = await this.handleBuildError(
        new Error(`Lecture "${name}" does not exist`),
        name
      );
      await this.showBuildError(error);
      throw error;
    }

    const lecturePath = this.lectureManager.getLectureDir(name).fsPath;

    // Clear and show output channel
    this.clearOutput();
    this.appendLine(`=== Building Lecture: ${name} ===`);
    this.showProgress({ lecture: name, stage: 'installing' });

    try {
      // Install dependencies
      this.appendLine('Installing dependencies...');
      const installResult = await ProcessHelper.installDependencies(lecturePath, {
        outputChannel: this._outputChannel ?? undefined,
      });

      if (!installResult.success) {
        const error = await this.handleBuildError(
          new Error(`npm install failed: ${installResult.stderr}`),
          name
        );
        await this.showBuildError(error);
        throw error;
      }

      this.appendLine('✓ Dependencies installed');

      // Build the lecture
      this.appendProgress({ lecture: name, stage: 'building' });
      this.appendLine('Building presentation...');

      const buildResult = await ProcessHelper.runBuild(lecturePath, {
        outputChannel: this._outputChannel ?? undefined,
      });

      if (!buildResult.success) {
        const error = await this.handleBuildError(
          new Error(`Build failed: ${buildResult.stderr || `Exit code: ${buildResult.exitCode}`}`),
          name
        );
        await this.showBuildError(error);
        throw error;
      }

      this.appendLine('✓ Presentation built');

      // Copy to built directory
      this.appendProgress({ lecture: name, stage: 'copying' });
      this.appendLine('Copying to built/...');

      // TODO: Implement copy logic if needed

      this.appendProgress({ lecture: name, stage: 'complete' });
      this.appendLine('✓ Complete!');
      this.appendLine('=== Done ===');
    } finally {
      await this.hideProgress();
    }
  }

  /**
   * Updates progress with percentage if available
   * @param progress - Build progress information
   */
  private appendProgress(progress: BuildProgress): void {
    this.showProgress(progress);
  }

  /**
   * Builds the entire course
   * Uses the output channel for real-time build progress
   * @returns Promise resolving when build completes
   * @throws Error if build fails
   */
  async buildCourse(): Promise<void> {
    const courseRoot = this.courseManager.getCourseRoot().fsPath;

    // Clear and show output channel
    this.clearOutput();
    this.appendLine('=== Building Course ===');
    this.showProgress({ stage: 'installing' });

    try {
      // Install dependencies
      this.appendLine('Installing dependencies...');
      const installResult = await ProcessHelper.installDependencies(courseRoot, {
        outputChannel: this._outputChannel ?? undefined,
      });

      if (!installResult.success) {
        const error = await this.handleBuildError(
          new Error(`npm install failed: ${installResult.stderr}`)
        );
        await this.showBuildError(error);
        throw error;
      }

      this.appendLine('✓ Dependencies installed');

      // Build all lectures
      const lectureDirs = await this.courseManager.getLectureDirectories();
      for (const lectureName of lectureDirs) {
        this.appendLine(`Building lecture: ${lectureName}...`);
        const lecturePath = this.lectureManager.getLectureDir(lectureName).fsPath;

        const buildResult = await ProcessHelper.runBuild(lecturePath, {
          outputChannel: this._outputChannel ?? undefined,
        });

        if (!buildResult.success) {
          const error = await this.handleBuildError(
            new Error(`Build failed: ${buildResult.stderr || `Exit code: ${buildResult.exitCode}`}`),
            lectureName
          );
          await this.showBuildError(error);
          throw error;
        }

        this.appendLine(`✓ Lecture "${lectureName}" built`);
      }

      this.appendLine('✓ Course build completed successfully');
      this.appendLine('=== Done ===');
    } finally {
      await this.hideProgress();
    }
  }

  /**
   * Runs a development server for a lecture
   * Creates a terminal and runs npm run dev in the lecture directory
   * Terminal remains open for user interaction (close manually to stop)
   * @param name - Lecture folder name
   * @returns Promise resolving when terminal is created
   * @throws Error if lecture doesn't exist
   */
  async runDevServer(name: string): Promise<void> {
    // Check if lecture exists
    if (!(await this.lectureManager.lectureExists(name))) {
      throw new Error(`Lecture "${name}" does not exist`);
    }

    const lecturePath = this.lectureManager.getLectureDir(name).fsPath;
    const terminalName = `sli.dev: ${name}`;

    // Create terminal
    const terminal = vscode.window.createTerminal(terminalName);

    // Run npm run dev in the lecture directory
    terminal.sendText(`cd "${lecturePath}" && npm run dev`);
    terminal.show();

    // Terminal is not disposed - user closes it manually to stop the server
  }
}