import {
  getAllConfigs, getActiveConfigId, getActiveConfig, setActiveConfig,
  createConfig, renameConfig, deleteConfig, updateConfig,
  getUnit, setUnit, MM_PER_INCH
} from './config.js';
import { getAllBitCategories, getBitTypeSVG } from './bit-types.js';

let _onChange = null;

export function setOnChange(fn) { _onChange = fn; }

function fireChange() {
  if (_onChange) _onChange(getActiveConfig());
}

// ---- Auto-expand textarea ----
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// ---- Debounce ----
let _debounceTimer = null;
function debouncedChange() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(fireChange, 300);
}

// ---- Unit conversion helpers ----
const DIMENSION_FIELDS = ['spacing', 'holeDepth', 'hexWidth', 'labelDepth', 'cornerRadius'];

function mmToDisplay(mm) {
  const unit = getUnit();
  if (unit === 'in') return +(mm / MM_PER_INCH).toFixed(4);
  return mm;
}

function displayToMm(val) {
  const unit = getUnit();
  if (unit === 'in') return val * MM_PER_INCH;
  return val;
}

function updateUnitLabels() {
  const unit = getUnit();
  document.querySelectorAll('.unit-label').forEach(el => {
    el.textContent = `(${unit})`;
  });
}

// ---- Render config tabs ----
function renderConfigTabs() {
  const container = document.getElementById('config-tabs');
  const configs = getAllConfigs();
  const activeId = getActiveConfigId();

  container.innerHTML = '';
  configs.forEach(c => {
    const tab = document.createElement('button');
    tab.className = `config-tab${c.id === activeId ? ' active' : ''}`;
    tab.textContent = c.name;
    tab.dataset.id = c.id;

    // Click to select
    tab.addEventListener('click', () => {
      if (c.id !== getActiveConfigId()) {
        setActiveConfig(c.id);
        renderConfigTabs();
        renderParams();
        fireChange();
      }
    });

    // Double-click to rename
    tab.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = c.name;
      input.className = 'config-tab-editing';
      tab.replaceWith(input);
      input.focus();
      input.select();

      const finish = () => {
        const newName = input.value.trim() || c.name;
        renameConfig(c.id, newName);
        renderConfigTabs();
      };
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { input.blur(); }
        if (ev.key === 'Escape') { input.value = c.name; input.blur(); }
      });
    });

    container.appendChild(tab);
  });
}

// ---- Render slot list ----
function renderSlots(containerId, slots, rowKey) {
  const container = document.getElementById(containerId);
  const categories = getAllBitCategories();

  container.innerHTML = slots.map((slot, i) => {
    const optGroups = categories.map(cat => {
      const opts = cat.types.map(t =>
        `<option value="${t.id}" ${t.id === slot.bitType ? 'selected' : ''}>${t.name}</option>`
      ).join('');
      return `<optgroup label="${cat.category}">${opts}</optgroup>`;
    }).join('');

    return `
      <div class="slot-item">
        <span class="slot-index">${i + 1}</span>
        <select data-row="${rowKey}" data-index="${i}" class="slot-type-select">${optGroups}</select>
        <input type="text" data-row="${rowKey}" data-index="${i}" class="slot-label-input"
               value="${escapeHtml(slot.label)}" placeholder="Label">
      </div>`;
  }).join('');

  // Attach events
  container.querySelectorAll('.slot-type-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const cfg = getActiveConfig();
      const row = sel.dataset.row;
      const idx = parseInt(sel.dataset.index);
      cfg[row][idx].bitType = sel.value;
      updateConfig(cfg.id, { [row]: cfg[row] });
      debouncedChange();
    });
  });

  container.querySelectorAll('.slot-label-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const cfg = getActiveConfig();
      const row = inp.dataset.row;
      const idx = parseInt(inp.dataset.index);
      cfg[row][idx].label = inp.value;
      updateConfig(cfg.id, { [row]: cfg[row] });
      debouncedChange();
    });
  });
}

