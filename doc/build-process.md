# Build Process Guide

## Overview

The sli.dev Course Manager extension supports two deployment modes controlled by `deployRoot` in `sliman.json`:

1. **Subdir Deploy** (`deployRoot: false`) — course deployed at `domain/{courseName}/`
2. **Root Deploy** (`deployRoot: true`) — course deployed at `domain/`

Both modes use the same build command (`pnpm build`) but with different `--base` paths and output directories.

---

## Configuration

The deployment mode is stored in `sliman.json` at the course root:

```json
{
  "course_name": "my-course",
  "deployRoot": true
}
```

- `deployRoot: false` (default) — subdir deploy mode
- `deployRoot: true` — root deploy mode

---

## Mode 1: Subdir Deploy (`deployRoot: false`)

### File Structure

```
course-root/
├── sliman.json                    # { "course_name": "my-course", "deployRoot": false }
├── slides/                        # Source lectures
│   ├── review/
│   │   └── slides.md
│   └── lecture-2/
│       └── slides.md
└── my-course/                     # Built output (copied from each lecture's dist/)
    ├── index.html                 # Course landing page
    ├── slides.json                # Lecture metadata
    ├── review/                    # Built lecture 1
    │   ├── index.html
    │   ├── assets/
    │   │   ├── index-XXX.css
    │   │   └── index-XXX.js
    │   └── global-top.vue (if any)
    └── lecture-2/                 # Built lecture 2
        ├── index.html
        └── assets/
```

### Build Process

For each lecture, the extension runs:

```bash
# From the lecture directory (e.g., slides/review/)
pnpm build --base /my-course/review/
```

The `--base` path must:
- Start and end with `/`
- Include the course name and lecture name
- Example: `/my-course/review/`

After build, files from `lecture/dist/` are copied to `{courseName}/{lectureName}/`.

### Asset Paths

All assets use absolute paths relative to the course root:
- CSS: `/my-course/review/assets/index-XXX.css`
- JS: `/my-course/review/assets/index-XXX.js`
- HTML: `/my-course/review/index.html`

### Navigation

The course landing page (`my-course/index.html`) contains links to lectures:
```html
<li><a href="./review">Lecture Title</a></li>
```

These resolve to `/my-course/review/` on the server.

### Local Preview

```bash
# Start HTTP server from course root
npx http-server . -p 8080 -c-1

# Open browser
http://localhost:8080/my-course/index.html
```

### Server Deployment

Upload the contents of `my-course/` to `domain/my-course/` on the server.

The server must serve static files. No special routing needed.

---

## Mode 2: Root Deploy (`deployRoot: true`)

### File Structure

```
course-root/
├── sliman.json                    # { "course_name": "my-course", "deployRoot": true }
├── slides/                        # Source lectures
│   ├── review/
│   │   └── slides.md
│   └── lecture-2/
│       └── slides.md
└── built/                         # Built output (copied from each lecture's dist/)
    ├── index.html                 # Course landing page
    ├── slides.json                # Lecture metadata
    ├── review/                    # Built lecture 1
    │   ├── index.html
    │   ├── assets/
    │   │   ├── index-XXX.css
    │   │   └── index-XXX.js
    │   └── global-top.vue (if any)
    └── lecture-2/                 # Built lecture 2
        ├── index.html
        └── assets/
```

### Build Process

For each lecture, the extension runs:

```bash
# From the lecture directory (e.g., slides/review/)
pnpm build --base /review/
```

The `--base` path must:
- Start and end with `/`
- Include only the lecture name
- Example: `/review/`

After build, files from `lecture/dist/` are copied to `built/{lectureName}/`.

### Asset Paths

All assets use absolute paths relative to the server root:
- CSS: `/review/assets/index-XXX.css`
- JS: `/review/assets/index-XXX.js`
- HTML: `/review/index.html`

### Navigation

The course landing page (`built/index.html`) contains links to lectures:
```html
<li><a href="./review">Lecture Title</a></li>
```

These resolve to `/review/` on the server.

### Local Preview

