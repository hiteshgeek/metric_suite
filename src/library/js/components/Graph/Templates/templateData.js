/**
 * Chart Template Data - Pre-built chart configurations
 * Exported as JavaScript module for Rollup compatibility
 */

export const templates = [
  {
    id: 'bar-sales-comparison',
    name: 'Sales Comparison',
    description: 'Compare sales across different categories or time periods',
    category: 'sales',
    chartType: 'bar',
    config: {
      title: { text: 'Sales Comparison', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { top: 30 },
      grid: { top: 80, bottom: 40 },
      xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
      yAxis: { type: 'value', name: 'Revenue ($)' },
      series: [
        { name: '2023', type: 'bar', data: [120, 200, 150, 180] },
        { name: '2024', type: 'bar', data: [150, 230, 180, 220] }
      ]
    }
  },
  {
    id: 'line-trend-analysis',
    name: 'Trend Analysis',
    description: 'Track trends over time with smooth line visualization',
    category: 'sales',
    chartType: 'line',
    config: {
      title: { text: 'Monthly Trend', left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { top: 60, bottom: 40 },
      xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Value',
          type: 'line',
          smooth: true,
          data: [820, 932, 901, 934, 1290, 1330],
          areaStyle: { opacity: 0.3 }
        }
      ]
    }
  },
  {
    id: 'pie-market-share',
    name: 'Market Share',
    description: 'Display proportional distribution of market segments',
    category: 'distribution',
    chartType: 'pie',
    config: {
      title: { text: 'Market Share', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [
        {
          name: 'Market Share',
          type: 'pie',
          radius: '60%',
          center: ['40%', '50%'],
          data: [
            { value: 1048, name: 'Product A' },
            { value: 735, name: 'Product B' },
            { value: 580, name: 'Product C' },
            { value: 484, name: 'Product D' },
            { value: 300, name: 'Others' }
          ]
        }
      ]
    }
  },
  {
    id: 'donut-budget',
    name: 'Budget Allocation',
    description: 'Show budget distribution with center summary',
    category: 'distribution',
    chartType: 'donut',
    config: {
      title: { text: 'Budget Allocation', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [
        {
          name: 'Budget',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: { show: true, formatter: '{b}: {d}%' },
          data: [
            { value: 40, name: 'Marketing' },
            { value: 25, name: 'Development' },
            { value: 20, name: 'Operations' },
            { value: 15, name: 'Support' }
          ]
        }
      ]
    }
  },
  {
    id: 'area-growth',
    name: 'Growth Visualization',
    description: 'Show cumulative growth over time with filled area',
    category: 'sales',
    chartType: 'area',
    config: {
      title: { text: 'User Growth', left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { top: 60, bottom: 40 },
      xAxis: { type: 'category', boundaryGap: false, data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Users',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          data: [120, 132, 101, 134, 90, 230, 210]
        },
        {
          name: 'New Users',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          data: [220, 182, 191, 234, 290, 330, 310]
        }
      ]
    }
  },
  {
    id: 'scatter-correlation',
    name: 'Correlation Analysis',
    description: 'Analyze relationship between two variables',
    category: 'comparison',
    chartType: 'scatter',
    config: {
      title: { text: 'Price vs Sales', left: 'center' },
      tooltip: { trigger: 'item', formatter: 'Price: {c0}<br/>Sales: {c1}' },
      grid: { top: 60, bottom: 40 },
      xAxis: { type: 'value', name: 'Price ($)' },
      yAxis: { type: 'value', name: 'Sales (units)' },
      series: [
        {
          type: 'scatter',
          symbolSize: 10,
          data: [[10, 8.04], [8, 6.95], [13, 7.58], [9, 8.81], [11, 8.33], [14, 9.96], [6, 7.24], [4, 4.26], [12, 10.84], [7, 4.82]]
        }
      ]
    }
  },
  {
    id: 'radar-skills',
    name: 'Skills Assessment',
    description: 'Multi-dimensional comparison on radar chart',
    category: 'comparison',
    chartType: 'radar',
    config: {
      title: { text: 'Team Skills', left: 'center' },
      legend: { top: 30 },
      radar: {
        indicator: [
          { name: 'Technical', max: 100 },
          { name: 'Communication', max: 100 },
          { name: 'Leadership', max: 100 },
          { name: 'Problem Solving', max: 100 },
          { name: 'Teamwork', max: 100 }
        ]
      },
      series: [
        {
          type: 'radar',
          data: [
            { value: [90, 75, 60, 85, 80], name: 'Team A' },
            { value: [70, 85, 80, 75, 90], name: 'Team B' }
          ]
        }
      ]
    }
  },
  {
    id: 'heatmap-activity',
    name: 'Activity Heatmap',
    description: 'Show intensity patterns across two dimensions',
    category: 'technical',
    chartType: 'heatmap',
    config: {
      title: { text: 'Weekly Activity', left: 'center' },
      tooltip: { position: 'top' },
      grid: { top: 60, bottom: 40, right: 80 },
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'category', data: ['Morning', 'Afternoon', 'Evening', 'Night'] },
      visualMap: { min: 0, max: 100, calculable: true, orient: 'vertical', right: 10, top: 'center' },
      series: [
        {
          type: 'heatmap',
          data: [[0, 0, 20], [1, 0, 35], [2, 0, 50], [3, 0, 40], [4, 0, 30], [5, 0, 10], [6, 0, 5], [0, 1, 60], [1, 1, 75], [2, 1, 80], [3, 1, 85], [4, 1, 70], [5, 1, 25], [6, 1, 15], [0, 2, 40], [1, 2, 55], [2, 2, 60], [3, 2, 65], [4, 2, 50], [5, 2, 45], [6, 2, 30], [0, 3, 10], [1, 3, 15], [2, 3, 20], [3, 3, 15], [4, 3, 25], [5, 3, 35], [6, 3, 20]],
          label: { show: true }
        }
      ]
    }
  },
  {
    id: 'candlestick-stock',
    name: 'Stock Price',
    description: 'Financial candlestick chart for stock analysis',
    category: 'financial',
    chartType: 'candlestick',
    config: {
      title: { text: 'Stock Performance', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { top: 60, bottom: 60 },
      xAxis: { type: 'category', data: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'] },
      yAxis: { type: 'value', scale: true },
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
      series: [
        {
          type: 'candlestick',
          data: [[20, 34, 10, 38], [40, 35, 30, 50], [31, 38, 33, 44], [38, 15, 5, 42], [15, 20, 10, 30], [20, 35, 15, 40], [35, 40, 30, 45]],
          itemStyle: { color: '#10b981', color0: '#ef4444', borderColor: '#10b981', borderColor0: '#ef4444' }
        }
      ]
    }
  },
  {
    id: 'funnel-conversion',
    name: 'Conversion Funnel',
    description: 'Track conversion rates through stages',
    category: 'sales',
    chartType: 'funnel',
    config: {
      title: { text: 'Sales Funnel', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: { top: 'bottom' },
      series: [
        {
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: 100,
          sort: 'descending',
          gap: 2,
          label: { show: true, position: 'inside' },
          data: [
            { value: 100, name: 'Visitors' },
            { value: 80, name: 'Interested' },
            { value: 60, name: 'Intent' },
            { value: 40, name: 'Evaluation' },
            { value: 20, name: 'Purchase' }
          ]
        }
      ]
    }
  },
  {
    id: 'gauge-performance',
    name: 'Performance Gauge',
    description: 'Display single KPI with target indication',
    category: 'progress',
    chartType: 'gauge',
    config: {
      series: [
        {
          type: 'gauge',
          center: ['50%', '60%'],
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 10,
          progress: { show: true, width: 18, roundCap: true },
          pointer: { show: true },
          axisLine: { lineStyle: { width: 18, color: [[0.3, '#10b981'], [0.7, '#f59e0b'], [1, '#ef4444']] }, roundCap: true },
          axisTick: { distance: -30, length: 8 },
          splitLine: { distance: -30, length: 14 },
          axisLabel: { distance: 25, fontSize: 12 },
          title: { show: true, offsetCenter: [0, '70%'] },
          detail: { valueAnimation: true, offsetCenter: [0, '40%'], fontSize: 28, fontWeight: 'bold', formatter: '{value}%' },
          data: [{ value: 75, name: 'Score' }]
        }
      ]
    }
  },
  {
    id: 'bar-horizontal-ranking',
    name: 'Ranking Chart',
    description: 'Horizontal bar chart for rankings and comparisons',
    category: 'comparison',
    chartType: 'bar',
    config: {
      title: { text: 'Top Products', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '20%', right: '10%', top: 60 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: ['Product E', 'Product D', 'Product C', 'Product B', 'Product A'] },
      series: [
        {
          type: 'bar',
          data: [200, 320, 450, 580, 720],
          itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#10b981' }] } }
        }
      ]
    }
  }
];

export default templates;
