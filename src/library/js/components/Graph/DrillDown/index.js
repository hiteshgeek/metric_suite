/**
 * DrillDown - Chart drill-down navigation and interaction handler
 * Enables click-to-filter functionality on charts
 */

import { createElement } from '../utils.js';

export default class DrillDown {
  constructor(options = {}) {
    this.options = {
      chart: null, // ECharts instance
      onDrillDown: null, // Callback when drilling down
      onDrillUp: null, // Callback when drilling up
      onPathChange: null, // Callback when path changes
      maxDepth: 5, // Maximum drill-down depth
      ...options,
    };

    // Drill-down state
    this.path = []; // Array of {level, filter, label}
    this.originalData = null;
    this.currentData = null;

    // Breadcrumb container
    this.breadcrumbContainer = null;

    this.init();
  }

  init() {
    if (this.options.chart) {
      this.attachChartListeners();
    }
  }

  /**
   * Attach click listeners to the chart
   */
  attachChartListeners() {
    const chart = this.options.chart;

    chart.on('click', (params) => {
      this.handleChartClick(params);
    });

    // Right-click to go back
    chart.getZr().on('contextmenu', (e) => {
      e.event.preventDefault();
      this.drillUp();
    });
  }

  /**
   * Handle chart element click
   */
  handleChartClick(params) {
    // Check if we can drill down further
    if (this.path.length >= this.options.maxDepth) {
      console.warn('Maximum drill-down depth reached');
      return;
    }

    // Build filter from click
    const filter = this.buildFilterFromClick(params);
    if (!filter) return;

    // Add to path
    this.path.push({
      level: this.path.length,
      filter,
      label: params.name || params.seriesName || 'Detail',
      params,
    });

    // Notify callbacks
    if (this.options.onDrillDown) {
      this.options.onDrillDown({
        path: [...this.path],
        filter,
        params,
      });
    }

    if (this.options.onPathChange) {
      this.options.onPathChange([...this.path]);
    }

    // Update breadcrumb
    this.updateBreadcrumb();
  }

  /**
   * Build filter object from chart click params
   */
  buildFilterFromClick(params) {
    const filter = {
      type: params.componentType,
      seriesType: params.seriesType,
      seriesIndex: params.seriesIndex,
      seriesName: params.seriesName,
      dataIndex: params.dataIndex,
      name: params.name,
      value: params.value,
      data: params.data,
    };

    // Add specific filters based on chart type
    switch (params.seriesType) {
      case 'bar':
      case 'line':
        if (params.name) {
          filter.column = 'category'; // Assuming x-axis is category
          filter.operator = '=';
          filter.filterValue = params.name;
        }
        break;

      case 'pie':
        if (params.data && params.data.name) {
          filter.column = 'category';
          filter.operator = '=';
          filter.filterValue = params.data.name;
        }
        break;

      case 'scatter':
        if (Array.isArray(params.value)) {
          filter.column = 'x';
          filter.operator = '=';
          filter.filterValue = params.value[0];
          filter.additionalFilters = [{
            column: 'y',
            operator: '=',
            filterValue: params.value[1],
          }];
        }
        break;

      case 'heatmap':
        if (Array.isArray(params.value)) {
          filter.xIndex = params.value[0];
          filter.yIndex = params.value[1];
        }
        break;

      case 'funnel':
        if (params.data && params.data.name) {
          filter.column = 'stage';
          filter.operator = '=';
          filter.filterValue = params.data.name;
        }
        break;

      default:
        // Generic filter
        if (params.name) {
          filter.column = 'name';
          filter.operator = '=';
          filter.filterValue = params.name;
        }
    }

    return filter;
  }

  /**
   * Drill up one level
   */
  drillUp() {
    if (this.path.length === 0) return;

    const removed = this.path.pop();

    // Notify callbacks
    if (this.options.onDrillUp) {
      this.options.onDrillUp({
        path: [...this.path],
        removed,
      });
    }

    if (this.options.onPathChange) {
      this.options.onPathChange([...this.path]);
    }

    // Update breadcrumb
    this.updateBreadcrumb();
  }

  /**
   * Drill up to a specific level
   */
  drillUpTo(level) {
    while (this.path.length > level) {
      this.path.pop();
    }

    if (this.options.onPathChange) {
      this.options.onPathChange([...this.path]);
    }

    this.updateBreadcrumb();
  }

