/**
 * Bar Chart Configuration Generator
 */

/**
 * Default bar chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  orientation: 'vertical', // 'vertical' or 'horizontal'
  showLegend: true,
  legendPosition: 'top', // 'top', 'bottom', 'left', 'right'
  showLabels: false,
  labelPosition: 'top', // 'top', 'inside', 'outside'
  barWidth: 'auto',
  barGap: '30%',
  stacked: false,
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
 * Generate ECharts configuration for bar chart
 * Note: Colors, text styles, axis styles are handled by ECharts themes.
 * Only set explicit colors if no theme is being used.
 */
export function generateBarConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };
  const isHorizontal = opts.orientation === 'horizontal';

  // Build series data - don't set colors, let theme handle it
  let seriesData = [];

  if (Array.isArray(opts.data)) {
    if (opts.data.length > 0 && Array.isArray(opts.data[0])) {
      // Multiple series
      seriesData = opts.data.map((data, index) => ({
        name: opts.seriesNames?.[index] || `Series ${index + 1}`,
        type: 'bar',
        data: data,
        stack: opts.stacked ? 'total' : undefined,
        label: {
          show: opts.showLabels,
          position: opts.labelPosition,
        },
        barWidth: opts.barWidth === 'auto' ? undefined : opts.barWidth,
        barGap: opts.barGap,
      }));
    } else {
      // Single series
      seriesData = [
        {
          name: opts.seriesNames?.[0] || opts.title || 'Data',
          type: 'bar',
          data: opts.data,
          label: {
            show: opts.showLabels,
            position: opts.labelPosition,
          },
          barWidth: opts.barWidth === 'auto' ? undefined : opts.barWidth,
        },
      ];
    }
  }

  // Build axis configurations - let theme handle colors
  const categoryAxis = {
    type: 'category',
    data: opts.xAxis?.data || [],
    axisLabel: {
      rotate: opts.xAxis?.rotate || 0,
      interval: opts.xAxis?.interval ?? 'auto',
    },
    axisTick: {
      alignWithLabel: true,
    },
  };

  const valueAxis = {
    type: 'value',
    name: opts.yAxis?.name || '',
    axisLabel: {
      formatter: opts.yAxis?.formatter || undefined,
    },
    splitLine: {
      lineStyle: {
        type: 'dashed',
      },
    },
  };

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
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        }
      : { show: false },
    legend: opts.showLegend
      ? {
          show: seriesData.length > 1,
          [opts.legendPosition]: opts.legendPosition === 'left' || opts.legendPosition === 'right' ? 10 : 'auto',
          top: opts.legendPosition === 'top' ? 30 : opts.legendPosition === 'bottom' ? 'auto' : 'middle',
          bottom: opts.legendPosition === 'bottom' ? 10 : 'auto',
          orient: opts.legendPosition === 'left' || opts.legendPosition === 'right' ? 'vertical' : 'horizontal',
        }
      : { show: false },
    grid: opts.grid,
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: seriesData,
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateBarConfig;
