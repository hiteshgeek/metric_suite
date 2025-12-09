/**
 * Graph Configurator UI Component
 * Provides a complete interface for configuring and previewing graphs
 */

import { Graph } from './index.js';
import { getAvailableTypes } from './types/index.js';
import { createElement, debounce, defaultColors } from './utils.js';
import { SchemaExplorer } from '../SchemaExplorer/index.js';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import { format as formatSQL } from 'sql-formatter';

// Register SQL language
hljs.registerLanguage('sql', sql);

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
      variables: {}, // Store variable values like { company: '1', start: '2024-01-01' }
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
    const schemaHeader = createElement('div', { className: 'ms-configurator__schema-header' });
    schemaHeader.innerHTML = `
      <span class="ms-configurator__schema-title">Database</span>
      <button class="ms-configurator__schema-toggle" id="ms-schema-toggle" title="Toggle Database Panel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
    `;

    const schemaPanel = createElement('div', { className: 'ms-configurator__schema', id: 'ms-schema-panel' }, [
      schemaHeader,
      createElement('div', { id: 'ms-schema-explorer' }),
    ]);

    // Resizer between schema and settings
    const resizer1 = createElement('div', {
      className: 'ms-configurator__resizer',
      id: 'ms-resizer-schema',
      'data-resizer': 'schema'
    });
    resizer1.innerHTML = '<div class="ms-configurator__resizer-handle"></div>';

    // Settings panel (middle)
    const settings = this._createSettingsPanel();
    settings.id = 'ms-settings-panel';

    // Resizer between settings and preview
    const resizer2 = createElement('div', {
      className: 'ms-configurator__resizer',
      id: 'ms-resizer-settings',
      'data-resizer': 'settings'
    });
    resizer2.innerHTML = '<div class="ms-configurator__resizer-handle"></div>';

    // Preview panel (right)
    const preview = this._createPreviewPanel();
    preview.id = 'ms-preview-panel';

    content.appendChild(schemaPanel);
    content.appendChild(resizer1);
    content.appendChild(settings);
    content.appendChild(resizer2);
    content.appendChild(preview);

    this.container.appendChild(header);
    this.container.appendChild(content);

    // Initialize resizable panels
    this._initResizablePanels();
  }

  _initResizablePanels() {
    // Load saved state from localStorage
    const savedWidths = JSON.parse(localStorage.getItem('ms-configurator-widths') || '{}');
    const schemaCollapsed = localStorage.getItem('ms-schema-collapsed') === 'true';

    const schemaPanel = document.getElementById('ms-schema-panel');
    const settingsPanel = document.getElementById('ms-settings-panel');
    const schemaToggle = document.getElementById('ms-schema-toggle');
    const schemaResizer = document.getElementById('ms-resizer-schema');

    // Apply saved widths
    if (savedWidths.schema && schemaPanel && !schemaCollapsed) {
      schemaPanel.style.width = savedWidths.schema + 'px';
    }
    if (savedWidths.settings && settingsPanel) {
      settingsPanel.style.width = savedWidths.settings + 'px';
    }

    // Apply collapsed state
    if (schemaCollapsed && schemaPanel) {
      schemaPanel.classList.add('is-collapsed');
      if (schemaResizer) schemaResizer.style.display = 'none';
    }

    // Schema toggle button
    schemaToggle?.addEventListener('click', () => {
      const isCollapsed = schemaPanel.classList.toggle('is-collapsed');
      localStorage.setItem('ms-schema-collapsed', isCollapsed);

      // Hide/show resizer when collapsed
      if (schemaResizer) {
        schemaResizer.style.display = isCollapsed ? 'none' : '';
      }

      // Restore width when expanding
      if (!isCollapsed && savedWidths.schema) {
        schemaPanel.style.width = savedWidths.schema + 'px';
      }
    });

    // Setup resizers
    this._setupResizer('ms-resizer-schema', 'ms-schema-panel', 200, 500);
    this._setupResizer('ms-resizer-settings', 'ms-settings-panel', 280, 600);
  }

  _setupResizer(resizerId, panelId, minWidth, maxWidth) {
    const resizer = document.getElementById(resizerId);
    const panel = document.getElementById(panelId);

    if (!resizer || !panel) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    const startResize = (e) => {
      isResizing = true;
      startX = e.clientX || e.touches?.[0]?.clientX || 0;
      startWidth = panel.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      resizer.classList.add('is-active');
    };

    const doResize = (e) => {
      if (!isResizing) return;

      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const diff = clientX - startX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + diff));
      panel.style.width = newWidth + 'px';
    };

    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      resizer.classList.remove('is-active');

      // Save to localStorage
      this._saveWidths();
    };

    resizer.addEventListener('mousedown', startResize);
    resizer.addEventListener('touchstart', startResize, { passive: true });

    document.addEventListener('mousemove', doResize);
    document.addEventListener('touchmove', doResize, { passive: true });

    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchend', stopResize);
  }

  _saveWidths() {
    const schemaPanel = document.getElementById('ms-schema-panel');
    const settingsPanel = document.getElementById('ms-settings-panel');

    const widths = {
      schema: schemaPanel?.offsetWidth || 320,
      settings: settingsPanel?.offsetWidth || 320
    };

    localStorage.setItem('ms-configurator-widths', JSON.stringify(widths));
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
        this._createSQLEditor(),
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
      this._createVariablesPanel(),
      this._createLimitSlider(),
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

  _createSQLEditor() {
    // Create container with overlay structure for syntax highlighting
    const container = createElement('div', { className: 'ms-sql-editor' });

    // Highlighted code backdrop
    const backdrop = createElement('div', { className: 'ms-sql-editor__backdrop' });
    const highlights = createElement('pre', { className: 'ms-sql-editor__highlights', id: 'ms-query-highlights' });
    const code = createElement('code', { className: 'hljs language-sql' });
    highlights.appendChild(code);
    backdrop.appendChild(highlights);

    // Textarea for input
    const textarea = createElement('textarea', {
      className: 'ms-sql-editor__textarea',
      id: 'ms-query',
      'data-field': 'query',
      placeholder: 'SELECT column1, column2 FROM table',
      spellcheck: 'false',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
    });

    container.appendChild(backdrop);
    container.appendChild(textarea);

    return container;
  }

  _createLimitSlider() {
    // Container for limit slider - hidden by default until LIMIT is detected
    const container = createElement('div', {
      className: 'ms-limit-slider',
      id: 'ms-limit-slider-container',
      style: { display: 'none' }
    });

    // Header with label, step input, and auto-run toggle
    const header = createElement('div', { className: 'ms-limit-slider__header' }, [
      createElement('label', { className: 'ms-limit-slider__label' }, ['Query Limit']),
      createElement('div', { className: 'ms-limit-slider__controls' }, [
        createElement('label', { className: 'ms-limit-slider__step' }, [
          createElement('span', {}, ['Step:']),
          createElement('input', {
            type: 'number',
            id: 'ms-limit-step',
            className: 'ms-limit-slider__input ms-limit-slider__input--small',
            value: '1',
            min: '1',
            title: 'Slider step'
          }),
        ]),
        createElement('label', { className: 'ms-limit-slider__auto' }, [
          createElement('input', {
            type: 'checkbox',
            id: 'ms-limit-auto-run',
            checked: true
          }),
          createElement('span', {}, ['Auto-run']),
        ]),
      ]),
    ]);

    // Slider row with min input, slider, max input
    const sliderRow = createElement('div', { className: 'ms-limit-slider__row' }, [
      createElement('input', {
        type: 'number',
        id: 'ms-limit-min',
        className: 'ms-limit-slider__input',
        value: '1',
        min: '1',
        title: 'Minimum limit'
      }),
      createElement('input', {
        type: 'range',
        id: 'ms-limit-range',
        className: 'ms-limit-slider__range',
        min: '1',
        max: '100',
        value: '10'
      }),
      createElement('input', {
        type: 'number',
        id: 'ms-limit-max',
        className: 'ms-limit-slider__input',
        value: '100',
        min: '1',
        title: 'Maximum limit'
      }),
    ]);

    // Value display
    const valueDisplay = createElement('div', { className: 'ms-limit-slider__value' }, [
      createElement('span', {}, ['Current: ']),
      createElement('span', { id: 'ms-limit-value' }, ['10']),
      createElement('span', {}, [' rows']),
    ]);

    container.appendChild(header);
    container.appendChild(sliderRow);
    container.appendChild(valueDisplay);

    return container;
  }

  _createVariablesPanel() {
    // Container for variables - hidden by default until variables are detected
    const container = createElement('div', {
      className: 'ms-variables',
      id: 'ms-variables-container',
      style: { display: 'none' }
    });

    const header = createElement('div', { className: 'ms-variables__header' }, [
      createElement('label', { className: 'ms-variables__label' }, ['Query Variables']),
      createElement('span', { className: 'ms-variables__hint' }, ['Set values for ::variable placeholders']),
    ]);

    const inputs = createElement('div', { className: 'ms-variables__inputs', id: 'ms-variables-inputs' });

    container.appendChild(header);
    container.appendChild(inputs);

    return container;
  }

  _updateVariablesPanel() {
    const container = document.getElementById('ms-variables-container');
    const inputsContainer = document.getElementById('ms-variables-inputs');
    if (!container || !inputsContainer) return;

    const variables = this._extractVariables(this.state.query);

    if (variables.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    inputsContainer.innerHTML = '';

    variables.forEach(variable => {
      const field = createElement('div', { className: 'ms-variables__field' });

      const label = createElement('label', {
        className: 'ms-variables__field-label',
        for: `ms-var-${variable.name}`
      }, [
        variable.isPhp ? `$${variable.name}` : `::${variable.name}`
      ]);

      let input;
      if (variable.type === 'date') {
        input = createElement('input', {
          type: 'date',
          className: 'ms-input ms-variables__input',
          id: `ms-var-${variable.name}`,
          'data-variable': variable.name,
          value: variable.value || '',
        });
      } else if (variable.type === 'number') {
        input = createElement('input', {
          type: 'text',
          className: 'ms-input ms-variables__input',
          id: `ms-var-${variable.name}`,
          'data-variable': variable.name,
          placeholder: 'e.g., 1,2,3 or 5',
          value: variable.value || '',
        });
      } else {
        input = createElement('input', {
          type: 'text',
          className: 'ms-input ms-variables__input',
          id: `ms-var-${variable.name}`,
          'data-variable': variable.name,
          placeholder: `Enter ${variable.name}`,
          value: variable.value || '',
        });
      }

      // Bind input event
      input.addEventListener('input', (e) => {
        this.state.variables[variable.name] = e.target.value;
      });

      field.appendChild(label);
      field.appendChild(input);
      inputsContainer.appendChild(field);
    });
  }

  _updateSQLHighlight() {
    const textarea = document.getElementById('ms-query');
    const highlights = document.getElementById('ms-query-highlights');
    if (!textarea || !highlights) return;

    const code = highlights.querySelector('code');
    if (!code) return;

    // Get the text and add a trailing newline to match textarea behavior
    let text = textarea.value;
    if (text.endsWith('\n')) {
      text += ' '; // Prevent scroll jump
    }

    // Highlight with hljs
    const result = hljs.highlight(text || ' ', { language: 'sql' });
    code.innerHTML = result.value;

    // Sync scroll position
    highlights.scrollTop = textarea.scrollTop;
    highlights.scrollLeft = textarea.scrollLeft;
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

    // Auto-resize and update highlight after insert
    this._autoResizeEditor();
    this._updateSQLHighlight();
    this._updateLimitSliderVisibility();
  }

  _initLimitSlider() {
    const slider = document.getElementById('ms-limit-range');
    const minInput = document.getElementById('ms-limit-min');
    const maxInput = document.getElementById('ms-limit-max');
    const stepInput = document.getElementById('ms-limit-step');
    const valueDisplay = document.getElementById('ms-limit-value');
    const autoRunCheckbox = document.getElementById('ms-limit-auto-run');

    if (!slider) return;

    // Debounced query execution
    const debouncedRunQuery = debounce(() => {
      if (autoRunCheckbox?.checked) {
        this._testQuery();
      }
    }, 300);

    // Slider change
    slider.addEventListener('input', () => {
      const value = slider.value;
      valueDisplay.textContent = value;
      this._updateQueryLimit(parseInt(value, 10));
      debouncedRunQuery();
    });

    // Min input change
    minInput?.addEventListener('change', () => {
      let min = Math.max(1, parseInt(minInput.value, 10) || 1);
      const currentMax = parseInt(maxInput.value, 10) || 100;

      // Ensure min doesn't exceed max
      if (min >= currentMax) {
        min = currentMax - 1;
      }

      minInput.value = min;
      slider.min = min;

      // Adjust slider value if below new min
      let currentValue = parseInt(slider.value, 10);
      if (currentValue < min) {
        currentValue = min;
        slider.value = currentValue;
        valueDisplay.textContent = currentValue;
        this._updateQueryLimit(currentValue);
        debouncedRunQuery();
      }

      // Force slider to re-render by triggering a value update
      slider.value = slider.value;
    });

    // Max input change
    maxInput?.addEventListener('change', () => {
      let max = parseInt(maxInput.value, 10) || 100;
      const currentMin = parseInt(minInput.value, 10) || 1;

      // Ensure max is greater than min
      if (max <= currentMin) {
        max = currentMin + 1;
      }

      maxInput.value = max;
      slider.max = max;

      // Adjust slider value if above new max
      let currentValue = parseInt(slider.value, 10);
      if (currentValue > max) {
        currentValue = max;
        slider.value = currentValue;
        valueDisplay.textContent = currentValue;
        this._updateQueryLimit(currentValue);
        debouncedRunQuery();
      }

      // Force slider to re-render by triggering a value update
      slider.value = slider.value;
    });

    // Step input change
    stepInput?.addEventListener('change', () => {
      let step = Math.max(1, parseInt(stepInput.value, 10) || 1);
      stepInput.value = step;
      slider.step = step;
    });
  }

  _updateLimitSliderVisibility() {
    const container = document.getElementById('ms-limit-slider-container');
    const slider = document.getElementById('ms-limit-range');
    const valueDisplay = document.getElementById('ms-limit-value');
    if (!container) return;

    const query = this.state.query || '';
    const limitMatch = query.match(/\bLIMIT\s+(\d+)/i);

    if (limitMatch) {
      container.style.display = 'block';
      const currentLimit = parseInt(limitMatch[1], 10);

      // Update slider value to match query
      if (slider && valueDisplay) {
        const max = parseInt(slider.max, 10);

        // Adjust max if current limit exceeds it
        if (currentLimit > max) {
          slider.max = currentLimit;
          document.getElementById('ms-limit-max').value = currentLimit;
        }

        slider.value = currentLimit;
        valueDisplay.textContent = currentLimit;
      }
    } else {
      container.style.display = 'none';
    }
  }

  _updateQueryLimit(newLimit) {
    const queryTextarea = document.getElementById('ms-query');
    if (!queryTextarea) return;

    const query = queryTextarea.value;
    const updatedQuery = query.replace(/\bLIMIT\s+\d+/i, `LIMIT ${newLimit}`);

    if (updatedQuery !== query) {
      queryTextarea.value = updatedQuery;
      this.state.query = updatedQuery;
      this._updateSQLHighlight();
    }
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

    // X/Y Column selectors - refresh graph when changed
    const xSelect = document.getElementById('ms-xColumn');
    const ySelect = document.getElementById('ms-yColumn');

    xSelect?.addEventListener('change', (e) => {
      const newX = e.target.value;
      // If same as Y, swap Y to a different column
      if (newX === this.state.yColumn && this.state.columns?.length > 1) {
        const otherCol = this.state.columns.find(c => c !== newX);
        if (otherCol) {
          this.state.yColumn = otherCol;
          ySelect.value = otherCol;
        }
      }
      this.state.xColumn = newX;
      if (this.state.data?.length > 0 && this.state.xColumn && this.state.yColumn) {
        this.graph.setData(this.state.data, this.state.xColumn, this.state.yColumn);
      }
    });

    ySelect?.addEventListener('change', (e) => {
      const newY = e.target.value;
      // If same as X, swap X to a different column
      if (newY === this.state.xColumn && this.state.columns?.length > 1) {
        const otherCol = this.state.columns.find(c => c !== newY);
        if (otherCol) {
          this.state.xColumn = otherCol;
          xSelect.value = otherCol;
        }
      }
      this.state.yColumn = newY;
      if (this.state.data?.length > 0 && this.state.xColumn && this.state.yColumn) {
        this.graph.setData(this.state.data, this.state.xColumn, this.state.yColumn);
      }
    });

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
        this.state.variables = {};
        this._autoResizeEditor();
        this._updateSQLHighlight();
        this._updateLimitSliderVisibility();
        this._updateVariablesPanel();
      }
    });

    // Query textarea auto-resize and syntax highlighting
    const queryTextarea = document.getElementById('ms-query');
    if (queryTextarea) {
      // Debounced variables panel update
      const debouncedVariablesUpdate = debounce(() => this._updateVariablesPanel(), 300);

      queryTextarea.addEventListener('input', () => {
        this.state.query = queryTextarea.value;
        this._updateSQLHighlight();
        this._autoResizeEditor();
        this._updateLimitSliderVisibility();
        debouncedVariablesUpdate();
      });

      // Sync scroll between textarea and highlights
      queryTextarea.addEventListener('scroll', () => {
        const highlights = document.getElementById('ms-query-highlights');
        if (highlights) {
          highlights.scrollTop = queryTextarea.scrollTop;
          highlights.scrollLeft = queryTextarea.scrollLeft;
        }
      });

      // Format on paste while preserving undo history
      queryTextarea.addEventListener('paste', (e) => {
        const pastedText = e.clipboardData.getData('text');
        const formatted = this._formatSQL(pastedText);

        // Only intercept if formatting changes the text
        if (formatted !== pastedText) {
          e.preventDefault();
          // Use execCommand to preserve undo history
          document.execCommand('insertText', false, formatted);
          this.state.query = queryTextarea.value;
          this._updateSQLHighlight();
          this._updateLimitSliderVisibility();
          this._updateVariablesPanel();
          // Use requestAnimationFrame to ensure DOM is fully updated before measuring
          requestAnimationFrame(() => {
            this._autoResizeEditor();
          });
        }
        // If no formatting needed, let default paste happen (input event will handle highlight)
      });

      // Initial highlight and resize
      this._autoResizeEditor();
      this._updateSQLHighlight();
    }

    // Limit slider events
    this._initLimitSlider();

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

  _autoResizeEditor() {
    const textarea = document.getElementById('ms-query');
    const container = textarea?.closest('.ms-sql-editor');
    const backdrop = container?.querySelector('.ms-sql-editor__backdrop');
    const highlights = document.getElementById('ms-query-highlights');
    if (!textarea || !container) return;

    // Reset all heights to auto first
    textarea.style.height = '0';
    container.style.height = 'auto';
    if (backdrop) backdrop.style.height = 'auto';
    if (highlights) highlights.style.height = 'auto';

    // Force reflow to get accurate scrollHeight
    const scrollHeight = textarea.scrollHeight;

    // Set height to scrollHeight with only a minimum constraint (no max - grows to fit content)
    const minHeight = 80;
    const newHeight = Math.max(minHeight, scrollHeight);

    // Apply heights to all elements
    const heightPx = newHeight + 'px';
    textarea.style.height = heightPx;
    container.style.height = heightPx;
    if (backdrop) backdrop.style.height = heightPx;
    if (highlights) highlights.style.height = heightPx;
  }

  _formatSQL(sql) {
    try {
      // Extract and replace custom variables (::variable, $variable) with placeholders
      const variables = [];
      let processedSql = sql;

      // Match ::variable (with optional quotes around it)
      processedSql = processedSql.replace(/'::(\w+)'/g, (match, varName) => {
        const placeholder = `'__VAR_${variables.length}__'`;
        variables.push({ original: match, varName, quoted: true });
        return placeholder;
      });

      processedSql = processedSql.replace(/::(\w+)/g, (match, varName) => {
        const placeholder = `__VAR_${variables.length}__`;
        variables.push({ original: match, varName, quoted: false });
        return placeholder;
      });

      // Match $variable (PHP-style variables)
      processedSql = processedSql.replace(/\$(\w+)/g, (match, varName) => {
        const placeholder = `__PHPVAR_${variables.length}__`;
        variables.push({ original: match, varName, isPhp: true });
        return placeholder;
      });

      // Format the SQL
      let formatted = formatSQL(processedSql, {
        language: 'mysql',
        tabWidth: 4,
        useTabs: false,
        keywordCase: 'upper',
        linesBetweenQueries: 1,
      });

      // Restore variables
      variables.forEach((v, i) => {
        if (v.isPhp) {
          formatted = formatted.replace(`__PHPVAR_${i}__`, v.original);
        } else if (v.quoted) {
          formatted = formatted.replace(`'__VAR_${i}__'`, v.original);
        } else {
          formatted = formatted.replace(`__VAR_${i}__`, v.original);
        }
      });

      return formatted;
    } catch (e) {
      // If formatting fails, return original SQL
      console.warn('SQL formatting failed:', e);
      return sql;
    }
  }

  /**
   * Extract variables from SQL query
   * Supports ::variable and $variable syntax
   */
  _extractVariables(sql) {
    const variables = new Map();

    // Match ::variable (common SQL template syntax)
    const colonMatches = sql.matchAll(/::(\w+)/g);
    for (const match of colonMatches) {
      const varName = match[1];
      if (!variables.has(varName)) {
        variables.set(varName, {
          name: varName,
          type: this._guessVariableType(varName),
          value: this.state.variables[varName] || '',
        });
      }
    }

    // Match $variable (PHP-style, but not inside SQL strings ideally)
    const phpMatches = sql.matchAll(/\$(\w+)/g);
    for (const match of phpMatches) {
      const varName = match[1];
      // Skip common PHP internal variables
      if (['condition', 'query', 'sql'].includes(varName)) continue;
      if (!variables.has(varName)) {
        variables.set(varName, {
          name: varName,
          type: 'text',
          value: this.state.variables[varName] || '',
          isPhp: true,
        });
      }
    }

    return Array.from(variables.values());
  }

  /**
   * Guess variable type based on name
   */
  _guessVariableType(varName) {
    const lower = varName.toLowerCase();
    if (lower.includes('date') || lower === 'start' || lower === 'end') {
      return 'date';
    }
    if (lower.includes('id') || lower === 'company' || lower === 'user') {
      return 'number';
    }
    return 'text';
  }

  /**
   * Replace variables in SQL with their values
   */
  _replaceVariables(sql) {
    let result = sql;

    // Replace ::variable (with quotes preserved)
    result = result.replace(/'::(\w+)'/g, (match, varName) => {
      const value = this.state.variables[varName];
      if (value !== undefined) {
        return `'${value}'`;
      }
      return match;
    });

    // Replace ::variable (without quotes)
    result = result.replace(/::(\w+)/g, (match, varName) => {
      const value = this.state.variables[varName];
      if (value !== undefined) {
        return value;
      }
      return match;
    });

    // Replace $variable (PHP-style)
    result = result.replace(/\$(\w+)/g, (match, varName) => {
      // Skip common PHP internal variables
      if (['condition', 'query', 'sql'].includes(varName)) {
        return ''; // Remove PHP condition placeholders
      }
      const value = this.state.variables[varName];
      if (value !== undefined) {
        return value;
      }
      return match;
    });

    return result;
  }

  async _testQuery() {
    const status = document.getElementById('ms-query-status');
    const query = this.state.query.trim();

    if (!query) {
      status.textContent = 'Please enter a query';
      status.className = 'ms-query-status ms-query-status--error';
      return;
    }

    // Check for unset variables
    const variables = this._extractVariables(query);
    const unsetVars = variables.filter(v => !this.state.variables[v.name]);
    if (unsetVars.length > 0) {
      const varNames = unsetVars.map(v => v.isPhp ? `$${v.name}` : `::${v.name}`).join(', ');
      status.textContent = `Missing variables: ${varNames}`;
      status.className = 'ms-query-status ms-query-status--error';
      return;
    }

    // Replace variables with their values
    const executableQuery = this._replaceVariables(query);

    status.textContent = 'Testing...';
    status.className = 'ms-query-status ms-query-status--loading';
    this.isLoading = true;

    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: executableQuery }),
      });

      const result = await response.json();

      if (result.success) {
        this.state.data = result.data;
        this.state.columns = result.columns;

        // Update column selectors
        this._updateColumnSelectors(result.columns);

        // Auto-select columns intelligently: X = labels/categories, Y = numeric values
        if (result.columns.length >= 2 && !this.state.xColumn && !this.state.yColumn) {
          // Try to detect which column is numeric (for Y) and which is categorical (for X)
          const firstRow = result.data[0];
          let xCol = result.columns[0];
          let yCol = result.columns[1];

          // Check if first column value is numeric - if so, swap them
          // (We want X to be category/label, Y to be numeric value)
          const firstVal = firstRow[result.columns[0]];
          const secondVal = firstRow[result.columns[1]];
          const firstIsNumeric = !isNaN(parseFloat(firstVal)) && isFinite(firstVal);
          const secondIsNumeric = !isNaN(parseFloat(secondVal)) && isFinite(secondVal);

          // If first is numeric and second is not, swap (X should be labels)
          if (firstIsNumeric && !secondIsNumeric) {
            xCol = result.columns[1];
            yCol = result.columns[0];
          }

          this.state.xColumn = xCol;
          this.state.yColumn = yCol;
          document.getElementById('ms-xColumn').value = xCol;
          document.getElementById('ms-yColumn').value = yCol;
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
