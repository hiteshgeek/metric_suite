/**
 * Theme Builder Component
 * Provides a comprehensive interface for customizing ECharts themes
 * Similar to https://echarts.apache.org/en/theme-builder.html
 */

import { createElement } from '../utils.js';
import {
  getAvailableThemes,
  getThemeDefinition,
  createCustomTheme,
  registerCustomTheme,
  defaultColorPalette,
} from '../themes.js';

/**
 * Default theme configuration for the builder
 */
const defaultConfig = {
  // Color palette (up to 10 colors)
  colors: [...defaultColorPalette],
  // Background
  backgroundColor: 'transparent',
  // Text styles
  textColor: '#333333',
  textFontFamily: 'sans-serif',
  textFontSize: 12,
  // Title
  titleColor: '#333333',
  titleFontSize: 18,
  subtitleColor: '#aaaaaa',
  // Legend
  legendTextColor: '#333333',
  // Tooltip
  tooltipBgColor: 'rgba(50,50,50,0.7)',
  tooltipBorderColor: '#333333',
  tooltipTextColor: '#ffffff',
  // Axis
  axisLineShow: true,
  axisLineColor: '#333333',
  axisTickShow: true,
  axisLabelColor: '#333333',
  // Grid/Split lines
  splitLineShow: true,
  splitLineColor: '#eeeeee',
  splitLineType: 'solid',
  splitAreaShow: false,
};

export class ThemeBuilder {
  constructor(container, options = {}) {
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('ThemeBuilder: Container element not found');
    }

    this.options = {
      onChange: options.onChange || (() => {}),
      onApply: options.onApply || (() => {}),
      ...options,
    };

    // Current configuration
    this.config = { ...defaultConfig };

    // Active tab
    this.activeTab = 'colors';

    // Custom theme name
    this.customThemeName = null;

