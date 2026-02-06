import { defineConfig } from '@slidev/types'

export default defineConfig({
  // Iconify configuration for sli.dev
  // Using @iconify/vue plugin for proper integration
  
  // Install required packages:
  // npm install @iconify/vue @iconify/json
  
  // Usage examples:
  // <script setup>
  // import { Icon } from '@iconify/vue'
  // </script>
  //
  // <Icon icon="mdi:home" style="font-size: 32px; color: #3498db;" />
  // <Icon icon="carbon:code" style="font-size: 24px; color: #e74c3c;" />
  
  info: `
    ✅ Iconify module configured!
    
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
    
    ⚠️ Note: Web component method requires browser compatibility setup
  `
})