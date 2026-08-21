'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { CourseManager } from './CourseManager';
import type { LectureManager } from './LectureManager';

/**
 * Build Manager — Orchestrates build processes via VS Code terminals.
 *
 * All build commands run in real VS Code terminals that the user can see,
 * interact with, and cancel (Ctrl+C / close terminal).
 *
 * Build execution path:
 * - buildLecture(name) — creates/reuses a terminal, sends clean + build + copy commands,
 *   waits for '.sliman-build-status.json' file to detect completion.
 * - buildCourse() — reuses the shared 'sli.dev' terminal, sends commands for each lecture
 *   sequentially, then updates index.html via FS.
 * - runDevServer(name) — creates/reuses a per-lecture terminal, runs pnpm run dev.
 *
 * Signal protocol:
 * - After each lecture build, the last command writes '.sliman-build-status.json' file
 *   with content {"status": "done"}.
 * - The manager polls for this file to know the build completed.
 * - If the file is not detected within 10 minutes, the build is considered failed.
 * - If the user closes the terminal, the build is considered cancelled.
 */

// Max wait time for build signal (10 minutes)
const BUILD_SIGNAL_TIMEOUT_MS = 600000;

export class BuildManager {
  /** Shared terminal for course-level builds (buildCourse) */
  private courseTerminal: vscode.Terminal | null = null;

  /** Map of per-lecture terminals: lectureName -> Terminal */
  private readonly lectureTerminals = new Map<string, vscode.Terminal>();

  /**
   * Creates a new BuildManager instance.
   */
  constructor(
    private readonly courseManager: CourseManager,
    private readonly lectureManager: LectureManager
  ) {}

  /**
   * Disposes all resources held by BuildManager.
   */
  dispose(): void {
    this.courseTerminal?.dispose();
    this.courseTerminal = null;

    for (const [, terminal] of this.lectureTerminals) {
      terminal.dispose();
    }
    this.lectureTerminals.clear();
  }

  // ============================================
  // Build single lecture via terminal
  // ============================================

  /**
   * Builds a single lecture using a dedicated terminal.
   *
   * Steps (sent via terminal.sendText):
   * 1. cd lecture-path
   * 2. Clean Vite cache: rm -rf node_modules/.vite; rm -rf dist
   * 3. Build: pnpm build --base /...
   * 4. Clean destination: rm -rf dest-path
   * 5. Copy: cp -r dist dest-path
   * 6. Signal: write .sliman-build-status.json file
   *
   * Waits for '.sliman-build-status.json' file to detect completion.
   *
   * @param name - Lecture folder name
   * @param deployRoot - When false: --base /{courseName}/{lectureName}/, copy to {courseName}/{lectureName}/
   *                     When true:  --base /{lectureName}/, copy to built/{lectureName}/
   * @returns Promise resolving when build completes (signal detected)
   * @throws Error if lecture doesn't exist or build fails
   */
  async buildLecture(name: string, deployRoot: boolean = false): Promise<void> {
    // Check if lecture exists
    if (!(await this.lectureManager.lectureExists(name))) {
      throw Object.assign(
        new Error(`Lecture "${name}" does not exist`),
        { type: 'lecture-not-found' as const, lecture: name }
      );
    }

    const lecturePath = this.lectureManager.getLectureDir(name).fsPath;

    // Get course name for base path
    const courseName = await this.courseManager.readCourseName();
    if (!courseName) {
      throw new Error('Course name not found in sliman.json');
    }

    // Determine base path and copy destination based on deployRoot mode
    let basePath: string;
    let copyDestination: string;

    if (deployRoot) {
      basePath = `/${name}/`;
      copyDestination = path.join(this.courseManager.getCourseRoot().fsPath, 'built', name);
    } else {
      basePath = `/${courseName}/${name}/`;
      copyDestination = path.join(this.courseManager.getCourseRoot().fsPath, courseName, name);
    }

    // Get or create terminal for this lecture
    const terminal = this.getOrCreateLectureTerminal(name);

    // Send build commands
    this.sendBuildCommands(terminal, lecturePath, basePath, copyDestination);

    // Wait for build signal
    await this.waitForBuildDone(terminal, name);
  }

