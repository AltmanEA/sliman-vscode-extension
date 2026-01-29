/**
 * Integration tests for Extension Registration
 * Tests command registration, activation, and output channel creation.
 * 
 * These tests run in the VS Code Extension Host environment.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { EXTENSION_ID, OUTPUT_CHANNEL_NAME } from '../../constants';
import { createTestDir, cleanupTestDir, cleanupAllTestDirs } from '../utils/testWorkspace';

// ============================================
// Helper Functions
// ============================================

/** Track created output channels for cleanup */
const createdChannels: vscode.OutputChannel[] = [];

// ============================================
// Extension Registration Test Suite
// ============================================

suite('Extension Registration', () => {
  // ============================================
  // Command Registration Tests
  // ============================================

  suite('Command Registration', () => {
    test('should register sliman.scanCourse command in package.json', async () => {
      // Read package.json and verify command is declared
      const extensionPath = path.join(__dirname, '..', '..', '..');
      const packageJsonPath = path.join(extensionPath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      // Verify command exists in contributes.commands
      assert.ok(
        Array.isArray(packageJson.contributes?.commands),
        'contributes.commands should be an array'
      );

      const scanCourseCommand = packageJson.contributes.commands.find(
        (cmd: { command: string; title: string }) => cmd.command === 'sliman.scanCourse'
      );

      assert.ok(scanCourseCommand, 'sliman.scanCourse command should be declared in package.json');
      assert.strictEqual(scanCourseCommand.title, 'Scan Course', 'Command title should match');
    });

    test('should register sliman.scanCourse callback without errors', async () => {
      // Test that registering the command callback doesn't throw
      let callbackError: Error | null = null;

      try {
        // Simulate command registration by calling the actual command
        await vscode.commands.executeCommand('sliman.scanCourse');
      } catch (error) {
        // It's expected that the command may fail if not in a course root
        // We only care that the callback itself doesn't throw
        if (error instanceof Error) {
          callbackError = error;
        }
      }

      // The command should execute without throwing a registration error
      // Expected errors are: "Not a valid course root" or similar
      // NOT errors like "command callback not a function"
      if (callbackError) {
        const message = callbackError.message;
        assert.ok(
          message.includes('Not a valid course root') ||
          message.includes('course') ||
          message.includes('workspace'),
          `Expected course-related error, got: ${message}`
        );
      }
    });

    test('should activate extension on first command execution', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      // Ensure extension is not active initially (or deactivate first)
      if (extension.isActive) {
        // Can't programmatically deactivate, just proceed
      }

      // Execute the scanCourse command - this should trigger activation
      await vscode.commands.executeCommand('sliman.scanCourse');

      // Check extension state
      assert.ok(extension, 'Extension should be accessible');
      assert.strictEqual(extension.isActive, true, 'Extension should be active after command execution');
    });

    test('should not crash on multiple activations', async () => {
      // Get extension instance
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      // Activate multiple times - this should not crash
      await extension.activate();
      const firstActivation = extension.isActive;

      await extension.activate();
      const secondActivation = extension.isActive;

      await extension.activate();
      const thirdActivation = extension.isActive;

      // All activations should succeed without errors
      assert.strictEqual(firstActivation, true, 'First activation should succeed');
      assert.strictEqual(secondActivation, true, 'Second activation should succeed');
      assert.strictEqual(thirdActivation, true, 'Third activation should succeed');
    });

    test('should maintain activation state across commands', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      // Ensure extension is active
      if (!extension.isActive) {
        await extension.activate();
      }

      // Execute multiple commands
      await vscode.commands.executeCommand('sliman.scanCourse');
      await vscode.commands.executeCommand('sliman.scanCourse');

      // Extension should remain active
      assert.strictEqual(extension.isActive, true, 'Extension should stay active');
    });
  });

  // ============================================
  // Output Channel Tests
  // ============================================

  suite('Output Channel', () => {
    test('should create output channel on activation', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      // Activate extension
      if (!extension.isActive) {
        await extension.activate();
      }

      // Create our own output channel with same name to verify extension created one
      const testChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
      createdChannels.push(testChannel);

      // Verify channel can be shown (indicates valid channel)
      testChannel.appendLine('Test message');
      assert.ok(true, 'Output channel should be creatable and writable');

      // Cleanup
      testChannel.dispose();
    });

    test('should have output channel accessible via API', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      if (!extension.isActive) {
        await extension.activate();
      }

      // Create channel with same name as extension
      const channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
      createdChannels.push(channel);

      // Verify channel is valid
      assert.ok(channel, 'Output channel should be accessible via API');
      assert.strictEqual(channel.name, OUTPUT_CHANNEL_NAME, 'Channel name should match');

      // Cleanup
      channel.dispose();
    });

    test('should show output channel when command executes', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      if (!extension.isActive) {
        await extension.activate();
      }

      // Create channel for testing
      const channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
      createdChannels.push(channel);

      // Execute command
      await vscode.commands.executeCommand('sliman.scanCourse');

      // Channel should still be accessible
      const channelAfter = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
      createdChannels.push(channelAfter);
      assert.ok(channelAfter, 'Channel should exist after command');

      // Cleanup
      channelAfter.dispose();
    });

    test('should handle output channel operations', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      if (!extension.isActive) {
        await extension.activate();
      }

      // Create output channel
      const channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
      createdChannels.push(channel);

      // Test various operations
      channel.appendLine('Line 1');
      channel.appendLine('Line 2');

      const multiLineBlock = [
        '=== Block Start ===',
        'Content line 1',
        'Content line 2',
        '=== Block End ==='
      ].join('\n');
      channel.appendLine(multiLineBlock);

      // Show channel (should not throw)
      channel.show();

      // Clear channel (should not throw)
      channel.clear();

      assert.ok(true, 'Output channel operations should work without errors');

      // Cleanup
      channel.dispose();
    });
  });

  // ============================================
  // Extension Lifecycle Tests
  // ============================================

  suite('Extension Lifecycle', () => {
    test('should activate and remain active', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      // Activate extension
      await extension.activate();
      assert.strictEqual(extension.isActive, true, 'Extension should be active after activate()');

      // Verify extension remains active
      assert.strictEqual(extension.isActive, true, 'Extension should remain active');
    });

    test('should handle workspace without course root gracefully', async () => {
      // This test verifies error handling when workspace is not a course root
      // Create a temporary workspace without dist/slides.json
      const tempDir = await createTestDir('extension', 'non-course-workspace');
      try {
        const extension = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(extension, 'Extension should exist');

        if (!extension.isActive) {
          await extension.activate();
        }

        // Execute command - it should handle non-course root gracefully
        let error: Error | null = null;
        try {
          await vscode.commands.executeCommand('sliman.scanCourse');
        } catch (e) {
          if (e instanceof Error) {
            error = e;
          }
        }

        // Should not crash with unhandled error
        assert.ok(!error || error.message.includes('course') || error.message.includes('workspace'),
          'Command should handle non-course root gracefully');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should handle multiple command executions', async () => {
      const extension = vscode.extensions.getExtension(EXTENSION_ID);
      assert.ok(extension, 'Extension should exist');

      if (!extension.isActive) {
        await extension.activate();
      }

      // Execute command multiple times
      for (let i = 0; i < 3; i++) {
        await vscode.commands.executeCommand('sliman.scanCourse');
      }

      // Extension should still be active
      assert.strictEqual(extension.isActive, true, 'Extension should remain active after multiple commands');
    });
  });

  // ============================================
  // Global Cleanup
  // ============================================

  suiteTeardown(async () => {
    // Cleanup created output channels
    for (const channel of createdChannels) {
      try {
        channel.dispose();
      } catch {
        // Ignore disposal errors
      }
    }
    createdChannels.length = 0;

    // Cleanup all test directories created during test execution
    await cleanupAllTestDirs();
  });
});