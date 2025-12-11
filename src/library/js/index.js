/**
 * Metric Suite Library
 * Modular Dashboard Component Library
 */

// Graph Components
export { Graph } from './components/Graph/index.js';
export { GraphConfigurator } from './components/Graph/GraphConfigurator.js';
export { getAvailableTypes, getChartConfig } from './components/Graph/types/index.js';

// Counter Components
export { Counter } from './components/Counter/index.js';
export { CounterConfigurator } from './components/Counter/CounterConfigurator.js';

// Widget System
export {
  Widget,
  WidgetFactory,
  WIDGET_TYPES,
  WIDGET_CATEGORIES,
  DEFAULT_WIDGET_CONFIG,
  getWidgetTypeLabel,
  getAvailableWidgetTypes,
  getWidgetCategory,
} from './components/Widget/index.js';

// Widget Types
export * from './components/Widget/types/index.js';

// Widget Components
export { WidgetConfigurator } from './components/Widget/WidgetConfigurator.js';
export { QueryEngine } from './components/Widget/QueryEngine.js';
export { DashboardLayout } from './components/Widget/DashboardLayout.js';

// Schema Explorer
export { SchemaExplorer } from './components/SchemaExplorer/index.js';

// Color Palette
export { ColorPalette } from './components/ColorPalette/index.js';

// Preview Panel
export { PreviewPanel } from './components/PreviewPanel/index.js';

// Theme Switcher
export { ThemeSwitcher, initTheme, getEffectiveTheme } from './components/ThemeSwitcher/index.js';

// Utilities
export { defaultColors, debounce, deepMerge, generateId } from './components/Graph/utils.js';
