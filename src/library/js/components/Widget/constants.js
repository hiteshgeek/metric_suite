/**
 * Widget Constants
 * Separated to avoid circular dependencies
 */

/**
 * Widget type definitions
 */
export const WIDGET_TYPES = {
  // Charts (using ECharts)
  CHART: 'chart',

  // Counters/KPIs
  COUNTER_SINGLE: 'counter-single',
  COUNTER_COMPARISON: 'counter-comparison',
  COUNTER_SPARKLINE: 'counter-sparkline',
  COUNTER_PROGRESS: 'counter-progress',
  COUNTER_GAUGE: 'counter-gauge',

  // Lists
  LIST_SIMPLE: 'list-simple',
  LIST_RANKED: 'list-ranked',
  LIST_GROUPED: 'list-grouped',
  LIST_AVATAR: 'list-avatar',
  LIST_TIMELINE: 'list-timeline',

  // Tables
  TABLE_BASIC: 'table-basic',
  TABLE_INTERACTIVE: 'table-interactive',
  TABLE_PAGINATED: 'table-paginated',
  TABLE_EXPANDABLE: 'table-expandable',
  TABLE_EDITABLE: 'table-editable',

  // Cards
  CARD_STAT: 'card-stat',
  CARD_INFO: 'card-info',
  CARD_PROGRESS: 'card-progress',
  CARD_TIMELINE: 'card-timeline',
};

/**
 * Widget categories for UI organization
 */
export const WIDGET_CATEGORIES = {
  charts: {
    label: 'Charts',
    icon: 'fa-solid fa-chart-bar',
    types: [WIDGET_TYPES.CHART],
  },
  counters: {
    label: 'Counters/KPIs',
    icon: 'fa-solid fa-hashtag',
    types: [
      WIDGET_TYPES.COUNTER_SINGLE,
      WIDGET_TYPES.COUNTER_COMPARISON,
      WIDGET_TYPES.COUNTER_SPARKLINE,
      WIDGET_TYPES.COUNTER_PROGRESS,
      WIDGET_TYPES.COUNTER_GAUGE,
    ],
  },
  lists: {
    label: 'Lists',
    icon: 'fa-solid fa-list',
    types: [
      WIDGET_TYPES.LIST_SIMPLE,
      WIDGET_TYPES.LIST_RANKED,
      WIDGET_TYPES.LIST_GROUPED,
      WIDGET_TYPES.LIST_AVATAR,
      WIDGET_TYPES.LIST_TIMELINE,
    ],
  },
  tables: {
    label: 'Tables',
    icon: 'fa-solid fa-table',
    types: [
      WIDGET_TYPES.TABLE_BASIC,
      WIDGET_TYPES.TABLE_INTERACTIVE,
      WIDGET_TYPES.TABLE_PAGINATED,
      WIDGET_TYPES.TABLE_EXPANDABLE,
      WIDGET_TYPES.TABLE_EDITABLE,
    ],
  },
  cards: {
    label: 'Cards',
    icon: 'fa-solid fa-id-card',
    types: [
      WIDGET_TYPES.CARD_STAT,
      WIDGET_TYPES.CARD_INFO,
      WIDGET_TYPES.CARD_PROGRESS,
      WIDGET_TYPES.CARD_TIMELINE,
    ],
  },
};

/**
 * Default widget configuration schema
 */
export const DEFAULT_WIDGET_CONFIG = {
  // Identity
  id: null,
  type: WIDGET_TYPES.COUNTER_SINGLE,
  title: '',
  description: '',

  // Layout (grid units)
  layout: {
    x: 0,
    y: 0,
    w: 4,
    h: 2,
    minW: 2,
    minH: 1,
  },

  // Data query
  query: {
    source: null,         // Dataset name or API endpoint
    rawQuery: '',         // SQL query string
    mapping: {},          // Result to widget mapping
    refresh: {
      enabled: false,
      interval: 30000,    // Milliseconds
    },
  },

  // Type-specific configuration
  config: {},

  // Styling
  style: {
    backgroundColor: null,
    borderRadius: 8,
    shadow: 'md',         // none, sm, md, lg
    padding: 16,
    border: null,
  },

  // Interactions
  interactions: {
    onClick: null,        // { action: 'drill-down', target: 'dashboard-2' }
    onHover: null,
  },
};

/**
 * Get widget type label for display
 */
export function getWidgetTypeLabel(type) {
  const labels = {
    [WIDGET_TYPES.CHART]: 'Chart',
    [WIDGET_TYPES.COUNTER_SINGLE]: 'Single Value Counter',
    [WIDGET_TYPES.COUNTER_COMPARISON]: 'Comparison Counter',
    [WIDGET_TYPES.COUNTER_SPARKLINE]: 'Sparkline Counter',
    [WIDGET_TYPES.COUNTER_PROGRESS]: 'Progress Counter',
    [WIDGET_TYPES.COUNTER_GAUGE]: 'Gauge Counter',
    [WIDGET_TYPES.LIST_SIMPLE]: 'Simple List',
    [WIDGET_TYPES.LIST_RANKED]: 'Ranked List',
    [WIDGET_TYPES.LIST_GROUPED]: 'Grouped List',
    [WIDGET_TYPES.LIST_AVATAR]: 'Avatar List',
    [WIDGET_TYPES.LIST_TIMELINE]: 'Timeline List',
    [WIDGET_TYPES.TABLE_BASIC]: 'Basic Table',
    [WIDGET_TYPES.TABLE_INTERACTIVE]: 'Interactive Table',
    [WIDGET_TYPES.TABLE_PAGINATED]: 'Paginated Table',
    [WIDGET_TYPES.TABLE_EXPANDABLE]: 'Expandable Table',
    [WIDGET_TYPES.TABLE_EDITABLE]: 'Editable Table',
    [WIDGET_TYPES.CARD_STAT]: 'Stat Card',
    [WIDGET_TYPES.CARD_INFO]: 'Info Card',
    [WIDGET_TYPES.CARD_PROGRESS]: 'Progress Card',
    [WIDGET_TYPES.CARD_TIMELINE]: 'Timeline Card',
  };
  return labels[type] || type;
}

/**
 * Get category for a widget type
 */
export function getWidgetCategory(type) {
  for (const [category, info] of Object.entries(WIDGET_CATEGORIES)) {
    if (info.types.includes(type)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Get available widget types for UI
 */
export function getAvailableWidgetTypes() {
  return Object.entries(WIDGET_TYPES).map(([key, value]) => ({
    value,
    label: getWidgetTypeLabel(value),
    category: getWidgetCategory(value),
  }));
}
