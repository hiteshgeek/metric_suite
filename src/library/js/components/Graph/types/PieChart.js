/**
 * Pie Chart Configuration Generator
 */

/**
 * Default pie chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  showLegend: true,
  legendPosition: 'right', // 'top', 'bottom', 'left', 'right'
  showLabels: true,
  labelPosition: 'outside', // 'outside', 'inside', 'center'
  donut: false, // Whether to show as donut chart
  donutRadius: '50%', // Inner radius for donut
  radius: '70%', // Outer radius
  roseType: false, // 'radius' or 'area' for nightingale chart
  animation: true,
  animationDuration: 1000,
  tooltip: true,
  emphasis: true, // Highlight on hover
};

/**
 * Generate ECharts configuration for pie chart
 * Note: Colors, text styles are handled by ECharts themes.
 */
export function generatePieConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };

  // Build pie data from provided data
  // Expects data in format: [{ name: 'A', value: 10 }, ...] or transforms from arrays
  // Don't set colors - let theme handle it
  let pieData = [];

  if (Array.isArray(opts.data)) {
    if (opts.data.length > 0 && typeof opts.data[0] === 'object' && 'name' in opts.data[0]) {
      // Already in correct format
      pieData = opts.data.map((item) => ({
        name: item.name,
        value: item.value,
      }));
    } else {
      // Convert from simple array using xAxis labels
      const labels = opts.xAxis?.data || opts.data.map((_, i) => `Item ${i + 1}`);
      pieData = opts.data.map((value, index) => ({
        name: labels[index] || `Item ${index + 1}`,
        value: value,
      }));
    }
  }

  // Calculate radius based on donut option
  const radius = opts.donut ? [opts.donutRadius, opts.radius] : opts.radius;

  // Build label configuration - let theme handle colors
  const labelConfig = {
    show: opts.showLabels,
    position: opts.labelPosition,
    formatter: opts.labelPosition === 'inside' ? '{d}%' : '{b}: {d}%',
    fontSize: 12,
  };

  // Build series
  const seriesData = [
    {
      name: opts.title || 'Data',
      type: 'pie',
      radius: radius,
      center: ['50%', '55%'], // Slightly lower to account for title
      roseType: opts.roseType || undefined,
      data: pieData,
      label: labelConfig,
      labelLine: {
        show: opts.showLabels && opts.labelPosition === 'outside',
      },
      emphasis: opts.emphasis
        ? {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          }
        : undefined,
      itemStyle: {
        borderRadius: opts.donut ? 4 : 0,
        borderWidth: 2,
      },
    },
  ];

  // Build legend configuration - let theme handle colors
  const legendConfig = opts.showLegend
    ? {
        show: true,
        orient:
          opts.legendPosition === 'left' || opts.legendPosition === 'right'
            ? 'vertical'
            : 'horizontal',
        [opts.legendPosition]:
          opts.legendPosition === 'left' || opts.legendPosition === 'right' ? 10 : 'center',
        top:
          opts.legendPosition === 'top'
            ? 30
            : opts.legendPosition === 'bottom'
              ? 'auto'
              : 'middle',
        bottom: opts.legendPosition === 'bottom' ? 10 : 'auto',
        formatter: (name) => {
          // Truncate long names
          return name.length > 15 ? name.substring(0, 15) + '...' : name;
        },
      }
    : { show: false };

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
          formatter: '{b}: {c} ({d}%)',
        }
      : { show: false },
    legend: legendConfig,
    series: seriesData,
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generatePieConfig;
