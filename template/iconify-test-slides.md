---
title: Iconify Test Lecture
canvasWidth: 1280
routerMode: history
---

# Iconify Test

## Material Design Icons

<div style="display: flex; gap: 20px; align-items: center; font-size: 24px; margin: 20px 0;">
  <iconify-icon icon="mdi:home" style="color: #3498db;"></iconify-icon>
  <iconify-icon icon="mdi:account" style="color: #e74c3c;"></iconify-icon>
  <iconify-icon icon="mdi:heart" style="color: #e91e63;"></iconify-icon>
  <iconify-icon icon="mdi:star" style="color: #f39c12;"></iconify-icon>
</div>

## Carbon Icons

<div style="display: flex; gap: 20px; align-items: center; font-size: 24px; margin: 20px 0;">
  <iconify-icon icon="carbon:code" style="color: #2ecc71;"></iconify-icon>
  <iconify-icon icon="carbon:settings" style="color: #f39c12;"></iconify-icon>
  <iconify-icon icon="carbon:play" style="color: #9b59b6;"></iconify-icon>
  <iconify-icon icon="carbon:pause" style="color: #34495e;"></iconify-icon>
</div>

## Large Icons

<div style="display: flex; gap: 30px; align-items: center; justify-content: center; margin: 40px 0;">
  <iconify-icon icon="mdi:rocket" style="font-size: 64px; color: #e74c3c;"></iconify-icon>
  <iconify-icon icon="carbon:lightning" style="font-size: 64px; color: #f1c40f;"></iconify-icon>
  <iconify-icon icon="mdi:rocket-launch" style="font-size: 64px; color: #9b59b6;"></iconify-icon>
</div>

## Testing Different Sizes

<iconify-icon icon="mdi:home" style="font-size: 16px; color: #3498db;"></iconify-icon> Small (16px)

<iconify-icon icon="mdi:home" style="font-size: 32px; color: #3498db;"></iconify-icon> Medium (32px)

<iconify-icon icon="mdi:home" style="font-size: 64px; color: #3498db;"></iconify-icon> Large (64px)

<iconify-icon icon="mdi:home" style="font-size: 128px; color: #3498db;"></iconify-icon> Extra Large (128px)

---

# Troubleshooting

If icons don't display:

1. Check browser console for errors
2. Verify Iconify script is loaded: `https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js`
3. Ensure correct syntax: `icon="collection:name"`
4. Check that required icon collections are installed in package.json