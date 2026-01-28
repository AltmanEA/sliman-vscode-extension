# Implementation Plan

## VS Code Extension for sli.dev Lecture Course Development

**Last Updated:** January 2025
**Status:** Planning Complete

---

## Overview

This plan outlines the implementation phases for the VS Code extension. Current work focuses on Stage 0.

---

## Stage 0 - Workspace Validation (Prerequisite)

| Component | Description |
|-----------|-------------|
| `extension.ts` | Check `vscode.workspace.workspaceFolders` on activation |
| Workspace Guard | All commands verify workspace before execution |
| User Feedback | Show error message when no workspace open |

**Activation Flow:**
```
activate() → Check workspaceFolders → If empty: idle state, commands return error
```

**Error Message:**
```
"Please open a folder workspace to use this extension."
```

---

## Stage 1 - Infrastructure

| Component | Files | Description |
|-----------|-------|-------------|
| **Constants** | `src/constants.ts` | Path constants, JSON structure |
| **Course Manager** | `src/managers/CourseManager.ts` | Read/write `sliman.json`, `slides.json` |

-Templates to Create:
-```
-template/
-├── slides.md          # Lecture template
-├── index.html        # Course landing page
-├── package.json      # Course frontend build
-└── static.yml        # GitHub Actions for Pages
-```
+**Note:** Template copying is distributed:
+  - `slides.md`, `package.json` → LectureManager (Add Lecture command)
+  - `index.html`, `static.yml` → BuildManager (Build Course / Setup GitHub Pages)

---

## Stage 2 - Lecture and Build Modules

| Component | Files | Description |
|-----------|-------|-------------|
| **Lecture Manager** | `src/managers/LectureManager.ts` | Lecture directory creation, sli.dev initialization, template copying |
| **Build Manager** | `src/managers/BuildManager.ts` | Execute `npm run dev` / `npm run build` for lectures and course |
| **Process Helper** | `src/utils/process.ts` | Shell command execution utility |

**Duties by Manager:**
| Manager | Templates | Actions |
|---------|-----------|---------|
| LectureManager | slides.md, package.json | Add Lecture |
| BuildManager | index.html, static.yml | Build Course, Setup GitHub Pages |

**Deliverables:**
- Lecture creation with independent sli.dev setup
- Build commands for individual lectures
- Course-level build orchestration

---

## Stage 3 - UI Layer (Commands)

| Command | ID | Implementation |
|---------|-----|----------------|
| Create Course | `sliman.createCourse` | Course structure wizard |
| Scan Course | `sliman.scanCourse` | Re-scan sliman.json |
| Add Lecture | `sliman.addLecture` | Create new lecture |
| Run Lecture | `sliman.runLecture` | Launch dev server for lecture |
| Build Lecture | `sliman.buildLecture` | Compile lecture to HTML |
| Open slides.md | `sliman.openSlides` | Open presentation editor |
| Build Course | `sliman.buildCourse` | Build entire course |
| Setup GitHub Pages | `sliman.setupPages` | Create static.yml |

**package.json contributions:**
```json
"commands": [
  { "command": "sliman.createCourse", "title": "Create Course" },
  { "command": "sliman.scanCourse", "title": "Scan Course" },
  { "command": "sliman.addLecture", "title": "Add Lecture" },
  { "command": "sliman.runLecture", "title": "Run Lecture" },
  { "command": "sliman.buildLecture", "title": "Build Lecture" },
  { "command": "sliman.openSlides", "title": "Open slides.md" },
  { "command": "sliman.buildCourse", "title": "Build Course" },
  { "command": "sliman.setupPages", "title": "Setup GitHub Pages" }
]
```

---

## Stage 4 - Tree View (Course Explorer)

```
src/
└── providers/
    └── CourseExplorer.ts
```

**Tree View Structure:**
```
📁 Course: <name>
├── 📂 Lectures
│   ├── 📄 about — "About the Subject"
│   └── 📄 mongo — "MongoDB"
└── 🔧 Actions
    ├── 🏗️ Build course
    └── 📦 Setup GitHub Pages
```

**package.json configuration:**
```json
"viewsContainers": {
  "activitybar": [{
    "id": "sliman-course-view",
    "title": "Course",
    "icon": "resources/icon.svg"
  }]
},
"views": {
  "sliman-course-view": [{
    "name": "courseExplorer",
    "type": "tree"
  }]
}
```

---

## Stage 5 - Context Menus

```json
"menus": {
  "explorer/context": [
    {
      "when": "resourceDirname=**/slides",
      "command": "sliman.addLecture",
      "group": "navigation"
    },
    {
      "when": "resourceDirname=**/slides/*",
      "command": "sliman.runLecture",
      "group": "navigation"
    }
  ]
}
```

---

## Implementation Priority

| Priority | Item | Dependencies |
|----------|------|--------------|
| **P0** | Workspace Validation | — |
| **P0** | Constants | — |
-| **P0** | Template Manager | Workspace Validation |
| **P0** | Course Manager (sliman.json) | Workspace Validation |
| **P0** | Add Lecture | Course Manager |
| **P0** | Open slides.md | Workspace Validation |
| **P1** | Run Lecture | Lecture Manager |
| **P1** | Build Lecture | Build Manager |
| **P1** | Course Tree View | Course Manager |
| **P1** | Build Course | Build Manager |
| **P2** | Create Course | Course Manager |
| **P2** | Scan Course | Course Manager |
| **P2** | Setup GitHub Pages | Build Manager |

---

## File Structure After Implementation

```
src/
├── constants.ts              # Stage 1
├── extension.ts              # Entry point (includes workspace validation)
├── managers/
│   ├── TemplateManager.ts    # Stage 1
│   ├── CourseManager.ts      # Stage 1
│   ├── LectureManager.ts     # Stage 2
│   └── BuildManager.ts       # Stage 2
├── providers/
│   ├── CourseExplorer.ts     # Stage 4
│   └── CourseCommands.ts     # Stage 3
├── utils/
│   └── process.ts            # Stage 2
└── types/
    └── index.ts              # Shared types
```

---

## Dependencies

- **sli.dev:** Latest version (external CLI)
- **Node.js:** LTS
- **VS Code:** ^1.85.0

---

## Next Steps

1. Implement Stage 0: Workspace validation in extension.ts
2. Implement Stage 1: Constants, Template Manager, Course Manager
3. Implement Stage 2: Lecture Manager and Build Manager
4. Implement Stage 3: Core commands (Add Lecture, Open slides.md)
5. Implement Stage 4: Course Explorer Tree View
6. Implement Stage 5: Context menus
7. Testing and polish

---

## extension.ts

```ts
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  
  if (!workspaceFolders || workspaceFolders.length === 0) {
    void vscode.window.showErrorMessage('No workspace folder is open');
    // Не регистрируем команды — расширение в idle state
    return;
  }

  managersContainer.initialize(workspaceFolders[0].uri);
  
  // Команды регистрируются ТОЛЬКО при валидном workspace
  const commands = [ ... ];
  context.subscriptions.push(...commands);
}
```