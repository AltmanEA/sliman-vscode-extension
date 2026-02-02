'use strict';

import * as vscode from 'vscode';
import { managersContainer } from './managers/ManagersContainer';
import { EXTENSION_ID, OUTPUT_CHANNEL_NAME } from './constants';
import {
  createCourse,
  scanCourse,
  addLecture,
  buildLecture,
  openSlides,
  editLecture,
  deleteLecture,
  viewCourse,
  initializeCommands
} from './commands';

// Create output channel
const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log(`Extension "${EXTENSION_ID}" is now active`);
  context.subscriptions.push(outputChannel);

  // Initialize managers with current workspace
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    void vscode.window.showErrorMessage('No workspace folder is open');
    // Commands are NOT registered - extension stays in idle state
    return;
  } else {
    managersContainer.initialize(workspaceFolders[0].uri, context, context.extensionPath);

    // Initialize Course Explorer tree view
    const courseExplorer = managersContainer.courseExplorer;
    if (courseExplorer) {
      courseExplorer.initialize(managersContainer);
      context.subscriptions.push(courseExplorer);
    }

    // Initialize commands module with output channel and extension path
    initializeCommands(outputChannel, context.extensionPath);

    // Register all commands (only when workspace is valid)
    const commands = [
      vscode.commands.registerCommand('sliman.createCourse', createCourse),
      vscode.commands.registerCommand('sliman.scanCourse', scanCourse),
      vscode.commands.registerCommand('sliman.addLecture', addLecture),
      vscode.commands.registerCommand('sliman.buildLecture', buildLecture),
      vscode.commands.registerCommand('sliman.openSlides', openSlides),
      vscode.commands.registerCommand('sliman.editLecture', editLecture),
      vscode.commands.registerCommand('sliman.deleteLecture', deleteLecture),
      vscode.commands.registerCommand('sliman.viewCourse', viewCourse)
    ];

    context.subscriptions.push(...commands);
  }
}

export function deactivate(): void {
  console.log(`Extension "${EXTENSION_ID}" is now deactivated`);
  managersContainer.courseExplorer?.dispose();
  outputChannel.dispose();
}
