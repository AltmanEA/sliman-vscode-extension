/**
 * Course Explorer Data Provider
 * 
 * Implements vscode.TreeDataProvider for Course Explorer tree view.
 * Provides course structure data and handles tree item rendering.
 * 
 * IMPORTANT: All tree items MUST have a valid string 'id' property.
 */

import * as vscode from 'vscode';
import type { CourseTreeItem } from '../types';
import type { CourseManager } from '../managers/CourseManager';

/**
 * CourseExplorerDataProvider provides data for the Course Explorer tree view.
 * It reads course structure from CourseManager and converts it to tree items.
 */
export class CourseExplorerDataProvider implements vscode.TreeDataProvider<CourseTreeItem> {
  /** Event emitter for tree data changes */
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<CourseTreeItem | undefined>();
  
  /** Event that fires when tree data changes */
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  /** Course manager instance for reading course data */
  private readonly courseManager: CourseManager;

  /**
   * Creates a new CourseExplorerDataProvider instance
   * @param courseManager - CourseManager instance for data access
   */
  constructor(courseManager: CourseManager) {
    this.courseManager = courseManager;
  }

  /**
   * Gets the TreeItem representation of a tree item
   * @param element - The tree item to get representation for
   * @returns vscode.TreeItem for rendering
   */
  getTreeItem(element: CourseTreeItem): vscode.TreeItem {
    // Ensure id is a valid string (required by VS Code)
    const id = typeof element.id === 'string' ? element.id : `item-${Date.now()}`;
    
    const treeItem = new vscode.TreeItem(
      element.label,
      element.collapsible ?? vscode.TreeItemCollapsibleState.None
    );

    treeItem.id = id;
    treeItem.iconPath = element.icon ? this.getIcon(element.icon) : undefined;
    treeItem.command = element.command ?? undefined;
    treeItem.contextValue = element.contextValue;

    return treeItem;
  }

  /**
   * Gets the children of a tree item
   * @param element - Optional parent element to get children for
   * @returns Promise resolving to array of child tree items
   */
  async getChildren(element?: CourseTreeItem): Promise<CourseTreeItem[]> {
    // No course manager - return empty
    if (!this.courseManager) {
      return [];
    }

    // Root element - check if course exists and return appropriate items
    if (!element) {
      // Check if course is initialized (sliman.json exists)
      const isCourseRoot = await this.courseManager.isCourseRoot();

      if (!isCourseRoot) {
        // No course - show "Create Course" action
        return [this.buildCreateCourseItem()];
      }

      // Course exists - return folder structure
      return this.buildFolderItems();
    }

    // Lectures folder - return lecture items
    if (element.id === 'lectures-folder') {
      return this.buildLectureItems();
    }

    // Actions folder - return action items
    if (element.id === 'actions-folder') {
      return this.buildActionItems();
    }

    // Lecture item - return lecture commands (View, Edit, Build)
    if (element.id.startsWith('lecture-') && !element.id.startsWith('lecture-actions-')) {
      const lectureName = element.id.replace('lecture-', '');
      return this.buildLectureCommands(lectureName);
    }

    return [];
  }

  /**
   * Gets the parent of a tree item
   * @param element - The tree item to get parent for
   * @returns Promise resolving to parent or undefined
   */
  getParent(element: CourseTreeItem): vscode.ProviderResult<CourseTreeItem> {
    // Guard: ensure element has valid id
    if (typeof element.id !== 'string') {
      return undefined;
    }

    // Define parent-child relationships
    const isChildOfRoot = element.id === 'lectures-folder' || element.id === 'actions-folder';
    const isLectureCommand = element.id.startsWith('lecture-command-');
    const isLecture = element.id.startsWith('lecture-') && !element.id.startsWith('lecture-command-');
    const isAction = element.id.startsWith('action-') && !element.id.startsWith('lecture-command-');

    if (isChildOfRoot) {
      // Return root item
      return this.buildRootItem();
    }

    if (isLectureCommand) {
      // Return lecture item (parent is the lecture)
      // Extract lecture name from lecture-command-view-about -> about
      const lectureName = element.id.replace('lecture-command-view-', '').replace('lecture-command-edit-', '').replace('lecture-command-build-', '');
      const lectureId = `lecture-${lectureName}`;
      // Build lecture item directly instead of calling buildLectureItem
      return Promise.resolve({
        id: lectureId,
        label: `${lectureName}`,
        type: 'lecture',
        icon: '$(file-code)',
        collapsible: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: 'lecture',
      });
    }

    if (isLecture) {
      // Return lectures folder
      return Promise.resolve(this.buildLecturesFolderItem());
    }

    if (isAction) {
      // Return actions folder
      return Promise.resolve(this.buildActionsFolderItem());
    }

    return undefined;
  }

  /**
   * Refreshes the tree view by firing change event
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Disposes the data provider and releases resources
   */
  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  // ============================================
  // Private Builder Methods - All return valid items
  // ============================================

  /**
   * Builds folder items (Lectures and Actions)
   * @returns Array with two folder items
   */
  private async buildFolderItems(): Promise<CourseTreeItem[]> {
    return [
      this.buildLecturesFolderItem(),
      this.buildActionsFolderItem(),
    ];
  }

  /**
   * Builds the "Create Course" item for empty workspace
   * @returns CourseTreeItem for creating a new course
   */
  private buildCreateCourseItem(): CourseTreeItem {
    const command: vscode.Command = {
      command: 'sliman.createCourse',
      title: 'Create Course',
    };

    return {
      id: 'create-course',
      label: 'Create Course',
      type: 'action',
      icon: '$(add)',
      command,
      contextValue: 'create-course',
    };
  }

