/**
 * Constants for sli.dev Course VS Code Extension
 */

/** Extension identifier: publisher.name from package.json */
export const EXTENSION_ID = 'ea.sli.dev-course-manager';

/** Output channel name for logs */
export const OUTPUT_CHANNEL_NAME = 'sli.dev Course';

/** Course configuration filename (contains course_name) */
export const SLIMAN_FILENAME = 'sliman.json';

/** Slides configuration filename (contains slides array only) */
export const SLIDES_FILENAME = 'slides.json';

/** Lectures directory name */
export const SLIDES_DIR = 'slides';

/** Templates directory name (relative to course root) */
export const TEMPLATE_DIR = 'template';

/** Built course output directory */
export const BUILT_DIR = 'dist';

/** Template filenames */
export const TEMPLATE_SLIDES = 'slides.md';
export const TEMPLATE_INDEX = 'index.html';
export const TEMPLATE_PACKAGE = 'package.json';
export const TEMPLATE_STATIC = 'static.yml';
export const TEMPLATE_GLOBAL_TOP = 'global-top.vue';
export const TEMPLATE_COURSER = 'Courser.vue';

/** Metadata keys for slides frontmatter */
export const KEY_TITLE = 'title';
export const KEY_NAME = 'name';

/** Lecture frontmatter defaults */
export const DEFAULT_CANVAS_WIDTH = 1280;
export const DEFAULT_ROUTER_MODE = 'history';

/** VS Code configuration keys */
export const CONFIG_SECTION = 'sliDevCourse';
export const CONFIG_COURSE_ROOT = 'courseRoot';

/** Lecture file names */
export const LECTURE_SLIDES = 'slides.md';
export const LECTURE_PACKAGE = 'package.json';

/** Lecture directory prefix */
export const LECTURE_PREFIX = 'lecture-';

/** Slidev configuration section name */
export const LECTURE_CONFIG_SECTION = 'slidev';