/**
 * Widget Configurator UI
 * Universal configuration interface for all widget types
 */

import { WIDGET_TYPES, WIDGET_CATEGORIES } from './constants.js';
import { WidgetFactory } from './WidgetFactory.js';

/**
 * Widget configuration schemas for each widget type
 */
const WIDGET_SCHEMAS = {
  // Counter Widgets
  [WIDGET_TYPES.COUNTER_SINGLE]: {
    category: 'counter',
    name: 'Single Counter',
    icon: '123',
    fields: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'Widget title' },
      { key: 'label', label: 'Label', type: 'text', placeholder: 'Value label' },
      { key: 'value', label: 'Value', type: 'number', placeholder: '0' },
      { key: 'prefix', label: 'Prefix', type: 'text', placeholder: '$' },
      { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '%' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'color', label: 'Color', type: 'color', default: '#3b82f6' },
      { key: 'trend', label: 'Trend Value', type: 'number', placeholder: '+5.2' },
      { key: 'trendLabel', label: 'Trend Label', type: 'text', placeholder: 'vs last month' },
    ],
  },
  [WIDGET_TYPES.COUNTER_COMPARISON]: {
    category: 'counter',
    name: 'Comparison Counter',
    icon: '⇅',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'currentValue', label: 'Current Value', type: 'number' },
      { key: 'previousValue', label: 'Previous Value', type: 'number' },
      { key: 'currentLabel', label: 'Current Label', type: 'text', default: 'Current' },
      { key: 'previousLabel', label: 'Previous Label', type: 'text', default: 'Previous' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'color', label: 'Color', type: 'color', default: '#3b82f6' },
    ],
  },
  [WIDGET_TYPES.COUNTER_SPARKLINE]: {
    category: 'counter',
    name: 'Sparkline Counter',
    icon: '📈',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'value', label: 'Current Value', type: 'number' },
      { key: 'sparklineData', label: 'Sparkline Data', type: 'json', placeholder: '[10, 20, 15, 30, 25]' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'color', label: 'Color', type: 'color', default: '#3b82f6' },
    ],
  },
  [WIDGET_TYPES.COUNTER_PROGRESS]: {
    category: 'counter',
    name: 'Progress Counter',
    icon: '◐',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'value', label: 'Current Value', type: 'number' },
      { key: 'max', label: 'Maximum Value', type: 'number', default: 100 },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'color', label: 'Color', type: 'color', default: '#3b82f6' },
      { key: 'showPercentage', label: 'Show Percentage', type: 'checkbox', default: true },
    ],
  },
  [WIDGET_TYPES.COUNTER_GAUGE]: {
    category: 'counter',
    name: 'Gauge Counter',
    icon: '⏲',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'value', label: 'Current Value', type: 'number' },
      { key: 'min', label: 'Minimum', type: 'number', default: 0 },
      { key: 'max', label: 'Maximum', type: 'number', default: 100 },
      { key: 'thresholds', label: 'Thresholds (JSON)', type: 'json', placeholder: '[30, 70]' },
      { key: 'colors', label: 'Colors (JSON)', type: 'json', placeholder: '["#10b981", "#f59e0b", "#ef4444"]' },
    ],
  },

  // List Widgets
  [WIDGET_TYPES.LIST_SIMPLE]: {
    category: 'list',
    name: 'Simple List',
    icon: '☰',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Items (JSON)', type: 'json', placeholder: '[{"text": "Item 1"}, {"text": "Item 2"}]' },
      { key: 'showBullets', label: 'Show Bullets', type: 'checkbox', default: false },
    ],
  },
  [WIDGET_TYPES.LIST_RANKED]: {
    category: 'list',
    name: 'Ranked List',
    icon: '🏆',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Items (JSON)', type: 'json', placeholder: '[{"name": "Item 1", "value": 100}]' },
      { key: 'showBars', label: 'Show Progress Bars', type: 'checkbox', default: true },
      { key: 'showMedals', label: 'Show Medal Colors', type: 'checkbox', default: true },
      { key: 'maxItems', label: 'Max Items', type: 'number', default: 10 },
    ],
  },
  [WIDGET_TYPES.LIST_GROUPED]: {
    category: 'list',
    name: 'Grouped List',
    icon: '📁',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'groups', label: 'Groups (JSON)', type: 'json', placeholder: '[{"name": "Group 1", "items": [...]}]' },
      { key: 'collapsible', label: 'Collapsible Groups', type: 'checkbox', default: true },
      { key: 'defaultExpanded', label: 'Default Expanded', type: 'checkbox', default: true },
    ],
  },
  [WIDGET_TYPES.LIST_AVATAR]: {
    category: 'list',
    name: 'Avatar List',
    icon: '👤',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Items (JSON)', type: 'json', placeholder: '[{"name": "John", "subtitle": "Developer"}]' },
      { key: 'showStatus', label: 'Show Status', type: 'checkbox', default: false },
    ],
  },
  [WIDGET_TYPES.LIST_TIMELINE]: {
    category: 'list',
    name: 'Timeline List',
    icon: '📅',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'events', label: 'Events (JSON)', type: 'json', placeholder: '[{"time": "2024-01-01", "event": "Started"}]' },
      { key: 'showDescriptions', label: 'Show Descriptions', type: 'checkbox', default: true },
    ],
  },

  // Table Widgets
  [WIDGET_TYPES.TABLE_BASIC]: {
    category: 'table',
    name: 'Basic Table',
    icon: '▦',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns (JSON)', type: 'json', placeholder: '[{"key": "name", "label": "Name"}]' },
      { key: 'data', label: 'Data (JSON)', type: 'json', placeholder: '[{"name": "Row 1"}]' },
      { key: 'striped', label: 'Striped Rows', type: 'checkbox', default: false },
    ],
  },
  [WIDGET_TYPES.TABLE_INTERACTIVE]: {
    category: 'table',
    name: 'Interactive Table',
    icon: '⇳',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns (JSON)', type: 'json' },
      { key: 'data', label: 'Data (JSON)', type: 'json' },
      { key: 'sortable', label: 'Enable Sorting', type: 'checkbox', default: true },
      { key: 'filterable', label: 'Enable Filtering', type: 'checkbox', default: true },
      { key: 'selectable', label: 'Enable Selection', type: 'checkbox', default: false },
    ],
  },
  [WIDGET_TYPES.TABLE_PAGINATED]: {
    category: 'table',
    name: 'Paginated Table',
    icon: '📄',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns (JSON)', type: 'json' },
      { key: 'data', label: 'Data (JSON)', type: 'json' },
      { key: 'pageSize', label: 'Page Size', type: 'number', default: 10 },
      { key: 'pageSizeOptions', label: 'Page Size Options', type: 'json', default: '[10, 25, 50, 100]' },
    ],
  },
  [WIDGET_TYPES.TABLE_EXPANDABLE]: {
    category: 'table',
    name: 'Expandable Table',
    icon: '⊞',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns (JSON)', type: 'json' },
      { key: 'data', label: 'Data (JSON)', type: 'json' },
      { key: 'expandField', label: 'Expand Content Field', type: 'text', default: 'details' },
      { key: 'singleExpand', label: 'Single Row Expand', type: 'checkbox', default: false },
    ],
  },
  [WIDGET_TYPES.TABLE_EDITABLE]: {
    category: 'table',
    name: 'Editable Table',
    icon: '✎',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns (JSON)', type: 'json' },
      { key: 'data', label: 'Data (JSON)', type: 'json' },
      { key: 'editableColumns', label: 'Editable Columns', type: 'json', placeholder: '["name", "email"]' },
      { key: 'showActions', label: 'Show Action Buttons', type: 'checkbox', default: true },
    ],
  },

  // Chart Widget
  [WIDGET_TYPES.CHART]: {
    category: 'chart',
    name: 'Chart',
    icon: '📊',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'chartType', label: 'Chart Type', type: 'select', options: [
        { value: 'bar', label: 'Bar Chart' },
        { value: 'line', label: 'Line Chart' },
        { value: 'pie', label: 'Pie Chart' },
        { value: 'donut', label: 'Donut Chart' },
        { value: 'area', label: 'Area Chart' },
        { value: 'scatter', label: 'Scatter Chart' },
        { value: 'radar', label: 'Radar Chart' },
        { value: 'heatmap', label: 'Heatmap' },
        { value: 'funnel', label: 'Funnel Chart' },
        { value: 'gauge', label: 'Gauge Chart' },
      ]},
      { key: 'chartConfig', label: 'Chart Config (JSON)', type: 'json' },
    ],
  },
};

