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
 * Individual lecture information
 */
export interface LectureInfo {
  name: string;
  title: string;
}

/**
 * Course configuration stored in dist/slides.json
 * Contains course_name and slides array
 */
export interface SlidesConfig {
  course_name?: string;
  slides: LectureInfo[];
}

/**
 * Combined course data for display purposes
 * course_name is now read from slides.config (dist/slides.json)
 */
export interface CourseData {
  courseName: string | null;
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