/**
 * Utility functions for Graph components
 */

/**
 * Deep merge objects (arrays are replaced, not merged)
 */
export function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    // Arrays should be replaced, not merged
    if (Array.isArray(source[key])) {
      output[key] = [...source[key]];
    } else if (source[key] instanceof Object && key in target && target[key] instanceof Object && !Array.isArray(target[key])) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'ms') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function calls
 */
export function debounce(func, wait = 250) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Default color palette for charts
 */
export const defaultColors = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#6366f1', // Indigo
];

/**
 * Format number with locale
 */
export function formatNumber(value, options = {}) {
  const defaults = {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };
  return new Intl.NumberFormat('en-US', { ...defaults, ...options }).format(value);
}

/**
 * Create element with attributes
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}
