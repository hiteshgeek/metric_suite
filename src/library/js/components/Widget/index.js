/**
 * Widget Base System
 * Unified widget architecture for Dashboard components
 * Supports: Charts, Counters, Lists, Tables, Cards
 */

import { generateId, deepMerge } from '../Graph/utils.js';

// Import and re-export constants from separate file to avoid circular dependencies
export {
  WIDGET_TYPES,
  WIDGET_CATEGORIES,
  DEFAULT_WIDGET_CONFIG,
  getWidgetTypeLabel,
  getWidgetCategory,
  getAvailableWidgetTypes,
} from './constants.js';

import { WIDGET_TYPES, DEFAULT_WIDGET_CONFIG } from './constants.js';

/**
 * Base Widget class - abstract factory pattern
 */
export class Widget {
  constructor(container, config = {}) {
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('Widget: Container element not found');
    }

    // Generate ID if not provided
    this.id = config.id || generateId('widget');
    this.container.id = this.id;

    // Merge config with defaults
    this.config = deepMerge({ ...DEFAULT_WIDGET_CONFIG }, config);

    // State
    this.data = null;
    this.loading = false;
    this.error = null;
    this.refreshTimer = null;

    // Initialize
    this._init();
  }

  /**
   * Initialize the widget - override in subclasses
   */
  _init() {
    this.container.className = 'ms-widget';
    this.container.setAttribute('data-widget-type', this.config.type);
    this._applyStyles();
  }

  /**
   * Apply custom styling from config
   */
  _applyStyles() {
    const { style } = this.config;

    if (style.backgroundColor) {
      this.container.style.backgroundColor = style.backgroundColor;
    }
    if (style.borderRadius) {
      this.container.style.borderRadius = `${style.borderRadius}px`;
    }
    if (style.padding) {
      this.container.style.padding = `${style.padding}px`;
    }
    if (style.border) {
      this.container.style.border = style.border;
    }
    if (style.shadow && style.shadow !== 'none') {
      this.container.classList.add(`ms-widget--shadow-${style.shadow}`);
    }
  }

  /**
   * Render the widget - override in subclasses
   */
  render() {
    throw new Error('Widget.render() must be implemented by subclass');
  }

  /**
   * Set data and re-render
   */
  setData(data) {
    this.data = data;
    this.render();
    return this;
  }

  /**
   * Update configuration
   */
  setConfig(config) {
    this.config = deepMerge(this.config, config);
    this._applyStyles();
    this.render();
    return this;
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.loading = true;
    this.container.classList.add('ms-widget--loading');

    // Add loading spinner if not exists
    if (!this.container.querySelector('.ms-widget__loader')) {
      const loader = document.createElement('div');
      loader.className = 'ms-widget__loader';
      loader.innerHTML = '<div class="ms-widget__spinner"></div>';
      this.container.appendChild(loader);
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.loading = false;
    this.container.classList.remove('ms-widget--loading');
    const loader = this.container.querySelector('.ms-widget__loader');
    if (loader) loader.remove();
  }

  /**
   * Show error state
   */
  showError(message) {
    this.error = message;
    this.container.classList.add('ms-widget--error');

    const errorEl = document.createElement('div');
    errorEl.className = 'ms-widget__error';
    errorEl.innerHTML = `
      <i class="fa-solid fa-circle-exclamation"></i>
      <span>${message}</span>
    `;
    this.container.innerHTML = '';
    this.container.appendChild(errorEl);
  }

  /**
   * Clear error state
   */
  clearError() {
    this.error = null;
    this.container.classList.remove('ms-widget--error');
    const errorEl = this.container.querySelector('.ms-widget__error');
    if (errorEl) errorEl.remove();
  }

  /**
   * Load data from API
   */
  async loadData(url = null, options = {}) {
    const queryUrl = url || this.config.query.source;
    if (!queryUrl) {
      console.warn('Widget: No data source configured');
      return null;
    }

    this.showLoading();
    this.clearError();

    try {
      const response = await fetch(queryUrl, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body
          ? JSON.stringify(options.body)
          : this.config.query.rawQuery
            ? JSON.stringify({ query: this.config.query.rawQuery })
            : undefined,
      });

      const result = await response.json();

      if (result.success && result.data) {
        this.setData(this._mapData(result.data));
      } else {
        this.showError(result.error || 'Failed to load data');
      }

      return result;
    } catch (error) {
      console.error('Widget: Failed to load data', error);
      this.showError('Network error');
      throw error;
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Map raw data to widget format using config.query.mapping
   */
  _mapData(data) {
    const mapping = this.config.query.mapping;
    if (!mapping || Object.keys(mapping).length === 0) {
      return data;
    }

    // Simple mapping for single row
    if (Array.isArray(data) && data.length === 1 && mapping.value) {
      return {
        value: data[0][mapping.value],
        label: mapping.label ? data[0][mapping.label] : undefined,
        ...data[0],
      };
    }

    return data;
  }

  /**
   * Start auto-refresh
   */
  startRefresh() {
    const { enabled, interval } = this.config.query.refresh;
    if (!enabled || !interval) return;

    this.stopRefresh();
    this.refreshTimer = setInterval(() => {
      this.loadData();
    }, interval);
  }

  /**
   * Stop auto-refresh
   */
  stopRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Export as JSON
   */
  toJSON() {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * Destroy widget and cleanup
   */
  destroy() {
    this.stopRefresh();
    this.container.innerHTML = '';
    this.container = null;
  }
}

/**
 * Widget Factory - creates appropriate widget instance based on type
 */
export class WidgetFactory {
  static registry = new Map();

  /**
   * Register a widget class for a type
   */
  static register(type, WidgetClass) {
    WidgetFactory.registry.set(type, WidgetClass);
  }

  /**
   * Create a widget instance
   */
  static create(container, config) {
    const type = config.type || WIDGET_TYPES.COUNTER_SINGLE;
    const WidgetClass = WidgetFactory.registry.get(type);

    if (!WidgetClass) {
      console.error(`Widget type '${type}' not registered`);
      return new Widget(container, config);
    }

    return new WidgetClass(container, config);
  }

  /**
   * Get all registered widget types
   */
  static getRegisteredTypes() {
    return Array.from(WidgetFactory.registry.keys());
  }

  /**
   * Check if a type is registered
   */
  static isRegistered(type) {
    return WidgetFactory.registry.has(type);
  }
}

// Re-export related modules
export { WidgetConfigurator } from './WidgetConfigurator.js';
export { QueryEngine } from './QueryEngine.js';
export { DashboardLayout } from './DashboardLayout.js';

export default Widget;
