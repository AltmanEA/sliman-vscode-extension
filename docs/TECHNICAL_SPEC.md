# Technical Specification

## VS Code Extension for sli.dev Lecture Course Development

**Version:** 1.0
**Status:** Approved MVP
**Purpose:** Minimal VS Code extension for convenient lecture course development consisting of multiple sli.dev presentations.

---

## 1. Purpose and Scope

The extension is intended for instructors and course authors who develop **lecture sets (presentations)** using **sli.dev** and publish them as a unified static site (e.g., via GitHub Pages).

The extension:

* Manages course structure
* Automates lecture creation
* Simplifies development workflow and building
* Prepares course for publishing

The extension **does NOT replace** sli.dev and **does NOT interfere** with presentation content.

---

## 2. Functional Requirements

### FR-1. Course Creation

* Create root course structure
* Initialize configuration files

### FR-2. Course Scanning

* Detect course via `sliman.json`
* Load structure and configuration

### FR-3. Adding Lectures

* Prompt user for lecture name (directory) and title (display name)
* Create lecture directory
* Copy template `slides.md`
* Initialize independent sli.dev project

### FR-4. Lecture Development

* Open `slides.md`
* Launch sli.dev dev server

### FR-5. Building

* Execute `npm run build` inside lecture directory
* Copy built output to `<course_name>/<lecture-name>/`
* Update `<course_name>/slides.json` with current lecture list

### FR-6. Publishing

* Prepare GitHub Pages configuration (GitHub Actions)

---

## 3. Project Structure and File Formats

### 3.1. Course Root

```text
<course-root>/
├── sliman.json
├── slides/
└── <course_name>/
```

---

### 3.2. `sliman.json`

**Location:** project root

```json
{
  "course_name": "course_data"
}
```

| Field        | Type    | Description                    |
| ------------ | ------- | ------------------------------ |
| course_name  | string  | Name of built course directory |

---

### 3.3. `slides/` Directory

Contains lecture subdirectories:

```text
slides/
├── about/
├── collection/
└── mongo/
```

Each directory is an **independent sli.dev project**.

---

### 3.4. Lecture Directory Structure

```text
slides/<lecture-name>/
├── slides.md
├── package.json
├── node_modules/        (optional)
├── components/          (optional)
├── public/              (optional)
├── styles/              (optional)
└── README.md            (optional)
```

Requirements:

* Autonomy
* Own `package.json`
* Independent dev server

---

### 3.5. Built Course Directory `<course_name>/`

```text
<course_name>/
├── index.html
├── slides.json
├── about/
├── collection/
└── mongo/
```

---

### 3.6. `slides.json`

**Location:** `<course_name>/slides.json`

```json
{
  "slides": [
    { "name": "about", "title": "About the Subject" },
    { "name": "mongo", "title": "MongoDB" }
  ]
}
```

| Field  | Type   | Description               |
| ------ | ------ | ------------------------- |
| slides | array  | Ordered lecture list      |
| name   | string | Identifier / directory    |
| title  | string | Display title             |

File is generated and updated automatically.

---

## 4. Templates

The extension uses embedded templates:

```text
template/
├── slides.md
├── index.html
├── package.json
└── static.yml
```

### Purpose:

* `slides.md` — Lecture template
* `index.html` — Course landing page
* `package.json` — Course frontend build
* `static.yml` — GitHub Actions for Pages

---

## 5. Extension UX and Commands

### 5.1. Command Palette

**Course**

* Create Course
* Scan Course
* Build Course
* Setup GitHub Pages

**Lecture**

* Add Lecture
* Run Lecture
* Build Lecture
* Open slides.md

---

### 5.2. Side Panel (Course Explorer)

```text
Course: course_data
├── Lectures
│   ├── about — About the Subject
│   └── mongo — MongoDB
└── Actions
    ├── Build course
    └── Setup GitHub Pages
```

---

### 5.3. Context Menus

**Course Root**

* Add Lecture
* Build Course

**Lecture Directory**

* Run
* Build
* Open slides.md

---

## 6. Extension Architecture

### 6.1. Modules

* **Course Manager** — `sliman.json`, `slides.json`
* **Lecture Manager** — Lecture creation and opening
* **Build Manager** — sli.dev CLI execution
* **Template Manager** — Template copying
* **UI Layer** — Commands, Tree View, notifications

---

### 6.2. Architectural Principles

* MVP / minimal functionality
* KISS
* Explicit commands
* No background magic

---

## 7. Non-Functional Requirements

### 7.1. Performance

* No constant scanning
* All actions are user-initiated

### 7.2. Reliability

* Any error is shown to user
* No inconsistent states

### 7.3. Security

* No network requests
* No analytics
* All operations are local

### 7.4. Compatibility

* VS Code LTS
* Node.js LTS
* sli.dev as external CLI

### 7.5. Error Handling

All errors are displayed to the user using VS Code native mechanisms:

| Error Type | Display Method |
| ---------- | -------------- |
| Validation errors | `window.showErrorMessage()` |
| File system errors | `window.showErrorMessage()` with details |
| Build/command failures | Output channel with full logs |
| Missing sli.dev CLI | `window.showErrorMessage()` with installation hint |

**Principles:**

* Errors never silent — user is always notified
* Contextual messages — error includes relevant path/command
* Recovery — extension maintains consistent state after failure
* No crash — unhandled exceptions caught and displayed

---

## 8. Explicit Limitations

The extension does NOT:

* Edit lecture content
* Analyze Markdown
* Manage Git
* Manage npm dependencies
* Extend sli.dev

---

## 9. Status

Technical specification:

* ✅ Approved
* ✅ Ready for implementation
* ✅ MVP compliant
