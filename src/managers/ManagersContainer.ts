/**
 * Managers Container - Central storage for all extension managers
 * 
 * Provides singleton access to managers throughout the extension lifecycle.
 * Managers are initialized once during extension activation and reused across commands.
 * 
 * Stage 2: Includes CourseManager, LectureManager, and BuildManager
 */

import type * as vscode from 'vscode';
import { CourseManager } from './CourseManager';
import { LectureManager } from './LectureManager';
// BuildManager will be added in Stage 2 subtask 2.4

/**
 * Container for storing and providing access to extension managers
 */
export class ManagersContainer {
  private _courseManager: CourseManager | null = null;
  private _lectureManager: LectureManager | null = null;
  // Stage 2.4: Add BuildManager placeholder
  // private _buildManager: BuildManager | null = null;

  /**
   * Initializes all managers with the given workspace URI
   * @param workspaceUri - The workspace folder URI
   */
  initialize(workspaceUri: vscode.Uri): void {
    this._courseManager = new CourseManager(workspaceUri);
    this._lectureManager = new LectureManager(this._courseManager);
    // Stage 2.4: Initialize BuildManager here
    // this._buildManager = new BuildManager(workspaceUri, this._courseManager, this._lectureManager);
  }

  /**
   * Gets the CourseManager instance
   * @returns CourseManager or null if not initialized
   */
  get courseManager(): CourseManager | null {
    return this._courseManager;
  }

  /**
   * Gets the LectureManager instance
   * @returns LectureManager or null if not initialized
   */
  get lectureManager(): LectureManager | null {
    return this._lectureManager;
  }

  /**
   * Checks if managers are initialized
   * @returns True if managers are ready
   */
  isInitialized(): boolean {
    return this._courseManager !== null && this._lectureManager !== null;
  }

  /**
   * Resets all managers (useful for testing or workspace changes)
   */
  reset(): void {
    this._courseManager = null;
    this._lectureManager = null;
    // Stage 2.4: Reset BuildManager
    // this._buildManager = null;
  }
}

/**
 * Singleton instance of ManagersContainer for easy access across the extension
 */
export const managersContainer = new ManagersContainer();
