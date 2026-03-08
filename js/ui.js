import {
  getAllConfigs, getActiveConfigId, getActiveConfig, setActiveConfig,
  createConfig, renameConfig, deleteConfig, updateConfig,
  getUnit, setUnit, MM_PER_INCH
} from './config.js';
import { getAllBitCategories, getBitTypeSVG, getBitType } from './bit-types.js';

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
const DIMENSION_FIELDS = ['padding', 'holeDepth', 'plateHeight', 'hexWidth', 'labelDepth', 'cornerRadius', 'textLineWidth'];

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
    el.textContent = unit;
  });
}

// ---- Render config list ----
function renderConfigList() {
  const container = document.getElementById('config-list');
  const configs = getAllConfigs();
  const activeId = getActiveConfigId();

  container.innerHTML = '';
  configs.forEach(c => {
    const item = document.createElement('div');
    item.className = `config-item${c.id === activeId ? ' active' : ''}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'config-name';
    nameSpan.textContent = c.name;
    item.appendChild(nameSpan);

    // Add explicitly requested rename button
    const renameBtn = document.createElement('button');
    renameBtn.className = 'config-rename-btn';
    renameBtn.innerHTML = '✎';
    renameBtn.title = 'Rename';
    item.appendChild(renameBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'config-rename-btn config-delete-btn';
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    deleteBtn.title = 'Delete';
    item.appendChild(deleteBtn);

    item.dataset.id = c.id;

    // Click to select
    item.addEventListener('click', (e) => {
      if (e.target === renameBtn || e.target === deleteBtn) return;
      if (c.id !== getActiveConfigId()) {
        setActiveConfig(c.id);
        renderConfigList();
        renderParams();
        fireChange();
      }
    });

    const triggerRename = (e) => {
      if (e) e.preventDefault();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = c.name;
      input.className = 'config-item-editing';
      // Match the exact rendered height of the item being replaced
      input.style.height = item.offsetHeight + 'px';
      input.style.boxSizing = 'border-box';
      item.replaceWith(input);
      input.focus();
      input.select();

      const finish = () => {
        const newName = input.value.trim() || c.name;
        renameConfig(c.id, newName);
        renderConfigList();
      };
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { input.blur(); }
        if (ev.key === 'Escape') { input.value = c.name; input.blur(); }
      });
    };

    // Double-click to rename
    item.addEventListener('dblclick', triggerRename);
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerRename();
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (c.id !== getActiveConfigId()) {
        setActiveConfig(c.id);
        renderConfigList();
        renderParams();
      }
      document.getElementById('modal-config-name').textContent = c.name;
      document.getElementById('modal-overlay').style.display = 'flex';
    });

    container.appendChild(item);
  });

  const newBtnItem = document.createElement('div');
  newBtnItem.className = 'config-item';
  newBtnItem.style.justifyContent = 'center';
  newBtnItem.innerHTML = `<span style="color:var(--accent);font-weight:600;">＋ New Configuration</span>`;
  newBtnItem.addEventListener('click', () => {
    createConfig('New Configuration');
    renderConfigList();
    renderParams();
    fireChange();
  });
  container.appendChild(newBtnItem);
}

// ---- Render slot list with Custom Select ----
function renderSlots(containerId, slots, rowKey) {
  const container = document.getElementById(containerId);
  const categories = getAllBitCategories();

  container.innerHTML = slots.map((slot, i) => {
    const bitTypeData = getBitType(slot.bitType) || getBitType('phillips');
    const svgIcon = getBitTypeSVG(bitTypeData.id, 20);

    let optionsHtml = '';
    categories.forEach(cat => {
      optionsHtml += `<div class="select-optgroup">${cat.category}</div>`;
      cat.types.forEach(t => {
        optionsHtml += `<div class="select-option ${t.id === slot.bitType ? 'selected' : ''}" data-value="${t.id}">
          <div class="select-option-icon">${getBitTypeSVG(t.id, 20)}</div>
          <span class="select-option-text">${t.name}</span>
        </div>`;
      });
    });

    return `
      <div class="slot-item" data-row="${rowKey}" data-index="${i}">
        <span class="slot-index">${i + 1}</span>
        <span class="slot-drag-handle" title="Drag to reorder" style="cursor: grab; color: var(--text-muted);">☰</span>

        <div class="custom-select" tabindex="0" data-row="${rowKey}" data-index="${i}">
          <div class="select-selected" title="${bitTypeData.name}">
            ${svgIcon}
          </div>
          <div class="select-items select-hide">
            ${optionsHtml}
          </div>
        </div>

        <input type="text" data-row="${rowKey}" data-index="${i}" class="slot-label-input"
               value="${escapeHtml(slot.label)}" placeholder="Label">
        <button class="btn btn-sm btn-delete-slot" data-row="${rowKey}" data-index="${i}" title="Remove Slot" style="padding: 2px 6px; margin-left: 4px; background: transparent; color: var(--text-muted); border: none;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </div>`;
  }).join('');

  // Attach Custom Select Events
  container.querySelectorAll('.custom-select').forEach(sel => {
    const selectedDiv = sel.querySelector('.select-selected');
    const itemsDiv = sel.querySelector('.select-items');
    const row = sel.dataset.row;
    const idx = parseInt(sel.dataset.index);

    selectedDiv.addEventListener('click', function(e) {
      e.stopPropagation();
      closeAllSelect(sel);
      itemsDiv.classList.toggle('select-hide');
      sel.classList.toggle('select-active');
    });

    itemsDiv.querySelectorAll('.select-option').forEach(opt => {
      opt.addEventListener('click', function(e) {
        e.stopPropagation();
        const val = this.dataset.value;
        const cfg = getActiveConfig();
        cfg[row][idx].bitType = val;
        updateConfig(cfg.id, { [row]: cfg[row] });

        // Re-render immediately to show new SVG
        renderSlots(containerId, getActiveConfig()[row], row);
        debouncedChange();
      });
    });
  });

  // Attach Input Events
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

  // Delete Buttons
  container.querySelectorAll('.btn-delete-slot').forEach(btn => {
    btn.addEventListener('click', () => {
      const cfg = getActiveConfig();
      const row = btn.dataset.row;
      const idx = parseInt(btn.dataset.index);
      cfg[row].splice(idx, 1);

      // Enforce at least 1 slot per row
      if (cfg[row].length === 0) {
        cfg[row].push({ bitType: 'phillips', label: '' });
      }

      const rowCountKey = row === 'row1Slots' ? 'row1SlotCount' : 'row2SlotCount';
      updateConfig(cfg.id, { [row]: cfg[row], [rowCountKey]: cfg[row].length });
      renderParams();
      debouncedChange();
    });
  });

  // Drag and Drop — only initiated from the drag handle to avoid blocking text input selection
  let draggedItem = null;
  let lastValidTarget = null;   // last slot-item the indicator was shown next to
  let lastValidBefore = true;   // whether indicator was above that item
  let dropHandled = false;      // did a drop event already fire?

  // Drop indicator — inserted directly into the flex column as a real sibling (no absolute math)
  const dropIndicator = document.createElement('div');
  dropIndicator.className = 'drag-drop-indicator';

  function hideDragIndicator() {
    if (dropIndicator.parentNode) dropIndicator.parentNode.removeChild(dropIndicator);
  }

  function showDragIndicator(referenceItem, insertBefore) {
    hideDragIndicator();
    if (insertBefore) {
      referenceItem.parentNode.insertBefore(dropIndicator, referenceItem);
    } else {
      referenceItem.parentNode.insertBefore(dropIndicator, referenceItem.nextSibling);
    }
    lastValidTarget = referenceItem;
    lastValidBefore = insertBefore;
  }

  function applyReorder() {
    if (!draggedItem || !lastValidTarget || draggedItem === lastValidTarget) return;
    const dropRow = lastValidTarget.dataset.row;
    if (dropRow !== draggedItem.dataset.row) return;
    const dragIdx = parseInt(draggedItem.dataset.index);
    const dropIdx = parseInt(lastValidTarget.dataset.index);
    const cfg = getActiveConfig();
    const element = cfg[dropRow].splice(dragIdx, 1)[0];
    let insertIdx = dropIdx;
    if (dragIdx < dropIdx) insertIdx--;
    if (!lastValidBefore) insertIdx++;
    cfg[dropRow].splice(Math.max(0, Math.min(insertIdx, cfg[dropRow].length)), 0, element);
    updateConfig(cfg.id, { [dropRow]: cfg[dropRow] });
    renderParams();
    debouncedChange();
  }

  // Container-level dragover covers gap between items (dead zone fix) and items outside the list
  container.addEventListener('dragover', (e) => {
    e.preventDefault(); // never show forbidden cursor
    if (!draggedItem) return;
    const items = [...container.querySelectorAll('.slot-item')]
      .filter(it => it !== draggedItem && it.dataset.row === draggedItem.dataset.row);
    if (!items.length) return;
    // Find nearest item by vertical midpoint distance
    let nearest = null, nearestDist = Infinity, nearestBefore = true;
    for (const it of items) {
      const r = it.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const dist = Math.abs(e.clientY - mid);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = it;
        nearestBefore = e.clientY < mid;
      }
    }
    if (nearest) showDragIndicator(nearest, nearestBefore);
  });

  // Container-level drop (catches drops on gaps between items)
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    dropHandled = true;
    applyReorder();
    hideDragIndicator();
  });

  container.querySelectorAll('.slot-item').forEach(item => {
    const handle = item.querySelector('.slot-drag-handle');

    handle.addEventListener('pointerdown', () => { item.draggable = true; });

    item.addEventListener('dragstart', function(e) {
      if (!item.draggable) { e.preventDefault(); return; }
      draggedItem = item;
      lastValidTarget = null;
      dropHandled = false;
      setTimeout(() => { item.style.opacity = '0.4'; }, 0);
    });

    item.addEventListener('dragend', function() {
      item.draggable = false;
      item.style.opacity = '1';
      // If the user dropped outside the container, apply to last valid preview position
      if (!dropHandled && lastValidTarget) applyReorder();
      draggedItem = null;
      lastValidTarget = null;
      dropHandled = false;
      hideDragIndicator();
    });
  });
}