  /**
   * Reset to root level
   */
  reset() {
    this.path = [];
    this.currentData = this.originalData;

    if (this.options.onPathChange) {
      this.options.onPathChange([]);
    }

    this.updateBreadcrumb();
  }

  /**
   * Set the breadcrumb container
   */
  setBreadcrumbContainer(container) {
    this.breadcrumbContainer = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.updateBreadcrumb();
  }

  /**
   * Update breadcrumb UI
   */
  updateBreadcrumb() {
    if (!this.breadcrumbContainer) return;

    this.breadcrumbContainer.innerHTML = '';
    this.breadcrumbContainer.className = 'ms-drilldown-breadcrumb';

    // Root item
    const rootItem = createElement('span', {
      className: `ms-drilldown-item ${this.path.length === 0 ? 'active' : 'clickable'}`,
    });
    rootItem.innerHTML = '<i class="fas fa-home"></i> Root';

    if (this.path.length > 0) {
      rootItem.addEventListener('click', () => this.reset());
    }

    this.breadcrumbContainer.appendChild(rootItem);

    // Path items
    this.path.forEach((item, index) => {
      // Separator
      const separator = createElement('span', { className: 'ms-drilldown-separator' });
      separator.innerHTML = '<i class="fas fa-chevron-right"></i>';
      this.breadcrumbContainer.appendChild(separator);

      // Item
      const pathItem = createElement('span', {
        className: `ms-drilldown-item ${index === this.path.length - 1 ? 'active' : 'clickable'}`,
      });
      pathItem.textContent = item.label;

      if (index < this.path.length - 1) {
        pathItem.addEventListener('click', () => this.drillUpTo(index + 1));
      }

      this.breadcrumbContainer.appendChild(pathItem);
    });

    // Back button if not at root
    if (this.path.length > 0) {
      const backBtn = createElement('button', {
        className: 'ms-btn ms-btn-icon ms-drilldown-back',
        title: 'Go back (or right-click chart)',
      });
      backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
      backBtn.addEventListener('click', () => this.drillUp());
      this.breadcrumbContainer.insertBefore(backBtn, this.breadcrumbContainer.firstChild);
    }
  }

  /**
   * Get current drill-down path
   */
  getPath() {
    return [...this.path];
  }

  /**
   * Get current depth
   */
  getDepth() {
    return this.path.length;
  }

  /**
   * Check if at root level
   */
  isAtRoot() {
    return this.path.length === 0;
  }

  /**
   * Get filters for current path (for query building)
   */
  getFilters() {
    return this.path.map(item => item.filter).filter(f => f);
  }

  /**
   * Build SQL WHERE clause from current path
   */
  buildWhereClause() {
    const filters = this.getFilters();
    if (filters.length === 0) return '';

    const conditions = [];

    filters.forEach(filter => {
      if (filter.column && filter.filterValue !== undefined) {
        const value = typeof filter.filterValue === 'string'
          ? `'${filter.filterValue.replace(/'/g, "''")}'`
          : filter.filterValue;
        conditions.push(`${filter.column} ${filter.operator || '='} ${value}`);
      }

      // Additional filters (like for scatter plots)
      if (filter.additionalFilters) {
        filter.additionalFilters.forEach(af => {
          const value = typeof af.filterValue === 'string'
            ? `'${af.filterValue.replace(/'/g, "''")}'`
            : af.filterValue;
          conditions.push(`${af.column} ${af.operator || '='} ${value}`);
        });
      }
    });

    return conditions.length > 0 ? conditions.join(' AND ') : '';
  }

  /**
   * Set chart instance
   */
  setChart(chart) {
    this.options.chart = chart;
    this.attachChartListeners();
  }

  /**
   * Store original data for reference
   */
  setOriginalData(data) {
    this.originalData = data;
    this.currentData = data;
  }

  /**
   * Update current data (after filtering)
   */
  setCurrentData(data) {
    this.currentData = data;
  }

  /**
   * Create standalone breadcrumb component
   */
  static createBreadcrumb(container, drillDown) {
    drillDown.setBreadcrumbContainer(container);
    return drillDown;
  }

  destroy() {
    if (this.breadcrumbContainer) {
      this.breadcrumbContainer.innerHTML = '';
    }
    this.path = [];
    this.originalData = null;
    this.currentData = null;
  }
}