  /**
   * Sends all build commands to the terminal sequentially.
   * The last command writes a status file for the extension to detect completion.
   */
  private sendBuildCommands(
    terminal: vscode.Terminal,
    lecturePath: string,
    basePath: string,
    copyDestination: string
  ): void {
    // Step 1: Change to lecture directory (PowerShell: Set-Location)
    terminal.sendText('Set-Location "' + lecturePath + '"');

    // Step 2: Clean Vite cache and dist (PowerShell: Remove-Item -Recurse -Force)
    // Use forward slashes — PowerShell accepts them on Windows
    terminal.sendText('Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue');
    terminal.sendText('Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue');

    // Step 3: Build (use npx to avoid pnpm wrapping args in PowerShell)
    terminal.sendText(`npx slidev build --base ${basePath}`);

    // Step 4: Clean destination (PowerShell)
    terminal.sendText(`Remove-Item -Path "${copyDestination}" -Recurse -Force -ErrorAction SilentlyContinue`);

    // Step 5: Copy built files (PowerShell: Copy-Item -Recurse)
    // Only copy if dist exists (build succeeded)
    // Use "dist/." to copy all contents including subdirectories
    terminal.sendText('if (Test-Path "dist") { Copy-Item -Path "dist/." -Destination "' + copyDestination + '" -Recurse -Force }');

    // Step 6: Write status file (PowerShell: Set-Content)
    const courseRoot = this.courseManager.getCourseRoot().fsPath;
    const statusFile = JSON.stringify({ status: 'done' });
    terminal.sendText(`Set-Content -Path "${path.join(courseRoot, '.sliman-build-status.json')}" -Value '${statusFile}'`);
  }

  /**
   * Gets or creates a per-lecture terminal.
   */
  private getOrCreateLectureTerminal(name: string): vscode.Terminal {
    const terminalName = `sli.dev: ${name}`;

    let terminal = this.lectureTerminals.get(name);

    if (terminal && !terminal.exitStatus) {
      // Terminal exists and is still running — reuse it
      return terminal;
    }

    // Create new terminal
    terminal = vscode.window.createTerminal({ name: terminalName });
    this.lectureTerminals.set(name, terminal);

    return terminal;
  }

