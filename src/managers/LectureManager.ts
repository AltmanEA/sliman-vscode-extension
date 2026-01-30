/**
 * Lecture Manager - Manages lecture structure and creation
 */

import * as vscode from 'vscode';
import {
  LECTURE_SLIDES,
  LECTURE_PACKAGE,
  TEMPLATE_DIR,
  TEMPLATE_SLIDES,
  TEMPLATE_PACKAGE,
} from '../constants';
import { ProcessHelper } from '../utils/process';
import { generateLectureFolderName, isValidFolderName } from '../utils/translit';
import type { CourseManager } from './CourseManager';

/**
 * Lecture Manager handles lecture directory operations
 * and provides URI helpers for lecture file navigation.
 */
export class LectureManager {
  /** Course Manager instance for shared operations */
  private readonly courseManager: CourseManager;

  /** Extension root path for accessing bundled templates */
  private readonly extensionPath: string;

  /** Optional output channel for logging */
  private outputChannel: vscode.OutputChannel | null = null;

  /**
   * Creates a new LectureManager instance
   * @param courseManager - Course Manager instance (provides workspace URI)
   * @param extensionPath - Path to the extension root directory
   */
  constructor(courseManager: CourseManager, extensionPath: string) {
    this.courseManager = courseManager;
    this.extensionPath = extensionPath;
  }

  /**
   * Sets the output channel for logging
   * @param channel - VS Code output channel
   */
  setOutputChannel(channel: vscode.OutputChannel): void {
    this.outputChannel = channel;
  }

