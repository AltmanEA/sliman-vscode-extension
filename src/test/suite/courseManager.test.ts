/**
 * Tests for CourseManager - Updated for new structure with sliman.json
 * Each test creates its own unique temporary directory to avoid state pollution.
 * 
 * New structure:
 * - sliman.json contains course_name (in course root)
 * - {course_name}/slides.json contains slides array
 * - {course_name}/ directory for built course files
 * - Built lectures are copied from {lecture}/dist/ to {course_name}/{lecture}/
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { CourseManager } from '../../managers/CourseManager';
import { SLIDES_DIR, BUILT_DIR, SLIDES_FILENAME, SLIMAN_FILENAME, TEMPLATE_SLIDES } from '../../constants';
import { createTestDir, cleanupTestDir } from '../utils/testWorkspace';

// ============================================
// Helper Functions
// ============================================

/** Creates a CourseManager with its own unique test directory */
async function createManagerForTest(testName: string): Promise<{ manager: CourseManager; tempDir: string }> {
  const tempDir = await createTestDir('manager', testName);
  const uri = vscode.Uri.file(tempDir);
  const manager = new CourseManager(uri);
  return { manager, tempDir };
}

// ============================================
// CourseManager Test Suite
// ============================================

suite('CourseManager Test Suite', () => {
  // ============================================
  // Task 1.3.1: Path Resolution Tests
  // ============================================

  suite('Path Resolution', () => {
    test('getCourseRoot returns workspace URI', async () => {
      const { manager, tempDir } = await createManagerForTest('path-resolution');
      try {
        const root = manager.getCourseRoot();
        assert.strictEqual(root.fsPath, tempDir);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('getSlidesDir returns slides/ directory URI', async () => {
      const { manager, tempDir } = await createManagerForTest('path-resolution');
      try {
        const slidesDir = manager.getSlidesDir();
        const expectedPath = path.join(tempDir, SLIDES_DIR);
        assert.strictEqual(slidesDir.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('getBuiltCourseDir returns built/ directory URI', async () => {
      const { manager, tempDir } = await createManagerForTest('path-resolution');
      try {
        const builtDir = manager.getBuiltCourseDir();
        const expectedPath = path.join(tempDir, BUILT_DIR);
        assert.strictEqual(builtDir.fsPath, expectedPath);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('isPathInCourseRoot returns true for path inside course root', async () => {
      const { manager, tempDir } = await createManagerForTest('path-resolution');
      try {
        // Use vscode.Uri.joinPath for cross-platform path consistency
        const innerPath = vscode.Uri.joinPath(manager.getCourseRoot(), 'some-file.md');
        const result = manager.isPathInCourseRoot(innerPath);
        assert.strictEqual(result, true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('isPathInCourseRoot returns false for path outside course root', async () => {
      const { manager, tempDir } = await createManagerForTest('path-resolution');
      try {
        const outerPath = vscode.Uri.file(path.join(__dirname, 'outside.md'));
        const result = manager.isPathInCourseRoot(outerPath);
        assert.strictEqual(result, false);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('isPathInCourseRoot returns true for course root itself', async () => {
      const { manager, tempDir } = await createManagerForTest('path-resolution');
      try {
        const workspaceUri = vscode.Uri.file(tempDir);
        const result = manager.isPathInCourseRoot(workspaceUri);
        assert.strictEqual(result, true);
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  // ============================================
  // Task 1.3.2: Course Name Operations (stored in sliman.json)
  // ============================================

  suite('Course Name Operations (in sliman.json)', () => {
    suite('isCourseRoot', () => {
      test('should return true when sliman.json exists', async () => {
        const { manager, tempDir } = await createManagerForTest('isCourseRoot');
        try {
          // Create sliman.json
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test' }), 'utf-8');

          const result = await manager.isCourseRoot();
          assert.strictEqual(result, true);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return false when sliman.json does not exist', async () => {
        const { manager, tempDir } = await createManagerForTest('isCourseRoot');
        try {
          const result = await manager.isCourseRoot();
          assert.strictEqual(result, false);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });

    suite('readCourseName', () => {
      test('should return course name when sliman.json is valid', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'My Course' }), 'utf-8');

          const result = await manager.readCourseName();

          assert.strictEqual(result, 'My Course');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when JSON is invalid', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), 'invalid json content', 'utf-8');

          const result = await manager.readCourseName();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when course_name is missing', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({}), 'utf-8');

          const result = await manager.readCourseName();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when course_name is not a string', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 123 }), 'utf-8');

          const result = await manager.readCourseName();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when course_name is empty string', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: '' }), 'utf-8');

          const result = await manager.readCourseName();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when course_name is whitespace only', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: '   ' }), 'utf-8');

          const result = await manager.readCourseName();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle unicode in course_name', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Курс Тест 课程' }), 'utf-8');

          const result = await manager.readCourseName();

          assert.strictEqual(result, 'Курс Тест 课程');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });

    suite('writeCourseName', () => {
      test('should write course name to sliman.json', async () => {
        const { manager, tempDir } = await createManagerForTest('writeCourseName');
        try {
          await manager.writeCourseName('New Course');

          const fs = await import('fs/promises');
          const content = await fs.readFile(path.join(tempDir, SLIMAN_FILENAME), 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.course_name, 'New Course');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should create valid JSON with proper formatting', async () => {
        const { manager, tempDir } = await createManagerForTest('writeCourseName');
        try {
          await manager.writeCourseName('Formatted Course');

          const fs = await import('fs/promises');
          const content = await fs.readFile(path.join(tempDir, SLIMAN_FILENAME), 'utf-8');
          const parsed = JSON.parse(content);

          assert.strictEqual(parsed.course_name, 'Formatted Course');
          // Check that it's pretty-printed (contains newlines)
          assert.ok(content.includes('\n'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should overwrite existing course_name', async () => {
        const { manager, tempDir } = await createManagerForTest('writeCourseName');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Old Course' }), 'utf-8');

          await manager.writeCourseName('Updated Course');

          const content = await fs.readFile(path.join(tempDir, SLIMAN_FILENAME), 'utf-8');
          const parsed = JSON.parse(content);

          assert.strictEqual(parsed.course_name, 'Updated Course');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });
  });

  // ============================================
  // Task 1.3.3: Slides.json Operations Tests (stored in {course_name}/ directory)
  // ============================================

  suite('Slides.json Operations (in {course_name}/ directory)', () => {
    suite('readSlidesJson', () => {
      test('should return SlidesConfig when slides.json is valid', async () => {
        const { manager, tempDir } = await createManagerForTest('readSlidesJson');
        try {
          const fs = await import('fs/promises');
          // Create sliman.json and course directory with slides.json
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          await fs.writeFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), JSON.stringify({ slides: [{ name: 'lecture-1', title: 'Lecture 1' }] }), 'utf-8');

          const result = await manager.readSlidesJson();

          assert.notStrictEqual(result, null);
          assert.strictEqual(result?.slides?.length, 1);
          assert.strictEqual(result?.slides?.[0]?.name, 'lecture-1');
          assert.strictEqual(result?.slides?.[0]?.title, 'Lecture 1');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when JSON is invalid', async () => {
        const { manager, tempDir } = await createManagerForTest('readSlidesJson');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          await fs.writeFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), 'invalid json content', 'utf-8');

          const result = await manager.readSlidesJson();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when slides.json does not exist', async () => {
        const { manager, tempDir } = await createManagerForTest('readSlidesJson');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          // Don't create course directory

          const result = await manager.readSlidesJson();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when slides field is missing', async () => {
        const { manager, tempDir } = await createManagerForTest('readSlidesJson');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          await fs.writeFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), JSON.stringify({ description: 'No slides field' }), 'utf-8');

          const result = await manager.readSlidesJson();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null when slides is not an array', async () => {
        const { manager, tempDir } = await createManagerForTest('readSlidesJson');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          // slides is a string, not an array
          await fs.writeFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), JSON.stringify({ slides: 'not an array' }), 'utf-8');

          const result = await manager.readSlidesJson();

          assert.strictEqual(result, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });

    suite('writeSlidesJson', () => {
      test('should write SlidesConfig to slides.json in {course_name}/ directory', async () => {
        const { manager, tempDir } = await createManagerForTest('writeSlidesJson');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          
          const config = { slides: [{ name: 'lecture-1', title: 'First Lecture' }] };

          await manager.writeSlidesJson(config);

          const content = await fs.readFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), 'utf-8');
          const parsed = JSON.parse(content);

          assert.strictEqual(parsed.slides.length, 1);
          assert.strictEqual(parsed.slides[0].name, 'lecture-1');
          assert.strictEqual(parsed.slides[0].title, 'First Lecture');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should create valid JSON with proper formatting', async () => {
        const { manager, tempDir } = await createManagerForTest('writeSlidesJson');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          
          const config = { slides: [{ name: 'lecture-1', title: 'Formatted Lecture' }] };

          await manager.writeSlidesJson(config);

          const content = await fs.readFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), 'utf-8');
          const parsed = JSON.parse(content);

          assert.strictEqual(parsed.slides[0].title, 'Formatted Lecture');
          // Check that it's pretty-printed (contains newlines)
          assert.ok(content.includes('\n'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });

    suite('readCourseData', () => {
      test('should return combined course data', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseData');
        try {
          const fs = await import('fs/promises');
          // Create sliman.json and course directory with slides.json
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          await fs.writeFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), JSON.stringify({ slides: [{ name: 'lecture-1', title: 'Lecture 1' }] }), 'utf-8');

          const result = await manager.readCourseData();

          assert.notStrictEqual(result, null);
          assert.strictEqual(result.courseName, 'Test Course');
          assert.strictEqual(result.slides?.slides.length, 1);
          assert.strictEqual(result.slides?.slides[0].name, 'lecture-1');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null courseName when sliman.json has no course_name', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseData');
        try {
          const fs = await import('fs/promises');
          // Create sliman.json without course_name
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({}), 'utf-8');

          const result = await manager.readCourseData();

          assert.notStrictEqual(result, null);
          assert.strictEqual(result.courseName, null);
          assert.strictEqual(result.slides, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return null slides when slides.json is missing', async () => {
        const { manager, tempDir } = await createManagerForTest('readCourseData');
        try {
          const fs = await import('fs/promises');
          // Create sliman.json but don't create course directory
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');

          const result = await manager.readCourseData();

          assert.notStrictEqual(result, null);
          assert.strictEqual(result.courseName, 'Test Course');
          assert.strictEqual(result.slides, null);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });

    suite('addLecture', () => {
      test('should add new lecture to slides.json in {course_name}/ directory', async () => {
        const { manager, tempDir } = await createManagerForTest('addLecture');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');

          await manager.addLecture('lecture-1', 'Introduction');

          const content = await fs.readFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), 'utf-8');
          const parsed = JSON.parse(content);

          assert.strictEqual(parsed.slides.length, 1);
          assert.strictEqual(parsed.slides[0].name, 'lecture-1');
          assert.strictEqual(parsed.slides[0].title, 'Introduction');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should update existing lecture in slides.json', async () => {
        const { manager, tempDir } = await createManagerForTest('addLecture');
        try {
          const fs = await import('fs/promises');
          // Create initial structure
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          await fs.writeFile(slidesJsonPath, JSON.stringify({ slides: [{ name: 'lecture-1', title: 'Old Title' }] }), 'utf-8');

          // Update the lecture
          await manager.addLecture('lecture-1', 'Updated Title');

          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);

          assert.strictEqual(parsed.slides.length, 1);
          assert.strictEqual(parsed.slides[0].title, 'Updated Title');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should add multiple lectures', async () => {
        const { manager, tempDir } = await createManagerForTest('addLecture');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          await fs.writeFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), JSON.stringify({ slides: [] }), 'utf-8');

          await manager.addLecture('lecture-1', 'First Lecture');
          await manager.addLecture('lecture-2', 'Second Lecture');

          const content = await fs.readFile(path.join(tempDir, 'Test Course', SLIDES_FILENAME), 'utf-8');
          const parsed = JSON.parse(content);

          assert.strictEqual(parsed.slides.length, 2);
          assert.strictEqual(parsed.slides[0].name, 'lecture-1');
          assert.strictEqual(parsed.slides[0].title, 'First Lecture');
          assert.strictEqual(parsed.slides[1].name, 'lecture-2');
          assert.strictEqual(parsed.slides[1].title, 'Second Lecture');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });

    suite('removeLecture', () => {
      test('should remove lecture from slides.json', async () => {
        const { manager, tempDir } = await createManagerForTest('removeLecture');
        try {
          const fs = await import('fs/promises');
          // Create initial structure
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          await fs.writeFile(slidesJsonPath, JSON.stringify({
            slides: [
              { name: 'lecture-1', title: 'First Lecture' },
              { name: 'lecture-2', title: 'Second Lecture' },
              { name: 'lecture-3', title: 'Third Lecture' }
            ]
          }), 'utf-8');

          await manager.removeLecture('lecture-2');

          // Verify lecture was removed
          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.slides.length, 2, 'Should have 2 lectures left');
          assert.strictEqual(parsed.slides[0].name, 'lecture-1');
          assert.strictEqual(parsed.slides[0].title, 'First Lecture');
          assert.strictEqual(parsed.slides[1].name, 'lecture-3');
          assert.strictEqual(parsed.slides[1].title, 'Third Lecture');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle removal of non-existent lecture', async () => {
        const { manager, tempDir } = await createManagerForTest('removeLecture');
        try {
          const fs = await import('fs/promises');
          // Create initial structure
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          await fs.writeFile(slidesJsonPath, JSON.stringify({
            slides: [
              { name: 'lecture-1', title: 'First Lecture' },
              { name: 'lecture-2', title: 'Second Lecture' }
            ]
          }), 'utf-8');

          await manager.removeLecture('nonexistent-lecture');

          // Verify slides.json unchanged
          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.slides.length, 2, 'Should still have 2 lectures');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should create empty slides array when removing last lecture', async () => {
        const { manager, tempDir } = await createManagerForTest('removeLecture');
        try {
          const fs = await import('fs/promises');
          // Create initial structure
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          await fs.writeFile(slidesJsonPath, JSON.stringify({
            slides: [
              { name: 'only-lecture', title: 'Only Lecture' }
            ]
          }), 'utf-8');

          await manager.removeLecture('only-lecture');

          // Verify slides.json has empty slides array
          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.slides.length, 0, 'Should have empty slides array');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle slides.json that does not exist', async () => {
        const { manager, tempDir } = await createManagerForTest('removeLecture');
        try {
          const fs = await import('fs/promises');
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          // Don't create course directory

          await manager.removeLecture('lecture-1');

          // Should not throw - slides.json should be created with empty slides
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.slides.length, 0, 'Should have empty slides array');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle slides.json with malformed JSON', async () => {
        const { manager, tempDir } = await createManagerForTest('removeLecture');
        try {
          const fs = await import('fs/promises');
          // Create initial structure with malformed JSON
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          await fs.writeFile(slidesJsonPath, '{ invalid json', 'utf-8');

          await manager.removeLecture('lecture-1');

          // Should not throw - should create valid empty slides.json
          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.slides.length, 0, 'Should have empty slides array');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle unicode lecture names', async () => {
        const { manager, tempDir } = await createManagerForTest('removeLecture');
        try {
          const fs = await import('fs/promises');
          // Create initial structure with unicode lecture names
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          await fs.writeFile(slidesJsonPath, JSON.stringify({
            slides: [
              { name: 'lecture-тест', title: 'Тестовая лекция' },
              { name: 'lecture-测试', title: '测试讲座' }
            ]
          }), 'utf-8');

          await manager.removeLecture('lecture-тест');

          // Verify unicode lecture was removed
          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.slides.length, 1, 'Should have 1 lecture left');
          assert.strictEqual(parsed.slides[0].name, 'lecture-测试');
          assert.strictEqual(parsed.slides[0].title, '测试讲座');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should preserve other lecture properties', async () => {
        const { manager, tempDir } = await createManagerForTest('removeLecture');
        try {
          const fs = await import('fs/promises');
          // Create initial structure with lectures that have additional properties
          await fs.writeFile(path.join(tempDir, SLIMAN_FILENAME), JSON.stringify({ course_name: 'Test Course' }), 'utf-8');
          await fs.mkdir(path.join(tempDir, 'Test Course'), { recursive: true });
          const slidesJsonPath = path.join(tempDir, 'Test Course', SLIDES_FILENAME);
          await fs.writeFile(slidesJsonPath, JSON.stringify({
            slides: [
              { name: 'lecture-1', title: 'First Lecture', description: 'Introduction', order: 1 },
              { name: 'lecture-2', title: 'Second Lecture', description: 'Main content', order: 2 }
            ]
          }), 'utf-8');

          await manager.removeLecture('lecture-1');

          // Verify remaining lecture keeps all properties
          const content = await fs.readFile(slidesJsonPath, 'utf-8');
          const parsed = JSON.parse(content);
          assert.strictEqual(parsed.slides.length, 1);
          assert.strictEqual(parsed.slides[0].name, 'lecture-2');
          assert.strictEqual(parsed.slides[0].title, 'Second Lecture');
          assert.strictEqual(parsed.slides[0].description, 'Main content');
          assert.strictEqual(parsed.slides[0].order, 2);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });
  });

  // ============================================
  // Task 1.3.4: Lecture Discovery Tests
  // ============================================

  suite('Lecture Discovery', () => {
    suite('getLectureDirectories', () => {
      test('should return only directories containing slides.md', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          // Create slides directory with multiple subdirectories
          const slidesDir = path.join(tempDir, SLIDES_DIR);
          await fs.mkdir(path.join(slidesDir, 'lecture-1'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-2'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'not-a-lecture'), { recursive: true }); // No slides.md

          // Create slides.md in lecture directories
          await fs.writeFile(path.join(slidesDir, 'lecture-1', TEMPLATE_SLIDES), '---\ntitle: Lecture 1\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-2', TEMPLATE_SLIDES), '---\ntitle: Lecture 2\n---\n# Content\n', 'utf-8');
          // No slides.md in not-a-lecture

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 2);
          assert.ok(result.includes('lecture-1'));
          assert.ok(result.includes('lecture-2'));
          assert.ok(!result.includes('not-a-lecture'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return empty array when slides directory does not exist', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          // Don't create slides directory

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 0);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return empty array when slides directory is empty', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          // Create empty slides directory
          await fs.mkdir(path.join(tempDir, SLIDES_DIR), { recursive: true });

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 0);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should exclude hidden directories', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          const slidesDir = path.join(tempDir, SLIDES_DIR);
          await fs.mkdir(path.join(slidesDir, '.hidden-lecture'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'visible-lecture'), { recursive: true });

          await fs.writeFile(path.join(slidesDir, '.hidden-lecture', TEMPLATE_SLIDES), '---\ntitle: Hidden\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'visible-lecture', TEMPLATE_SLIDES), '---\ntitle: Visible\n---\n# Content\n', 'utf-8');

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 1);
          assert.ok(result.includes('visible-lecture'));
          assert.ok(!result.includes('.hidden-lecture'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should exclude built directory', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          const slidesDir = path.join(tempDir, SLIDES_DIR);
          await fs.mkdir(path.join(slidesDir, BUILT_DIR), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'regular-lecture'), { recursive: true });

          await fs.writeFile(path.join(slidesDir, BUILT_DIR, TEMPLATE_SLIDES), '---\ntitle: Built\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'regular-lecture', TEMPLATE_SLIDES), '---\ntitle: Regular\n---\n# Content\n', 'utf-8');

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 1);
          assert.ok(result.includes('regular-lecture'));
          assert.ok(!result.includes(BUILT_DIR));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should return sorted directory names', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          const slidesDir = path.join(tempDir, SLIDES_DIR);
          // Create directories in non-alphabetical order
          await fs.mkdir(path.join(slidesDir, 'lecture-c'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-a'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-b'), { recursive: true });

          await fs.writeFile(path.join(slidesDir, 'lecture-c', TEMPLATE_SLIDES), '---\ntitle: C\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-a', TEMPLATE_SLIDES), '---\ntitle: A\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-b', TEMPLATE_SLIDES), '---\ntitle: B\n---\n# Content\n', 'utf-8');

          const result = await manager.getLectureDirectories();

          assert.deepStrictEqual(result, ['lecture-a', 'lecture-b', 'lecture-c']);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle files in slides directory (not directories)', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          const slidesDir = path.join(tempDir, SLIDES_DIR);
          await fs.mkdir(slidesDir, { recursive: true });
          // Create files (not directories)
          await fs.writeFile(path.join(slidesDir, 'random-file.md'), '# Random', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'another-file.md'), '# Another', 'utf-8');
          await fs.mkdir(path.join(slidesDir, 'valid-lecture'), { recursive: true });
          await fs.writeFile(path.join(slidesDir, 'valid-lecture', TEMPLATE_SLIDES), '---\ntitle: Valid\n---\n# Content\n', 'utf-8');

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 1);
          assert.ok(result.includes('valid-lecture'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle special characters in lecture names', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          const slidesDir = path.join(tempDir, SLIDES_DIR);
          // Lecture names with special characters
          await fs.mkdir(path.join(slidesDir, 'lecture-1'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture_2'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture.3'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-4'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture@5'), { recursive: true });

          await fs.writeFile(path.join(slidesDir, 'lecture-1', TEMPLATE_SLIDES), '---\ntitle: Lecture 1\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture_2', TEMPLATE_SLIDES), '---\ntitle: Lecture 2\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture.3', TEMPLATE_SLIDES), '---\ntitle: Lecture 3\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-4', TEMPLATE_SLIDES), '---\ntitle: Lecture 4\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture@5', TEMPLATE_SLIDES), '---\ntitle: Lecture 5\n---\n# Content\n', 'utf-8');

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 5);
          assert.ok(result.includes('lecture-1'));
          assert.ok(result.includes('lecture_2'));
          assert.ok(result.includes('lecture.3'));
          assert.ok(result.includes('lecture-4'));
          assert.ok(result.includes('lecture@5'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle unicode characters in lecture names', async () => {
        const { manager, tempDir } = await createManagerForTest('getLectureDirectories');
        try {
          const fs = await import('fs/promises');
          const slidesDir = path.join(tempDir, SLIDES_DIR);
          // Lecture names with unicode characters
          await fs.mkdir(path.join(slidesDir, 'lecture-1'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-тест'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-测试'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-🚀'), { recursive: true });
          await fs.mkdir(path.join(slidesDir, 'lecture-ábc'), { recursive: true });

          await fs.writeFile(path.join(slidesDir, 'lecture-1', TEMPLATE_SLIDES), '---\ntitle: Lecture 1\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-тест', TEMPLATE_SLIDES), '---\ntitle: Тест\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-测试', TEMPLATE_SLIDES), '---\ntitle: 测试\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-🚀', TEMPLATE_SLIDES), '---\ntitle: Rocket\n---\n# Content\n', 'utf-8');
          await fs.writeFile(path.join(slidesDir, 'lecture-ábc', TEMPLATE_SLIDES), '---\ntitle: ABC\n---\n# Content\n', 'utf-8');

          const result = await manager.getLectureDirectories();

          assert.strictEqual(result.length, 5);
          assert.ok(result.includes('lecture-1'));
          assert.ok(result.includes('lecture-тест'));
          assert.ok(result.includes('lecture-测试'));
          assert.ok(result.includes('lecture-🚀'));
          assert.ok(result.includes('lecture-ábc'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });
  });

  });