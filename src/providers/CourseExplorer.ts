/**
 * Course Explorer - Tree View Manager
 * 
 * Manages the Course Explorer tree view in VS Code sidebar.
 * Creates and disposes the TreeView, handles refresh operations.
 */

import * as vscode from 'vscode';
import type { CourseTreeItem } from '../types';
import { CourseExplorerDataProvider } from './CourseExplorerDataProvider';
import type { ManagersContainer } from '../managers/ManagersContainer';

/**
 * CourseExplorer manages the Tree View for course structure
 * in the VS Code sidebar activity bar.
 */
export class CourseExplorer {
  /** Tree view instance */
  private _treeView: vscode.TreeView<CourseTreeItem> | null = null;
  
  /** Data provider instance */
  private _dataProvider: CourseExplorerDataProvider | null = null;
  
  /** Extension context for subscriptions */
  private readonly _context: vscode.ExtensionContext;

  /**
   * Creates a new CourseExplorer instance
   * @param context - VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  /**
   * Gets the TreeView instance
   * @returns TreeView or null if not initialized
   */
  get treeView(): vscode.TreeView<CourseTreeItem> | null {
    return this._treeView;
  }

  /**
   * Initializes the Course Explorer tree view
   * Must be called after managers are initialized
   * @param managers - ManagersContainer with initialized managers
   */
  initialize(managers: ManagersContainer): void {
    if (!managers.isInitialized()) {
      console.error('[CourseExplorer] Cannot initialize: managers not ready');
      return;
    }

    const courseManager = managers.courseManager;
    if (!courseManager) {
      console.error('[CourseExplorer] CourseManager not available');
      return;
    }

    // Create data provider
    this._dataProvider = new CourseExplorerDataProvider(courseManager);

    // Create tree view
    this._treeView = vscode.window.createTreeView('courseExplorer', {
      treeDataProvider: this._dataProvider,
      showCollapseAll: true,
    });

    // Register refresh command
    this._context.subscriptions.push(
      vscode.commands.registerCommand('courseExplorer.refresh', () => {
        this.refresh();
      })
    );

    console.log('[CourseExplorer] Tree view initialized');
  }

  /**
   * Refreshes the tree view with current course data
   */
  refresh(): void {
    if (this._dataProvider) {
      this._dataProvider.refresh();
      console.log('[CourseExplorer] Tree view refreshed');
    }
  }

  /**
   * Disposes the tree view and releases resources
   */
  dispose(): void {
    if (this._treeView) {
      this._treeView.dispose();
      this._treeView = null;
    }

    if (this._dataProvider) {
      this._dataProvider.dispose();
      this._dataProvider = null;
    }

    console.log('[CourseExplorer] Disposed');
  }
}