  /**
   * Logs a message to the output channel if available
   * @param message - Message to log
   */
  private log(message: string): void {
    if (this.outputChannel) {
      this.outputChannel.appendLine(message);
    }
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

  // ============================================
  // Subtask 2.3: Template Methods
  // ============================================

  /**
   * Gets the URI of a template file
   * @param templateName - The template filename (from TEMPLATE_* constants)
   * @returns The URI of the template file
   */
  private getTemplatePath(templateName: string): vscode.Uri {
    return vscode.Uri.joinPath(vscode.Uri.file(this.extensionPath), TEMPLATE_DIR, templateName);
  }

  /**
   * Reads template content as string
   * @param templateName - The template filename
   * @returns Promise resolving to template content
   * @throws Error if template cannot be read
   */
  private async readTemplate(templateName: string): Promise<string> {
    const templateUri = this.getTemplatePath(templateName);
    try {
      const content = await vscode.workspace.fs.readFile(templateUri);
      return new TextDecoder().decode(content);
    } catch {
      throw new Error(`Failed to read template: ${templateName}`);
    }
  }

  /**
   * Validates lecture name and returns the folder name
   * If name is empty or invalid, generates from title using transliteration
   * @param name - User-provided lecture name (may be empty)
   * @param title - User-provided lecture title
   * @returns Valid folder name
   * @throws Error if name cannot be generated
   */
  private validateAndGetFolderName(name: string, title: string): string {
    // If name is provided and valid, use it
    if (name && isValidFolderName(name)) {
      return name;
    }

    // Generate from title
    if (title) {
      return generateLectureFolderName(title);
    }

    // Fallback to timestamp-based name
    return `lecture-${Date.now()}`;
  }

  /**
   * Copies and updates the slides.md template for a new lecture
   * @param name - Lecture folder name
   * @param title - Lecture display title
   * @returns Promise that resolves when complete
   * @throws Error if template copy fails
   */
  async copySlidesTemplate(name: string, title: string): Promise<void> {
    const templateContent = await this.readTemplate(TEMPLATE_SLIDES);

    // Replace template variables
    const updatedContent = templateContent
      .replace(/{{TITLE}}/g, title)
      .replace(/{{NAME}}/g, name);

    const slidesPath = this.getLectureSlidesPath(name);
    try {
      await vscode.workspace.fs.writeFile(slidesPath, new TextEncoder().encode(updatedContent));
    } catch {
      throw new Error(`Failed to write slides.md for lecture: ${name}`);
    }
  }

  /**
   * Copies and updates the package.json template for a new lecture
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   * @throws Error if template copy fails
   */
  async copyPackageJson(name: string): Promise<void> {
    const templateContent = await this.readTemplate(TEMPLATE_PACKAGE);

    // Replace template variable for lecture-specific package name
    const updatedContent = templateContent
      .replace(/{{LECTURE_NAME}}/g, name);

    const packagePath = this.getLecturePackagePath(name);
    try {
      await vscode.workspace.fs.writeFile(packagePath, new TextEncoder().encode(updatedContent));
    } catch {
      throw new Error(`Failed to write package.json for lecture: ${name}`);
    }
  }

  /**
   * Initializes npm dependencies for a lecture
   * Runs pnpm install in the lecture directory (with npm fallback)
   * Shows the process in a visible terminal
   * @param name - Lecture folder name
   * @returns Promise that resolves when dependencies are installed
   * @throws Error if package manager install fails
   */
  async initLectureNpm(name: string): Promise<void> {
    const lecturePath = this.getLectureDir(name).fsPath;
    const lectureName = name;

    // Try pnpm first, then fallback to npm
    let installCommand = 'pnpm install';
    let packageManager = 'pnpm';

    // Check if pnpm is available
    let pnpmCheck = await ProcessHelper.exec('pnpm --version', { cwd: lecturePath, timeout: 10000 });
    if (!pnpmCheck.success) {
      this.log('pnpm not found, using npm instead');
      installCommand = 'npm install';
      packageManager = 'npm';
    }

    this.log(`Installing dependencies (${packageManager}) in: ${lecturePath}`);

    // Create a terminal for the install process
    const terminal = vscode.window.createTerminal(`Install ${lectureName}`);
    
    // Send the install command (use ; for PowerShell compatibility)
    terminal.sendText(`cd "${lecturePath}"; ${installCommand}`);
    terminal.show();

    this.log(`Terminal opened. Please check the terminal for installation progress.`);
  }

  /**
   * Updates the course configuration (slides.json) with new lecture entry
   * @param name - Lecture folder name
   * @param title - Lecture display title
   * @returns Promise that resolves when complete
   * @throws Error if config update fails
   */
  async updateCourseConfig(name: string, title: string): Promise<void> {
    try {
      await this.courseManager.addLecture(name, title);
    } catch {
      throw new Error(`Failed to update course config for lecture: ${name}`);
    }
  }

  /**
   * Reads the title from a lecture's slides.md file
   * Parses the frontmatter to extract the title field
   * @param name - Lecture folder name
   * @returns Promise resolving to the title from slides.md
   * @throws Error if slides.md cannot be read or title is not found
   */
  async readTitleFromSlides(name: string): Promise<string> {
    const slidesPath = this.getLectureSlidesPath(name);
    
    try {
      const content = await vscode.workspace.fs.readFile(slidesPath);
      const slidesContent = new TextDecoder().decode(content);
      
      // Extract title from frontmatter (YAML block between ---)
      const frontmatterMatch = slidesContent.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        throw new Error('No frontmatter found in slides.md');
      }
      
      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
      if (!titleMatch) {
        throw new Error('No title field found in frontmatter');
      }
      
      return titleMatch[1].trim();
    } catch (error) {
      throw new Error(`Failed to read title from slides.md for lecture "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a complete new lecture with all required files
   * Creates directory, copies templates, installs dependencies, updates config
   * @param nameOrTitle - Lecture folder name OR display title (if title not provided separately)
   * @param title - Optional: lecture display title (if not in nameOrTitle)
   * @returns Promise resolving to the created lecture folder name
   * @throws Error if lecture already exists or creation fails
   */
  async createLecture(nameOrTitle: string, title?: string): Promise<string> {
    // Parse arguments: if title not provided, nameOrTitle is treated as title
    const name = this.validateAndGetFolderName(nameOrTitle, title || nameOrTitle);
    const displayTitle = title || nameOrTitle;

    this.log(`Creating lecture: ${displayTitle} (${name})`);

    // Check if lecture already exists
    if (await this.lectureExists(name)) {
      throw new Error(`Lecture "${name}" already exists`);
    }

    // Step 1: Create lecture directory
    this.log('Creating directory...');
    await this.createLectureDir(name);
    this.log('Directory created.');

    // Step 2: Copy and update slides.md template
    this.log('Copying slides template...');
    await this.copySlidesTemplate(name, displayTitle);
    this.log('Slides template copied.');

    // Step 3: Copy and update package.json template
    this.log('Copying package.json...');
    await this.copyPackageJson(name);
    this.log('Package.json copied.');

    // Step 4: Initialize npm dependencies
    this.log('Installing dependencies (pnpm install)...');
    await this.initLectureNpm(name);

    // Step 5: Update course configuration
    this.log('Updating course configuration...');
    await this.updateCourseConfig(name, displayTitle);

    this.log(`Lecture "${displayTitle}" created successfully!`);

    return name;
  }

  /**
   * Deletes a lecture completely
   * Removes lecture directory from slides/ and built/ directories
   * Updates slides.json to remove lecture entry
   * @param name - Lecture folder name
   * @returns Promise that resolves when lecture is deleted
   * @throws Error if lecture doesn't exist or deletion fails
   */
  async deleteLecture(name: string): Promise<void> {
    this.log(`Deleting lecture: ${name}`);

    // Check if lecture exists
    if (!await this.lectureExists(name)) {
      throw new Error(`Lecture "${name}" does not exist`);
    }

    // Step 1: Remove lecture directory from slides/
    const lectureDir = this.getLectureDir(name);
    try {
      await vscode.workspace.fs.delete(lectureDir, { recursive: true, useTrash: false });
      this.log(`Removed lecture directory: ${lectureDir.fsPath}`);
    } catch (error) {
      throw new Error(`Failed to remove lecture directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 2: Remove built lecture from dist/ (if exists)
    const builtLectureDir = vscode.Uri.joinPath(this.courseManager.getBuiltCourseDir(), name);
    try {
      const stat = await vscode.workspace.fs.stat(builtLectureDir);
      if (stat.type === vscode.FileType.Directory) {
        await vscode.workspace.fs.delete(builtLectureDir, { recursive: true, useTrash: false });
        this.log(`Removed built lecture directory: ${builtLectureDir.fsPath}`);
      }
    } catch {
      // Built directory doesn't exist, that's fine
      this.log(`Built lecture directory not found (normal if lecture wasn't built): ${builtLectureDir.fsPath}`);
    }

    // Step 3: Update course configuration (remove from slides.json)
    try {
      await this.courseManager.removeLecture(name);
      this.log(`Removed lecture from slides.json: ${name}`);
    } catch (error) {
      this.log(`Warning: Failed to remove lecture from slides.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw here, lecture directory is already deleted
    }

    this.log(`Lecture "${name}" deleted successfully!`);
  }
}