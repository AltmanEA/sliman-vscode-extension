/**
 * Tests for LectureManager functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CourseManager } from '../../managers/CourseManager';
import { LectureManager } from '../../managers/LectureManager';
import { createTestDir, cleanupTestDir, cleanupAllTestDirs } from '../utils/testWorkspace';
import { createMinimalCourse } from '../utils/courseStructure';
import { LECTURE_SLIDES, LECTURE_PACKAGE } from '../../constants';

suite('LectureManager Tests', () => {
  let tempDir: string;
  let courseManager: CourseManager;
  let lectureManager: LectureManager;
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
    tempDir = await createTestDir('manager', 'lecture-manager');
    workspaceUri = vscode.Uri.file(tempDir);
    courseManager = new CourseManager(workspaceUri);
    
    // Create basic course structure for tests
    await createMinimalCourse(tempDir, 'test-course');
    
    // Use current directory as extension path for tests
    extensionPath = path.join(__dirname, '..', '..', '..');
    lectureManager = new LectureManager(courseManager, extensionPath);
    
    // Set test environment flag
    LectureManager.setTestEnvironment(true);
  });

  // Helper function to create course structure with slides.json
  async function createCourseStructureForTests(): Promise<void> {
    const courseDir = path.join(tempDir, 'test-course');
    await fs.mkdir(courseDir, { recursive: true });

    const slidesPath = path.join(courseDir, 'slides.json');
    await fs.writeFile(slidesPath, JSON.stringify({ slides: [] }, null, 2));
  }

  teardown(async () => {
    await cleanupTestDir(tempDir);
  });

  // Path Resolution Tests
  suite('Path Resolution Tests', () => {
    test('getSlidesDir returns slides directory', () => {
      const result = lectureManager.getSlidesDir();
      const expected = courseManager.getSlidesDir();
      assert.strictEqual(result.toString(), expected.toString());
    });

    test('getLectureDir returns lecture directory', () => {
      const lectureName = 'test-lecture';
      const result = lectureManager.getLectureDir(lectureName);
      const expected = vscode.Uri.joinPath(lectureManager.getSlidesDir(), lectureName);
      assert.strictEqual(result.toString(), expected.toString());
    });

    test('getLectureSlidesPath returns slides.md path', () => {
      const lectureName = 'test-lecture';
      const result = lectureManager.getLectureSlidesPath(lectureName);
      const expected = vscode.Uri.joinPath(lectureManager.getLectureDir(lectureName), LECTURE_SLIDES);
      assert.strictEqual(result.toString(), expected.toString());
    });

    test('getLecturePackagePath returns package.json path', () => {
      const lectureName = 'test-lecture';
      const result = lectureManager.getLecturePackagePath(lectureName);
      const expected = vscode.Uri.joinPath(lectureManager.getLectureDir(lectureName), LECTURE_PACKAGE);
      assert.strictEqual(result.toString(), expected.toString());
    });
  });

  // Lecture Management Tests
  suite('Lecture Management Tests', () => {
    test('lectureExists checks lecture existence', async () => {
      // Initially no lecture exists
      let result = await lectureManager.lectureExists('nonexistent');
      assert.strictEqual(result, false);

      // Create lecture directory
      await lectureManager.createLectureDir('existing-lecture');
      
      // Now should exist
      result = await lectureManager.lectureExists('existing-lecture');
      assert.strictEqual(result, true);
    });

    test('createLectureDir creates directory structure', async () => {
      const lectureName = 'new-lecture';
      await lectureManager.createLectureDir(lectureName);

      const lectureDir = lectureManager.getLectureDir(lectureName);
      const stat = await vscode.workspace.fs.stat(lectureDir);
      assert.strictEqual(stat.type, vscode.FileType.Directory);
    });

    test('createLecture creates full lecture structure', async () => {
      const lectureName = 'full-lecture';
      const lectureTitle = 'Full Test Lecture';
      
      const result = await lectureManager.createLecture(lectureName, lectureTitle);
      assert.strictEqual(result, lectureName);

      // Check that lecture directory exists
      const lectureDir = lectureManager.getLectureDir(lectureName);
      const stat = await vscode.workspace.fs.stat(lectureDir);
      assert.strictEqual(stat.type, vscode.FileType.Directory);

      // Check that slides.md was created
      const slidesPath = lectureManager.getLectureSlidesPath(lectureName);
      const slidesExists = await fs.access(slidesPath.fsPath).then(() => true).catch(() => false);
      assert.strictEqual(slidesExists, true);

      // Check that package.json was created
      const packagePath = lectureManager.getLecturePackagePath(lectureName);
      const packageExists = await fs.access(packagePath.fsPath).then(() => true).catch(() => false);
      assert.strictEqual(packageExists, true);

      // Check that node_modules was created (mock)
      const nodeModulesPath = vscode.Uri.joinPath(lectureDir, 'node_modules');
      const nodeModulesExists = await fs.access(nodeModulesPath.fsPath).then(() => true).catch(() => false);
      assert.strictEqual(nodeModulesExists, true);
    });

    test('createLecture with title only generates folder name', async () => {
      await createCourseStructureForTests();
      
      const title = 'Test Lecture';
      const result = await lectureManager.createLecture(title);
      
      // Simple validation - result should be non-empty and different from title
      assert.ok(result.length > 0);
      assert.notStrictEqual(result, title); // Should not be the same as title
      // This is a detail of transliteration implementation, not core functionality
    });

    test('createLecture handles duplicate lecture names', async () => {
      const lectureName = 'duplicate-lecture';
      const lectureTitle = 'First Lecture';
      
      // Create first lecture
      await lectureManager.createLecture(lectureName, lectureTitle);
      
      // Try to create duplicate
      await assert.rejects(
        () => lectureManager.createLecture(lectureName, 'Second Lecture'),
        /already exists/
      );
    });
  });

  // Template Tests
  suite('Template Tests', () => {
    test('copySlidesTemplate creates valid slides.md', async () => {
      const lectureName = 'template-test';
      const lectureTitle = 'Template Test Lecture';
      
      await lectureManager.createLectureDir(lectureName);
      await lectureManager.copySlidesTemplate(lectureName, lectureTitle);
      
      const slidesPath = lectureManager.getLectureSlidesPath(lectureName);
      const content = await fs.readFile(slidesPath.fsPath, 'utf-8');
      
      assert.ok(content.includes(lectureTitle));
      assert.ok(content.includes('title:'));
      assert.ok(content.includes('canvasWidth:'));
      assert.ok(content.includes('routerMode:'));
    });

    test('copyPackageJson creates valid package.json', async () => {
      const lectureName = 'package-test';
      
      await lectureManager.createLectureDir(lectureName);
      await lectureManager.copyPackageJson(lectureName);
      
      const packagePath = lectureManager.getLecturePackagePath(lectureName);
      const content = await fs.readFile(packagePath.fsPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      assert.ok(parsed.name?.includes(lectureName));
      assert.ok(parsed.dependencies?.['@slidev/cli']);
      assert.ok(parsed.dependencies?.['@slidev/theme-default']);
    });

    test('copyGlobalTopVue creates Vue component', async () => {
      const lectureName = 'vue-test';
      
      await lectureManager.createLectureDir(lectureName);
      await lectureManager.copyGlobalTopVue(lectureName);

      const globalTopPath = vscode.Uri.joinPath(lectureManager.getLectureDir(lectureName), 'global-top.vue');
      const content = await fs.readFile(globalTopPath.fsPath, 'utf-8');
      
      assert.ok(content.includes('<template>'));
      assert.ok(content.includes('<Courser'));
    });

    test('copyCourserVue creates Courser component', async () => {
      const lectureName = 'courser-test';
      
      await lectureManager.createLectureDir(lectureName);
      await lectureManager.copyCourserVue(lectureName);

      const componentsDir = vscode.Uri.joinPath(lectureManager.getLectureDir(lectureName), 'components');
      const courserPath = vscode.Uri.joinPath(componentsDir, 'Courser.vue');
      
      // Check components directory was created
      const componentsStat = await vscode.workspace.fs.stat(componentsDir);
      assert.strictEqual(componentsStat.type, vscode.FileType.Directory);
      
      // Check Courser.vue was created
      const content = await fs.readFile(courserPath.fsPath, 'utf-8');
      assert.ok(content.includes('<template>'));
    });
  });

  // Utility Tests
  suite('Utility Tests', () => {
    test('readTitleFromSlides extracts title from frontmatter', async () => {
      const lectureName = 'title-test';
      const lectureTitle = 'Extracted Title Lecture';
      
      // Create lecture and get slides content
      await lectureManager.createLecture(lectureName, lectureTitle);
      
      const extractedTitle = await lectureManager.readTitleFromSlides(lectureName);
      assert.strictEqual(extractedTitle, lectureTitle);
    });

    test('readTitleFromSlides handles missing title in frontmatter', async () => {
      const lectureName = 'no-title-test';
      
      await lectureManager.createLectureDir(lectureName);
      
      // Create slides.md without title in frontmatter
      const slidesContent = `---
canvasWidth: 1280
routerMode: history
---

# Slide 1
`;
      const slidesPath = lectureManager.getLectureSlidesPath(lectureName);
      await fs.writeFile(slidesPath.fsPath, slidesContent);
      
      await assert.rejects(
        () => lectureManager.readTitleFromSlides(lectureName),
        /No title field found/
      );
    });

    test('readTitleFromSlides handles missing frontmatter', async () => {
      const lectureName = 'no-frontmatter-test';
      
      await lectureManager.createLectureDir(lectureName);
      
      // Create slides.md without frontmatter
      const slidesContent = `# Slide 1
Content here
`;
      const slidesPath = lectureManager.getLectureSlidesPath(lectureName);
      await fs.writeFile(slidesPath.fsPath, slidesContent);
      
      await assert.rejects(
        () => lectureManager.readTitleFromSlides(lectureName),
        /No frontmatter found/
      );
    });

    test('updateCourseConfig updates slides.json', async () => {
      await createCourseStructureForTests();

      const lectureName = 'config-test';
      const lectureTitle = 'Config Test Lecture';
      
      await lectureManager.updateCourseConfig(lectureName, lectureTitle);
      
      const result = await courseManager.readSlidesJson();
      assert.strictEqual(result?.slides.length, 1);
      assert.strictEqual(result?.slides[0].name, lectureName);
      assert.strictEqual(result?.slides[0].title, lectureTitle);
    });
  });

  // Edge Cases Tests
  suite('Edge Cases Tests', () => {
    test('createLecture handles empty name with title', async () => {
      await createCourseStructureForTests();
      
      const title = 'Empty Name Test';
      const result = await lectureManager.createLecture('', title);
      
      // Should generate folder name
      assert.ok(result.length > 0);
      assert.notStrictEqual(result, '');
    });

    test('createLecture handles invalid name with valid title', async () => {
      await createCourseStructureForTests();
      
      const invalidName = 'invalid@name#';
      const title = 'Valid Title Test';
      
      const result = await lectureManager.createLecture(invalidName, title);
      
      // Should generate valid folder name from title
      assert.ok(result.length > 0);
      assert.notStrictEqual(result, invalidName);
    });

    test('createComponentsDir creates components directory', async () => {
      const lectureName = 'components-test';
      await lectureManager.createLectureDir(lectureName);
      
      const componentsDir = await lectureManager.createComponentsDir(lectureName);
      const stat = await vscode.workspace.fs.stat(componentsDir);
      assert.strictEqual(stat.type, vscode.FileType.Directory);
    });

    test('initLectureNpm creates mock node_modules in test environment', async () => {
      const lectureName = 'npm-test';
      await lectureManager.createLectureDir(lectureName);
      
      await lectureManager.initLectureNpm(lectureName);
      
      const nodeModulesPath = vscode.Uri.joinPath(lectureManager.getLectureDir(lectureName), 'node_modules');
      const exists = await fs.access(nodeModulesPath.fsPath).then(() => true).catch(() => false);
      assert.strictEqual(exists, true);
    });
  });
});