/**
 * Widget Configurator Component
 */
export class WidgetConfigurator {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element
   * @param {Function} options.onSave - Callback when widget is saved
   * @param {Function} options.onCancel - Callback when cancelled
   * @param {Function} options.onChange - Callback when config changes (live preview)
   */
  constructor(options = {}) {
    this.container = options.container;
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.onChange = options.onChange || (() => {});

    this.currentType = null;
    this.currentConfig = {};
    this.element = null;
    this.isOpen = false;
  }

  /**
   * Open configurator for a widget type
   */
  open(type = null, existingConfig = null) {
    this.currentType = type;
    this.currentConfig = existingConfig ? { ...existingConfig } : {};
    this.isOpen = true;
    this.render();
  }

  /**
   * Close configurator
   */
  close() {
    this.isOpen = false;
    if (this.element) {
      this.element.classList.remove('ms-widget-configurator--open');
      setTimeout(() => {
        if (this.element) {
          this.element.remove();
          this.element = null;
        }
      }, 200);
    }
  }

  /**
   * Render the configurator
   */
  render() {
    if (this.element) {
      this.element.remove();
    }

    this.element = document.createElement('div');
    this.element.className = 'ms-widget-configurator';
    this.element.innerHTML = this._buildHTML();

    document.body.appendChild(this.element);

    // Trigger animation
    requestAnimationFrame(() => {
      this.element.classList.add('ms-widget-configurator--open');
    });

    this._bindEvents();
  }

