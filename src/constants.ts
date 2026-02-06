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
export const TEMPLATE_GITIGNORE = '.gitignore';
export const TEMPLATE_GLOBAL_TOP = 'global-top.vue';
export const TEMPLATE_COURSER = 'Courser.vue';

/** GitHub workflow constants */
export const GITHUB_WORKFLOWS_DIR = '.github/workflows';
export const WORKFLOW_FILENAME = 'static.yml';

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

// ============================================
// Module System Constants
// ============================================

/** Available modules for lectures */
export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  configFile?: string;
  defaultConfig?: string;
}

/** Module definitions */
export const AVAILABLE_MODULES: ModuleInfo[] = [
  {
    id: 'shiki',
    name: 'Shiki',
    description: 'Beautiful syntax highlighting powered by Shiki',
    dependencies: ['shiki'],
    configFile: 'shiki.config.ts',
    defaultConfig: `import { defineConfig } from '@slidev/types'

export default defineConfig({
  shiki: {
    themes: {
      dark: 'github-dark',
      light: 'github-light',
    }
  }
})`
  },
  {
    id: 'monaco',
    name: 'Monaco Editor',
    description: 'In-browser code editor for interactive programming examples',
    dependencies: ['monaco-editor', '@slidev/preset-monaco'],
    configFile: 'slidev.config.ts',
    defaultConfig: `import { defineConfig } from '@slidev/types'

export default defineConfig({
  monaco: true,
  // Monaco Editor configuration
  monacoOptions: {
    theme: 'vs-dark',
    fontSize: 14,
    lineNumbers: 'on',
    minimap: { enabled: false },
    automaticLayout: true,
    fontFamily: 'Fira Code, Monaco, Menlo, monospace',
    fontLigatures: true
  },
  // Monaco will automatically detect and load supported languages
  // from code blocks in your presentation
  info: \`
    ✅ Monaco Editor configured and ready!
    
    🎯 Features enabled:
    - Interactive code editing in browser
    - Syntax highlighting for all languages
    - Code completion and IntelliSense
    - Multiple themes support
    - Automatic language detection
    
    📝 Usage in slides:
    \`\`\`javascript
    // This code block is now interactive!
    function helloMonaco() {
        console.log("Hello from Monaco Editor!");
    }
    \`\`\`
    
    🔧 Supported languages:
    JavaScript, TypeScript, Python, Java, C++, C#, PHP, Go, Rust, SQL, JSON, YAML, HTML, CSS, Shell, and more!
    
    ⚙️ Configuration options:
    - theme: 'vs-dark', 'vs-light', 'hc-black'
    - fontSize: 12-24 (default: 14)
    - fontFamily: Custom font stack
    - fontLigatures: Enable/disable font ligatures
    - lineNumbers: 'on', 'off', 'relative'
    - minimap: { enabled: boolean }
  \`
})`
  },
  {
    id: 'katex',
    name: 'KaTeX',
    description: 'Fast math typesetting for LaTeX math expressions',
    dependencies: ['katex', '@slidev/preset-katex'],
    configFile: 'katex.config.ts',
    defaultConfig: `import { defineConfig } from '@slidev/types'

export default defineConfig({
  katex: {
    // KaTeX configuration options
    macros: {
      // Custom macros can be defined here
      "\\\\RR": "\\\\mathbb{R}",
      "\\\\NN": "\\\\mathbb{N}",
      "\\\\ZZ": "\\\\mathbb{Z}",
      "\\\\QQ": "\\\\mathbb{Q}",
      "\\\\EE": "\\\\mathbb{E}",
      "\\\\Var": "\\\\operatorname{Var}",
      "\\\\Cov": "\\\\operatorname{Cov}",
      "\\\\argmin": "\\\\mathop{\\\\arg\\\\min}",
      "\\\\argmax": "\\\\mathop{\\\\arg\\\\max}"
    },
    // Additional KaTeX options
    throwOnError: false,
    strict: "warn",
    trust: false
  },
  info: \`
    ✅ KaTeX module configured and ready!
    
    🔢 Features enabled:
    - Lightning-fast math rendering
    - Full LaTeX syntax support
    - Custom macros support
    - Automatic equation numbering
    - Cross-references between equations
    - Mathematical symbols and operators
    
    📝 Usage in slides:
    
    <!-- Inline math -->
    The quadratic formula is $x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}$.
    
    <!-- Display math -->
    $$\\\\int_{-\\\\infty}^{\\\\infty} e^{-x^2} dx = \\\\sqrt{\\\\pi}$$
    
    <!-- Aligned equations -->
    \\$\\$
    \\\\begin{aligned}
    a^2 + b^2 &= c^2 \\\\
    \\\\frac{d}{dx}\\\\sin(x) &= \\\\cos(x)
    \\\\end{aligned}
    \\$\\$ 
    
    🎯 Mathematical content:
    - Basic arithmetic and algebra
    - Calculus and derivatives
    - Linear algebra and matrices
    - Statistics and probability
    - Physics formulas
    - Chemical equations
    
    ⚙️ Configuration:
    - macros: Define custom LaTeX commands
    - throwOnError: Continue rendering on errors
    - strict: Warning level for deprecated features
    - trust: Enable trusted mode for security
  \`
})`
  },
  {
    id: 'mermaid',
    name: 'Mermaid',
    description: 'Create diagrams and flowcharts using Mermaid syntax',
    dependencies: ['mermaid', '@slidev/preset-mermaid'],
    configFile: 'mermaid.config.ts',
    defaultConfig: `import { defineConfig } from '@slidev/types'

export default defineConfig({
  mermaid: {
    // Mermaid configuration
    theme: 'default',
    securityLevel: 'loose',
    startOnLoad: false,
    themeVariables: {
      primaryColor: '#3b82f6',
      primaryTextColor: '#1f2937',
      primaryBorderColor: '#2563eb',
      lineColor: '#6b7280',
      secondaryColor: '#f3f4f6',
      tertiaryColor: '#f9fafb'
    }
  },
  info: \`
    ✅ Mermaid module configured and ready!
    
    📊 Features enabled:
    - Flowcharts and process diagrams
    - Sequence diagrams
    - State diagrams
    - Class diagrams
    - Entity-relationship diagrams
    - User journey diagrams
    - Git graphs
    - Gantt charts
    - Pie charts
    
    📝 Usage in slides:
    
    <!-- Flowchart -->
    \`\`\`mermaid
    graph TD
        A[Start] --> B{Decision}
        B -->|Yes| C[Action 1]
        B -->|No| D[Action 2]
        C --> E[End]
        D --> E
    \`\`\`
    
    <!-- Sequence Diagram -->
    \`\`\`mermaid
    sequenceDiagram
        participant A as Alice
        participant B as Bob
        A->>B: Hello Bob
        B-->>A: Hello Alice
    \`\`\`
    
    <!-- Class Diagram -->
    \`\`\`mermaid
    classDiagram
        class User {
            +String id
            +String name
            +login()
        }
        class Course {
            +String title
            +addStudent()
        }
        User ||--o{ Course : enrolls
    \`\`\`
    
    🎨 Diagram Types:
    - **graph**: Flowcharts, mind maps, network diagrams
    - **sequence**: Communication between participants
    - **class**: Object-oriented class structures
    - **state**: State machine diagrams
    - **entity**: Database ER diagrams
    - **journey**: User experience flows
    - **git**: Version control timelines
    - **gantt**: Project timelines
    - **pie**: Data visualization
    
    ⚙️ Configuration:
    - theme: 'default', 'neutral', 'dark', 'forest'
    - securityLevel: 'strict', 'loose', 'antiscript'
    - startOnLoad: Auto-render on page load
    - themeVariables: Custom color scheme
    
    🔧 Advanced Features:
    - Custom styling with CSS classes
    - Interactive diagrams with click handlers
    - Subgraphs for complex structures
    - Links between diagrams
    - Dynamic content generation
  \`
})`
  },
  {
    id: 'drauu',
    name: 'Drauu',
    description: 'Drawing and annotation tools for presentations',
    dependencies: ['drauu', '@slidev/preset-drauu'],
    configFile: 'drauu.config.ts',
    defaultConfig: `import { defineConfig } from '@slidev/types'

export default defineConfig({
  drauu: {
    // Drawing and annotation configuration
    brush: {
      size: 4,
      color: '#ff0000'
    },
    // Additional drawing options
    classes: {
      drawing: 'drawing-canvas',
      svg: 'drawing-svg'
    }
  },
  info: \`
    ✅ Drauu module configured and ready!
    
    🎨 Features enabled:
    - Hand-drawn annotations on slides
    - Arrow and shape drawing tools
    - Text annotations
    - Interactive drawing canvas
    - Save and load drawings
    
    📝 Usage in slides:
    \`\`\`html
    <div class="drawing-canvas">
      <!-- Interactive drawing area -->
    </div>
    
    <script setup>
    import { useDrauu } from 'drauu'
    const { brush, svg } = useDrauu()
    </script>
    \`\`\`
    
    🖌️ Drawing tools:
    - Brush (customizable size and color)
    - Arrow tool
    - Shape tools (rectangle, circle)
    - Text annotations
    - Eraser
    
    ⚙️ Configuration:
    - brush.size: Line width (default: 4)
    - brush.color: Default brush color
    - classes.drawing: CSS class for drawing canvas
    - classes.svg: CSS class for SVG elements
    
    🎯 Advanced usage:
    \`\`\`vue
    <script setup>
    import { useDrauu } from 'drauu'
    
    const drauu = useDrauu({
      brush: {
        size: 6,
        color: '#3b82f6'
      }
    })
    
    function clearCanvas() {
      drauu.clear()
    }
    </script>
    \`\`\`
  \`
})`
  },
  {
    id: 'iconify',
    name: 'Iconify',
    description: 'Extensive icon library for presentations',
    dependencies: ['@iconify/vue', '@iconify/json'],
    configFile: 'iconify.config.ts',
    defaultConfig: `import { defineConfig } from '@slidev/types'

export default defineConfig({
  // Iconify configuration for sli.dev
  // Using @iconify/vue plugin for proper integration
  
  info: \`
    ✅ Iconify module configured and ready!
    
    📦 Required packages will be installed automatically:
    - @iconify/vue (Vue 3 component)
    - @iconify/json (Icon collections)
    
    🎯 Usage in your slides:
    
    <!-- Method 1: Using @iconify/vue component -->
    <script setup>
    import { Icon } from '@iconify/vue'
    </script>
    
    <Icon icon="mdi:home" style="font-size: 32px; color: #3498db;" />
    <Icon icon="carbon:code" style="font-size: 24px; color: #e74c3c;" />
    
    <!-- Method 2: Using iconify-icon web component -->
    <iconify-icon icon="mdi:home" style="color: #3498db;"></iconify-icon>
    
    📚 Available collections:
    - mdi: (Material Design Icons - 7000+ icons)
    - carbon: (IBM Carbon Icons - 1600+ icons)
    
    🔗 Find more icons: https://iconify.design/icon-sets/
  \`
})`
  }
];

/** Default modules (none selected by default) */
export const DEFAULT_MODULES: string[] = [];

/** Module configuration file extension */
export const MODULE_CONFIG_EXTENSION = '.config.ts';
