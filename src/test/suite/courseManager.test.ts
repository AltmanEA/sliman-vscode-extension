import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { CourseManager } from '../../managers/CourseManager';
import { SLIDES_DIR, BUILT_DIR } from '../../constants';

suite('CourseManager Test Suite', () => {
  let tempDir: string;
  let workspaceUri: vscode.Uri;
  let courseManager: CourseManager;

  suiteSetup(async () => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, '..', '..', '..', 'test-workspace');
    const fs = await import('fs/promises');
    await fs.mkdir(tempDir, { recursive: true });
    workspaceUri = vscode.Uri.file(tempDir);
  });

  suiteTeardown(async () => {
    // Cleanup temporary directory
    const fs = await import('fs/promises');
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  setup(() => {
    // Create fresh CourseManager instance for each test
    courseManager = new CourseManager(workspaceUri);
  });

  // ============================================
  // Task 1.3.1: Path Resolution Tests
  // ============================================

  suite('Path Resolution', () => {
    test('getCourseRoot returns workspace URI', () => {
      const root = courseManager.getCourseRoot();
      assert.strictEqual(root.fsPath, tempDir);
    });

    test('getSlidesDir returns slides/ directory URI', () => {
      const slidesDir = courseManager.getSlidesDir();
      const expectedPath = path.join(tempDir, SLIDES_DIR);
      assert.strictEqual(slidesDir.fsPath, expectedPath);
    });

    test('getBuiltCourseDir returns built/ directory URI', () => {
      const builtDir = courseManager.getBuiltCourseDir();
      const expectedPath = path.join(tempDir, BUILT_DIR);
      assert.strictEqual(builtDir.fsPath, expectedPath);
    });

    test('isPathInCourseRoot returns true for path inside course root', () => {
      const innerPath = vscode.Uri.file(path.join(tempDir, 'some-file.md'));
      const result = courseManager.isPathInCourseRoot(innerPath);
      assert.strictEqual(result, true);
    });

    test('isPathInCourseRoot returns false for path outside course root', () => {
      const outerPath = vscode.Uri.file(path.join(__dirname, 'outside.md'));
      const result = courseManager.isPathInCourseRoot(outerPath);
      assert.strictEqual(result, false);
    });

    test('isPathInCourseRoot returns true for course root itself', () => {
      const result = courseManager.isPathInCourseRoot(workspaceUri);
      assert.strictEqual(result, true);
    });
  });
});