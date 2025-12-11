/**
 * Dashboard Layout System
 * Grid-based layout for arranging widgets on a dashboard
 */

import { WIDGET_TYPES } from './constants.js';
import { Widget, WidgetFactory } from './index.js';
import { generateId, debounce } from '../Graph/utils.js';

/**
 * Default dashboard configuration
 */
export const DEFAULT_DASHBOARD_CONFIG = {
  id: null,
  name: 'Untitled Dashboard',
  description: '',
  columns: 12,
  rowHeight: 80,
  gap: 16,
  margin: 16,
  widgets: [],
  globalFilters: [],
  theme: 'light',
  refreshInterval: 0,
  editable: false,
};

/**
 * Dashboard Layout class
 */
export class DashboardLayout {
  constructor(container, config = {}) {
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('DashboardLayout: Container element not found');
    }

    this.id = config.id || generateId('dashboard');
    this.config = { ...DEFAULT_DASHBOARD_CONFIG, ...config };
    this.widgets = new Map(); // Widget instances
    this.widgetElements = new Map(); // DOM elements

    // Drag and resize state
    this.dragState = null;
    this.resizeState = null;

    // Selection state (for edit mode)
    this.selectedWidget = null;

    this._init();
  }

  _init() {
    this.container.className = 'ms-dashboard';
    this.container.id = this.id;

    if (this.config.editable) {
      this.container.classList.add('ms-dashboard--editable');
    }

    this._createLayout();
    this._renderWidgets();
    this._bindEvents();

    // Setup global refresh if configured
    if (this.config.refreshInterval > 0) {
      this._setupGlobalRefresh();
    }
  }

  _createLayout() {
    // Calculate container styles
    const { columns, rowHeight, gap, margin } = this.config;

    this.container.innerHTML = `
      <div class="ms-dashboard__header">
        <div class="ms-dashboard__title-group">
          <h1 class="ms-dashboard__title">${this.config.name}</h1>
          ${this.config.description ? `<p class="ms-dashboard__description">${this.config.description}</p>` : ''}
        </div>
        ${this.config.editable ? `
          <div class="ms-dashboard__actions">
            <button class="ms-btn ms-btn--outline" id="${this.id}-add-widget">
              <i class="fa-solid fa-plus"></i> Add Widget
            </button>
            <button class="ms-btn ms-btn--primary" id="${this.id}-save">
              <i class="fa-solid fa-save"></i> Save
            </button>
          </div>
        ` : ''}
      </div>
      ${this.config.globalFilters.length > 0 ? `
        <div class="ms-dashboard__filters" id="${this.id}-filters"></div>
      ` : ''}
      <div class="ms-dashboard__grid" id="${this.id}-grid" style="
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        grid-auto-rows: ${rowHeight}px;
        gap: ${gap}px;
        padding: ${margin}px;
      "></div>
    `;

    this.gridElement = document.getElementById(`${this.id}-grid`);
  }

  _renderWidgets() {
    // Clear existing widgets
    this.widgets.forEach(widget => widget.destroy?.());
    this.widgets.clear();
    this.widgetElements.clear();

    // Render each widget
    this.config.widgets.forEach(widgetConfig => {
      this._addWidget(widgetConfig);
    });
  }

  _addWidget(widgetConfig) {
    const { layout } = widgetConfig;

    // Create widget container
    const widgetEl = document.createElement('div');
    widgetEl.className = 'ms-dashboard__widget';
    widgetEl.id = widgetConfig.id || generateId('widget');
    widgetEl.style.gridColumn = `${layout.x + 1} / span ${layout.w}`;
    widgetEl.style.gridRow = `${layout.y + 1} / span ${layout.h}`;

    // Add edit controls if editable
    if (this.config.editable) {
      widgetEl.innerHTML = `
        <div class="ms-dashboard__widget-controls">
          <button class="ms-dashboard__widget-btn" data-action="move" title="Move">
            <i class="fa-solid fa-grip-vertical"></i>
          </button>
          <button class="ms-dashboard__widget-btn" data-action="edit" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="ms-dashboard__widget-btn ms-dashboard__widget-btn--danger" data-action="delete" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <div class="ms-dashboard__widget-content"></div>
        <div class="ms-dashboard__widget-resize" data-action="resize">
          <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
        </div>
      `;
    } else {
      widgetEl.innerHTML = `<div class="ms-dashboard__widget-content"></div>`;
    }

    this.gridElement.appendChild(widgetEl);
    this.widgetElements.set(widgetEl.id, widgetEl);

    // Create widget instance
    const contentEl = widgetEl.querySelector('.ms-dashboard__widget-content');
    try {
      const widget = WidgetFactory.create(contentEl, widgetConfig);
      this.widgets.set(widgetEl.id, widget);

      // Load data if query is configured
      if (widgetConfig.query?.source) {
        widget.loadData();
      } else {
        widget.render();
      }
    } catch (error) {
      console.error(`Failed to create widget ${widgetConfig.type}:`, error);
      contentEl.innerHTML = `
        <div class="ms-widget__error">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>Failed to load widget</span>
        </div>
      `;
    }

    return widgetEl.id;
  }

  _bindEvents() {
    // Edit mode events
    if (this.config.editable) {
      this._bindEditEvents();
    }

    // Resize observer for responsive layout
    this._resizeObserver = new ResizeObserver(debounce(() => {
      this._adjustLayout();
    }, 100));
    this._resizeObserver.observe(this.container);
  }

  _bindEditEvents() {
    // Widget action buttons
    this.gridElement.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      const widgetEl = actionBtn.closest('.ms-dashboard__widget');
      if (!widgetEl) return;

      const action = actionBtn.dataset.action;

      switch (action) {
        case 'edit':
          this._editWidget(widgetEl.id);
          break;
        case 'delete':
          this._deleteWidget(widgetEl.id);
          break;
      }
    });

    // Drag to move
    this.gridElement.addEventListener('mousedown', (e) => {
      const moveBtn = e.target.closest('[data-action="move"]');
      if (!moveBtn) return;

      const widgetEl = moveBtn.closest('.ms-dashboard__widget');
      if (!widgetEl) return;

      this._startDrag(widgetEl, e);
    });

    // Resize
    this.gridElement.addEventListener('mousedown', (e) => {
      const resizeHandle = e.target.closest('[data-action="resize"]');
      if (!resizeHandle) return;

      const widgetEl = resizeHandle.closest('.ms-dashboard__widget');
      if (!widgetEl) return;

      this._startResize(widgetEl, e);
    });

    // Add widget button
    document.getElementById(`${this.id}-add-widget`)?.addEventListener('click', () => {
      this._showAddWidgetModal();
    });

    // Save button
    document.getElementById(`${this.id}-save`)?.addEventListener('click', () => {
      this._saveDashboard();
    });
  }

  _startDrag(widgetEl, e) {
    e.preventDefault();

    const rect = widgetEl.getBoundingClientRect();
    const gridRect = this.gridElement.getBoundingClientRect();

    this.dragState = {
      widgetEl,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      gridRect,
    };

    widgetEl.classList.add('is-dragging');

    // Create placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'ms-dashboard__placeholder';
    placeholder.style.gridColumn = widgetEl.style.gridColumn;
    placeholder.style.gridRow = widgetEl.style.gridRow;
    this.gridElement.appendChild(placeholder);
    this.dragState.placeholder = placeholder;

    // Switch to absolute positioning for smooth dragging
    widgetEl.style.position = 'fixed';
    widgetEl.style.left = `${rect.left}px`;
    widgetEl.style.top = `${rect.top}px`;
    widgetEl.style.width = `${rect.width}px`;
    widgetEl.style.height = `${rect.height}px`;
    widgetEl.style.zIndex = '1000';

    const onMouseMove = (e) => this._onDrag(e);
    const onMouseUp = () => this._endDrag();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });

    this.dragState.onMouseMove = onMouseMove;
  }

  _onDrag(e) {
    if (!this.dragState) return;

    const { widgetEl, offsetX, offsetY, gridRect, placeholder } = this.dragState;

    // Update widget position
    widgetEl.style.left = `${e.clientX - offsetX}px`;
    widgetEl.style.top = `${e.clientY - offsetY}px`;

    // Calculate grid position
    const cellWidth = (gridRect.width - (this.config.columns - 1) * this.config.gap) / this.config.columns;
    const cellHeight = this.config.rowHeight + this.config.gap;

    const relX = e.clientX - gridRect.left;
    const relY = e.clientY - gridRect.top;

    const gridX = Math.max(0, Math.min(this.config.columns - 1, Math.floor(relX / cellWidth)));
    const gridY = Math.max(0, Math.floor(relY / cellHeight));

    // Update placeholder
    const currentW = parseInt(placeholder.style.gridColumn.split(' ')[2]) || 1;
    const currentH = parseInt(placeholder.style.gridRow.split(' ')[2]) || 1;

    placeholder.style.gridColumn = `${gridX + 1} / span ${currentW}`;
    placeholder.style.gridRow = `${gridY + 1} / span ${currentH}`;
  }

  _endDrag() {
    if (!this.dragState) return;

    const { widgetEl, placeholder, onMouseMove } = this.dragState;

    document.removeEventListener('mousemove', onMouseMove);

    // Apply new position
    widgetEl.style.gridColumn = placeholder.style.gridColumn;
    widgetEl.style.gridRow = placeholder.style.gridRow;

    // Reset styles
    widgetEl.style.position = '';
    widgetEl.style.left = '';
    widgetEl.style.top = '';
    widgetEl.style.width = '';
    widgetEl.style.height = '';
    widgetEl.style.zIndex = '';
    widgetEl.classList.remove('is-dragging');

    // Remove placeholder
    placeholder.remove();

    // Update config
    this._updateWidgetLayout(widgetEl.id);

    this.dragState = null;
  }

  _startResize(widgetEl, e) {
    e.preventDefault();

    const rect = widgetEl.getBoundingClientRect();

    this.resizeState = {
      widgetEl,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    };

    widgetEl.classList.add('is-resizing');

    const onMouseMove = (e) => this._onResize(e);
    const onMouseUp = () => this._endResize();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });

    this.resizeState.onMouseMove = onMouseMove;
  }

  _onResize(e) {
    if (!this.resizeState) return;

    const { widgetEl, startX, startY, startWidth, startHeight } = this.resizeState;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const gridRect = this.gridElement.getBoundingClientRect();
    const cellWidth = (gridRect.width - (this.config.columns - 1) * this.config.gap) / this.config.columns;
    const cellHeight = this.config.rowHeight;

    const newW = Math.max(1, Math.round((startWidth + deltaX) / cellWidth));
    const newH = Math.max(1, Math.round((startHeight + deltaY) / cellHeight));

    const currentX = parseInt(widgetEl.style.gridColumn.split(' ')[0]) || 1;
    const currentY = parseInt(widgetEl.style.gridRow.split(' ')[0]) || 1;

    widgetEl.style.gridColumn = `${currentX} / span ${newW}`;
    widgetEl.style.gridRow = `${currentY} / span ${newH}`;
  }

  _endResize() {
    if (!this.resizeState) return;

    const { widgetEl, onMouseMove } = this.resizeState;

    document.removeEventListener('mousemove', onMouseMove);

    widgetEl.classList.remove('is-resizing');

    // Update config
    this._updateWidgetLayout(widgetEl.id);

    // Resize widget content
    const widget = this.widgets.get(widgetEl.id);
    if (widget?.resize) {
      widget.resize();
    }

    this.resizeState = null;
  }

  _updateWidgetLayout(widgetId) {
    const widgetEl = this.widgetElements.get(widgetId);
    if (!widgetEl) return;

    const gridCol = widgetEl.style.gridColumn;
    const gridRow = widgetEl.style.gridRow;

    const colMatch = gridCol.match(/(\d+)\s*\/\s*span\s*(\d+)/);
    const rowMatch = gridRow.match(/(\d+)\s*\/\s*span\s*(\d+)/);

    if (colMatch && rowMatch) {
      const x = parseInt(colMatch[1]) - 1;
      const w = parseInt(colMatch[2]);
      const y = parseInt(rowMatch[1]) - 1;
      const h = parseInt(rowMatch[2]);

      // Find and update config
      const widgetConfig = this.config.widgets.find(w => w.id === widgetId);
      if (widgetConfig) {
        widgetConfig.layout = { ...widgetConfig.layout, x, y, w, h };
      }
    }
  }

  _editWidget(widgetId) {
    this.selectedWidget = widgetId;
    // Emit event or show modal
    this.container.dispatchEvent(new CustomEvent('widget:edit', {
      detail: { widgetId, config: this.config.widgets.find(w => w.id === widgetId) },
    }));
  }

  _deleteWidget(widgetId) {
    if (!confirm('Are you sure you want to delete this widget?')) return;

    // Remove from DOM
    const widgetEl = this.widgetElements.get(widgetId);
    if (widgetEl) {
      widgetEl.remove();
    }

    // Destroy widget instance
    const widget = this.widgets.get(widgetId);
    if (widget?.destroy) {
      widget.destroy();
    }

    // Remove from maps
    this.widgets.delete(widgetId);
    this.widgetElements.delete(widgetId);

    // Remove from config
    this.config.widgets = this.config.widgets.filter(w => w.id !== widgetId);
  }

  _showAddWidgetModal() {
    // Emit event to show widget picker
    this.container.dispatchEvent(new CustomEvent('widget:add', {
      detail: { dashboard: this },
    }));
  }

  _saveDashboard() {
    this.container.dispatchEvent(new CustomEvent('dashboard:save', {
      detail: { config: this.getConfig() },
    }));
  }

  _adjustLayout() {
    // Adjust for responsive layout
    const width = this.container.offsetWidth;

    if (width < 768) {
      this.gridElement.style.gridTemplateColumns = 'repeat(4, 1fr)';
    } else if (width < 1024) {
      this.gridElement.style.gridTemplateColumns = 'repeat(8, 1fr)';
    } else {
      this.gridElement.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
    }
  }

  _setupGlobalRefresh() {
    this.refreshTimer = setInterval(() => {
      this.widgets.forEach(widget => {
        if (widget.loadData) {
          widget.loadData();
        }
      });
    }, this.config.refreshInterval);
  }

  /**
   * Add a new widget to the dashboard
   */
  addWidget(widgetConfig) {
    // Auto-position if not specified
    if (!widgetConfig.layout) {
      widgetConfig.layout = this._findAvailablePosition(widgetConfig.layout?.w || 4, widgetConfig.layout?.h || 2);
    }

    widgetConfig.id = widgetConfig.id || generateId('widget');
    this.config.widgets.push(widgetConfig);

    return this._addWidget(widgetConfig);
  }

  _findAvailablePosition(w, h) {
    // Simple algorithm to find next available position
    const occupied = new Set();

    this.config.widgets.forEach(widget => {
      const { x, y, w: ww, h: hh } = widget.layout;
      for (let i = x; i < x + ww; i++) {
        for (let j = y; j < y + hh; j++) {
          occupied.add(`${i},${j}`);
        }
      }
    });

    // Find first available position
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= this.config.columns - w; x++) {
        let fits = true;
        for (let i = x; i < x + w && fits; i++) {
          for (let j = y; j < y + h && fits; j++) {
            if (occupied.has(`${i},${j}`)) {
              fits = false;
            }
          }
        }
        if (fits) {
          return { x, y, w, h };
        }
      }
    }

    return { x: 0, y: this.config.widgets.length, w, h };
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
   * Refresh all widgets
   */
  refresh() {
    this.widgets.forEach(widget => {
      if (widget.loadData) {
        widget.loadData();
      } else if (widget.render) {
        widget.render();
      }
    });
  }

  /**
   * Destroy dashboard and cleanup
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    this.widgets.forEach(widget => widget.destroy?.());
    this.widgets.clear();
    this.widgetElements.clear();

    this.container.innerHTML = '';
  }
}

export default DashboardLayout;
