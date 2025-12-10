/**
 * Graph Configurator UI Component
 * Provides a complete interface for configuring and previewing graphs
 */

import { Graph } from './index.js';
import { getAvailableTypes } from './types/index.js';
import { createElement, debounce, defaultColors } from './utils.js';
import { SchemaExplorer } from '../SchemaExplorer/index.js';
import { ColorPalette } from '../ColorPalette/index.js';
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
      colorsEndpoint: options.colorsEndpoint || '/api/colors.php',
      editId: options.editId || null,
      onSave: options.onSave || null,
      onExport: options.onExport || null,
      ...options,
    };

    // Current configuration state
    this.state = {
      id: null,
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
    this.colorPalette = null;
    this.isLoading = false;
    this.isEditMode = !!this.options.editId;

    // Save state tracking
    this.isSaved = false;
    this.isDirty = false;
    this.lastSavedState = null;

    // Screenshot settings (persisted in localStorage)
    this.screenshotSettings = JSON.parse(localStorage.getItem('ms-screenshot-settings') || '{}');
    this.screenshotSettings = {
      download: this.screenshotSettings.download !== false,
      preview: this.screenshotSettings.preview || false,
      store: this.screenshotSettings.store || false,
    };

    // Current screenshot data URL for modal
    this.currentScreenshot = null;

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

    // Load existing config if in edit mode
    if (this.options.editId) {
      this._loadExistingConfig(this.options.editId);
    }
  }

  _createLayout() {
    // Header - different title for edit vs create mode
    const headerTitle = this.isEditMode ? 'Edit Graph' : 'Graph Configurator';
    const saveButtonText = this.isEditMode ? 'Update Graph' : 'Save Configuration';

    // Status indicator
    const statusIndicator = createElement('div', { className: 'ms-status-indicator', id: 'ms-status-indicator' }, [
      createElement('span', { className: 'ms-status-indicator__dot' }),
      createElement('span', { className: 'ms-status-indicator__text' }, ['Not saved']),
    ]);

    // Header buttons container
    const headerButtons = createElement('div', { className: 'ms-configurator__header-buttons' }, [
      createElement(
        'button',
        {
          className: 'ms-btn ms-btn--outline',
          id: 'ms-new-btn',
          title: 'Create a new graph',
        },
        [
          createElement('span', { className: 'ms-btn__icon' }),
          'New Graph',
        ]
      ),
      createElement(
        'button',
        {
          className: 'ms-btn ms-btn--primary',
          id: 'ms-save-btn',
        },
        [saveButtonText]
      ),
    ]);

    // Add icon to new button
    headerButtons.querySelector('#ms-new-btn .ms-btn__icon').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    `;

    const header = createElement('div', { className: 'ms-configurator__header' }, [
      createElement('div', { className: 'ms-configurator__title-group' }, [
        createElement('h1', { className: 'ms-configurator__title' }, [headerTitle]),
        statusIndicator,
      ]),
      headerButtons,
    ]);

    // Toast container for notifications
    const toastContainer = createElement('div', { className: 'ms-toast-container', id: 'ms-toast-container' });

    // Unsaved changes modal
    const unsavedModal = createElement('div', { className: 'ms-modal', id: 'ms-unsaved-modal', style: 'display: none;' }, [
      createElement('div', { className: 'ms-modal__backdrop' }),
      createElement('div', { className: 'ms-modal__content' }, [
        createElement('h3', { className: 'ms-modal__title' }, ['Unsaved Changes']),
        createElement('p', { className: 'ms-modal__message' }, [
          'You have unsaved changes. What would you like to do?'
        ]),
        createElement('div', { className: 'ms-modal__actions ms-modal__actions--stacked' }, [
          createElement('button', { className: 'ms-btn ms-btn--primary', id: 'ms-unsaved-save' }, ['Save & Create New']),
          createElement('button', { className: 'ms-btn ms-btn--outline', id: 'ms-unsaved-discard' }, ['Discard & Create New']),
          createElement('button', { className: 'ms-btn ms-btn--ghost', id: 'ms-unsaved-cancel' }, ['Cancel']),
        ]),
      ]),
    ]);

    // Main content wrapper
    const content = createElement('div', { className: 'ms-configurator__content' });

    // Schema explorer panel (left sidebar)
    const schemaPanel = createElement('div', { className: 'ms-configurator__schema', id: 'ms-schema-panel' }, [
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

    // Screenshot preview modal
    const screenshotModal = createElement('div', { className: 'ms-modal ms-modal--screenshot', id: 'ms-screenshot-modal', style: 'display: none;' }, [
      createElement('div', { className: 'ms-modal__backdrop' }),
      createElement('div', { className: 'ms-modal__content' }, [
        createElement('div', { className: 'ms-modal__header' }, [
          createElement('h3', { className: 'ms-modal__title' }, ['Screenshot Preview']),
          createElement('button', { className: 'ms-modal__close', id: 'ms-screenshot-modal-close' }, ['×']),
        ]),
        createElement('div', { className: 'ms-screenshot-preview', id: 'ms-screenshot-preview' }),
        createElement('div', { className: 'ms-modal__actions' }, [
          createElement('button', { className: 'ms-btn ms-btn--outline', id: 'ms-screenshot-download-btn' }, ['Download']),
          createElement('button', { className: 'ms-btn ms-btn--ghost', id: 'ms-screenshot-close-btn' }, ['Close']),
        ]),
      ]),
    ]);

    this.container.appendChild(header);
    this.container.appendChild(content);
    this.container.appendChild(toastContainer);
    this.container.appendChild(unsavedModal);
    this.container.appendChild(screenshotModal);

    // Initialize resizable panels
    this._initResizablePanels();
  }

  _initResizablePanels() {
    // Load saved state from localStorage
    const savedWidths = JSON.parse(localStorage.getItem('ms-configurator-widths') || '{}');
    const schemaCollapsed = localStorage.getItem('ms-schema-collapsed') === 'true';

    const schemaPanel = document.getElementById('ms-schema-panel');
    const settingsPanel = document.getElementById('ms-settings-panel');
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

    // Screenshot button with dropdown
    const screenshotBtn = createElement('div', { className: 'ms-screenshot', id: 'ms-screenshot' }, [
      createElement('button', {
        className: 'ms-screenshot__btn',
        id: 'ms-screenshot-btn',
        title: 'Capture graph image',
      }),
      createElement('button', {
        className: 'ms-screenshot__dropdown-toggle',
        id: 'ms-screenshot-toggle',
        title: 'Screenshot options',
      }),
      createElement('div', { className: 'ms-screenshot__dropdown', id: 'ms-screenshot-dropdown' }, [
        createElement('label', { className: 'ms-screenshot__option' }, [
          createElement('input', { type: 'checkbox', id: 'ms-screenshot-download', checked: true }),
          createElement('span', {}, ['Download image']),
        ]),
        createElement('label', { className: 'ms-screenshot__option' }, [
          createElement('input', { type: 'checkbox', id: 'ms-screenshot-preview' }),
          createElement('span', {}, ['Show preview']),
        ]),
        createElement('label', { className: 'ms-screenshot__option' }, [
          createElement('input', { type: 'checkbox', id: 'ms-screenshot-store' }),
          createElement('span', {}, ['Save as thumbnail']),
        ]),
      ]),
    ]);

    // Add icons to screenshot buttons
    screenshotBtn.querySelector('#ms-screenshot-btn').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    `;
    screenshotBtn.querySelector('#ms-screenshot-toggle').innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    `;

    // Preview container
    const previewContainer = createElement('div', { className: 'ms-preview' }, [
      createElement('div', { className: 'ms-preview__header' }, [
        createElement('div', { className: 'ms-preview__title-group' }, [
          createElement('h3', { className: 'ms-preview__name', id: 'ms-preview-name' }, ['Untitled Graph']),
          createElement('span', { className: 'ms-preview__badge' }, ['Live Preview']),
        ]),
        screenshotBtn,
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
      createElement('div', { id: 'ms-color-palette-container' }),
    ]);
    return field;
  }

  _initColorPalette() {
    const container = document.getElementById('ms-color-palette-container');
    if (!container) return;

    this.colorPalette = new ColorPalette(container, {
      apiEndpoint: this.options.colorsEndpoint,
      showManager: true,
      allowCustom: true,
      maxColors: 12,
      onColorsChange: (colors) => {
        this.state.colors = colors;
        this._updatePreview();
        this._markDirty();
      },
    });
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

      // Inject toggle button into SchemaExplorer header
      const schemaHeader = schemaContainer.querySelector('.ms-schema-explorer__header');
      if (schemaHeader) {
        const toggleBtn = createElement('button', {
          className: 'ms-configurator__schema-toggle',
          id: 'ms-schema-toggle',
          title: 'Toggle Database Panel',
        });
        toggleBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        `;
        schemaHeader.appendChild(toggleBtn);

        // Bind toggle button event
        this._bindSchemaToggle(toggleBtn);
      }
    }
  }

  _bindSchemaToggle(toggleBtn) {
    const schemaPanel = document.getElementById('ms-schema-panel');
    const schemaResizer = document.getElementById('ms-resizer-schema');
    const savedWidths = JSON.parse(localStorage.getItem('ms-configurator-widths') || '{}');

    toggleBtn.addEventListener('click', () => {
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

    // Debounced preview name update
    const debouncedPreviewName = debounce(() => this._updatePreviewName(), 150);

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
        this._markDirty();

        // Update preview name when name field changes
        if (field === 'name') {
          debouncedPreviewName();
        }
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
        this._markDirty();
      }
    });

    // Color palette
    this._initColorPalette();

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

    // New Graph button
    document.getElementById('ms-new-btn')?.addEventListener('click', () => {
      this._handleNewGraph();
    });

    // Unsaved changes modal events
    this._bindUnsavedModal();

    // Screenshot events
    this._bindScreenshot();

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

  async _loadExistingConfig(id) {
    try {
      const response = await fetch(`${this.options.saveEndpoint}?id=${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        const config = result.data;

        // Update state with loaded data
        this.state.id = config.id;
        this.state.name = config.name || '';
        this.state.type = config.type || 'bar';
        this.state.query = config.data_query || '';
        this.state.xColumn = config.x_column || '';
        this.state.yColumn = config.y_column || '';

        // Load from config JSON
        if (config.config) {
          this.state.title = config.config.title || '';
          this.state.orientation = config.config.orientation || 'vertical';
          this.state.showLegend = config.config.showLegend !== false;
          this.state.legendPosition = config.config.legendPosition || 'top';
          this.state.showLabels = config.config.showLabels || false;
          this.state.animation = config.config.animation !== false;
          if (config.config.colors?.length) {
            this.state.colors = config.config.colors;
          }
        }

        // Update form fields
        this._populateFormFields();

        // Update preview
        this._updatePreview();

        // Mark as saved (existing config)
        this.isSaved = true;
        this.isDirty = false;
        this.lastSavedState = this._getSerializableState();
        this._updateStatusIndicator();

        // If there's a query, test it to load data
        if (this.state.query) {
          this._testQuery();
        }
      } else {
        console.error('Failed to load config:', result.error);
        this._showToast('Failed to load graph configuration', 'error');
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this._showToast('Failed to load graph configuration', 'error');
    }
  }

  _populateFormFields() {
    // Populate text/select fields
    const fields = ['name', 'type', 'title', 'orientation', 'legendPosition'];
    fields.forEach(field => {
      const el = document.getElementById(`ms-${field}`);
      if (el) {
        el.value = this.state[field] || '';
      }
    });

    // Populate checkboxes
    const checkboxes = ['showLegend', 'showLabels', 'animation'];
    checkboxes.forEach(field => {
      const el = document.getElementById(`ms-${field}`);
      if (el) {
        el.checked = this.state[field];
      }
    });

    // Populate query textarea
    const queryEl = document.getElementById('ms-query');
    if (queryEl) {
      queryEl.value = this.state.query || '';
      this._autoResizeEditor();
      this._updateSQLHighlight();
      this._updateLimitSliderVisibility();
      this._updateVariablesPanel();
    }

    // Update color palette if loaded
    if (this.colorPalette && this.state.colors?.length) {
      this.colorPalette.setColors(this.state.colors);
    }

    // Update preview name
    this._updatePreviewName();
  }

  /**
   * Show a toast notification
   */
  _showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('ms-toast-container');
    if (!container) return;

    const toast = createElement('div', { className: `ms-toast ms-toast--${type}` }, [
      createElement('div', { className: 'ms-toast__icon' }, [this._getToastIcon(type)]),
      createElement('div', { className: 'ms-toast__content' }, [
        createElement('p', { className: 'ms-toast__message' }, [message]),
      ]),
      createElement('button', { className: 'ms-toast__close', type: 'button' }, ['×']),
    ]);

    // Close button handler
    toast.querySelector('.ms-toast__close').addEventListener('click', () => {
      toast.classList.add('ms-toast--exit');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => toast.classList.add('ms-toast--enter'));

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.classList.add('ms-toast--exit');
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }
  }

  _getToastIcon(type) {
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };
    const span = document.createElement('span');
    span.innerHTML = icons[type] || icons.info;
    return span.firstChild;
  }

  /**
   * Update save status indicator
   */
  _updateStatusIndicator() {
    const indicator = document.getElementById('ms-status-indicator');
    if (!indicator) return;

    const dot = indicator.querySelector('.ms-status-indicator__dot');
    const text = indicator.querySelector('.ms-status-indicator__text');

    // Remove all state classes
    indicator.classList.remove('ms-status-indicator--saved', 'ms-status-indicator--unsaved', 'ms-status-indicator--dirty');

    if (this.isSaved && !this.isDirty) {
      indicator.classList.add('ms-status-indicator--saved');
      text.textContent = 'Saved';
    } else if (this.isSaved && this.isDirty) {
      indicator.classList.add('ms-status-indicator--dirty');
      text.textContent = 'Unsaved changes';
    } else {
      indicator.classList.add('ms-status-indicator--unsaved');
      text.textContent = 'Not saved';
    }

    // Update New Graph button state
    this._updateNewGraphButton();

    // Update Save button state
    this._updateSaveButton();
  }

  /**
   * Update New Graph button disabled state
   * Button should be disabled when it's already a fresh new graph with no content
   */
  _updateNewGraphButton() {
    const newBtn = document.getElementById('ms-new-btn');
    if (!newBtn) return;

    // Disable if: not saved AND no content has been entered
    const isEmptyNewGraph = !this.isSaved && !this._hasUnsavedChanges();
    newBtn.disabled = isEmptyNewGraph;
  }

  /**
   * Update Save button disabled state
   * Button should be disabled when:
   * - For new graphs: no name entered (name is required)
   * - For saved graphs: no changes have been made (not dirty)
   */
  _updateSaveButton() {
    const saveBtn = document.getElementById('ms-save-btn');
    if (!saveBtn) return;

    if (this.isSaved) {
      // For saved graphs, disable if no changes
      saveBtn.disabled = !this.isDirty;
    } else {
      // For new graphs, disable if name is empty
      saveBtn.disabled = !this.state.name.trim();
    }
  }

  /**
   * Mark state as dirty only if current state differs from last saved state
   */
  _markDirty() {
    // For unsaved graphs, just update the button states
    if (!this.isSaved) {
      this._updateNewGraphButton();
      this._updateSaveButton();
      return;
    }

    const currentState = this._getSerializableState();
    const hasChanges = currentState !== this.lastSavedState;

    if (hasChanges !== this.isDirty) {
      this.isDirty = hasChanges;
      this._updateStatusIndicator();
    }
  }

  /**
   * Get serializable state for comparison
   */
  _getSerializableState() {
    return JSON.stringify({
      name: this.state.name,
      type: this.state.type,
      query: this.state.query,
      xColumn: this.state.xColumn,
      yColumn: this.state.yColumn,
      title: this.state.title,
      orientation: this.state.orientation,
      showLegend: this.state.showLegend,
      legendPosition: this.state.legendPosition,
      showLabels: this.state.showLabels,
      animation: this.state.animation,
      colors: this.state.colors,
    });
  }

  async _saveConfiguration() {
    if (!this.state.name.trim()) {
      this._showToast('Please enter a name for the graph configuration', 'warning');
      return;
    }

    const saveBtn = document.getElementById('ms-save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = this.isEditMode ? 'Updating...' : 'Saving...';

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

      // Use PUT for updates, POST for new configs
      const url = this.isEditMode
        ? `${this.options.saveEndpoint}?id=${this.state.id}`
        : this.options.saveEndpoint;
      const method = this.isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });

      const result = await response.json();

      if (result.success) {
        // Update state tracking
        this.isSaved = true;
        this.isDirty = false;
        this.lastSavedState = this._getSerializableState();

        // If this was a new config, store the ID and switch to edit mode
        if (!this.isEditMode && result.id) {
          this.state.id = result.id;
          this.isEditMode = true;
        }

        this._updateStatusIndicator();

        const message = this.isEditMode
          ? 'Graph updated successfully!'
          : 'Graph saved successfully!';
        this._showToast(message, 'success');

        // Call onSave callback but don't redirect
        if (this.options.onSave) {
          this.options.onSave(result);
        }
      } else {
        this._showToast('Failed to save: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      this._showToast('Failed to save configuration', 'error');
      console.error('Save failed:', error);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  }

  /**
   * Handle "New Graph" button click
   */
  _handleNewGraph() {
    // Check if there are unsaved changes
    const hasUnsavedChanges = this._hasUnsavedChanges();

    if (hasUnsavedChanges) {
      // Show confirmation modal
      this._showUnsavedModal();
    } else {
      // No unsaved changes, just reset
      this._resetToNewGraph();
    }
  }

  /**
   * Check if there are unsaved changes
   */
  _hasUnsavedChanges() {
    // If never saved and has any content
    if (!this.isSaved) {
      return this.state.name.trim() !== '' ||
             this.state.query.trim() !== '' ||
             this.state.title.trim() !== '';
    }
    // If saved but modified
    return this.isDirty;
  }

  /**
   * Show the unsaved changes modal
   */
  _showUnsavedModal() {
    const modal = document.getElementById('ms-unsaved-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Hide the unsaved changes modal
   */
  _hideUnsavedModal() {
    const modal = document.getElementById('ms-unsaved-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Bind unsaved modal events
   */
  _bindUnsavedModal() {
    const modal = document.getElementById('ms-unsaved-modal');
    if (!modal) return;

    // Backdrop click
    modal.querySelector('.ms-modal__backdrop')?.addEventListener('click', () => {
      this._hideUnsavedModal();
    });

    // Cancel button
    document.getElementById('ms-unsaved-cancel')?.addEventListener('click', () => {
      this._hideUnsavedModal();
    });

    // Discard & Create New
    document.getElementById('ms-unsaved-discard')?.addEventListener('click', () => {
      this._hideUnsavedModal();
      this._resetToNewGraph();
    });

    // Save & Create New
    document.getElementById('ms-unsaved-save')?.addEventListener('click', async () => {
      this._hideUnsavedModal();
      await this._saveConfiguration();
      // Only reset if save was successful
      if (this.isSaved && !this.isDirty) {
        this._resetToNewGraph();
      }
    });
  }

  /**
   * Reset the configurator to create a new graph
   */
  _resetToNewGraph() {
    // Reset state
    this.state = {
      id: null,
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
      colors: [],
      data: [],
      columns: [],
      variables: {},
    };

    // Reset tracking
    this.isSaved = false;
    this.isDirty = false;
    this.lastSavedState = null;
    this.isEditMode = false;

    // Reset form fields
    this._populateFormFields();

    // Reset column selects
    ['ms-xColumn', 'ms-yColumn'].forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.innerHTML = '<option value="">Select column</option>';
      }
    });

    // Reset color palette
    if (this.colorPalette) {
      this.colorPalette.setColors([]);
    }

    // Reset preview graph
    if (this.graph) {
      this.graph.setData([10, 20, 30, 40, 50], null, null);
      this.graph.setOptions({
        type: 'bar',
        title: '',
        orientation: 'vertical',
        showLegend: true,
        legendPosition: 'top',
        showLabels: false,
        animation: true,
      });
    }

    // Update header title and button
    const titleEl = this.container.querySelector('.ms-configurator__title');
    if (titleEl) {
      titleEl.textContent = 'Graph Configurator';
    }
    const saveBtn = document.getElementById('ms-save-btn');
    if (saveBtn) {
      saveBtn.textContent = 'Save Configuration';
    }

    // Update status indicator
    this._updateStatusIndicator();

    // Update preview name
    this._updatePreviewName();

    // Show success toast
    this._showToast('Ready to create a new graph', 'info');
  }

  /**
   * Bind screenshot button and modal events
   */
  _bindScreenshot() {
    const screenshotBtn = document.getElementById('ms-screenshot-btn');
    const toggleBtn = document.getElementById('ms-screenshot-toggle');
    const dropdown = document.getElementById('ms-screenshot-dropdown');

    // Apply saved settings to checkboxes
    document.getElementById('ms-screenshot-download').checked = this.screenshotSettings.download;
    document.getElementById('ms-screenshot-preview').checked = this.screenshotSettings.preview;
    document.getElementById('ms-screenshot-store').checked = this.screenshotSettings.store;

    // Main screenshot button
    screenshotBtn?.addEventListener('click', () => {
      this._captureScreenshot();
    });

    // Toggle dropdown
    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('is-open');
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.ms-screenshot')) {
        dropdown?.classList.remove('is-open');
      }
    });

    // Save settings on change
    ['ms-screenshot-download', 'ms-screenshot-preview', 'ms-screenshot-store'].forEach(id => {
      const checkbox = document.getElementById(id);
      checkbox?.addEventListener('change', () => {
        this.screenshotSettings.download = document.getElementById('ms-screenshot-download').checked;
        this.screenshotSettings.preview = document.getElementById('ms-screenshot-preview').checked;
        this.screenshotSettings.store = document.getElementById('ms-screenshot-store').checked;
        localStorage.setItem('ms-screenshot-settings', JSON.stringify(this.screenshotSettings));
      });
    });

    // Screenshot modal events
    this._bindScreenshotModal();
  }

  /**
   * Bind screenshot modal events
   */
  _bindScreenshotModal() {
    const modal = document.getElementById('ms-screenshot-modal');
    if (!modal) return;

    // Backdrop click
    modal.querySelector('.ms-modal__backdrop')?.addEventListener('click', () => {
      this._hideScreenshotModal();
    });

    // Close buttons
    document.getElementById('ms-screenshot-modal-close')?.addEventListener('click', () => {
      this._hideScreenshotModal();
    });
    document.getElementById('ms-screenshot-close-btn')?.addEventListener('click', () => {
      this._hideScreenshotModal();
    });

    // Download button in modal
    document.getElementById('ms-screenshot-download-btn')?.addEventListener('click', () => {
      if (this.currentScreenshot) {
        this._downloadScreenshot(this.currentScreenshot);
      }
    });
  }

  /**
   * Capture screenshot of the graph
   */
  async _captureScreenshot() {
    if (!this.graph || !this.graph.chart) {
      this._showToast('No graph to capture', 'warning');
      return;
    }

    try {
      // Get data URL from ECharts
      const dataUrl = this.graph.chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff',
      });

      this.currentScreenshot = dataUrl;

      const actions = [];

      // Download if enabled
      if (this.screenshotSettings.download) {
        this._downloadScreenshot(dataUrl);
        actions.push('downloaded');
      }

      // Show preview if enabled
      if (this.screenshotSettings.preview) {
        this._showScreenshotModal(dataUrl);
        actions.push('preview shown');
      }

      // Store as thumbnail if enabled
      if (this.screenshotSettings.store) {
        await this._storeScreenshot(dataUrl);
        actions.push('saved as thumbnail');
      }

      // Show toast if no actions were taken
      if (actions.length === 0) {
        this._showToast('Screenshot captured. Enable options to download, preview, or save.', 'info');
      } else if (!this.screenshotSettings.preview) {
        // Only show toast if preview is not shown (to avoid double notification)
        this._showToast(`Screenshot ${actions.join(', ')}`, 'success');
      }

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      this._showToast('Failed to capture screenshot', 'error');
    }
  }

  /**
   * Download screenshot as PNG
   */
  _downloadScreenshot(dataUrl) {
    const filename = `${this.state.name || 'graph'}-${Date.now()}.png`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  /**
   * Show screenshot preview modal
   */
  _showScreenshotModal(dataUrl) {
    const modal = document.getElementById('ms-screenshot-modal');
    const preview = document.getElementById('ms-screenshot-preview');

    if (modal && preview) {
      preview.innerHTML = `<img src="${dataUrl}" alt="Screenshot preview" />`;
      modal.style.display = 'flex';
    }
  }

  /**
   * Hide screenshot modal
   */
  _hideScreenshotModal() {
    const modal = document.getElementById('ms-screenshot-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Store screenshot as thumbnail on server
   */
  async _storeScreenshot(dataUrl) {
    if (!this.state.id) {
      this._showToast('Save the graph first to store thumbnail', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/graph-thumbnail.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph_id: this.state.id,
          image: dataUrl,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to store thumbnail');
      }
    } catch (error) {
      console.error('Failed to store thumbnail:', error);
      this._showToast('Failed to save thumbnail', 'error');
    }
  }

  /**
   * Update the preview name display
   */
  _updatePreviewName() {
    const nameEl = document.getElementById('ms-preview-name');
    if (nameEl) {
      nameEl.textContent = this.state.name.trim() || 'Untitled Graph';
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
      this._showToast(message, 'success');
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this._showToast(message, 'success');
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
    if (this.colorPalette) {
      this.colorPalette.destroy();
    }
    this.container.innerHTML = '';
  }
}

export default GraphConfigurator;
