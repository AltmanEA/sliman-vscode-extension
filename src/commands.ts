'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { managersContainer } from './managers/ManagersContainer';
import { generateLectureFolderName, isValidFolderName } from './utils/translit';

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
 * Creates a new course structure with sliman.json (course_name) and {course_name}/slides.json (slides)
 */
export async function createCourse(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine('Command: createCourse - Starting...');
  channel.show();

  // Step 1: Get workspace folder first (needed for context)
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    channel.appendLine('Error: No workspace folder is open');
    void vscode.window.showErrorMessage('Please open a folder first');
    return;
  }

  // Step 2: Get course name (use setTimeout to let Tree View release focus)
  const courseName = await new Promise<string | undefined>((resolve) => {
    setTimeout(() => {
      void vscode.window.showInputBox({
        prompt: 'Enter course name',
        placeHolder: 'e.g., Introduction to TypeScript',
        ignoreFocusOut: false,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Course name cannot be empty';
          }
          if (value.length > 100) {
            return 'Course name must be 100 characters or less';
          }
          return null;
        }
      }).then(resolve);
    }, 100);
  });

  if (!courseName) {
    channel.appendLine('Command cancelled: No course name provided');
    return;
  }

  channel.appendLine(`Course name: ${courseName}`);

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

    // Create sliman.json in course root with course_name
    const slimanContent = JSON.stringify({ course_name: courseName }, null, 2);
    const slimanPath = path.join(coursePath, 'sliman.json');
    await fs.writeFile(slimanPath, slimanContent);
    channel.appendLine(`Created file: ${slimanPath}`);

    // Create slides/ directory
    const slidesDir = path.join(coursePath, 'slides');
    await fs.mkdir(slidesDir, { recursive: true });
    channel.appendLine(`Created directory: ${slidesDir}`);

    // Create {courseName}/ directory for built course
    const courseDir = path.join(coursePath, courseName);
    await fs.mkdir(courseDir, { recursive: true });
    channel.appendLine(`Created directory: ${courseDir}`);

    // Create {courseName}/slides.json with slides array only
    const slidesContent = JSON.stringify({ slides: [] }, null, 2);
    const slidesJsonPath = path.join(coursePath, courseName, 'slides.json');
    await fs.writeFile(slidesJsonPath, slidesContent);
    channel.appendLine(`Created file: ${slidesJsonPath}`);

    // Copy index.html template to {courseName}/
    const templateIndexPath = path.join(extensionPath, 'template', 'index.html');
    const indexDestPath = path.join(coursePath, courseName, 'index.html');

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

    // Refresh Course Explorer tree view
    managersContainer.refreshCourseExplorer();

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
    const courseName = await courseManager.readCourseName();
    channel.appendLine(`Course name: ${courseName ?? 'N/A'}`);

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

  const channel = outputChannel;
  channel.appendLine('Command: addLecture');
  channel.show();

  // Get managers
  const courseManager = managersContainer.courseManager;
  const lectureManager = managersContainer.lectureManager;

  if (!courseManager || !lectureManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  const courseRoot = courseManager.getCourseRoot();
  channel.appendLine(`Course root: ${courseRoot.fsPath}`);

  // Step 2: Get lecture title from user
  const title = await vscode.window.showInputBox({
    prompt: 'Enter lecture title',
    placeHolder: 'e.g., Introduction to React',
    ignoreFocusOut: false,
    validateInput: (value) => {
      if (!value || value.trim().length < 3) {
        return 'Title must be at least 3 characters';
      }
      if (value.length > 200) {
        return 'Title is too long (max 200 characters)';
      }
      return null;
    }
  });

  if (!title) {
    channel.appendLine('Lecture creation cancelled (no title)');
    return;
  }

  channel.appendLine(`Lecture title: ${title}`);

  // Step 3: Generate and suggest folder name
  const suggestedFolderName = generateLectureFolderName(title);
  const defaultFolderName = suggestedFolderName;

  // Step 4: Let user confirm or edit folder name
  const folderName = await vscode.window.showInputBox({
    prompt: 'Enter lecture folder name',
    value: defaultFolderName,
    ignoreFocusOut: false,
    validateInput: (value) => {
      if (!value || value.trim().length < 1) {
        return 'Folder name is required';
      }
      if (!isValidFolderName(value)) {
        return 'Invalid folder name. Use only Latin letters, numbers, and hyphens';
      }
      return null;
    }
  });

  if (!folderName) {
    channel.appendLine('Lecture creation cancelled (no folder name)');
    return;
  }

  channel.appendLine(`Folder name: ${folderName}`);

  // Step 5: Confirm creation
  const confirm = await vscode.window.showInformationMessage(
    `Create lecture "${title}" (${folderName})?`,
    { modal: true },
    'Create', 'Cancel'
  );

  if (confirm !== 'Create') {
    channel.appendLine('Lecture creation cancelled by user');
    return;
  }

  // Step 6: Create lecture
  try {
    // Set output channel for lecture manager logging
    lectureManager.setOutputChannel(outputChannel);
    
    channel.appendLine('Creating lecture...');
    await lectureManager.createLecture(folderName, title);
    channel.appendLine(`Lecture "${title}" created successfully!`);
    void vscode.window.showInformationMessage(`Lecture "${title}" created!`);

    // Refresh Course Explorer tree view
    managersContainer.refreshCourseExplorer();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    channel.appendLine(`Error creating lecture: ${errorMessage}`);
    void vscode.window.showErrorMessage(`Failed to create lecture: ${errorMessage}`);
  }
}

