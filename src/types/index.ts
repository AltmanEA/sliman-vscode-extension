/**
 * Type definitions for sli.dev Course VS Code Extension
 */

// Re-export Course Explorer types
export type {
  CourseTreeItem,
  LectureTreeItem,
  ActionTreeItem,
  FolderTreeItem,
} from './courseExplorer';

/**
 * Course configuration stored in sliman.json
 */
export interface SlimanConfig {
  course_name: string;
}

/**
 * Individual lecture information
 */
export interface LectureInfo {
  name: string;
  title: string;
}

/**
 * Slides configuration stored in slides.json
 */
export interface SlidesConfig {
  slides: LectureInfo[];
}

/**
 * Combined course data for display purposes
 */
export interface CourseData {
  config: SlimanConfig | null;
  slides: SlidesConfig | null;
}

/**
 * Lecture item for Tree View representation
 */
export interface LectureItem {
  type: 'lecture';
  name: string;
  title: string;
  uri: string;
}

/**
 * Action item for Tree View (commands like add, build, etc.)
 */
export interface ActionItem {
  type: 'action';
  command: string;
  title: string;
  icon?: string;
}

/**
 * Root item for Tree View
 */
export interface CourseRootItem {
  type: 'root';
  courseName: string;
  uri: string;
}