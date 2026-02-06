/**
 * Type definitions for Course Explorer Tree View
 */

import type * as vscode from 'vscode';

/**
 * Unified tree item for Course Explorer
 * Used by TreeDataProvider to render the course structure
 */
export interface CourseTreeItem {
  /** Unique identifier for the tree item */
  id: string;
  /** Display label shown in the tree */
  label: string;
  /** Tree item type: 'root', 'lecture', 'action', 'folder' */
  type: 'root' | 'lecture' | 'action' | 'folder';
  /** VS Code ThemeIcon for the tree item */
  icon?: vscode.ThemeIcon;
  /** Command to execute when item is clicked */
  command?: vscode.Command;
  /** Child items (for root and folder nodes) */
  children?: CourseTreeItem[];
  /** Collapsible state for folders */
  collapsible?: vscode.TreeItemCollapsibleState;
  /** Context value for menu filtering */
  contextValue?: string;
}

/**
 * Specialized lecture tree item with additional properties
 */
export interface LectureTreeItem extends CourseTreeItem {
  type: 'lecture';
  /** Lecture directory name (e.g., 'about', 'mongo') */
  name: string;
  /** Lecture display title (e.g., 'About the Subject') */
  title: string;
}

/**
 * Specialized action tree item with command reference
 */
export interface ActionTreeItem extends CourseTreeItem {
  type: 'action';
  /** VS Code command ID to execute */
  commandId: string;
}

/**
 * Folder tree item for grouping (Lectures, Actions)
 */
export interface FolderTreeItem extends CourseTreeItem {
  type: 'folder';
}