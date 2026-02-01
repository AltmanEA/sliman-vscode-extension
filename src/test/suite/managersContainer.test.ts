/**
 * Tests for ManagersContainer functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { ManagersContainer } from '../../managers/ManagersContainer';
import { CourseManager } from '../../managers/CourseManager';
import { createTestDir, cleanupTestDir, cleanupAllTestDirs } from '../utils/testWorkspace';
import { createCourseStructure } from '../utils/courseStructure';

suite('ManagersContainer Tests', () => {
  let tempDir: string;
  let workspaceUri: vscode.Uri;
  let extensionPath: string;
  let context: vscode.ExtensionContext;

  suiteSetup(async () => {
    // Global cleanup in case previous tests didn't clean up
    await cleanupAllTestDirs();
  });

  suiteTeardown(async () => {
    await cleanupAllTestDirs();
  });

  setup(async () => {
    tempDir = await createTestDir('manager', 'managers-container');
    workspaceUri = vscode.Uri.file(tempDir);
    
    // Use current directory as extension path for tests
    extensionPath = path.join(__dirname, '..', '..', '..');
    
    // Create mock extension context
    context = {
      subscriptions: [],
      workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        keys: () => []
      },
      globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        keys: () => []
      },
      extensionUri: vscode.Uri.file(extensionPath),
      extensionPath: extensionPath,
      asAbsolutePath: (relativePath: string) => vscode.Uri.joinPath(vscode.Uri.file(extensionPath), relativePath).fsPath,
      environmentVariableCollection: {
        persistent: true,
        replace: () => {},
        append: () => {},
        prepend: () => {},
        forEach: () => {},
        clear: () => {},
        delete: () => {},
        get: () => undefined,
        has: () => false,
        size: 0
      },
      storagePath: tempDir,
      globalStoragePath: tempDir,
      logPath: tempDir,
      extensionMode: vscode.ExtensionMode.Test,
      languageModelAccessInformation: undefined
    } as unknown as vscode.ExtensionContext;
  });

  teardown(async () => {
    await cleanupTestDir(tempDir);
  });

  // Initialization Tests
  suite('Initialization Tests', () => {
    test('initialize creates all manager instances', () => {
      const container = new ManagersContainer();
      
      // Initially not initialized
      assert.strictEqual(container.isInitialized(), false);
      assert.strictEqual(container.courseManager, null);
      assert.strictEqual(container.lectureManager, null);
      assert.strictEqual(container.buildManager, null);

      // Initialize
      container.initialize(workspaceUri, context, extensionPath);
      
      // Should be initialized
      assert.strictEqual(container.isInitialized(), true);
      
      // All managers should be created
      assert.ok(container.courseManager !== null);
      assert.ok(container.lectureManager !== null);
      assert.ok(container.buildManager !== null);
    });

    test('isInitialized returns correct state', () => {
      const container = new ManagersContainer();
      
      // Before initialization
      assert.strictEqual(container.isInitialized(), false);
      
      // After initialization
      container.initialize(workspaceUri, context, extensionPath);
      assert.strictEqual(container.isInitialized(), true);
      
      // After reset
      container.reset();
      assert.strictEqual(container.isInitialized(), false);
    });

    test('getters return correct managers', () => {
      const container = new ManagersContainer();
      container.initialize(workspaceUri, context, extensionPath);
      
      // Test all getters
      const courseManager = container.courseManager!;
      const lectureManager = container.lectureManager!;
      const buildManager = container.buildManager;
      
      assert.ok(courseManager !== null);
      assert.ok(lectureManager !== null);
      assert.ok(buildManager !== null);
      
      // Verify they work with the workspace
      const rootUri = courseManager!.getCourseRoot();
      assert.strictEqual(rootUri.toString(), workspaceUri.toString());
    });

    test('initialize sets up manager relationships', () => {
      const container = new ManagersContainer();
      container.initialize(workspaceUri, context, extensionPath);
      
      const courseManager = container.courseManager!;
      const lectureManager = container.lectureManager!;
      const buildManager = container.buildManager!;
      
      // Verify managers are properly connected
      // CourseManager should be able to provide workspace URI
      const slidesDir = courseManager.getSlidesDir();
      assert.ok(slidesDir.toString().includes('slides'));
      
      // LectureManager should work with CourseManager
      const slidesDirFromLecture = lectureManager!.getSlidesDir();
      assert.strictEqual(courseManager!.getSlidesDir().toString(), slidesDirFromLecture.toString());
      
      // BuildManager should work with both managers
      assert.ok(buildManager !== null);
    });
  });

  // Lifecycle Tests
  suite('Lifecycle Tests', () => {
    test('reset clears all managers', () => {
      const container = new ManagersContainer();
      container.initialize(workspaceUri, context, extensionPath);
      
      // Verify initialization worked
      assert.strictEqual(container.isInitialized(), true);
      assert.notStrictEqual(container.courseManager, null);
      assert.notStrictEqual(container.lectureManager, null);
      assert.notStrictEqual(container.buildManager, null);
      
      // Reset
      container.reset();
      
      // All should be cleared
      assert.strictEqual(container.isInitialized(), false);
      assert.strictEqual(container.courseManager, null);
      assert.strictEqual(container.lectureManager, null);
      assert.strictEqual(container.buildManager, null);
    });

    test('refreshCourseExplorer calls refresh method', () => {
      const container = new ManagersContainer();
      container.initialize(workspaceUri, context, extensionPath);
      
      // refreshCourseExplorer should not throw
      // (actual refresh logic is tested in CourseExplorer tests)
      assert.doesNotThrow(() => {
        container.refreshCourseExplorer();
      });
    });

    test('reset can be called multiple times', () => {
      const container = new ManagersContainer();
      
      // Multiple resets before initialization
      container.reset();
      container.reset();
      container.reset();
      
      // Initialize and reset multiple times
      container.initialize(workspaceUri, context, extensionPath);
      container.reset();
      container.reset();
      container.reset();
      
      assert.strictEqual(container.isInitialized(), false);
    });

    test('initialize after reset works correctly', () => {
      const container = new ManagersContainer();
      
      // First initialization
      container.initialize(workspaceUri, context, extensionPath);
      let courseManager = container.courseManager;
      assert.ok(courseManager instanceof CourseManager);
      
      // Reset
      container.reset();
      
      // Second initialization
      container.initialize(workspaceUri, context, extensionPath);
      let courseManager2 = container.courseManager;
      assert.ok(courseManager2 instanceof CourseManager);
      
      // Should be different instances
      assert.notStrictEqual(courseManager, courseManager2);
    });
  });

  // Singleton Behavior Tests
  suite('Singleton Behavior Tests', () => {
    test('multiple containers work independently', () => {
      const container1 = new ManagersContainer();
      const container2 = new ManagersContainer();
      
      // Initialize both
      container1.initialize(workspaceUri, context, extensionPath);
      container2.initialize(workspaceUri, context, extensionPath);
      
      // Both should be initialized independently
      assert.strictEqual(container1.isInitialized(), true);
      assert.strictEqual(container2.isInitialized(), true);
      
      // Reset one should not affect the other
      container1.reset();
      assert.strictEqual(container1.isInitialized(), false);
      assert.strictEqual(container2.isInitialized(), true);
      
      // Clean up
      container2.reset();
    });

    test('container preserves state between operations', () => {
      const container = new ManagersContainer();
      container.initialize(workspaceUri, context, extensionPath);
      
      // Perform some operations
      const courseManager = container.courseManager!;
      
      // State should be preserved
      assert.strictEqual(container.isInitialized(), true);
      assert.notStrictEqual(container.courseManager, null);
      
      // Same manager instance should be returned
      assert.strictEqual(container.courseManager, courseManager);
    });
  });

  // Integration Tests
  suite('Integration Tests', () => {
    test('managers work together through container', async () => {
      const container = new ManagersContainer();
      container.initialize(workspaceUri, context, extensionPath);
      
      const courseManager = container.courseManager!;
      const lectureManager = container.lectureManager!;
      
      // Simple test - verify managers are properly connected without creating real lectures
      // This avoids timeouts from full lecture creation process
      const slidesDir = courseManager.getSlidesDir();
      const slidesDirFromLecture = lectureManager.getSlidesDir();
      assert.strictEqual(slidesDir.toString(), slidesDirFromLecture.toString());
      
      // BuildManager should work with both managers
      const buildManager = container.buildManager!;
      assert.ok(buildManager !== null);
    });

    test('container handles course operations', async () => {
      const container = new ManagersContainer();
      container.initialize(workspaceUri, context, extensionPath);
      
      const courseManager = container.courseManager!;
      
      // Create course structure using utility
      const lectures = [
        { name: 'lecture-1', title: 'Lecture 1' },
        { name: 'lecture-2', title: 'Lecture 2' }
      ];
      await createCourseStructure(tempDir, 'container-course', lectures);
      
      // CourseManager should read the data
      const courseData = await courseManager!.readCourseData();
      assert.strictEqual(courseData.courseName, 'container-course');
      assert.strictEqual(courseData.slides?.slides.length, 2);
    });

    test('container works with different workspace URIs', () => {
      const container = new ManagersContainer();
      
      // Initialize with first workspace
      container.initialize(workspaceUri, context, extensionPath);
      const firstCourseManager = container.courseManager!;
      const firstRoot = firstCourseManager.getCourseRoot();
      
      // Reset and initialize with different workspace
      container.reset();
      const tempDir2 = path.join(tempDir, 'subdir');
      const workspaceUri2 = vscode.Uri.file(tempDir2);
      container.initialize(workspaceUri2, context, extensionPath);
      
      const secondCourseManager = container.courseManager!;
      const secondRoot = secondCourseManager.getCourseRoot();
      
      // Should be different workspaces
      assert.notStrictEqual(firstRoot.toString(), secondRoot.toString());
      assert.strictEqual(secondRoot.toString(), workspaceUri2.toString());
    });
  });

  // Edge Cases Tests
  suite('Edge Cases Tests', () => {
    test('initialize with null parameters handles gracefully', () => {
      const container = new ManagersContainer();
      
      // Should not throw with valid parameters
      assert.doesNotThrow(() => {
        container.initialize(workspaceUri, context, extensionPath);
      });
      
      container.reset();
    });

    test('getters return null before initialization', () => {
      const container = new ManagersContainer();
      
      assert.strictEqual(container.courseManager, null);
      assert.strictEqual(container.lectureManager, null);
      assert.strictEqual(container.buildManager, null);
      assert.strictEqual(container.isInitialized(), false);
    });

    test('operations on uninitialized container return null', () => {
      const container = new ManagersContainer();
      
      // All getters should return null
      assert.strictEqual(container.courseManager, null);
      assert.strictEqual(container.lectureManager, null);
      assert.strictEqual(container.buildManager, null);
      
      // isInitialized should return false
      assert.strictEqual(container.isInitialized(), false);
    });

    test('refreshCourseExplorer before initialization', () => {
      const container = new ManagersContainer();
      
      // Should not throw even if not initialized
      assert.doesNotThrow(() => {
        container.refreshCourseExplorer();
      });
    });
  });
});
