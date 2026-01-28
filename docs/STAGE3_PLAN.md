# Stage 3 — UI Layer (Commands)

**Created:** January 2025  
**Status:** Planning Complete  
**Parent Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

---

## Overview

Stage 3 implements the command interface for the VS Code extension, exposing 8 commands for course and lecture management through the Command Palette and keyboard shortcuts.

---

## Dependencies

```
Stage 1 (Completed)
├── Constants (src/constants.ts)
├── CourseManager (src/managers/CourseManager.ts)
├── Types (src/types/index.ts)
└── extension.ts (scanCourse command)

Stage 2 (Completed)
├── ProcessHelper (src/utils/process.ts)
├── LectureManager (src/managers/LectureManager.ts)
├── BuildManager (src/managers/BuildManager.ts)
└── ManagersContainer (src/managers/ManagersContainer.ts)
         │
         ▼
Stage 3 (This Stage)
```

---

## Commands Overview

| Command | ID | Category | Dependencies |
|---------|-----|----------|--------------|
| Create Course | `sliman.createCourse` | sli.dev Course | TemplateManager, CourseManager |
| Scan Course | `sliman.scanCourse` | sli.dev Course | CourseManager |
| Add Lecture | `sliman.addLecture` | sli.dev Course | LectureManager, Transliterator |
| Run Lecture | `sliman.runLecture` | sli.dev Course | BuildManager |
| Build Lecture | `sliman.buildLecture` | sli.dev Course | BuildManager |
| Open slides.md | `sliman.openSlides` | sli.dev Course | CourseManager |
| Build Course | `sliman.buildCourse` | sli.dev Course | BuildManager |
| Setup GitHub Pages | `sliman.setupPages` | sli.dev Course | TemplateManager |

---

## Subtasks

### 3.1 Command Registration Framework

**File:** `src/extension.ts` (update)  
**Purpose:** Centralize command registration and manager initialization

#### Requirements

- Extend `activate()` to initialize all managers via `ManagersContainer`
- Register all 8 commands in `package.json` contributions
- Create centralized command handler module

#### Manager Initialization Flow

```typescript
// extension.ts
export async function activate(context: vscode.ExtensionContext) {
  // Initialize managers container
  const container = ManagersContainer.initialize(context);
  
  // Register commands with handlers
  const commands = registerCommands(container);
  context.subscriptions.push(...commands);
  
  // Create output channel
  const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(outputChannel);
}
```

#### Command Handler Module Structure

```
src/commands/
├── index.ts              # Export all commands
├── scanCourse.ts         # Existing command
├── createCourse.ts       # New
├── addLecture.ts        # New
├── runLecture.ts        # New
├── buildLecture.ts      # New
├── openSlides.ts        # New
├── buildCourse.ts       # New
└── setupPages.ts        # New
```

---

### 3.2 Create Course Command

**Command ID:** `sliman.createCourse`  
**File:** `src/commands/createCourse.ts`  
**Purpose:** Wizard for creating new course structure

#### User Flow

```
1. User triggers command
   │
   ▼
2. Input course name
   │
   ▼
3. Select root directory (if multiple workspaces)
   │
   ▼
4. Confirm creation
   │
   ▼
5. Create course structure
   └── sliman.json
   └── slides.json
   └── slides/ directory
   └── template files copied
```

#### Input Dialogs

| Step | UI Element | Validation |
|------|------------|------------|
| Course name | `vscode.window.showInputBox` | Non-empty, max 100 chars |
| Root directory | `vscode.window.showWorkspaceFolderPick` | Must be writable |
| Confirmation | `vscode.window.showInformationMessage` | Yes/No |

#### Implementation

