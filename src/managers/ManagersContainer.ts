/**
 * Managers Container - Central storage for all extension managers
 * 
 * Provides singleton access to managers throughout the extension lifecycle.
 * Managers are initialized once during extension activation and reused across commands.
 * 
 * Stage 2: Includes CourseManager, LectureManager, and BuildManager
 * Stage 4: Includes CourseExplorer
 */

import type * as vscode from 'vscode';
import { CourseManager } from './CourseManager';
import { LectureManager } from './LectureManager';
import { BuildManager } from './BuildManager';
import { CourseExplorer } from '../providers/CourseExplorer';

/**
 * Container for storing and providing access to extension managers
 */
export class ManagersContainer {
  private _courseManager: CourseManager | null = null;
  private _lectureManager: LectureManager | null = null;
  private _buildManager: BuildManager | null = null;
  private _courseExplorer: CourseExplorer | null = null;

  /**
   * Initializes all managers with the given workspace URI
   * @param workspaceUri - The workspace folder URI
   * @param context - VS Code extension context (for CourseExplorer)
   * @param extensionPath - Path to the extension root directory
   */
  initialize(workspaceUri: vscode.Uri, context: vscode.ExtensionContext, extensionPath: string): void {
    this._courseManager = new CourseManager(workspaceUri);
    this._lectureManager = new LectureManager(this._courseManager, extensionPath);
    this._buildManager = new BuildManager(this._courseManager, this._lectureManager);
    this._courseExplorer = new CourseExplorer(context);
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
   * Gets the BuildManager instance
   * @returns BuildManager or null if not initialized
   */
  get buildManager(): BuildManager | null {
    return this._buildManager;
  }

  /**
   * Gets the CourseExplorer instance
   * @returns CourseExplorer or null if not initialized
   */
  get courseExplorer(): CourseExplorer | null {
    return this._courseExplorer;
  }

  /**
   * Checks if managers are initialized
   * @returns True if managers are ready
   */
  isInitialized(): boolean {
    return this._courseManager !== null && 
           this._lectureManager !== null && 
           this._buildManager !== null;
  }

  /**
   * Refreshes the Course Explorer tree view
   */
  refreshCourseExplorer(): void {
    this._courseExplorer?.refresh();
  }

  /**
   * Resets all managers (useful for testing or workspace changes)
   */
  reset(): void {
    this._courseManager = null;
    this._lectureManager = null;
    this._buildManager = null;
    this._courseExplorer = null;
  }
}

/**
 * Singleton instance of ManagersContainer for easy access across the extension
 */
export const managersContainer = new ManagersContainer();
