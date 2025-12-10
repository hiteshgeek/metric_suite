/**
 * ColorPalette Component
 * Manages color palettes with CRUD operations and selection UI
 */

import { createElement } from '../Graph/utils.js';

export class ColorPalette {
  constructor(container, options = {}) {
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('ColorPalette: Container element not found');
    }

    this.options = {
      apiEndpoint: options.apiEndpoint || '/api/colors.php',
      onSelect: options.onSelect || null,
      onColorsChange: options.onColorsChange || null,
      showManager: options.showManager !== false,
      allowCustom: options.allowCustom !== false,
      maxColors: options.maxColors || 12,
      ...options,
    };

    this.palettes = [];
    this.selectedPalette = null;
    this.customColors = [];
    this.isLoading = false;
    this.isEditMode = false;

    this._init();
  }

  async _init() {
    this.container.innerHTML = '';
    this.container.className = 'ms-color-palette';

    await this._loadPalettes();
    this._render();
    // Apply initial colors
    this._notifyChange();
  }

  async _loadPalettes() {
    this.isLoading = true;
    try {
      const response = await fetch(this.options.apiEndpoint);
      const result = await response.json();

      if (result.success) {
        this.palettes = result.palettes || [];
        this.selectedPalette = this.palettes.find((p) => p.is_default) || this.palettes[0] || null;
      }
    } catch (error) {
      console.error('Failed to load color palettes:', error);
      this.palettes = [
        {
          id: 0,
          name: 'Default',
          colors: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'],
          is_default: true,
          is_system: true,
        },
      ];
      this.selectedPalette = this.palettes[0];
    }
    this.isLoading = false;
  }

  _render() {
    this.container.innerHTML = '';

    // Header with label and edit toggle
    const header = this._createHeader();
    this.container.appendChild(header);

    // Palette list (clickable items)
    const paletteList = this._createPaletteList();
    this.container.appendChild(paletteList);

    // Color preview (always visible)
    const preview = this._createColorPreview();
    this.container.appendChild(preview);

    // Edit controls (only visible in edit mode)
    if (this.isEditMode && this.options.showManager) {
      const editControls = this._createEditControls();
      this.container.appendChild(editControls);
    }
  }

  _createHeader() {
    const header = createElement('div', { className: 'ms-color-palette__header' });

    const label = createElement('span', { className: 'ms-color-palette__label' }, ['Colors']);

    const editBtn = createElement(
      'button',
      {
        className: `ms-btn ms-btn--sm ${this.isEditMode ? 'ms-btn--primary' : 'ms-btn--outline'}`,
        type: 'button',
        title: this.isEditMode ? 'Done editing' : 'Edit colors',
      },
      [this.isEditMode ? 'Done' : 'Edit']
    );

    editBtn.addEventListener('click', () => {
      this.isEditMode = !this.isEditMode;
      this._render();
    });

    header.appendChild(label);
    header.appendChild(editBtn);

    return header;
  }

  _createPaletteList() {
    const wrapper = createElement('div', { className: 'ms-color-palette__list' });

    this.palettes.forEach((palette) => {
      const item = this._createPaletteItem(palette);
      wrapper.appendChild(item);
    });

    return wrapper;
  }

  _createPaletteItem(palette) {
    const isSelected = this.selectedPalette?.id === palette.id;

    const item = createElement('div', {
      className: `ms-color-palette__item ${isSelected ? 'is-selected' : ''}`,
      title: palette.description || palette.name,
    });

    // Palette name
    const name = createElement('span', { className: 'ms-color-palette__item-name' }, [palette.name]);

    // Mini color swatches preview
    const swatches = createElement('div', { className: 'ms-color-palette__item-colors' });
    const previewColors = palette.colors.slice(0, 6);
    previewColors.forEach((color) => {
      const mini = createElement('span', {
        className: 'ms-color-palette__mini-swatch',
        style: { backgroundColor: color },
      });
      swatches.appendChild(mini);
    });
    if (palette.colors.length > 6) {
      const more = createElement('span', { className: 'ms-color-palette__more' }, [
        `+${palette.colors.length - 6}`,
      ]);
      swatches.appendChild(more);
    }

    // Click to select and apply immediately
    item.addEventListener('click', () => {
      this.selectedPalette = palette;
      this.customColors = [];
      this._render();
      this._notifyChange();
    });

    item.appendChild(name);
    item.appendChild(swatches);

    return item;
  }

  _createColorPreview() {
    const wrapper = createElement('div', {
      className: `ms-color-palette__preview ${this.isEditMode ? 'is-editable' : ''}`,
    });

    const colors = this.selectedPalette?.colors || this.customColors || [];

    colors.forEach((color, index) => {
      const swatch = this._createColorSwatch(color, index);
      wrapper.appendChild(swatch);
    });

    // Add color button (only in edit mode)
    if (this.isEditMode && this.options.allowCustom && colors.length < this.options.maxColors) {
      const addBtn = createElement(
        'button',
        {
          className: 'ms-color-palette__add',
          title: 'Add color',
          type: 'button',
        },
        ['+']
      );

      addBtn.addEventListener('click', () => {
        this._addColor();
      });

      wrapper.appendChild(addBtn);
    }

    return wrapper;
  }

  _createColorSwatch(color, index) {
    const swatch = createElement('div', {
      className: 'ms-color-palette__swatch',
      style: { backgroundColor: color },
      title: color,
    });

    if (this.isEditMode) {
      // Color input (hidden, triggered by click)
      const input = createElement('input', {
        type: 'color',
        className: 'ms-color-palette__input',
        value: color,
      });

      input.addEventListener('input', (e) => {
        this._updateColor(index, e.target.value);
        swatch.style.backgroundColor = e.target.value;
        swatch.title = e.target.value;
      });

      swatch.addEventListener('click', () => {
        input.click();
      });

      // Remove button
      const removeBtn = createElement(
        'button',
        {
          className: 'ms-color-palette__remove',
          title: 'Remove color',
          type: 'button',
        },
        ['×']
      );

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeColor(index);
      });

      swatch.appendChild(removeBtn);
      swatch.appendChild(input);
    }

    return swatch;
  }

  _createEditControls() {
    const wrapper = createElement('div', { className: 'ms-color-palette__controls' });

    // Save as new palette button
    const saveBtn = createElement(
      'button',
      {
        className: 'ms-btn ms-btn--outline ms-btn--sm',
        type: 'button',
      },
      ['Save as New Palette']
    );

    saveBtn.addEventListener('click', () => {
      this._showSaveDialog();
    });

    // Set as default button
    if (this.selectedPalette) {
      const defaultBtn = createElement(
        'button',
        {
          className: 'ms-btn ms-btn--outline ms-btn--sm',
          type: 'button',
        },
        [this.selectedPalette.is_default ? 'Default' : 'Set as Default']
      );

      if (this.selectedPalette.is_default) {
        defaultBtn.disabled = true;
      }

      defaultBtn.addEventListener('click', () => {
        if (this.selectedPalette && !this.selectedPalette.is_default) {
          this._setDefault(this.selectedPalette.id);
        }
      });

      wrapper.appendChild(defaultBtn);
    }

    wrapper.appendChild(saveBtn);

    return wrapper;
  }

  _updateColor(index, newColor) {
    // When editing, create a copy for custom colors
    if (!this.customColors.length) {
      this.customColors = this.selectedPalette?.colors?.slice() || [];
    }
    this.customColors[index] = newColor;
    this.selectedPalette = null;
    this._notifyChange();
  }

  _addColor() {
    const newColor = '#6366f1';

    if (!this.customColors.length) {
      this.customColors = this.selectedPalette?.colors?.slice() || [];
    }
    this.customColors.push(newColor);
    this.selectedPalette = null;

    this._render();
    this._notifyChange();
  }

  _removeColor(index) {
    if (!this.customColors.length) {
      this.customColors = this.selectedPalette?.colors?.slice() || [];
    }
    this.customColors.splice(index, 1);
    this.selectedPalette = null;

    this._render();
    this._notifyChange();
  }

  _notifyChange() {
    const colors = this.getColors();
    if (this.options.onColorsChange) {
      this.options.onColorsChange(colors);
    }
    if (this.options.onSelect) {
      this.options.onSelect(colors, this.selectedPalette);
    }
  }

  async _showSaveDialog() {
    const name = prompt('Enter palette name:');
    if (!name || !name.trim()) return;

    const description = prompt('Enter description (optional):') || '';

    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          colors: this.getColors(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Palette saved successfully!');
        await this._loadPalettes();
        this.selectedPalette = this.palettes.find((p) => p.id === result.id) || this.selectedPalette;
        this.customColors = [];
        this._render();
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to save palette: ' + error.message);
    }
  }

  async _setDefault(paletteId) {
    try {
      const response = await fetch(`${this.options.apiEndpoint}?setDefault=${paletteId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        this.palettes.forEach((p) => {
          p.is_default = p.id === paletteId ? 1 : 0;
        });
        this._render();
      } else {
        alert('Failed to set default: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to set default: ' + error.message);
    }
  }

  getColors() {
    return this.customColors.length > 0
      ? this.customColors
      : this.selectedPalette?.colors || [];
  }

  setColors(colors) {
    this.customColors = colors.slice();
    this.selectedPalette = null;
    this._render();
  }

  async selectPalette(paletteId) {
    this.selectedPalette = this.palettes.find((p) => p.id === paletteId) || null;
    this.customColors = [];
    this._render();
    this._notifyChange();
  }

  async refresh() {
    await this._loadPalettes();
    this._render();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default ColorPalette;
