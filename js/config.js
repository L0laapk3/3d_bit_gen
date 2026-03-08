const CONFIGS_KEY = 'configs';
const ACTIVE_KEY = 'activeConfigId';
const UNIT_KEY = 'unit-preference';

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeDefaultSlot(bitType = 'phillips', label = '') {
  return { bitType, label };
}

function makeDefaultConfig(name = 'New Configuration') {
  return {
    id: generateId(),
    name,
    description: '',
    rowMode: 'single',
    labelBothSides: true,
    row1SlotCount: 1,
    row2SlotCount: 1,
    padding: 3,
    holeDepth: 8,
    hexWidth: 6.35,
    labelDepth: 0.5,
    cornerRadius: 1,
    plateHeight: 10,
    textLineWidth: 0.5,
    row1Slots: [ makeDefaultSlot() ],
    row2Slots: [ makeDefaultSlot() ],
  };
}

function makeBuiltinConfigs() {
  const pz = {
    id: generateId(),
    name: 'Pozidrive Set',
    description: '',
    rowMode: 'single',
    labelBothSides: true,
    row1SlotCount: 3,
    row2SlotCount: 1,
    padding: 3,
    holeDepth: 8,
    hexWidth: 6.35,
    labelDepth: 0.5,
    cornerRadius: 1,
    plateHeight: 10,
    textLineWidth: 0.5,
    row1Slots: [
      { bitType: 'pozidrive', label: 'PZ1' },
      { bitType: 'pozidrive', label: 'PZ2' },
      { bitType: 'pozidrive', label: 'PZ3' },
    ],
    row2Slots: [ makeDefaultSlot() ],
  };

  const torx = {
    id: generateId(),
    name: 'Torx Set',
    description: 'https://aliexpress.com/item/1005007268652152.html',
    rowMode: 'single',
    labelBothSides: true,
    row1SlotCount: 8,
    row2SlotCount: 1,
    padding: 3,
    holeDepth: 8,
    hexWidth: 6.35,
    labelDepth: 0.5,
    cornerRadius: 1,
    plateHeight: 10,
    textLineWidth: 0.5,
    row1Slots: [
      { bitType: 'torx', label: 'T8' },
      { bitType: 'torx', label: 'T10' },
      { bitType: 'torx', label: 'T15' },
      { bitType: 'torx', label: 'T20' },
      { bitType: 'torx', label: 'T25' },
      { bitType: 'torx', label: 'T27' },
      { bitType: 'torx', label: 'T30' },
      { bitType: 'torx', label: 'T40' },
    ],
    row2Slots: [ makeDefaultSlot() ],
  };

  return { configs: [pz, torx], activeId: torx.id };
}

function loadConfigs() {
  try {
    const data = localStorage.getItem(CONFIGS_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.warn("Failed to read configs from local storage.", e);
    return null;
  }
}

function saveConfigs(configs) {
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
}

function loadActiveId() {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

// ---- Unit preference ----
export function getUnit() {
  return localStorage.getItem(UNIT_KEY) || 'mm';
}

export function setUnit(unit) {
  localStorage.setItem(UNIT_KEY, unit);
}

export const MM_PER_INCH = 25.4;

// ---- Public API ----

let _configs = [];
let _activeId = null;

export function initConfigs() {
  const stored = loadConfigs();
  if (stored && stored.length > 0) {
    _configs = stored;
    _activeId = loadActiveId();
    if (!_configs.find(c => c.id === _activeId)) {
      _activeId = _configs[0].id;
      saveActiveId(_activeId);
    }
  } else {
    const defaults = makeBuiltinConfigs();
    _configs = defaults.configs;
    _activeId = defaults.activeId;
    saveConfigs(_configs);
    saveActiveId(_activeId);
  }
}

export function getAllConfigs() {
  return _configs;
}

export function getActiveConfigId() {
  return _activeId;
}

export function getActiveConfig() {
  return _configs.find(c => c.id === _activeId) || _configs[0];
}

export function setActiveConfig(id) {
  if (_configs.find(c => c.id === id)) {
    _activeId = id;
    saveActiveId(id);
  }
}

export function createConfig(name) {
  const cfg = makeDefaultConfig(name || 'New Configuration');
  _configs.push(cfg);
  _activeId = cfg.id;
  saveConfigs(_configs);
  saveActiveId(_activeId);
  return cfg;
}

export function duplicateConfig(id) {
  const src = _configs.find(c => c.id === id);
  if (!src) return null;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = generateId();
  copy.name = src.name + ' (Copy)';
  const idx = _configs.indexOf(src);
  _configs.splice(idx + 1, 0, copy);
  _activeId = copy.id;
  saveConfigs(_configs);
  saveActiveId(_activeId);
  return copy;
}

export function renameConfig(id, newName) {
  const cfg = _configs.find(c => c.id === id);
  if (cfg) {
    cfg.name = newName;
    saveConfigs(_configs);
  }
}

export function deleteConfig(id) {
  _configs = _configs.filter(c => c.id !== id);
  if (_configs.length === 0) {
    const cfg = makeDefaultConfig();
    _configs.push(cfg);
  }
  if (_activeId === id) {
    _activeId = _configs[0].id;
    saveActiveId(_activeId);
  }
  saveConfigs(_configs);
}

export function updateConfig(id, changes) {
  const cfg = _configs.find(c => c.id === id);
  if (!cfg) return;
  Object.assign(cfg, changes);

  // Ensure slot arrays match counts
  while (cfg.row1Slots.length < cfg.row1SlotCount) cfg.row1Slots.push(makeDefaultSlot());
  cfg.row1Slots.length = cfg.row1SlotCount;
  while (cfg.row2Slots.length < cfg.row2SlotCount) cfg.row2Slots.push(makeDefaultSlot());
  cfg.row2Slots.length = cfg.row2SlotCount;

  saveConfigs(_configs);
}
