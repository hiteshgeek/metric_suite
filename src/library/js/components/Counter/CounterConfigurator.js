/**
 * Counter Configurator UI Component
 * Provides a complete interface for configuring and previewing counter widgets
 */

import { Counter } from './index.js';
import { createElement, debounce } from '../Graph/utils.js';
import { SchemaExplorer } from '../SchemaExplorer/index.js';
import { ColorPalette } from '../ColorPalette/index.js';
import { PreviewPanel } from '../PreviewPanel/index.js';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';

// Register SQL language
hljs.registerLanguage('sql', sql);

// SQL Formatter loaded from CDN
let sqlFormatterLoaded = false;
const loadSQLFormatter = () => {
  if (sqlFormatterLoaded || window.sqlFormatter) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sql-formatter@15/dist/sql-formatter.min.js';
    script.onload = () => {
      sqlFormatterLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Load formatter in background
loadSQLFormatter().catch(() => console.warn('SQL formatter could not be loaded'));

export class CounterConfigurator {
  constructor(container, options = {}) {
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('CounterConfigurator: Container element not found');
    }

    this.options = {
      apiEndpoint: options.apiEndpoint || '/api/data.php',
      saveEndpoint: options.saveEndpoint || '/api/counter.php',
      schemaEndpoint: options.schemaEndpoint || '/api/schema-cache.php',
      colorsEndpoint: options.colorsEndpoint || '/api/colors.php',
      editId: options.editId || null,
      onSave: options.onSave || null,
      ...options,
    };

    // Current configuration state
    this.state = {
      id: null,
      name: '',
      title: '',
      layout: 'row',
      counterCount: 1,
      query: '',
      bgColor: '#ffffff',
      fgColor: '#374151',
      accentColor: '#6366f1',
      featuredIndex: 0,
      // Counter 1
      valueColumn1: 'count_1',
      label1: '',
      prefix1: '',
      suffix1: '',
      format1: 'integer',
      icon1: '',
      staticValue1: '',
      // Counter 2
      valueColumn2: 'count_2',
      label2: '',
      prefix2: '',
      suffix2: '',
      format2: 'integer',
      icon2: '',
      staticValue2: '',
      // Counter 3
      valueColumn3: 'count_3',
      label3: '',
      prefix3: '',
      suffix3: '',
      format3: 'integer',
      icon3: '',
      staticValue3: '',
      // Data
      data: null,
      columns: [],
    };

    this.counter = null;
    this.schemaExplorer = null;
    this.colorPalette = null;
    this.previewPanel = null;
    this.isLoading = false;
    this.isEditMode = !!this.options.editId;
    this.isSaved = false;
    this.isDirty = false;

    this._init();
  }

  _init() {
    this.container.innerHTML = '';
    this.container.className = 'ms-configurator ms-configurator--counter';

    this._createLayout();
    this._initResizablePanels();
    this._initPreviewPanel();
    this._initPreviewCounter();
    this._initSchemaExplorer();
    this._initColorPalette();
    this._bindEvents();

    if (this.options.editId) {
      this._loadExistingConfig();
    } else {
      this._updatePreview();
    }
  }

  _initResizablePanels() {
    const savedWidths = JSON.parse(localStorage.getItem('ms-counter-widths') || '{}');

    const schemaPanel = document.getElementById('ms-schema-panel');
    const settingsPanel = document.getElementById('ms-settings-panel');

    if (savedWidths.schema && schemaPanel) {
      schemaPanel.style.width = savedWidths.schema + 'px';
    }
    if (savedWidths.settings && settingsPanel) {
      settingsPanel.style.width = savedWidths.settings + 'px';
    }

    this._setupResizer('ms-resizer-schema', 'ms-schema-panel', 180, 350);
    this._setupResizer('ms-resizer-settings', 'ms-settings-panel', 300, 480);
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
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + (clientX - startX)));
      panel.style.width = newWidth + 'px';
    };

    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      resizer.classList.remove('is-active');
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
    localStorage.setItem('ms-counter-widths', JSON.stringify({
      schema: schemaPanel?.offsetWidth || 220,
      settings: settingsPanel?.offsetWidth || 380
    }));
  }

  _createLayout() {
    // Header - different title for edit vs create mode
    const headerTitle = this.isEditMode ? 'Edit Counter' : 'Counter Configurator';
    const saveButtonText = this.isEditMode ? 'Update Counter' : 'Save Counter';

    // Status indicator (like Graph configurator)
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
          title: 'Create a new counter',
        },
        [
          createElement('span', { className: 'ms-btn__icon' }),
          'New Counter',
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
    settings.className = 'ms-configurator__settings';

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
    this.container.appendChild(toastContainer);
    this.container.appendChild(unsavedModal);
  }

  _createPreviewPanel() {
    // Create container for PreviewPanel component
    const panel = createElement('div', { id: 'ms-preview-panel-container' });
    return panel;
  }

  _initPreviewPanel() {
    const panelContainer = document.getElementById('ms-preview-panel-container');
    if (!panelContainer) return;

    this.previewPanel = new PreviewPanel(panelContainer, {
      title: 'Counter Preview',
      type: 'counter',
      showScreenshot: false, // Counters don't need screenshots for now
      showExport: true,
      onExportHTML: () => this._exportHTML(),
      onExportJS: () => this._exportJS(),
      onExportJSON: () => this._exportJSON(),
    });

    // Add counter preview container inside the preview content
    const previewContent = this.previewPanel.getContentElement();
    if (previewContent) {
      const counterPreview = createElement('div', { id: 'ms-counter-preview', className: 'ms-counter-preview' });
      previewContent.appendChild(counterPreview);
    }
  }

  _createSettingsPanel() {
    const panel = createElement('div', { className: 'ms-configurator__settings-inner' });

    // Basic Info
    panel.appendChild(this._createSection('Basic Info', [
      this._createField('text', 'name', 'Name', 'My Counter Widget'),
      this._createField('text', 'title', 'Display Title', 'Optional widget title'),
    ]));

    // Data Source
    panel.appendChild(this._createSection('Data Source', [
      createElement('div', { className: 'ms-field' }, [
        createElement('label', { className: 'ms-field__label' }, [
          'SQL Query',
          createElement('span', { className: 'ms-field__hint' }, ['Click columns to insert']),
        ]),
        this._createSQLEditor(),
      ]),
      createElement('div', { className: 'ms-field__row' }, [
        createElement('button', { className: 'ms-btn ms-btn--secondary', id: 'ms-test-query-btn' }, ['Test Query']),
        createElement('button', { className: 'ms-btn ms-btn--outline', id: 'ms-clear-query-btn' }, ['Clear']),
        createElement('span', { className: 'ms-query-status', id: 'ms-query-status' }),
      ]),
    ]));

    // Layout
    panel.appendChild(this._createSection('Layout', [
      this._createField('select', 'counterCount', 'Counters', '', [
        { value: '1', label: '1 Counter' },
        { value: '2', label: '2 Counters' },
        { value: '3', label: '3 Counters' },
      ]),
      this._createLayoutSelector(),
    ]));

    // Colors
    panel.appendChild(this._createSection('Colors', [
      createElement('div', { className: 'ms-color-row' }, [
        this._createColorPicker('BG', 'bgColor', '#ffffff'),
        this._createColorPicker('Text', 'fgColor', '#374151'),
        this._createColorPicker('Accent', 'accentColor', '#6366f1'),
      ]),
      createElement('div', { id: 'ms-color-palette', className: 'ms-color-palette-slot' }),
    ]));

    // Counter Sections
    panel.appendChild(this._createCounterSection(1));

    const section2 = this._createCounterSection(2);
    section2.id = 'ms-counter-2-section';
    section2.style.display = 'none';
    panel.appendChild(section2);

    const section3 = this._createCounterSection(3);
    section3.id = 'ms-counter-3-section';
    section3.style.display = 'none';
    panel.appendChild(section3);

    return panel;
  }

  _createSection(title, children) {
    return createElement('div', { className: 'ms-section' }, [
      createElement('h4', { className: 'ms-section__title' }, [title]),
      createElement('div', { className: 'ms-section__content' }, children),
    ]);
  }

  _createField(type, field, label, placeholder = '', options = []) {
    const fieldEl = createElement('div', { className: 'ms-field' });

    if (label) {
      fieldEl.appendChild(createElement('label', { className: 'ms-field__label' }, [label]));
    }

    if (type === 'select') {
      const select = createElement('select', { className: 'ms-select', 'data-field': field });
      options.forEach(opt => {
        select.appendChild(createElement('option', { value: opt.value }, [opt.label]));
      });
      fieldEl.appendChild(select);
    } else {
      fieldEl.appendChild(createElement('input', {
        type,
        className: 'ms-input',
        'data-field': field,
        placeholder,
      }));
    }

    return fieldEl;
  }

  _createLayoutSelector() {
    const layouts = [
      { value: 'row', label: 'Row', desc: 'Side by side' },
      { value: 'row-featured', label: 'Featured Row', desc: 'One prominent' },
      { value: 'stack', label: 'Stack', desc: 'Vertical list' },
      { value: 'grid', label: 'Grid', desc: '2x2 layout' },
    ];

    const container = createElement('div', { className: 'ms-field' }, [
      createElement('label', { className: 'ms-field__label' }, ['Layout']),
      createElement('div', { className: 'ms-layout-grid' }),
    ]);

    const grid = container.querySelector('.ms-layout-grid');

    layouts.forEach(layout => {
      const btn = createElement('button', {
        className: `ms-layout-btn ${layout.value === this.state.layout ? 'is-active' : ''}`,
        'data-layout': layout.value,
        type: 'button',
      }, [
        createElement('span', { className: 'ms-layout-btn__label' }, [layout.label]),
      ]);
      grid.appendChild(btn);
    });

    return container;
  }

  _createColorPicker(label, field, defaultValue) {
    return createElement('div', { className: 'ms-color-field' }, [
      createElement('label', { className: 'ms-color-field__label' }, [label]),
      createElement('input', {
        type: 'color',
        className: 'ms-color-field__input',
        'data-field': field,
        value: defaultValue,
      }),
    ]);
  }

  _createSQLEditor() {
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
      id: 'ms-query-input',
      'data-field': 'query',
      placeholder: 'SELECT COUNT(*) as count_1, SUM(total) as count_2 FROM orders',
      spellcheck: 'false',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
    });

    container.appendChild(backdrop);
    container.appendChild(textarea);

    return container;
  }

  _updateSQLHighlight() {
    const textarea = document.getElementById('ms-query-input');
    const highlights = document.getElementById('ms-query-highlights');
    if (!textarea || !highlights) return;

    const code = highlights.querySelector('code');
    if (!code) return;

    let text = textarea.value;
    if (text.endsWith('\n')) {
      text += ' ';
    }

    const result = hljs.highlight(text || ' ', { language: 'sql' });
    code.innerHTML = result.value;

    highlights.scrollTop = textarea.scrollTop;
    highlights.scrollLeft = textarea.scrollLeft;
  }

  _autoResizeEditor() {
    const textarea = document.getElementById('ms-query-input');
    const container = textarea?.closest('.ms-sql-editor');
    const backdrop = container?.querySelector('.ms-sql-editor__backdrop');
    const highlights = document.getElementById('ms-query-highlights');
    if (!textarea || !container) return;

    textarea.style.height = '0';
    container.style.height = 'auto';
    if (backdrop) backdrop.style.height = 'auto';
    if (highlights) highlights.style.height = 'auto';

    const scrollHeight = textarea.scrollHeight;
    const minHeight = 80;
    const newHeight = Math.max(minHeight, scrollHeight);

    const heightPx = newHeight + 'px';
    textarea.style.height = heightPx;
    container.style.height = heightPx;
    if (backdrop) backdrop.style.height = heightPx;
    if (highlights) highlights.style.height = heightPx;
  }

  _formatSQL(sqlText) {
    try {
      if (window.sqlFormatter && window.sqlFormatter.format) {
        return window.sqlFormatter.format(sqlText, {
          language: 'mysql',
          tabWidth: 4,
          useTabs: false,
          keywordCase: 'upper',
          linesBetweenQueries: 1,
        });
      }
      return sqlText;
    } catch (e) {
      console.warn('SQL formatting failed:', e);
      return sqlText;
    }
  }

  _createCounterSection(num) {
    const icons = Counter.getAvailableIcons();
    const formats = Counter.getAvailableFormats();
    const iconOptions = [{ value: '', label: 'None' }, ...icons];

    const section = createElement('div', { className: 'ms-section ms-section--counter' });

    const titleRow = createElement('div', { className: 'ms-section__title-row' }, [
      createElement('h4', { className: 'ms-section__title' }, [`Counter ${num}`]),
    ]);

    if (num > 1) {
      const featuredBtn = createElement('button', {
        className: 'ms-featured-btn',
        'data-featured': num - 1,
        type: 'button',
        title: 'Set as featured',
      });
      featuredBtn.innerHTML = '★';
      titleRow.appendChild(featuredBtn);
    }

    section.appendChild(titleRow);

    const content = createElement('div', { className: 'ms-section__content' });

    // Row 1: Label & Column
    content.appendChild(createElement('div', { className: 'ms-field-row' }, [
      this._createField('text', `label${num}`, 'Label', 'e.g. Total Sales'),
      this._createField('text', `valueColumn${num}`, 'Column', `count_${num}`),
    ]));

    // Row 2: Prefix, Suffix, Static
    content.appendChild(createElement('div', { className: 'ms-field-row ms-field-row--3' }, [
      this._createField('text', `prefix${num}`, 'Prefix', '$'),
      this._createField('text', `suffix${num}`, 'Suffix', '%'),
      this._createField('text', `staticValue${num}`, 'Static', ''),
    ]));

    // Row 3: Format & Icon
    content.appendChild(createElement('div', { className: 'ms-field-row' }, [
      this._createField('select', `format${num}`, 'Format', '', formats),
      this._createField('select', `icon${num}`, 'Icon', '', iconOptions),
    ]));

    section.appendChild(content);
    return section;
  }

  _initPreviewCounter() {
    const previewContainer = document.getElementById('ms-counter-preview');
    if (previewContainer) {
      this.counter = new Counter(previewContainer, this._getCounterOptions());
    }
  }

  _initSchemaExplorer() {
    const schemaContainer = document.getElementById('ms-schema-explorer');
    if (schemaContainer) {
      this.schemaExplorer = new SchemaExplorer(schemaContainer, {
        schemaEndpoint: this.options.schemaEndpoint,
        onColumnSelect: (column, table) => {
          this._insertToQuery(`${table}.${column}`);
        },
      });
    }
  }

  _initColorPalette() {
    const paletteContainer = document.getElementById('ms-color-palette');
    if (paletteContainer) {
      this.colorPalette = new ColorPalette(paletteContainer, {
        apiEndpoint: this.options.colorsEndpoint,
        onColorsChange: (colors) => {
          if (colors[0]) this._setColor('accentColor', colors[0]);
          this._updatePreview();
          this._markDirty();
        },
        showCustomize: false,
        maxColors: 3,
      });
    }
  }

  _insertToQuery(text) {
    const queryInput = document.getElementById('ms-query-input');
    if (queryInput) {
      const start = queryInput.selectionStart;
      const end = queryInput.selectionEnd;
      const value = queryInput.value;
      queryInput.value = value.substring(0, start) + text + value.substring(end);
      queryInput.focus();
      queryInput.selectionStart = queryInput.selectionEnd = start + text.length;
      this.state.query = queryInput.value;
      this._markDirty();
    }
  }

  _bindEvents() {
    const debouncedUpdate = debounce(() => this._updatePreview(), 250);

    // Input changes
    this.container.addEventListener('input', e => {
      const field = e.target.dataset.field;
      if (field) {
        this.state[field] = e.target.value;
        debouncedUpdate();
        this._markDirty();

        // Update preview title when name changes
        if (field === 'name' && this.previewPanel) {
          this.previewPanel.setTitle(e.target.value || 'Counter Preview');
        }
      }
    });

    // Select/checkbox changes
    this.container.addEventListener('change', e => {
      const field = e.target.dataset.field;
      if (field) {
        this.state[field] = e.target.value;

        if (field === 'counterCount') {
          this._updateCounterSections();
        }

        this._updatePreview();
        this._markDirty();
      }
    });

    // Layout selector
    this.container.addEventListener('click', e => {
      const layoutBtn = e.target.closest('.ms-layout-btn');
      if (layoutBtn) {
        this.container.querySelectorAll('.ms-layout-btn').forEach(b => b.classList.remove('is-active'));
        layoutBtn.classList.add('is-active');
        this.state.layout = layoutBtn.dataset.layout;
        this._updatePreview();
        this._markDirty();
      }

      // Featured button
      const featuredBtn = e.target.closest('.ms-featured-btn');
      if (featuredBtn) {
        this.state.featuredIndex = parseInt(featuredBtn.dataset.featured);
        this._updateFeaturedButtons();
        this._updatePreview();
        this._markDirty();
      }
    });

    // SQL Editor events
    const queryTextarea = document.getElementById('ms-query-input');
    if (queryTextarea) {
      queryTextarea.addEventListener('input', () => {
        this.state.query = queryTextarea.value;
        this._updateSQLHighlight();
        this._autoResizeEditor();
        this._markDirty();
      });

      // Sync scroll between textarea and highlights
      queryTextarea.addEventListener('scroll', () => {
        const highlights = document.getElementById('ms-query-highlights');
        if (highlights) {
          highlights.scrollTop = queryTextarea.scrollTop;
          highlights.scrollLeft = queryTextarea.scrollLeft;
        }
      });

      // Format on paste
      queryTextarea.addEventListener('paste', (e) => {
        const pastedText = e.clipboardData.getData('text');
        const formatted = this._formatSQL(pastedText);

        if (formatted !== pastedText) {
          e.preventDefault();
          document.execCommand('insertText', false, formatted);
          this.state.query = queryTextarea.value;
          this._updateSQLHighlight();
          requestAnimationFrame(() => this._autoResizeEditor());
        }
      });

      // Initial setup
      this._autoResizeEditor();
      this._updateSQLHighlight();
    }

    // Test Query
    document.getElementById('ms-test-query-btn')?.addEventListener('click', () => this._runQuery());

    // Clear Query
    document.getElementById('ms-clear-query-btn')?.addEventListener('click', () => {
      const queryInput = document.getElementById('ms-query-input');
      if (queryInput) {
        queryInput.value = '';
        this.state.query = '';
        this._autoResizeEditor();
        this._updateSQLHighlight();
      }
    });

    // Save
    document.getElementById('ms-save-btn')?.addEventListener('click', () => this._saveConfig());

    // New Counter button
    document.getElementById('ms-new-btn')?.addEventListener('click', () => this._handleNewCounter());

    // Unsaved changes modal buttons
    document.getElementById('ms-unsaved-save')?.addEventListener('click', async () => {
      await this._saveConfig();
      this._hideUnsavedModal();
      this._resetConfigurator();
    });

    document.getElementById('ms-unsaved-discard')?.addEventListener('click', () => {
      this._hideUnsavedModal();
      this._resetConfigurator();
    });

    document.getElementById('ms-unsaved-cancel')?.addEventListener('click', () => {
      this._hideUnsavedModal();
    });

    // Close modal on backdrop click
    document.getElementById('ms-unsaved-modal')?.querySelector('.ms-modal__backdrop')?.addEventListener('click', () => {
      this._hideUnsavedModal();
    });
  }

  _handleNewCounter() {
    if (this.isDirty) {
      this._showUnsavedModal();
    } else {
      this._resetConfigurator();
    }
  }

  _showUnsavedModal() {
    const modal = document.getElementById('ms-unsaved-modal');
    if (modal) modal.style.display = 'flex';
  }

  _hideUnsavedModal() {
    const modal = document.getElementById('ms-unsaved-modal');
    if (modal) modal.style.display = 'none';
  }

  _resetConfigurator() {
    // Reset state
    this.state = {
      id: null,
      name: '',
      title: '',
      layout: 'row',
      counterCount: 1,
      query: '',
      bgColor: '#ffffff',
      fgColor: '#374151',
      accentColor: '#6366f1',
      featuredIndex: 0,
      valueColumn1: 'count_1', label1: '', prefix1: '', suffix1: '', format1: 'integer', icon1: '', staticValue1: '',
      valueColumn2: 'count_2', label2: '', prefix2: '', suffix2: '', format2: 'integer', icon2: '', staticValue2: '',
      valueColumn3: 'count_3', label3: '', prefix3: '', suffix3: '', format3: 'integer', icon3: '', staticValue3: '',
      data: null,
      columns: [],
    };

    this.isEditMode = false;
    this.isDirty = false;
    this.isSaved = false;

    // Update URL
    window.history.pushState({}, '', window.location.pathname);

    // Update UI
    this._populateForm();
    this._updateCounterSections();
    this._updatePreview();
    this._updateStatus();

    // Update header
    const title = this.container.querySelector('.ms-configurator__title');
    if (title) title.textContent = 'Counter Configurator';

    const saveBtn = document.getElementById('ms-save-btn');
    if (saveBtn) saveBtn.textContent = 'Save Counter';
  }

  _updateFeaturedButtons() {
    this.container.querySelectorAll('.ms-featured-btn').forEach(btn => {
      btn.classList.toggle('is-active', parseInt(btn.dataset.featured) === this.state.featuredIndex);
    });
  }

  _setColor(field, color) {
    this.state[field] = color;
    const input = this.container.querySelector(`[data-field="${field}"][type="color"]`);
    if (input) input.value = color;
  }

  _updateCounterSections() {
    const count = parseInt(this.state.counterCount) || 1;

    document.getElementById('ms-counter-2-section').style.display = count >= 2 ? 'block' : 'none';
    document.getElementById('ms-counter-3-section').style.display = count >= 3 ? 'block' : 'none';

    // Update layout options
    this.container.querySelectorAll('.ms-layout-btn').forEach(btn => {
      const layout = btn.dataset.layout;
      const hide = (count === 1 && layout.includes('featured')) || (count < 2 && layout === 'grid');
      btn.style.display = hide ? 'none' : '';

      if (hide && btn.classList.contains('is-active')) {
        btn.classList.remove('is-active');
        this.container.querySelector('.ms-layout-btn[data-layout="row"]')?.classList.add('is-active');
        this.state.layout = 'row';
      }
    });
  }

  _getCounterOptions() {
    const count = parseInt(this.state.counterCount) || 1;
    const counters = [];

    for (let i = 1; i <= count; i++) {
      const staticVal = this.state[`staticValue${i}`];
      const col = this.state[`valueColumn${i}`] || `count_${i}`;
      const dataVal = this.state.data?.[col];

      counters.push({
        value: staticVal ? parseFloat(staticVal) : (dataVal !== undefined ? parseFloat(dataVal) : 1000 * i),
        label: this.state[`label${i}`] || '',
        prefix: this.state[`prefix${i}`] || '',
        suffix: this.state[`suffix${i}`] || '',
        format: this.state[`format${i}`] || 'integer',
        icon: this.state[`icon${i}`] || '',
        featured: this.state.featuredIndex === (i - 1),
      });
    }

    return {
      title: this.state.title,
      layout: this.state.layout,
      bgColor: this.state.bgColor,
      fgColor: this.state.fgColor,
      accentColor: this.state.accentColor,
      counters,
      animate: false,
    };
  }

  _updatePreview() {
    if (this.counter) {
      this.counter.setOptions(this._getCounterOptions());
    }
  }

  async _runQuery() {
    if (!this.state.query.trim()) {
      this._showToast('Enter a SQL query first', 'warning');
      return;
    }

    const statusEl = document.getElementById('ms-query-status');
    if (statusEl) statusEl.textContent = 'Running...';

    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: this.state.query }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        this.state.data = result.data[0] || {};
        this.state.columns = result.columns || [];

        if (statusEl) {
          statusEl.textContent = `✓ ${result.data.length} row(s)`;
          statusEl.className = 'ms-query-status ms-query-status--success';
        }

        this._updatePreview();
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (error) {
      if (statusEl) {
        statusEl.textContent = '✗ Error';
        statusEl.className = 'ms-query-status ms-query-status--error';
      }
      this._showToast(error.message, 'error');
    }
  }

  async _saveConfig() {
    if (!this.state.name.trim()) {
      this._showToast('Please enter a name', 'warning');
      return;
    }

    this._setLoading(true);

    try {
      const payload = {
        name: this.state.name,
        title: this.state.title,
        config: this._getCounterOptions(),
        data_source: this.state.query ? 'query' : 'static',
        data_query: this.state.query,
        counter_count: parseInt(this.state.counterCount) || 1,
        layout: this.state.layout,
        bg_color: this.state.bgColor,
        fg_color: this.state.fgColor,
        accent_color: this.state.accentColor,
        value_column_1: this.state.valueColumn1,
        label_1: this.state.label1,
        prefix_1: this.state.prefix1,
        suffix_1: this.state.suffix1,
        format_1: this.state.format1,
        icon_1: this.state.icon1,
        value_column_2: this.state.valueColumn2,
        label_2: this.state.label2,
        prefix_2: this.state.prefix2,
        suffix_2: this.state.suffix2,
        format_2: this.state.format2,
        icon_2: this.state.icon2,
        value_column_3: this.state.valueColumn3,
        label_3: this.state.label3,
        prefix_3: this.state.prefix3,
        suffix_3: this.state.suffix3,
        format_3: this.state.format3,
        icon_3: this.state.icon3,
        static_data: {
          value1: this.state.staticValue1,
          value2: this.state.staticValue2,
          value3: this.state.staticValue3,
        },
      };

      const method = this.state.id ? 'PUT' : 'POST';
      const url = this.state.id ? `${this.options.saveEndpoint}?id=${this.state.id}` : this.options.saveEndpoint;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        if (!this.state.id && result.id) {
          this.state.id = result.id;
          this.isEditMode = true;
          window.history.pushState({ id: result.id }, '', `${window.location.pathname}?id=${result.id}`);
          document.getElementById('ms-save-btn').textContent = 'Update';
        }

        this._markSaved();
        this._showToast('Saved successfully!', 'success');

        if (this.options.onSave) this.options.onSave(result);
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (error) {
      this._showToast(error.message, 'error');
    } finally {
      this._setLoading(false);
    }
  }

  async _loadExistingConfig() {
    try {
      const response = await fetch(`${this.options.saveEndpoint}?id=${this.options.editId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const c = result.data;

        this.state.id = c.id;
        this.state.name = c.name || '';
        this.state.title = c.title || '';
        this.state.layout = c.layout || 'row';
        this.state.counterCount = c.counter_count || 1;
        this.state.query = c.data_query || '';
        this.state.bgColor = c.bg_color || '#ffffff';
        this.state.fgColor = c.fg_color || '#374151';
        this.state.accentColor = c.accent_color || '#6366f1';

        for (let i = 1; i <= 3; i++) {
          this.state[`valueColumn${i}`] = c[`value_column_${i}`] || `count_${i}`;
          this.state[`label${i}`] = c[`label_${i}`] || '';
          this.state[`prefix${i}`] = c[`prefix_${i}`] || '';
          this.state[`suffix${i}`] = c[`suffix_${i}`] || '';
          this.state[`format${i}`] = c[`format_${i}`] || 'integer';
          this.state[`icon${i}`] = c[`icon_${i}`] || '';
        }

        if (c.static_data) {
          this.state.staticValue1 = c.static_data.value1 || '';
          this.state.staticValue2 = c.static_data.value2 || '';
          this.state.staticValue3 = c.static_data.value3 || '';
        }

        this._populateForm();
        this._updateCounterSections();
        this._updatePreview();
        this._markSaved();

        if (this.state.query) await this._runQuery();
      }
    } catch (error) {
      this._showToast(error.message, 'error');
    }
  }

  _populateForm() {
    Object.keys(this.state).forEach(key => {
      const input = this.container.querySelector(`[data-field="${key}"]`);
      if (input) input.value = this.state[key];
    });

    // Layout buttons
    this.container.querySelectorAll('.ms-layout-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.layout === this.state.layout);
    });

    // Colors
    ['bgColor', 'fgColor', 'accentColor'].forEach(f => this._setColor(f, this.state[f]));

    // SQL Editor
    this._autoResizeEditor();
    this._updateSQLHighlight();
  }

  _markDirty() {
    this.isDirty = true;
    this.isSaved = false;
    this._updateStatus();
  }

  _markSaved() {
    this.isDirty = false;
    this.isSaved = true;
    this._updateStatus();
  }

  _updateStatus() {
    const indicator = document.getElementById('ms-status-indicator');
    if (!indicator) return;

    const dot = indicator.querySelector('.ms-status-indicator__dot');
    const text = indicator.querySelector('.ms-status-indicator__text');

    if (this.isDirty) {
      indicator.className = 'ms-status-indicator ms-status-indicator--dirty';
      if (text) text.textContent = 'Unsaved changes';
    } else if (this.isSaved) {
      indicator.className = 'ms-status-indicator ms-status-indicator--saved';
      if (text) text.textContent = 'Saved';
    } else {
      indicator.className = 'ms-status-indicator';
      if (text) text.textContent = 'Not saved';
    }
  }

  _setLoading(loading) {
    this.isLoading = loading;
    document.getElementById('ms-save-btn').disabled = loading;
    document.getElementById('ms-test-query-btn').disabled = loading;
  }

  _showToast(message, type = 'info') {
    const container = document.getElementById('ms-toast-container');
    if (!container) return;

    const toast = createElement('div', { className: `ms-toast ms-toast--${type}` }, [
      createElement('span', { className: 'ms-toast__message' }, [message]),
      createElement('button', { className: 'ms-toast__close' }, ['×']),
    ]);

    toast.querySelector('.ms-toast__close').onclick = () => toast.remove();
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('ms-toast--hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  _exportHTML() {
    const config = this._getCounterOptions();
    const id = 'counter-' + Date.now();

    const html = `<!-- Counter Widget -->
<div id="${id}"></div>
<link rel="stylesheet" href="/assets/css/metric-suite.css">
<script type="module">
  import { Counter } from '/assets/js/metric-suite.js';

  const counter = new Counter('#${id}', ${JSON.stringify(config, null, 2)});
</script>`;

    this._copyToClipboard(html, 'HTML copied to clipboard!');
  }

  _exportJS() {
    const config = this._getCounterOptions();

    const js = `import { Counter } from 'metric-suite';

const counter = new Counter('#my-counter', ${JSON.stringify(config, null, 2)});`;

    this._copyToClipboard(js, 'JavaScript copied to clipboard!');
  }

  _exportJSON() {
    const config = {
      ...this._getCounterOptions(),
      name: this.state.name,
      query: this.state.query,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${this.state.name || 'counter'}-config.json`);
    downloadAnchor.click();

    this._showToast('JSON downloaded!', 'success');
  }

  _copyToClipboard(text, successMessage) {
    navigator.clipboard.writeText(text).then(() => {
      this._showToast(successMessage, 'success');
    }).catch(() => {
      this._showToast('Failed to copy to clipboard', 'error');
    });
  }

  destroy() {
    this.counter?.destroy();
    this.schemaExplorer?.destroy();
    this.colorPalette?.destroy();
    this.previewPanel?.destroy();
    this.container.innerHTML = '';
  }
}

export default CounterConfigurator;
