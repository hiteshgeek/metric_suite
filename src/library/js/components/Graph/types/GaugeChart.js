/**
 * Gauge Chart Configuration Generator
 * For displaying single value metrics with progress indication
 */

/**
 * Default gauge chart options
 * Note: Colors are handled by ECharts themes where possible.
 * axisLineColors are kept as options since they have semantic meaning (good/warning/bad).
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  min: 0,
  max: 100,
  splitNumber: 10, // Number of split segments
  radius: '85%',
  startAngle: 225, // Start angle (default gauge shape)
  endAngle: -45,
  clockwise: true,
  showPointer: true,
  pointerWidth: 6,
  showProgress: true, // Show progress bar style
  progressWidth: 18,
  showAxisTick: true,
  showAxisLabel: true,
  showDetail: true, // Show value in center
  detailFontSize: 28,
  animation: true,
  animationDuration: 1000,
  // Color stops for different value ranges
  axisLineColors: [
    [0.3, '#10b981'], // 0-30%: Green
    [0.7, '#f59e0b'], // 30-70%: Amber
    [1, '#ef4444'], // 70-100%: Red
  ],
};

/**
 * Generate ECharts configuration for gauge chart
 * @param {Object} options - Chart options
 * @param {number} options.value - Current value to display
 * @param {string} options.name - Label for the value
 * @param {string} options.unit - Unit suffix (e.g., '%', 'km/h')
 */
export function generateGaugeConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };

  // Build complete ECharts configuration
  // Theme handles: textStyle colors, backgroundColor
  const config = {
    title: {
      text: opts.title,
      subtext: opts.subtitle,
      left: 'center',
    },
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        radius: opts.radius,
        startAngle: opts.startAngle,
        endAngle: opts.endAngle,
        clockwise: opts.clockwise,
        min: opts.min,
        max: opts.max,
        splitNumber: opts.splitNumber,
        progress: {
          show: opts.showProgress,
          width: opts.progressWidth,
          roundCap: true,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: opts.axisLineColors[0][1] },
                { offset: 0.5, color: opts.axisLineColors[1][1] },
                { offset: 1, color: opts.axisLineColors[2][1] },
              ],
            },
          },
        },
        pointer: {
          show: opts.showPointer,
          width: opts.pointerWidth,
          length: '60%',
        },
        axisLine: {
          lineStyle: {
            width: opts.progressWidth,
            color: opts.axisLineColors,
          },
          roundCap: true,
        },
        axisTick: {
          show: opts.showAxisTick,
          distance: -30,
          length: 8,
          lineStyle: {
            width: 2,
          },
        },
        splitLine: {
          show: true,
          distance: -30,
          length: 14,
          lineStyle: {
            width: 3,
          },
        },
        axisLabel: {
          show: opts.showAxisLabel,
          distance: 25,
          fontSize: 12,
          formatter: (value) => {
            if (opts.axisLabelFormatter) {
              return opts.axisLabelFormatter(value);
            }
            return value;
          },
        },
        anchor: {
          show: opts.showPointer,
          size: 20,
          itemStyle: {
            borderWidth: 2,
          },
        },
        title: {
          show: !!opts.name,
          offsetCenter: [0, '70%'],
          fontSize: 14,
        },
        detail: {
          show: opts.showDetail,
          valueAnimation: true,
          width: '60%',
          offsetCenter: [0, '40%'],
          fontSize: opts.detailFontSize,
          fontWeight: 'bold',
          formatter: (value) => {
            if (opts.valueFormatter) {
              return opts.valueFormatter(value);
            }
            const unit = opts.unit || '';
            return `${value.toFixed(opts.precision || 0)}${unit}`;
          },
        },
        data: [
          {
            value: opts.value ?? 0,
            name: opts.name || '',
          },
        ],
      },
    ],
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateGaugeConfig;
