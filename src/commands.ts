'use strict';

import * as vscode from 'vscode';
import { managersContainer } from './managers/ManagersContainer';

let outputChannel: vscode.OutputChannel | null = null;

/**
 * Initialize commands module with output channel reference
 * @param channel - The output channel for logging
 */
export function initializeCommands(channel: vscode.OutputChannel): void {
  outputChannel = channel;
}

/**
 * Command: sliman.createCourse
 * Creates a new course structure with sliman.json, slides.json, and slides/ directory
 */
export async function createCourse(): Promise<void> {
  if (!outputChannel) {
    throw new Error('Commands not initialized');
  }

  outputChannel.appendLine('Command: createCourse - Not yet implemented');
  void vscode.window.showInformationMessage('createCourse: Команда в разработке');
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