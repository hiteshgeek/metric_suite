/**
 * Bar Chart Configuration Generator
 */

import { defaultColors } from '../utils.js';

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
  colors: defaultColors,
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
 */
export function generateBarConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };
  const isHorizontal = opts.orientation === 'horizontal';

  // Build series data
  let seriesData = [];

  if (Array.isArray(opts.data)) {
    if (opts.data.length > 0 && Array.isArray(opts.data[0])) {
      // Multiple series
      seriesData = opts.data.map((data, index) => ({
        name: opts.seriesNames?.[index] || `Series ${index + 1}`,
        type: 'bar',
        data: data,
        stack: opts.stacked ? 'total' : undefined,
        itemStyle: {
          color: opts.colors[index % opts.colors.length],
        },
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
          itemStyle: {
            color: opts.colors[0],
          },
          label: {
            show: opts.showLabels,
            position: opts.labelPosition,
          },
          barWidth: opts.barWidth === 'auto' ? undefined : opts.barWidth,
        },
      ];
    }
  }

  // Build axis configurations
  const categoryAxis = {
    type: 'category',
    data: opts.xAxis?.data || [],
    axisLabel: {
      rotate: opts.xAxis?.rotate || 0,
      interval: opts.xAxis?.interval ?? 'auto',
    },
    axisLine: {
      lineStyle: {
        color: '#e2e8f0',
      },
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
        color: '#e2e8f0',
        type: 'dashed',
      },
    },
  };

  // Build complete ECharts configuration
  const config = {
    title: {
      text: opts.title,
      subtext: opts.subtitle,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#1e293b',
      },
      subtextStyle: {
        fontSize: 12,
        color: '#64748b',
      },
    },
    tooltip: opts.tooltip
      ? {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          textStyle: {
            color: '#1e293b',
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
