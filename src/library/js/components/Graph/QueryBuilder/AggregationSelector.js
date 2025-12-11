/**
 * AggregationSelector - Select GROUP BY and aggregate functions
 */

import { createElement } from '../utils.js';

export default class AggregationSelector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      columns: [],
      onAggregationChange: null,
      ...options,
    };

    this.groupByColumns = [];
    this.aggregatedFields = [];

    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-aggregation-selector';

    this.container.innerHTML = `
      <div class="ms-as-section">
        <div class="ms-as-label">Group By Columns</div>
        <div class="ms-as-groupby-list"></div>
        <button class="ms-btn ms-btn-text ms-as-add-groupby">
          <i class="fas fa-plus"></i> Add Group By
        </button>
      </div>

      <div class="ms-as-section">
        <div class="ms-as-label">Aggregated Fields</div>
        <div class="ms-as-aggregates-list"></div>
        <button class="ms-btn ms-btn-text ms-as-add-aggregate">
          <i class="fas fa-plus"></i> Add Aggregate
        </button>
      </div>
    `;

    // Attach events
    this.container.querySelector('.ms-as-add-groupby').addEventListener('click', () => {
      this.addGroupBy();
    });

    this.container.querySelector('.ms-as-add-aggregate').addEventListener('click', () => {
      this.addAggregate();
    });

    this.renderGroupBy();
    this.renderAggregates();
  }

  renderGroupBy() {
    const list = this.container.querySelector('.ms-as-groupby-list');
    list.innerHTML = '';

    if (this.groupByColumns.length === 0) {
      list.innerHTML = '<div class="ms-as-empty">No grouping applied</div>';
      return;
    }

    this.groupByColumns.forEach((column, index) => {
      const item = createElement('div', { className: 'ms-as-item' });

      const columnOptions = this.options.columns
        .map(c => `<option value="${c.name}" ${column === c.name ? 'selected' : ''}>${c.name}</option>`)
        .join('');

      item.innerHTML = `
        <select class="ms-select ms-as-groupby-col">
          <option value="">Select field...</option>
          ${columnOptions}
        </select>
        <button class="ms-btn ms-btn-icon ms-as-remove" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      `;

      list.appendChild(item);

      // Events
      item.querySelector('.ms-as-groupby-col').addEventListener('change', (e) => {
        this.groupByColumns[index] = e.target.value;
        this.notifyChange();
      });

      item.querySelector('.ms-as-remove').addEventListener('click', () => {
        this.groupByColumns.splice(index, 1);
        this.renderGroupBy();
        this.notifyChange();
      });
    });
  }

  renderAggregates() {
    const list = this.container.querySelector('.ms-as-aggregates-list');
    list.innerHTML = '';

    if (this.aggregatedFields.length === 0) {
      list.innerHTML = '<div class="ms-as-empty">No aggregations applied</div>';
      return;
    }

    this.aggregatedFields.forEach((agg, index) => {
      const item = createElement('div', { className: 'ms-as-item ms-as-aggregate-item' });

      const columnOptions = this.options.columns
        .map(c => `<option value="${c.name}" ${agg.column === c.name ? 'selected' : ''}>${c.name}</option>`)
        .join('');

      item.innerHTML = `
        <select class="ms-select ms-as-agg-func">
          <option value="COUNT" ${agg.function === 'COUNT' ? 'selected' : ''}>COUNT</option>
          <option value="SUM" ${agg.function === 'SUM' ? 'selected' : ''}>SUM</option>
          <option value="AVG" ${agg.function === 'AVG' ? 'selected' : ''}>AVG</option>
          <option value="MIN" ${agg.function === 'MIN' ? 'selected' : ''}>MIN</option>
          <option value="MAX" ${agg.function === 'MAX' ? 'selected' : ''}>MAX</option>
          <option value="COUNT DISTINCT" ${agg.function === 'COUNT DISTINCT' ? 'selected' : ''}>COUNT DISTINCT</option>
        </select>
        <span>(</span>
        <select class="ms-select ms-as-agg-col">
          <option value="*">*</option>
          ${columnOptions}
        </select>
        <span>)</span>
        <span>AS</span>
        <input type="text" class="ms-input ms-as-alias" placeholder="alias" value="${agg.alias || ''}" />
        <button class="ms-btn ms-btn-icon ms-as-remove" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      `;

      list.appendChild(item);

      // Events
      item.querySelector('.ms-as-agg-func').addEventListener('change', (e) => {
        this.aggregatedFields[index].function = e.target.value;
        this.updateDefaultAlias(index);
        this.notifyChange();
      });

      item.querySelector('.ms-as-agg-col').addEventListener('change', (e) => {
        this.aggregatedFields[index].column = e.target.value;
        this.updateDefaultAlias(index);
        this.notifyChange();
      });

      item.querySelector('.ms-as-alias').addEventListener('input', (e) => {
        this.aggregatedFields[index].alias = e.target.value;
        this.notifyChange();
      });

      item.querySelector('.ms-as-remove').addEventListener('click', () => {
        this.aggregatedFields.splice(index, 1);
        this.renderAggregates();
        this.notifyChange();
      });
    });
  }

  addGroupBy() {
    this.groupByColumns.push('');
    this.renderGroupBy();
  }

  addAggregate() {
    this.aggregatedFields.push({
      function: 'COUNT',
      column: '*',
      alias: 'count',
    });
    this.renderAggregates();
    this.notifyChange();
  }

  updateDefaultAlias(index) {
    const agg = this.aggregatedFields[index];
    if (!agg.alias || agg.alias === this.getDefaultAlias(agg)) {
      agg.alias = this.getDefaultAlias(agg);
      // Update input
      const items = this.container.querySelectorAll('.ms-as-aggregate-item');
      if (items[index]) {
        items[index].querySelector('.ms-as-alias').value = agg.alias;
      }
    }
  }

  getDefaultAlias(agg) {
    const func = agg.function.toLowerCase().replace(' ', '_');
    const col = agg.column === '*' ? '' : `_${agg.column}`;
    return `${func}${col}`;
  }

  setColumns(columns) {
    this.options.columns = columns;
    this.renderGroupBy();
    this.renderAggregates();
  }

  setGroupBy(columns) {
    this.groupByColumns = columns || [];
    this.renderGroupBy();
  }

  setAggregates(aggregates) {
    this.aggregatedFields = aggregates || [];
    this.renderAggregates();
  }

  getAggregation() {
    return {
      groupBy: this.groupByColumns.filter(c => c),
      aggregatedFields: this.aggregatedFields.map(agg => ({
        name: agg.column,
        aggregate: agg.function,
        alias: agg.alias,
      })),
    };
  }

  clear() {
    this.groupByColumns = [];
    this.aggregatedFields = [];
    this.renderGroupBy();
    this.renderAggregates();
    this.notifyChange();
  }

  notifyChange() {
    if (this.options.onAggregationChange) {
      this.options.onAggregationChange(this.getAggregation());
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
