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
// LectureManager and BuildManager will be added in Stage 2

/**
 * Container for storing and providing access to extension managers
 */
export class ManagersContainer {
  private _courseManager: CourseManager | null = null;
  // Stage 2: Add placeholders for new managers
  // private _lectureManager: LectureManager | null = null;
  // private _buildManager: BuildManager | null = null;

  /**
   * Initializes all managers with the given workspace URI
   * @param workspaceUri - The workspace folder URI
   */
  initialize(workspaceUri: vscode.Uri): void {
    this._courseManager = new CourseManager(workspaceUri);
    // Stage 2: Initialize new managers here
    // this._lectureManager = new LectureManager(workspaceUri, this._courseManager);
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
   * Checks if managers are initialized
   * @returns True if managers are ready
   */
  isInitialized(): boolean {
    return this._courseManager !== null;
  }

  /**
   * Resets all managers (useful for testing or workspace changes)
   */
  reset(): void {
    this._courseManager = null;
    // Stage 2: Reset new managers
    // this._lectureManager = null;
    // this._buildManager = null;
  }
}

/**
 * Singleton instance of ManagersContainer for easy access across the extension
 */
export const managersContainer = new ManagersContainer();