function closeAllSelect(elmnt) {
  const items = document.getElementsByClassName("select-items");
  const selects = document.getElementsByClassName("custom-select");
  for (let i = 0; i < items.length; i++) {
    if (elmnt !== selects[i]) {
      items[i].classList.add("select-hide");
      selects[i].classList.remove("select-active");
    }
  }
}
document.addEventListener("click", closeAllSelect);

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

  // Removed numeric slot counts

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
  // Modal cancel
  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
  });

  // Modal confirm delete
  document.getElementById('modal-confirm').addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
    deleteConfig(getActiveConfigId());
    renderConfigList();
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
        if (field === 'holeDepth') {
          const cfg = getActiveConfig();
          const oldDepth = cfg.holeDepth;
          const newDepth = displayToMm(val);
          const diff = newDepth - oldDepth;

          updateConfig(cfg.id, {
            holeDepth: newDepth,
            plateHeight: cfg.plateHeight + diff
          });

          // Re-render params to update plateHeight input visually
          document.getElementById('plateHeight').value = mmToDisplay(cfg.plateHeight + diff);
        } else {
          updateConfig(getActiveConfigId(), { [field]: displayToMm(val) });
        }
        debouncedChange();
      }
    });
  }

  // Add Slot buttons
  ['row1', 'row2'].forEach(r => {
    document.getElementById(`btn-add-${r}-slot`)?.addEventListener('click', () => {
      const cfg = getActiveConfig();
      const rowKey = `${r}Slots`;
      const countKey = `${r}SlotCount`;
      const arr = cfg[rowKey];
      const newSlot = arr.length > 0 ? { ...arr[arr.length - 1] } : { bitType: 'phillips', label: '' };
      arr.push(newSlot);
      updateConfig(cfg.id, { [rowKey]: arr, [countKey]: arr.length });
      renderParams();
      debouncedChange();
    });
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
  renderConfigList();
  renderParams();
}
