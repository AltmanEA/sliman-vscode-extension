/**
 * Lecture Manager - Manages lecture structure and creation
 */

import * as vscode from 'vscode';
import {
  LECTURE_SLIDES,
  LECTURE_PACKAGE,
} from '../constants';
import type { CourseManager } from './CourseManager';

/**
 * Lecture Manager handles lecture directory operations
 * and provides URI helpers for lecture file navigation.
 */
export class LectureManager {
  /** Course Manager instance for shared operations */
  private readonly courseManager: CourseManager;

  /**
   * Creates a new LectureManager instance
   * @param courseManager - Course Manager instance (provides workspace URI)
   */
  constructor(courseManager: CourseManager) {
    this.courseManager = courseManager;
  }

  // ============================================
  // Subtask 2.2: Structure Methods
  // ============================================

  /**
   * Gets the slides directory URI (where lecture folders are stored)
   * @returns The URI of the slides/ directory
   */
  getSlidesDir(): vscode.Uri {
    return this.courseManager.getSlidesDir();
  }

  /**
   * Gets the lecture directory URI for a specific lecture
   * @param name - Lecture folder name (e.g., "lecture-1" or "about")
   * @returns The URI of the lecture directory
   */
  getLectureDir(name: string): vscode.Uri {
    return vscode.Uri.joinPath(this.getSlidesDir(), name);
  }

  /**
   * Gets the slides.md file URI for a specific lecture
   * @param name - Lecture folder name
   * @returns The URI of slides/{name}/slides.md
   */
  getLectureSlidesPath(name: string): vscode.Uri {
    return vscode.Uri.joinPath(this.getLectureDir(name), LECTURE_SLIDES);
  }

  /**
   * Gets the package.json file URI for a specific lecture
   * @param name - Lecture folder name
   * @returns The URI of slides/{name}/package.json
   */
  getLecturePackagePath(name: string): vscode.Uri {
    return vscode.Uri.joinPath(this.getLectureDir(name), LECTURE_PACKAGE);
  }

  /**
   * Checks if a lecture directory exists
   * @param name - Lecture folder name
   * @returns Promise that resolves to true if lecture is a directory
   */
  async lectureExists(name: string): Promise<boolean> {
    const lectureDir = this.getLectureDir(name);
    try {
      const stat = await vscode.workspace.fs.stat(lectureDir);
      // Check that it's a directory (type === 2 for directory)
      return stat.type === vscode.FileType.Directory;
    } catch {
      return false;
    }
  }

  /**
   * Creates a lecture directory
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   * @throws Error if directory creation fails
   */
  async createLectureDir(name: string): Promise<void> {
    const lectureDir = this.getLectureDir(name);
    try {
      await vscode.workspace.fs.createDirectory(lectureDir);
    } catch (error) {
      console.error(`Failed to create lecture directory: ${name}`, error);
      throw error;
    }
  }
}