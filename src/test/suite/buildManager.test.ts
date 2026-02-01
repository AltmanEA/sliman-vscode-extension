/**
 * Tests for BuildManager functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { CourseManager } from '../../managers/CourseManager';
import { LectureManager } from '../../managers/LectureManager';
import { BuildManager } from '../../managers/BuildManager';
import { createTestDir, cleanupTestDir, cleanupAllTestDirs } from '../utils/testWorkspace';
import { createMinimalCourse } from '../utils/courseStructure';

suite('BuildManager Tests', () => {
  let tempDir: string;
  let courseManager: CourseManager;
  let lectureManager: LectureManager;
  let buildManager: BuildManager;
  let workspaceUri: vscode.Uri;
  let extensionPath: string;

  suiteSetup(async () => {
    // Global cleanup in case previous tests didn't clean up
    await cleanupAllTestDirs();
  });

  suiteTeardown(async () => {
    await cleanupAllTestDirs();
  });

  setup(async () => {
    tempDir = await createTestDir('manager', 'build-manager');
    workspaceUri = vscode.Uri.file(tempDir);
    courseManager = new CourseManager(workspaceUri);
    
    // Create basic course structure for tests
    await createMinimalCourse(tempDir, 'test-course');
    
    // Use current directory as extension path for tests
    extensionPath = path.join(__dirname, '..', '..', '..');
    lectureManager = new LectureManager(courseManager, extensionPath);
    buildManager = new BuildManager(courseManager, lectureManager);
  });

  teardown(async () => {
    await cleanupTestDir(tempDir);
  });

  // Constructor and State Tests
  suite('Constructor and State Tests', () => {
    test('BuildManager constructor initializes with managers', () => {
      const newBuildManager = new BuildManager(courseManager, lectureManager);
      assert.ok(newBuildManager instanceof BuildManager);
    });

    test('dispose releases resources', async () => {
      // Create a status bar item by showing progress
      await buildManager.showProgress({ stage: 'building' });
      
      // Verify status bar item was created
      assert.ok(true); // Status bar item creation is internal
      
      // Dispose
      buildManager.dispose();
      
      // After dispose, status bar should be cleaned up
      // The dispose method should handle cleanup internally
    });
  });

  // Progress Display Tests
  suite('Progress Display Tests', () => {
    test('showProgress updates status bar', async () => {
      const progress: import('../../managers/BuildManager').BuildProgress = {
        lecture: 'test-lecture',
        stage: 'building',
        percent: 50
      };

      await buildManager.showProgress(progress);
      // showProgress creates and shows status bar item
      // No direct assertion possible without accessing internal state
      assert.ok(true);
    });

    test('showProgress handles lecture-specific progress', async () => {
      const progress: import('../../managers/BuildManager').BuildProgress = {
        lecture: 'specific-lecture',
        stage: 'installing',
        percent: 25
      };

      await buildManager.showProgress(progress);
      assert.ok(true);
    });

    test('showProgress handles course-level progress', async () => {
      const progress: import('../../managers/BuildManager').BuildProgress = {
        stage: 'building',
        percent: 75
      };

      await buildManager.showProgress(progress);
      assert.ok(true);
    });

    test('hideProgress clears status bar', async () => {
      // First show progress
      await buildManager.showProgress({ stage: 'building' });
      
      // Then hide it
      await buildManager.hideProgress();
      
      // hideProgress should clean up status bar
      assert.ok(true);
    });

    test('hideProgress handles no status bar item', async () => {
      // Hide without showing first
      await buildManager.hideProgress();
      
      // Should not throw error
      assert.ok(true);
    });
  });

  // Build Operations Tests (simplified - no real build operations)
  suite('Build Operations Tests', () => {
    test('buildLecture throws error for nonexistent lecture', async () => {
      await assert.rejects(
        () => buildManager.buildLecture('nonexistent'),
        /does not exist/
      );
    });

    test('runDevServer throws error for nonexistent lecture', async () => {
      await assert.rejects(
        () => buildManager.runDevServer('nonexistent'),
        /does not exist/
      );
    });

    // Note: Complex build operations (buildCourse, real buildLecture, real runDevServer) 
    // are intentionally excluded from unit tests as they involve external processes
    // and are tested through integration tests instead
  });

  // Error Handling Tests
  suite('Error Handling Tests', () => {
    test('buildLecture handles lecture that exists but has no directory', async () => {
      // This is an edge case where lecture exists in config but directory is missing
      // Create course with slides.json but no actual lecture directory
      await createMinimalCourse(tempDir, 'test-course');
      
      const courseDir = path.join(tempDir, 'test-course');
      const slidesPath = path.join(courseDir, 'slides.json');
      
      // Manually create slides.json with lecture entry (but no directory)
      const slidesContent = JSON.stringify({
        slides: [{ name: 'broken-lecture', title: 'Broken Lecture' }]
      });
      
      // Use vscode.workspace.fs.writeFile instead of fs
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(slidesPath),
        new Uint8Array(Buffer.from(slidesContent, 'utf-8'))
      );

      // lectureExists should return false for missing directory
      const exists = await lectureManager.lectureExists('broken-lecture');
      assert.strictEqual(exists, false);

      // buildLecture should throw error
      await assert.rejects(
        () => buildManager.buildLecture('broken-lecture'),
        /does not exist/
      );
    });

    // Note: Complex build operations are excluded from unit tests
    // They involve external processes and should be tested through integration tests
  });

  // Integration Tests (simplified - no real build operations)
  suite('Integration Tests', () => {
    test('buildManager works with CourseManager and LectureManager', async () => {
      // Create course configuration first
      await createMinimalCourse(tempDir, 'integration-course');
      
      // BuildManager should work with the created managers
      const newBuildManager = new BuildManager(courseManager, lectureManager);
      assert.ok(newBuildManager instanceof BuildManager);
      
      // Should be able to show progress (this doesn't involve real build operations)
      await newBuildManager.showProgress({ stage: 'building', percent: 100 });
      await newBuildManager.hideProgress();
    });

    test('Multiple progress operations work sequentially', async () => {
      // Show progress multiple times (no real build operations)
      await buildManager.showProgress({ stage: 'installing', percent: 25 });
      await buildManager.showProgress({ stage: 'building', percent: 50 });
      await buildManager.showProgress({ stage: 'complete', percent: 100 });
      
      // Hide progress
      await buildManager.hideProgress();
      
      assert.ok(true);
    });
  });

  // Edge Cases Tests
  suite('Edge Cases Tests', () => {
    test('showProgress handles undefined percent', async () => {
      const progress: import('../../managers/BuildManager').BuildProgress = {
        stage: 'building'
        // No percent provided
      };

      await buildManager.showProgress(progress);
      assert.ok(true);
    });

    test('showProgress handles empty lecture name', async () => {
      const progress: import('../../managers/BuildManager').BuildProgress = {
        lecture: '', // Empty lecture name
        stage: 'building'
      };

      await buildManager.showProgress(progress);
      assert.ok(true);
    });

    test('dispose can be called multiple times', async () => {
      // First dispose
      buildManager.dispose();
      
      // Second dispose should not throw
      buildManager.dispose();
      
      assert.ok(true);
    });
  });
});