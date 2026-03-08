/**
 * Main application entry point.
 * Wires together theme, config, UI, worker-based model generation, preview, and STL export.
 */

import { initTheme } from './theme.js';
import { initConfigs, getActiveConfig } from './config.js';
import { initUI, setOnChange } from './ui.js';
import { initPreview, updatePreviewFromSTL } from './preview.js';
import { downloadSTLFromBuffer } from './stl-export.js';
import { getAllBitTypes } from './bit-types.js';

let currentSTLBuffer = null;
let worker = null;
let workerReady = false;
let pendingConfig = null;

async function init() {
  // 1. Theme
  initTheme();

  // 2. Configs
  initConfigs();

  // 3. UI
  initUI();

  const downloadBtn = document.getElementById('btn-download');
  downloadBtn.textContent = '⏳ Loading...';
  downloadBtn.disabled = true;

  // 4. Load preview (Three.js)
  try {
    await initPreview('preview-container');
  } catch (err) {
    console.error('Failed to load 3D preview:', err);
    downloadBtn.textContent = '❌ Load Error';
    return;
  }

  // 5. Start web worker for model generation
  worker = new Worker(new URL('./model-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { type, stlBuffer, message } = e.data;

    if (type === 'ready') {
      workerReady = true;
      downloadBtn.textContent = '⬇ Download (.stl)';
      downloadBtn.disabled = false;
      // Build initial model
      regenerateModel(getActiveConfig());
      return;
    }

    if (type === 'result') {
      currentSTLBuffer = stlBuffer;
      updatePreviewFromSTL(stlBuffer, getActiveConfig());
      downloadBtn.textContent = '⬇ Download (.stl)';
      downloadBtn.disabled = false;

      // If another config change came in while building, rebuild
      if (pendingConfig) {
        const cfg = pendingConfig;
        pendingConfig = null;
        regenerateModel(cfg);
      }
      return;
    }

    if (type === 'error') {
      console.error('Worker error:', message);
      downloadBtn.textContent = '⬇ Download (.stl)';
      downloadBtn.disabled = false;
    }
  };

  // 6. Wire config changes
  setOnChange((config) => {
    regenerateModel(config);
  });

  // 7. Download button
  downloadBtn.addEventListener('click', () => {
    if (currentSTLBuffer) {
      const config = getActiveConfig();
      downloadSTLFromBuffer(currentSTLBuffer, config.name);
    }
  });
}

function regenerateModel(config) {
  if (!worker || !workerReady) return;

  const downloadBtn = document.getElementById('btn-download');
  downloadBtn.textContent = '⏳ Building...';

  // Flatten bit types for the worker
  const bitTypes = getAllBitTypes().map(t => ({ id: t.id, geom: t.geom }));

  worker.postMessage({
    type: 'build',
    config: JSON.parse(JSON.stringify(config)), // deep clone for worker
    bitTypes
  });
}

init();
