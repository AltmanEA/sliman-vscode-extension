# Stage 2 — Lecture and Build Modules

**Created:** January 2025  
**Status:** Planning Complete  
**Parent Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

---

## Overview

Stage 2 implements the lecture creation and build orchestration modules required for the VS Code extension. These modules enable:
- Creating new lectures with proper sli.dev structure
- Building individual lectures and entire courses
- Running development servers for live preview

---

## Dependencies

```
Stage 1 (Completed)
├── Constants (src/constants.ts)
├── CourseManager (src/managers/CourseManager.ts)
└── Types (src/types/index.ts)
         │
         ▼
Stage 2 (This Stage)
```

---

## Subtasks

### 2.1 Process Helper

**File:** `src/utils/process.ts`  
**Purpose:** Unified utility for executing shell commands

#### Interface

```typescript
interface ProcessResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface ProcessOptions {
  cwd?: string;
  timeout?: number; // milliseconds
  env?: Record<string, string>;
  stdio?: 'pipe' | 'inherit';
}

export class ProcessHelper {
  static async exec(command: string, options?: ProcessOptions): Promise<ProcessResult>;
  static async execNpm(script: string, cwd: string, args?: string[]): Promise<ProcessResult>;
  static async execNode(scriptPath: string, args?: string[]): Promise<ProcessResult>;
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `exec(command, options)` | Execute arbitrary shell command |
| `execNpm(script, cwd, args)` | Execute npm script in specified directory |
| `execNode(scriptPath, args)` | Execute Node.js script |

#### Error Types

| Error Code | Description |
|------------|-------------|
| `ENOENT` | Command not found |
| `ETIMEDOUT` | Command timeout |
| `EEXEC` | Execution failure |

#### Implementation Notes

- Use `child_process.exec` for simple commands
- Use `child_process.spawn` for npm scripts with output streaming
- Implement proper timeout handling
- Cross-platform compatibility (Windows: PowerShell, Unix: bash)

---

### 2.2 Lecture Manager — Structure

**File:** `src/managers/LectureManager.ts` (Part 1)  
**Purpose:** Create and manage lecture directory structure

#### Class Definition

```typescript
export class LectureManager {
  private readonly workspaceUri: vscode.Uri;
  private readonly courseManager: CourseManager;

  constructor(workspaceUri: vscode.Uri, courseManager: CourseManager);
  
  // Structure methods (this subtask)
  getSlidesDir(): vscode.Uri;
  getLectureDir(name: string): vscode.Uri;
  getLectureSlidesPath(name: string): vscode.Uri;
  getLecturePackagePath(name: string): vscode.Uri;
  lectureExists(name: string): Promise<boolean>;
  createLectureDir(name: string): Promise<void>;
  
  // Template methods (subtask 2.3)
  createLecture(name: string, title: string): Promise<void>;
  initLectureNpm(name: string): Promise<void>;
  updateCourseConfig(name: string, title: string): Promise<void>;
}
```

#### Methods (Subtask 2.2)

| Method | Description | Returns |
|--------|-------------|---------|
| `getSlidesDir()` | Returns URI of slides/ directory | `vscode.Uri` |
| `getLectureDir(name)` | Returns URI of `slides/{name}/` | `vscode.Uri` |
| `getLectureSlidesPath(name)` | Returns URI of `slides/{name}/slides.md` | `vscode.Uri` |
| `getLecturePackagePath(name)` | Returns URI of `slides/{name}/package.json` | `vscode.Uri` |
| `lectureExists(name)` | Checks if lecture directory exists | `Promise<boolean>` |
| `createLectureDir(name)` | Creates `slides/{name}/` directory | `Promise<void>` |

#### Constants to Add

```typescript
// In constants.ts
export const LECTURE_PACKAGE = 'package.json';
export const LECTURE_SLIDES = 'slides.md';
export const LECTURE_CONFIG_SECTION = 'slidev';
```

---

### 2.3 Lecture Manager — Templates

**File:** `src/managers/LectureManager.ts` (Part 2)  
**Purpose:** Generate lecture files from templates

#### Methods (Subtask 2.3)

| Method | Description | Dependencies |
|--------|-------------|--------------|
| `copySlidesTemplate(name, title)` | Copy slides.md with updated frontmatter | `TEMPLATE_SLIDES`, `fs/promises` |
| `copyPackageJson(name)` | Copy package.json for lecture | `TEMPLATE_PACKAGE`, `fs/promises` |
| `updateCourseConfig(name, title)` | Update slides.json in built/ | `CourseManager.writeSlidesJson()` |
| `initLectureNpm(name)` | Run npm install in lecture dir | `ProcessHelper` |
| `createLecture(name, title)` | Full lecture creation | All above methods |

#### Template Processing

**slides.md template variables:**
```yaml
---
title: {title}
name: {name}
canvasWidth: 1280
routerMode: history
---
```

**package.json template (lecture-specific):**
```json
{
  "name": "lecture-{name}",
  "private": true,
  "scripts": {
    "build": "slidev build",
    "dev": "slidev"
  },
  "dependencies": {
    "@slidev/cli": "latest",
    "@slidev/theme-default": "latest"
  }
}
```

#### Lecture Creation Flow

```
createLecture(name, title)
│
├── createLectureDir(name)
│
├── copySlidesTemplate(name, title)
│   └── Read template/slides.md
│   └── Replace {{TITLE}} and {{NAME}}
│   └── Write slides/{name}/slides.md
│
├── copyPackageJson(name)
│   └── Read template/package.json
│   └── Replace {{LECTURE_NAME}}
│   └── Write slides/{name}/package.json
│
├── initLectureNpm(name)
│   └── ProcessHelper.execNpm('install', lecturePath)
│
└── updateCourseConfig(name, title)
    └── CourseManager.addLecture(name, title)
