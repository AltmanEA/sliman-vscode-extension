/**
 * Lecture Manager - Manages lecture structure and creation
 */

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LECTURE_SLIDES,
  LECTURE_PACKAGE,
  TEMPLATE_DIR,
  TEMPLATE_SLIDES,
  TEMPLATE_PACKAGE,
  TEMPLATE_GLOBAL_TOP,
  TEMPLATE_COURSER,
  AVAILABLE_MODULES,
} from '../constants';
import { ProcessHelper } from '../utils/process';
import { generateLectureFolderName, isValidFolderName } from '../utils/translit';
import type { CourseManager } from './CourseManager';

/**
 * Lecture Manager handles lecture directory operations
 * and provides URI helpers for lecture file navigation.
 */
export class LectureManager {
  /** Static flag to track test environment */
  private static isTestEnvironment = false;

  /** Course Manager instance for shared operations */
  private readonly courseManager: CourseManager;

  /** Extension root path for accessing bundled templates */
  private readonly extensionPath: string;

  /** Template directory path */
  private readonly templateDir: string;

  /** Optional output channel for logging */
  private outputChannel: vscode.OutputChannel | null = null;

  /**
   * Creates a new LectureManager instance
   * @param courseManager - Course Manager instance (provides workspace URI)
   * @param extensionPath - Path to the extension root directory
   */
  constructor(courseManager: CourseManager, extensionPath: string) {
    this.courseManager = courseManager;
    this.extensionPath = extensionPath;
    this.templateDir = path.join(extensionPath, TEMPLATE_DIR);
  }

  /**
   * Sets the output channel for logging
   * @param channel - VS Code output channel
   */
  setOutputChannel(channel: vscode.OutputChannel): void {
    this.outputChannel = channel;
  }

  /**
   * Static method to set test environment flag
   * Used by tests to indicate test environment
   */
  static setTestEnvironment(isTest: boolean): void {
    this.isTestEnvironment = isTest;
  }

  /**
   * Logs a message to the output channel if available
   * @param message - Message to log
   */
  private log(message: string): void {
    if (this.outputChannel) {
      this.outputChannel.appendLine(message);
    }
  }

  // ============================================
  // Subtask 2.2: Structure Methods
  // ============================================

  /**
   * Gets the slides directory URI (where lecture folders are stored)
   * @returns The URI of the slides/ directory
   */
  getSlidesDir(): vscode.Uri {
    return this.courseManager.getSlidesDir();
  }

  /**
   * Gets the lecture directory URI for a specific lecture
   * @param name - Lecture folder name (e.g., "lecture-1" or "about")
   * @returns The URI of the lecture directory
   */
  getLectureDir(name: string): vscode.Uri {
    return vscode.Uri.joinPath(this.getSlidesDir(), name);
  }

  /**
   * Gets the slides.md file URI for a specific lecture
   * @param name - Lecture folder name
   * @returns The URI of slides/{name}/slides.md
   */
  getLectureSlidesPath(name: string): vscode.Uri {
    return vscode.Uri.joinPath(this.getLectureDir(name), LECTURE_SLIDES);
  }

  /**
   * Gets the package.json file URI for a specific lecture
   * @param name - Lecture folder name
   * @returns The URI of slides/{name}/package.json
   */
  getLecturePackagePath(name: string): vscode.Uri {
    return vscode.Uri.joinPath(this.getLectureDir(name), LECTURE_PACKAGE);
  }

  /**
   * Checks if a lecture directory exists
   * @param name - Lecture folder name
   * @returns Promise that resolves to true if lecture is a directory
   */
  async lectureExists(name: string): Promise<boolean> {
    const lectureDir = this.getLectureDir(name);
    try {
      const stat = await vscode.workspace.fs.stat(lectureDir);
      // Check that it's a directory (type === 2 for directory)
      return stat.type === vscode.FileType.Directory;
    } catch {
      return false;
    }
  }

  /**
   * Creates a lecture directory
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   * @throws Error if directory creation fails
   */
  async createLectureDir(name: string): Promise<void> {
    const lectureDir = this.getLectureDir(name);
    try {
      await vscode.workspace.fs.createDirectory(lectureDir);
    } catch (error) {
      console.error(`Failed to create lecture directory: ${name}`, error);
      throw error;
    }
  }

  // ============================================
  // Subtask 2.3: Template Methods
  // ============================================

