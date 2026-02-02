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

  /**
   * Updates index.html with lecture list from slides.json
   * Finds <!-- Place to insert slide list --><div id="slide_list"></div>
   * and replaces the content with a numbered list of lectures
   * @returns Promise that resolves when update is complete
   */
  async updateIndexHtml(): Promise<void> {
    try {
      // Get course name for building paths
      const courseName = await this.courseManager.readCourseName();
      if (!courseName) {
        throw new Error('Course name not found in sliman.json');
      }

      // Path to index.html: {courseRoot}/{courseName}/index.html
      const courseRoot = this.courseManager.getCourseRoot();
      const indexHtmlPath = vscode.Uri.joinPath(courseRoot, courseName, 'index.html');

      // Read current index.html content
      let indexHtmlContent: string;
      try {
        const fileContent = await vscode.workspace.fs.readFile(indexHtmlPath);
        indexHtmlContent = new TextDecoder().decode(fileContent);
      } catch (error) {
        throw new Error(`Failed to read index.html: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Read slides.json to get lecture list
      let slidesConfig: { slides: Array<{ name: string; title: string }> };
      try {
        const slidesPath = vscode.Uri.joinPath(courseRoot, courseName, 'slides.json');
        const slidesContent = await vscode.workspace.fs.readFile(slidesPath);
        slidesConfig = JSON.parse(new TextDecoder().decode(slidesContent));
      } catch (error) {
        throw new Error(`Failed to read slides.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Generate numbered list HTML
      const lectureListHtml = this.generateLectureListHtml(slidesConfig.slides);

      // Find and replace the slide_list div content
      const placeholderPattern = /<!-- Place to insert slide list -->[\s\S]*?<div id="slide_list">[\s\S]*?<\/div>/;
      
      if (placeholderPattern.test(indexHtmlContent)) {
        const replacement = `<!-- Place to insert slide list -->\n${lectureListHtml}`;
        indexHtmlContent = indexHtmlContent.replace(placeholderPattern, replacement);
      } else {
        // If placeholder not found, try to find just the div
        const divPattern = /<div id="slide_list">[\s\S]*?<\/div>/;
        if (divPattern.test(indexHtmlContent)) {
          indexHtmlContent = indexHtmlContent.replace(divPattern, lectureListHtml);
        } else {
          throw new Error('Could not find slide_list div in index.html');
        }
      }

      // Write updated content back to index.html
      try {
        await vscode.workspace.fs.writeFile(
          indexHtmlPath,
          new TextEncoder().encode(indexHtmlContent)
        );
      } catch (error) {
        throw new Error(`Failed to write index.html: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      // Log error but don't throw - preserve existing content
      console.error('Failed to update index.html:', error);
      // Could also log to output channel if available
    }
  }

  /**
   * Generates HTML for numbered list of lectures
   * @param lectures - Array of lecture objects with name and title
   * @returns HTML string with numbered list
   */
  private generateLectureListHtml(lectures: Array<{ name: string; title: string }>): string {
    if (!lectures || lectures.length === 0) {
      return '<div id="slide_list"><p>Лекции не найдены</p></div>';
    }

    const listItems = lectures.map(lecture => {
      const safeTitle = this.escapeHtml(lecture.title);
      const safeName = this.escapeHtml(lecture.name);
      return `  <li><a href="./${safeName}">${safeTitle}</a></li>`;
    }).join('\n');

    return `<div id="slide_list">
<ol>
${listItems}
</ol>
</div>`;
  }

  /**
   * Escapes HTML characters to prevent XSS
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}