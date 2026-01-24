'use strict';

import * as vscode from 'vscode';
import { CourseManager } from './managers/CourseManager';
import { EXTENSION_ID, OUTPUT_CHANNEL_NAME } from './constants';

// Create output channel
const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log(`Extension "${EXTENSION_ID}" is now active`);
  context.subscriptions.push(outputChannel);

  // Register sliman.scanCourse command
  const scanCourseCommand = vscode.commands.registerCommand(
    'sliman.scanCourse',
    async () => {
      // Create CourseManager for this command invocation
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        void vscode.window.showErrorMessage('No workspace folder is open');
        return;
      }

      const courseManager = new CourseManager(workspaceFolders[0].uri);
      outputChannel.show();

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
  console.log('Extension "vscode-extension" is now deactivated');
}