```typescript
interface CreateCourseInputs {
  courseName: string;
  rootUri: vscode.Uri;
}

export async function createCourse(): Promise<void> {
  // Step 1: Get course name
  const courseName = await vscode.window.showInputBox({
    prompt: 'Enter course name',
    placeHolder: 'e.g., Introduction to TypeScript',
    validateInput: validateCourseName
  });
  if (!courseName) return;
  
  // Step 2: Select workspace folder
  const folder = await vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Select workspace for course'
  });
  if (!folder) return;
  
  // Step 3: Confirm
  const confirm = await vscode.window.showWarningMessage(
    `Create course "${courseName}" in ${folder.uri.fsPath}?`,
    { modal: true },
    'Create', 'Cancel'
  );
  if (confirm !== 'Create') return;
  
  // Step 4: Create structure
  try {
    await createCourseStructure(folder.uri, courseName);
    vscode.window.showInformationMessage(`Course "${courseName}" created!`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create course: ${error}`);
  }
}
```

#### Course Structure Created

```
{root}/
├── sliman.json           { "course_name": "{courseName}" }
├── slides.json           { "slides": [] }
├── slides/               (empty directory)
└── template files copied from extension's bundled templates
```

#### Error Handling

| Error | Message | Recovery |
|-------|---------|----------|
| `EEXIST` | "Directory already contains a course" | None |
| `ENOTDIR` | "Invalid workspace folder" | Retry selection |
| `EACCES` | "Permission denied" | None |

---

### 3.3 Add Lecture Command

**Command ID:** `sliman.addLecture`  
**File:** `src/commands/addLecture.ts`  
**Purpose:** Create new lecture with sli.dev structure

#### User Flow

```
1. User triggers command (in course root or slides/ directory)
   │
   ▼
2. Input lecture title (auto-generates folder name)
   │
   ├── Option: Edit generated folder name
   └── Option: Select from existing template
   │
   ▼
3. Confirm lecture creation
   │
   ▼
4. Create lecture
   └── Directory slides/{folder-name}/
   └── Copy slides.md template
   └── Copy package.json template
   └── Run npm install
   └── Update slides.json
