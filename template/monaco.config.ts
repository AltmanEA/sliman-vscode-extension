import { defineConfig } from '@slidev/types'

export default defineConfig({
  monaco: true,
  // Optional: Configure Monaco options
  monacoOptions: {
    theme: 'vs-dark',
    fontSize: 14,
    lineNumbers: 'on',
    minimap: { enabled: false }
  }
})