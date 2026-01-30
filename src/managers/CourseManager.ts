/**
 * Course Manager - Manages course configuration files and path resolution
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SLIDES_FILENAME,
  SLIDES_DIR,
  BUILT_DIR,
  TEMPLATE_SLIDES,
} from '../constants';
import type { SlidesConfig, LectureInfo, CourseData } from '../types';

/**
 * Course Manager handles course configuration (dist/slides.json with course_name and slides array)
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
   * Gets the built course output directory URI
   * @returns The URI of the built/ directory (course root for GitHub Pages)
   */
  getBuiltCourseDir(): vscode.Uri {
    return vscode.Uri.joinPath(this.workspaceUri, BUILT_DIR);
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
  // Course Name Operations (stored in dist/slides.json)
  // ============================================

  /**
   * Checks if the current workspace is a valid course root
   * (dist/slides.json exists in the workspace)
   * @returns Promise that resolves to true if valid course root
   */
  async isCourseRoot(): Promise<boolean> {
    const slidesJsonPath = path.join(this.workspaceUri.fsPath, BUILT_DIR, SLIDES_FILENAME);
    try {
      await fs.access(slidesJsonPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads the course name from dist/slides.json
   * @returns Promise that resolves to course name string or null if not found
   */
  async readCourseName(): Promise<string | null> {
    const slidesConfig = await this.readSlidesJson();
    if (!slidesConfig?.course_name || typeof slidesConfig.course_name !== 'string' || slidesConfig.course_name.trim() === '') {
      return null;
    }
    return slidesConfig.course_name;
  }

  /**
   * Writes the course name to dist/slides.json
   * @param name - The course name to write
   * @returns Promise that resolves when complete
   */
  async writeCourseName(name: string): Promise<void> {
    const slidesJsonUri = vscode.Uri.joinPath(this.getBuiltCourseDir(), SLIDES_FILENAME);
    try {
      // Read existing config
      let config: SlidesConfig = { slides: [] };
      try {
        const content = new TextDecoder().decode(
          await vscode.workspace.fs.readFile(slidesJsonUri)
        );
        config = JSON.parse(content);
      } catch {
        // File doesn't exist or is invalid, start with empty config
      }

      // Update course_name and write back
      config.course_name = name;
      const content = JSON.stringify(config, null, 2);
      await vscode.workspace.fs.writeFile(slidesJsonUri, new TextEncoder().encode(content));
    } catch (error) {
      console.error(`Failed to write course name:`, error);
      throw error;
    }
  }

  // ============================================
  // Slides.json Operations (stored in dist/ directory)
  // ============================================

  /**
   * Reads the slides configuration from slides.json (in dist/ directory)
   * @returns Promise that resolves to SlidesConfig or null if not found/invalid
   */
  async readSlidesJson(): Promise<SlidesConfig | null> {
    const slidesJsonUri = vscode.Uri.joinPath(this.getBuiltCourseDir(), SLIDES_FILENAME);
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
   * Writes the slides configuration to slides.json (in dist/ directory)
   * Preserves course_name if it exists
   * @param config - The SlidesConfig to write
   * @returns Promise that resolves when complete
   */
  async writeSlidesJson(config: SlidesConfig): Promise<void> {
    const slidesJsonUri = vscode.Uri.joinPath(this.getBuiltCourseDir(), SLIDES_FILENAME);
    try {
      // Preserve course_name if it exists
      let existingConfig: SlidesConfig = { slides: [] };
      try {
        const existingContent = new TextDecoder().decode(
          await vscode.workspace.fs.readFile(slidesJsonUri)
        );
        const parsed = JSON.parse(existingContent);
        if (parsed.course_name) {
          existingConfig.course_name = parsed.course_name;
        }
      } catch {
        // File doesn't exist, use default
      }

      // Merge config
      const mergedConfig: SlidesConfig = {
        ...existingConfig,
        ...config,
        slides: config.slides ?? existingConfig.slides,
      };

      const content = JSON.stringify(mergedConfig, null, 2);
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

