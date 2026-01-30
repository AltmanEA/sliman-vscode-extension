/**
 * Course Manager - Manages course configuration files and path resolution
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SLIMAN_FILENAME,
  SLIDES_FILENAME,
  SLIDES_DIR,
  BUILT_DIR,
  TEMPLATE_SLIDES,
} from '../constants';
import type { SlimanConfig, SlidesConfig, LectureInfo, CourseData } from '../types';

/**
 * Course Manager handles course configuration (sliman.json for course_name, {course_name}/slides.json for slides)
 * and provides URI helpers for project structure navigation.
 */
export class CourseManager {
  /** Workspace folder URI */
  private readonly workspaceUri: vscode.Uri;

  /**
   * Creates a new CourseManager instance
   * @param workspaceUri - Workspace folder URI (defaults to first workspace folder)
   */
  constructor(workspaceUri: vscode.Uri) {
    this.workspaceUri = workspaceUri;
  }

  // ============================================
  // Task 1.3.1: Path Resolution
  // ============================================

  /**
   * Gets the course root URI (workspace root)
   * @returns The URI of the course root directory
   */
  getCourseRoot(): vscode.Uri {
    return this.workspaceUri;
  }

  /**
   * Gets the slides directory URI (where lecture folders are stored)
   * @returns The URI of the slides/ directory
   */
  getSlidesDir(): vscode.Uri {
    return vscode.Uri.joinPath(this.workspaceUri, SLIDES_DIR);
  }

  /**
   * Gets the built course output directory URI (for backward compatibility)
   * @returns The URI of the built/ directory (deprecated, use getBuiltCourseDirWithName instead)
   */
  getBuiltCourseDir(): vscode.Uri {
    // First get the course name, then return the directory with course name
    // This method should be used after course name is known
    // For backward compatibility, fall back to "built" if course name is not available
    return vscode.Uri.joinPath(this.workspaceUri, BUILT_DIR);
  }

  /**
   * Gets the built course output directory URI with course name
   * @param courseName - The course name to use as directory name
   * @returns The URI of the {courseName}/ directory
   */
  getBuiltCourseDirWithName(courseName: string): vscode.Uri {
    return vscode.Uri.joinPath(this.workspaceUri, courseName);
  }

  /**
   * Checks if a given URI is within the course root directory
   * @param uri - The URI to check
   * @returns True if the URI is within the course root
   */
  isPathInCourseRoot(uri: vscode.Uri): boolean {
    const courseRootPath = this.workspaceUri.fsPath;
    const targetPath = uri.fsPath;
    // Use path.sep for cross-platform path separator (Windows: '\', Unix: '/')
    return targetPath.startsWith(courseRootPath + path.sep) || targetPath === courseRootPath;
  }

  // ============================================
  // Course Name Operations (stored in sliman.json)
  // ============================================

