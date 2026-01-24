# Implementation Plan

## VS Code Extension for sli.dev Lecture Course Development

**Last Updated:** January 2025
**Status:** Planning Complete

---

## Overview

This plan outlines the implementation phases for the VS Code extension. Current work focuses on Stage 1.

---

## Stage 1 - Infrastructure

| Component | Files | Description |
|-----------|-------|-------------|
| **Constants** | `src/constants.ts` | Path constants, JSON structure |
| **Template Manager** | `src/managers/TemplateManager.ts` | Template copying (slides.md, index.html, package.json, static.yml) |
| **Course Manager** | `src/managers/CourseManager.ts` | Read/write `sliman.json`, `slides.json` |

**Templates to Create:**
```
template/
├── slides.md          # Lecture template
├── index.html        # Course landing page
├── package.json      # Course frontend build
└── static.yml        # GitHub Actions for Pages
```

---

## Stage 2 - Lecture and Build Modules

| Component | Files | Description |
|-----------|-------|-------------|
| **Lecture Manager** | `src/managers/LectureManager.ts` | Lecture directory creation, sli.dev initialization |
| **Build Manager** | `src/managers/BuildManager.ts` | Execute `npm run dev` / `npm run build` for lectures and course |
| **Process Helper** | `src/utils/process.ts` | Shell command execution utility |

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

| Priority | Command | Dependencies |
|----------|---------|--------------|
| **P0** | Constants | — |
| **P0** | Template Manager | Constants |
| **P0** | Course Manager (sliman.json) | Template Manager |
| **P0** | Add Lecture | Course Manager, Template Manager |
| **P0** | Open slides.md | — |
| **P1** | Run Lecture | Lecture Manager |
| **P1** | Build Lecture | Build Manager |
| **P1** | Course Tree View | Course Manager |
| **P1** | Build Course | Build Manager |
| **P2** | Create Course | Template Manager |
| **P2** | Scan Course | Course Manager |
| **P2** | Setup GitHub Pages | Template Manager |

---

## File Structure After Implementation

```
src/
├── constants.ts              # Stage 1
├── extension.ts              # Entry point
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

1. Implement Stage 1: Constants, Template Manager, Course Manager
2. Implement Stage 2: Lecture Manager and Build Manager
3. Implement Stage 3: Core commands (Add Lecture, Open slides.md)
4. Implement Stage 4: Course Explorer Tree View
5. Implement Stage 5: Context menus
6. Testing and polish