    this._init();
  }

  _init() {
    this.container.innerHTML = '';
    this.container.className = 'ms-theme-builder';

    this._createLayout();
    this._bindEvents();
  }

  _createLayout() {
    // Header with preset selector and custom toggle
    const header = createElement('div', { className: 'ms-theme-builder__header' }, [
      createElement('div', { className: 'ms-theme-builder__preset' }, [
        createElement('label', {}, ['Start from:']),
        createElement(
          'select',
          { className: 'ms-select', id: 'ms-tb-preset' },
          [
            createElement('option', { value: '' }, ['Custom']),
            ...getAvailableThemes().map((t) =>
              createElement('option', { value: t.value }, [t.label])
            ),
          ]
        ),
      ]),
      createElement('button', { className: 'ms-btn ms-btn--primary ms-btn--sm', id: 'ms-tb-apply' }, [
        'Apply Theme',
      ]),
    ]);

    // Tabs navigation
    const tabs = createElement('div', { className: 'ms-theme-builder__tabs' }, [
      this._createTab('colors', 'Colors', true),
      this._createTab('text', 'Text'),
      this._createTab('axis', 'Axis'),
      this._createTab('tooltip', 'Tooltip'),
      this._createTab('background', 'Background'),
    ]);

    // Tab panels
    const panels = createElement('div', { className: 'ms-theme-builder__panels' }, [
      this._createColorsPanel(),
      this._createTextPanel(),
      this._createAxisPanel(),
      this._createTooltipPanel(),
      this._createBackgroundPanel(),
    ]);

    this.container.appendChild(header);
    this.container.appendChild(tabs);
    this.container.appendChild(panels);
  }

  _createTab(id, label, active = false) {
    return createElement(
      'button',
      {
        className: `ms-theme-builder__tab ${active ? 'active' : ''}`,
        'data-tab': id,
      },
      [label]
    );
  }

  /**
   * Colors Panel - Color palette configuration
   */
  _createColorsPanel() {
    const panel = createElement('div', {
      className: 'ms-theme-builder__panel active',
      'data-panel': 'colors',
    });

    // Color palette (10 colors)
    const paletteSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Color Palette']),
      createElement('p', { className: 'ms-tb-section__desc' }, [
        'These colors are used for chart series in order.',
      ]),
      createElement('div', { className: 'ms-tb-colors', id: 'ms-tb-palette' }),
      createElement('div', { className: 'ms-tb-colors__actions' }, [
        createElement('button', { className: 'ms-btn ms-btn--outline ms-btn--sm', id: 'ms-tb-add-color' }, [
          '+ Add Color',
        ]),
        createElement('button', { className: 'ms-btn ms-btn--ghost ms-btn--sm', id: 'ms-tb-reset-colors' }, [
          'Reset',
        ]),
      ]),
    ]);

    // Preset palettes
    const presetsSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Preset Palettes']),
      createElement('div', { className: 'ms-tb-presets', id: 'ms-tb-color-presets' }),
    ]);

    panel.appendChild(paletteSection);
    panel.appendChild(presetsSection);

    // Populate color palette
    setTimeout(() => this._renderColorPalette(), 0);
    setTimeout(() => this._renderColorPresets(), 0);

    return panel;
  }

  _renderColorPalette() {
    const container = document.getElementById('ms-tb-palette');
    if (!container) return;

    container.innerHTML = '';

    this.config.colors.forEach((color, index) => {
      const colorItem = createElement('div', { className: 'ms-tb-color-item', 'data-index': index }, [
        createElement('input', {
          type: 'color',
          className: 'ms-tb-color-input',
          value: color,
          'data-index': index,
        }),
        createElement('span', { className: 'ms-tb-color-label' }, [color]),
        createElement('button', {
          className: 'ms-tb-color-remove',
          'data-index': index,
          title: 'Remove color',
        }, ['×']),
      ]);
      container.appendChild(colorItem);
    });
  }

  _renderColorPresets() {
    const container = document.getElementById('ms-tb-color-presets');
    if (!container) return;

    const presets = [
      { name: 'Default', colors: defaultColorPalette },
      { name: 'Warm', colors: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'] },
      { name: 'Cool', colors: ['#3fb1e3', '#6be6c1', '#626c91', '#a0a7e6', '#c4ebad', '#96dee8', '#5470c6', '#91cc75'] },
      { name: 'Pastel', colors: ['#fc97af', '#87f7cf', '#f7f494', '#72ccff', '#f7c5a0', '#d4a4eb', '#d2f5a6', '#76f2f2'] },
      { name: 'Earth', colors: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4', '#d87c7c', '#919e8b'] },
      { name: 'Ocean', colors: ['#516b91', '#59c4e6', '#edafda', '#93b7e3', '#a5e7f0', '#cbb0e3', '#3fb1e3', '#6be6c1'] },
      { name: 'Sunset', colors: ['#ff715e', '#ffaf51', '#ffee51', '#f5e8c8', '#f3d999', '#e098c7', '#8c6ac4', '#715c87'] },
      { name: 'Forest', colors: ['#4ea397', '#22c3aa', '#7bd9a5', '#3ba272', '#91cc75', '#c4ebad', '#d2f5a6', '#ebdba4'] },
    ];

    container.innerHTML = '';

    presets.forEach((preset) => {
      const presetEl = createElement('div', { className: 'ms-tb-preset', 'data-preset': preset.name }, [
        createElement('span', { className: 'ms-tb-preset__name' }, [preset.name]),
        createElement('div', { className: 'ms-tb-preset__colors' },
          preset.colors.slice(0, 6).map((c) =>
            createElement('span', { className: 'ms-tb-preset__swatch', style: `background-color: ${c}` })
          )
        ),
      ]);
      container.appendChild(presetEl);
    });
  }

  /**
   * Text Panel - Text styling configuration
   */
  _createTextPanel() {
    const panel = createElement('div', {
      className: 'ms-theme-builder__panel',
      'data-panel': 'text',
    });

    // General text
    const generalSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['General Text']),
      this._createColorField('textColor', 'Text Color', this.config.textColor),
      this._createSelectField('textFontFamily', 'Font Family', this.config.textFontFamily, [
        { value: 'sans-serif', label: 'Sans-serif' },
        { value: 'serif', label: 'Serif' },
        { value: 'monospace', label: 'Monospace' },
        { value: 'Arial, sans-serif', label: 'Arial' },
        { value: 'Helvetica, sans-serif', label: 'Helvetica' },
        { value: 'Georgia, serif', label: 'Georgia' },
        { value: 'Verdana, sans-serif', label: 'Verdana' },
      ]),
      this._createNumberField('textFontSize', 'Font Size', this.config.textFontSize, 8, 24, 'px'),
    ]);

    // Title
    const titleSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Title']),
      this._createColorField('titleColor', 'Title Color', this.config.titleColor),
      this._createNumberField('titleFontSize', 'Title Size', this.config.titleFontSize, 12, 36, 'px'),
      this._createColorField('subtitleColor', 'Subtitle Color', this.config.subtitleColor),
    ]);

    // Legend
    const legendSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Legend']),
      this._createColorField('legendTextColor', 'Legend Text Color', this.config.legendTextColor),
    ]);

    panel.appendChild(generalSection);
    panel.appendChild(titleSection);
    panel.appendChild(legendSection);

    return panel;
  }

  /**
   * Axis Panel - Axis styling configuration
   */
  _createAxisPanel() {
    const panel = createElement('div', {
      className: 'ms-theme-builder__panel',
      'data-panel': 'axis',
    });

    // Axis line
    const axisLineSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Axis Line']),
      this._createCheckboxField('axisLineShow', 'Show Axis Line', this.config.axisLineShow),
      this._createColorField('axisLineColor', 'Axis Line Color', this.config.axisLineColor),
      this._createCheckboxField('axisTickShow', 'Show Axis Ticks', this.config.axisTickShow),
    ]);

    // Axis labels
    const axisLabelSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Axis Labels']),
      this._createColorField('axisLabelColor', 'Label Color', this.config.axisLabelColor),
    ]);

    // Grid/Split lines
    const gridSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Grid Lines']),
      this._createCheckboxField('splitLineShow', 'Show Grid Lines', this.config.splitLineShow),
      this._createColorField('splitLineColor', 'Grid Line Color', this.config.splitLineColor),
      this._createSelectField('splitLineType', 'Line Type', this.config.splitLineType, [
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
      ]),
      this._createCheckboxField('splitAreaShow', 'Show Split Area', this.config.splitAreaShow),
    ]);

    panel.appendChild(axisLineSection);
    panel.appendChild(axisLabelSection);
    panel.appendChild(gridSection);

    return panel;
  }

  /**
   * Tooltip Panel - Tooltip styling configuration
   */
  _createTooltipPanel() {
    const panel = createElement('div', {
      className: 'ms-theme-builder__panel',
      'data-panel': 'tooltip',
    });

    const tooltipSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Tooltip Styling']),
      this._createColorField('tooltipBgColor', 'Background Color', this.config.tooltipBgColor),
      this._createColorField('tooltipBorderColor', 'Border Color', this.config.tooltipBorderColor),
      this._createColorField('tooltipTextColor', 'Text Color', this.config.tooltipTextColor),
    ]);

    panel.appendChild(tooltipSection);

    return panel;
  }

  /**
   * Background Panel - Chart background configuration
   */
  _createBackgroundPanel() {
    const panel = createElement('div', {
      className: 'ms-theme-builder__panel',
      'data-panel': 'background',
    });

    const bgSection = createElement('div', { className: 'ms-tb-section' }, [
      createElement('h4', { className: 'ms-tb-section__title' }, ['Chart Background']),
      this._createColorField('backgroundColor', 'Background Color', this.config.backgroundColor),
      createElement('div', { className: 'ms-tb-field' }, [
        createElement('label', {}, [
          createElement('input', {
            type: 'checkbox',
            id: 'ms-tb-transparent-bg',
            checked: this.config.backgroundColor === 'transparent',
          }),
          ' Transparent',
        ]),
      ]),
    ]);

    panel.appendChild(bgSection);

    return panel;
  }

  /**
   * Helper: Create color field
   */
  _createColorField(name, label, value) {
    return createElement('div', { className: 'ms-tb-field ms-tb-field--color' }, [
      createElement('label', { className: 'ms-tb-field__label', for: `ms-tb-${name}` }, [label]),
      createElement('div', { className: 'ms-tb-field__input' }, [
        createElement('input', {
          type: 'color',
          className: 'ms-tb-color-picker',
          id: `ms-tb-${name}`,
          'data-field': name,
          value: value.startsWith('rgba') ? this._rgbaToHex(value) : value,
        }),
        createElement('input', {
          type: 'text',
          className: 'ms-input ms-tb-color-text',
          'data-field': name,
          value: value,
          placeholder: '#000000 or rgba()',
        }),
      ]),
    ]);
  }

  /**
   * Helper: Create number field
   */
  _createNumberField(name, label, value, min, max, unit = '') {
    return createElement('div', { className: 'ms-tb-field' }, [
      createElement('label', { className: 'ms-tb-field__label', for: `ms-tb-${name}` }, [label]),
      createElement('div', { className: 'ms-tb-field__input ms-tb-field__input--number' }, [
        createElement('input', {
          type: 'number',
          className: 'ms-input',
          id: `ms-tb-${name}`,
          'data-field': name,
          value: value,
          min: min,
          max: max,
        }),
        unit && createElement('span', { className: 'ms-tb-field__unit' }, [unit]),
      ]),
    ]);
  }

  /**
   * Helper: Create select field
   */
  _createSelectField(name, label, value, options) {
    return createElement('div', { className: 'ms-tb-field' }, [
      createElement('label', { className: 'ms-tb-field__label', for: `ms-tb-${name}` }, [label]),
      createElement(
        'select',
        {
          className: 'ms-select',
          id: `ms-tb-${name}`,
          'data-field': name,
        },
        options.map((opt) =>
          createElement('option', { value: opt.value, selected: opt.value === value }, [opt.label])
        )
      ),
    ]);
  }

  /**
   * Helper: Create checkbox field
   */
  _createCheckboxField(name, label, checked) {
    return createElement('div', { className: 'ms-tb-field ms-tb-field--checkbox' }, [
      createElement('label', {}, [
        createElement('input', {
          type: 'checkbox',
          id: `ms-tb-${name}`,
          'data-field': name,
          checked: checked,
        }),
        ` ${label}`,
      ]),
    ]);
  }

  /**
   * Convert rgba to hex (for color picker)
   */
  _rgbaToHex(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#333333';
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  _bindEvents() {
    // Tab switching
    this.container.addEventListener('click', (e) => {
      const tab = e.target.closest('.ms-theme-builder__tab');
      if (tab) {
        const tabId = tab.dataset.tab;
        this._switchTab(tabId);
      }

      // Preset selection
      const preset = e.target.closest('.ms-tb-preset');
      if (preset) {
        this._applyColorPreset(preset.dataset.preset);
      }

      // Add color button
      if (e.target.id === 'ms-tb-add-color' && this.config.colors.length < 12) {
        this.config.colors.push('#999999');
        this._renderColorPalette();
        this._notifyChange();
      }

      // Reset colors button
      if (e.target.id === 'ms-tb-reset-colors') {
        this.config.colors = [...defaultColorPalette];
        this._renderColorPalette();
        this._notifyChange();
      }

      // Remove color button
      if (e.target.classList.contains('ms-tb-color-remove')) {
        const index = parseInt(e.target.dataset.index);
        if (this.config.colors.length > 1) {
          this.config.colors.splice(index, 1);
          this._renderColorPalette();
          this._notifyChange();
        }
      }

      // Apply button
      if (e.target.id === 'ms-tb-apply') {
        this._applyTheme();
      }
    });

    // Color palette changes
    this.container.addEventListener('input', (e) => {
      // Color picker in palette
      if (e.target.classList.contains('ms-tb-color-input')) {
        const index = parseInt(e.target.dataset.index);
        this.config.colors[index] = e.target.value;
        this._renderColorPalette();
        this._notifyChange();
        return;
      }

      // Color picker fields
      if (e.target.classList.contains('ms-tb-color-picker')) {
        const field = e.target.dataset.field;
        this.config[field] = e.target.value;
        // Update text input
        const textInput = e.target.parentElement.querySelector('.ms-tb-color-text');
        if (textInput) textInput.value = e.target.value;
        this._notifyChange();
        return;
      }

      // Text color inputs
      if (e.target.classList.contains('ms-tb-color-text')) {
        const field = e.target.dataset.field;
        this.config[field] = e.target.value;
        // Update color picker
        const colorPicker = e.target.parentElement.querySelector('.ms-tb-color-picker');
        if (colorPicker && !e.target.value.startsWith('rgba')) {
          try {
            colorPicker.value = e.target.value;
          } catch (err) {
            // Invalid color format
          }
        }
        this._notifyChange();
        return;
      }

      // General field changes
      const field = e.target.dataset.field;
      if (field) {
        if (e.target.type === 'checkbox') {
          this.config[field] = e.target.checked;
        } else if (e.target.type === 'number') {
          this.config[field] = parseInt(e.target.value) || 0;
        } else {
          this.config[field] = e.target.value;
        }
        this._notifyChange();
      }
    });

    // Preset theme selector
    const presetSelect = document.getElementById('ms-tb-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          this._loadPresetTheme(e.target.value);
        }
      });
    }

    // Transparent background checkbox
    this.container.addEventListener('change', (e) => {
      if (e.target.id === 'ms-tb-transparent-bg') {
        if (e.target.checked) {
          this.config.backgroundColor = 'transparent';
        } else {
          this.config.backgroundColor = '#ffffff';
        }
        // Update color field
        const bgInput = document.getElementById('ms-tb-backgroundColor');
        const bgText = this.container.querySelector('[data-field="backgroundColor"].ms-tb-color-text');
        if (bgInput) bgInput.value = this.config.backgroundColor === 'transparent' ? '#ffffff' : this.config.backgroundColor;
        if (bgText) bgText.value = this.config.backgroundColor;
        this._notifyChange();
      }
    });
  }

  _switchTab(tabId) {
    // Update tab buttons
    this.container.querySelectorAll('.ms-theme-builder__tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });

    // Update panels
    this.container.querySelectorAll('.ms-theme-builder__panel').forEach((p) => {
      p.classList.toggle('active', p.dataset.panel === tabId);
    });

    this.activeTab = tabId;
  }

  _applyColorPreset(presetName) {
    const presets = {
      Default: defaultColorPalette,
      Warm: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
      Cool: ['#3fb1e3', '#6be6c1', '#626c91', '#a0a7e6', '#c4ebad', '#96dee8', '#5470c6', '#91cc75'],
      Pastel: ['#fc97af', '#87f7cf', '#f7f494', '#72ccff', '#f7c5a0', '#d4a4eb', '#d2f5a6', '#76f2f2'],
      Earth: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4', '#d87c7c', '#919e8b'],
      Ocean: ['#516b91', '#59c4e6', '#edafda', '#93b7e3', '#a5e7f0', '#cbb0e3', '#3fb1e3', '#6be6c1'],
      Sunset: ['#ff715e', '#ffaf51', '#ffee51', '#f5e8c8', '#f3d999', '#e098c7', '#8c6ac4', '#715c87'],
      Forest: ['#4ea397', '#22c3aa', '#7bd9a5', '#3ba272', '#91cc75', '#c4ebad', '#d2f5a6', '#ebdba4'],
    };

    if (presets[presetName]) {
      this.config.colors = [...presets[presetName]];
      this._renderColorPalette();
      this._notifyChange();
    }
  }

  _loadPresetTheme(themeName) {
    const themeDef = getThemeDefinition(themeName);
    if (!themeDef) return;

    // Map theme definition to config
    this.config.colors = themeDef.color ? [...themeDef.color] : [...defaultColorPalette];
    this.config.backgroundColor = themeDef.backgroundColor || 'transparent';
    this.config.textColor = themeDef.textStyle?.color || '#333333';
    this.config.titleColor = themeDef.title?.textStyle?.color || '#333333';
    this.config.subtitleColor = themeDef.title?.subtextStyle?.color || '#aaaaaa';
    this.config.legendTextColor = themeDef.legend?.textStyle?.color || '#333333';
    this.config.tooltipBgColor = themeDef.tooltip?.backgroundColor || 'rgba(50,50,50,0.7)';
    this.config.tooltipBorderColor = themeDef.tooltip?.borderColor || '#333333';
    this.config.tooltipTextColor = themeDef.tooltip?.textStyle?.color || '#ffffff';
    this.config.axisLineShow = themeDef.categoryAxis?.axisLine?.show !== false;
    this.config.axisLineColor = themeDef.categoryAxis?.axisLine?.lineStyle?.color || '#333333';
    this.config.axisTickShow = themeDef.categoryAxis?.axisTick?.show !== false;
    this.config.axisLabelColor = themeDef.categoryAxis?.axisLabel?.color || '#333333';
    this.config.splitLineShow = themeDef.valueAxis?.splitLine?.show !== false;
    this.config.splitLineColor = Array.isArray(themeDef.valueAxis?.splitLine?.lineStyle?.color)
      ? themeDef.valueAxis.splitLine.lineStyle.color[0]
      : themeDef.valueAxis?.splitLine?.lineStyle?.color || '#eeeeee';
    this.config.splitAreaShow = themeDef.categoryAxis?.splitArea?.show || false;

    // Update all UI fields
    this._updateAllFields();
    this._notifyChange();
  }

  _updateAllFields() {
    // Update color palette
    this._renderColorPalette();

    // Update all other fields
    Object.keys(this.config).forEach((key) => {
      if (key === 'colors') return;

      const input = document.getElementById(`ms-tb-${key}`);
      if (!input) return;

      if (input.type === 'checkbox') {
        input.checked = this.config[key];
      } else if (input.type === 'color') {
        const value = this.config[key];
        input.value = value.startsWith('rgba') ? this._rgbaToHex(value) : value;
        // Also update text input
        const textInput = input.parentElement?.querySelector('.ms-tb-color-text');
        if (textInput) textInput.value = value;
      } else {
        input.value = this.config[key];
      }
    });

    // Update transparent checkbox
    const transparentCb = document.getElementById('ms-tb-transparent-bg');
    if (transparentCb) {
      transparentCb.checked = this.config.backgroundColor === 'transparent';
    }
  }

  _notifyChange() {
    this.options.onChange(this.config);
  }

  _applyTheme() {
    // Create theme object from config
    const themeName = registerCustomTheme(this.config);
    this.customThemeName = themeName;

    // Notify parent to apply theme
    this.options.onApply(themeName, this.config);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config) {
    this.config = { ...defaultConfig, ...config };
    this._updateAllFields();
  }

  /**
   * Get the generated theme object
   */
  getTheme() {
    return createCustomTheme(this.config);
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

export default ThemeBuilder;
