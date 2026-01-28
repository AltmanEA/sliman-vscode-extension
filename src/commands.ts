'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { managersContainer } from './managers/ManagersContainer';

let outputChannel: vscode.OutputChannel | null = null;
let extensionPath: string = '';

/**
 * Initialize commands module with output channel and extension path
 * @param channel - The output channel for logging
 * @param extPath - The extension's root path for accessing bundled templates
 */
export function initializeCommands(channel: vscode.OutputChannel, extPath: string): void {
  outputChannel = channel;
  extensionPath = extPath;
}

/**
 * Command: sliman.createCourse
 * Creates a new course structure with sliman.json, slides.json, and slides/ directory
 */
export async function createCourse(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine('Command: createCourse - Starting...');
  channel.show();

  // Step 1: Get course name
  const courseName = await vscode.window.showInputBox({
    prompt: 'Enter course name',
    placeHolder: 'e.g., Introduction to TypeScript',
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Course name cannot be empty';
      }
      if (value.length > 100) {
        return 'Course name must be 100 characters or less';
      }
      return null;
    }
  });

  if (!courseName) {
    channel.appendLine('Command cancelled: No course name provided');
    return;
  }

  channel.appendLine(`Course name: ${courseName}`);

  // Step 2: Get workspace folder
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    channel.appendLine('Error: No workspace folder is open');
    void vscode.window.showErrorMessage('No workspace folder is open');
    return;
  }

  let selectedFolder: vscode.WorkspaceFolder;

  if (workspaceFolders.length === 1) {
    selectedFolder = workspaceFolders[0];
    channel.appendLine(`Using workspace: ${selectedFolder.uri.fsPath}`);
  } else {
    const selected = await vscode.window.showWorkspaceFolderPick({
      placeHolder: 'Select workspace folder for the course'
    });

    if (!selected) {
      channel.appendLine('Command cancelled: No workspace folder selected');
      return;
    }

    selectedFolder = selected;
    channel.appendLine(`Selected workspace: ${selectedFolder.uri.fsPath}`);
  }

  // Step 3: Confirm creation
  const confirm = await vscode.window.showWarningMessage(
    `Create course "${courseName}" in "${selectedFolder.uri.fsPath}"?`,
    { modal: true },
    'Create', 'Cancel'
  );

  if (confirm !== 'Create') {
    channel.appendLine('Command cancelled: User declined creation');
    return;
  }

  const coursePath = selectedFolder.uri.fsPath;

  try {
    // Step 4: Create course structure
    channel.appendLine('Creating course structure...');

    // Create slides/ directory
    const slidesDir = path.join(coursePath, 'slides');
    await fs.mkdir(slidesDir, { recursive: true });
    channel.appendLine(`Created directory: ${slidesDir}`);

    // Create sliman.json
    const slimanContent = JSON.stringify({ course_name: courseName }, null, 2);
    const slimanPath = path.join(coursePath, 'sliman.json');
    await fs.writeFile(slimanPath, slimanContent);
    channel.appendLine(`Created file: ${slimanPath}`);

    // Create slides.json
    const slidesContent = JSON.stringify({ slides: [] }, null, 2);
    const slidesJsonPath = path.join(coursePath, 'slides.json');
    await fs.writeFile(slidesJsonPath, slidesContent);
    channel.appendLine(`Created file: ${slidesJsonPath}`);

    // Copy index.html template
    const templateIndexPath = path.join(extensionPath, 'template', 'index.html');
    const indexDestPath = path.join(coursePath, 'index.html');

    try {
      let indexContent = await fs.readFile(templateIndexPath, 'utf-8');
      // Update course name in index.html if needed
      await fs.writeFile(indexDestPath, indexContent);
      channel.appendLine(`Copied template: ${templateIndexPath} -> ${indexDestPath}`);
    } catch (templateError) {
      channel.appendLine(`Warning: Could not copy index.html template: ${templateError}`);
    }

    channel.appendLine('Course created successfully!');
    void vscode.window.showInformationMessage(`Course "${courseName}" created!`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    channel.appendLine(`Error creating course: ${errorMessage}`);
    void vscode.window.showErrorMessage(`Failed to create course: ${errorMessage}`);
  }
}

/**
 * Command: sliman.scanCourse
 * Scans the course and displays information: course name, list of lectures
 */
export async function scanCourse(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.show();

  const courseManager = managersContainer.courseManager;
  if (!courseManager) {
    channel.appendLine('CourseManager not initialized');
    void vscode.window.showErrorMessage('CourseManager not initialized');
    return;
  }

  const isRoot = await courseManager.isCourseRoot();
  channel.appendLine(`Is course root: ${isRoot}`);

  if (isRoot) {
    const slimanConfig = await courseManager.readSliman();
    channel.appendLine(`Course name: ${slimanConfig?.course_name ?? 'N/A'}`);

    const lectures = await courseManager.getLectureDirectories();
    channel.appendLine(`Lectures found: ${lectures.length}`);
    lectures.forEach((name) => channel.appendLine(`  - ${name}`));
  } else {
    channel.appendLine('Workspace is not a valid course root (sliman.json not found)');
    void vscode.window.showWarningMessage('Not a valid course root');
  }

  void vscode.window.showInformationMessage('Course scan complete');
}

/**
 * Command: sliman.addLecture
 * Adds a new lecture with sli.dev structure (slides/, slides.md, package.json)
 */
export async function addLecture(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  outputChannel.appendLine('Command: addLecture - Not yet implemented');
  void vscode.window.showInformationMessage('addLecture: Команда в разработке');
}

/**
 * Command: sliman.runLecture
 * Launches sli.dev dev server for lecture editing
 */
export async function runLecture(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  outputChannel.appendLine('Command: runLecture - Not yet implemented');
  void vscode.window.showInformationMessage('runLecture: Команда в разработке');
}

/**
 * Command: sliman.buildLecture
 * Compiles lecture to static HTML
 */
export async function buildLecture(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  outputChannel.appendLine('Command: buildLecture - Not yet implemented');
  void vscode.window.showInformationMessage('buildLecture: Команда в разработке');
}

/**
 * Command: sliman.openSlides
 * Opens slides.md file for current or selected lecture
 */
export async function openSlides(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  outputChannel.appendLine('Command: openSlides - Not yet implemented');
  void vscode.window.showInformationMessage('openSlides: Команда в разработке');
}

/**
 * Command: sliman.buildCourse
 * Builds entire course to static site
 */
export async function buildCourse(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  outputChannel.appendLine('Command: buildCourse - Not yet implemented');
  void vscode.window.showInformationMessage('buildCourse: Команда в разработке');
}

/**
 * Command: sliman.setupPages
 * Configures GitHub Actions workflow for Pages deployment
 */
export async function setupPages(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  outputChannel.appendLine('Command: setupPages - Not yet implemented');
  void vscode.window.showInformationMessage('setupPages: Команда в разработке');
}