  /**
   * Waits for the build status file to appear (file-based signal).
   * Rejects if the file does not appear within timeout or terminal is closed.
   */
  private waitForBuildDone(terminal: vscode.Terminal, lectureName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const statusFilePath = path.join(this.courseManager.getCourseRoot().fsPath, '.sliman-build-status.json');
      let done = false;

      // Poll for the status file
      const pollInterval = setInterval(() => {
        if (done) return;

        try {
          if (fs.existsSync(statusFilePath)) {
            const content = fs.readFileSync(statusFilePath, 'utf-8');
            const status = JSON.parse(content);

            done = true;
            clearInterval(pollInterval);

            // Clean up the status file
            try { fs.unlinkSync(statusFilePath); } catch { /* ignore */ }

            if (status.status === 'done') {
              resolve();
            } else {
              reject(new Error(`Build failed for lecture "${lectureName}": ${status.error || 'unknown error'}`));
            }
          }
        } catch {
          // File not ready yet or parse error — keep polling
        }
      }, 500);

      // Timeout: if signal not received within BUILD_SIGNAL_TIMEOUT_MS
      const timeoutHandle = setTimeout(() => {
        if (!done) {
          done = true;
          clearInterval(pollInterval);
          reject(Object.assign(
            new Error(`Build timed out after ${BUILD_SIGNAL_TIMEOUT_MS / 1000} seconds for lecture "${lectureName}"`),
            { type: 'timeout' as const, lecture: lectureName }
          ));
        }
      }, BUILD_SIGNAL_TIMEOUT_MS);

      // If terminal is closed by user, cancel the build
      const closeListener = vscode.window.onDidCloseTerminal((closed) => {
        if (closed === terminal && !done) {
          done = true;
          clearInterval(pollInterval);
          clearTimeout(timeoutHandle);
          closeListener.dispose();
          reject(new Error(`Build cancelled: terminal "${terminal.name}" was closed`));
        }
      });
    });
  }

  // ============================================
  // Build entire course via shared terminal
  // ============================================

  /**
   * Builds the entire course using a shared terminal.
   * Each lecture is built sequentially in the same terminal.
   * After all lectures are built, updates index.html via FS.
   */
  async buildCourse(): Promise<void> {
    const terminal = this.getCourseTerminal();
    const lectureDirs = await this.courseManager.getLectureDirectories();

    if (lectureDirs.length === 0) {
      throw new Error('No lectures found in course');
    }

    const courseRoot = this.courseManager.getCourseRoot();
    const courseName = await this.courseManager.readCourseName();
    if (!courseName) {
      throw new Error('Course name not found in sliman.json');
    }

    // Get deployRoot mode
    const deployRoot = await this.courseManager.readDeployRoot();

    for (const lectureName of lectureDirs) {
      // Check if lecture exists
      if (!(await this.lectureManager.lectureExists(lectureName))) {
        continue; // Skip non-existent lectures
      }

      const lecturePath = this.lectureManager.getLectureDir(lectureName).fsPath;

      // Determine base path and copy destination
      let basePath: string;
      let copyDestination: string;

      if (deployRoot) {
        basePath = `/${lectureName}/`;
        copyDestination = path.join(courseRoot.fsPath, 'built', lectureName);
      } else {
        basePath = `/${courseName}/${lectureName}/`;
        copyDestination = path.join(courseRoot.fsPath, courseName, lectureName);
      }

      // Send build commands for this lecture
      this.sendBuildCommands(terminal, lecturePath, basePath, copyDestination);
    }

    // After all lectures, send course build signal (write status file)
    const statusFile = JSON.stringify({ status: 'done' });
    terminal.sendText(`Set-Content -Path "${path.join(courseRoot.fsPath, '.sliman-build-status.json')}" -Value '${statusFile}'`);

    // Wait for course build signal
    await this.waitForCourseBuildDone(terminal);

    // Update index.html via FS (not via terminal)
    await this.updateIndexHtml();
  }

  /**
   * Gets or creates the shared course build terminal.
   */
  private getCourseTerminal(): vscode.Terminal {
    if (!this.courseTerminal || this.courseTerminal.exitStatus) {
      this.courseTerminal = vscode.window.createTerminal({ name: 'sli.dev' });
    }
    return this.courseTerminal;
  }

  /**
   * Waits for the build status file to appear (file-based signal for course build).
   * Rejects if the file does not appear within timeout or terminal is closed.
   */
  private waitForCourseBuildDone(terminal: vscode.Terminal): Promise<void> {
    return new Promise((resolve, reject) => {
      const statusFilePath = path.join(this.courseManager.getCourseRoot().fsPath, '.sliman-build-status.json');
      let done = false;

      // Poll for the status file
      const pollInterval = setInterval(() => {
        if (done) return;

        try {
          if (fs.existsSync(statusFilePath)) {
            const content = fs.readFileSync(statusFilePath, 'utf-8');
            const status = JSON.parse(content);

            done = true;
            clearInterval(pollInterval);

            // Clean up the status file
            try { fs.unlinkSync(statusFilePath); } catch { /* ignore */ }

            if (status.status === 'done') {
              resolve();
            } else {
              reject(new Error(`Course build failed: ${status.error || 'unknown error'}`));
            }
          }
        } catch {
          // File not ready yet — keep polling
        }
      }, 500);

      // Timeout
      const timeoutHandle = setTimeout(() => {
        if (!done) {
          done = true;
          clearInterval(pollInterval);
          reject(new Error('Course build timed out'));
        }
      }, BUILD_SIGNAL_TIMEOUT_MS);

      // If terminal is closed by user, cancel the build
      const closeListener = vscode.window.onDidCloseTerminal((closed) => {
        if (closed === terminal && !done) {
          done = true;
          clearInterval(pollInterval);
          clearTimeout(timeoutHandle);
          closeListener.dispose();
          reject(new Error('Course build cancelled: terminal was closed'));
        }
      });
    });
  }

  // ============================================
  // Dev server
  // ============================================

  /**
   * Runs a development server for a lecture via terminal.
   * Creates a terminal and runs pnpm run dev in the lecture directory.
   * Terminal remains open for user interaction (close manually to stop).
   */
  async runDevServer(name: string): Promise<void> {
    // Check if lecture exists
    if (!(await this.lectureManager.lectureExists(name))) {
      throw new Error(`Lecture "${name}" does not exist`);
    }

    const lecturePath = this.lectureManager.getLectureDir(name).fsPath;

    // Reuse or create terminal
    const terminal = this.getOrCreateLectureTerminal(name);

    // Run pnpm run dev (PowerShell: Set-Location)
    terminal.sendText('Set-Location "' + lecturePath + '"; pnpm run dev');
    terminal.show();
  }

  // ============================================
  // Index HTML update (FS operation)
  // ============================================

  /**
   * Updates index.html with lecture list from slides.json.
   * Finds <!-- Place to insert slide list --><div id="slide_list"></div>
   * and replaces the content with a numbered list of lectures.
   */
  async updateIndexHtml(): Promise<void> {
    try {
      const courseName = await this.courseManager.readCourseName();
      if (!courseName) {
        throw new Error('Course name not found in sliman.json');
      }

      // Determine output directory based on deployRoot mode
      const deployRoot = await this.courseManager.readDeployRoot();
      const outputDir = deployRoot ? 'built' : courseName;

      const courseRoot = this.courseManager.getCourseRoot();
      const indexHtmlPath = vscode.Uri.joinPath(courseRoot, outputDir, 'index.html');

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
        const slidesPath = vscode.Uri.joinPath(courseRoot, outputDir, 'slides.json');
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
      console.error('Failed to update index.html:', error);
    }
  }

  /**
   * Generates HTML for numbered list of lectures.
   */
  private generateLectureListHtml(lectures: Array<{ name: string; title: string }>): string {
    if (!lectures || lectures.length === 0) {
      return '<div id="slide_list"><p>Лекции не найдены</p></div>';
    }

    const listItems = lectures.map((lecture) => {
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
   * Escapes HTML characters to prevent XSS.
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