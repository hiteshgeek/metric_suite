/**
 * Funnel Chart Configuration Generator
 * For conversion/pipeline visualization
 */

/**
 * Default funnel chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  showLegend: true,
  legendPosition: 'right',
  sort: 'descending', // 'ascending', 'descending', 'none'
  orient: 'vertical', // 'vertical' or 'horizontal'
  gap: 2, // Gap between funnel pieces
  minSize: '0%', // Minimum size of the smallest piece
  maxSize: '100%', // Maximum size of the largest piece
  showLabels: true,
  labelPosition: 'inside', // 'inside', 'outside', 'left', 'right'
  animation: true,
  animationDuration: 1000,
  tooltip: true,
};

/**
 * Generate ECharts configuration for funnel chart
 * Note: Colors are handled by ECharts themes.
 * @param {Object} options - Chart options
 * @param {Array} options.data - Data array: [{name: 'Step 1', value: 100}, {name: 'Step 2', value: 80}, ...]
 */
export function generateFunnelConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };

  // Process data - let theme handle colors
  const processedData = (opts.data || []).map((item) => ({
    name: item.name,
    value: item.value,
  }));

  // Build complete ECharts configuration
  // Theme handles: colors, backgroundColor, textStyle, tooltip styling
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
            const percent = params.percent ? ` (${params.percent.toFixed(1)}%)` : '';
            return `${params.name}: ${params.value}${percent}`;
          },
        }
      : { show: false },
    legend: opts.showLegend
      ? {
          show: true,
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
    series: [
      {
        type: 'funnel',
        left: opts.legendPosition === 'left' ? '20%' : '10%',
        right: opts.legendPosition === 'right' ? '20%' : '10%',
        top: 60,
        bottom: 40,
        width: '80%',
        min: 0,
        max: 100,
        minSize: opts.minSize,
        maxSize: opts.maxSize,
        sort: opts.sort,
        orient: opts.orient,
        gap: opts.gap,
        label: {
          show: opts.showLabels,
          position: opts.labelPosition,
          formatter: '{b}: {c}',
        },
        labelLine: {
          show: opts.labelPosition === 'outside' || opts.labelPosition === 'left' || opts.labelPosition === 'right',
        },
        emphasis: {
          label: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: processedData,
      },
    ],
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateFunnelConfig;