```

#### Input Dialogs

| Step | UI Element | Default |
|------|------------|---------|
| Lecture title | `vscode.window.showInputBox` | Empty |
| Folder name | `vscode.window.showInputBox` | Auto-generated (transliterated) |
| Template selection | `vscode.window.showQuickPick` | Default template |

#### Folder Name Generation

```typescript
// Using Transliterator utility
function generateFolderName(title: string): string {
  const transliterated = transliterate(title);  // "Введение" → "vvedenie"
  const slug = transliterated.toLowerCase().replace(/\s+/g, '-');
  const timestamp = Date.now().toString(36).slice(-4);
  return `lecture-${slug.slice(0, 50)}-${timestamp}`;
}
```

#### Quick Pick Options

```typescript
const templates = [
  { label: '$(file-code) Default', detail: 'Standard slidev template', id: 'default' },
  { label: '$(book) Documentation', detail: 'Documentation-style template', id: 'docs' },
  { label: '$(graph) Interactive', detail: 'Interactive components template', id: 'interactive' }
];
```

#### Implementation

```typescript
export async function addLecture(): Promise<void> {
  // Get course root
  const courseRoot = await getCourseRoot();
  if (!courseRoot) {
    vscode.window.showErrorMessage('Not in a course directory');
    return;
  }
  
  // Step 1: Get lecture title
  const title = await vscode.window.showInputBox({
    prompt: 'Enter lecture title',
    placeHolder: 'e.g., Introduction to React',
    validateInput: (value) => value.length < 3 ? 'Title too short' : null
  });
  if (!title) return;
  
  // Step 2: Generate folder name
  const suggestedName = generateFolderName(title);
  const folderName = await vscode.window.showInputBox({
    prompt: 'Enter lecture folder name',
    value: suggestedName,
    validateInput: validateFolderName
  });
  if (!folderName) return;
  
  // Step 3: Select template
  const template = await vscode.window.showQuickPick(getTemplates(), {
    placeHolder: 'Select lecture template'
  });
  if (!template) return;
  
  // Step 4: Confirm
  const confirm = await vscode.window.showInformationMessage(
    `Create lecture "${title}"?`,
    { modal: true },
    'Create', 'Cancel'
  );
  if (confirm !== 'Create') return;
  
  // Step 5: Create lecture
  try {
    const lectureManager = container.lectureManager;
    await lectureManager.createLecture(folderName, title);
    vscode.window.showInformationMessage(`Lecture "${title}" created!`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create lecture: ${error}`);
  }
}
```

#### Error Handling

| Error | Message | Recovery |
|-------|---------|----------|
| `ENOLECTURE` | "Lecture title required" | Retry input |
| `EEXIST` | "Lecture folder already exists" | Change folder name |
| `ENOPERM` | "Cannot write to slides/ directory" | Check permissions |

---

### 3.4 Run Lecture Command

**Command ID:** `sliman.runLecture`  
**File:** `src/commands/runLecture.ts`  
**Purpose:** Launch sli.dev dev server for lecture editing

#### User Flow

```
1. User triggers command
   │
   ├── Scenario A: Cursor in slides/{name}/ directory → auto-detect
   └── Scenario B: No directory context → show quick pick
   │
   ▼
2. Select lecture (if not auto-detected)
   │
   ▼
3. Launch dev server
   └── Runs: cd slides/{name} && npm run dev
   └── Shows output in terminal or output channel
```

#### Quick Pick Options

```typescript
async function getLecturesForRun(): Promise<vscode.QuickPickItem[]> {
  const lectures = await courseManager.getLectureDirectories();
  return lectures.map(name => ({
    label: `$(play) ${name}`,
    description: 'Run dev server',
    detail: `Launch sli.dev for ${name}`
  }));
}
```

#### Implementation

```typescript
export async function runLecture(): Promise<void> {
  const lectureName = await detectLectureOrPrompt();
  if (!lectureName) return;
  
  const outputChannel = container.outputChannel;
  outputChannel.clear();
  outputChannel.appendLine(`Starting dev server for: ${lectureName}`);
  outputChannel.show();
  
  try {
    const buildManager = container.buildManager;
    await buildManager.runDevServer(lectureName);
    
    vscode.window.showInformationMessage(
      `Dev server running for ${lectureName}`,
      'Open in Browser'
    ).then(choice => {
      if (choice === 'Open in Browser') {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to run dev server: ${error}`);
  }
}
```

#### Terminal Integration

```typescript
// Alternative: Run in integrated terminal
const terminal = vscode.window.createTerminal(`sli.dev: ${lectureName}`);
terminal.sendText(`cd "${lecturePath}" && npm run dev`);
terminal.show();
```

---

### 3.5 Build Lecture Command

**Command ID:** `sliman.buildLecture`  
**File:** `src/commands/buildLecture.ts`  
**Purpose:** Compile lecture to static HTML

#### User Flow

```
1. User triggers command
   │
   ├── Scenario A: Cursor in slides/{name}/ directory → auto-detect
   └── Scenario B: No directory context → show quick pick
   │
   ▼
2. Select lecture (if not auto-detected)
   │
   ▼
3. Build lecture
   └── Runs: cd slides/{name} && npm run build
   └── Output: built/{course_name}/{lecture}/index.html
   │
   ▼
4. Show result
   └── "Build complete" notification
   └── Option: Open built presentation
