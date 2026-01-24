# Stage 1 Tasks — Infrastructure

## Overview

Stage 1 establishes the foundation for the extension: types, constants, and core managers.

---

## Task 1.1: Type Definitions

**File:** `src/types/index.ts`

Shared type definitions for the extension.

### Requirements

- Define `SlimanConfig` interface with `course_name`
- Define `LectureInfo` interface with `name` and `title`
- Define `SlidesConfig` interface with `slides` array
- Define `CourseData` interface for combined data
- Define `LectureItem` and `ActionItem` for Tree View

### Deliverable

- `src/types/index.ts`

---

## Task 1.2: Constants

**File:** `src/constants.ts`

Define all path and structure constants used throughout the extension.

### Requirements

- Course structure constants (`sliman.json`, `slides.json`)
- Directory names (`slides`, `template`)
- Template filenames (`slides.md`, `index.html`, `package.json`, `static.yml`)
- Metadata keys (`title`, `name`)
- Extension ID and output channel name

### Deliverable

- `src/constants.ts` with all constants

---

## Task 1.3: Course Manager

**File:** `src/managers/CourseManager.ts`

Manages course configuration files: `sliman.json` and `slides.json`.

### Requirements

- Check if current workspace is a course root
- read_file/write `sliman.json` with `course_name` field
- read_file/write `slides.json` with lecture list
- Add or update lectures in slides.json
- Get lecture directories from slides/
- Provide URIs for course root, slides dir, built course dir

### Interface Methods

- `isCourseRoot(): Promise<boolean>`
- `readSliman(): Promise<SlimanConfig | null>`
- `writeSliman(config): Promise<void>`
- `readSlidesJson(): Promise<SlidesConfig | null>`
- `writeSlidesJson(config): Promise<void>`
- `addLecture(name, title): Promise<void>`
- `getLectureDirectories(): Promise<string[]>`
- `getCourseRoot(): vscode.Uri`
- `getSlidesDir(): vscode.Uri`
- `getBuiltCourseDir(): vscode.Uri`

### Deliverable

- `src/managers/CourseManager.ts`

---

## Task 1.4: Extension Entry Point

**File:** `src/extension.ts`

Register managers and initialize extension.

### Requirements

- Initialize CourseManager
- Register `sliman.scanCourse` command
- Store managers in global state for command access
- Handle missing workspace scenario

### Command to Register

- `sliman.scanCourse` — reads and displays course info

### Deliverable

- Updated `src/extension.ts`

---

## Task 1.5: package.json Updates

Add commands for Stage 1 functionality.

### Requirements

- Register `sliman.scanCourse` command in package.json
- Add appropriate category (`sli.dev Course`)

### Command Definition

```json
{
  "command": "sliman.scanCourse",
  "title": "Scan Course",
  "category": "sli.dev Course"
}
```

### Deliverable

- Updated `package.json`

---

## Summary

| Task | File | Status |
|------|------|--------|
| 1.1 | `src/types/index.ts` | ⬜ |
| 1.2 | `src/constants.ts` | ⬜ |
| 1.3 | `src/managers/CourseManager.ts` | ⬜ |
| 1.4 | `src/extension.ts` | ⬜ |
| 1.5 | `package.json` | ⬜ |

---

## Dependencies Between Tasks

```
1.1 (types)    → 1.2, 1.3 (constants and managers use types)
1.2 (constants) → 1.3 (CourseManager uses constants)
1.3 (CourseManager) → 1.4 (extension.ts uses managers)
1.4 (extension) → 1.5 (package.json commands)
```

**Recommended order:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5

---

## Note

Template copying is implemented as utility functions, not separate managers.