---
title: Iconify Module Test
canvasWidth: 1280
routerMode: history
---

# Iconify Module Test

## Test with @iconify/vue

<script setup>
import { Icon } from '@iconify/vue'
</script>

### Material Design Icons

<div style="display: flex; gap: 20px; align-items: center; font-size: 32px; margin: 20px 0;">
  <Icon icon="mdi:home" style="color: #3498db;" />
  <Icon icon="mdi:heart" style="color: #e74c3c;" />
  <Icon icon="mdi:star" style="color: #f39c12;" />
  <Icon icon="mdi:check" style="color: #27ae60;" />
</div>

### Carbon Icons

<div style="display: flex; gap: 20px; align-items: center; font-size: 32px; margin: 20px 0;">
  <Icon icon="carbon:code" style="color: #3498db;" />
  <Icon icon="carbon:play" style="color: #27ae60;" />
  <Icon icon="carbon:settings" style="color: #f39c12;" />
</div>

### Custom Sizes

<div style="display: flex; gap: 30px; align-items: center; justify-content: center; margin: 40px 0;">
  <Icon icon="mdi:rocket" style="font-size: 48px; color: #e74c3c;" />
  <Icon icon="mdi:rocket" style="font-size: 64px; color: #e74c3c;" />
  <Icon icon="mdi:rocket" style="font-size: 96px; color: #e74c3c;" />
</div>

---

# Troubleshooting

## If icons don't display:

1. Check that packages are installed:
   ```bash
   npm install @iconify/vue @iconify/json
   ```

2. Check browser console for errors

3. Verify import statement:
   ```javascript
   import { Icon } from '@iconify/vue'
   ```

4. Use correct icon names from: https://iconify.design/icon-sets/