/**
 * Candlestick Chart Configuration Generator
 * For financial/stock data visualization
 */

/**
 * Default candlestick chart options
 */
const defaultOptions = {
  title: '',
  subtitle: '',
  showLegend: false,
  upColor: '#10b981', // Green for price increase
  downColor: '#ef4444', // Red for price decrease
  upBorderColor: '#10b981',
  downBorderColor: '#ef4444',
  showVolume: false, // Show volume bars below
  volumeColor: '#64748b',
  animation: true,
  animationDuration: 1000,
  tooltip: true,
  dataZoom: true, // Enable zoom/scroll
  grid: {
    top: 60,
    right: 20,
    bottom: 80,
    left: 50,
    containLabel: true,
  },
};

/**
 * Generate ECharts configuration for candlestick chart
 * Note: Candlestick has specific colors (up/down) that are kept as options.
 * @param {Object} options - Chart options
 * @param {Array} options.xAxis.data - Date/time labels
 * @param {Array} options.data - OHLC data: [[open, close, low, high], ...] for each date
 * @param {Array} options.volumeData - Optional volume data for each date
 */
export function generateCandlestickConfig(options = {}) {
  const opts = { ...defaultOptions, ...options };

  const series = [
    {
      type: 'candlestick',
      data: opts.data || [],
      itemStyle: {
        color: opts.upColor,
        color0: opts.downColor,
        borderColor: opts.upBorderColor,
        borderColor0: opts.downBorderColor,
      },
    },
  ];

  // Add volume series if provided
  const grids = [opts.grid];
  const xAxes = [
    {
      type: 'category',
      data: opts.xAxis?.data || [],
      axisLabel: {
        rotate: opts.xAxis?.rotate || 0,
      },
    },
  ];
  const yAxes = [
    {
      type: 'value',
      name: opts.yAxis?.name || 'Price',
      axisLabel: {
        formatter: opts.yAxis?.formatter || undefined,
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
  ];

  if (opts.showVolume && opts.volumeData) {
    // Adjust main grid to make room for volume
    grids[0] = { ...opts.grid, bottom: 120 };

    // Add volume grid
    grids.push({
      left: opts.grid.left,
      right: opts.grid.right,
      bottom: 40,
      height: 60,
      containLabel: true,
    });

    // Add volume x-axis (hidden, just for linking)
    xAxes.push({
      type: 'category',
      gridIndex: 1,
      data: opts.xAxis?.data || [],
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
    });

    // Add volume y-axis
    yAxes.push({
      type: 'value',
      gridIndex: 1,
      name: 'Volume',
      nameTextStyle: {
        fontSize: 10,
      },
      axisLabel: {
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    });

    // Add volume bar series
    series.push({
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: opts.volumeData,
      itemStyle: {
        color: opts.volumeColor,
        opacity: 0.5,
      },
    });
  }

  // Build complete ECharts configuration
  // Theme handles: backgroundColor, textStyle, tooltip styling
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
            type: 'cross',
          },
          formatter: (params) => {
            const candlestick = params.find(p => p.seriesType === 'candlestick');
            if (!candlestick) return '';
            const [open, close, low, high] = candlestick.data;
            let html = `<strong>${candlestick.axisValue}</strong><br/>`;
            html += `Open: ${open}<br/>`;
            html += `Close: ${close}<br/>`;
            html += `Low: ${low}<br/>`;
            html += `High: ${high}`;

            const volume = params.find(p => p.seriesType === 'bar');
            if (volume) {
              html += `<br/>Volume: ${volume.data}`;
            }
            return html;
          },
        }
      : { show: false },
    legend: { show: false },
    grid: grids.length > 1 ? grids : grids[0],
    xAxis: xAxes.length > 1 ? xAxes : xAxes[0],
    yAxis: yAxes.length > 1 ? yAxes : yAxes[0],
    dataZoom: opts.dataZoom
      ? [
          {
            type: 'inside',
            xAxisIndex: opts.showVolume && opts.volumeData ? [0, 1] : [0],
            start: 0,
            end: 100,
          },
          {
            type: 'slider',
            xAxisIndex: opts.showVolume && opts.volumeData ? [0, 1] : [0],
            start: 0,
            end: 100,
            bottom: 10,
            height: 20,
          },
        ]
      : undefined,
    series: series,
    animation: opts.animation,
    animationDuration: opts.animationDuration,
    animationEasing: 'cubicOut',
  };

  return config;
}

export default generateCandlestickConfig;