```

#### Quick Pick Options

```typescript
async function getLecturesForBuild(): Promise<vscode.QuickPickItem[]> {
  const lectures = await courseManager.getLectureDirectories();
  return lectures.map(name => ({
    label: `$(package) ${name}`,
    description: 'Build lecture',
    detail: `Compile ${name} to HTML`,
    picked: true
  }));
}
```

#### Implementation

```typescript
export async function buildLecture(): Promise<void> {
  const lectureName = await detectLectureOrPrompt();
  if (!lectureName) return;
  
  const outputChannel = container.outputChannel;
  outputChannel.clear();
  outputChannel.appendLine(`=== Building Lecture: ${lectureName} ===`);
  outputChannel.show();
  
  try {
    const buildManager = container.buildManager;
    const success = await buildManager.buildLecture(lectureName);
    
    if (success) {
      const builtPath = path.join(container.builtDir, lectureName, 'index.html');
      vscode.window.showInformationMessage(
        `Lecture "${lectureName}" built successfully!`,
        'Open', 'Reveal in Explorer'
      ).then(choice => {
        if (choice === 'Open') {
          vscode.window.showTextDocument(vscode.Uri.file(builtPath));
        } else if (choice === 'Reveal in Explorer') {
          vscode.commands.executeCommand('revealFileInExplorer', vscode.Uri.file(builtPath));
        }
      });
    } else {
      vscode.window.showErrorMessage(`Build failed for ${lectureName}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Build error: ${error}`);
  }
}
```

---

### 3.6 Open slides.md Command

**Command ID:** `sliman.openSlides`  
**File:** `src/commands/openSlides.ts`  
**Purpose:** Open slides.md file for current or selected lecture

#### User Flow

```
1. User triggers command
   │
   ├── Scenario A: Cursor in slides/{name}/ → open slides.md directly
   └── Scenario B: No context → quick pick list of lectures
   │
   ▼
2. Open file in editor
   └── vscode.window.showTextDocument(uri)
```

#### Implementation

```typescript
export async function openSlides(): Promise<void> {
  const lectureName = await detectLectureOrPrompt();
  if (!lectureName) return;
  
  const slidesPath = path.join(container.slidesDir, lectureName, 'slides.md');
  
  try {
    const document = await vscode.window.showTextDocument(
      vscode.Uri.file(slidesPath)
    );
    // Focus on editor
    await vscode.window.showTextDocument(document);
  } catch (error) {
    vscode.window.showErrorMessage(`Cannot open slides.md: ${error}`);
  }
}
```

#### Auto-detection Logic

```typescript
async function detectCurrentLecture(): Promise<string | null> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return null;
  
  const docUri = editor.document.uri;
  const pathParts = docUri.fsPath.split(path.sep);
  
  // Check if we're in slides/{lecture}/ directory
  const slidesIndex = pathParts.indexOf('slides');
  if (slidesIndex === -1) return null;
  
  const lectureIndex = slidesIndex + 1;
  if (lectureIndex >= pathParts.length) return null;
  
  return pathParts[lectureIndex];
}
```

---

### 3.7 Build Course Command

**Command ID:** `sliman.buildCourse`  
**File:** `src/commands/buildCourse.ts`  
**Purpose:** Build entire course to static site

#### User Flow

```
1. User triggers command
   │
   ▼
2. Confirm build (shows lecture count)
   │
   ▼
3. Build all lectures
   └── Iterate through all lectures
   └── npm run build for each
   └── Copy built files to built/ directory
   │
   ▼
4. Update index.html navigation
   └── Generate navigation links
   └── Update slides.json metadata
   │
   ▼
5. Show summary
   └── "Course built: X lectures"
   └── Option: Open built course