/**
 * Command: sliman.runLecture
 * Launches sli.dev dev server for lecture editing
 * @param name - Lecture folder name (passed from Tree View)
 */
export async function runLecture(name: string): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine('Command: runLecture');
  channel.show();

  const courseManager = managersContainer.courseManager;
  const lectureManager = managersContainer.lectureManager;
  const buildManager = managersContainer.buildManager;

  if (!courseManager || !lectureManager || !buildManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  const courseRoot = courseManager.getCourseRoot();
  channel.appendLine(`Course root: ${courseRoot.fsPath}`);

  // Step 2: Get list of lectures (for logging only)
  channel.appendLine('Getting lecture list...');
  const lectures = await courseManager.getLectureDirectories();
  channel.appendLine(`Found ${lectures.length} lectures`);
  channel.appendLine('Lectures found:');
  lectures.forEach((lecture) => channel.appendLine(`  - ${lecture}`));

  // Step 3: Check if lecture exists
  channel.appendLine(`Checking lecture: ${name}`);
  const lectureExists = await lectureManager.lectureExists(name);
  if (!lectureExists) {
    channel.appendLine(`Lecture "${name}" does not exist`);
    void vscode.window.showErrorMessage(`Lecture "${name}" does not exist`);
    return;
  }
  channel.appendLine(`Lecture "${name}" exists`);

  // Step 4: Run dev server
  channel.appendLine(`Starting dev server for "${name}"...`);
  await buildManager.runDevServer(name);
  channel.appendLine('Dev server started');

  // Step 5: Open browser (disabled - slidev opens browser automatically)
  // channel.appendLine('Opening browser...');
  // void vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
  // channel.appendLine('Browser opened');
}

/**
 * Command: sliman.buildLecture
 * Compiles lecture to static HTML
 * @param name - Lecture folder name (passed from Tree View)
 */
