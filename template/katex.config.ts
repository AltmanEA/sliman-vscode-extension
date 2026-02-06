import { defineConfig } from '@slidev/types'

export default defineConfig({
  katex: {
    // KaTeX configuration options
    macros: {
      // Custom macros can be defined here
      "\\RR": "\\mathbb{R}"
    }
  }
})