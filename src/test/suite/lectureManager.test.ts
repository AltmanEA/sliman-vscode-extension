/**
 * Tests for LectureManager - Subtask 2.2: Structure & Subtask 2.3: Templates
 * Each test creates its own unique temporary directory to avoid state pollution.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { LectureManager } from '../../managers/LectureManager';
import { CourseManager } from '../../managers/CourseManager';
import { SLIDES_DIR, LECTURE_SLIDES, LECTURE_PACKAGE, TEMPLATE_DIR, TEMPLATE_SLIDES, TEMPLATE_PACKAGE } from '../../constants';
import { ProcessHelper } from '../../utils/process';

// Mock ProcessHelper to skip npm install in tests
ProcessHelper.installDependencies = async () => ({ success: true, stdout: '', stderr: '', exitCode: 0 });

// ============================================
// Helper Functions
// ============================================

/** Creates a unique temporary directory for a test */
async function createTestDir(testName: string): Promise<string> {
  const fs = await import('fs/promises');
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const testDir = path.join(__dirname, '..', '..', '..', `test-workspace-${testName}-${uniqueId}`);
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

/** Creates a LectureManager with its own unique test directory */
async function createManagerForTest(testName: string): Promise<{ manager: LectureManager; tempDir: string }> {
  const tempDir = await createTestDir(testName);
  const uri = vscode.Uri.file(tempDir);
  const courseManager = new CourseManager(uri);
  const manager = new LectureManager(courseManager);
  return { manager, tempDir };
}

/** Cleans up a test directory */
async function cleanupTestDir(tempDir: string): Promise<void> {
  const fs = await import('fs/promises');
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup test directory: ${tempDir}`, error);
  }
}

// ============================================
// LectureManager Test Suite
// ============================================

suite('LectureManager Test Suite', () => {
  // ============================================
  // Subtask 2.2: Structure Tests
  // ============================================

  suite('getSlidesDir', () => {
    test('should return URI of slides/ directory', async () => {
      const { manager, tempDir } = await createManagerForTest('getSlidesDir');
      try {
        const slidesDir = manager.getSlidesDir();
        const expectedPath = path.join(tempDir, SLIDES_DIR);
        assert.strictEqual(slidesDir.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return consistent URI across multiple calls', async () => {
      const { manager, tempDir } = await createManagerForTest('getSlidesDir');
      try {
        const slidesDir1 = manager.getSlidesDir();
        const slidesDir2 = manager.getSlidesDir();
        const expectedPath = path.join(tempDir, SLIDES_DIR);

        assert.strictEqual(slidesDir1.fsPath, expectedPath);
        assert.strictEqual(slidesDir2.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('getLectureDir', () => {
    test('should return URI for lecture directory', async () => {
      const { manager, tempDir } = await createManagerForTest('getLectureDir');
      try {
        const lectureDir = manager.getLectureDir('lecture-1');
        const expectedPath = path.join(tempDir, SLIDES_DIR, 'lecture-1');
        assert.strictEqual(lectureDir.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should handle different lecture names', async () => {
      const { manager, tempDir } = await createManagerForTest('getLectureDir');
      try {
        const lectureDir1 = manager.getLectureDir('about');
        const lectureDir2 = manager.getLectureDir('introduction');
        const expectedPath1 = vscode.Uri.joinPath(vscode.Uri.file(tempDir), SLIDES_DIR, 'about').fsPath;
        const expectedPath2 = vscode.Uri.joinPath(vscode.Uri.file(tempDir), SLIDES_DIR, 'introduction').fsPath;

        assert.strictEqual(lectureDir1.fsPath, expectedPath1);
        assert.strictEqual(lectureDir2.fsPath, expectedPath2);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should handle unicode lecture names', async () => {
      const { manager, tempDir } = await createManagerForTest('getLectureDir');
      try {
        const lectureDir = manager.getLectureDir('тест-лекция');
        assert.ok(lectureDir.fsPath.includes('тест-лекция'));
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('getLectureSlidesPath', () => {
    test('should return URI for slides.md file', async () => {
      const { manager, tempDir } = await createManagerForTest('getLectureSlidesPath');
      try {
        const slidesPath = manager.getLectureSlidesPath('lecture-1');
        const expectedPath = path.join(tempDir, SLIDES_DIR, 'lecture-1', LECTURE_SLIDES);
        assert.strictEqual(slidesPath.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return correct path for different lecture names', async () => {
      const { manager, tempDir } = await createManagerForTest('getLectureSlidesPath');
      try {
        const slidesPath = manager.getLectureSlidesPath('about');
        const expectedPath = path.join(tempDir, SLIDES_DIR, 'about', LECTURE_SLIDES);
        assert.strictEqual(slidesPath.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('getLecturePackagePath', () => {
    test('should return URI for package.json file', async () => {
      const { manager, tempDir } = await createManagerForTest('getLecturePackagePath');
      try {
        const packagePath = manager.getLecturePackagePath('lecture-1');
        const expectedPath = path.join(tempDir, SLIDES_DIR, 'lecture-1', LECTURE_PACKAGE);
        assert.strictEqual(packagePath.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return correct path for different lecture names', async () => {
      const { manager, tempDir } = await createManagerForTest('getLecturePackagePath');
      try {
        const packagePath = manager.getLecturePackagePath('introduction');
        const expectedPath = path.join(tempDir, SLIDES_DIR, 'introduction', LECTURE_PACKAGE);
        assert.strictEqual(packagePath.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('lectureExists', () => {
    test('should return true when lecture directory exists', async () => {
      const { manager, tempDir } = await createManagerForTest('lectureExists');
      try {
        const fs = await import('fs/promises');
        // Create lecture directory
        await fs.mkdir(path.join(tempDir, SLIDES_DIR, 'lecture-1'), { recursive: true });

        const exists = await manager.lectureExists('lecture-1');
        assert.strictEqual(exists, true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return false when lecture directory does not exist', async () => {
      const { manager, tempDir } = await createManagerForTest('lectureExists');
      try {
        const exists = await manager.lectureExists('non-existent');
        assert.strictEqual(exists, false);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return false when slides directory does not exist', async () => {
      const { manager, tempDir } = await createManagerForTest('lectureExists');
      try {
        // Don't create slides directory
        const exists = await manager.lectureExists('lecture-1');
        assert.strictEqual(exists, false);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return false when path exists but is a file', async () => {
      const { manager, tempDir } = await createManagerForTest('lectureExists');
      try {
        const fs = await import('fs/promises');
        // Create slides directory and a file inside it instead of directory
        await fs.mkdir(path.join(tempDir, SLIDES_DIR), { recursive: true });
        await fs.writeFile(path.join(tempDir, SLIDES_DIR, 'lecture-1'), 'content', 'utf-8');

        const exists = await manager.lectureExists('lecture-1');
        assert.strictEqual(exists, false);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should handle unicode lecture names', async () => {
      const { manager, tempDir } = await createManagerForTest('lectureExists');
      try {
        const fs = await import('fs/promises');
        await fs.mkdir(path.join(tempDir, SLIDES_DIR, 'тест'), { recursive: true });

        const exists = await manager.lectureExists('тест');
        assert.strictEqual(exists, true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return false for empty lecture name', async () => {
      const { manager, tempDir } = await createManagerForTest('lectureExists');
      try {
        const exists = await manager.lectureExists('');
        assert.strictEqual(exists, false);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('createLectureDir', () => {
    test('should create lecture directory', async () => {
      const { manager, tempDir } = await createManagerForTest('createLectureDir');
      try {
        await manager.createLectureDir('lecture-1');

        const fs = await import('fs/promises');
        const stat = await fs.stat(path.join(tempDir, SLIDES_DIR, 'lecture-1'));
        assert.strictEqual(stat.isDirectory(), true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should create parent slides/ directory if not exists', async () => {
      const { manager, tempDir } = await createManagerForTest('createLectureDir');
      try {
        await manager.createLectureDir('lecture-1');

        const fs = await import('fs/promises');
        // Check slides directory exists
        const slidesStat = await fs.stat(path.join(tempDir, SLIDES_DIR));
        assert.strictEqual(slidesStat.isDirectory(), true);

        // Check lecture directory exists
        const lectureStat = await fs.stat(path.join(tempDir, SLIDES_DIR, 'lecture-1'));
        assert.strictEqual(lectureStat.isDirectory(), true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should not throw when directory already exists', async () => {
      const { manager, tempDir } = await createManagerForTest('createLectureDir');
      try {
        const fs = await import('fs/promises');
        await fs.mkdir(path.join(tempDir, SLIDES_DIR, 'lecture-1'), { recursive: true });

        // Should not throw
        await manager.createLectureDir('lecture-1');
        assert.ok(true); // If we get here, no error was thrown
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should create multiple lecture directories', async () => {
      const { manager, tempDir } = await createManagerForTest('createLectureDir');
      try {
        await manager.createLectureDir('lecture-1');
        await manager.createLectureDir('lecture-2');
        await manager.createLectureDir('lecture-3');

        const fs = await import('fs/promises');
        const stat1 = await fs.stat(path.join(tempDir, SLIDES_DIR, 'lecture-1'));
        const stat2 = await fs.stat(path.join(tempDir, SLIDES_DIR, 'lecture-2'));
        const stat3 = await fs.stat(path.join(tempDir, SLIDES_DIR, 'lecture-3'));

        assert.strictEqual(stat1.isDirectory(), true);
        assert.strictEqual(stat2.isDirectory(), true);
        assert.strictEqual(stat3.isDirectory(), true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should handle unicode lecture names', async () => {
      const { manager, tempDir } = await createManagerForTest('createLectureDir');
      try {
        await manager.createLectureDir('тест-лекция');

        const fs = await import('fs/promises');
        const stat = await fs.stat(path.join(tempDir, SLIDES_DIR, 'тест-лекция'));
        assert.strictEqual(stat.isDirectory(), true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  // ============================================
  // Subtask 2.3: Template Tests
  // ============================================

  suite('copySlidesTemplate', () => {
    test('should copy slides.md with replaced title', async () => {
      const { manager, tempDir } = await createManagerForTest('copySlidesTemplate');
      try {
        // Create template directory with slides.md
        const fs = await import('fs/promises');
        const templateDir = path.join(tempDir, TEMPLATE_DIR);
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(
          path.join(templateDir, TEMPLATE_SLIDES),
          '---\ntitle: {{TITLE}}\nname: {{NAME}}\n---\n# Hello\n',
          'utf-8'
        );

        await manager.createLectureDir('lecture-1');
        await manager.copySlidesTemplate('lecture-1', 'My Lecture Title');

        const content = await fs.readFile(
          path.join(tempDir, SLIDES_DIR, 'lecture-1', LECTURE_SLIDES),
          'utf-8'
        );
        assert.ok(content.includes('title: My Lecture Title'));
        assert.ok(content.includes('name: lecture-1'));
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should throw when template file does not exist', async () => {
      const { manager, tempDir } = await createManagerForTest('copySlidesTemplate');
      try {
        await manager.createLectureDir('lecture-1');

        await assert.rejects(
          async () => await manager.copySlidesTemplate('lecture-1', 'Title'),
          /Failed to read template/
        );
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should handle Cyrillic title', async () => {
      const { manager, tempDir } = await createManagerForTest('copySlidesTemplate');
      try {
        const fs = await import('fs/promises');
        const templateDir = path.join(tempDir, TEMPLATE_DIR);
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(
          path.join(templateDir, TEMPLATE_SLIDES),
          '---\ntitle: {{TITLE}}\n---\n',
          'utf-8'
        );

        await manager.createLectureDir('lecture-1');
        await manager.copySlidesTemplate('lecture-1', 'Введение в курс');

        const content = await fs.readFile(
          path.join(tempDir, SLIDES_DIR, 'lecture-1', LECTURE_SLIDES),
          'utf-8'
        );
        assert.ok(content.includes('title: Введение в курс'));
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('copyPackageJson', () => {
    test('should copy package.json with replaced lecture name', async () => {
      const { manager, tempDir } = await createManagerForTest('copyPackageJson');
      try {
        const fs = await import('fs/promises');
        const templateDir = path.join(tempDir, TEMPLATE_DIR);
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(
          path.join(templateDir, TEMPLATE_PACKAGE),
          '{"name": "{{LECTURE_NAME}}", "scripts": {"dev": "slidev"}}',
          'utf-8'
        );

        await manager.createLectureDir('lecture-1');
        await manager.copyPackageJson('lecture-1');

        const content = await fs.readFile(
          path.join(tempDir, SLIDES_DIR, 'lecture-1', LECTURE_PACKAGE),
          'utf-8'
        );
        assert.ok(content.includes('"name": "lecture-1"'));
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should throw when template file does not exist', async () => {
      const { manager, tempDir } = await createManagerForTest('copyPackageJson');
      try {
        await manager.createLectureDir('lecture-1');

        await assert.rejects(
          async () => await manager.copyPackageJson('lecture-1'),
          /Failed to read template/
        );
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('updateCourseConfig', () => {
    test('should add lecture to slides.json', async () => {
      const { manager, tempDir } = await createManagerForTest('updateCourseConfig');
      try {
        const fs = await import('fs/promises');
        // Create slides.json in course root
        await fs.writeFile(
          path.join(tempDir, 'slides.json'),
          '{"slides": []}',
          'utf-8'
        );

        await manager.updateCourseConfig('lecture-1', 'First Lecture');

        const content = await fs.readFile(
          path.join(tempDir, 'slides.json'),
          'utf-8'
        );
        const parsed = JSON.parse(content);
        assert.strictEqual(parsed.slides.length, 1);
        assert.strictEqual(parsed.slides[0].name, 'lecture-1');
        assert.strictEqual(parsed.slides[0].title, 'First Lecture');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should update existing lecture in slides.json', async () => {
      const { manager, tempDir } = await createManagerForTest('updateCourseConfig');
      try {
        const fs = await import('fs/promises');
        // Create slides.json in course root
        await fs.writeFile(
          path.join(tempDir, 'slides.json'),
          '{"slides": [{"name": "lecture-1", "title": "Old Title"}]}',
          'utf-8'
        );

        await manager.updateCourseConfig('lecture-1', 'New Title');

        const content = await fs.readFile(
          path.join(tempDir, 'slides.json'),
          'utf-8'
        );
        const parsed = JSON.parse(content);
        assert.strictEqual(parsed.slides.length, 1);
        assert.strictEqual(parsed.slides[0].title, 'New Title');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should create slides.json if it does not exist', async () => {
      const { manager, tempDir } = await createManagerForTest('updateCourseConfig');
      try {
        // Don't create slides.json - it should be created
        await manager.updateCourseConfig('lecture-1', 'First Lecture');

        const fs = await import('fs/promises');
        const content = await fs.readFile(
          path.join(tempDir, 'slides.json'),
          'utf-8'
        );
        const parsed = JSON.parse(content);
        assert.strictEqual(parsed.slides.length, 1);
        assert.strictEqual(parsed.slides[0].name, 'lecture-1');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  suite('createLecture', () => {
    test('should create complete lecture structure', async () => {
      const { manager, tempDir } = await createManagerForTest('createLecture');
      try {
        const fs = await import('fs/promises');
        // Create template directory
        const templateDir = path.join(tempDir, TEMPLATE_DIR);
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(
          path.join(templateDir, TEMPLATE_SLIDES),
          '---\ntitle: {{TITLE}}\nname: {{NAME}}\n---\n# {{TITLE}}\n',
          'utf-8'
        );
        await fs.writeFile(
          path.join(templateDir, TEMPLATE_PACKAGE),
          '{"name": "{{LECTURE_NAME}}", "private": true}',
          'utf-8'
        );
        // Create slides.json in course root
        await fs.writeFile(path.join(tempDir, 'slides.json'), '{"slides": []}', 'utf-8');

        const folderName = await manager.createLecture('my-lecture', 'My Lecture');

        assert.strictEqual(folderName, 'my-lecture');

        // Check slides.md exists with correct content
        const slidesContent = await fs.readFile(
          path.join(tempDir, SLIDES_DIR, 'my-lecture', LECTURE_SLIDES),
          'utf-8'
        );
        assert.ok(slidesContent.includes('title: My Lecture'));
        assert.ok(slidesContent.includes('name: my-lecture'));

        // Check package.json exists with correct content
        const packageContent = await fs.readFile(
          path.join(tempDir, SLIDES_DIR, 'my-lecture', LECTURE_PACKAGE),
          'utf-8'
        );
        assert.ok(packageContent.includes('"name": "my-lecture"'));

        // Check slides.json was updated
        const slidesJson = JSON.parse(
          await fs.readFile(path.join(tempDir, 'slides.json'), 'utf-8')
        );
        assert.strictEqual(slidesJson.slides.length, 1);
        assert.strictEqual(slidesJson.slides[0].name, 'my-lecture');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should generate folder name from Cyrillic title', async () => {
      const { manager, tempDir } = await createManagerForTest('createLecture');
      try {
        const fs = await import('fs/promises');
        const templateDir = path.join(tempDir, TEMPLATE_DIR);
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(path.join(templateDir, TEMPLATE_SLIDES), '---\ntitle: {{TITLE}}\n---\n', 'utf-8');
        await fs.writeFile(path.join(templateDir, TEMPLATE_PACKAGE), '{"name": "{{LECTURE_NAME}}"}', 'utf-8');
        // Create slides.json in course root
        await fs.writeFile(path.join(tempDir, 'slides.json'), '{"slides": []}', 'utf-8');

        const folderName = await manager.createLecture('О компании');

        assert.strictEqual(folderName, 'o-kompanii');

        // Check slides.json has correct title
        const slidesJson = JSON.parse(
          await fs.readFile(path.join(tempDir, 'slides.json'), 'utf-8')
        );
        assert.strictEqual(slidesJson.slides[0].title, 'О компании');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should throw when lecture already exists', async () => {
      const { manager, tempDir } = await createManagerForTest('createLecture');
      try {
        const fs = await import('fs/promises');
        const templateDir = path.join(tempDir, TEMPLATE_DIR);
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(path.join(templateDir, TEMPLATE_SLIDES), '---\ntitle: {{TITLE}}\n---\n', 'utf-8');
        await fs.writeFile(path.join(templateDir, TEMPLATE_PACKAGE), '{"name": "{{LECTURE_NAME}}"}', 'utf-8');
        // Create slides.json in course root
        await fs.writeFile(path.join(tempDir, 'slides.json'), '{"slides": []}', 'utf-8');

        // Create first lecture
        await manager.createLecture('existing-lecture', 'Existing Lecture');

        // Try to create duplicate
        await assert.rejects(
          async () => await manager.createLecture('existing-lecture', 'Another Lecture'),
          /already exists/
        );
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should handle title-only argument (no name)', async () => {
      const { manager, tempDir } = await createManagerForTest('createLecture');
      try {
        const fs = await import('fs/promises');
        const templateDir = path.join(tempDir, TEMPLATE_DIR);
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(path.join(templateDir, TEMPLATE_SLIDES), '---\ntitle: {{TITLE}}\n---\n', 'utf-8');
        await fs.writeFile(path.join(templateDir, TEMPLATE_PACKAGE), '{"name": "{{LECTURE_NAME}}"}', 'utf-8');
        // Create slides.json in course root
        await fs.writeFile(path.join(tempDir, 'slides.json'), '{"slides": []}', 'utf-8');

        const folderName = await manager.createLecture('Introduction to Programming');

        // Should generate folder name from title
        assert.ok(folderName.length > 0);
        assert.strictEqual(folderName, 'introduction-to-programming');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  // ============================================
  // Global Cleanup
  // ============================================

  suiteTeardown(async () => {
    // Clean up any remaining test directories
    const testDir = path.join(__dirname, '..', '..', '..');
    
    try {
      const entries = await fs.readdir(testDir);
      const testWorkspaces = entries.filter(entry => 
        entry.startsWith('test-workspace-') && !entry.includes('example')
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