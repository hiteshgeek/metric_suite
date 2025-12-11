/**
 * ECharts Theme Definitions
 * Custom themes for the Graph component
 * Based on ECharts Theme Builder: https://echarts.apache.org/en/theme-builder.html
 */

import * as echarts from 'echarts';

// Default color palette
export const defaultColorPalette = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48b8d0'
];

// Theme definitions based on popular ECharts themes
const themeDefinitions = {
  vintage: {
    color: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'],
    backgroundColor: 'rgba(254,248,239,1)',
    textStyle: { color: '#333333' },
    title: {
      textStyle: { color: '#333333' },
      subtextStyle: { color: '#aaaaaa' }
    },
    line: { itemStyle: { borderWidth: 1 }, lineStyle: { width: 2 }, symbolSize: 4, symbol: 'emptyCircle', smooth: false },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#333' } }, axisTick: { show: true, lineStyle: { color: '#333' } }, axisLabel: { show: true, color: '#333' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: true, lineStyle: { color: '#333' } }, axisTick: { show: true, lineStyle: { color: '#333' } }, axisLabel: { show: true, color: '#333' }, splitLine: { show: true, lineStyle: { color: ['#ccc'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#333333' } },
    tooltip: { backgroundColor: 'rgba(50,50,50,0.7)', borderColor: '#333', textStyle: { color: '#fff' } }
  },
  westeros: {
    color: ['#516b91', '#59c4e6', '#edafda', '#93b7e3', '#a5e7f0', '#cbb0e3'],
    backgroundColor: 'rgba(0,0,0,0)',
    textStyle: { color: '#516b91' },
    title: {
      textStyle: { color: '#516b91' },
      subtextStyle: { color: '#93b7e3' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#cccccc' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#999999' }, splitLine: { show: true, lineStyle: { color: ['#eeeeee'] } }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: '#999999' }, splitLine: { show: true, lineStyle: { color: ['#eeeeee'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#516b91' } },
    tooltip: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#516b91', textStyle: { color: '#516b91' } }
  },
  essos: {
    color: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4'],
    backgroundColor: 'rgba(242,234,191,0.15)',
    textStyle: { color: '#893448' },
    title: {
      textStyle: { color: '#893448' },
      subtextStyle: { color: '#d95850' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#aaaaaa' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: true, lineStyle: { color: ['#eeeeee'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#893448' } },
    tooltip: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#893448', textStyle: { color: '#333' } }
  },
  wonderland: {
    color: ['#4ea397', '#22c3aa', '#7bd9a5', '#d0648a', '#f58db2', '#f2b3c9'],
    backgroundColor: 'rgba(255,255,255,0)',
    textStyle: { color: '#666666' },
    title: {
      textStyle: { color: '#666666' },
      subtextStyle: { color: '#999999' }
    },
    categoryAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: '#666666' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: '#666666' }, splitLine: { show: true, lineStyle: { color: ['#e6e6e6'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#666666' } },
    tooltip: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#4ea397', textStyle: { color: '#333' } }
  },
  walden: {
    color: ['#3fb1e3', '#6be6c1', '#626c91', '#a0a7e6', '#c4ebad', '#96dee8'],
    backgroundColor: 'rgba(252,252,252,0)',
    textStyle: { color: '#666666' },
    title: {
      textStyle: { color: '#666666' },
      subtextStyle: { color: '#999999' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#cccccc' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#999999' }, splitLine: { show: true, lineStyle: { color: ['#eeeeee'] } }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: '#999999' }, splitLine: { show: true, lineStyle: { color: ['#eeeeee'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#666666' } },
    tooltip: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#3fb1e3', textStyle: { color: '#333' } }
  },
  chalk: {
    color: ['#fc97af', '#87f7cf', '#f7f494', '#72ccff', '#f7c5a0', '#d4a4eb', '#d2f5a6', '#76f2f2'],
    backgroundColor: '#293441',
    textStyle: { color: '#ffffff' },
    title: {
      textStyle: { color: '#ffffff' },
      subtextStyle: { color: '#dddddd' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#eeeeee' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#eeeeee' }, splitLine: { show: true, lineStyle: { color: ['#aaaaaa'] } }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: true, lineStyle: { color: '#eeeeee' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#eeeeee' }, splitLine: { show: true, lineStyle: { color: ['#aaaaaa'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#ffffff' } },
    tooltip: { backgroundColor: 'rgba(50,50,50,0.9)', borderColor: '#eeeeee', textStyle: { color: '#fff' } }
  },
  infographic: {
    color: ['#c1232b', '#27727b', '#fcce10', '#e87c25', '#b5c334', '#fe8463', '#9bca63', '#fad860', '#f3a43b', '#60c0dd'],
    backgroundColor: 'rgba(0,0,0,0)',
    textStyle: { color: '#27727b' },
    title: {
      textStyle: { color: '#27727b' },
      subtextStyle: { color: '#aaaaaa' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#333333' } }, axisTick: { show: true, lineStyle: { color: '#333333' } }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: true, lineStyle: { color: '#333333' } }, axisTick: { show: true, lineStyle: { color: '#333333' } }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: true, lineStyle: { color: ['#cccccc'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#27727b' } },
    tooltip: { backgroundColor: 'rgba(50,50,50,0.7)', borderColor: '#333', textStyle: { color: '#fff' } }
  },
  macarons: {
    color: ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80', '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa'],
    backgroundColor: 'rgba(0,0,0,0)',
    textStyle: { color: '#008acd' },
    title: {
      textStyle: { color: '#008acd' },
      subtextStyle: { color: '#aaaaaa' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#008acd' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: true, lineStyle: { color: '#008acd' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: true, lineStyle: { color: ['#eeeeee'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#008acd' } },
    tooltip: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#008acd', textStyle: { color: '#333' } }
  },
  roma: {
    color: ['#e01f54', '#001852', '#f5e8c8', '#b8d2c7', '#c6b38e', '#a4d8c2', '#f3d999', '#d3758f', '#dcc392', '#2e4783'],
    backgroundColor: 'rgba(0,0,0,0)',
    textStyle: { color: '#333333' },
    title: {
      textStyle: { color: '#333333' },
      subtextStyle: { color: '#aaaaaa' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#333333' } }, axisTick: { show: true, lineStyle: { color: '#333333' } }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: true, lineStyle: { color: '#333333' } }, axisTick: { show: true, lineStyle: { color: '#333333' } }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: true, lineStyle: { color: ['#cccccc'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#333333' } },
    tooltip: { backgroundColor: 'rgba(50,50,50,0.7)', borderColor: '#333', textStyle: { color: '#fff' } }
  },
  shine: {
    color: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
    backgroundColor: 'rgba(0,0,0,0)',
    textStyle: { color: '#333333' },
    title: {
      textStyle: { color: '#333333' },
      subtextStyle: { color: '#aaaaaa' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#333333' } }, axisTick: { show: true, lineStyle: { color: '#333333' } }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: true, lineStyle: { color: '#333333' } }, axisTick: { show: true, lineStyle: { color: '#333333' } }, axisLabel: { show: true, color: '#333333' }, splitLine: { show: true, lineStyle: { color: ['#cccccc'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#333333' } },
    tooltip: { backgroundColor: 'rgba(50,50,50,0.7)', borderColor: '#333', textStyle: { color: '#fff' } }
  },
  'purple-passion': {
    color: ['#9b8bba', '#e098c7', '#8fd3e8', '#71669e', '#cc70af', '#7cb4cc'],
    backgroundColor: 'rgba(91,92,110,1)',
    textStyle: { color: '#ffffff' },
    title: {
      textStyle: { color: '#ffffff' },
      subtextStyle: { color: '#cccccc' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#cccccc' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#cccccc' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: '#cccccc' }, splitLine: { show: true, lineStyle: { color: ['#484753'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#ffffff' } },
    tooltip: { backgroundColor: 'rgba(50,50,50,0.9)', borderColor: '#9b8bba', textStyle: { color: '#fff' } }
  },
  halloween: {
    color: ['#ff715e', '#ffaf51', '#ffee51', '#8c6ac4', '#715c87'],
    backgroundColor: 'rgba(64,64,64,0.5)',
    textStyle: { color: '#ffaf51' },
    title: {
      textStyle: { color: '#ffaf51' },
      subtextStyle: { color: '#eeeeee' }
    },
    categoryAxis: { axisLine: { show: true, lineStyle: { color: '#eeeeee' } }, axisTick: { show: false }, axisLabel: { show: true, color: '#eeeeee' }, splitLine: { show: false }, splitArea: { show: false } },
    valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: true, color: '#eeeeee' }, splitLine: { show: true, lineStyle: { color: ['#aaaaaa'] } }, splitArea: { show: false } },
    legend: { textStyle: { color: '#eeeeee' } },
    tooltip: { backgroundColor: 'rgba(50,50,50,0.9)', borderColor: '#ffaf51', textStyle: { color: '#fff' } }
  }
};

// Track registered themes
const registeredThemes = new Set(['default', 'dark', 'light']);

// Store for custom themes created at runtime
const customThemes = {};

/**
 * Register a theme with ECharts
 */
export function registerTheme(name, themeObj = null) {
  if (registeredThemes.has(name) && !themeObj) return true;

  const themeDef = themeObj || themeDefinitions[name];
  if (themeDef) {
    echarts.registerTheme(name, themeDef);
    registeredThemes.add(name);
    if (themeObj) {
      customThemes[name] = themeObj;
    }
    return true;
  }
  return false;
}

/**
 * Register all predefined themes
 */
export function registerAllThemes() {
  Object.keys(themeDefinitions).forEach(name => {
    registerTheme(name);
  });
}

/**
 * Get list of available themes
 */
export function getAvailableThemes() {
  return [
    { value: 'default', label: 'Default' },
    { value: 'dark', label: 'Dark' },
    ...Object.keys(themeDefinitions).map(name => ({
      value: name,
      label: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }))
  ];
}

/**
 * Check if a theme is registered
 */
export function isThemeRegistered(name) {
  return registeredThemes.has(name);
}

/**
 * Get theme definition by name
 */
export function getThemeDefinition(name) {
  if (name === 'default' || name === 'light') {
    return {
      color: defaultColorPalette,
      backgroundColor: 'transparent',
      textStyle: { color: '#333333' },
      title: { textStyle: { color: '#333333' }, subtextStyle: { color: '#aaaaaa' } },
      legend: { textStyle: { color: '#333333' } },
      tooltip: { backgroundColor: 'rgba(50,50,50,0.7)', borderColor: '#333', textStyle: { color: '#fff' } }
    };
  }
  if (name === 'dark') {
    return {
      color: defaultColorPalette,
      backgroundColor: '#100C2A',
      textStyle: { color: '#ffffff' },
      title: { textStyle: { color: '#ffffff' }, subtextStyle: { color: '#cccccc' } },
      legend: { textStyle: { color: '#eeeeee' } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#555', textStyle: { color: '#fff' } }
    };
  }
  return themeDefinitions[name] || customThemes[name] || null;
}

/**
 * Create a custom theme object from configuration
 */
export function createCustomTheme(config) {
  const theme = {
    color: config.colors || defaultColorPalette,
    backgroundColor: config.backgroundColor || 'transparent',
    textStyle: {
      color: config.textColor || '#333333',
      fontFamily: config.fontFamily || 'sans-serif',
      fontSize: config.fontSize || 12
    },
    title: {
      textStyle: {
        color: config.titleColor || config.textColor || '#333333',
        fontFamily: config.fontFamily || 'sans-serif',
        fontSize: config.titleFontSize || 18,
        fontWeight: 'bold'
      },
      subtextStyle: {
        color: config.subtitleColor || '#aaaaaa',
        fontFamily: config.fontFamily || 'sans-serif'
      }
    },
    legend: {
      textStyle: {
        color: config.legendTextColor || config.textColor || '#333333'
      }
    },
    tooltip: {
      backgroundColor: config.tooltipBgColor || 'rgba(50,50,50,0.7)',
      borderColor: config.tooltipBorderColor || '#333',
      textStyle: {
        color: config.tooltipTextColor || '#ffffff'
      }
    },
    categoryAxis: {
      axisLine: {
        show: config.showAxisLine !== false,
        lineStyle: { color: config.axisLineColor || '#333333' }
      },
      axisTick: {
        show: config.showAxisTick !== false,
        lineStyle: { color: config.axisLineColor || '#333333' }
      },
      axisLabel: {
        show: true,
        color: config.axisLabelColor || config.textColor || '#333333'
      },
      splitLine: {
        show: config.showSplitLine !== false,
        lineStyle: {
          color: config.splitLineColor || '#eeeeee',
          type: config.splitLineType || 'solid'
        }
      },
      splitArea: {
        show: config.showSplitArea || false
      }
    },
    valueAxis: {
      axisLine: {
        show: config.showAxisLine !== false,
        lineStyle: { color: config.axisLineColor || '#333333' }
      },
      axisTick: {
        show: config.showAxisTick !== false,
        lineStyle: { color: config.axisLineColor || '#333333' }
      },
      axisLabel: {
        show: true,
        color: config.axisLabelColor || config.textColor || '#333333'
      },
      splitLine: {
        show: config.showSplitLine !== false,
        lineStyle: {
          color: config.splitLineColor || '#eeeeee',
          type: config.splitLineType || 'solid'
        }
      },
      splitArea: {
        show: config.showSplitArea || false
      }
    }
  };

  return theme;
}

/**
 * Register a custom theme and return its name
 */
export function registerCustomTheme(config, name = null) {
  const themeName = name || `custom-${Date.now()}`;
  const themeObj = createCustomTheme(config);
  registerTheme(themeName, themeObj);
  return themeName;
}

export default themeDefinitions;
