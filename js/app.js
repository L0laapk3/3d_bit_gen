/**
 * Main application entry point.
 * Wires together theme, config, UI, model generation, preview, and STL export.
 */

import { initTheme } from './theme.js';
import { initConfigs, getActiveConfig } from './config.js';
import { initUI, setOnChange } from './ui.js';
import { initModeling, buildModel } from './model.js';
import { initPreview, updatePreviewFromSTL } from './preview.js';
import { initSTLExport, geometryToSTLBuffer, downloadSTL } from './stl-export.js';

let currentGeometry = null;

async function init() {
  // 1. Theme
  initTheme();

  // 2. Configs
  initConfigs();

  // 3. UI
  initUI();

  // Show loading state
  const downloadBtn = document.getElementById('btn-download');
  downloadBtn.textContent = '⏳ Loading...';
  downloadBtn.disabled = true;

  // 4. Load 3D libs (async, from CDN)
  try {
    await Promise.all([
      initModeling(),
      initPreview('preview-container'),
      initSTLExport(),
    ]);
  } catch (err) {
    console.error('Failed to load 3D libraries:', err);
    downloadBtn.textContent = '❌ Load Error';
    return;
  }

  downloadBtn.textContent = '⬇ Download (.stl)';
  downloadBtn.disabled = false;

  // 5. Wire config changes → regenerate model
  setOnChange((config) => {
    regenerateModel(config);
  });

  // 6. Download button
  downloadBtn.addEventListener('click', () => {
    if (currentGeometry) {
      const config = getActiveConfig();
      downloadSTL(currentGeometry, config.name);
    }
  });

  // 7. Initial render
  regenerateModel(getActiveConfig());
}

function regenerateModel(config) {
  try {
    currentGeometry = buildModel(config);
    const stlBuffer = geometryToSTLBuffer(currentGeometry);
    updatePreviewFromSTL(stlBuffer);
  } catch (err) {
    console.error('Model generation error:', err);
  }
}

init();
