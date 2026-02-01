/**
 * Transliteration utility - Converts Cyrillic text to Latin folder names
 * 
 * Used for creating lecture directory names from user-provided titles
 * that may contain Cyrillic characters and special symbols.
 */

/**
 * Mapping of Cyrillic characters to Latin equivalents
 */
const CYRILLIC_MAP: Record<string, string> = {
  // Russian letters
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
  ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'ju', я: 'ja',
  
  // Uppercase variants
  А: 'a', Б: 'b', В: 'v', Г: 'g', Д: 'd', Е: 'e', Ё: 'yo',
  Ж: 'zh', З: 'z', И: 'i', Й: 'j', К: 'k', Л: 'l', М: 'm',
  Н: 'n', О: 'o', П: 'p', Р: 'r', С: 's', Т: 't', У: 'u',
  Ф: 'f', Х: 'h', Ц: 'c', Ч: 'ch', Ш: 'sh', Щ: 'sch',
  Ъ: '', Ы: 'y', Ь: '', Э: 'e', Ю: 'ju', Я: 'ja',
};

/**
 * Special symbols mapping
 */
const SYMBOL_MAP: Record<string, string> = {
  ' ': '-', '_': '-', '.': '-',
  ',': '-', ';': '-', ':': '-',
  '!': '', '?': '', '@': '-at-',
  '#': '-hash-', '$': '', '%': '-percent-',
  '&': '-and-', '*': '-', '+': '-plus-',
  '=': '-eq-', '<': '-lt-', '>': '-gt-',
  '/': '-', '\\': '-', '|': '-',
  '[': '-', ']': '', '{': '', '}': '',
  '(': '', ')': '', '"': '', "'": '',
  '`': '', '~': '-', '^': '-',
};

/**
 * Transliterates a string to a valid Latin folder name
 * @param input - The input string (may contain Cyrillic, spaces, special chars)
 * @returns A valid Latin folder name with only alphanumeric chars and hyphens
 */
export function transliterate(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let result = '';

  for (const char of input) {
    // Check Cyrillic map first
    if (CYRILLIC_MAP[char]) {
      result += CYRILLIC_MAP[char];
    }
    // Check special symbols
    else if (SYMBOL_MAP[char]) {
      result += SYMBOL_MAP[char];
    }
    // Keep alphanumeric Latin characters as-is
    else if (/[a-zA-Z0-9]/.test(char)) {
      result += char;
    }
    // Replace unknown characters with hyphens
    else {
      result += '-';
    }
  }

  // Clean up multiple consecutive hyphens
  result = result.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, '');
  
  // Convert to lowercase
  result = result.toLowerCase();

  // If result is empty, generate a timestamp-based name
  if (!result) {
    result = `lecture-${Date.now()}`;
  }

  return result;
}

/**
 * Generates a valid lecture folder name from a title
 * @param title - The lecture title provided by user
 * @returns A valid folder name (e.g., "about-our-company")
 */
export function generateLectureFolderName(title: string): string {
  const transliterated = transliterate(title);
  
  // Limit length to avoid overly long folder names
  const MAX_LENGTH = 64;
  if (transliterated.length > MAX_LENGTH) {
    return transliterated.substring(0, MAX_LENGTH).replace(/-+$/g, '');
  }
  
  return transliterated || `lecture-${Date.now()}`;
}

/**
 * Validates that a string is a valid folder name
 * @param name - The folder name to validate
 * @returns True if the name is valid (non-empty, Latin, no forbidden chars)
 */
export function isValidFolderName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Check for empty or whitespace-only
  if (name.trim() === '') {
    return false;
  }

  // Check for valid characters (Latin alphanumeric and hyphens)
  const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  return validPattern.test(name);
}

/**
 * Validates course name for compatibility with all operating systems
 * @param courseName - The course name to validate
 * @returns Validation result with isValid flag and error message
 */
export interface CourseNameValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validates course name for cross-platform compatibility and URL usage
 * @param courseName - The course name to validate
 * @returns Validation result with isValid flag and error message
 */
export function validateCourseName(courseName: string): CourseNameValidation {
  if (!courseName || typeof courseName !== 'string') {
    return {
      isValid: false,
      error: 'Course name cannot be empty'
    };
  }

  const trimmedName = courseName.trim();

  if (trimmedName.length === 0) {
    return {
      isValid: false,
      error: 'Course name cannot be empty'
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: 'Course name must be 100 characters or less'
    };
  }

  // Check for Cyrillic characters
  const cyrillicPattern = /[а-яё]/i;
  if (cyrillicPattern.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Course name must not contain Cyrillic characters. Use only Latin letters, numbers, and hyphens.'
    };
  }

  // Check for spaces
  if (/\s/.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Course name cannot contain spaces. Use hyphens to separate words.'
    };
  }

  // Additional forbidden characters check for cross-platform compatibility
  const forbiddenChars = /[<>:"/\\|?*]/;
  if (forbiddenChars.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Course name cannot contain forbidden characters: < > : " / \\ | ? *'
    };
  }

  // Check for reserved Windows names (case-insensitive)
  const reservedNames = [
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
  ];

  const nameWithoutExtension = trimmedName.split('.')[0].toLowerCase();
  if (reservedNames.includes(nameWithoutExtension)) {
    return {
      isValid: false,
      error: `Course name cannot be a reserved name: ${reservedNames.join(', ')}`
    };
  }

  // Check for valid characters (Latin alphanumeric, hyphens, dots, underscores)
  // No spaces allowed - suitable for URL paths
  const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9\-._]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  if (!validPattern.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Course name must contain only Latin letters, numbers, hyphens, dots, and underscores. It cannot start or end with special characters.'
    };
  }

  return {
    isValid: true
  };
}