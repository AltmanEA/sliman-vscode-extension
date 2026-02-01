/**
 * Tests for translit utility module
 */

import * as assert from 'assert';
import {
  transliterate,
  generateLectureFolderName,
  isValidFolderName,
  validateCourseName,
} from '../../utils/translit';

suite('translit', () => {
  suite('transliterate()', () => {
    test('should return empty string for null input', () => {
      assert.strictEqual(transliterate(null as unknown as string), '');
    });

    test('should return empty string for undefined input', () => {
      assert.strictEqual(transliterate(undefined as unknown as string), '');
    });

    test('should return empty string for empty string', () => {
      assert.strictEqual(transliterate(''), '');
    });

    test('should transliterate Russian letters to Latin', () => {
      assert.strictEqual(transliterate('привет'), 'privet');
      assert.strictEqual(transliterate('Привет'), 'privet');
      assert.strictEqual(transliterate('здравствуй'), 'zdravstvuj');
      // Leading/trailing whitespace converted to hyphens, then trimmed
      assert.strictEqual(transliterate(' Москва '), 'moskva');
    });

    test('should handle special characters', () => {
      assert.strictEqual(transliterate('hello world'), 'hello-world');
      assert.strictEqual(transliterate('test@email.com'), 'test-at-email-com');
      assert.strictEqual(transliterate('price: $100'), 'price-100');
      assert.strictEqual(transliterate('a & b'), 'a-and-b');
    });

    test('should keep Latin alphanumeric characters as-is', () => {
      assert.strictEqual(transliterate('hello123'), 'hello123');
      assert.strictEqual(transliterate('ABCdef'), 'abcdef');
    });

    test('should replace unknown characters with hyphens', () => {
      // Unknown chars replaced with hyphens, then trailing hyphen trimmed
      assert.strictEqual(transliterate('test❤️'), 'test');
      // All unknown chars result in empty string, which falls back to timestamp-based name
      const result = transliterate('日本');
      assert.ok(result.startsWith('lecture-'));
    });

    test('should clean up multiple consecutive hyphens', () => {
      assert.strictEqual(transliterate('test   spaces'), 'test-spaces');
      assert.strictEqual(transliterate('test---dashes'), 'test-dashes');
    });

    test('should convert to lowercase', () => {
      assert.strictEqual(transliterate('HELLO'), 'hello');
      assert.strictEqual(transliterate('Привет'), 'privet');
    });

    test('should remove leading and trailing hyphens', () => {
      assert.strictEqual(transliterate('  hello  '), 'hello');
      assert.strictEqual(transliterate('-hello-'), 'hello');
    });

    test('should handle complex Cyrillic text', () => {
      assert.strictEqual(transliterate('О компании'), 'o-kompanii');
      assert.strictEqual(transliterate('Контакты'), 'kontakty');
    });
  });

  suite('generateLectureFolderName()', () => {
    test('should generate folder name from title', () => {
      assert.strictEqual(generateLectureFolderName('О компании'), 'o-kompanii');
    });

    test('should limit length to 64 characters', () => {
      const longTitle = 'a'.repeat(100);
      const result = generateLectureFolderName(longTitle);
      assert.strictEqual(result.length, 64);
    });

    test('should return timestamp-based name for empty input', () => {
      const result = generateLectureFolderName('');
      assert.ok(result.startsWith('lecture-'));
    });

    test('should handle mixed content', () => {
      // # is converted to -hash-, : is converted to -
      assert.strictEqual(
        generateLectureFolderName('Lesson #1: Introduction'),
        'lesson-hash-1-introduction'
      );
    });
  });

  suite('isValidFolderName()', () => {
    test('should return false for null', () => {
      assert.strictEqual(isValidFolderName(null as unknown as string), false);
    });

    test('should return false for undefined', () => {
      assert.strictEqual(isValidFolderName(undefined as unknown as string), false);
    });

    test('should return false for empty string', () => {
      assert.strictEqual(isValidFolderName(''), false);
    });

    test('should return false for whitespace-only string', () => {
      assert.strictEqual(isValidFolderName('   '), false);
    });

    test('should return true for valid folder names', () => {
      assert.strictEqual(isValidFolderName('hello'), true);
      assert.strictEqual(isValidFolderName('hello-world'), true);
      assert.strictEqual(isValidFolderName('lecture-1'), true);
      assert.strictEqual(isValidFolderName('a1'), true);
    });

    test('should return false for names starting with hyphen', () => {
      assert.strictEqual(isValidFolderName('-hello'), false);
    });

    test('should return false for names with invalid characters', () => {
      assert.strictEqual(isValidFolderName('hello world'), false);
      assert.strictEqual(isValidFolderName('привет'), false);
      assert.strictEqual(isValidFolderName('hello!'), false);
    });

    test('should return false for single special character', () => {
      assert.strictEqual(isValidFolderName('-'), false);
      assert.strictEqual(isValidFolderName(' '), false);
    });

    test('should return true for single alphanumeric character', () => {
      assert.strictEqual(isValidFolderName('a'), true);
      assert.strictEqual(isValidFolderName('1'), true);
    });
  });

  suite('validateCourseName()', () => {
    test('should return invalid for null input', () => {
      const result = validateCourseName(null as unknown as string);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name cannot be empty');
    });

    test('should return invalid for undefined input', () => {
      const result = validateCourseName(undefined as unknown as string);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name cannot be empty');
    });

    test('should return invalid for empty string', () => {
      const result = validateCourseName('');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name cannot be empty');
    });

    test('should return invalid for whitespace-only string', () => {
      const result = validateCourseName('   ');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name cannot be empty');
    });

    test('should return invalid for names longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = validateCourseName(longName);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name must be 100 characters or less');
    });

    test('should return invalid for names with Cyrillic characters', () => {
      const result = validateCourseName('Привет мир');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name must not contain Cyrillic characters. Use only Latin letters, numbers, and hyphens.');
    });

    test('should return invalid for names with spaces', () => {
      const result = validateCourseName('Hello World');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name cannot contain spaces. Use hyphens to separate words.');
    });

    test('should return invalid for names with forbidden characters', () => {
      const forbiddenChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
      forbiddenChars.forEach(char => {
        const result = validateCourseName(`test${char}name`);
        assert.strictEqual(result.isValid, false);
        assert.ok(result.error?.includes('forbidden characters'));
      });
    });

    test('should return invalid for reserved Windows names', () => {
      const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1'];
      reservedNames.forEach(name => {
        const result = validateCourseName(name);
        assert.strictEqual(result.isValid, false);
        assert.ok(result.error?.includes('reserved name'));
      });
    });

    test('should return invalid for names starting with hyphen', () => {
      const result = validateCourseName('-hello');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error?.includes('cannot start or end with special characters'));
    });

    test('should return invalid for names ending with hyphen', () => {
      const result = validateCourseName('hello-');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error?.includes('cannot start or end with special characters'));
    });

    test('should return valid for valid course names', () => {
      const validNames = [
        'Introduction-To-TypeScript',
        'web-development-course',
        'ReactBasics',
        'course123',
        'a',
        'a1',
        'course-name-with-hyphens',
        'course.name.with.dots',
        'Course_Name_With_Underscores',
        'intro-to-typescript',
        'web-dev-basics',
        'javascript-fundamentals'
      ];

      validNames.forEach(name => {
        const result = validateCourseName(name);
        assert.strictEqual(result.isValid, true, `Expected "${name}" to be valid`);
        assert.strictEqual(result.error, undefined, `Expected "${name}" to have no error`);
      });
    });

    test('should trim whitespace but still reject spaces in content', () => {
      const result = validateCourseName('  hello world  ');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error?.includes('cannot contain spaces'));
    });

    test('should trim whitespace and accept valid content', () => {
      const result = validateCourseName('  hello-world  ');
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.error, undefined);
    });

    test('should handle mixed valid and invalid characters', () => {
      const result = validateCourseName('Hello@World!');
      assert.strictEqual(result.isValid, false);
      // @ is not in the forbidden list but fails the valid pattern check
      assert.ok(result.error?.includes('Latin letters'));
    });

    test('should handle course name with dots (not reserved)', () => {
      const result = validateCourseName('my.course.name');
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.error, undefined);
    });

    test('should handle exactly 100 characters', () => {
      const exactly100 = 'a'.repeat(100);
      const result = validateCourseName(exactly100);
      assert.strictEqual(result.isValid, true);
    });

    test('should handle exactly 101 characters', () => {
      const exactly101 = 'a'.repeat(101);
      const result = validateCourseName(exactly101);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.error, 'Course name must be 100 characters or less');
    });

    test('should produce URL-safe names', () => {
      const testNames = [
        { input: 'intro-to-typescript', expected: 'URL-safe' },
        { input: 'web-dev-course', expected: 'URL-safe' },
        { input: 'course.name', expected: 'URL-safe' },
        { input: 'course_name', expected: 'URL-safe' }
      ];

      testNames.forEach(({ input, expected }) => {
        const result = validateCourseName(input);
        assert.strictEqual(result.isValid, true, `${input} should be ${expected}`);
        // Verify no spaces, special URL characters, etc.
        assert.ok(!result.error, `${input} should have no errors`);
      });
    });
  });
});