// ---- Render parameter panel ----
function renderParams() {
  const cfg = getActiveConfig();

  // Description
  const desc = document.getElementById('config-description');
  desc.value = cfg.description || '';
  requestAnimationFrame(() => autoResize(desc));

  // Row mode
  document.querySelectorAll('input[name="rowMode"]').forEach(r => {
    r.checked = r.value === cfg.rowMode;
  });

  // Label both sides
  const lbsGroup = document.getElementById('group-label-both-sides');
  lbsGroup.style.display = cfg.rowMode === 'single' ? '' : 'none';
  document.getElementById('labelBothSides').checked = cfg.labelBothSides;

  // Row 2 section
  document.getElementById('row2-section').style.display = cfg.rowMode === 'double' ? '' : 'none';

  // Number fields (convert to display unit)
  for (const field of DIMENSION_FIELDS) {
    const el = document.getElementById(field);
    if (el) el.value = mmToDisplay(cfg[field] ?? 0);
  }

  // Slot counts (not unit-dependent)
  document.getElementById('row1SlotCount').value = cfg.row1SlotCount;
  document.getElementById('row2SlotCount').value = cfg.row2SlotCount;

  // Unit labels
  updateUnitLabels();

  // Slots
  renderSlots('row1-slots', cfg.row1Slots, 'row1Slots');
  if (cfg.rowMode === 'double') {
    renderSlots('row2-slots', cfg.row2Slots, 'row2Slots');
  }
}

// ---- Escape HTML ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Wire up all events ----
export function initUI() {
  // New config
  document.getElementById('btn-new-config').addEventListener('click', () => {
    createConfig('New Configuration');
    renderConfigTabs();
    renderParams();
    fireChange();
  });

  // Delete config (open modal)
  document.getElementById('btn-delete-config').addEventListener('click', () => {
    const cfg = getActiveConfig();
    document.getElementById('modal-config-name').textContent = cfg.name;
    document.getElementById('modal-overlay').style.display = 'flex';
  });

  // Modal cancel
  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
  });

  // Modal confirm delete
  document.getElementById('modal-confirm').addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
    deleteConfig(getActiveConfigId());
    renderConfigTabs();
    renderParams();
    fireChange();
  });

  // Close modal on overlay click
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });

  // Description
  const descEl = document.getElementById('config-description');
  descEl.addEventListener('input', () => {
    autoResize(descEl);
    updateConfig(getActiveConfigId(), { description: descEl.value });
  });

  // Row mode
  document.querySelectorAll('input[name="rowMode"]').forEach(r => {
    r.addEventListener('change', () => {
      updateConfig(getActiveConfigId(), { rowMode: r.value });
      renderParams();
      debouncedChange();
    });
  });

  // Label both sides
  document.getElementById('labelBothSides').addEventListener('change', (e) => {
    updateConfig(getActiveConfigId(), { labelBothSides: e.target.checked });
    debouncedChange();
  });

  // Numeric dimension fields
  for (const field of DIMENSION_FIELDS) {
    document.getElementById(field)?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        updateConfig(getActiveConfigId(), { [field]: displayToMm(val) });
        debouncedChange();
      }
    });
  }

  // Slot counts
  document.getElementById('row1SlotCount').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= 30) {
      updateConfig(getActiveConfigId(), { row1SlotCount: val });
      renderSlots('row1-slots', getActiveConfig().row1Slots, 'row1Slots');
      debouncedChange();
    }
  });

  document.getElementById('row2SlotCount').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= 30) {
      updateConfig(getActiveConfigId(), { row2SlotCount: val });
      renderSlots('row2-slots', getActiveConfig().row2Slots, 'row2Slots');
      debouncedChange();
    }
  });

  // Unit toggle
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newUnit = btn.dataset.unit;
      const oldUnit = getUnit();
      if (newUnit === oldUnit) return;

      setUnit(newUnit);
      document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === newUnit));

      // Re-render fields with new unit values
      renderParams();
    });
  });

  // Initialize unit toggle state
  const currentUnit = getUnit();
  document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === currentUnit));

  // Initial render
  renderConfigTabs();
  renderParams();
}