```bash
# Start HTTP server from built/ directory
npx http-server "built" -p 8080 -c-1

# Open browser
http://localhost:8080/
```

The server is started from `built/` so root-relative paths (`/review/`) resolve correctly.

### Server Deployment

Upload the **contents** of `built/` (not the folder itself) to the server root:

```bash
# Upload contents of built/ to domain/
# Using rsync or similar:
rsync -avz built/ user@server:/var/www/html/
```

After upload:
- `domain/review/` → Lecture "review"
- `domain/lecture-2/` → Lecture "lecture-2"
- `domain/index.html` → Course landing page

---

## Key Rules

### 1. `--base` Path Format

**Always** use the correct format:
- Starts with `/`
- Ends with `/`
- Includes path components matching the deployment structure

| Mode | `--base` Example | Resulting Asset Paths |
|------|------------------|----------------------|
| Subdir | `/my-course/review/` | `/my-course/review/assets/...` |
| Root | `/review/` | `/review/assets/...` |

**Wrong:** `--base ./` — Slidev ignores this and falls back to `/`.

### 2. Copy Destination

| Mode | Copy Destination |
|------|------------------|
| Subdir | `{courseName}/{lectureName}/` |
| Root | `built/{lectureName}/` |

### 3. Local Preview

| Mode | Server Start Dir | Browser URL |
|------|------------------|-------------|
| Subdir | Course root (`.`) | `http://localhost:8080/{courseName}/` |
| Root | Built directory (`"built"`) | `http://localhost:8080/` |

### 4. Server Upload

| Mode | What to Upload | Where on Server |
|------|----------------|-----------------|
| Subdir | Contents of `{courseName}/` | `domain/{courseName}/` |
| Root | Contents of `built/` (not the folder) | `domain/` |

---

## Extension Commands

| Command | Description |
|---------|-------------|
| `sliman.createCourse` | Create new course (asks deployRoot mode) |
| `sliman.buildLecture` | Build single lecture |
| `sliman.buildCourse` | Build all lectures |
| `sliman.viewCourse` | Start HTTP server and open in browser |
| `sliman.editLecture` | Open slides.md and start dev server |

---

## Troubleshooting

### Assets not loading (404 on `/assets/...`)

**Cause:** `--base` path doesn't match the actual file structure.

**Fix:** Ensure `--base` matches the URL path where the lecture is served:
- If lecture is at `domain/review/`, use `--base /review/`
- If lecture is at `domain/my-course/review/`, use `--base /my-course/review/`

### `--base ./` not working

**Cause:** `./` is not a valid base path for Slidev. Slidev ignores it and falls back to `/`.

**Fix:** Always use absolute paths with leading and trailing slashes.

### Local preview works, server doesn't

**Cause:** Mismatch between `--base` path and server URL structure.

**Fix:** The `--base` path must match the URL path on the server. If the lecture is served at `domain/review/`, the `--base` must be `/review/`.

---

## Code References

| File | Responsibility |
|------|----------------|
| `src/managers/BuildManager.ts` | Build command generation, file copying |
| `src/managers/CourseManager.ts` | Reading `deployRoot` from `sliman.json` |
| `src/commands.ts` | `viewCourse` command (server startup) |
| `template/Courser.vue` | Lecture navigation (uses `../` relative paths) |
| `template/index.html` | Course landing page template |

---

## Summary Table

| Aspect | Subdir Deploy | Root Deploy |
|--------|---------------|-------------|
| `deployRoot` | `false` | `true` |
| `--base` for lecture | `/courseName/lectureName/` | `/lectureName/` |
| Output directory | `{courseName}/` | `built/` |
| Asset paths | `/courseName/lectureName/assets/...` | `/lectureName/assets/...` |
| Local server dir | `.` (course root) | `"built"` |
| Local URL | `http://localhost:8080/{courseName}/` | `http://localhost:8080/` |
| Server upload | `{courseName}/` → `domain/{courseName}/` | `built/` → `domain/` |
| GitHub Pages | Supported | Not supported |
