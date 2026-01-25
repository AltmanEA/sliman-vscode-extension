/**
 * Build Manager - Orchestrates build processes for lectures and courses
 * 
 * Provides methods for:
 * - Building individual lectures
 * - Building entire courses
 * - Running development servers
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
 * Build Manager handles building and running lectures/courses
 */
export class BuildManager {
  /**
   * Creates a new BuildManager instance
   * @param courseManager - Course Manager instance
   * @param lectureManager - Lecture Manager instance
   */
  constructor(
    private readonly courseManager: CourseManager,
    private readonly lectureManager: LectureManager
  ) {}

  /**
   * Builds a single lecture
   * Creates a dedicated output channel for build progress
   * @param name - Lecture folder name
   * @returns Promise resolving when build completes
   * @throws Error if lecture doesn't exist or build fails
   */
  async buildLecture(name: string): Promise<void> {
    // Check if lecture exists
    if (!(await this.lectureManager.lectureExists(name))) {
      throw new Error(`Lecture "${name}" does not exist`);
    }

    const lecturePath = this.lectureManager.getLectureDir(name).fsPath;
    const channel = vscode.window.createOutputChannel(BUILD_OUTPUT_CHANNEL);

    try {
      channel.appendLine(`=== Building Lecture: ${name} ===`);
      channel.show();

      const result = await ProcessHelper.runBuild(lecturePath, { outputChannel: channel });

      if (result.success) {
        channel.appendLine('✓ Build completed successfully');
      } else {
        channel.appendLine(`✗ Build failed: ${result.stderr || `Exit code: ${result.exitCode}`}`);
        throw new Error(`Build failed for lecture "${name}": ${result.stderr}`);
      }
    } finally {
      channel.dispose();
    }
  }

  /**
   * Builds the entire course
   * Creates a dedicated output channel for build progress
   * @returns Promise resolving when build completes
   * @throws Error if build fails
   */
  async buildCourse(): Promise<void> {
    const courseRoot = this.courseManager.getCourseRoot().fsPath;
    const channel = vscode.window.createOutputChannel(BUILD_OUTPUT_CHANNEL);

    try {
      channel.appendLine('=== Building Course ===');
      channel.show();

      const result = await ProcessHelper.runBuild(courseRoot, { outputChannel: channel });

      if (result.success) {
        channel.appendLine('✓ Course build completed successfully');
      } else {
        channel.appendLine(`✗ Build failed: ${result.stderr || `Exit code: ${result.exitCode}`}`);
        throw new Error(`Course build failed: ${result.stderr}`);
      }
    } finally {
      channel.dispose();
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