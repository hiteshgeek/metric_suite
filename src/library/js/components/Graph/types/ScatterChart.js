/**
 * Scatter Chart Configuration Generator
 */

/**
 * Default scatter chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  showLegend: true,
  legendPosition: 'top',
  symbolSize: 10,
  showLabels: false,
  labelPosition: 'top',
  animation: true,
  animationDuration: 1000,
  tooltip: true,
  grid: {
    top: 60,
    right: 20,
    bottom: 40,
    left: 50,
    containLabel: true,
  },
};

/**
 * Generate ECharts configuration for scatter chart
 * Note: Colors are handled by ECharts themes.
 * @param {Object} options - Chart options
 * @param {Array} options.data - Data array: [[x1,y1], [x2,y2]] or [[[x,y]...], [[x,y]...]] for multiple series
 * @param {Array} options.seriesNames - Names for each series
 * @param {string} options.xAxis.name - X-axis label
 * @param {string} options.yAxis.name - Y-axis label
 */
export function generateScatterConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };

  // Build series data - let theme handle colors
  let seriesData = [];

  if (Array.isArray(opts.data)) {
    if (opts.data.length > 0 && Array.isArray(opts.data[0]) && Array.isArray(opts.data[0][0])) {
      // Multiple series: [[[x,y], [x,y]], [[x,y], [x,y]]]
      seriesData = opts.data.map((data, index) => ({
        name: opts.seriesNames?.[index] || `Series ${index + 1}`,
        type: 'scatter',
        data: data,
        symbolSize: opts.symbolSize,
        label: {
          show: opts.showLabels,
          position: opts.labelPosition,
          formatter: '{@[0]}, {@[1]}',
        },
      }));
    } else {
      // Single series: [[x,y], [x,y]]
      seriesData = [
        {
          name: opts.seriesNames?.[0] || opts.title || 'Data',
          type: 'scatter',
          data: opts.data,
          symbolSize: opts.symbolSize,
          label: {
            show: opts.showLabels,
            position: opts.labelPosition,
          },
        },
      ];
    }
  }

  // Build complete ECharts configuration
  // Theme handles: colors, backgroundColor, textStyle, axis colors, tooltip styling
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
            return `${params.seriesName}<br/>X: ${params.value[0]}<br/>Y: ${params.value[1]}`;
          },
        }
      : { show: false },
    legend: opts.showLegend
      ? {
          show: seriesData.length > 1,
          [opts.legendPosition]:
            opts.legendPosition === 'left' || opts.legendPosition === 'right' ? 10 : 'auto',
          top:
            opts.legendPosition === 'top' ? 30 : opts.legendPosition === 'bottom' ? 'auto' : 'middle',
          bottom: opts.legendPosition === 'bottom' ? 10 : 'auto',
          orient:
            opts.legendPosition === 'left' || opts.legendPosition === 'right'
              ? 'vertical'
              : 'horizontal',
        }
      : { show: false },
    grid: opts.grid,
    xAxis: {
      type: 'value',
      name: opts.xAxis?.name || '',
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: opts.yAxis?.name || '',
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
    series: seriesData,
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateScatterConfig;