```

#### Confirmation Dialog

```typescript
const lectureCount = await courseManager.getLectureCount();
const confirm = await vscode.window.showInformationMessage(
  `Build entire course? (${lectureCount} lectures)`,
  { modal: true },
  'Build', 'Cancel'
);
```

#### Implementation

```typescript
export async function buildCourse(): Promise<void> {
  const courseData = await courseManager.readCourseData();
  if (!courseData?.slides?.slides.length) {
    vscode.window.showWarningMessage('No lectures found in course');
    return;
  }
  
  const confirm = await showBuildConfirmation(courseData.slides.slides.length);
  if (confirm !== 'Build') return;
  
  const outputChannel = container.outputChannel;
  outputChannel.clear();
  outputChannel.appendLine(`=== Building Course: ${courseData.config?.course_name} ===`);
  outputChannel.show();
  
  try {
    const buildManager = container.buildManager;
    const success = await buildManager.buildCourse();
    
    if (success) {
      vscode.window.showInformationMessage(
        `Course built successfully! (${courseData.slides.slides.length} lectures)`,
        'Open Course', 'Reveal in Explorer'
      );
    } else {
      vscode.window.showErrorMessage('Course build failed');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Build error: ${error}`);
  }
}
```

---

### 3.8 Setup GitHub Pages Command

**Command ID:** `sliman.setupPages`  
**File:** `src/commands/setupPages.ts`  
**Purpose:** Configure GitHub Actions workflow for Pages deployment

#### User Flow

```
1. User triggers command
   │
   ▼
2. Confirm setup (explains what will be created)
   │
   ▼
3. Create workflow files
   └── .github/workflows/static.yml (from template)
   └── Update package.json with homepage (if needed)
   │
   ▼
4. Show setup instructions
   └── "Push to GitHub and enable Pages"
```

#### Files Created

```yaml
# .github/workflows/static.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build course
        run: npm run build:course
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'built/'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Implementation

```typescript
export async function setupPages(): Promise<void> {
  const confirm = await vscode.window.showInformationMessage(
    'Setup GitHub Pages deployment? This will create .github/workflows/static.yml',
    { modal: true },
    'Setup', 'Cancel'
  );
  if (confirm !== 'Setup') return;
  
  try {
    // Step 1: Create .github directory if needed
    await fs.promises.mkdir('.github', { recursive: true });
    
    // Step 2: Create workflows directory
    await fs.promises.mkdir('.github/workflows', { recursive: true });
    
    // Step 3: Write static.yml from template
    const template = await readTemplate('static.yml');
    await fs.promises.writeFile('.github/workflows/static.yml', template);
    
    // Step 4: Show instructions
    const instructions = `
GitHub Pages configured!

Next steps:
1. Commit and push to GitHub
2. Go to Repository Settings → Pages
3. Select "Deploy from branch"
4. Select "gh-pages / (root)"
5. Save

The workflow will automatically build and deploy on push to main.
    `;
    
    vscode.window.showInformationMessage('GitHub Pages workflow created!');
    vscode.window.showInformationMessage(instructions, 'Open Repository');
    
  } catch (error) {
    vscode.window.showErrorMessage(`Setup failed: ${error}`);
  }
}
```

---

## package.json Updates

Add all commands to `contributes.commands`:

```json
{
  "commands": [
    {
      "command": "sliman.createCourse",
      "title": "Create Course",
      "category": "sli.dev Course"
    },
    {
      "command": "sliman.scanCourse",
      "title": "Scan Course",
      "category": "sli.dev Course"
    },
    {
      "command": "sliman.addLecture",
      "title": "Add Lecture",
      "category": "sli.dev Course"
    },
    {
      "command": "sliman.runLecture",
      "title": "Run Lecture",
      "category": "sli.dev Course"
    },
    {
      "command": "sliman.buildLecture",
      "title": "Build Lecture",
      "category": "sli.dev Course"
    },
    {
      "command": "sliman.openSlides",
      "title": "Open slides.md",
      "category": "sli.dev Course"
    },
    {
      "command": "sliman.buildCourse",
      "title": "Build Course",
      "category": "sli.dev Course"
    },
    {
      "command": "sliman.setupPages",
      "title": "Setup GitHub Pages",
      "category": "sli.dev Course"
    }
  ],
  "menus": {
    "commandPalette": [
      {
        "command": "sliman.createCourse",
        "when": "false"
      },
      {
        "command": "sliman.addLecture",
        "when": "workspaceFolderCount >= 1"
      }
    ]
  },
  "keybindings": [
    {
      "command": "sliman.scanCourse",
      "key": "ctrl+shift+s",
      "mac": "cmd+shift+s",
      "when": "editorTextFocus"
    },
    {
      "command": "sliman.addLecture",
      "key": "ctrl+shift+a",
      "mac": "cmd+shift+a",
      "when": "editorTextFocus"
    },
    {
      "command": "sliman.buildLecture",
      "key": "ctrl+shift+b",
      "mac": "cmd+shift+b",
      "when": "editorTextFocus"
    }
  ]
}
```

---

## File Changes Summary

| Subtask | File | Operation | New/Modified |
|---------|------|-----------|--------------|
| 3.1 | `src/extension.ts` | Modify | Add managers init, register all commands |
| 3.1 | `src/commands/index.ts` | Create | Export all commands |
| 3.2 | `src/commands/createCourse.ts` | Create | New command |
| 3.3 | `src/commands/addLecture.ts` | Create | New command |
| 3.4 | `src/commands/runLecture.ts` | Create | New command |
| 3.5 | `src/commands/buildLecture.ts` | Create | New command |
| 3.6 | `src/commands/openSlides.ts` | Create | New command |
| 3.7 | `src/commands/buildCourse.ts` | Create | New command |
| 3.8 | `src/commands/setupPages.ts` | Create | New command |
| 3.1-3.8 | `package.json` | Modify | Add command contributions, keybindings |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1 + Stage 2 (Completed)                                    │
│ ├── constants.ts, types/index.ts                                 │
│ ├── managers/CourseManager.ts, LectureManager.ts, BuildManager.ts│
│ ├── utils/process.ts, utils/translit.ts                         │
│ └── extension.ts (partial)                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Subtask 3.1: Command Framework                                   │
│ └── src/extension.ts (update), src/commands/index.ts (new)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Subtask 3.2      │ │ Subtask 3.3      │ │ Subtask 3.4      │
│ createCourse.ts  │ │ addLecture.ts    │ │ runLecture.ts    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                │                │
         │                │                │
         │                │                ▼
         │                │         ┌──────────────────┐
         │                │         │ Subtask 3.5      │
         │                │         │ buildLecture.ts  │
         │                │         └──────────────────┘
         │                │                │
         │                │                ▼
         │                │         ┌──────────────────┐
         │                │         │ Subtask 3.6      │
         │                │         │ openSlides.ts    │
         │                │         └──────────────────┘
         │                │                │
         │                │                ▼
         │                │         ┌──────────────────┐
         │                │         │ Subtask 3.7      │
         │                │         │ buildCourse.ts   │
         │                │         └──────────────────┘
         │                │                │
         │                │                ▼
         │                │         ┌──────────────────┐
         │                │         │ Subtask 3.8      │
         │                │         │ setupPages.ts    │
         │                │         └──────────────────┘
         │                │
         │                ▼
         │         ┌──────────────────┐
         │         │ package.json      │
         │         │ (commands config) │
         │         └──────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Stage 4: Tree View      │
│ (depends on commands)   │
└─────────────────────────┘
```

---

## Testing Strategy

### Unit Tests (Commands)

| Command | Test Cases |
|---------|------------|
| `createCourse` | Valid input, empty name, cancel, existing directory |
| `addLecture` | Valid title, invalid folder name, duplicate, cancel |
| `runLecture` | Valid lecture, invalid lecture, npm not found |
| `buildLecture` | Valid lecture, build failure, timeout |
| `openSlides` | Existing file, missing file, multiple lectures |
| `buildCourse` | Single lecture, multiple lectures, empty course |
| `setupPages` | New workflow, existing workflow, permission error |

### Integration Tests

- Execute command → Verify file system changes
- Execute command → Verify package.json updates
- Execute command → Verify output channel content

### Manual Testing

1. Test each command from Command Palette
2. Test keyboard shortcuts
3. Test error scenarios
4. Test with multiple workspaces

---

## Error Handling Pattern

All commands should follow this pattern:

```typescript
export async function commandName(): Promise<void> {
  try {
    // Validation
    const context = getCommandContext();
    if (!context.valid) {
      vscode.window.showErrorMessage(context.errorMessage);
      return;
    }
    
    // User input
    const input = await getUserInput();
    if (!input) return; // User cancelled
    
    // Execute
    await executeCommand(input);
    
    // Success feedback
    vscode.window.showInformationMessage('Success!');
    
  } catch (error) {
    // Error feedback
    vscode.window.showErrorMessage(`Failed: ${error.message}`);
    // Log to output channel
    outputChannel.appendLine(`Error: ${error}`);
  }
}
```

---

## Next Steps

After completing Stage 3:

1. **Stage 4:** Course Explorer Tree View (visual representation of commands)
2. **Stage 5:** Context menus (quick access from Explorer)
3. **Testing:** Full integration testing
4. **Documentation:** User guide and README updates

---

## Related Documentation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Main implementation plan
- [STAGE1_TASKS.md](./STAGE1_TASKS.md) - Stage 1 details
- [STAGE2_BREAKDOWN.md](./STAGE2_BREAKDOWN.md) - Stage 2 details
- [KODA.md](../KODA.md) - Project instructions and conventions
- [VS Code Commands API](https://code.visualstudio.com/api/references/commands)
- [sli.dev docs](https://sli.dev) - Slidev framework documentation