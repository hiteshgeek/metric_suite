/**
 * Heatmap Chart Configuration Generator
 */

/**
 * Default heatmap chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  showLegend: false,
  showLabels: true,
  minColor: '#e0f2fe', // Light blue for low values
  maxColor: '#1e40af', // Dark blue for high values
  animation: true,
  animationDuration: 1000,
  tooltip: true,
  grid: {
    top: 60,
    right: 80,
    bottom: 40,
    left: 50,
    containLabel: true,
  },
};

/**
 * Generate ECharts configuration for heatmap chart
 * Note: Most colors are handled by ECharts themes, but visualMap colors can be customized.
 * @param {Object} options - Chart options
 * @param {Array} options.xAxis.data - X-axis categories
 * @param {Array} options.yAxis.data - Y-axis categories
 * @param {Array} options.data - Data array: [[x, y, value], ...] where x, y are indices
 */
export function generateHeatmapConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };

  // Calculate min/max values for visual map
  let minValue = 0;
  let maxValue = 100;
  if (opts.data && opts.data.length > 0) {
    const values = opts.data.map(item => item[2]).filter(v => v !== null && v !== undefined);
    minValue = Math.min(...values);
    maxValue = Math.max(...values);
  }

  // Build complete ECharts configuration
  // Theme handles: backgroundColor, textStyle, axis colors, tooltip styling
  const config = {
    title: {
      text: opts.title,
      subtext: opts.subtitle,
      left: 'center',
    },
    tooltip: opts.tooltip
      ? {
          trigger: 'item',
          formatter: (params) => {
            const xLabel = opts.xAxis?.data?.[params.value[0]] || params.value[0];
            const yLabel = opts.yAxis?.data?.[params.value[1]] || params.value[1];
            return `${xLabel} × ${yLabel}<br/>Value: ${params.value[2]}`;
          },
        }
      : { show: false },
    grid: opts.grid,
    xAxis: {
      type: 'category',
      data: opts.xAxis?.data || [],
      axisLabel: {
        rotate: opts.xAxis?.rotate || 0,
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['transparent'],
        },
      },
    },
    yAxis: {
      type: 'category',
      data: opts.yAxis?.data || [],
      splitArea: {
        show: true,
        areaStyle: {
          color: ['transparent'],
        },
      },
    },
    visualMap: {
      min: opts.minValue ?? minValue,
      max: opts.maxValue ?? maxValue,
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      inRange: {
        color: [opts.minColor, opts.maxColor],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: opts.data || [],
        label: {
          show: opts.showLabels,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateHeatmapConfig;
