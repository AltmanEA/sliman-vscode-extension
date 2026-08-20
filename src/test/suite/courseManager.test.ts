/**
 * Tests for CourseManager functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CourseManager } from '../../managers/CourseManager';
import { createTestDir, cleanupTestDir, cleanupAllTestDirs } from '../utils/testWorkspace';
import { createCourseStructure, createMinimalCourse, createCourseWithEmptySlides } from '../utils/courseStructure';
import { SLIMAN_FILENAME, SLIDES_DIR, BUILT_DIR } from '../../constants';

suite('CourseManager Tests', () => {
  let tempDir: string;
  let courseManager: CourseManager;
  let workspaceUri: vscode.Uri;

  suiteSetup(async () => {
    // Global cleanup in case previous tests didn't clean up
    await cleanupAllTestDirs();
  });

  suiteTeardown(async () => {
    await cleanupAllTestDirs();
  });

  setup(async () => {
    tempDir = await createTestDir('manager', 'course-manager');
    workspaceUri = vscode.Uri.file(tempDir);
    courseManager = new CourseManager(workspaceUri);
  });

  teardown(async () => {
    await cleanupTestDir(tempDir);
  });

  // Path Resolution Tests
  suite('Path Resolution Tests', () => {
    test('getCourseRoot returns correct URI', () => {
      const result = courseManager.getCourseRoot();
      assert.strictEqual(result.toString(), workspaceUri.toString());
    });

    test('getSlidesDir returns slides directory URI', () => {
      const result = courseManager.getSlidesDir();
      const expected = vscode.Uri.joinPath(workspaceUri, SLIDES_DIR);
      assert.strictEqual(result.toString(), expected.toString());
    });

    test('getBuiltCourseDir returns built directory URI (deprecated)', () => {
      const result = courseManager.getBuiltCourseDir();
      const expected = vscode.Uri.joinPath(workspaceUri, BUILT_DIR);
      assert.strictEqual(result.toString(), expected.toString());
    });

    test('getBuiltCourseDirWithName returns course-specific directory', () => {
      const courseName = 'test-course';
      const result = courseManager.getBuiltCourseDirWithName(courseName);
      const expected = vscode.Uri.joinPath(workspaceUri, courseName);
      assert.strictEqual(result.toString(), expected.toString());
    });

    test('isPathInCourseRoot validates paths correctly', async () => {
      const slidesDir = courseManager.getSlidesDir();
      const outsidePath = vscode.Uri.joinPath(workspaceUri, '..', 'outside');
      
      assert.strictEqual(courseManager.isPathInCourseRoot(slidesDir), true);
      assert.strictEqual(courseManager.isPathInCourseRoot(outsidePath), false);
      assert.strictEqual(courseManager.isPathInCourseRoot(workspaceUri), true);
    });
  });

  // Configuration Tests
  suite('Configuration Tests', () => {
    test('isCourseRoot detects valid course root', async () => {
      // No sliman.json exists initially
      let result = await courseManager.isCourseRoot();
      assert.strictEqual(result, false);

      // Create sliman.json using utility
      await createMinimalCourse(tempDir, 'Test Course');

      // Now should be valid
      result = await courseManager.isCourseRoot();
      assert.strictEqual(result, true);
    });

    test('readSlimanConfig parses sliman.json correctly', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      const result = await courseManager.readSlimanConfig();
      assert.strictEqual(result?.course_name, 'Test Course');
    });

    test('writeSlimanConfig creates valid sliman.json', async () => {
      const config = { course_name: 'New Course' };
      await courseManager.writeSlimanConfig(config);

      const result = await courseManager.readSlimanConfig();
      assert.strictEqual(result?.course_name, 'New Course');
    });

    test('readSlidesJson parses slides.json correctly', async () => {
      const lectures = [
        { name: 'lecture-1', title: 'Introduction' },
        { name: 'lecture-2', title: 'Advanced Topics' }
      ];
      await createCourseStructure(tempDir, 'test-course', lectures);

      const result = await courseManager.readSlidesJson();
      assert.strictEqual(result?.slides.length, 2);
      assert.strictEqual(result?.slides[0].name, 'lecture-1');
      assert.strictEqual(result?.slides[0].title, 'Introduction');
    });

    test('writeSlidesJson creates valid slides.json', async () => {
      await createMinimalCourse(tempDir, 'test-course');

      const slidesConfig = {
        slides: [
          { name: 'lecture-1', title: 'New Lecture' }
        ]
      };

      await courseManager.writeSlidesJson(slidesConfig);

      const result = await courseManager.readSlidesJson();
      assert.strictEqual(result?.slides.length, 1);
      assert.strictEqual(result?.slides[0].name, 'lecture-1');
    });
  });

  // Course Data Tests
  suite('Course Data Tests', () => {
    test('getLectureDirectories lists lecture folders', async () => {
      const lectures = [
        { name: 'lecture-1', title: 'Lecture 1' },
        { name: 'lecture-2', title: 'Lecture 2' }
      ];
      await createCourseStructure(tempDir, 'test-course', lectures);

      const result = await courseManager.getLectureDirectories();
      assert.strictEqual(result.length, 2);
      assert.ok(result.includes('lecture-1'));
      assert.ok(result.includes('lecture-2'));
    });

    test('addLecture updates slides.json correctly', async () => {
      await createCourseWithEmptySlides(tempDir, 'test-course');

      // Add a new lecture
      await courseManager.addLecture('lecture-new', 'New Lecture');

      const result = await courseManager.readSlidesJson();
      assert.strictEqual(result?.slides.length, 1);
      assert.strictEqual(result?.slides[0].name, 'lecture-new');
      assert.strictEqual(result?.slides[0].title, 'New Lecture');
    });

    test('readCourseData combines all data', async () => {
      const lectures = [
        { name: 'lecture-1', title: 'Lecture 1' }
      ];
      await createCourseStructure(tempDir, 'Combined Course', lectures);

      const result = await courseManager.readCourseData();
      
      assert.strictEqual(result.courseName, 'Combined Course');
      assert.strictEqual(result.slides?.slides.length, 1);
      assert.strictEqual(result.slides?.slides[0].name, 'lecture-1');
    });

    test('CourseManager constructor handles workspace URI', () => {
      const newManager = new CourseManager(workspaceUri);
      const root = newManager.getCourseRoot();
      assert.strictEqual(root.toString(), workspaceUri.toString());
    });
  });

  // Edge Cases Tests
  suite('Edge Cases Tests', () => {
    test('readSlimanConfig returns null for missing file', async () => {
      const result = await courseManager.readSlimanConfig();
      assert.strictEqual(result, null);
    });

    test('readSlidesJson returns null for missing file', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      const result = await courseManager.readSlidesJson();
      assert.strictEqual(result, null);
    });

    test('readSlidesJson reads from built/ when deployRoot is true', async () => {
      const lectures = [
        { name: 'lecture-1', title: 'Introduction' },
        { name: 'lecture-2', title: 'Advanced Topics' }
      ];
      await createCourseStructure(tempDir, 'test-course-deployroot', lectures, { deployRoot: true });

      const result = await courseManager.readSlidesJson();
      assert.strictEqual(result?.slides.length, 2);
      assert.strictEqual(result?.slides[0].name, 'lecture-1');
      assert.strictEqual(result?.slides[0].title, 'Introduction');
      assert.strictEqual(result?.slides[1].name, 'lecture-2');
      assert.strictEqual(result?.slides[1].title, 'Advanced Topics');
    });

    test('writeSlimanConfig handles invalid JSON gracefully', async () => {
      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, 'invalid json');

      // Should not throw, but handle gracefully
      await courseManager.writeSlimanConfig({ course_name: 'Test' });
      
      const result = await courseManager.readSlimanConfig();
      assert.strictEqual(result?.course_name, 'Test');
    });

    test('getLectureDirectories handles missing slides directory', async () => {
      const result = await courseManager.getLectureDirectories();
      assert.strictEqual(result.length, 0);
    });
  });

  // DeployRoot Tests
  suite('DeployRoot Tests', () => {
    test('readDeployRoot returns false when deployRoot is not set', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      // Overwrite sliman.json without deployRoot (simulating old config)
      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, JSON.stringify({ course_name: 'Test Course' }, null, 2));

      const result = await courseManager.readDeployRoot();
      assert.strictEqual(result, false);
    });

    test('readDeployRoot returns true when deployRoot is true', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, JSON.stringify({ course_name: 'Test Course', deployRoot: true }, null, 2));

      const result = await courseManager.readDeployRoot();
      assert.strictEqual(result, true);
    });

    test('readDeployRoot returns false when deployRoot is false', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, JSON.stringify({ course_name: 'Test Course', deployRoot: false }, null, 2));

      const result = await courseManager.readDeployRoot();
      assert.strictEqual(result, false);
    });

    test('isDeployRoot returns false when deployRoot is not set', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, JSON.stringify({ course_name: 'Test Course' }, null, 2));

      const result = await courseManager.isDeployRoot();
      assert.strictEqual(result, false);
    });

    test('isDeployRoot returns true when deployRoot is true', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, JSON.stringify({ course_name: 'Test Course', deployRoot: true }, null, 2));

      const result = await courseManager.isDeployRoot();
      assert.strictEqual(result, true);
    });

    test('readSlimanConfig migrates missing deployRoot to false', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      // Overwrite sliman.json without deployRoot
      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, JSON.stringify({ course_name: 'Test Course' }, null, 2));

      // Read the config — should trigger migration
      const result = await courseManager.readSlimanConfig();
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.course_name, 'Test Course');
      assert.strictEqual(result?.deployRoot, false);

      // Verify the file was updated on disk
      const updatedContent = JSON.parse(await fs.readFile(slimanPath, 'utf-8'));
      assert.strictEqual(updatedContent.deployRoot, false);
    });

    test('readSlimanConfig preserves existing deployRoot value', async () => {
      await createMinimalCourse(tempDir, 'Test Course');

      const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
      await fs.writeFile(slimanPath, JSON.stringify({ course_name: 'Test Course', deployRoot: true }, null, 2));

      const result = await courseManager.readSlimanConfig();
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.deployRoot, true);

      // File should not have been modified
      const updatedContent = JSON.parse(await fs.readFile(slimanPath, 'utf-8'));
      assert.strictEqual(updatedContent.deployRoot, true);
    });

    test('writeSlimanConfig always includes deployRoot field', async () => {
      // Write config without deployRoot
      await courseManager.writeSlimanConfig({ course_name: 'New Course' });

      const result = await courseManager.readSlimanConfig();
      assert.strictEqual(result?.course_name, 'New Course');
      assert.strictEqual(result?.deployRoot, false);

      // Write config with deployRoot: true
      await courseManager.writeSlimanConfig({ course_name: 'New Course', deployRoot: true });

      const result2 = await courseManager.readSlimanConfig();
      assert.strictEqual(result2?.deployRoot, true);
    });
  });
});