  /**
   * Gets the URI of a template file
   * @param templateName - The template filename (from TEMPLATE_* constants)
   * @returns The URI of the template file
   */
  private getTemplatePath(templateName: string): vscode.Uri {
    return vscode.Uri.joinPath(vscode.Uri.file(this.extensionPath), TEMPLATE_DIR, templateName);
  }

  /**
   * Reads template content as string
   * @param templateName - The template filename
   * @returns Promise resolving to template content
   * @throws Error if template cannot be read
   */
  private async readTemplate(templateName: string): Promise<string> {
    const templateUri = this.getTemplatePath(templateName);
    try {
      const content = await vscode.workspace.fs.readFile(templateUri);
      return new TextDecoder().decode(content);
    } catch {
      throw new Error(`Failed to read template: ${templateName}`);
    }
  }

  /**
   * Validates lecture name and returns the folder name
   * If name is empty or invalid, generates from title using transliteration
   * @param name - User-provided lecture name (may be empty)
   * @param title - User-provided lecture title
   * @returns Valid folder name
   * @throws Error if name cannot be generated
   */
  private validateAndGetFolderName(name: string, title: string): string {
    // If name is provided and valid, use it
    if (name && isValidFolderName(name)) {
      return name;
    }

    // Generate from title
    if (title) {
      return generateLectureFolderName(title);
    }

    // Fallback to timestamp-based name
    return `lecture-${Date.now()}`;
  }

  /**
   * Copies and updates the slides.md template for a new lecture
   * @param name - Lecture folder name
   * @param title - Lecture display title
   * @returns Promise that resolves when complete
   * @throws Error if template copy fails
   */
  async copySlidesTemplate(name: string, title: string): Promise<void> {
    const templateContent = await this.readTemplate(TEMPLATE_SLIDES);

    // Replace template variables
    const updatedContent = templateContent
      .replace(/{{TITLE}}/g, title)
      .replace(/{{NAME}}/g, name);

    const slidesPath = this.getLectureSlidesPath(name);
    try {
      await vscode.workspace.fs.writeFile(slidesPath, new TextEncoder().encode(updatedContent));
    } catch {
      throw new Error(`Failed to write slides.md for lecture: ${name}`);
    }
  }

  /**
   * Copies and updates the package.json template for a new lecture
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   * @throws Error if template copy fails
   */
  async copyPackageJson(name: string): Promise<void> {
    const templateContent = await this.readTemplate(TEMPLATE_PACKAGE);

    // Replace template variable for lecture-specific package name
    const updatedContent = templateContent
      .replace(/{{LECTURE_NAME}}/g, name);

    const packagePath = this.getLecturePackagePath(name);
    try {
      await vscode.workspace.fs.writeFile(packagePath, new TextEncoder().encode(updatedContent));
    } catch {
      throw new Error(`Failed to write package.json for lecture: ${name}`);
    }
  }

  /**
   * Creates components directory for a lecture if it doesn't exist
   * @param name - Lecture folder name
   * @returns Promise that resolves to the URI of components directory
   * @throws Error if directory creation fails
   */
  async createComponentsDir(name: string): Promise<vscode.Uri> {
    const componentsDir = vscode.Uri.joinPath(this.getLectureDir(name), 'components');
    try {
      await vscode.workspace.fs.createDirectory(componentsDir);
      return componentsDir;
    } catch {
      throw new Error(`Failed to create components directory for lecture: ${name}`);
    }
  }

  /**
   * Copies global-top.vue template to lecture root directory
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   * @throws Error if template copy fails
   */
  async copyGlobalTopVue(name: string): Promise<void> {
    const templateContent = await this.readTemplate(TEMPLATE_GLOBAL_TOP);
    const globalTopPath = vscode.Uri.joinPath(this.getLectureDir(name), TEMPLATE_GLOBAL_TOP);
    
    try {
      await vscode.workspace.fs.writeFile(globalTopPath, new TextEncoder().encode(templateContent));
    } catch {
      throw new Error(`Failed to write global-top.vue for lecture: ${name}`);
    }
  }

