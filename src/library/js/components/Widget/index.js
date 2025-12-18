/**
 * Widget Base System
 * Unified widget architecture for Dashboard components
 * Supports: Charts, Counters, Lists, Tables, Cards
 */

// Re-export constants
export {
  WIDGET_TYPES,
  WIDGET_CATEGORIES,
  DEFAULT_WIDGET_CONFIG,
  getWidgetTypeLabel,
  getWidgetCategory,
  getAvailableWidgetTypes,
} from './constants.js';

// Re-export Widget and WidgetFactory from separate files
export { Widget } from './Widget.js';
export { WidgetFactory } from './WidgetFactory.js';

// Re-export related modules
export { WidgetConfigurator } from './WidgetConfigurator.js';
export { QueryEngine } from './QueryEngine.js';
export { DashboardLayout } from './DashboardLayout.js';

// Default export
import { Widget } from './Widget.js';
export default Widget;
