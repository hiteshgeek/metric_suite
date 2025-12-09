/**
 * Theme Switcher Component
 * Provides light/dark/system theme switching with localStorage persistence
 */

const STORAGE_KEY = 'ms-theme';
const THEMES = ['light', 'dark', 'system'];

export class ThemeSwitcher {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      console.error('[ThemeSwitcher] Container not found');
      return;
    }

    this.options = {
      position: options.position || 'inline', // 'inline' | 'fixed'
      showLabels: options.showLabels !== false,
      onChange: options.onChange || null,
      ...options
    };

    this.currentTheme = this.getSavedTheme() || 'system';
    this.init();
  }

  init() {
    this.render();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
    this.watchSystemPreference();
  }

  render() {
    const isFixed = this.options.position === 'fixed';

    this.container.innerHTML = `
      <div class="ms-theme-switcher ${isFixed ? 'ms-theme-switcher--fixed' : ''}">
        <div class="ms-theme-switcher__buttons" role="radiogroup" aria-label="Theme selection">
          <button
            type="button"
            class="ms-theme-switcher__btn ${this.currentTheme === 'light' ? 'ms-theme-switcher__btn--active' : ''}"
            data-theme="light"
            role="radio"
            aria-checked="${this.currentTheme === 'light'}"
            title="Light theme"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            ${this.options.showLabels ? '<span>Light</span>' : ''}
          </button>
          <button
            type="button"
            class="ms-theme-switcher__btn ${this.currentTheme === 'dark' ? 'ms-theme-switcher__btn--active' : ''}"
            data-theme="dark"
            role="radio"
            aria-checked="${this.currentTheme === 'dark'}"
            title="Dark theme"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            ${this.options.showLabels ? '<span>Dark</span>' : ''}
          </button>
          <button
            type="button"
            class="ms-theme-switcher__btn ${this.currentTheme === 'system' ? 'ms-theme-switcher__btn--active' : ''}"
            data-theme="system"
            role="radio"
            aria-checked="${this.currentTheme === 'system'}"
            title="System theme"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            ${this.options.showLabels ? '<span>System</span>' : ''}
          </button>
        </div>
      </div>
    `;

    this.buttons = this.container.querySelectorAll('.ms-theme-switcher__btn');
  }

  bindEvents() {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.setTheme(theme);
      });
    });
  }

  watchSystemPreference() {
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.currentTheme === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  setTheme(theme) {
    if (!THEMES.includes(theme)) {
      console.error(`[ThemeSwitcher] Invalid theme: ${theme}`);
      return;
    }

    this.currentTheme = theme;
    this.saveTheme(theme);
    this.applyTheme(theme);
    this.updateButtons();

    if (this.options.onChange) {
      this.options.onChange(theme, this.getEffectiveTheme());
    }
  }

  applyTheme(theme) {
    const root = document.documentElement;

    if (theme === 'system') {
      root.setAttribute('data-theme', 'system');
    } else {
      root.setAttribute('data-theme', theme);
    }

    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('ms-theme-change', {
      detail: {
        theme,
        effectiveTheme: this.getEffectiveTheme()
      }
    }));
  }

  updateButtons() {
    this.buttons.forEach(btn => {
      const isActive = btn.dataset.theme === this.currentTheme;
      btn.classList.toggle('ms-theme-switcher__btn--active', isActive);
      btn.setAttribute('aria-checked', isActive);
    });
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('[ThemeSwitcher] Could not save theme to localStorage');
    }
  }

  getTheme() {
    return this.currentTheme;
  }

  destroy() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemChange);
    }
    this.container.innerHTML = '';
  }
}

/**
 * Initialize theme on page load (before full DOM ready)
 * Call this in a <script> tag in <head> to prevent flash of wrong theme
 */
export function initTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'system') {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'system');
    }
  } catch (e) {
    // localStorage not available
  }
}

/**
 * Get the current effective theme (resolves 'system' to actual value)
 */
export function getEffectiveTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'system';
  if (saved === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return saved;
}
