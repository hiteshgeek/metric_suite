/**
 * Chart Type Registry
 * Central registry for all chart type configurations
 */

import { generateBarConfig } from './BarChart.js';
import { generateLineConfig } from './LineChart.js';
import { generatePieConfig } from './PieChart.js';

/**
 * Available chart types and their config generators
 */
const chartTypes = {
  bar: {
    name: 'Bar Chart',
    generator: generateBarConfig,
  },
  line: {
    name: 'Line Chart',
    generator: generateLineConfig,
  },
  pie: {
    name: 'Pie Chart',
    generator: generatePieConfig,
  },
  donut: {
    name: 'Donut Chart',
    generator: (options) => generatePieConfig({ ...options, donut: true }),
  },
  area: {
    name: 'Area Chart',
    generator: (options) => generateLineConfig({ ...options, showArea: true }),
  },
};

/**
 * Get ECharts configuration for a specific chart type
 */
export function getChartConfig(type, options) {
  const chartType = chartTypes[type];

  if (!chartType) {
    console.warn(`Chart type "${type}" not found, falling back to bar chart`);
    return chartTypes.bar.generator(options);
  }

  return chartType.generator(options);
}

/**
 * Get list of available chart types
 */
export function getAvailableTypes() {
  return Object.entries(chartTypes).map(([key, value]) => ({
    value: key,
    label: value.name,
  }));
}

/**
 * Check if a chart type is available
 */
export function isTypeAvailable(type) {
  return type in chartTypes;
}

/**
 * Register a new chart type
 */
export function registerChartType(type, name, generator) {
  chartTypes[type] = { name, generator };
}

export default {
  getChartConfig,
  getAvailableTypes,
  isTypeAvailable,
  registerChartType,
};
