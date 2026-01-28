'use strict';

/**
 * Unit tests for Commands Module
 * Tests initialization, command registration, and command execution.
 * Uses standard Node.js APIs without external mocking libraries.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

// Import the commands module for testing
import {
  initializeCommands,
  createCourse,
  scanCourse,
  addLecture,
  runLecture,
  buildLecture,
  openSlides,
  buildCourse,
  setupPages
} from '../../commands';

suite('Commands Module', () => {
  // ============================================
  // Initialization Tests
  // ============================================

  suite('initializeCommands', () => {
    test('should accept valid output channel and extension path', () => {
      // Create minimal mock channel
      const mockChannel = {
        name: 'Test',
        appendLine: () => {},
        append: () => {},
        clear: () => {},
        show: () => {},
        hide: () => {},
        dispose: () => {},
        isVisible: false
      } as any;

      // Should not throw
      assert.doesNotThrow(() => {
        initializeCommands(mockChannel, '/mock/extension/path');
      }, 'initializeCommands should accept valid output channel and extension path');
    });
  });

  // ============================================
  // Command Existence Tests
  // ============================================

  suite('Command Functions', () => {
    test('should export createCourse function', () => {
      assert.strictEqual(typeof createCourse, 'function', 'createCourse should be exported as function');
    });

    test('should export scanCourse function', () => {
      assert.strictEqual(typeof scanCourse, 'function', 'scanCourse should be exported as function');
    });

    test('should export addLecture function', () => {
      assert.strictEqual(typeof addLecture, 'function', 'addLecture should be exported as function');
    });

    test('should export runLecture function', () => {
      assert.strictEqual(typeof runLecture, 'function', 'runLecture should be exported as function');
    });

    test('should export buildLecture function', () => {
      assert.strictEqual(typeof buildLecture, 'function', 'buildLecture should be exported as function');
    });

    test('should export openSlides function', () => {
      assert.strictEqual(typeof openSlides, 'function', 'openSlides should be exported as function');
    });

    test('should export buildCourse function', () => {
      assert.strictEqual(typeof buildCourse, 'function', 'buildCourse should be exported as function');
    });

    test('should export setupPages function', () => {
      assert.strictEqual(typeof setupPages, 'function', 'setupPages should be exported as function');
    });

    test('should export initializeCommands function', () => {
      assert.strictEqual(typeof initializeCommands, 'function', 'initializeCommands should be exported as function');
    });
  });

  // ============================================
  // Command Registration in package.json
  // ============================================

  suite('Command Registration in package.json', () => {
    let packageJsonContent: string;
    let packageJson: {
      contributes: {
        commands: Array<{
          command: string;
          title?: string;
          category?: string;
        }>;
      };
    };

    suiteSetup(async () => {
      const extensionPath = path.join(__dirname, '..', '..', '..');
      const packageJsonPath = path.join(extensionPath, 'package.json');
      packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(packageJsonContent);
    });

    test('should have commands array in contributes', () => {
      assert.ok(
        Array.isArray(packageJson.contributes?.commands),
        'contributes.commands should be an array'
      );
    });

    test('should register sliman.createCourse command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.createCourse'
      );
      assert.ok(command, 'sliman.createCourse should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.scanCourse command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.scanCourse'
      );
      assert.ok(command, 'sliman.scanCourse should be registered');
      assert.strictEqual(command.title, 'Scan Course', 'Should have correct title');
    });

    test('should register sliman.addLecture command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.addLecture'
      );
      assert.ok(command, 'sliman.addLecture should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.runLecture command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.runLecture'
      );
      assert.ok(command, 'sliman.runLecture should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.buildLecture command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.buildLecture'
      );
      assert.ok(command, 'sliman.buildLecture should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.openSlides command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.openSlides'
      );
      assert.ok(command, 'sliman.openSlides should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.buildCourse command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.buildCourse'
      );
      assert.ok(command, 'sliman.buildCourse should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.setupPages command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.setupPages'
      );
      assert.ok(command, 'sliman.setupPages should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should have exactly 8 commands registered', () => {
      const commandCount = packageJson.contributes.commands.length;
      assert.strictEqual(commandCount, 8, 'Should have exactly 8 commands registered');
    });
  });

  // ============================================
  // Commands File Structure Tests
  // ============================================

  suite('Commands File Structure', () => {
    let commandsContent: string;

    suiteSetup(async () => {
      // From out/test/suite -> out/test/suite/../../src/commands.ts = src/commands.ts
      const commandsPath = path.join(__dirname, '..', '..', '..', 'src', 'commands.ts');
      commandsContent = await fs.readFile(commandsPath, 'utf-8');
    });

    test('should export initializeCommands', () => {
      assert.ok(
        commandsContent.includes('export function initializeCommands'),
        'Should export initializeCommands function'
      );
    });

    test('should export createCourse', () => {
      assert.ok(
        commandsContent.includes('export async function createCourse'),
        'Should export createCourse function'
      );
    });

    test('should export scanCourse', () => {
      assert.ok(
        commandsContent.includes('export async function scanCourse'),
        'Should export scanCourse function'
      );
    });

    test('should export addLecture', () => {
      assert.ok(
        commandsContent.includes('export async function addLecture'),
        'Should export addLecture function'
      );
    });

    test('should export runLecture', () => {
      assert.ok(
        commandsContent.includes('export async function runLecture'),
        'Should export runLecture function'
      );
    });

    test('should export buildLecture', () => {
      assert.ok(
        commandsContent.includes('export async function buildLecture'),
        'Should export buildLecture function'
      );
    });

    test('should export openSlides', () => {
      assert.ok(
        commandsContent.includes('export async function openSlides'),
        'Should export openSlides function'
      );
    });

    test('should export buildCourse', () => {
      assert.ok(
        commandsContent.includes('export async function buildCourse'),
        'Should export buildCourse function'
      );
    });

    test('should export setupPages', () => {
      assert.ok(
        commandsContent.includes('export async function setupPages'),
        'Should export setupPages function'
      );
    });

    test('should import managersContainer', () => {
      assert.ok(
        commandsContent.includes("managersContainer"),
        'Should import managersContainer'
      );
    });

    test('should define outputChannel variable', () => {
      assert.ok(
        commandsContent.includes('let outputChannel'),
        'Should define outputChannel variable'
      );
    });

    test('should have error handling for uninitialized commands', () => {
      // Check that commands check for outputChannel null
      assert.ok(
        commandsContent.includes("if (!outputChannel)"),
        'Should check for uninitialized outputChannel'
      );
    });
  });

  // ============================================
  // Command Execution Tests
  // ============================================

  suite('Command Execution', () => {
    test('createCourse should not throw', async () => {
      // Create temporary directory for test
      const tempDir = path.join(__dirname, '..', '..', '..', `test-workspace-createCourse-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Initialize with mock channel before execution
      const mockChannel = {
        name: 'Test',
        appendLine: () => {},
        append: () => {},
        clear: () => {},
        show: () => {},
        hide: () => {},
        dispose: () => {},
        isVisible: false
      } as any;
      initializeCommands(mockChannel, path.join(__dirname, '..', '..', '..'));

      // Mock workspaceFolders
      const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        value: [{ uri: vscode.Uri.file(tempDir), name: 'test-workspace' }],
        writable: true
      });

      // Mock UI functions
      const originalShowInputBox = vscode.window.showInputBox;
      const originalShowWorkspaceFolderPick = vscode.window.showWorkspaceFolderPick;
      const originalShowWarningMessage = vscode.window.showWarningMessage;

      vscode.window.showInputBox = async () => 'Test Course';
      vscode.window.showWorkspaceFolderPick = async () => ({
        uri: vscode.Uri.file(tempDir),
        name: 'test-workspace'
      } as vscode.WorkspaceFolder);
      vscode.window.showWarningMessage = async () => 'Create' as any;

      try {
        await createCourse(); // Should not throw

        // Verify course files were created
        const slimanPath = path.join(tempDir, 'sliman.json');
        const slidesJsonPath = path.join(tempDir, 'slides.json');
        const indexPath = path.join(tempDir, 'index.html');
        const slidesDir = path.join(tempDir, 'slides');

        const slimanExists = await fs.stat(slimanPath).then(() => true).catch(() => false);
        const slidesJsonExists = await fs.stat(slidesJsonPath).then(() => true).catch(() => false);
        const indexExists = await fs.stat(indexPath).then(() => true).catch(() => false);
        const slidesDirExists = await fs.stat(slidesDir).then(() => true).catch(() => false);

        assert.strictEqual(slimanExists, true, 'sliman.json should be created');
        assert.strictEqual(slidesJsonExists, true, 'slides.json should be created');
        assert.strictEqual(indexExists, true, 'index.html should be created');
        assert.strictEqual(slidesDirExists, true, 'slides/ directory should be created');
      } finally {
        // Restore original functions
        vscode.window.showInputBox = originalShowInputBox;
        vscode.window.showWorkspaceFolderPick = originalShowWorkspaceFolderPick;
        vscode.window.showWarningMessage = originalShowWarningMessage;

        // Restore workspaceFolders
        if (originalWorkspaceFolders) {
          Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: originalWorkspaceFolders,
            writable: true
          });
        }

        // Cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    test('addLecture should not throw', async () => {
      await addLecture(); // Should not throw
    });

    test('runLecture should not throw', async () => {
      await runLecture(); // Should not throw
    });

    test('buildLecture should not throw', async () => {
      await buildLecture(); // Should not throw
    });

    test('openSlides should not throw', async () => {
      await openSlides(); // Should not throw
    });

    test('buildCourse should not throw', async () => {
      await buildCourse(); // Should not throw
    });

    test('setupPages should not throw', async () => {
      await setupPages(); // Should not throw
    });

    test('scanCourse should not throw in non-course context', async () => {
      await scanCourse(); // Should not throw even when not in course
    });
  });
});