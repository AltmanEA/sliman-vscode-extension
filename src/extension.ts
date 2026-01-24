'use strict';

import * as vscode from 'vscode';
import { managersContainer } from './managers/ManagersContainer';
import { EXTENSION_ID, OUTPUT_CHANNEL_NAME } from './constants';

// Create output channel
const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);

/**
 * Initializes managers container with the current workspace
 * @param context - Extension context
 * @returns True if initialization was successful
 */
function initializeManagers(_context: vscode.ExtensionContext): boolean {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    void vscode.window.showErrorMessage('No workspace folder is open');
    return false;
  }

  managersContainer.initialize(workspaceFolders[0].uri);
  return true;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log(`Extension "${EXTENSION_ID}" is now active`);
  context.subscriptions.push(outputChannel);

  // Initialize managers with current workspace
  const initialized = initializeManagers(context);
  if (!initialized) {
    return;
  }

  // Register sliman.scanCourse command
  const scanCourseCommand = vscode.commands.registerCommand(
    'sliman.scanCourse',
    async () => {
      outputChannel.show();

      // Get CourseManager from container
      const courseManager = managersContainer.courseManager;
      if (!courseManager) {
        outputChannel.appendLine('CourseManager not initialized');
        void vscode.window.showErrorMessage('CourseManager not initialized');
        return;
      }

      const isRoot = await courseManager.isCourseRoot();
      outputChannel.appendLine(`Is course root: ${isRoot}`);

      if (isRoot) {
        const slimanConfig = await courseManager.readSliman();
        outputChannel.appendLine(`Course name: ${slimanConfig?.course_name ?? 'N/A'}`);

        const lectures = await courseManager.getLectureDirectories();
        outputChannel.appendLine(`Lectures found: ${lectures.length}`);
        lectures.forEach((name) => outputChannel.appendLine(`  - ${name}`));
      } else {
        outputChannel.appendLine('Workspace is not a valid course root (sliman.json not found)');
        void vscode.window.showWarningMessage('Not a valid course root');
      }

      void vscode.window.showInformationMessage('Course scan complete');
    }
  );

  context.subscriptions.push(scanCourseCommand);
}

export function deactivate(): void {
  console.log(`Extension "${EXTENSION_ID}" is now deactivated`);
  outputChannel.dispose();
}
