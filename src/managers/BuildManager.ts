/**
 * Build Manager - Orchestrates build processes for lectures and courses
 * 
 * Provides methods for:
 * - Building individual lectures (via terminal)
 * - Building entire courses (via terminal)
 * - Running development servers (via terminal)
 * 
 * Commands using terminal:
 * - buildLecture() - creates terminal for pnpm build
 * - editLecture() - creates terminal for pnpm dev
 * - runDevServer() - creates terminal for dev server
 * 
 * Commands using output channel:
 * - buildCourse() - uses shared output channel
 */

import * as vscode from 'vscode';
import type { CourseManager } from './CourseManager';
import type { LectureManager } from './LectureManager';

/**
 * Build progress information for progress notifications
 */
export interface BuildProgress {
  /** Lecture name (optional, for course-level builds) */
  lecture?: string;
  /** Current build stage */
  stage: 'installing' | 'building' | 'copying' | 'updating' | 'complete';
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
    // No output channel - commands using terminal will handle their own output
    // Commands using output channel will use the shared one from extension.ts
  }

  /**
   * Disposes all resources held by BuildManager
   * Should be called when BuildManager is no longer needed
   */
  dispose(): void {
    if (this._statusBarItem) {
      this._statusBarItem.dispose();
      this._statusBarItem = null;
    }
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
   * Builds a single lecture via terminal
   * Creates a terminal and runs pnpm install and pnpm build
   * Terminal remains open for user interaction
   * @param name - Lecture folder name
   * @returns Promise resolving when terminal is created
   * @throws Error if lecture doesn't exist
   */
  async buildLecture(name: string): Promise<void> {
    // Check if lecture exists
    if (!(await this.lectureManager.lectureExists(name))) {
      throw new Error(`Lecture "${name}" does not exist`);
    }

    const lecturePath = this.lectureManager.getLectureDir(name).fsPath;
    const terminalName = `sli.dev: Build ${name}`;

    // Create terminal for build process
    const terminal = vscode.window.createTerminal(terminalName);

    // Show progress in status bar
    this.showProgress({ lecture: name, stage: 'building' });

    try {
      // Get course name for base path
      const courseName = await this.courseManager.readCourseName();
      if (!courseName) {
        throw new Error('Course name not found in sliman.json');
      }

      const basePath = `/${courseName}/${name}/`;

      // Execute build commands in terminal
      terminal.sendText(`cd "${lecturePath}"`);
      terminal.sendText('pnpm install');
      terminal.sendText(`pnpm build --base ${basePath}`);
      terminal.show();

      // Note: Terminal remains open for user interaction
      // User can close it manually to stop the process
      
    } catch (error) {
      await this.hideProgress();
      throw error;
    }
  }

  /**
   * Runs a development server for a lecture via terminal
   * Creates a terminal and runs pnpm run dev in the lecture directory
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

    // Run pnpm run dev with ; separator (works on all PowerShell versions)
    terminal.sendText(`cd "${lecturePath}"; pnpm run dev`);
    terminal.show();

    // Terminal is not disposed - user closes it manually to stop the server
  }

  /**
   * Builds the entire course using shared output channel
   * @param outputChannel - Shared output channel from extension
   * @returns Promise resolving when build completes
   * @throws Error if build fails
   */
  async buildCourse(outputChannel: vscode.OutputChannel): Promise<void> {
    // Show progress in status bar
    this.showProgress({ stage: 'building' });

    try {
      // Get lecture list and build each lecture using terminal
      const lectureDirs = await this.courseManager.getLectureDirectories();
      
      for (const lectureName of lectureDirs) {
        outputChannel.appendLine(`[BUILD] Building lecture: ${lectureName}`);
        
        // Use buildLecture to ensure consistent build process with terminal
        await this.buildLecture(lectureName);
        
        outputChannel.appendLine(`[BUILD] ✓ Lecture "${lectureName}" built successfully`);
      }

      outputChannel.appendLine('[BUILD] ✓ Course build completed successfully');
    } finally {
      await this.hideProgress();
    }
  }
}