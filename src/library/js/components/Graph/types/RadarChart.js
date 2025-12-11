/**
 * Radar Chart Configuration Generator
 */

/**
 * Default radar chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  showLegend: true,
  legendPosition: 'top',
  shape: 'polygon', // 'polygon' or 'circle'
  radius: '65%',
  showArea: true,
  areaOpacity: 0.3,
  animation: true,
  animationDuration: 1000,
  tooltip: true,
};

/**
 * Generate ECharts configuration for radar chart
 * Note: Colors are handled by ECharts themes.
 * @param {Object} options - Chart options
 * @param {Array} options.indicators - Radar indicators: [{name: 'A', max: 100}, ...]
 * @param {Array} options.data - Data values: [[val1, val2, ...]] or [[...], [...]] for multiple series
 * @param {Array} options.seriesNames - Names for each series
 */
export function generateRadarConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };

  // Build indicators (radar axes)
  const indicators = opts.indicators || [];

  // Build series data - let theme handle colors
  let seriesData = [];

  if (Array.isArray(opts.data)) {
    if (opts.data.length > 0 && Array.isArray(opts.data[0]) && Array.isArray(opts.data[0][0])) {
      // Multiple series: [[val1, val2], [val3, val4]]
      seriesData = opts.data.map((values, index) => ({
        name: opts.seriesNames?.[index] || `Series ${index + 1}`,
        value: values,
        areaStyle: opts.showArea
          ? {
              opacity: opts.areaOpacity,
            }
          : undefined,
      }));
    } else if (opts.data.length > 0 && Array.isArray(opts.data[0])) {
      // Check if it's multiple series with plain arrays
      const isMultipleSeries = opts.data.every(d => Array.isArray(d) && typeof d[0] === 'number');
      if (isMultipleSeries && opts.data.length > 1 && opts.seriesNames?.length > 1) {
        seriesData = opts.data.map((values, index) => ({
          name: opts.seriesNames?.[index] || `Series ${index + 1}`,
          value: values,
          areaStyle: opts.showArea
            ? {
                opacity: opts.areaOpacity,
              }
            : undefined,
        }));
      } else {
        // Single series
        seriesData = [
          {
            name: opts.seriesNames?.[0] || opts.title || 'Data',
            value: opts.data[0] || opts.data,
            areaStyle: opts.showArea
              ? {
                  opacity: opts.areaOpacity,
                }
              : undefined,
          },
        ];
      }
    }
  }

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
    radar: {
      indicator: indicators,
      shape: opts.shape,
      radius: opts.radius,
      splitArea: {
        areaStyle: {
          color: ['transparent'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: seriesData,
      },
    ],
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateRadarConfig;