  /**
   * Builds the root course item
   * @returns Always returns valid CourseTreeItem
   */
  private async buildRootItem(): Promise<CourseTreeItem> {
    const courseName = await this.courseManager.readCourseName() ?? 'No Course';

    return {
      id: 'course-root',
      label: courseName,
      type: 'root',
      icon: '$(remote)',
      collapsible: vscode.TreeItemCollapsibleState.Expanded,
      contextValue: 'course-root',
    };
  }

  /**
   * Builds the Lectures folder item
   * @returns Always returns valid CourseTreeItem
   */
  private buildLecturesFolderItem(): CourseTreeItem {
    return {
      id: 'lectures-folder',
      label: 'Lectures',
      type: 'folder',
      icon: '$(files)',
      collapsible: vscode.TreeItemCollapsibleState.Collapsed,
      contextValue: 'lectures-folder',
    };
  }

  /**
   * Builds the Actions folder item
   * @returns Always returns valid CourseTreeItem
   */
  private buildActionsFolderItem(): CourseTreeItem {
    return {
      id: 'actions-folder',
      label: 'Actions',
      type: 'action',
      icon: '$(gear)',
      collapsible: vscode.TreeItemCollapsibleState.Collapsed,
      contextValue: 'actions-folder',
    };
  }

  /**
   * Builds lecture items from slides.json
   * @returns Array of lecture tree items
   */
  private async buildLectureItems(): Promise<CourseTreeItem[]> {
    const slidesConfig = await this.courseManager.readSlidesJson();
    const lectures = slidesConfig?.slides ?? [];

    return lectures.map((lecture): CourseTreeItem => {
      return {
        id: `lecture-${lecture.name}`,
        label: `${lecture.title} (${lecture.name})`,
        type: 'lecture',
        icon: '$(file-code)',
        collapsible: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: 'lecture',
      };
    });
  }

  /**
   * Builds command items for a lecture (View, Edit, Build, Delete)
   * @param lectureName - Lecture folder name
   * @returns Array with View, Edit, Build, and Delete action items
   */
  private buildLectureCommands(lectureName: string): CourseTreeItem[] {
    // View command - only opens slides.md
    const viewCommand: vscode.Command = {
      command: 'sliman.openSlides',
      title: 'View',
      arguments: [lectureName],
    };

    // Edit command - opens slides.md AND runs dev server
    const editCommand: vscode.Command = {
      command: 'sliman.editLecture',
      title: 'Edit',
      arguments: [lectureName],
    };

    // Build command - builds lecture to static files
    const buildCommand: vscode.Command = {
      command: 'sliman.buildLecture',
      title: 'Build',
      arguments: [lectureName],
    };

    // Delete command - deletes lecture with confirmation
    const deleteCommand: vscode.Command = {
      command: 'sliman.deleteLecture',
      title: 'Delete',
      arguments: [lectureName],
    };

    return [
      {
        id: `lecture-command-view-${lectureName}`,
        label: 'View',
        type: 'action',
        icon: '$(eye)',
        command: viewCommand,
        contextValue: 'lecture-view-command',
      },
      {
        id: `lecture-command-edit-${lectureName}`,
        label: 'Edit',
        type: 'action',
        icon: '$(edit)',
        command: editCommand,
        contextValue: 'lecture-edit-command',
      },
      {
        id: `lecture-command-build-${lectureName}`,
        label: 'Build',
        type: 'action',
        icon: '$(tools)',
        command: buildCommand,
        contextValue: 'lecture-build-command',
      },
      {
        id: `lecture-command-delete-${lectureName}`,
        label: 'Delete',
        type: 'action',
        icon: '$(trash)',
        command: deleteCommand,
        contextValue: 'lecture-delete-command',
      },
    ];
  }

  /**
   * Builds action items (Add Lecture, Build course, Setup GitHub Pages, View Course)
   * @returns Array of action tree items
   */
  private buildActionItems(): CourseTreeItem[] {
    const actions: Array<{ id: string; label: string; icon: string; commandId: string }> = [
      { id: 'action-add-lecture', label: 'Add Lecture', icon: '$(add)', commandId: 'sliman.addLecture' },
      { id: 'action-build-course', label: 'Build course', icon: '$(tools)', commandId: 'sliman.buildCourse' },
      { id: 'action-setup-pages', label: 'Setup GitHub Pages', icon: '$(cloud)', commandId: 'sliman.setupPages' },
      { id: 'action-view-course', label: 'View Course', icon: '$(globe)', commandId: 'sliman.viewCourse' },
    ];

    return actions.map((action): CourseTreeItem => {
      const command: vscode.Command = {
        command: action.commandId,
        title: action.label,
      };

      return {
        id: action.id,
        label: action.label,
        type: 'action',
        icon: action.icon,
        command,
        contextValue: 'action',
      };
    });
  }

  /**
   * Converts a codicon name to an icon path
   * @param codicon - Codicon name (e.g., '$(file-code)')
   * @returns ThemeIcon for the codicon
   */
  private getIcon(codicon: string): vscode.ThemeIcon | undefined {
    if (codicon.startsWith('$(') && codicon.endsWith(')')) {
      const iconId = codicon.slice(2, -1);
      return new vscode.ThemeIcon(iconId);
    }
    return undefined;
  }
}