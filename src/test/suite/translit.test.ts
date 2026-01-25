/**
 * Tests for translit utility module
 */

import * as assert from 'assert';
import {
  transliterate,
  generateLectureFolderName,
  isValidFolderName,
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
});