export async function buildLecture(name: string): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine(`Command: buildLecture: ${name}`);
  channel.show();

  const courseManager = managersContainer.courseManager;
  const lectureManager = managersContainer.lectureManager;
  const buildManager = managersContainer.buildManager;

  if (!courseManager || !lectureManager || !buildManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  const courseRoot = courseManager.getCourseRoot();
  channel.appendLine(`Course root: ${courseRoot.fsPath}`);

  // Step 2: Build the lecture
  channel.appendLine(`Building lecture: ${name}`);
  try {
    await buildManager.buildLecture(name);
    channel.appendLine('Build completed successfully');
    void vscode.window.showInformationMessage('Build completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    channel.appendLine(`Build failed: ${errorMessage}`);
    void vscode.window.showErrorMessage(`Build failed: ${errorMessage}`);
  }
}

/**
 * Command: sliman.openSlides
 * Opens slides.md file for current or selected lecture
 * @param name - Lecture folder name (passed from Tree View)
 */
export async function openSlides(name: string): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine(`Command: openSlides: ${name}`);
  channel.show();

  const courseManager = managersContainer.courseManager;
  const lectureManager = managersContainer.lectureManager;

  if (!courseManager || !lectureManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  // Step 2: Get path to slides.md
  const slidesPath = lectureManager.getLectureSlidesPath(name);
  channel.appendLine(`Opening: ${slidesPath.fsPath}`);

  // Step 3: Open file in editor
  try {
    await vscode.window.showTextDocument(slidesPath);
    channel.appendLine('File opened successfully');
  } catch {
    channel.appendLine(`File not found: ${slidesPath.fsPath}`);
    void vscode.window.showErrorMessage(`slides.md not found for lecture "${name}"`);
  }
}

/**
 * Command: sliman.editLecture
 * Opens slides.md file AND launches dev server for lecture editing
 * @param name - Lecture folder name (passed from Tree View)
 */
export async function editLecture(name: string): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine(`Command: editLecture: ${name}`);
  channel.show();

  const courseManager = managersContainer.courseManager;
  const lectureManager = managersContainer.lectureManager;
  const buildManager = managersContainer.buildManager;

  if (!courseManager || !lectureManager || !buildManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  // Step 2: Check if lecture exists
  channel.appendLine(`Checking lecture: ${name}`);
  const lectureExists = await lectureManager.lectureExists(name);
  if (!lectureExists) {
    channel.appendLine(`Lecture "${name}" does not exist`);
    void vscode.window.showErrorMessage(`Lecture "${name}" does not exist`);
    return;
  }
  channel.appendLine(`Lecture "${name}" exists`);

  // Step 3: Open slides.md file
  const slidesPath = lectureManager.getLectureSlidesPath(name);
  channel.appendLine(`Opening: ${slidesPath.fsPath}`);
  try {
    await vscode.window.showTextDocument(slidesPath);
    channel.appendLine('slides.md opened successfully');
  } catch {
    channel.appendLine(`File not found: ${slidesPath.fsPath}`);
    void vscode.window.showErrorMessage(`slides.md not found for lecture "${name}"`);
    return;
  }

  // Step 4: Run dev server
  channel.appendLine(`Starting dev server for "${name}"...`);
  await buildManager.runDevServer(name);
  channel.appendLine('Dev server started');
}

/**
 * Command: sliman.deleteLecture
 * Deletes a lecture with confirmation dialog
 * @param name - Lecture folder name (passed from Tree View)
 */
export async function deleteLecture(name: string): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine(`Command: deleteLecture: ${name}`);
  channel.show();

  const courseManager = managersContainer.courseManager;
  const lectureManager = managersContainer.lectureManager;

  if (!courseManager || !lectureManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  // Step 2: Check if lecture exists
  channel.appendLine(`Checking lecture: ${name}`);
  const lectureExists = await lectureManager.lectureExists(name);
  if (!lectureExists) {
    channel.appendLine(`Lecture "${name}" does not exist`);
    void vscode.window.showErrorMessage(`Lecture "${name}" does not exist`);
    return;
  }
  channel.appendLine(`Lecture "${name}" exists`);

  // Step 3: Get lecture title for confirmation dialog
  let lectureTitle = name;
  try {
    lectureTitle = await lectureManager.readTitleFromSlides(name);
  } catch {
    // If we can't read the title, use the folder name
    channel.appendLine(`Warning: Could not read lecture title, using folder name`);
  }

  // Step 4: Ask for confirmation
  const confirm = await vscode.window.showWarningMessage(
    `Are you sure you want to delete lecture "${lectureTitle}" (${name})? This action cannot be undone.`,
    { modal: true },
    'Delete', 'Cancel'
  );

  if (confirm !== 'Delete') {
    channel.appendLine('Lecture deletion cancelled by user');
    return;
  }

  // Step 5: Delete the lecture
  channel.appendLine(`Deleting lecture: ${name}`);
  try {
    await lectureManager.deleteLecture(name);
    channel.appendLine('Lecture deleted successfully');
    void vscode.window.showInformationMessage(`Lecture "${lectureTitle}" deleted`);

    // Refresh Course Explorer tree view
    managersContainer.refreshCourseExplorer();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    channel.appendLine(`Failed to delete lecture: ${errorMessage}`);
    void vscode.window.showErrorMessage(`Failed to delete lecture: ${errorMessage}`);
  }
}

/**
 * Command: sliman.buildCourse
 * Builds entire course to static site
 */
export async function buildCourse(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine('Command: buildCourse');
  channel.show();

  const courseManager = managersContainer.courseManager;
  const buildManager = managersContainer.buildManager;

  if (!courseManager || !buildManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  const courseRoot = courseManager.getCourseRoot();
  channel.appendLine(`Course root: ${courseRoot.fsPath}`);

  // Step 2: Check if there are any lectures
  channel.appendLine('Getting lecture list...');
  const lectures = await courseManager.getLectureDirectories();
  channel.appendLine(`Found ${lectures.length} lectures`);

  if (lectures.length === 0) {
    channel.appendLine('No lectures found in course');
    void vscode.window.showWarningMessage('No lectures found in course. Add a lecture first.');
    return;
  }

  channel.appendLine('Lectures found:');
  lectures.forEach((lecture) => channel.appendLine(`  - ${lecture}`));

  // Step 3: Build the course
  channel.appendLine('Building course...');
  try {
    await buildManager.buildCourse();
    channel.appendLine('Course build completed');
    void vscode.window.showInformationMessage('Course built successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    channel.appendLine(`Build failed: ${errorMessage}`);
    void vscode.window.showErrorMessage(`Build failed: ${errorMessage}`);
  }
}

/**
 * Command: sliman.setupPages
 * Configures GitHub Actions workflow for Pages deployment
 */
export async function setupPages(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine('Command: setupPages');
  channel.show();

  const courseManager = managersContainer.courseManager;

  if (!courseManager) {
    channel.appendLine('Managers not initialized');
    void vscode.window.showErrorMessage('Managers not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  const courseRoot = courseManager.getCourseRoot();
  channel.appendLine(`Course root: ${courseRoot.fsPath}`);

  // Step 2: Create GitHub Actions workflow
  channel.appendLine('Setting up GitHub Pages...');

  try {
    // Create .github/workflows directory
    const workflowsDir = vscode.Uri.joinPath(courseRoot, '.github', 'workflows');
    await vscode.workspace.fs.createDirectory(workflowsDir);
    channel.appendLine('Created .github/workflows directory');

    // Copy static.yml template
    const templateUri = vscode.Uri.joinPath(
      vscode.Uri.file(extensionPath),
      'template',
      'static.yml'
    );
    const staticYmlUri = vscode.Uri.joinPath(workflowsDir, 'static.yml');

    const templateContent = await vscode.workspace.fs.readFile(templateUri);
    await vscode.workspace.fs.writeFile(staticYmlUri, templateContent);
    channel.appendLine('Created .github/workflows/static.yml');

    // Show instructions
    channel.appendLine('GitHub Pages setup complete');
    void vscode.window.showInformationMessage(
      'GitHub Pages workflow created! Push to GitHub and enable Pages in repository settings.'
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    channel.appendLine(`Setup failed: ${errorMessage}`);
    void vscode.window.showErrorMessage(`Setup failed: ${errorMessage}`);
  }
}

/**
 * Command: sliman.viewCourse
 * Starts HTTP server for viewing built course in browser
 * Launches npx http-server {course_name}/ and opens browser
 */
export async function viewCourse(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  const channel = outputChannel;
  channel.appendLine('Command: viewCourse');
  channel.show();

  const courseManager = managersContainer.courseManager;

  if (!courseManager) {
    channel.appendLine('CourseManager not initialized');
    void vscode.window.showErrorMessage('CourseManager not initialized');
    return;
  }

  // Step 1: Check if we're in a course root
  const isRoot = await courseManager.isCourseRoot();
  if (!isRoot) {
    channel.appendLine('Not in a course root directory');
    void vscode.window.showErrorMessage('Not a valid course root. Please open a directory with sliman.json');
    return;
  }

  const courseRoot = courseManager.getCourseRoot();
  channel.appendLine(`Course root: ${courseRoot.fsPath}`);

  // Step 2: Get course name
  const courseName = await courseManager.readCourseName();
  if (!courseName) {
    channel.appendLine('Course name not found in sliman.json');
    void vscode.window.showErrorMessage('Course name not found in sliman.json');
    return;
  }
  channel.appendLine(`Course name: ${courseName}`);

  // Step 3: Check if built course exists
  const builtIndexPath = vscode.Uri.joinPath(courseRoot, courseName, 'index.html');
  channel.appendLine(`Checking for built course: ${builtIndexPath.fsPath}`);

  try {
    await vscode.workspace.fs.stat(builtIndexPath);
    channel.appendLine('Built course found');
  } catch {
    channel.appendLine('Built course not found');
    void vscode.window.showWarningMessage('Built course not found. The course may not be built yet.');
  }

  // Step 4: Create terminal and start HTTP server
  const terminal = vscode.window.createTerminal('sli.dev Course Viewer');
  const command = `npx http-server "${courseName}" -p 8080`;
  channel.appendLine(`Starting HTTP server: ${command}`);
  
  terminal.sendText(command);
  terminal.show();

  // Step 5: Open browser
  const browserUrl = 'http://localhost:8080';
  channel.appendLine(`Opening browser: ${browserUrl}`);
  void vscode.env.openExternal(vscode.Uri.parse(browserUrl));
  
  channel.appendLine('HTTP server started in terminal. Close terminal to stop the server.');
  void vscode.window.showInformationMessage('Course viewer started! Browser opened to http://localhost:8080');
}