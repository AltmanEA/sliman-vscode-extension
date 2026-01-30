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
import { createTestDir } from '../utils/testWorkspace';

// Import the commands module for testing
import {
  initializeCommands,
  createCourse,
  scanCourse,
  addLecture,
  runLecture,
  buildLecture,
  openSlides,
  editLecture,
  deleteLecture,
  buildCourse,
  setupPages,
  viewCourse
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
      } as unknown as vscode.OutputChannel;

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

    test('should export editLecture function', () => {
      assert.strictEqual(typeof editLecture, 'function', 'editLecture should be exported as function');
    });

    test('should export deleteLecture function', () => {
      assert.strictEqual(typeof deleteLecture, 'function', 'deleteLecture should be exported as function');
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

    test('should register sliman.editLecture command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.editLecture'
      );
      assert.ok(command, 'sliman.editLecture should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.deleteLecture command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.deleteLecture'
      );
      assert.ok(command, 'sliman.deleteLecture should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should register sliman.viewCourse command', () => {
      const command = packageJson.contributes.commands.find(
        (c) => c.command === 'sliman.viewCourse'
      );
      assert.ok(command, 'sliman.viewCourse should be registered');
      assert.strictEqual(command.category, 'sli.dev Course', 'Should have correct category');
    });

    test('should have exactly 12 commands registered', () => {
      const commandCount = packageJson.contributes.commands.length;
      assert.strictEqual(commandCount, 12, 'Should have exactly 12 commands registered');
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

    test('should export editLecture', () => {
      assert.ok(
        commandsContent.includes('export async function editLecture'),
        'Should export editLecture function'
      );
    });

    test('should export deleteLecture', () => {
      assert.ok(
        commandsContent.includes('export async function deleteLecture'),
        'Should export deleteLecture function'
      );
    });

    test('should export viewCourse', () => {
      assert.ok(
        commandsContent.includes('export async function viewCourse'),
        'Should export viewCourse function'
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
      const tempDir = await createTestDir('commands', 'createCourse');
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
      } as unknown as vscode.OutputChannel;
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
      } as unknown as vscode.WorkspaceFolder);
      vscode.window.showWarningMessage = async () => 'Create' as unknown as string;

      try {
        await createCourse(); // Should not throw

        // Verify course files were created
        const slimanJsonPath = path.join(tempDir, 'sliman.json');
        const slidesJsonPath = path.join(tempDir, 'Test Course', 'slides.json');
        const indexPath = path.join(tempDir, 'Test Course', 'index.html');
        const slidesDir = path.join(tempDir, 'slides');

        const slimanJsonExists = await fs.stat(slimanJsonPath).then(() => true).catch(() => false);
        const slidesJsonExists = await fs.stat(slidesJsonPath).then(() => true).catch(() => false);
        const indexExists = await fs.stat(indexPath).then(() => true).catch(() => false);
        const slidesDirExists = await fs.stat(slidesDir).then(() => true).catch(() => false);

        assert.strictEqual(slimanJsonExists, true, 'sliman.json should be created');
        assert.strictEqual(slidesJsonExists, true, 'Test Course/slides.json should be created');
        assert.strictEqual(indexExists, true, 'index.html should be created in Test Course/');
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
      // Create temporary directory with course structure (sliman.json and Test Course/slides.json)
      const tempDir = await createTestDir('commands', 'addLecture');
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, 'sliman.json'), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'Test Course', 'slides.json'), JSON.stringify({ slides: [] }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'slides'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'template'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'template', 'slides.md'), '---\ntitle: {{TITLE}}\n---\n', 'utf-8');
      await fs.writeFile(path.join(tempDir, 'template', 'package.json'), '{"name": "{{LECTURE_NAME}}"}', 'utf-8');

      // Initialize with mock channel
      const mockChannel = {
        name: 'Test',
        appendLine: () => {},
        append: () => {},
        clear: () => {},
        show: () => {},
        hide: () => {},
        dispose: () => {},
        isVisible: false
      } as unknown as vscode.OutputChannel;
      initializeCommands(mockChannel, path.join(__dirname, '..', '..', '..'));

      // Mock managers by directly setting private properties
      const { managersContainer } = await import('../../managers/ManagersContainer');
      const mockCourseManager = {
        isCourseRoot: async () => true,
        getCourseRoot: () => vscode.Uri.file(tempDir),
        isPathInCourseRoot: () => true
      };
      const mockLectureManager = {
        createLecture: async () => 'test-lecture'
      };

      // Store originals
      const originalCourseManager = (managersContainer as unknown as { _courseManager: unknown })._courseManager;
      const originalLectureManager = (managersContainer as unknown as { _lectureManager: unknown })._lectureManager;

      // Set mocks directly
      (managersContainer as unknown as { _courseManager: unknown })._courseManager = mockCourseManager;
      (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = mockLectureManager;

      // Mock UI functions
      const originalShowInputBox = vscode.window.showInputBox;
      const originalShowInformationMessage = vscode.window.showInformationMessage;

      vscode.window.showInputBox = async () => 'Test Lecture';
      vscode.window.showInformationMessage = async () => 'Create' as unknown as string;

      try {
        await addLecture(); // Should not throw
      } finally {
        // Restore original functions
        vscode.window.showInputBox = originalShowInputBox;
        vscode.window.showInformationMessage = originalShowInformationMessage;

        // Restore originals
        (managersContainer as unknown as { _courseManager: unknown })._courseManager = originalCourseManager;
        (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = originalLectureManager;

        // Cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    test('runLecture should not throw', async () => {
      // Create temporary directory with course structure
      const tempDir = await createTestDir('commands', 'runLecture');
      await fs.mkdir(path.join(tempDir, 'slides'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'sliman.json'), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'Test Course', 'slides.json'), JSON.stringify({ slides: [] }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'slides', 'test-lecture'), { recursive: true });

      // Initialize with mock channel
      const mockChannel = {
        name: 'Test',
        appendLine: () => {},
        append: () => {},
        clear: () => {},
        show: () => {},
        hide: () => {},
        dispose: () => {},
        isVisible: false
      } as unknown as vscode.OutputChannel;
      initializeCommands(mockChannel, path.join(__dirname, '..', '..', '..'));

      // Mock managers
      const { managersContainer } = await import('../../managers/ManagersContainer');
      const mockCourseManager = {
        isCourseRoot: async () => true,
        getCourseRoot: () => vscode.Uri.file(tempDir),
        getLectureDirectories: async () => ['test-lecture']
      };
      const mockLectureManager = {
        lectureExists: async () => true
      };
      const mockBuildManager = {
        runDevServer: async () => {}
      };

      // Store originals
      const originalCourseManager = (managersContainer as unknown as { _courseManager: unknown })._courseManager;
      const originalLectureManager = (managersContainer as unknown as { _lectureManager: unknown })._lectureManager;
      const originalBuildManager = (managersContainer as unknown as { _buildManager: unknown })._buildManager;

      // Set mocks
      (managersContainer as unknown as { _courseManager: unknown })._courseManager = mockCourseManager;
      (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = mockLectureManager;
      (managersContainer as unknown as { _buildManager: unknown })._buildManager = mockBuildManager;

      // Mock UI functions
      const originalOpenExternal = vscode.env.openExternal;
      vscode.env.openExternal = async () => true;

      try {
        await runLecture('test-lecture'); // Should not throw
      } finally {
        // Restore
        vscode.env.openExternal = originalOpenExternal;
        (managersContainer as unknown as { _courseManager: unknown })._courseManager = originalCourseManager;
        (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = originalLectureManager;
        (managersContainer as unknown as { _buildManager: unknown })._buildManager = originalBuildManager;
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    test('buildLecture should not throw', async () => {
      // Create temporary directory with course structure
      const tempDir = await createTestDir('commands', 'buildLecture');
      await fs.mkdir(path.join(tempDir, 'slides'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'sliman.json'), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'Test Course', 'slides.json'), JSON.stringify({ slides: [] }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'slides', 'test-lecture'), { recursive: true });

      // Initialize with mock channel
      const mockChannel = {
        name: 'Test',
        appendLine: () => {},
        append: () => {},
        clear: () => {},
        show: () => {},
        hide: () => {},
        dispose: () => {},
        isVisible: false
      } as unknown as vscode.OutputChannel;
      initializeCommands(mockChannel, path.join(__dirname, '..', '..', '..'));

      // Mock managers
      const { managersContainer } = await import('../../managers/ManagersContainer');
      const mockCourseManager = {
        isCourseRoot: async () => true,
        getCourseRoot: () => vscode.Uri.file(tempDir),
        getLectureDirectories: async () => ['test-lecture']
      };
      const mockLectureManager = {
        lectureExists: async () => true
      };
      const mockBuildManager = {
        buildLecture: async () => {}
      };

      // Store originals
      const originalCourseManager = (managersContainer as unknown as { _courseManager: unknown })._courseManager;
      const originalLectureManager = (managersContainer as unknown as { _lectureManager: unknown })._lectureManager;
      const originalBuildManager = (managersContainer as unknown as { _buildManager: unknown })._buildManager;

      // Set mocks
      (managersContainer as unknown as { _courseManager: unknown })._courseManager = mockCourseManager;
      (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = mockLectureManager;
      (managersContainer as unknown as { _buildManager: unknown })._buildManager = mockBuildManager;

      try {
        await buildLecture('test-lecture'); // Should not throw
      } finally {
        // Restore
        (managersContainer as unknown as { _courseManager: unknown })._courseManager = originalCourseManager;
        (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = originalLectureManager;
        (managersContainer as unknown as { _buildManager: unknown })._buildManager = originalBuildManager;
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    test('openSlides should not throw', async () => {
      // Create temporary directory with course structure
      const tempDir = await createTestDir('commands', 'openSlides');
      await fs.mkdir(path.join(tempDir, 'slides'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'sliman.json'), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'Test Course', 'slides.json'), JSON.stringify({ slides: [] }), 'utf-8');
      await fs.mkdir(path.join(tempDir, 'slides', 'test-lecture'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'slides', 'test-lecture', 'slides.md'), '# Test Slides\n', 'utf-8');

      // Initialize with mock channel
      const mockChannel = {
        name: 'Test',
        appendLine: () => {},
        append: () => {},
        clear: () => {},
        show: () => {},
        hide: () => {},
        dispose: () => {},
        isVisible: false
      } as unknown as vscode.OutputChannel;
      initializeCommands(mockChannel, path.join(__dirname, '..', '..', '..'));

      // Mock managers
      const { managersContainer } = await import('../../managers/ManagersContainer');
      const mockCourseManager = {
        isCourseRoot: async () => true,
        getCourseRoot: () => vscode.Uri.file(tempDir)
      };
      const mockLectureManager = {
        getLectureSlidesPath: () => vscode.Uri.file(path.join(tempDir, 'slides', 'test-lecture', 'slides.md'))
      };

      // Store originals
      const originalCourseManager = (managersContainer as unknown as { _courseManager: unknown })._courseManager;
      const originalLectureManager = (managersContainer as unknown as { _lectureManager: unknown })._lectureManager;

      // Set mocks
      (managersContainer as unknown as { _courseManager: unknown })._courseManager = mockCourseManager;
      (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = mockLectureManager;

      // Mock showTextDocument
      const originalShowTextDocument = vscode.window.showTextDocument;
      vscode.window.showTextDocument = async (_documentOrUri: vscode.TextDocument | vscode.Uri) => {
        return {} as vscode.TextEditor;
      };

      try {
        await openSlides('test-lecture'); // Should not throw
      } finally {
        // Restore
        vscode.window.showTextDocument = originalShowTextDocument;
        (managersContainer as unknown as { _courseManager: unknown })._courseManager = originalCourseManager;
        (managersContainer as unknown as { _lectureManager: unknown })._lectureManager = originalLectureManager;
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    test('buildCourse should not throw', async () => {
      await buildCourse(); // Should not throw
    });

    test('setupPages should not throw', async () => {
      await setupPages(); // Should not throw
    });

    test('editLecture should not throw', async () => {
      await editLecture('test'); // Should not throw
    });

    test('deleteLecture should not throw', async () => {
      await deleteLecture('test'); // Should not throw
    });

    test('viewCourse should not throw', async () => {
      await viewCourse(); // Should not throw
    });

    test('scanCourse should not throw in non-course context', async () => {
      await scanCourse(); // Should not throw even when not in course
    });
  });
});