const STORAGE_KEY = 'theme-preference';

/** @type {'light'|'dark'|'system'} */
let currentPref = 'system';

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  let resolved;
  if (currentPref === 'system') {
    resolved = mediaQuery.matches ? 'dark' : 'light';
  } else {
    resolved = currentPref;
  }
  document.documentElement.setAttribute('data-theme', resolved);
  updateToggleUI();
}

function updateToggleUI() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeValue === currentPref);
  });
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    currentPref = saved;
  }
  applyTheme();

  // Listen for system theme changes
  mediaQuery.addEventListener('change', () => {
    if (currentPref === 'system') applyTheme();
  });

  // Wire up toggle buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPref = btn.dataset.themeValue;
      localStorage.setItem(STORAGE_KEY, currentPref);
      applyTheme();
    });
  });
}
