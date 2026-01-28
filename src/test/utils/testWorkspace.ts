/**
 * Unified test utilities for managing temporary test directories.
 * All tests should use these functions instead of creating their own.
 */

import * as path from 'path';
import * as fs from 'fs/promises';

// Registry of created test directories for centralized cleanup
const createdDirectories: Set<string> = new Set();

/**
 * Creates a unique temporary directory for tests.
 * Format: test-workspace-{category}-{testName}-{uniqueId}
 * 
 * @param category - Category prefix (e.g., 'manager', 'build', 'process')
 * @param testName - Descriptive name for the test (e.g., 'path-resolution')
 * @returns Path to the created temporary directory
 */
export async function createTestDir(category: string, testName: string): Promise<string> {
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const testDir = path.join(__dirname, '..', '..', '..', `test-workspace-${category}-${testName}-${uniqueId}`);
  await fs.mkdir(testDir, { recursive: true });
  
  // Register for centralized cleanup
  createdDirectories.add(testDir);
  
  return testDir;
}

/**
 * Cleans up a specific test directory.
 * 
 * @param tempDir - Path to the directory to clean up
 */
export async function cleanupTestDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    createdDirectories.delete(tempDir);
  } catch (error) {
    console.warn(`Failed to cleanup test directory: ${tempDir}`, error);
  }
}

/**
 * Cleans up all test directories created during test execution.
 * Should be called in suiteTeardown of the main test file.
 */
export async function cleanupAllTestDirs(): Promise<void> {
  const testDir = path.join(__dirname, '..', '..', '..');
  
  try {
    const entries = await fs.readdir(testDir);
    const testWorkspaces = entries.filter(entry => 
      entry.startsWith('test-workspace-')
    );
    
    for (const dir of testWorkspaces) {
      try {
        const dirPath = path.join(testDir, dir);
        await fs.rm(dirPath, { recursive: true, force: true });
        createdDirectories.delete(dirPath);
      } catch {
        // Ignore errors during cleanup
      }
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Gets the count of created test directories (for debugging).
 */
export function getCreatedDirectoriesCount(): number {
  return createdDirectories.size;
}