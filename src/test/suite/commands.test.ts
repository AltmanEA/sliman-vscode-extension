import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { beforeEach, afterEach, suite, test } from 'mocha';
import { createTestDir, cleanupAllTestDirs } from '../utils/testWorkspace';
import { initializeCommands } from '../../commands';
import { AVAILABLE_MODULES } from '../../constants';

suite('Commands Tests', () => {
  let outputChannel: vscode.OutputChannel;
  let extensionPath: string;

  beforeEach(async () => {
    await createTestDir('commands', 'module-selection');
    outputChannel = vscode.window.createOutputChannel('Test Channel');
    extensionPath = path.join(__dirname, '../../../'); // Path to extension root
  });

  afterEach(async () => {
    outputChannel.dispose();
    await cleanupAllTestDirs();
  });

  suite('Module Selection', () => {
    test('selectModules shows correct module options', async () => {
      initializeCommands(outputChannel, extensionPath);

      // Verify all modules are available
      assert.strictEqual(AVAILABLE_MODULES.length, 6);
      
      const moduleIds = AVAILABLE_MODULES.map(m => m.id);
      assert.ok(moduleIds.includes('shiki'));
      assert.ok(moduleIds.includes('monaco'));
      assert.ok(moduleIds.includes('drauu'));
      assert.ok(moduleIds.includes('iconify'));
      assert.ok(moduleIds.includes('katex'));
      assert.ok(moduleIds.includes('mermaid'));
    });

    test('all modules have required properties', async () => {
      initializeCommands(outputChannel, extensionPath);

      for (const module of AVAILABLE_MODULES) {
        assert.ok(module.id, 'Module must have id');
        assert.ok(module.name, 'Module must have name');
        assert.ok(module.description, 'Module must have description');
        assert.ok(Array.isArray(module.dependencies), 'Module dependencies must be array');
        assert.ok(module.dependencies.length > 0, 'Module must have at least one dependency');
        assert.ok(module.configFile, 'Module must have config file');
        assert.ok(module.defaultConfig, 'Module must have default config');
      }
    });

    test('shiki module has correct configuration', async () => {
      const shikiModule = AVAILABLE_MODULES.find(m => m.id === 'shiki');
      assert.ok(shikiModule);
      if (shikiModule && shikiModule.defaultConfig) {
        assert.strictEqual(shikiModule.dependencies[0], 'shiki');
        assert.strictEqual(shikiModule.configFile, 'shiki.config.ts');
        assert.ok(shikiModule.defaultConfig.includes('github-dark'));
        assert.ok(shikiModule.defaultConfig.includes('github-light'));
      }
    });

    test('monaco module has correct configuration', async () => {
      const monacoModule = AVAILABLE_MODULES.find(m => m.id === 'monaco');
      assert.ok(monacoModule);
      if (monacoModule && monacoModule.defaultConfig) {
        assert.ok(monacoModule.dependencies.includes('monaco-editor'));
        assert.ok(monacoModule.dependencies.includes('@slidev/preset-monaco'));
        assert.strictEqual(monacoModule.configFile, 'monaco.config.ts');
        assert.ok(monacoModule.defaultConfig.includes('monaco: true'));
      }
    });
  });

  suite('Module Configuration Files', () => {
    test('all module config files exist in template', async () => {
      const templateDir = path.join(extensionPath, 'template');
      
      const expectedConfigs = [
        'shiki.config.ts',
        'monaco.config.ts',
        'drauu.config.ts',
        'iconify.config.ts',
        'katex.config.ts',
        'mermaid.config.ts'
      ];

      for (const configFile of expectedConfigs) {
        const configPath = path.join(templateDir, configFile);
        try {
          await fs.access(configPath);
          // File exists
        } catch {
          assert.fail(`Configuration file ${configFile} does not exist in template directory`);
        }
      }
    });

    test('module config files have valid TypeScript syntax', async () => {
      const templateDir = path.join(extensionPath, 'template');
      
      const configFiles = [
        'shiki.config.ts',
        'monaco.config.ts',
        'drauu.config.ts',
        'iconify.config.ts',
        'katex.config.ts',
        'mermaid.config.ts'
      ];

      for (const configFile of configFiles) {
        const configPath = path.join(templateDir, configFile);
        try {
          const content = await fs.readFile(configPath, 'utf-8');
          
          // Basic syntax checks
          assert.ok(content.includes('import { defineConfig } from'));
          assert.ok(content.includes('export default defineConfig'));
          assert.ok(content.includes('{'));
          assert.ok(content.includes('}'));
        } catch (error) {
          assert.fail(`Failed to read or parse ${configFile}: ${error}`);
        }
      }
    });

    test('shiki config file has correct content', async () => {
      const configPath = path.join(extensionPath, 'template', 'shiki.config.ts');
      const content = await fs.readFile(configPath, 'utf-8');
      
      assert.ok(content.includes('shiki:'));
      assert.ok(content.includes('github-dark'));
      assert.ok(content.includes('github-light'));
    });

    test('monaco config file has correct content', async () => {
      const configPath = path.join(extensionPath, 'template', 'monaco.config.ts');
      const content = await fs.readFile(configPath, 'utf-8');
      
      assert.ok(content.includes('monaco: true'));
      assert.ok(content.includes('vs-dark'));
    });
  });
});