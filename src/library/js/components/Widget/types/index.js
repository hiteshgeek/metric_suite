/**
 * Widget Types Index
 * Exports all widget types and registers them with the factory
 */

// Import all widget types (this also registers them with the factory)
import './CounterWidgets.js';
import './ListWidgets.js';
import './TableWidgets.js';

// Re-export for external use
export * from './CounterWidgets.js';
export * from './ListWidgets.js';
export * from './TableWidgets.js';
