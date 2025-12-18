/**
 * Widget Factory
 * Creates appropriate widget instance based on type
 */

import { WIDGET_TYPES } from './constants.js';
import { Widget } from './Widget.js';

/**
 * Widget Factory - creates appropriate widget instance based on type
 */
export class WidgetFactory {
  static registry = new Map();

  /**
   * Register a widget class for a type
   */
  static register(type, WidgetClass) {
    WidgetFactory.registry.set(type, WidgetClass);
  }

  /**
   * Create a widget instance
   */
  static create(container, config) {
    const type = config.type || WIDGET_TYPES.COUNTER_SINGLE;
    const WidgetClass = WidgetFactory.registry.get(type);

    if (!WidgetClass) {
      console.error(`Widget type '${type}' not registered`);
      return new Widget(container, config);
    }

    return new WidgetClass(container, config);
  }

  /**
   * Get all registered widget types
   */
  static getRegisteredTypes() {
    return Array.from(WidgetFactory.registry.keys());
  }

  /**
   * Check if a type is registered
   */
  static isRegistered(type) {
    return WidgetFactory.registry.has(type);
  }
}

export default WidgetFactory;
