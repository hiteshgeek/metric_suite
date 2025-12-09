/**
 * Graph Configurator UI Component
 * Provides a complete interface for configuring and previewing graphs
 */

import { Graph } from './index.js';
import { getAvailableTypes } from './types/index.js';
import { createElement, debounce, defaultColors } from './utils.js';
import { SchemaExplorer } from '../SchemaExplorer/index.js';

export class GraphConfigurator {
  constructor(container, options = {}) {
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('GraphConfigurator: Container element not found');
    }

    this.options = {
      apiEndpoint: options.apiEndpoint || '/api/data.php',
      saveEndpoint: options.saveEndpoint || '/api/graph.php',
      schemaEndpoint: options.schemaEndpoint || '/api/schema.php',
      onSave: options.onSave || null,
      onExport: options.onExport || null,
      ...options,
    };

    // Current configuration state
    this.state = {
      name: '',
      type: 'bar',
      query: '',
      xColumn: '',
      yColumn: '',
      title: '',
      orientation: 'vertical',
      showLegend: true,
      legendPosition: 'top',
      showLabels: false,
      animation: true,
      colors: [...defaultColors],
      data: [],
      columns: [],
    };

    this.graph = null;
    this.schemaExplorer = null;
    this.isLoading = false;

    this._init();
  }

  _init() {
    this.container.innerHTML = '';
    this.container.className = 'ms-configurator';

    // Create main layout
    this._createLayout();

    // Initialize preview graph
    this._initPreviewGraph();

    // Initialize schema explorer
    this._initSchemaExplorer();

    // Bind events
    this._bindEvents();
  }

  _createLayout() {
    // Header
    const header = createElement('div', { className: 'ms-configurator__header' }, [
      createElement('h1', { className: 'ms-configurator__title' }, ['Graph Configurator']),
      createElement(
        'button',
        {
          className: 'ms-btn ms-btn--primary',
          id: 'ms-save-btn',
        },
        ['Save Configuration']
      ),
    ]);

    // Main content wrapper
    const content = createElement('div', { className: 'ms-configurator__content' });

    // Schema explorer panel (left sidebar)
    const schemaPanel = createElement('div', { className: 'ms-configurator__schema' }, [
      createElement('div', { id: 'ms-schema-explorer' }),
    ]);

    // Settings panel (middle)
    const settings = this._createSettingsPanel();

    // Preview panel (right)
    const preview = this._createPreviewPanel();

    content.appendChild(schemaPanel);
    content.appendChild(settings);
    content.appendChild(preview);

    this.container.appendChild(header);
    this.container.appendChild(content);
  }

  _createSettingsPanel() {
    const panel = createElement('div', { className: 'ms-configurator__settings' });

    // Basic Info Section
    panel.appendChild(this._createSection('Basic Info', [
      this._createField('text', 'name', 'Graph Name', 'Enter a name for this graph'),
      this._createField('select', 'type', 'Graph Type', '', getAvailableTypes()),
    ]));

    // Data Source Section
    panel.appendChild(this._createSection('Data Source', [
      createElement('div', { className: 'ms-field' }, [
        createElement('label', { className: 'ms-field__label', for: 'ms-query' }, [
          'SQL Query',
          createElement('span', { className: 'ms-field__hint' }, ['Click tables/columns in Schema Explorer to build query']),
        ]),
        createElement('textarea', {
          className: 'ms-textarea ms-textarea--code',
          id: 'ms-query',
          'data-field': 'query',
          placeholder: 'SELECT column1, column2 FROM table',
          rows: '6',
        }),
      ]),
      createElement('div', { className: 'ms-field__row' }, [
        createElement(
          'button',
          {
            className: 'ms-btn ms-btn--secondary',
            id: 'ms-test-query-btn',
          },
          ['Test Query']
        ),
        createElement(
          'button',
          {
            className: 'ms-btn ms-btn--outline',
            id: 'ms-clear-query-btn',
          },
          ['Clear']
        ),
        createElement('span', { className: 'ms-query-status', id: 'ms-query-status' }),
      ]),
      this._createField('select', 'xColumn', 'X-Axis Column', '', []),
      this._createField('select', 'yColumn', 'Y-Axis Column', '', []),
    ]));

    // Appearance Section
    panel.appendChild(this._createSection('Appearance', [
      this._createField('text', 'title', 'Chart Title', 'Enter chart title'),
      this._createField('select', 'orientation', 'Orientation', '', [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' },
      ]),
      this._createField('checkbox', 'showLegend', 'Show Legend'),
      this._createField('select', 'legendPosition', 'Legend Position', '', [
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ]),
      this._createField('checkbox', 'showLabels', 'Show Data Labels'),
      this._createField('checkbox', 'animation', 'Enable Animation'),
      this._createColorPicker(),
    ]));

    return panel;
  }

  _createPreviewPanel() {
    const panel = createElement('div', { className: 'ms-configurator__preview' });

    // Preview container
    const previewContainer = createElement('div', { className: 'ms-preview' }, [
      createElement('div', { className: 'ms-preview__header' }, [
        createElement('h3', {}, ['Live Preview']),
      ]),
      createElement('div', {
        className: 'ms-preview__chart',
        id: 'ms-preview-chart',
      }),
    ]);

    // Export section
    const exportSection = createElement('div', { className: 'ms-export' }, [
      createElement('h3', {}, ['Export']),
      createElement('div', { className: 'ms-export__buttons' }, [
        createElement(
          'button',
          {
            className: 'ms-btn ms-btn--outline',
            id: 'ms-export-html-btn',
          },
          ['Copy HTML']
        ),
        createElement(
          'button',
          {
            className: 'ms-btn ms-btn--outline',
            id: 'ms-export-js-btn',
          },
          ['Copy JS']
        ),
        createElement(
          'button',
          {
            className: 'ms-btn ms-btn--outline',
            id: 'ms-export-json-btn',
          },
          ['Download JSON']
        ),
      ]),
    ]);

    panel.appendChild(previewContainer);
    panel.appendChild(exportSection);

    return panel;
  }

  _createSection(title, children) {
    const section = createElement('div', { className: 'ms-section' }, [
      createElement('h3', { className: 'ms-section__title' }, [title]),
      createElement('div', { className: 'ms-section__content' }, children),
    ]);
    return section;
  }

  _createField(type, name, label, placeholder = '', options = []) {
    const field = createElement('div', { className: 'ms-field' });

    if (type === 'checkbox') {
      const wrapper = createElement('label', { className: 'ms-checkbox' }, [
        createElement('input', {
          type: 'checkbox',
          id: `ms-${name}`,
          'data-field': name,
          checked: this.state[name] ? 'checked' : undefined,
        }),
        createElement('span', { className: 'ms-checkbox__label' }, [label]),
      ]);
      field.appendChild(wrapper);
    } else {
      field.appendChild(
        createElement('label', { className: 'ms-field__label', for: `ms-${name}` }, [label])
      );

      if (type === 'select') {
        const select = createElement('select', {
          className: 'ms-select',
          id: `ms-${name}`,
          'data-field': name,
        });
        options.forEach(opt => {
          const option = createElement('option', { value: opt.value }, [opt.label]);
          if (opt.value === this.state[name]) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        field.appendChild(select);
      } else if (type === 'textarea') {
        field.appendChild(
          createElement('textarea', {
            className: 'ms-textarea',
            id: `ms-${name}`,
            'data-field': name,
            placeholder: placeholder,
            rows: '4',
          })
        );
      } else {
        field.appendChild(
          createElement('input', {
            type: type,
            className: 'ms-input',
            id: `ms-${name}`,
            'data-field': name,
            placeholder: placeholder,
            value: this.state[name] || '',
          })
        );
      }
    }

    return field;
  }

  _createColorPicker() {
    const field = createElement('div', { className: 'ms-field' }, [
      createElement('label', { className: 'ms-field__label' }, ['Primary Color']),
      createElement('div', { className: 'ms-color-picker' }, [
        createElement('input', {
          type: 'color',
          id: 'ms-primary-color',
          value: this.state.colors[0],
          className: 'ms-color-input',
        }),
        createElement('span', { className: 'ms-color-value', id: 'ms-color-value' }, [
          this.state.colors[0],
        ]),
      ]),
    ]);
    return field;
  }

  _initPreviewGraph() {
    const chartContainer = document.getElementById('ms-preview-chart');
    if (chartContainer) {
      this.graph = new Graph(chartContainer, {
        type: this.state.type,
        title: this.state.title,
        data: [10, 20, 30, 40, 50],
        xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
        orientation: this.state.orientation,
        showLegend: this.state.showLegend,
        legendPosition: this.state.legendPosition,
        showLabels: this.state.showLabels,
        animation: this.state.animation,
        colors: this.state.colors,
      });
    }
  }

  _initSchemaExplorer() {
    const schemaContainer = document.getElementById('ms-schema-explorer');
    if (schemaContainer) {
      this.schemaExplorer = new SchemaExplorer(schemaContainer, {
        schemaEndpoint: this.options.schemaEndpoint,
        onTableSelect: (tableName, details) => {
          // Could auto-generate a basic SELECT query
          console.log('Table selected:', tableName);
        },
        onColumnSelect: (tableName, columnName, columnInfo) => {
          this._insertIntoQuery(`\`${tableName}\`.\`${columnName}\``);
        },
        onInsertQuery: (text) => {
          this._insertIntoQuery(text);
        },
      });
    }
  }

  _insertIntoQuery(text) {
    const queryTextarea = document.getElementById('ms-query');
    if (!queryTextarea) return;

    const start = queryTextarea.selectionStart;
    const end = queryTextarea.selectionEnd;
    const currentValue = queryTextarea.value;

    // Insert text at cursor position
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    queryTextarea.value = newValue;
    this.state.query = newValue;

    // Move cursor after inserted text
    const newPosition = start + text.length;
    queryTextarea.setSelectionRange(newPosition, newPosition);
    queryTextarea.focus();
  }

  _bindEvents() {
    // Debounced update for text inputs
    const debouncedUpdate = debounce(() => this._updatePreview(), 300);

    // Field change handlers
    this.container.addEventListener('input', e => {
      const field = e.target.dataset.field;
      if (field) {
        if (e.target.type === 'checkbox') {
          this.state[field] = e.target.checked;
        } else {
          this.state[field] = e.target.value;
        }
        debouncedUpdate();
      }
    });

    this.container.addEventListener('change', e => {
      const field = e.target.dataset.field;
      if (field) {
        if (e.target.type === 'checkbox') {
          this.state[field] = e.target.checked;
        } else {
          this.state[field] = e.target.value;
        }
        this._updatePreview();
      }
    });

    // Color picker
    const colorInput = document.getElementById('ms-primary-color');
    if (colorInput) {
      colorInput.addEventListener('input', e => {
        this.state.colors[0] = e.target.value;
        document.getElementById('ms-color-value').textContent = e.target.value;
        this._updatePreview();
      });
    }

    // Test Query button
    document.getElementById('ms-test-query-btn')?.addEventListener('click', () => {
      this._testQuery();
    });

    // Clear Query button
    document.getElementById('ms-clear-query-btn')?.addEventListener('click', () => {
      const queryTextarea = document.getElementById('ms-query');
      if (queryTextarea) {
        queryTextarea.value = '';
        this.state.query = '';
      }
    });

    // Save button
    document.getElementById('ms-save-btn')?.addEventListener('click', () => {
      this._saveConfiguration();
    });

    // Export buttons
    document.getElementById('ms-export-html-btn')?.addEventListener('click', () => {
      this._exportHTML();
    });

    document.getElementById('ms-export-js-btn')?.addEventListener('click', () => {
      this._exportJS();
    });

    document.getElementById('ms-export-json-btn')?.addEventListener('click', () => {
      this._exportJSON();
    });
  }

  _updatePreview() {
    if (!this.graph) return;

    this.graph.setOptions({
      type: this.state.type,
      title: this.state.title,
      orientation: this.state.orientation,
      showLegend: this.state.showLegend,
      legendPosition: this.state.legendPosition,
      showLabels: this.state.showLabels,
      animation: this.state.animation,
      colors: this.state.colors,
    });
  }

  async _testQuery() {
    const status = document.getElementById('ms-query-status');
    const query = this.state.query.trim();

    if (!query) {
      status.textContent = 'Please enter a query';
      status.className = 'ms-query-status ms-query-status--error';
      return;
    }

    status.textContent = 'Testing...';
    status.className = 'ms-query-status ms-query-status--loading';
    this.isLoading = true;

    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.success) {
        this.state.data = result.data;
        this.state.columns = result.columns;

        // Update column selectors
        this._updateColumnSelectors(result.columns);

        // Auto-select first two columns
        if (result.columns.length >= 2 && !this.state.xColumn && !this.state.yColumn) {
          this.state.xColumn = result.columns[0];
          this.state.yColumn = result.columns[1];
          document.getElementById('ms-xColumn').value = result.columns[0];
          document.getElementById('ms-yColumn').value = result.columns[1];
        }

        // Update preview with data
        if (result.data.length > 0) {
          this.graph.setData(result.data, this.state.xColumn, this.state.yColumn);
        }

        status.textContent = `Success: ${result.rowCount} rows returned`;
        status.className = 'ms-query-status ms-query-status--success';
      } else {
        status.textContent = result.error || 'Query failed';
        status.className = 'ms-query-status ms-query-status--error';
      }
    } catch (error) {
      status.textContent = 'Connection error';
      status.className = 'ms-query-status ms-query-status--error';
      console.error('Query test failed:', error);
    } finally {
      this.isLoading = false;
    }
  }

  _updateColumnSelectors(columns) {
    const xSelect = document.getElementById('ms-xColumn');
    const ySelect = document.getElementById('ms-yColumn');

    [xSelect, ySelect].forEach(select => {
      if (!select) return;
      select.innerHTML = '<option value="">Select column</option>';
      columns.forEach(col => {
        select.appendChild(createElement('option', { value: col }, [col]));
      });
    });
  }

  async _saveConfiguration() {
    if (!this.state.name.trim()) {
      alert('Please enter a name for the graph configuration');
      return;
    }

    const saveBtn = document.getElementById('ms-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const configData = {
        name: this.state.name,
        type: this.state.type,
        config: {
          title: this.state.title,
          orientation: this.state.orientation,
          showLegend: this.state.showLegend,
          legendPosition: this.state.legendPosition,
          showLabels: this.state.showLabels,
          animation: this.state.animation,
          colors: this.state.colors,
        },
        data_query: this.state.query,
        x_column: this.state.xColumn,
        y_column: this.state.yColumn,
      };

      const response = await fetch(this.options.saveEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Configuration saved successfully!');
        if (this.options.onSave) {
          this.options.onSave(result);
        }
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to save configuration');
      console.error('Save failed:', error);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Configuration';
    }
  }

  _exportHTML() {
    const config = JSON.stringify(this._getExportConfig(), null, 2);
    const html = `<div id="my-graph" style="width:100%;height:400px;"></div>
<script src="/dist/js/metric-suite.js"></script>
<script>
  const graph = MetricSuite.Graph.fromConfig('#my-graph', ${config});
</script>`;

    this._copyToClipboard(html, 'HTML copied to clipboard!');
  }

  _exportJS() {
    const config = JSON.stringify(this._getExportConfig(), null, 2);
    const js = `const graph = new MetricSuite.Graph('#my-graph', ${config});`;

    this._copyToClipboard(js, 'JavaScript copied to clipboard!');
  }

  _exportJSON() {
    const config = this._getExportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.state.name || 'graph-config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _getExportConfig() {
    return {
      type: this.state.type,
      title: this.state.title,
      orientation: this.state.orientation,
      showLegend: this.state.showLegend,
      legendPosition: this.state.legendPosition,
      showLabels: this.state.showLabels,
      animation: this.state.animation,
      colors: this.state.colors,
      data: this.state.data,
      xAxis: {
        data: this.state.data.map(row => row[this.state.xColumn]),
      },
    };
  }

  _copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
      alert(message);
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert(message);
    });
  }

  /**
   * Load existing configuration
   */
  loadConfig(config) {
    this.state = { ...this.state, ...config };

    // Update form fields
    Object.keys(config).forEach(key => {
      const el = document.getElementById(`ms-${key}`);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = config[key];
        } else {
          el.value = config[key];
        }
      }
    });

    this._updatePreview();
  }

  /**
   * Destroy configurator
   */
  destroy() {
    if (this.graph) {
      this.graph.destroy();
    }
    this.container.innerHTML = '';
  }
}

export default GraphConfigurator;
