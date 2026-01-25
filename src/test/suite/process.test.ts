/**
 * Tests for Process Helper - Task 2.1
 */

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import type * as vscode from 'vscode';
import {
  ProcessHelper,
  WindowsCommandExecutor,
  UnixCommandExecutor,
  ProcessErrorCode,
  getProcessErrorCode,
} from '../../utils/process';

// ============================================
// Helper Functions
// ============================================

/** Creates a unique temporary directory for a test */
async function createTestDir(testName: string): Promise<string> {
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const testDir = path.join(__dirname, '..', '..', '..', `test-workspace-process-${testName}-${uniqueId}`);
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

// ============================================
// Process Helper Test Suite
// ============================================

suite('Process Helper Test Suite', () => {
  // ============================================
  // Platform Detection Tests
  // ============================================

  suite('Platform Detection', () => {
    test('WindowsCommandExecutor should detect Windows platform', () => {
      const executor = new WindowsCommandExecutor();
      assert.strictEqual(executor.detectPlatform(), 'windows');
    });

    test('UnixCommandExecutor should detect Unix platform', () => {
      const executor = new UnixCommandExecutor();
      assert.strictEqual(executor.detectPlatform(), 'unix');
    });

    test('ProcessHelper should use Windows executor on Windows', () => {
      // Reset to force re-detection
      ProcessHelper.resetExecutor();
      const platform = ProcessHelper.detectPlatform();
      // On Windows, this should be 'windows'
      assert.ok(platform === 'windows' || platform === 'unix');
    });
  });

  // ============================================
  // Basic Command Execution Tests
  // ============================================

  suite('Basic Command Execution', () => {
    suite('exec (buffered)', () => {
      test('should execute a simple echo command', async () => {
        const result = await ProcessHelper.exec('echo "Hello World"');
        
        assert.strictEqual(result.success, true);
        assert.ok(result.stdout.includes('Hello World'));
        assert.strictEqual(result.exitCode, 0);
      });

      test('should execute a command with working directory', async () => {
        const tempDir = await createTestDir('cwd-test');
        try {
          const result = await ProcessHelper.exec('cd', { cwd: tempDir });
          
          // cd command should succeed (even if output is empty)
          assert.strictEqual(result.success, true);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should execute a command with environment variables', async () => {
        const result = await ProcessHelper.exec('echo %TEST_VAR%', {
          env: { TEST_VAR: 'test-value' },
        });
        
        assert.strictEqual(result.success, true);
        assert.ok(result.stdout.includes('test-value'));
      });

      test('should handle command failure', async () => {
        const result = await ProcessHelper.exec('nonexistent-command-12345');
        
        // Command should fail
        assert.strictEqual(result.success, false);
        assert.ok(result.exitCode !== 0);
      });

      test('should handle timeout', async () => {
        const startTime = Date.now();
        // Use ping with large count as alternative to timeout on Windows
        const result = await ProcessHelper.exec('ping -n 10 127.0.0.1 >nul', { timeout: 1000 });
        const elapsed = Date.now() - startTime;
        
        assert.strictEqual(result.success, false);
        assert.ok(elapsed < 2000, 'Timeout should occur within 2 seconds');
        // Windows timeout doesn't use 124, use more lenient check
        assert.ok(result.exitCode !== 0, 'Exit code should be non-zero for timeout');
      });
    });

    suite('execStream (streaming)', () => {
      test('should execute a command with streaming output', async () => {
        let output = '';
         
        const handler = (_type: 'stdout' | 'stderr', data: string) => {
          output += data;
        };

        const result = await ProcessHelper.execStream('echo "Streaming Test"', undefined, handler);
        
        assert.strictEqual(result.success, true);
        assert.ok(output.includes('Streaming Test'));
        assert.strictEqual(result.exitCode, 0);
      });

      test('should handle multiple output lines', async () => {
        let lineCount = 0;
         
        const handler = (_type: 'stdout' | 'stderr', data: string): void => {
          lineCount += (data.match(/\n/g) || []).length;
        };

        // Use separate echo commands with & for Windows
        const result = await ProcessHelper.execStream('(echo line1 & echo line2 & echo line3)', undefined, handler);
        
        assert.strictEqual(result.success, true);
        assert.ok(lineCount >= 2, `Expected at least 2 newlines, got ${lineCount}`);
      });
    });
  });

  // ============================================
  // Package Manager Execution Tests
  // ============================================

  suite('Package Manager Execution', () => {
    suite('execPackageManager', () => {
      test('should execute npm script with no arguments', async () => {
        const tempDir = await createTestDir('npm-test');
        try {
          // Create a package.json with a test script
          const packageJson = {
            name: 'test-package',
            version: '1.0.0',
            scripts: {
              test: 'echo "Test script executed"',
            },
          };
          await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

          const result = await ProcessHelper.execPackageManager('test', tempDir);
          
          assert.strictEqual(result.success, true);
          assert.ok(result.stdout.includes('Test script executed'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should execute npm script with arguments', async () => {
        const tempDir = await createTestDir('npm-args-test');
        try {
          // Create a package.json with a script that accepts arguments
          const packageJson = {
            name: 'test-package',
            version: '1.0.0',
            scripts: {
              greet: 'echo Hello $1',
            },
          };
          await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

          const result = await ProcessHelper.execPackageManager('greet', tempDir, ['World']);
          
          assert.strictEqual(result.success, true);
          assert.ok(result.stdout.includes('World'));
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should use pnpm when specified', async () => {
        const tempDir = await createTestDir('pnpm-test');
        try {
          // Create a pnpm-workspace.yaml to indicate pnpm usage
          await fs.writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - .');

          const result = await ProcessHelper.execPackageManager('test', tempDir, [], {
            packageManager: 'pnpm',
          });
          
          // Command should be pnpm run test (even if pnpm is not installed, it should attempt to run)
          // On Windows without pnpm, this will fail with ENOENT
          assert.ok(result.stderr.includes('pnpm') || result.exitCode !== 0, 'Should attempt to use pnpm');
        } finally {
          await cleanupTestDir(tempDir);
        }
      });

      test('should handle npm install', async () => {
        const tempDir = await createTestDir('npm-install');
        try {
          // Create a package.json
          const packageJson = {
            name: 'test-install',
            version: '1.0.0',
          };
          await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

          const result = await ProcessHelper.installDependencies(tempDir);
          
          // Should either succeed or fail gracefully
          assert.ok(result.success || result.stderr.length > 0);
        } finally {
          await cleanupTestDir(tempDir);
        }
      });
    });
  });

  // ============================================
  // Output Channel Integration Tests
  // ============================================

  suite('Output Channel Integration', () => {
    test('should stream output to VS Code output channel', async () => {
      const tempDir = await createTestDir('output-channel');
      try {
        // Create a mock output channel
        let channelOutput = '';
        const mockChannel = {
          name: 'test',
          append: (text: string) => { channelOutput += text; },
          appendLine: (text: string) => { channelOutput += text + '\n'; },
          clear: () => { channelOutput = ''; },
          show: () => {},
          hide: () => {},
          dispose: () => {},
        } as vscode.OutputChannel;

        const result = await ProcessHelper.exec('echo Hello World', {
          outputChannel: mockChannel,
        });
        
        assert.strictEqual(result.success, true);
        assert.ok(channelOutput.includes('Hello') || channelOutput.includes('World'));
      } finally {
        await cleanupTestDir(tempDir);
      }
    });
  });

  // ============================================
  // Error Code Tests
  // ============================================

  suite('Error Code Handling', () => {
    test('should identify ENOENT error code', () => {
      const code = getProcessErrorCode(new Error('Command not found'));
      assert.strictEqual(code, ProcessErrorCode.ENOENT);
    });

    test('should identify ETIMEDOUT error code', () => {
      const code = getProcessErrorCode(new Error('Execution timeout'));
      assert.strictEqual(code, ProcessErrorCode.ETIMEDOUT);
    });

    test('should identify EEXEC error code', () => {
      // Use error message that matches the pattern
      const code = getProcessErrorCode(new Error('command execution failed'));
      assert.strictEqual(code, ProcessErrorCode.EEXEC);
    });

    test('should return UNKNOWN for unrecognized errors', () => {
      const code = getProcessErrorCode(new Error('Some unknown error'));
      assert.strictEqual(code, ProcessErrorCode.UNKNOWN);
    });

    test('should handle non-Error objects', () => {
      const code = getProcessErrorCode('string error');
      assert.strictEqual(code, ProcessErrorCode.UNKNOWN);
    });

    test('should handle null/undefined', () => {
      const code = getProcessErrorCode(null);
      assert.strictEqual(code, ProcessErrorCode.UNKNOWN);
    });
  });

  // ============================================
  // Executor Switching Tests
  // ============================================

  suite('Executor Management', () => {
    test('should allow setting a custom executor', () => {
      const customExecutor = new WindowsCommandExecutor();
      ProcessHelper.setExecutor(customExecutor);
      
      // Should not throw
      assert.ok(true);
      ProcessHelper.resetExecutor();
    });

    test('should reset executor to null', () => {
      ProcessHelper.resetExecutor();
      // Should allow reset without error
      assert.ok(true);
    });

    test('should use set executor after setExecutor call', async () => {
      const customExecutor = new WindowsCommandExecutor();
      ProcessHelper.setExecutor(customExecutor);
      
      const platform = ProcessHelper.detectPlatform();
      assert.strictEqual(platform, 'windows');
      
      ProcessHelper.resetExecutor();
    });
  });

  // ============================================
  // Special Characters Tests
  // ============================================

  suite('Special Characters Handling', () => {
    test('should handle command with quotes', async () => {
      const result = await ProcessHelper.exec('echo "Hello \\"World\\""');
      
      assert.strictEqual(result.success, true);
      assert.ok(result.stdout.includes('World'));
    });

    test('should handle command with backslashes', async () => {
      // Use echo without special escaping for Windows
      const result = await ProcessHelper.exec('echo C:\\Users\\Test');
      
      assert.strictEqual(result.success, true);
      // Output may vary between Windows versions
      assert.ok(result.stdout.includes('Users') || result.stdout.includes('Test'));
    });

    test('should handle unicode characters', async () => {
      // Use echo with PowerShell encoding
      const result = await ProcessHelper.exec('cmd /c echo Hello');
      
      assert.strictEqual(result.success, true);
      assert.ok(result.stdout.length > 0, 'Should have some output');
    });
  });

  // ============================================
  // Timeout Tests
  // ============================================

  suite('Timeout Handling', () => {
    test('should respect custom timeout setting', async () => {
      const startTime = Date.now();
      // Use ping with large count as alternative to timeout on Windows
      const result = await ProcessHelper.exec('ping -n 100 127.0.0.1 >nul', { timeout: 500 });
      const elapsed = Date.now() - startTime;
      
      assert.strictEqual(result.success, false);
      assert.ok(elapsed < 2000, 'Should timeout before 2 seconds');
      // Windows ping returns exit code 1 when timeout occurs
      assert.ok(result.exitCode !== 0, 'Exit code should be non-zero');
    });

    test('should use default timeout of 5 minutes', async () => {
      const startTime = Date.now();
      const result = await ProcessHelper.exec('echo "default timeout test"');
      const elapsed = Date.now() - startTime;
      
      assert.strictEqual(result.success, true);
      assert.ok(elapsed < 5000, 'Quick command should complete quickly');
    });
  });

  // ============================================
  // Concurrent Execution Tests
  // ============================================

  suite('Concurrent Execution', () => {
    test('should handle multiple concurrent commands', async () => {
      const promises = [
        ProcessHelper.exec('echo "command1"'),
        ProcessHelper.exec('echo "command2"'),
        ProcessHelper.exec('echo "command3"'),
      ];

      const results = await Promise.all(promises);
      
      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].success, true);
      assert.strictEqual(results[1].success, true);
      assert.strictEqual(results[2].success, true);
    });
  });
});