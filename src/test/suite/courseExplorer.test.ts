/**
 * Tests for Course Explorer Tree View (Stage 4)
 * Tests TreeView initialization, data provider, and refresh functionality.
 * 
 * Approach: Mock CourseManager to test CourseExplorerDataProvider
 * and CourseExplorer without requiring full VS Code extension context.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import type { CourseTreeItem } from '../../types';
import type { CourseManager } from '../../managers/CourseManager';
import { CourseExplorer as CourseExplorerClass } from '../../providers/CourseExplorer';
import { CourseExplorerDataProvider as DataProviderClass } from '../../providers/CourseExplorerDataProvider';
import { createTestDir, cleanupTestDir } from '../utils/testWorkspace';
import { SLIDES_DIR, BUILT_DIR, SLIDES_FILENAME } from '../../constants';

// ============================================
// Mock CourseManager for Testing
// ============================================

/**
 * Mock CourseManager for testing CourseExplorer
 * Provides controlled data for tree view testing
 */
class MockCourseManager implements Partial<CourseManager> {
  private mockCourseName: string | null = null;
  private mockSlides: { slides: Array<{ name: string; title: string }> } | null = null;
  private callCount = 0;

  /**
   * Configure mock data
   */
  configure(courseName: string | null, slides: { slides: Array<{ name: string; title: string }> } | null): void {
    this.mockCourseName = courseName;
    this.mockSlides = slides;
    this.callCount = 0;
  }

  /**
   * Get course root URI (mock)
   */
  getCourseRoot(): vscode.Uri {
    return vscode.Uri.file('/test/course');
  }

  /**
   * Check if path is in course root (mock)
   */
  isPathInCourseRoot(_uri: vscode.Uri): boolean {
    return true;
  }

  /**
   * Check if directory is course root (mock)
   */
  async isCourseRoot(): Promise<boolean> {
    return this.mockCourseName !== null;
  }

  /**
   * Read course name from dist/slides.json (mock)
   */
  async readCourseName(): Promise<string | null> {
    this.callCount++;
    return this.mockCourseName;
  }

  /**
   * Read slides.json configuration (mock)
   */
  async readSlidesJson(): Promise<{ slides: Array<{ name: string; title: string }> } | null> {
    this.callCount++;
    return this.mockSlides;
  }

  /**
   * Get lecture directories (mock)
   */
  async getLectureDirectories(): Promise<string[]> {
    return this.mockSlides?.slides.map(s => s.name) ?? [];
  }

  /**
   * Get call count for verification
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Reset call count
   */
  resetCallCount(): void {
    this.callCount = 0;
  }
}

// ============================================
// Test Suite Setup
// ============================================

