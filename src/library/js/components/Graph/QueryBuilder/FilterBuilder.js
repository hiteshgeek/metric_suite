/**
 * FilterBuilder - Build WHERE clause filters visually
 */

import { createElement } from '../utils.js';

export default class FilterBuilder {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      columns: [],
      onFiltersChange: null,
      ...options,
    };

    this.filters = [];
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-filter-builder';

    this.container.innerHTML = `
      <div class="ms-fb-filters"></div>
      <button class="ms-btn ms-btn-text ms-fb-add">
        <i class="fas fa-plus"></i> Add Filter
      </button>
    `;

    // Attach add button event
    this.container.querySelector('.ms-fb-add').addEventListener('click', () => {
      this.addFilter();
    });

    this.renderFilters();
  }

  renderFilters() {
    const filtersContainer = this.container.querySelector('.ms-fb-filters');
    filtersContainer.innerHTML = '';

    if (this.filters.length === 0) {
      filtersContainer.innerHTML = '<div class="ms-fb-empty">No filters applied</div>';
      return;
    }

    this.filters.forEach((filter, index) => {
      const filterEl = this.createFilterElement(filter, index);
      filtersContainer.appendChild(filterEl);
    });
  }

  createFilterElement(filter, index) {
    const filterEl = createElement('div', {
      className: 'ms-fb-filter',
      'data-index': index,
    });

    // Column options
    const columnOptions = this.options.columns
      .map(c => `<option value="${c.name}" ${filter.column === c.name ? 'selected' : ''}>${c.name}</option>`)
      .join('');

    // Operator options based on column type
    const operators = this.getOperatorsForType(filter.columnType);
    const operatorOptions = operators
      .map(op => `<option value="${op.value}" ${filter.operator === op.value ? 'selected' : ''}>${op.label}</option>`)
      .join('');

    // Conjunction (AND/OR) for filters after the first
    const conjunctionHtml = index > 0 ? `
      <select class="ms-select ms-select-sm ms-fb-conjunction">
        <option value="AND" ${filter.conjunction === 'AND' ? 'selected' : ''}>AND</option>
        <option value="OR" ${filter.conjunction === 'OR' ? 'selected' : ''}>OR</option>
      </select>
    ` : '';

    // Value input based on operator
    const valueHtml = this.getValueInput(filter);

    filterEl.innerHTML = `
      ${conjunctionHtml}
      <select class="ms-select ms-fb-column">
        <option value="">Select field...</option>
        ${columnOptions}
      </select>
      <select class="ms-select ms-fb-operator">
        ${operatorOptions}
      </select>
      <div class="ms-fb-value-container">
        ${valueHtml}
      </div>
      <button class="ms-btn ms-btn-icon ms-fb-remove" title="Remove filter">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Attach events
    this.attachFilterEvents(filterEl, index);

    return filterEl;
  }

  getValueInput(filter) {
    const { operator, value, columnType } = filter;

    // No value needed for IS NULL / IS NOT NULL
    if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
      return '';
    }

    // Between needs two values
    if (operator === 'BETWEEN') {
      const val1 = Array.isArray(value) ? value[0] : '';
      const val2 = Array.isArray(value) ? value[1] : '';
      return `
        <input type="text" class="ms-input ms-fb-value" placeholder="From" value="${this.escapeHtml(val1)}" data-index="0" />
        <span>and</span>
        <input type="text" class="ms-input ms-fb-value" placeholder="To" value="${this.escapeHtml(val2)}" data-index="1" />
      `;
    }

    // IN needs comma-separated values
    if (operator === 'IN' || operator === 'NOT IN') {
      const displayValue = Array.isArray(value) ? value.join(', ') : value || '';
      return `
        <input type="text" class="ms-input ms-fb-value" placeholder="value1, value2, ..." value="${this.escapeHtml(displayValue)}" />
      `;
    }

    // Date type
    if (columnType === 'date' || columnType === 'datetime') {
      return `
        <input type="date" class="ms-input ms-fb-value" value="${value || ''}" />
      `;
    }

    // Number type
    if (columnType === 'number' || columnType === 'int' || columnType === 'float') {
      return `
        <input type="number" class="ms-input ms-fb-value" placeholder="Value" value="${value || ''}" />
      `;
    }

    // Default text input
    return `
      <input type="text" class="ms-input ms-fb-value" placeholder="Value" value="${this.escapeHtml(value || '')}" />
    `;
  }

  getOperatorsForType(type) {
    const commonOps = [
      { value: '=', label: '=' },
      { value: '!=', label: '!=' },
      { value: 'IS NULL', label: 'IS NULL' },
      { value: 'IS NOT NULL', label: 'IS NOT NULL' },
    ];

    const numericOps = [
      { value: '>', label: '>' },
      { value: '>=', label: '>=' },
      { value: '<', label: '<' },
      { value: '<=', label: '<=' },
      { value: 'BETWEEN', label: 'BETWEEN' },
    ];

    const stringOps = [
      { value: 'LIKE', label: 'LIKE' },
      { value: 'NOT LIKE', label: 'NOT LIKE' },
      { value: 'IN', label: 'IN' },
      { value: 'NOT IN', label: 'NOT IN' },
    ];

    // Return operators based on type
    switch (type?.toLowerCase()) {
      case 'int':
      case 'integer':
      case 'bigint':
      case 'float':
      case 'double':
      case 'decimal':
      case 'number':
        return [...commonOps, ...numericOps, { value: 'IN', label: 'IN' }, { value: 'NOT IN', label: 'NOT IN' }];

      case 'date':
      case 'datetime':
      case 'timestamp':
        return [...commonOps, ...numericOps];

      case 'boolean':
      case 'bool':
        return commonOps;

      default:
        return [...commonOps, ...stringOps];
    }
  }

  attachFilterEvents(filterEl, index) {
    const columnSelect = filterEl.querySelector('.ms-fb-column');
    const operatorSelect = filterEl.querySelector('.ms-fb-operator');
    const valueContainer = filterEl.querySelector('.ms-fb-value-container');
    const removeBtn = filterEl.querySelector('.ms-fb-remove');
    const conjunctionSelect = filterEl.querySelector('.ms-fb-conjunction');

    // Column change
    columnSelect.addEventListener('change', () => {
      const column = columnSelect.value;
      const columnInfo = this.options.columns.find(c => c.name === column);

      this.filters[index].column = column;
      this.filters[index].columnType = columnInfo?.type || 'string';

      // Update operator options
      const operators = this.getOperatorsForType(this.filters[index].columnType);
      operatorSelect.innerHTML = operators
        .map(op => `<option value="${op.value}">${op.label}</option>`)
        .join('');

      this.filters[index].operator = operators[0]?.value || '=';
      this.filters[index].value = '';

      // Update value input
      valueContainer.innerHTML = this.getValueInput(this.filters[index]);
      this.attachValueEvents(valueContainer, index);

      this.notifyChange();
    });

    // Operator change
    operatorSelect.addEventListener('change', () => {
      this.filters[index].operator = operatorSelect.value;
      this.filters[index].value = this.filters[index].operator === 'BETWEEN' ? ['', ''] : '';

      // Update value input
      valueContainer.innerHTML = this.getValueInput(this.filters[index]);
      this.attachValueEvents(valueContainer, index);

      this.notifyChange();
    });

    // Value inputs
    this.attachValueEvents(valueContainer, index);

    // Conjunction change
    if (conjunctionSelect) {
      conjunctionSelect.addEventListener('change', () => {
        this.filters[index].conjunction = conjunctionSelect.value;
        this.notifyChange();
      });
    }

    // Remove
    removeBtn.addEventListener('click', () => {
      this.removeFilter(index);
    });
  }

  attachValueEvents(container, index) {
    const valueInputs = container.querySelectorAll('.ms-fb-value');

    valueInputs.forEach(input => {
      input.addEventListener('input', () => {
        const operator = this.filters[index].operator;

        if (operator === 'BETWEEN') {
          const inputIndex = parseInt(input.dataset.index);
          if (!Array.isArray(this.filters[index].value)) {
            this.filters[index].value = ['', ''];
          }
          this.filters[index].value[inputIndex] = input.value;
        } else if (operator === 'IN' || operator === 'NOT IN') {
          // Parse comma-separated values
          this.filters[index].value = input.value.split(',').map(v => v.trim()).filter(v => v);
        } else {
          this.filters[index].value = input.value;
        }

        this.notifyChange();
      });
    });
  }

  addFilter() {
    this.filters.push({
      column: '',
      columnType: 'string',
      operator: '=',
      value: '',
      conjunction: 'AND',
    });

    this.renderFilters();
  }

  removeFilter(index) {
    this.filters.splice(index, 1);
    this.renderFilters();
    this.notifyChange();
  }

  setColumns(columns) {
    this.options.columns = columns;
    this.renderFilters();
  }

  setFilters(filters) {
    this.filters = filters.map(f => ({
      column: f.column || '',
      columnType: f.columnType || 'string',
      operator: f.operator || '=',
      value: f.value || '',
      conjunction: f.conjunction || 'AND',
    }));
    this.renderFilters();
  }

  getFilters() {
    return this.filters.filter(f => f.column); // Only return filters with selected column
  }

  clear() {
    this.filters = [];
    this.renderFilters();
    this.notifyChange();
  }

  notifyChange() {
    if (this.options.onFiltersChange) {
      this.options.onFiltersChange(this.getFilters());
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