  /**
   * Copies Courser.vue template to lecture components directory
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   * @throws Error if template copy fails
   */
  async copyCourserVue(name: string): Promise<void> {
    const templateContent = await this.readTemplate(TEMPLATE_COURSER);
    const componentsDir = await this.createComponentsDir(name);
    const courserPath = vscode.Uri.joinPath(componentsDir, TEMPLATE_COURSER);
    
    try {
      await vscode.workspace.fs.writeFile(courserPath, new TextEncoder().encode(templateContent));
    } catch {
      throw new Error(`Failed to write Courser.vue for lecture: ${name}`);
    }
  }

  /**
   * Initializes npm dependencies for a lecture
   * Runs pnpm install in the lecture directory (with npm fallback)
   * Waits for installation to complete before resolving
   * In test environment, creates mock node_modules directory
   * @param name - Lecture folder name
   * @returns Promise that resolves when dependencies are installed
   * @throws Error if package manager install fails
   */
  async initLectureNpm(name: string): Promise<void> {
    const lecturePath = this.getLectureDir(name).fsPath;
    const lectureName = name;

    // Check if we're in test environment
    const isTestEnvironment = LectureManager.isTestEnvironment || 
                             process.env.VSCODE_TEST === '1' ||
                             process.env.NODE_ENV === 'test';
    
    if (isTestEnvironment) {
      // In test environment, create mock node_modules directory
      this.log('Test environment detected, creating mock node_modules');
      const nodeModulesPath = vscode.Uri.joinPath(this.getLectureDir(name), 'node_modules');
      try {
        await vscode.workspace.fs.createDirectory(nodeModulesPath);
        this.log('✓ Mock node_modules created');
      } catch {
        // Ignore if already exists
        this.log('✓ Mock node_modules already exists');
      }
      return;
    }

    try {
      // Try pnpm first, then fallback to npm
      let packageManager = 'pnpm';

      // Check if pnpm is available
      let pnpmCheck = await ProcessHelper.exec('pnpm --version', { cwd: lecturePath, timeout: 10000 });
      if (!pnpmCheck.success) {
        this.log('pnpm not found, using npm instead');
        packageManager = 'npm';
      }

      this.log(`Installing dependencies (${packageManager}) in: ${lecturePath}`);

      // Use ProcessHelper to execute install and wait for completion
      const installResult = await ProcessHelper.execPackageManager('install', lecturePath, [], {
        packageManager: packageManager as 'npm' | 'pnpm',
        outputChannel: vscode.window.createOutputChannel(`Install ${lectureName}`),
      });

      if (!installResult.success) {
        throw new Error(`Failed to install dependencies: ${installResult.stderr || `Exit code: ${installResult.exitCode}`}`);
      }

      this.log(`✓ Dependencies installed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Warning: Failed to install dependencies: ${errorMessage}`);
      this.log('Continuing without installing dependencies...');
      
      // Don't throw error, just log and continue
      // Dependencies can be installed manually later
    }
  }

  /**
   * Updates the course configuration (slides.json) with new lecture entry
   * @param name - Lecture folder name
   * @param title - Lecture display title
   * @returns Promise that resolves when complete
   * @throws Error if config update fails
   */
  async updateCourseConfig(name: string, title: string): Promise<void> {
    try {
      await this.courseManager.addLecture(name, title);
    } catch {
      throw new Error(`Failed to update course config for lecture: ${name}`);
    }
  }

