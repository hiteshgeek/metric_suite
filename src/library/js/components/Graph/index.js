/**
 * Graph Component
 * ECharts wrapper with responsive handling and configuration management
 */

import * as echarts from 'echarts';
import { deepMerge, debounce, generateId } from './utils.js';
import { getChartConfig } from './types/index.js';

export class Graph {
  constructor(container, options = {}) {
    // Resolve container
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('Graph: Container element not found');
    }

    // Generate ID if not present
    if (!this.container.id) {
      this.container.id = generateId('graph');
    }

    // Initialize options
    this.options = {
      type: 'bar',
      title: '',
      data: [],
      xAxis: { data: [] },
      yAxis: {},
      theme: null,
      animation: true,
      ...options,
    };

    // Initialize ECharts
    this.chart = echarts.init(this.container, this.options.theme);

    // Apply initial configuration
    this._applyConfig();

    // Setup resize handler
    this._resizeHandler = debounce(() => this.resize(), 100);
    window.addEventListener('resize', this._resizeHandler);

    // ResizeObserver for container size changes
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(this._resizeHandler);
      this._resizeObserver.observe(this.container);
    }
  }

  /**
   * Apply current configuration to chart
   */
  _applyConfig() {
    const chartConfig = getChartConfig(this.options.type, this.options);
    this.chart.setOption(chartConfig, true);
  }

  /**
   * Set chart data
   */
  setData(data, xColumn = null, yColumn = null) {
    if (Array.isArray(data) && data.length > 0) {
      // If data is array of objects, extract x and y values
      if (typeof data[0] === 'object') {
        const keys = Object.keys(data[0]);
        const xKey = xColumn || keys[0];
        const yKey = yColumn || keys[1];

        this.options.xAxis = {
          ...this.options.xAxis,
          data: data.map(item => item[xKey]),
        };
        // Convert y values to numbers (they may come as strings from DB)
        this.options.data = data.map(item => {
          const val = item[yKey];
          return typeof val === 'string' ? parseFloat(val) : val;
        });
      } else {
        // Simple array of values
        this.options.data = data;
      }
    } else {
      this.options.data = data;
    }

    this._applyConfig();
    return this;
  }

  /**
   * Update chart options
   */
  setOptions(options) {
    this.options = deepMerge(this.options, options);
    this._applyConfig();
    return this;
  }

  /**
   * Set chart type
   */
  setType(type) {
    this.options.type = type;
    this._applyConfig();
    return this;
  }

  /**
   * Resize chart
   */
  resize() {
    if (this.chart && !this.chart.isDisposed()) {
      this.chart.resize();
    }
    return this;
  }

  /**
   * Get current configuration as JSON
   */
  getConfig() {
    return {
      type: this.options.type,
      title: this.options.title,
      data: this.options.data,
      xAxis: this.options.xAxis,
      yAxis: this.options.yAxis,
      ...this.options,
    };
  }

  /**
   * Export configuration as JSON string
   */
  toJSON() {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * Get ECharts instance
   */
  getInstance() {
    return this.chart;
  }

  /**
   * Destroy chart and cleanup
   */
  destroy() {
    window.removeEventListener('resize', this._resizeHandler);

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    if (this.chart && !this.chart.isDisposed()) {
      this.chart.dispose();
    }

    this.chart = null;
    this.container = null;
  }

  /**
   * Create Graph instance from saved configuration
   */
  static fromConfig(container, config) {
    return new Graph(container, config);
  }

  /**
   * Load data from API endpoint
   */
  async loadData(url, options = {}) {
    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const result = await response.json();

      if (result.success && result.data) {
        this.setData(result.data, options.xColumn, options.yColumn);
      }

      return result;
    } catch (error) {
      console.error('Graph: Failed to load data', error);
      throw error;
    }
  }
}

export default Graph;