  /**
   * Checks if the current workspace is a valid course root
   * (sliman.json exists in the workspace)
   * @returns Promise that resolves to true if valid course root
   */
  async isCourseRoot(): Promise<boolean> {
    const slimanJsonPath = path.join(this.workspaceUri.fsPath, SLIMAN_FILENAME);
    try {
      await fs.access(slimanJsonPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads the course configuration from sliman.json
   * @returns Promise that resolves to SlimanConfig or null if not found/invalid
   */
  async readSlimanConfig(): Promise<SlimanConfig | null> {
    const slimanJsonUri = vscode.Uri.joinPath(this.workspaceUri, SLIMAN_FILENAME);
    try {
      const content = await vscode.workspace.fs.readFile(slimanJsonUri);
      const parsed = JSON.parse(new TextDecoder().decode(content));

      // Validate structure: must be object with course_name as string
      if (!parsed?.course_name || typeof parsed.course_name !== 'string' || parsed.course_name.trim() === '') {
        console.error(`Invalid ${SLIMAN_FILENAME}: missing or invalid 'course_name' field`);
        return null;
      }

      return parsed as SlimanConfig;
    } catch (error) {
      console.error(`Failed to read ${SLIMAN_FILENAME}:`, error);
      return null;
    }
  }

  /**
   * Writes the course configuration to sliman.json
   * @param config - The SlimanConfig to write
   * @returns Promise that resolves when complete
   */
  async writeSlimanConfig(config: SlimanConfig): Promise<void> {
    const slimanJsonUri = vscode.Uri.joinPath(this.workspaceUri, SLIMAN_FILENAME);
    try {
      const content = JSON.stringify(config, null, 2);
      await vscode.workspace.fs.writeFile(slimanJsonUri, new TextEncoder().encode(content));
    } catch (error) {
      console.error(`Failed to write ${SLIMAN_FILENAME}:`, error);
      throw error;
    }
  }

  /**
   * Reads the course name from sliman.json
   * @returns Promise that resolves to course name string or null if not found
   */
  async readCourseName(): Promise<string | null> {
    const slimanConfig = await this.readSlimanConfig();
    return slimanConfig?.course_name ?? null;
  }

  /**
   * Writes the course name to sliman.json
   * @param name - The course name to write
   * @returns Promise that resolves when complete
   */
  async writeCourseName(name: string): Promise<void> {
    const config: SlimanConfig = { course_name: name };
    await this.writeSlimanConfig(config);
  }

  // ============================================
  // Slides.json Operations (stored in {course_name}/ directory)
  // ============================================

  /**
   * Reads the slides configuration from {course_name}/slides.json
   * @returns Promise that resolves to SlidesConfig or null if not found/invalid
   */
  async readSlidesJson(): Promise<SlidesConfig | null> {
    // Get course name to build path to {course_name}/slides.json
    const courseName = await this.readCourseName();
    if (!courseName) {
      console.error('Cannot read slides.json: course name not found in sliman.json');
      return null;
    }
    
    const slidesJsonUri = vscode.Uri.joinPath(this.getBuiltCourseDirWithName(courseName), SLIDES_FILENAME);
    try {
      const content = await vscode.workspace.fs.readFile(slidesJsonUri);
      const parsed = JSON.parse(new TextDecoder().decode(content));

      // Validate structure: must be object with slides as array
      if (!parsed?.slides || !Array.isArray(parsed.slides)) {
        console.error(`Invalid ${SLIDES_FILENAME}: missing or invalid 'slides' field`);
        return null;
      }

      return parsed as SlidesConfig;
    } catch (error) {
      console.error(`Failed to read ${SLIDES_FILENAME}:`, error);
      return null;
    }
  }

  /**
   * Writes the slides configuration to {course_name}/slides.json
   * @param config - The SlidesConfig to write
   * @returns Promise that resolves when complete
   */
  async writeSlidesJson(config: SlidesConfig): Promise<void> {
    // Get course name to build path to {course_name}/slides.json
    const courseName = await this.readCourseName();
    if (!courseName) {
      throw new Error('Cannot write slides.json: course name not found in sliman.json');
    }
    
    const slidesJsonUri = vscode.Uri.joinPath(this.getBuiltCourseDirWithName(courseName), SLIDES_FILENAME);
    try {
      const content = JSON.stringify(config, null, 2);
      await vscode.workspace.fs.writeFile(slidesJsonUri, new TextEncoder().encode(content));
    } catch (error) {
      console.error(`Failed to write ${SLIDES_FILENAME}:`, error);
      throw error;
    }
  }

  /**
   * Adds or updates a lecture entry in slides.json
   * @param name - Lecture folder name (e.g., "lecture-1")
   * @param title - Lecture display title
   * @returns Promise that resolves when complete
   */
  async addLecture(name: string, title: string): Promise<void> {
    const config = await this.readSlidesJson();
    const lectures: LectureInfo[] = config?.slides || [];

    const existingIndex = lectures.findIndex((l) => l.name === name);
    if (existingIndex >= 0) {
      lectures[existingIndex] = { name, title };
    } else {
      lectures.push({ name, title });
    }

    await this.writeSlidesJson({ slides: lectures });
  }

  /**
   * Removes a lecture entry from slides.json
   * @param name - Lecture folder name (e.g., "lecture-1")
   * @returns Promise that resolves when complete
   */
  async removeLecture(name: string): Promise<void> {
    const config = await this.readSlidesJson();
    const lectures: LectureInfo[] = config?.slides || [];

    const filteredLectures = lectures.filter((l) => l.name !== name);

    await this.writeSlidesJson({ slides: filteredLectures });
  }

  /**
   * Reads both course configuration at once
   * Useful for displaying course overview information
   * @returns Promise that resolves to CourseData with courseName and slides
   */
  async readCourseData(): Promise<CourseData> {
    const [courseName, slides] = await Promise.all([
      this.readCourseName(),
      this.readSlidesJson(),
    ]);
    return { courseName, slides };
  }

  // ============================================
  // Task 1.3.4: Lecture Discovery
  // ============================================

  /**
   * Gets the list of lecture directory names from the slides/ directory
   * Only includes directories that contain a slides.md file
   * @returns Promise that resolves to array of lecture directory names
   */
  async getLectureDirectories(): Promise<string[]> {
    const slidesDir = this.getSlidesDir();
    try {
      const entries = await fs.readdir(slidesDir.fsPath, { withFileTypes: true });
      const lectureDirs: string[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') || entry.name === BUILT_DIR) continue;

        const lecturePath = vscode.Uri.joinPath(slidesDir, entry.name, TEMPLATE_SLIDES);
        try {
          await fs.access(lecturePath.fsPath);
          lectureDirs.push(entry.name);
        } catch {
          // slides.md not found in this directory, skip
        }
      }

      return lectureDirs.sort();
    } catch (error) {
      console.error('Failed to read slides directory:', error);
      return [];
    }
  }
}