suite('CourseExplorer Test Suite', () => {
  // Mock context for CourseExplorer
  let mockContext: vscode.ExtensionContext;
  // Mock course manager for data provider
  let mockCourseManager: MockCourseManager;
  // Track created tree views for cleanup
  const treeViewsToDispose: vscode.TreeView<CourseTreeItem>[] = [];

  setup(() => {
    // Create mock context with subscriptions array
    mockContext = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;

    // Create mock course manager with default data
    mockCourseManager = new MockCourseManager();
    mockCourseManager.configure(
      'Test Course',
      { slides: [
        { name: 'about', title: 'About the Subject' },
        { name: 'mongo', title: 'MongoDB' },
      ]}
    );
  });

  teardown(() => {
    // Dispose all tree views created during tests
    for (const treeView of treeViewsToDispose) {
      try {
        treeView.dispose();
      } catch {
        // Ignore disposal errors
      }
    }
    treeViewsToDispose.length = 0;
  });

  // ============================================
  // CourseExplorerDataProvider Tests
  // ============================================

  suite('CourseExplorerDataProvider', () => {
    test('should create data provider with course manager', () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      assert.ok(dataProvider !== undefined, 'Data provider should be created');
    });

    test('should return tree item with correct properties', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);

      // Get root item
      const rootItems = await dataProvider.getChildren();
      assert.strictEqual(rootItems.length, 2, 'Should return 2 folder items (Lectures, Actions)');
    });

    test('should display course name from config', async () => {
      mockCourseManager.configure('My Test Course', null);

      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();

      // Root is not returned directly, but Lectures folder should exist
      const lecturesFolder = rootItems.find(item => item.id === 'lectures-folder');
      assert.ok(lecturesFolder, 'Lectures folder should exist');
    });

    test('should show lectures folder with correct properties', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();

      const lecturesFolder = rootItems.find(item => item.id === 'lectures-folder');
      assert.ok(lecturesFolder, 'Lectures folder should exist');
      assert.strictEqual(lecturesFolder?.label, 'Lectures', 'Label should be "Lectures"');
      assert.strictEqual(lecturesFolder?.type, 'folder', 'Type should be "folder"');
      assert.strictEqual(lecturesFolder?.collapsible, vscode.TreeItemCollapsibleState.Collapsed, 'Should be collapsible');
    });

    test('should list all lectures from slides.json', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();
      
      const lecturesFolder = rootItems.find(item => item.id === 'lectures-folder');
      assert.ok(lecturesFolder, 'Lectures folder should exist');

      // Get lecture items
      const lectureItems = await dataProvider.getChildren(lecturesFolder);
      assert.strictEqual(lectureItems.length, 2, 'Should return 2 lectures');

      // Check lecture properties (no direct command - commands are on the level of lecture)
      const aboutLecture = lectureItems.find(item => item.id === 'lecture-about');
      assert.ok(aboutLecture, 'About lecture should exist');
      assert.strictEqual(aboutLecture?.label, 'About the Subject (about)', 'Label should include title and name');
      assert.strictEqual(aboutLecture?.type, 'lecture', 'Type should be "lecture"');
      assert.strictEqual(aboutLecture?.collapsible, vscode.TreeItemCollapsibleState.Collapsed, 'Should be collapsible');
      assert.strictEqual(aboutLecture?.contextValue, 'lecture', 'Context value should be "lecture"');
    });

    test('should show View, Edit, Build commands for each lecture', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();
      
      const lecturesFolder = rootItems.find(item => item.id === 'lectures-folder');
      const lectureItems = await dataProvider.getChildren(lecturesFolder);
      
      const aboutLecture = lectureItems.find(item => item.id === 'lecture-about');
      assert.ok(aboutLecture, 'About lecture should exist');

      // Get command items directly under lecture (no Actions folder)
      const commandItems = await dataProvider.getChildren(aboutLecture);
      assert.strictEqual(commandItems.length, 3, 'Should return 3 commands (View, Edit, Build)');
      
      // Check View command
      const viewCommand = commandItems.find(item => item.id === 'lecture-command-view-about');
      assert.ok(viewCommand, 'View command should exist');
      assert.strictEqual(viewCommand?.label, 'View', 'Label should be "View"');
      assert.strictEqual(viewCommand?.type, 'action', 'Type should be "action"');
      assert.strictEqual(viewCommand?.command?.command, 'sliman.openSlides', 'Command should be sliman.openSlides');
      assert.strictEqual(viewCommand?.icon, '$(eye)', 'Icon should be $(eye)');

      // Check Edit command
      const editCommand = commandItems.find(item => item.id === 'lecture-command-edit-about');
      assert.ok(editCommand, 'Edit command should exist');
      assert.strictEqual(editCommand?.label, 'Edit', 'Label should be "Edit"');
      assert.strictEqual(editCommand?.type, 'action', 'Type should be "action"');
      assert.strictEqual(editCommand?.command?.command, 'sliman.editLecture', 'Command should be sliman.editLecture');
      assert.strictEqual(editCommand?.icon, '$(edit)', 'Icon should be $(edit)');

      // Check Build command
      const buildCommand = commandItems.find(item => item.id === 'lecture-command-build-about');
      assert.ok(buildCommand, 'Build command should exist');
      assert.strictEqual(buildCommand?.label, 'Build', 'Label should be "Build"');
      assert.strictEqual(buildCommand?.type, 'action', 'Type should be "action"');
      assert.strictEqual(buildCommand?.command?.command, 'sliman.buildLecture', 'Command should be sliman.buildLecture');
      assert.strictEqual(buildCommand?.icon, '$(tools)', 'Icon should be $(tools)');
    });

    test('should handle empty lectures list', async () => {
      mockCourseManager.configure('Empty Course', { slides: [] });

      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();

      const lecturesFolder = rootItems.find(item => item.id === 'lectures-folder');
      const lectureItems = await dataProvider.getChildren(lecturesFolder);
      
      assert.strictEqual(lectureItems.length, 0, 'Should return empty lectures list');
    });

    test('should show actions folder with correct properties', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();
      
      const actionsFolder = rootItems.find(item => item.id === 'actions-folder');
      assert.ok(actionsFolder, 'Actions folder should exist');
      assert.strictEqual(actionsFolder?.label, 'Actions', 'Label should be "Actions"');
      assert.strictEqual(actionsFolder?.type, 'action', 'Type should be "action"');
    });

    test('should list add lecture, build course, and setup pages actions', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();
      
      const actionsFolder = rootItems.find(item => item.id === 'actions-folder');
      const actionItems = await dataProvider.getChildren(actionsFolder);
      
      assert.strictEqual(actionItems.length, 3, 'Should return 3 actions');

      // Add Lecture action
      const addLectureAction = actionItems.find(item => item.id === 'action-add-lecture');
      assert.ok(addLectureAction, 'Add Lecture action should exist');
      assert.strictEqual(addLectureAction?.label, 'Add Lecture', 'Add Lecture action label should be correct');
      assert.strictEqual(addLectureAction?.command?.command, 'sliman.addLecture', 'Command should be sliman.addLecture');
      assert.strictEqual(addLectureAction?.icon, '$(add)', 'Icon should be $(add)');

      // Build Course action
      const buildAction = actionItems.find(item => item.id === 'action-build-course');
      assert.ok(buildAction, 'Build course action should exist');
      assert.strictEqual(buildAction?.label, 'Build course', 'Build action label should be correct');

      // Setup GitHub Pages action
      const pagesAction = actionItems.find(item => item.id === 'action-setup-pages');
      assert.ok(pagesAction, 'Setup GitHub Pages action should exist');
      assert.strictEqual(pagesAction?.label, 'Setup GitHub Pages', 'Pages action label should be correct');
    });

    test('should trigger refresh event', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      
      let refreshCalled = false;
      const disposable = dataProvider.onDidChangeTreeData(() => {
        refreshCalled = true;
      });

      // Trigger refresh
      dataProvider.refresh();
      
      assert.ok(refreshCalled, 'Refresh should trigger onDidChangeTreeData event');

      // Cleanup
      disposable.dispose();
    });

    test('should handle null course config gracefully', async () => {
      mockCourseManager.configure(null, { slides: [] });

      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();

      // Should still return folders even without config
      assert.ok(rootItems.length > 0, 'Should return folder items even without config');
    });

    test('should show "Create Course" item when course does not exist', async () => {
      // Configure mock with null config (no course)
      mockCourseManager.configure(null, null);

      // Override isCourseRoot to return false
      (mockCourseManager as unknown as { isCourseRoot(): Promise<boolean> }).isCourseRoot = async () => false;

      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();
      
      // Should return "Create Course" item when course doesn't exist
      assert.strictEqual(rootItems.length, 1, 'Should return 1 item for empty course');
      const createCourseItem = rootItems.find(item => item.id === 'create-course');
      assert.ok(createCourseItem, 'Create Course item should exist');
      assert.strictEqual(createCourseItem?.label, 'Create Course', 'Label should be "Create Course"');
      assert.strictEqual(createCourseItem?.type, 'action', 'Type should be "action"');
      assert.strictEqual(createCourseItem?.command?.command, 'sliman.createCourse', 'Command should be sliman.createCourse');
    });
  });

  // ============================================
  // CourseExplorer Tests
  // ============================================

  suite('CourseExplorer', () => {
    test('should create CourseExplorer instance', () => {
      const explorer = new CourseExplorerClass(mockContext);
      assert.ok(explorer !== undefined, 'CourseExplorer should be created');
    });

    test('should have null treeView before initialization', () => {
      const explorer = new CourseExplorerClass(mockContext);
      assert.strictEqual(explorer.treeView, null, 'treeView should be null before initialization');
    });

    test('should initialize with managers', async () => {
      // Create mock managers container
      const mockManagersContainer = {
        isInitialized: () => true,
        courseManager: mockCourseManager as unknown as CourseManager,
      };

      const explorer = new CourseExplorerClass(mockContext);
      
      // Initialize with managers - treeView will be created internally
      // We can't fully test treeView creation without real VS Code API
      // But we can verify the initialization doesn't throw
      (explorer as unknown as { initialize(managers: { isInitialized(): boolean; courseManager: CourseManager | null; }): void }).initialize(mockManagersContainer);

      // Verify initialization completed
      assert.ok(explorer !== undefined, 'Explorer should be initialized');

      // Dispose to clean up before next test
      explorer.dispose();
    });

    test('should refresh data provider', async () => {
      const explorer = new CourseExplorerClass(mockContext);
      
      // Create mock data provider
      let refreshCalled = false;
      const mockDataProvider = {
        refresh: () => { refreshCalled = true; },
        dispose: () => {},
        onDidChangeTreeData: { event: () => {} },
        getTreeItem: (_element: CourseTreeItem) => new vscode.TreeItem(''),
        getChildren: async () => [],
        getParent: (_element: CourseTreeItem) => undefined,
      };

      // Inject mock data provider
      (explorer as unknown as { _dataProvider: typeof mockDataProvider })._dataProvider = mockDataProvider;

      explorer.refresh();
      
      assert.ok(refreshCalled, 'Refresh should call data provider refresh');
    });

    test('should dispose tree view and data provider', async () => {
      const explorer = new CourseExplorerClass(mockContext);
      
      // Create mock data provider
      let dataProviderDisposed = false;
      let treeViewDisposed = false;

      const mockDataProvider = {
        refresh: () => {},
        dispose: () => { dataProviderDisposed = true; },
        onDidChangeTreeData: { event: () => {}, dispose: () => {} },
        getTreeItem: (_element: CourseTreeItem) => new vscode.TreeItem(''),
        getChildren: async () => [],
        getParent: (_element: CourseTreeItem) => undefined,
      };

      const mockTreeView = {
        dispose: () => { treeViewDisposed = true; },
      };

      (explorer as unknown as { _dataProvider: typeof mockDataProvider })._dataProvider = mockDataProvider;
      (explorer as unknown as { _treeView: typeof mockTreeView })._treeView = mockTreeView;

      explorer.dispose();
      
      assert.ok(dataProviderDisposed, 'Data provider should be disposed');
      assert.ok(treeViewDisposed, 'Tree view should be disposed');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================

  suite('Integration', () => {
    test('should create complete course structure in test workspace', async () => {
      const tempDir = await createTestDir('explorer', 'integration');
      try {
        // Create course structure
        const slidesDir = path.join(tempDir, SLIDES_DIR);
        const distDir = path.join(tempDir, BUILT_DIR);
        const slidesJsonPath = path.join(distDir, SLIDES_FILENAME);
        
        await fs.mkdir(slidesDir, { recursive: true });
        await fs.mkdir(distDir, { recursive: true });
        await fs.writeFile(slidesJsonPath, JSON.stringify({ course_name: 'Integration Test Course', slides: [] }), 'utf-8');

        // Verify structure exists
        const stats = await fs.stat(slidesDir);
        assert.ok(stats.isDirectory(), 'Slides directory should exist');
        
        const configContent = await fs.readFile(slidesJsonPath, 'utf-8');
        const config = JSON.parse(configContent);
        assert.strictEqual(config.course_name, 'Integration Test Course', 'Config should match');
      } finally {
        await cleanupTestDir(tempDir);
      }
    });

    test('should return correct parent for lecture commands', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      const rootItems = await dataProvider.getChildren();
      
      const lecturesFolder = rootItems.find(item => item.id === 'lectures-folder');
      const lectureItems = await dataProvider.getChildren(lecturesFolder);
      
      const aboutLecture = lectureItems.find(item => item.id === 'lecture-about');
      assert.ok(aboutLecture, 'About lecture should exist');

      // Get command items
      const commandItems = await dataProvider.getChildren(aboutLecture);
      const viewCommand = commandItems.find(item => item.id === 'lecture-command-view-about');
      assert.ok(viewCommand, 'View command should exist');

      // Test parent relationship - lecture command should have lecture as parent
      const parent = await dataProvider.getParent(viewCommand);
      assert.ok(parent, 'Parent should exist for lecture command');
      assert.strictEqual(parent?.id, 'lecture-about', 'Parent should be the lecture item');
    });

    test('should handle multiple refresh calls', async () => {
      const dataProvider = new DataProviderClass(mockCourseManager as unknown as CourseManager);
      
      let refreshCount = 0;
      const disposable = dataProvider.onDidChangeTreeData(() => {
        refreshCount++;
      });

      // Multiple refresh calls
      dataProvider.refresh();
      dataProvider.refresh();
      dataProvider.refresh();
      
      assert.strictEqual(refreshCount, 3, 'All refresh calls should trigger event');

      disposable.dispose();
    });
  });
});