  /**
   * Build HTML structure
   */
  _buildHTML() {
    return `
      <div class="ms-widget-configurator__header">
        <h3 class="ms-widget-configurator__title">
          ${this.currentType ? 'Edit Widget' : 'Add Widget'}
        </h3>
        <button class="ms-widget-configurator__close" data-action="close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="ms-widget-configurator__body">
        ${this._buildTypeSelector()}
        ${this._buildConfigFields()}
        ${this._buildDataSourceSection()}
      </div>
      <div class="ms-widget-configurator__footer">
        <button class="ms-btn ms-btn--secondary" data-action="cancel">Cancel</button>
        <button class="ms-btn ms-btn--primary" data-action="save" ${!this.currentType ? 'disabled' : ''}>
          ${this.currentType ? 'Save Changes' : 'Add Widget'}
        </button>
      </div>
    `;
  }

  /**
   * Build widget type selector
   */
  _buildTypeSelector() {
    const categories = [
      { key: 'counter', label: 'Counters', icon: '123' },
      { key: 'list', label: 'Lists', icon: '☰' },
      { key: 'table', label: 'Tables', icon: '▦' },
      { key: 'chart', label: 'Charts', icon: '📊' },
    ];

    const widgetTypes = Object.entries(WIDGET_SCHEMAS)
      .map(([type, schema]) => ({
        type,
        ...schema,
      }));

    return `
      <div class="ms-widget-configurator__section">
        <h4 class="ms-widget-configurator__section-title">Widget Type</h4>
        <div class="ms-widget-type-selector">
          ${widgetTypes.map(widget => `
            <button
              class="ms-widget-type-selector__btn ${this.currentType === widget.type ? 'ms-widget-type-selector__btn--active' : ''}"
              data-type="${widget.type}"
              title="${widget.name}"
            >
              <span class="ms-widget-type-selector__btn-icon">${widget.icon}</span>
              <span class="ms-widget-type-selector__btn-label">${widget.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Build configuration fields for selected type
   */
  _buildConfigFields() {
    if (!this.currentType || !WIDGET_SCHEMAS[this.currentType]) {
      return `
        <div class="ms-widget-configurator__section">
          <p class="ms-widget-configurator__hint">Select a widget type to configure</p>
        </div>
      `;
    }

    const schema = WIDGET_SCHEMAS[this.currentType];

    return `
      <div class="ms-widget-configurator__section" id="configFields">
        <h4 class="ms-widget-configurator__section-title">${schema.name} Settings</h4>
        ${schema.fields.map(field => this._buildField(field)).join('')}
      </div>
    `;
  }

  /**
   * Build a single field
   */
  _buildField(field) {
    const value = this.currentConfig[field.key] ?? field.default ?? '';
    const id = `field-${field.key}`;

    let input = '';

    switch (field.type) {
      case 'text':
        input = `
          <input
            type="text"
            id="${id}"
            class="ms-widget-configurator__input"
            data-field="${field.key}"
            value="${this._escapeHtml(value)}"
            placeholder="${field.placeholder || ''}"
          />
        `;
        break;

      case 'number':
        input = `
          <input
            type="number"
            id="${id}"
            class="ms-widget-configurator__input"
            data-field="${field.key}"
            value="${value}"
            placeholder="${field.placeholder || ''}"
          />
        `;
        break;

      case 'checkbox':
        input = `
          <label class="ms-checkbox">
            <input
              type="checkbox"
              id="${id}"
              data-field="${field.key}"
              ${value ? 'checked' : ''}
            />
            <span>${field.label}</span>
          </label>
        `;
        // Return early for checkbox since label is different
        return `<div class="ms-widget-configurator__field">${input}</div>`;

      case 'select':
        input = `
          <select
            id="${id}"
            class="ms-widget-configurator__select"
            data-field="${field.key}"
          >
            ${(field.options || []).map(opt => `
              <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        `;
        break;

      case 'json':
        const jsonValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
        input = `
          <textarea
            id="${id}"
            class="ms-widget-configurator__textarea"
            data-field="${field.key}"
            data-type="json"
            placeholder="${field.placeholder || ''}"
            rows="4"
          >${this._escapeHtml(jsonValue)}</textarea>
        `;
        break;

      case 'color':
        input = `
          <div class="ms-color-input">
            <input
              type="color"
              id="${id}"
              data-field="${field.key}"
              value="${value || '#3b82f6'}"
            />
            <input
              type="text"
              class="ms-widget-configurator__input"
              data-field="${field.key}"
              data-color-text="true"
              value="${value || '#3b82f6'}"
              placeholder="#000000"
            />
          </div>
        `;
        break;

      case 'icon':
        input = `
          <input
            type="text"
            id="${id}"
            class="ms-widget-configurator__input"
            data-field="${field.key}"
            value="${this._escapeHtml(value)}"
            placeholder="Icon class (e.g., fa-chart-bar)"
          />
          <span class="ms-widget-configurator__hint">Use FontAwesome or Lucide icon classes</span>
        `;
        break;

      default:
        input = `
          <input
            type="text"
            id="${id}"
            class="ms-widget-configurator__input"
            data-field="${field.key}"
            value="${this._escapeHtml(value)}"
          />
        `;
    }

    return `
      <div class="ms-widget-configurator__field">
        <label class="ms-widget-configurator__label" for="${id}">${field.label}</label>
        ${input}
      </div>
    `;
  }

  /**
   * Build data source section
   */
  _buildDataSourceSection() {
    if (!this.currentType) return '';

    return `
      <div class="ms-widget-configurator__section">
        <h4 class="ms-widget-configurator__section-title">Data Source</h4>
        <div class="ms-widget-configurator__field">
          <label class="ms-widget-configurator__label">Source Type</label>
          <select class="ms-widget-configurator__select" data-field="dataSource.type">
            <option value="static" ${this.currentConfig.dataSource?.type === 'static' ? 'selected' : ''}>Static Data</option>
            <option value="sql" ${this.currentConfig.dataSource?.type === 'sql' ? 'selected' : ''}>SQL Query</option>
            <option value="api" ${this.currentConfig.dataSource?.type === 'api' ? 'selected' : ''}>API Endpoint</option>
          </select>
        </div>
        <div class="ms-widget-configurator__field" id="dataSourceConfig">
          ${this._buildDataSourceConfig()}
        </div>
        <div class="ms-widget-configurator__field">
          <label class="ms-widget-configurator__label">Auto Refresh (seconds)</label>
          <input
            type="number"
            class="ms-widget-configurator__input"
            data-field="refreshInterval"
            value="${this.currentConfig.refreshInterval || ''}"
            placeholder="0 = disabled"
            min="0"
          />
        </div>
      </div>
    `;
  }

  /**
   * Build data source specific config
   */
  _buildDataSourceConfig() {
    const sourceType = this.currentConfig.dataSource?.type || 'static';

    switch (sourceType) {
      case 'sql':
        return `
          <label class="ms-widget-configurator__label">SQL Query</label>
          <textarea
            class="ms-widget-configurator__textarea"
            data-field="dataSource.query"
            placeholder="SELECT * FROM table WHERE..."
            rows="3"
          >${this._escapeHtml(this.currentConfig.dataSource?.query || '')}</textarea>
        `;

      case 'api':
        return `
          <label class="ms-widget-configurator__label">API Endpoint</label>
          <input
            type="text"
            class="ms-widget-configurator__input"
            data-field="dataSource.url"
            value="${this._escapeHtml(this.currentConfig.dataSource?.url || '')}"
            placeholder="https://api.example.com/data"
          />
          <label class="ms-widget-configurator__label" style="margin-top: 12px;">Headers (JSON)</label>
          <textarea
            class="ms-widget-configurator__textarea"
            data-field="dataSource.headers"
            placeholder='{"Authorization": "Bearer token"}'
            rows="2"
          >${this._escapeHtml(this.currentConfig.dataSource?.headers ? JSON.stringify(this.currentConfig.dataSource.headers, null, 2) : '')}</textarea>
        `;

      default:
        return `
          <span class="ms-widget-configurator__hint">
            Use the fields above to enter static data directly
          </span>
        `;
    }
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    // Close button
    this.element.querySelectorAll('[data-action="close"], [data-action="cancel"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.onCancel();
        this.close();
      });
    });

    // Save button
    this.element.querySelector('[data-action="save"]').addEventListener('click', () => {
      const config = this._collectConfig();
      if (this._validateConfig(config)) {
        this.onSave({
          type: this.currentType,
          config,
        });
        this.close();
      }
    });

    // Type selector
    this.element.querySelectorAll('[data-type]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.currentType = type;
        this.currentConfig = {};
        this.render();
      });
    });

    // Field changes
    this.element.querySelectorAll('[data-field]').forEach(input => {
      const eventType = input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(eventType, () => {
        this._updateConfig();
        this.onChange(this._collectConfig());
      });
    });

    // Data source type change
    const sourceTypeSelect = this.element.querySelector('[data-field="dataSource.type"]');
    if (sourceTypeSelect) {
      sourceTypeSelect.addEventListener('change', () => {
        this.currentConfig.dataSource = {
          ...this.currentConfig.dataSource,
          type: sourceTypeSelect.value,
        };
        const configContainer = this.element.querySelector('#dataSourceConfig');
        if (configContainer) {
          configContainer.innerHTML = this._buildDataSourceConfig();
        }
      });
    }

    // Color input sync
    this.element.querySelectorAll('input[type="color"]').forEach(colorInput => {
      const textInput = colorInput.parentElement.querySelector('[data-color-text]');
      if (textInput) {
        colorInput.addEventListener('input', () => {
          textInput.value = colorInput.value;
          this._updateConfig();
        });
        textInput.addEventListener('input', () => {
          if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
            colorInput.value = textInput.value;
          }
          this._updateConfig();
        });
      }
    });

    // Click outside to close
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.onCancel();
        this.close();
      }
    });
  }

  /**
   * Update current config from form
   */
  _updateConfig() {
    const config = this._collectConfig();
    this.currentConfig = config;
  }

  /**
   * Collect config from form fields
   */
  _collectConfig() {
    const config = {};

    this.element.querySelectorAll('[data-field]').forEach(input => {
      const field = input.dataset.field;
      let value;

      if (input.type === 'checkbox') {
        value = input.checked;
      } else if (input.dataset.type === 'json') {
        try {
          value = JSON.parse(input.value);
        } catch {
          value = input.value;
        }
      } else if (input.type === 'number') {
        value = input.value ? parseFloat(input.value) : undefined;
      } else {
        value = input.value;
      }

      // Handle nested fields (e.g., dataSource.type)
      if (field.includes('.')) {
        const parts = field.split('.');
        let obj = config;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
      } else {
        config[field] = value;
      }
    });

    return config;
  }

  /**
   * Validate configuration
   */
  _validateConfig(config) {
    if (!this.currentType) {
      this._showError('Please select a widget type');
      return false;
    }

    const schema = WIDGET_SCHEMAS[this.currentType];
    if (!schema) return true;

    // Check required fields
    for (const field of schema.fields) {
      if (field.required && !config[field.key]) {
        this._showError(`${field.label} is required`);
        return false;
      }
    }

    return true;
  }

  /**
   * Show error message
   */
  _showError(message) {
    // Simple alert for now, could be improved with toast notification
    alert(message);
  }

  /**
   * Escape HTML
   */
  _escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get available widget types
   */
  static getWidgetTypes() {
    return Object.entries(WIDGET_SCHEMAS).map(([type, schema]) => ({
      type,
      name: schema.name,
      icon: schema.icon,
      category: schema.category,
    }));
  }

  /**
   * Get schema for a widget type
   */
  static getSchema(type) {
    return WIDGET_SCHEMAS[type];
  }
}

export default WidgetConfigurator;
