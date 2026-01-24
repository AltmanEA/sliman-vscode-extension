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
} from '../constants';
import type { SlimanConfig, SlidesConfig, LectureInfo } from '../types';

/**
 * Course Manager handles course configuration files (sliman.json, slides.json)
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
    return targetPath.startsWith(courseRootPath + path.sep) || targetPath === courseRootPath;
  }

  // ============================================
  // Task 1.3.2: Sliman.json Operations
  // ============================================

  /**
   * Checks if the current workspace is a valid course root
   * (sliman.json exists in the root)
   * @returns Promise that resolves to true if valid course root
   */
  async isCourseRoot(): Promise<boolean> {
    const slimanPath = path.join(this.workspaceUri.fsPath, SLIMAN_FILENAME);
    try {
      await fs.access(slimanPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads the course configuration from sliman.json
   * @returns Promise that resolves to SlimanConfig or null if not found/invalid
   */
  async readSliman(): Promise<SlimanConfig | null> {
    const slimanUri = vscode.Uri.joinPath(this.workspaceUri, SLIMAN_FILENAME);
    try {
      const document = await vscode.workspace.openTextDocument(slimanUri);
      const content = document.getText();
      const config = JSON.parse(content) as SlimanConfig;
      return config;
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
  async writeSliman(config: SlimanConfig): Promise<void> {
    const slimanPath = path.join(this.workspaceUri.fsPath, SLIMAN_FILENAME);
    try {
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(slimanPath, content, 'utf-8');
    } catch (error) {
      console.error(`Failed to write ${SLIMAN_FILENAME}:`, error);
      throw error;
    }
  }

  // ============================================
  // Task 1.3.3: Slides.json Operations
  // ============================================

  /**
   * Reads the slides configuration from slides.json (in built/ directory)
   * @returns Promise that resolves to SlidesConfig or null if not found/invalid
   */
  async readSlidesJson(): Promise<SlidesConfig | null> {
    const builtDir = this.getBuiltCourseDir();
    const slidesJsonUri = vscode.Uri.joinPath(builtDir, SLIDES_FILENAME);
    try {
      const document = await vscode.workspace.openTextDocument(slidesJsonUri);
      const content = document.getText();
      const config = JSON.parse(content) as SlidesConfig;
      return config;
    } catch (error) {
      console.error(`Failed to read ${SLIDES_FILENAME}:`, error);
      return null;
    }
  }

  /**
   * Writes the slides configuration to slides.json (in built/ directory)
   * @param config - The SlidesConfig to write
   * @returns Promise that resolves when complete
   */
  async writeSlidesJson(config: SlidesConfig): Promise<void> {
    const builtDir = this.getBuiltCourseDir();
    const slidesJsonUri = vscode.Uri.joinPath(builtDir, SLIDES_FILENAME);
    try {
      // Ensure built directory exists
      await fs.mkdir(builtDir.fsPath, { recursive: true });
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(slidesJsonUri.fsPath, content, 'utf-8');
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

  // ============================================
  // Task 1.3.4: Lecture Discovery
  // ============================================

  /**
   * Gets the list of lecture directory names from the slides/ directory
   * @returns Promise that resolves to array of lecture directory names
   */
  async getLectureDirectories(): Promise<string[]> {
    const slidesDir = this.getSlidesDir();
    try {
      const entries = await fs.readdir(slidesDir.fsPath, { withFileTypes: true });
      const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => !name.startsWith('.') && name !== BUILT_DIR);
      return directories;
    } catch (error) {
      console.error('Failed to read slides directory:', error);
      return [];
    }
  }
}