```

---

### 2.4 Build Manager — Structure

**File:** `src/managers/BuildManager.ts` (Part 1)  
**Purpose:** Orchestrate build processes for lectures and courses

#### Class Definition

```typescript
export class BuildManager {
  private readonly workspaceUri: vscode.Uri;
  private readonly courseManager: CourseManager;
  private readonly lectureManager: LectureManager;
  private outputChannel: vscode.OutputChannel;

  constructor(
    workspaceUri: vscode.Uri,
    courseManager: CourseManager,
    lectureManager: LectureManager
  );
  
  // Build methods
  async buildLecture(name: string): Promise<boolean>;
  async buildCourse(): Promise<boolean>;
  async runDevServer(name: string): Promise<void>;
  
  // Output methods (subtask 2.5)
  attachOutput(channel: vscode.OutputChannel): void;
}
```

#### Methods (Subtask 2.4)

| Method | Description | Command |
|--------|-------------|---------|
| `buildLecture(name)` | Build single lecture to HTML | `npm run build --prefix slides/{name}` |
| `buildCourse()` | Build entire course | `npm run build` (root) |
| `runDevServer(name)` | Start dev server for lecture | `npm run dev --prefix slides/{name}` |

#### Build Output Locations

```
built/
├── index.html           # Course landing page (from template)
├── slides.json          # Lecture metadata
├── lecture-{name}/
│   └── index.html       # Built lecture (from slides/{name})
└── assets/              # Static assets
```

#### Error Handling

```typescript
interface BuildError {
  type: 'lecture-not-found' | 'npm-not-found' | 'build-failed' | 'timeout';
  lecture?: string;
  message: string;
  exitCode?: number;
}

class BuildManager {
  private async handleBuildError(error: unknown, lecture?: string): Promise<BuildError>;
  private async showBuildError(error: BuildError): Promise<void>;
}
```

---

### 2.5 Build Manager — Output Integration

**File:** `src/managers/BuildManager.ts` (Part 2)  
**Purpose:** Real-time build progress display via VS Code Output Channel

#### Output Methods

| Method | Description |
|--------|-------------|
| `attachOutput(channel)` | Connect VS Code output channel |
| `clearOutput()` | Clear previous build logs |
| `appendLine(message)` | Write line to output |
| `appendBlock(block)` | Write multi-line block |
| `showOutput(preserveFocus?)` | Reveal output channel |

#### Progress Notifications

```typescript
interface BuildProgress {
  lecture?: string;
  stage: 'installing' | 'building' | 'copying' | 'complete';
  percent?: number;
}

class BuildManager {
  private async showProgress(progress: BuildProgress): Promise<void>;
  private async hideProgress(): Promise<void>;
}
```

#### Output Format

```
=== Building Lecture: about ===
[14:32:01] Installing dependencies...
[14:32:15] ✓ Dependencies installed
[14:32:15] Building presentation...
[14:32:23] ✓ Presentation built
[14:32:23] Copying to built/...
[14:32:24] ✓ Complete!
=== Done ===
```

---

## File Changes Summary

| Subtask | File | Operation | New/Modified |
|---------|------|-----------|--------------|
| 2.1 | `src/utils/process.ts` | Create | New |
| 2.1 | `src/constants.ts` | Modify | Add LECTURE_* constants |
| 2.2 | `src/managers/LectureManager.ts` | Create | Part 1 - Structure |
| 2.3 | `src/managers/LectureManager.ts` | Modify | Part 2 - Templates |
| 2.4 | `src/managers/BuildManager.ts` | Create | Part 1 - Build |
| 2.5 | `src/managers/BuildManager.ts` | Modify | Part 2 - Output |
| 2.2-2.5 | `src/managers/ManagersContainer.ts` | Modify | Add new managers |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1 (Completed)                                             │
│ ├── constants.ts                                                │
│ ├── types/index.ts                                              │
│ └── managers/CourseManager.ts                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Subtask 2.1: Process Helper                                     │
│ └── src/utils/process.ts                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Subtask 2.2      │ │ Subtask 2.3      │ │ Subtask 2.4      │
│ Lecture Manager  │ │ Lecture Manager  │ │ Build Manager    │
│ - Structure      │ │ - Templates      │ │ - Build          │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         │                    │                    │
         │                    │                    ▼
         │                    │            ┌──────────────────┐
         │                    │            │ Subtask 2.5      │
         │                    │            │ Build Manager    │
         │                    │            │ - Output         │
         │                    │            └──────────────────┘
         │                    │
         └────────────────────┤
                              │
                              ▼
                   ┌─────────────────────┐
                   │ Extension Commands  │
                   │ (Stage 3)           │
                   └─────────────────────┘
```

---

## Testing Strategy

### Process Helper Tests
- Command execution with valid/invalid commands
- Timeout handling
- Working directory handling
- Environment variable passing

### Lecture Manager Tests
- Directory creation and validation
- Template variable substitution
- Package.json generation
- Course config updates

### Build Manager Tests
- Build command execution
- Error handling and recovery
- Output channel formatting
- Progress notification display

---

## Next Steps

After completing Stage 2:

1. **Stage 3:** Implement UI commands (Add Lecture, Run Lecture, Build Lecture)
2. **Stage 4:** Course Explorer Tree View
3. **Stage 5:** Context menus in explorer

---

## Related Documentation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Main implementation plan
- [KODA.md](../KODA.md) - Project instructions and conventions
- [sli.dev docs](https://sli.dev) - Slidev framework documentation