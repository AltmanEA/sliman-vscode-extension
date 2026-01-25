/**
 * Tests for BuildManager - Task 2.4
 * Tests build operations for lectures and courses.
 * 
 * Approach: Stub ProcessHelper.runBuild to verify correct paths are passed.
 * Real VS Code API is used for OutputChannel and Terminal creation.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { BuildManager } from '../../managers/BuildManager';
import { CourseManager } from '../../managers/CourseManager';
import { LectureManager } from '../../managers/LectureManager';
import { ProcessHelper } from '../../utils/process';
import { SLIDES_DIR, BUILT_DIR, SLIMAN_FILENAME, SLIDES_FILENAME } from '../../constants';

// ============================================
// Helper Functions
// ============================================

/** Creates a unique temporary directory for a test */
async function createTestDir(testName: string): Promise<string> {
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const testDir = path.join(__dirname, '..', '..', '..', `test-workspace-build-${testName}-${uniqueId}`);
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

/** Cleans up a test directory */
async function cleanupTestDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup test directory: ${tempDir}`, error);
  }
}

/** Creates a complete course structure for testing */
async function createTestCourse(tempDir: string): Promise<{
  courseManager: CourseManager;
  lectureManager: LectureManager;
}> {
  const uri = vscode.Uri.file(tempDir);
  const courseManager = new CourseManager(uri);
  const lectureManager = new LectureManager(courseManager);
  
  // Create sliman.json
  await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
  
  // Create slides directory
  await fs.mkdir(path.join(tempDir, SLIDES_DIR), { recursive: true });
  
  // Create built directory
  await fs.mkdir(path.join(tempDir, BUILT_DIR), { recursive: true });
  
  // Create slides.json
  await fs.writeFile(path.join(tempDir, BUILT_DIR, SLIDES_FILENAME), JSON.stringify({ slides: [] }), 'utf-8');
  
  return { courseManager, lectureManager };
}

/** Creates a lecture directory structure */
async function createTestLecture(tempDir: string, lectureName: string): Promise<void> {
  const slidesDir = path.join(tempDir, SLIDES_DIR, lectureName);
  await fs.mkdir(slidesDir, { recursive: true });
  await fs.writeFile(path.join(slidesDir, 'slides.md'), '---\ntitle: Test Lecture\n---\n# Content\n', 'utf-8');
  await fs.writeFile(path.join(slidesDir, 'package.json'), JSON.stringify({
    name: `lecture-${lectureName}`,
    scripts: { build: 'echo "Build"' },
  }), 'utf-8');
}

// ============================================
// BuildManager Test Suite
// ============================================

suite('BuildManager Test Suite', () => {
  // ============================================
  // Setup/Teardown
  // ============================================

  // Store original runBuild function
  const originalRunBuild = ProcessHelper.runBuild;

  setup(() => {
    // Reset to original before each test
    ProcessHelper.runBuild = originalRunBuild;
  });

  // ============================================
  // buildLecture Tests
  // ============================================

  suite('buildLecture', () => {
    test('should throw error when lecture does not exist', async () => {
      const tempDir = await createTestDir('buildLecture-not-found');
      try {
        const { courseManager, lectureManager } = await createTestCourse(tempDir);
        const buildManager = new BuildManager(courseManager, lectureManager);

        // ProcessHelper.runBuild should NOT be called
        let runBuildCalled = false;
        ProcessHelper.runBuild = async (_cwd: string, _opts?: { outputChannel?: vscode.OutputChannel }) => {
          runBuildCalled = true;
          return { success: true, stdout: '', stderr: '', exitCode: 0 };
        };

        await assert.rejects(
          async () => buildManager.buildLecture('nonexistent-lecture'),
          /Lecture "nonexistent-lecture" does not exist/
        );
        assert.strictEqual(runBuildCalled, false, 'runBuild should not be called');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should throw error when build fails', async () => {
      const tempDir = await createTestDir('buildLecture-fail');
      try {
        const { courseManager, lectureManager } = await createTestCourse(tempDir);
        await createTestLecture(tempDir, 'test-lecture');
        const buildManager = new BuildManager(courseManager, lectureManager);

        ProcessHelper.runBuild = async (_cwd: string, _opts?: { outputChannel?: vscode.OutputChannel }) => {
          return { success: false, stdout: '', stderr: 'Build failed', exitCode: 1 };
        };

        await assert.rejects(
          async () => buildManager.buildLecture('test-lecture'),
          /Build failed for lecture "test-lecture"/
        );
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should call runBuild with correct lecture path', async () => {
      const tempDir = await createTestDir('buildLecture-success');
      try {
        const { courseManager, lectureManager } = await createTestCourse(tempDir);
        await createTestLecture(tempDir, 'my-lecture');
        const buildManager = new BuildManager(courseManager, lectureManager);

        let capturedCwd = '';
        ProcessHelper.runBuild = async (cwd: string, _opts?: { outputChannel?: vscode.OutputChannel }) => {
          capturedCwd = cwd;
          return { success: true, stdout: 'Build complete', stderr: '', exitCode: 0 };
        };

        await buildManager.buildLecture('my-lecture');

        assert.ok(capturedCwd.includes('my-lecture'), `Should pass lecture path, got: ${capturedCwd}`);
        assert.ok(capturedCwd.includes(SLIDES_DIR), `Should include slides dir, got: ${capturedCwd}`);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  // ============================================
  // buildCourse Tests
  // ============================================

  suite('buildCourse', () => {
    test('should throw error when build fails', async () => {
      const tempDir = await createTestDir('buildCourse-fail');
      try {
        const { courseManager, lectureManager } = await createTestCourse(tempDir);
        const buildManager = new BuildManager(courseManager, lectureManager);

        ProcessHelper.runBuild = async (_cwd: string, _opts?: { outputChannel?: vscode.OutputChannel }) => {
          return { success: false, stdout: '', stderr: 'Course build failed', exitCode: 1 };
        };

        await assert.rejects(
          async () => buildManager.buildCourse(),
          /Course build failed/
        );
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should call runBuild with course root path', async () => {
      const tempDir = await createTestDir('buildCourse-success');
      try {
        const { courseManager, lectureManager } = await createTestCourse(tempDir);
        const buildManager = new BuildManager(courseManager, lectureManager);

        let capturedCwd = '';
        ProcessHelper.runBuild = async (cwd: string, _opts?: { outputChannel?: vscode.OutputChannel }) => {
          capturedCwd = cwd;
          return { success: true, stdout: 'Course built', stderr: '', exitCode: 0 };
        };

        await buildManager.buildCourse();

        assert.strictEqual(capturedCwd, tempDir, `Should pass course root, got: ${capturedCwd}`);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  // ============================================
  // runDevServer Tests
  // ============================================

  suite('runDevServer', () => {
    test('should throw error when lecture does not exist', async () => {
      const tempDir = await createTestDir('runDevServer-not-found');
      try {
        const { courseManager, lectureManager } = await createTestCourse(tempDir);
        const buildManager = new BuildManager(courseManager, lectureManager);

        await assert.rejects(
          async () => buildManager.runDevServer('nonexistent-lecture'),
          /Lecture "nonexistent-lecture" does not exist/
        );
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should not throw error when lecture exists', async () => {
      const tempDir = await createTestDir('runDevServer-exists');
      try {
        const { courseManager, lectureManager } = await createTestCourse(tempDir);
        await createTestLecture(tempDir, 'test-lecture');
        const buildManager = new BuildManager(courseManager, lectureManager);

        // Should not throw - terminal is created successfully
        await buildManager.runDevServer('test-lecture');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  // ============================================
  // Global Cleanup
  // ============================================

  suiteTeardown(async () => {
    // Restore original function
    ProcessHelper.runBuild = originalRunBuild;

    // Clean up any remaining test directories
    const testDir = path.join(__dirname, '..', '..', '..');
    
    try {
      const entries = await fs.readdir(testDir);
      const testWorkspaces = entries.filter(entry => 
        entry.startsWith('test-workspace-build-')
      );
      
      for (const dir of testWorkspaces) {
        try {
          await fs.rm(path.join(testDir, dir), { recursive: true, force: true });
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    } catch (e) {
      // Ignore errors
    }
  });
});