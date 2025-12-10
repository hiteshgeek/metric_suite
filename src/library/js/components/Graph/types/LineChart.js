/**
 * Line Chart Configuration Generator
 */

import { defaultColors } from '../utils.js';

/**
 * Get current theme colors from CSS variables
 */
function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    text: style.getPropertyValue('--ms-text').trim() || '#1e293b',
    textSecondary: style.getPropertyValue('--ms-text-secondary').trim() || '#64748b',
    border: style.getPropertyValue('--ms-border').trim() || '#e2e8f0',
    bg: style.getPropertyValue('--ms-bg').trim() || '#ffffff',
  };
}

/**
 * Default line chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  showLegend: true,
  legendPosition: 'top', // 'top', 'bottom', 'left', 'right'
  showLabels: false,
  labelPosition: 'top',
  colors: defaultColors,
  smooth: false, // Smooth curves
  showArea: false, // Fill area under line
  areaOpacity: 0.3,
  lineWidth: 2,
  showSymbol: true, // Show data points
  symbolSize: 6,
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
 * Generate ECharts configuration for line chart
 */
export function generateLineConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };
  const theme = getThemeColors();

  // Build series data
  let seriesData = [];

  if (Array.isArray(opts.data)) {
    if (opts.data.length > 0 && Array.isArray(opts.data[0])) {
      // Multiple series
      seriesData = opts.data.map((data, index) => ({
        name: opts.seriesNames?.[index] || `Series ${index + 1}`,
        type: 'line',
        data: data,
        smooth: opts.smooth,
        lineStyle: {
          width: opts.lineWidth,
          color: opts.colors[index % opts.colors.length],
        },
        itemStyle: {
          color: opts.colors[index % opts.colors.length],
        },
        areaStyle: opts.showArea
          ? {
              opacity: opts.areaOpacity,
              color: opts.colors[index % opts.colors.length],
            }
          : undefined,
        symbol: opts.showSymbol ? 'circle' : 'none',
        symbolSize: opts.symbolSize,
        label: {
          show: opts.showLabels,
          position: opts.labelPosition,
        },
      }));
    } else {
      // Single series
      seriesData = [
        {
          name: opts.seriesNames?.[0] || opts.title || 'Data',
          type: 'line',
          data: opts.data,
          smooth: opts.smooth,
          lineStyle: {
            width: opts.lineWidth,
            color: opts.colors[0],
          },
          itemStyle: {
            color: opts.colors[0],
          },
          areaStyle: opts.showArea
            ? {
                opacity: opts.areaOpacity,
                color: opts.colors[0],
              }
            : undefined,
          symbol: opts.showSymbol ? 'circle' : 'none',
          symbolSize: opts.symbolSize,
          label: {
            show: opts.showLabels,
            position: opts.labelPosition,
          },
        },
      ];
    }
  }

  // Build axis configurations
  const categoryAxis = {
    type: 'category',
    data: opts.xAxis?.data || [],
    boundaryGap: false, // Line starts from edge
    axisLabel: {
      rotate: opts.xAxis?.rotate || 0,
      interval: opts.xAxis?.interval ?? 'auto',
      color: theme.text,
    },
    axisLine: {
      lineStyle: {
        color: theme.border,
      },
    },
    axisTick: {
      alignWithLabel: true,
      lineStyle: {
        color: theme.border,
      },
    },
  };

  const valueAxis = {
    type: 'value',
    name: opts.yAxis?.name || '',
    nameTextStyle: {
      color: theme.textSecondary,
    },
    axisLabel: {
      formatter: opts.yAxis?.formatter || undefined,
      color: theme.text,
    },
    axisLine: {
      lineStyle: {
        color: theme.border,
      },
    },
    splitLine: {
      lineStyle: {
        color: theme.border,
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
        color: theme.text,
      },
      subtextStyle: {
        fontSize: 12,
        color: theme.textSecondary,
      },
    },
    tooltip: opts.tooltip
      ? {
          trigger: 'axis',
          backgroundColor: theme.bg,
          borderColor: theme.border,
          borderWidth: 1,
          textStyle: {
            color: theme.text,
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
          textStyle: {
            color: theme.text,
          },
        }
      : { show: false },
    grid: opts.grid,
    xAxis: categoryAxis,
    yAxis: valueAxis,
    series: seriesData,
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateLineConfig;