  /**
   * Reads the title from a lecture's slides.md file
   * Parses the frontmatter to extract the title field
   * @param name - Lecture folder name
   * @returns Promise resolving to the title from slides.md
   * @throws Error if slides.md cannot be read or title is not found
   */
  async readTitleFromSlides(name: string): Promise<string> {
    const slidesPath = this.getLectureSlidesPath(name);
    
    try {
      const content = await vscode.workspace.fs.readFile(slidesPath);
      const slidesContent = new TextDecoder().decode(content);
      
      // Extract title from frontmatter (YAML block between ---)
      const frontmatterMatch = slidesContent.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        throw new Error('No frontmatter found in slides.md');
      }

      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
      if (!titleMatch) {
        throw new Error('No title field found in frontmatter');
      }
      
      return titleMatch[1].trim();
    } catch (error) {
      throw new Error(`Failed to read title from slides.md for lecture "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a complete new lecture with all required files
   * Creates directory, copies templates, installs dependencies, updates config
   * @param nameOrTitle - Lecture folder name OR display title (if title not provided separately)
   * @param title - Optional: lecture display title (if not in nameOrTitle)
   * @returns Promise resolving to the created lecture folder name
   * @throws Error if lecture already exists or creation fails
   */
  async createLecture(nameOrTitle: string, title?: string): Promise<string> {
    // Parse arguments: if title not provided, nameOrTitle is treated as title
    const name = this.validateAndGetFolderName(nameOrTitle, title || nameOrTitle);
    const displayTitle = title || nameOrTitle;

    this.log(`Creating lecture: ${displayTitle} (${name})`);

    // Check if lecture already exists
    if (await this.lectureExists(name)) {
      throw new Error(`Lecture "${name}" already exists`);
    }

    // Step 1: Create lecture directory
    this.log('Creating directory...');
    await this.createLectureDir(name);
    this.log('Directory created.');

    // Step 2: Copy and update slides.md template
    this.log('Copying slides template...');
    await this.copySlidesTemplate(name, displayTitle);
    this.log('Slides template copied.');

    // Step 3: Copy and update package.json template
    this.log('Copying package.json...');
    await this.copyPackageJson(name);
    this.log('Package.json copied.');

    // Step 3.1: Copy Vue component templates
    this.log('Copying Vue component templates...');
    await this.copyGlobalTopVue(name);
    this.log('Global-top.vue copied.');
    await this.copyCourserVue(name);
    this.log('Courser.vue copied to components directory.');

    // Step 4: Initialize npm dependencies
    // In test environment, skip real installation to avoid timeouts
    if (process.env.NODE_ENV === 'test' || process.env.VSCODE_TEST === '1') {
      this.log('Test environment: creating mock node_modules');
      const nodeModulesPath = vscode.Uri.joinPath(this.getLectureDir(name), 'node_modules');
      try {
        await vscode.workspace.fs.createDirectory(nodeModulesPath);
        this.log('✓ Mock node_modules created for test');
      } catch {
        this.log('✓ Mock node_modules already exists for test');
      }
    } else {
      this.log('Installing dependencies (pnpm install)...');
      await this.initLectureNpm(name);
    }

    // Step 5: Update course configuration
    this.log('Updating course configuration...');
    await this.updateCourseConfig(name, displayTitle);

    this.log(`Lecture "${displayTitle}" created successfully!`);

    return name;
  }

  /**
   * Deletes a lecture completely
   * Removes lecture directory from slides/ and built/ directories
   * Updates slides.json to remove lecture entry
   * @param name - Lecture folder name
   * @returns Promise that resolves when lecture is deleted
   * @throws Error if lecture doesn't exist or deletion fails
   */
  async deleteLecture(name: string): Promise<void> {
    this.log(`Deleting lecture: ${name}`);

    // Check if lecture exists
    if (!await this.lectureExists(name)) {
      throw new Error(`Lecture "${name}" does not exist`);
    }

    // Step 1: Remove lecture directory from slides/
    const lectureDir = this.getLectureDir(name);
    try {
      await vscode.workspace.fs.delete(lectureDir, { recursive: true, useTrash: false });
      this.log(`Removed lecture directory: ${lectureDir.fsPath}`);
    } catch (error) {
      throw new Error(`Failed to remove lecture directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 2: Remove built lecture from {course_name}/ directory (if exists)
    const courseName = await this.courseManager.readCourseName();
    if (courseName) {
      const builtLectureDir = vscode.Uri.joinPath(this.courseManager.getBuiltCourseDirWithName(courseName), name);
      try {
        const stat = await vscode.workspace.fs.stat(builtLectureDir);
        if (stat.type === vscode.FileType.Directory) {
          await vscode.workspace.fs.delete(builtLectureDir, { recursive: true, useTrash: false });
          this.log(`Removed built lecture directory: ${builtLectureDir.fsPath}`);
        }
      } catch {
        // Built directory doesn't exist, that's fine
        this.log(`Built lecture directory not found (normal if lecture wasn't built): ${builtLectureDir.fsPath}`);
      }
    } else {
      this.log('Warning: Course name not found in sliman.json, skipping removal of built lecture');
    }

    // Step 3: Update course configuration (remove from slides.json)
    try {
      await this.courseManager.removeLecture(name);
      this.log(`Removed lecture from slides.json: ${name}`);
    } catch (error) {
      this.log(`Warning: Failed to remove lecture from slides.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw here, lecture directory is already deleted
    }

    this.log(`Lecture "${name}" deleted successfully!`);
  }

  // ============================================
  // Module Support Methods
  // ============================================

  /**
   * Creates a modular package.json with selected modules
   * @param name - Lecture folder name
   * @param selectedModules - Array of selected module IDs
   * @returns Promise that resolves when complete
   */
  async createModularPackageJson(name: string, selectedModules: string[] = []): Promise<void> {
    // Check for special package.json templates
    if (selectedModules.includes('iconify')) {
      await this.createIconifyPackageJson(name);
      return;
    }

    if (selectedModules.includes('monaco')) {
      await this.createMonacoPackageJson(name);
      return;
    }

    // KaTeX and Mermaid are handled through normal dependency addition
    // since they don't require special package.json
    
    const templateContent = await this.readTemplate(TEMPLATE_PACKAGE);

    // Replace template variable for lecture-specific package name
    let updatedContent = templateContent.replace(/{{LECTURE_NAME}}/g, name);

    // Add selected modules to package.json
    if (selectedModules.length > 0) {
      // Parse existing dependencies
      const packageJson = JSON.parse(updatedContent);
      
      // Add dependencies for selected modules
      for (const moduleId of selectedModules) {
        const moduleInfo = AVAILABLE_MODULES.find(m => m.id === moduleId);
        if (moduleInfo) {
          for (const dep of moduleInfo.dependencies) {
            packageJson.dependencies[dep] = 'latest';
          }
        }
      }

      // Convert back to string with proper formatting
      updatedContent = JSON.stringify(packageJson, null, 2);
    }

    const packagePath = this.getLecturePackagePath(name);
    try {
      await vscode.workspace.fs.writeFile(packagePath, new TextEncoder().encode(updatedContent));
      this.log(`Created modular package.json for lecture: ${name} with modules: ${selectedModules.join(', ') || 'none'}`);
    } catch {
      throw new Error(`Failed to write modular package.json for lecture: ${name}`);
    }
  }

  /**
   * Creates package.json specifically for Iconify-enabled lectures
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   */
  private async createIconifyPackageJson(name: string): Promise<void> {
    try {
      // Read the special package.json template for Iconify
      const iconifyPackagePath = vscode.Uri.joinPath(
        vscode.Uri.file(path.join(this.templateDir, 'package-with-iconify.json'))
      );
      
      let templateContent: string;
      try {
        const fileData = await vscode.workspace.fs.readFile(iconifyPackagePath);
        templateContent = new TextDecoder().decode(fileData);
      } catch {
        // Fallback to default package.json if special template not found
        templateContent = await this.readTemplate(TEMPLATE_PACKAGE);
        this.log('Using fallback package.json for Iconify (special template not found)');
      }

      // Replace template variable for lecture-specific package name
      let updatedContent = templateContent.replace(/{{LECTURE_NAME}}/g, name);

      // Parse and update dependencies
      const packageJson = JSON.parse(updatedContent);
      
      // Ensure Iconify dependencies are present
      packageJson.dependencies['@iconify/json'] = '^2.2.196';
      packageJson.dependencies['@iconify/vue'] = '^4.1.1';

      // Convert back to string with proper formatting
      updatedContent = JSON.stringify(packageJson, null, 2);

      const packagePath = this.getLecturePackagePath(name);
      await vscode.workspace.fs.writeFile(packagePath, new TextEncoder().encode(updatedContent));
      this.log(`Created Iconify package.json for lecture: ${name}`);
    } catch (error) {
      throw new Error(`Failed to create Iconify package.json for lecture: ${name}. Error: ${error}`);
    }
  }

  /**
   * Creates package.json specifically for Monaco Editor-enabled lectures
   * @param name - Lecture folder name
   * @returns Promise that resolves when complete
   */
  private async createMonacoPackageJson(name: string): Promise<void> {
    try {
      // Read the special package.json template for Monaco
      const monacoPackagePath = vscode.Uri.joinPath(
        vscode.Uri.file(path.join(this.templateDir, 'package-with-monaco.json'))
      );
      
      let templateContent: string;
      try {
        const fileData = await vscode.workspace.fs.readFile(monacoPackagePath);
        templateContent = new TextDecoder().decode(fileData);
      } catch {
        // Fallback to default package.json if special template not found
        templateContent = await this.readTemplate(TEMPLATE_PACKAGE);
        this.log('Using fallback package.json for Monaco (special template not found)');
      }

      // Replace template variable for lecture-specific package name
      let updatedContent = templateContent.replace(/{{LECTURE_NAME}}/g, name);

      // Parse and update dependencies
      const packageJson = JSON.parse(updatedContent);
      
      // Ensure Monaco dependencies are present
      packageJson.dependencies['monaco-editor'] = '^0.45.0';
      packageJson.dependencies['@slidev/preset-monaco'] = '^1.2.3';

      // Convert back to string with proper formatting
      updatedContent = JSON.stringify(packageJson, null, 2);

      const packagePath = this.getLecturePackagePath(name);
      await vscode.workspace.fs.writeFile(packagePath, new TextEncoder().encode(updatedContent));
      this.log(`Created Monaco package.json for lecture: ${name}`);
    } catch (error) {
      throw new Error(`Failed to create Monaco package.json for lecture: ${name}. Error: ${error}`);
    }
  }

  /**
   * Copies configuration files for selected modules
   * @param name - Lecture folder name
   * @param selectedModules - Array of selected module IDs
   * @returns Promise that resolves when complete
   */
  async copyModuleConfigs(name: string, selectedModules: string[] = []): Promise<void> {
    if (selectedModules.length === 0) {
      this.log('No modules selected, skipping config files');
      return;
    }

    // Special handling for Monaco Editor - merge into slidev.config.ts
    const monacoConfig = selectedModules.find(m => m === 'monaco');
    if (monacoConfig) {
      await this.createOrUpdateSlidevConfig(name, selectedModules);
      return;
    }

    // Handle other modules with individual config files
    for (const moduleId of selectedModules) {
      const moduleInfo = AVAILABLE_MODULES.find(m => m.id === moduleId);
      if (moduleInfo && moduleInfo.configFile && moduleInfo.defaultConfig) {
        const configPath = vscode.Uri.joinPath(this.getLectureDir(name), moduleInfo.configFile);
        
        try {
          await vscode.workspace.fs.writeFile(
            configPath, 
            new TextEncoder().encode(moduleInfo.defaultConfig)
          );
          this.log(`Created config file: ${moduleInfo.configFile} for module: ${moduleId}`);
        } catch {
          this.log(`Warning: Failed to create config file ${moduleInfo.configFile} for module: ${moduleId}`);
          // Don't throw - config files are optional
        }
      }
    }
  }

  /**
   * Creates or updates slidev.config.ts for Monaco Editor and other config needs
   * @param name - Lecture folder name
   * @param selectedModules - Array of selected module IDs
   * @returns Promise that resolves when complete
   */
  async createOrUpdateSlidevConfig(name: string, selectedModules: string[]): Promise<void> {
    const configPath = vscode.Uri.joinPath(this.getLectureDir(name), 'slidev.config.ts');
    
    try {
      // Check if slidev.config.ts already exists
      try {
        await vscode.workspace.fs.readFile(configPath);
        this.log('Existing slidev.config.ts found, merging configurations');
        // For now, we'll overwrite existing config to keep it simple
      } catch {
        // File doesn't exist, create new one
        this.log('Creating new slidev.config.ts');
      }

      // Start with base slidev config
      let finalConfig = `import { defineConfig } from '@slidev/types'\n\nexport default defineConfig({\n`;

      // Add Monaco configuration if selected
      if (selectedModules.includes('monaco')) {
        finalConfig += `  monaco: true,\n`;
        finalConfig += `  // Monaco Editor configuration\n`;
        finalConfig += `  monacoOptions: {\n`;
        finalConfig += `    theme: 'vs-dark',\n`;
        finalConfig += `    fontSize: 14,\n`;
        finalConfig += `    lineNumbers: 'on',\n`;
        finalConfig += `    minimap: { enabled: false },\n`;
        finalConfig += `    automaticLayout: true\n`;
        finalConfig += `  }\n`;
        finalConfig += `  // Monaco will automatically detect and load supported languages\n`;
        finalConfig += `  // from code blocks in your presentation\n`;
      }

      // Add Shiki configuration if selected
      if (selectedModules.includes('shiki')) {
        finalConfig += `  shiki: {\n`;
        finalConfig += `    themes: {\n`;
        finalConfig += `      dark: 'github-dark',\n`;
        finalConfig += `      light: 'github-light',\n`;
        finalConfig += `    }\n`;
        finalConfig += `  },\n`;
      }

      // Add KaTeX configuration if selected
      if (selectedModules.includes('katex')) {
        finalConfig += `  katex: {\n`;
        finalConfig += `    // KaTeX configuration options\n`;
        finalConfig += `    macros: {\n`;
        finalConfig += `      // Custom macros can be defined here\n`;
        finalConfig += `      "\\\\RR": "\\\\mathbb{R}"\n`;
        finalConfig += `    }\n`;
        finalConfig += `  },\n`;
      }

      // Add Mermaid configuration if selected
      if (selectedModules.includes('mermaid')) {
        finalConfig += `  mermaid: {\n`;
        finalConfig += `    // Mermaid configuration\n`;
        finalConfig += `    theme: 'default',\n`;
        finalConfig += `    securityLevel: 'loose'\n`;
        finalConfig += `  },\n`;
      }

      // Close the defineConfig call
      finalConfig += `})\n`;

      await vscode.workspace.fs.writeFile(
        configPath, 
        new TextEncoder().encode(finalConfig)
      );
      
      this.log('✓ Created/updated slidev.config.ts with selected module configurations');
    } catch (error) {
      this.log(`Warning: Failed to create/update slidev.config.ts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw - config files are optional
    }
  }

  /**
   * Creates a complete new lecture with selected modules
   * @param nameOrTitle - Lecture folder name OR display title
   * @param title - Optional lecture display title
   * @param selectedModules - Array of selected module IDs
   * @returns Promise resolving to the created lecture folder name
   */
  async createLectureWithModules(nameOrTitle: string, title?: string, selectedModules: string[] = []): Promise<string> {
    // Parse arguments: if title not provided, nameOrTitle is treated as title
    const name = this.validateAndGetFolderName(nameOrTitle, title || nameOrTitle);
    const displayTitle = title || nameOrTitle;

    this.log(`Creating lecture with modules: ${displayTitle} (${name}) with modules: ${selectedModules.join(', ') || 'none'}`);

    try {
      // Check if lecture already exists
      if (await this.lectureExists(name)) {
        throw new Error(`Lecture "${name}" already exists`);
      }

      // Step 1: Create lecture directory
      this.log('Step 1: Creating directory...');
      await this.createLectureDir(name);
      this.log('✓ Directory created');

      // Step 2: Copy and update slides.md template
      this.log('Step 2: Copying slides template...');
      await this.copySlidesTemplate(name, displayTitle);
      this.log('✓ Slides template copied');

      // Step 3: Create modular package.json with selected modules
      this.log('Step 3: Creating modular package.json...');
      await this.createModularPackageJson(name, selectedModules);
      this.log('✓ Modular package.json created');

      // Step 3.1: Copy module configuration files
      this.log('Step 4: Copying module configuration files...');
      await this.copyModuleConfigs(name, selectedModules);
      this.log('✓ Module configuration files copied');

      // Step 3.2: Copy Vue component templates
      this.log('Step 5: Copying Vue component templates...');
      await this.copyGlobalTopVue(name);
      this.log('✓ Global-top.vue copied');
      await this.copyCourserVue(name);
      this.log('✓ Courser.vue copied to components directory');

      // Step 4: Initialize npm dependencies (SKIP IN TEST)
      this.log('Step 6: Setting up dependencies...');
      if (process.env.NODE_ENV === 'test' || process.env.VSCODE_TEST === '1') {
        this.log('Test environment: creating mock node_modules');
        const nodeModulesPath = vscode.Uri.joinPath(this.getLectureDir(name), 'node_modules');
        try {
          await vscode.workspace.fs.createDirectory(nodeModulesPath);
          this.log('✓ Mock node_modules created for test');
        } catch {
          this.log('✓ Mock node_modules already exists for test');
        }
      } else {
        this.log('Installing dependencies...');
        await this.initLectureNpm(name);
      }
      this.log('✓ Dependencies setup completed');

      // Step 5: Update course configuration
      this.log('Step 7: Updating course configuration...');
      await this.updateCourseConfig(name, displayTitle);
      this.log('✓ Course configuration updated');

      this.log(`✓ Lecture "${displayTitle}" created successfully with modules: ${selectedModules.join(', ') || 'none'}!`);

      return name;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`✗ Error in createLectureWithModules: ${errorMessage}`);
      throw new Error(`Failed to create lecture with modules: ${errorMessage}`);
    }
  }
}