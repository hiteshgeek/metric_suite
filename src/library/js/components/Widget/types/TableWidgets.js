/**
 * Table Widget Types
 * Various table styles for displaying tabular data
 */

import { WIDGET_TYPES } from '../constants.js';
import { Widget, WidgetFactory } from '../index.js';
import { formatNumber, debounce } from '../../Graph/utils.js';

/**
 * Base Table Widget - shared functionality
 */
export class BaseTableWidget extends Widget {
  _init() {
    super._init();
    this.container.classList.add('ms-widget--table');
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filters = {};
    this.currentPage = 1;
    this.expandedRows = new Set();
  }

  /**
   * Format cell value based on column configuration
   */
  _formatCellValue(value, column) {
    if (value === null || value === undefined) return '-';

    const format = column.format;
    if (!format) return String(value);

    switch (format) {
      case 'currency':
        return '$' + parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2 });
      case 'percentage':
        return parseFloat(value).toFixed(1) + '%';
      case 'number':
        return formatNumber(parseFloat(value));
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  /**
   * Render cell with special formatting
   */
  _renderCell(value, column, row) {
    const formattedValue = this._formatCellValue(value, column);

    // Conditional styling
    if (column.conditionalStyle && typeof value === 'number') {
      const { positive, negative, zero } = column.conditionalStyle;
      let style = zero || {};
      if (value > 0) style = positive || {};
      else if (value < 0) style = negative || {};

      const cssStyle = style.color ? `color: ${style.color}` : '';
      const prefix = style.prefix || '';
      return `<span style="${cssStyle}">${prefix}${formattedValue}</span>`;
    }

    // Badge rendering
    if (column.render === 'badge' && column.badgeColors) {
      const color = column.badgeColors[value] || '#6b7280';
      return `<span class="ms-table-widget__badge" style="background-color: ${color}20; color: ${color}">${value}</span>`;
    }

    // Progress bar rendering
    if (column.render === 'progressBar') {
      const percent = Math.min(Math.max(parseFloat(value) || 0, 0), 100);
      const color = column.progressColor || '#3b82f6';
      return `
        <div class="ms-table-widget__progress">
          <div class="ms-table-widget__progress-bar" style="width: ${percent}%; background-color: ${color}"></div>
          <span class="ms-table-widget__progress-text">${percent.toFixed(0)}%</span>
        </div>
      `;
    }

    // Icon rendering
    if (column.render === 'icon') {
      const iconMap = column.iconMap || {};
      const icon = iconMap[value] || 'fa-circle';
      const colorMap = column.iconColors || {};
      const color = colorMap[value] || '#6b7280';
      return `<i class="fa-solid ${icon}" style="color: ${color}"></i>`;
    }

    return formattedValue;
  }

  /**
   * Sort data by column
   */
  _sortData(data, column, direction) {
    return [...data].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Filter data by active filters
   */
  _filterData(data, filters) {
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key]).toLowerCase();
        return cellValue.includes(String(value).toLowerCase());
      });
    });
  }
}

/**
 * Basic Table Widget
 */
export class BasicTableWidget extends BaseTableWidget {
  static defaultConfig = {
    columns: [],
    data: [],
    striped: true,
    bordered: false,
    compact: false,
    hover: true,
    emptyText: 'No data available',
  };

  render() {
    const cfg = { ...BasicTableWidget.defaultConfig, ...this.config.config };
    const data = this.data ?? cfg.data;
    const columns = cfg.columns;

    if (!columns.length) {
      this.container.innerHTML = `<div class="ms-table-widget__empty">No columns configured</div>`;
      return this;
    }

    const tableClasses = [
      'ms-table-widget__table',
      cfg.striped ? 'ms-table-widget__table--striped' : '',
      cfg.bordered ? 'ms-table-widget__table--bordered' : '',
      cfg.compact ? 'ms-table-widget__table--compact' : '',
      cfg.hover ? 'ms-table-widget__table--hover' : '',
    ].filter(Boolean).join(' ');

    const headerHtml = columns.map(col => `
      <th style="${col.width ? `width: ${col.width}px` : ''}" class="${col.align ? `text-${col.align}` : ''}">
        ${col.label || col.key}
      </th>
    `).join('');

    const bodyHtml = data.length === 0
      ? `<tr><td colspan="${columns.length}" class="ms-table-widget__empty">${cfg.emptyText}</td></tr>`
      : data.map(row => `
          <tr>
            ${columns.map(col => `
              <td class="${col.align ? `text-${col.align}` : ''}">
                ${this._renderCell(row[col.key], col, row)}
              </td>
            `).join('')}
          </tr>
        `).join('');

    this.container.innerHTML = `
      <div class="ms-table-widget ms-table-widget--basic">
        ${this.config.title ? `<div class="ms-table-widget__header"><h3>${this.config.title}</h3></div>` : ''}
        <div class="ms-table-widget__wrapper">
          <table class="${tableClasses}">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      </div>
    `;

    return this;
  }
}

/**
 * Interactive Table Widget (sortable, filterable, searchable)
 */
export class InteractiveTableWidget extends BaseTableWidget {
  static defaultConfig = {
    columns: [],
    data: [],
    searchable: true,
    searchPlaceholder: 'Search...',
    defaultSort: null, // { column: 'name', direction: 'asc' }
    striped: true,
    hover: true,
    emptyText: 'No data found',
  };

  render() {
    const cfg = { ...InteractiveTableWidget.defaultConfig, ...this.config.config };
    let data = this.data ?? cfg.data;
    const columns = cfg.columns;

    // Apply default sort
    if (cfg.defaultSort && !this.sortColumn) {
      this.sortColumn = cfg.defaultSort.column;
      this.sortDirection = cfg.defaultSort.direction || 'asc';
    }

    // Apply sorting
    if (this.sortColumn) {
      data = this._sortData(data, this.sortColumn, this.sortDirection);
    }

    // Apply filters
    if (Object.keys(this.filters).length > 0) {
      data = this._filterData(data, this.filters);
    }

    const tableClasses = [
      'ms-table-widget__table',
      cfg.striped ? 'ms-table-widget__table--striped' : '',
      cfg.hover ? 'ms-table-widget__table--hover' : '',
    ].filter(Boolean).join(' ');

    const headerHtml = columns.map(col => {
      const isSorted = this.sortColumn === col.key;
      const sortIcon = isSorted
        ? (this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
        : 'fa-sort';
      const sortable = col.sortable !== false;

      return `
        <th style="${col.width ? `width: ${col.width}px` : ''}"
            class="${col.align ? `text-${col.align}` : ''} ${sortable ? 'sortable' : ''} ${isSorted ? 'sorted' : ''}"
            ${sortable ? `data-sort="${col.key}"` : ''}>
          <div class="ms-table-widget__th-content">
            <span>${col.label || col.key}</span>
            ${sortable ? `<i class="fa-solid ${sortIcon}"></i>` : ''}
          </div>
          ${col.filterable ? this._renderColumnFilter(col) : ''}
        </th>
      `;
    }).join('');

    const bodyHtml = data.length === 0
      ? `<tr><td colspan="${columns.length}" class="ms-table-widget__empty">${cfg.emptyText}</td></tr>`
      : data.map(row => `
          <tr>
            ${columns.map(col => `
              <td class="${col.align ? `text-${col.align}` : ''}">
                ${this._renderCell(row[col.key], col, row)}
              </td>
            `).join('')}
          </tr>
        `).join('');

    this.container.innerHTML = `
      <div class="ms-table-widget ms-table-widget--interactive">
        <div class="ms-table-widget__header">
          ${this.config.title ? `<h3>${this.config.title}</h3>` : ''}
          ${cfg.searchable ? `
            <div class="ms-table-widget__search">
              <i class="fa-solid fa-search"></i>
              <input type="text" placeholder="${cfg.searchPlaceholder}" id="${this.id}-search">
            </div>
          ` : ''}
        </div>
        <div class="ms-table-widget__wrapper">
          <table class="${tableClasses}">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      </div>
    `;

    this._bindInteractions();
    return this;
  }

  _renderColumnFilter(column) {
    if (column.filterType === 'select' && column.filterOptions) {
      const options = column.filterOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
      return `
        <select class="ms-table-widget__filter" data-filter="${column.key}">
          <option value="">All</option>
          ${options}
        </select>
      `;
    }
    return `<input type="text" class="ms-table-widget__filter" data-filter="${column.key}" placeholder="Filter...">`;
  }

  _bindInteractions() {
    // Sort handlers
    const sortHeaders = this.container.querySelectorAll('[data-sort]');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const column = th.dataset.sort;
        if (this.sortColumn === column) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = column;
          this.sortDirection = 'asc';
        }
        this.render();
      });
    });

    // Filter handlers
    const filterInputs = this.container.querySelectorAll('[data-filter]');
    const debouncedRender = debounce(() => this.render(), 300);
    filterInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        this.filters[e.target.dataset.filter] = e.target.value;
        debouncedRender();
      });
    });

    // Search handler
    const searchInput = this.container.querySelector(`#${this.id}-search`);
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        // Search across all searchable columns
        const searchTerm = e.target.value.toLowerCase();
        const cfg = this.config.config;
        cfg.columns.forEach(col => {
          if (col.searchable !== false) {
            this.filters[`__search_${col.key}`] = searchTerm;
          }
        });
        debouncedRender();
      });
    }
  }
}

/**
 * Paginated Table Widget
 */
export class PaginatedTableWidget extends InteractiveTableWidget {
  static defaultConfig = {
    ...InteractiveTableWidget.defaultConfig,
    pagination: {
      enabled: true,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showTotal: true,
      position: 'bottom',
    },
  };

  render() {
    const cfg = { ...PaginatedTableWidget.defaultConfig, ...this.config.config };
    let data = this.data ?? cfg.data;
    const columns = cfg.columns;
    const pagination = cfg.pagination;

    // Apply sorting
    if (this.sortColumn) {
      data = this._sortData(data, this.sortColumn, this.sortDirection);
    }

    // Apply filters
    if (Object.keys(this.filters).length > 0) {
      data = this._filterData(data, this.filters);
    }

    const totalItems = data.length;
    const pageSize = pagination.pageSize || 10;
    const totalPages = Math.ceil(totalItems / pageSize);
    this.currentPage = Math.min(this.currentPage, totalPages || 1);

    // Paginate data
    const startIndex = (this.currentPage - 1) * pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pageSize);

    const tableClasses = [
      'ms-table-widget__table',
      cfg.striped ? 'ms-table-widget__table--striped' : '',
      cfg.hover ? 'ms-table-widget__table--hover' : '',
    ].filter(Boolean).join(' ');

    const headerHtml = columns.map(col => {
      const isSorted = this.sortColumn === col.key;
      const sortIcon = isSorted
        ? (this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
        : 'fa-sort';
      const sortable = col.sortable !== false;

      return `
        <th class="${col.align ? `text-${col.align}` : ''} ${sortable ? 'sortable' : ''}"
            ${sortable ? `data-sort="${col.key}"` : ''}>
          ${col.label || col.key}
          ${sortable ? `<i class="fa-solid ${sortIcon}"></i>` : ''}
        </th>
      `;
    }).join('');

    const bodyHtml = paginatedData.length === 0
      ? `<tr><td colspan="${columns.length}" class="ms-table-widget__empty">${cfg.emptyText}</td></tr>`
      : paginatedData.map(row => `
          <tr>
            ${columns.map(col => `
              <td class="${col.align ? `text-${col.align}` : ''}">
                ${this._renderCell(row[col.key], col, row)}
              </td>
            `).join('')}
          </tr>
        `).join('');

    const paginationHtml = this._renderPagination(totalItems, totalPages, pageSize, pagination);

    this.container.innerHTML = `
      <div class="ms-table-widget ms-table-widget--paginated">
        <div class="ms-table-widget__header">
          ${this.config.title ? `<h3>${this.config.title}</h3>` : ''}
          ${cfg.searchable ? `
            <div class="ms-table-widget__search">
              <i class="fa-solid fa-search"></i>
              <input type="text" placeholder="${cfg.searchPlaceholder}" id="${this.id}-search">
            </div>
          ` : ''}
        </div>
        ${pagination.position === 'top' || pagination.position === 'both' ? paginationHtml : ''}
        <div class="ms-table-widget__wrapper">
          <table class="${tableClasses}">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
        ${pagination.position === 'bottom' || pagination.position === 'both' ? paginationHtml : ''}
      </div>
    `;

    this._bindInteractions();
    this._bindPagination(totalPages);
    return this;
  }

  _renderPagination(totalItems, totalPages, pageSize, pagination) {
    const start = (this.currentPage - 1) * pageSize + 1;
    const end = Math.min(this.currentPage * pageSize, totalItems);

    const pageSizeOptions = pagination.pageSizeOptions.map(size =>
      `<option value="${size}" ${size === pageSize ? 'selected' : ''}>${size}</option>`
    ).join('');

    return `
      <div class="ms-table-widget__pagination">
        ${pagination.showTotal ? `
          <div class="ms-table-widget__pagination-info">
            Showing ${start}-${end} of ${totalItems}
          </div>
        ` : ''}
        <div class="ms-table-widget__pagination-controls">
          <select class="ms-table-widget__page-size" data-page-size>
            ${pageSizeOptions}
          </select>
          <button class="ms-table-widget__page-btn" data-page="first" ${this.currentPage === 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button class="ms-table-widget__page-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="ms-table-widget__page-current">
            Page ${this.currentPage} of ${totalPages || 1}
          </span>
          <button class="ms-table-widget__page-btn" data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <button class="ms-table-widget__page-btn" data-page="last" ${this.currentPage === totalPages ? 'disabled' : ''}>
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  _bindPagination(totalPages) {
    // Page buttons
    const pageButtons = this.container.querySelectorAll('[data-page]');
    pageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.page;
        switch (action) {
          case 'first': this.currentPage = 1; break;
          case 'prev': this.currentPage = Math.max(1, this.currentPage - 1); break;
          case 'next': this.currentPage = Math.min(totalPages, this.currentPage + 1); break;
          case 'last': this.currentPage = totalPages; break;
        }
        this.render();
      });
    });

    // Page size selector
    const pageSizeSelect = this.container.querySelector('[data-page-size]');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.config.config.pagination.pageSize = parseInt(e.target.value);
        this.currentPage = 1;
        this.render();
      });
    }
  }
}

/**
 * Expandable Table Widget (rows can expand to show details)
 */
export class ExpandableTableWidget extends BaseTableWidget {
  static defaultConfig = {
    columns: [],
    data: [],
    expandable: {
      enabled: true,
      render: 'subTable', // subTable, custom, list
      subColumns: [],
    },
    striped: true,
    hover: true,
    emptyText: 'No data available',
  };

  render() {
    const cfg = { ...ExpandableTableWidget.defaultConfig, ...this.config.config };
    const data = this.data ?? cfg.data;
    const columns = cfg.columns;

    const tableClasses = [
      'ms-table-widget__table',
      cfg.striped ? 'ms-table-widget__table--striped' : '',
      cfg.hover ? 'ms-table-widget__table--hover' : '',
    ].filter(Boolean).join(' ');

    const headerHtml = `
      <th class="ms-table-widget__expand-col"></th>
      ${columns.map(col => `
        <th class="${col.align ? `text-${col.align}` : ''}">${col.label || col.key}</th>
      `).join('')}
    `;

    const bodyHtml = data.length === 0
      ? `<tr><td colspan="${columns.length + 1}" class="ms-table-widget__empty">${cfg.emptyText}</td></tr>`
      : data.map((row, index) => {
          const isExpanded = this.expandedRows.has(index);
          const expandContent = this._renderExpandedContent(row, cfg);

          return `
            <tr class="${isExpanded ? 'is-expanded' : ''}" data-row="${index}">
              <td class="ms-table-widget__expand-cell">
                <button class="ms-table-widget__expand-btn" data-expand="${index}">
                  <i class="fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
                </button>
              </td>
              ${columns.map(col => `
                <td class="${col.align ? `text-${col.align}` : ''}">
                  ${this._renderCell(row[col.key], col, row)}
                </td>
              `).join('')}
            </tr>
            ${isExpanded ? `
              <tr class="ms-table-widget__expanded-row">
                <td colspan="${columns.length + 1}">
                  <div class="ms-table-widget__expanded-content">${expandContent}</div>
                </td>
              </tr>
            ` : ''}
          `;
        }).join('');

    this.container.innerHTML = `
      <div class="ms-table-widget ms-table-widget--expandable">
        ${this.config.title ? `<div class="ms-table-widget__header"><h3>${this.config.title}</h3></div>` : ''}
        <div class="ms-table-widget__wrapper">
          <table class="${tableClasses}">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      </div>
    `;

    this._bindExpandHandlers();
    return this;
  }

  _renderExpandedContent(row, cfg) {
    const expandable = cfg.expandable;

    if (expandable.render === 'list' && row.details) {
      const items = Array.isArray(row.details) ? row.details : [row.details];
      return `
        <ul class="ms-table-widget__detail-list">
          ${items.map(item => `<li>${typeof item === 'object' ? JSON.stringify(item) : item}</li>`).join('')}
        </ul>
      `;
    }

    if (expandable.render === 'subTable' && expandable.subColumns && row.children) {
      const subHeaderHtml = expandable.subColumns.map(col =>
        `<th>${col.label || col.key}</th>`
      ).join('');
      const subBodyHtml = row.children.map(child =>
        `<tr>${expandable.subColumns.map(col =>
          `<td>${this._formatCellValue(child[col.key], col)}</td>`
        ).join('')}</tr>`
      ).join('');

      return `
        <table class="ms-table-widget__sub-table">
          <thead><tr>${subHeaderHtml}</tr></thead>
          <tbody>${subBodyHtml}</tbody>
        </table>
      `;
    }

    // Custom render or fallback
    if (row.expandContent) {
      return row.expandContent;
    }

    return '<em>No details available</em>';
  }

  _bindExpandHandlers() {
    const expandBtns = this.container.querySelectorAll('[data-expand]');
    expandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.expand);
        if (this.expandedRows.has(index)) {
          this.expandedRows.delete(index);
        } else {
          this.expandedRows.add(index);
        }
        this.render();
      });
    });
  }
}

/**
 * Editable Table Widget (inline editing)
 */
export class EditableTableWidget extends BaseTableWidget {
  static defaultConfig = {
    columns: [],
    data: [],
    actions: {
      add: true,
      delete: true,
      bulkEdit: false,
    },
    striped: true,
    hover: true,
    emptyText: 'No data available',
    onSave: null, // Callback for saving changes
  };

  constructor(container, config) {
    super(container, config);
    this.editingCell = null;
    this.changes = [];
  }

  render() {
    const cfg = { ...EditableTableWidget.defaultConfig, ...this.config.config };
    const data = this.data ?? cfg.data;
    const columns = cfg.columns;

    const tableClasses = [
      'ms-table-widget__table',
      cfg.striped ? 'ms-table-widget__table--striped' : '',
      cfg.hover ? 'ms-table-widget__table--hover' : '',
    ].filter(Boolean).join(' ');

    const headerHtml = `
      ${columns.map(col => `
        <th class="${col.align ? `text-${col.align}` : ''}">${col.label || col.key}</th>
      `).join('')}
      ${cfg.actions.delete ? '<th class="ms-table-widget__actions-col">Actions</th>' : ''}
    `;

    const bodyHtml = data.length === 0
      ? `<tr><td colspan="${columns.length + (cfg.actions.delete ? 1 : 0)}" class="ms-table-widget__empty">${cfg.emptyText}</td></tr>`
      : data.map((row, rowIndex) => `
          <tr data-row="${rowIndex}">
            ${columns.map((col, colIndex) => `
              <td class="${col.align ? `text-${col.align}` : ''} ${col.editable ? 'editable' : ''}"
                  ${col.editable ? `data-edit="${rowIndex}-${colIndex}" data-key="${col.key}"` : ''}>
                ${this._renderEditableCell(row[col.key], col, rowIndex, colIndex)}
              </td>
            `).join('')}
            ${cfg.actions.delete ? `
              <td class="ms-table-widget__actions-cell">
                <button class="ms-table-widget__action-btn ms-table-widget__action-btn--delete" data-delete="${rowIndex}">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            ` : ''}
          </tr>
        `).join('');

    this.container.innerHTML = `
      <div class="ms-table-widget ms-table-widget--editable">
        <div class="ms-table-widget__header">
          ${this.config.title ? `<h3>${this.config.title}</h3>` : ''}
          <div class="ms-table-widget__header-actions">
            ${cfg.actions.add ? `
              <button class="ms-btn ms-btn--sm ms-btn--primary" id="${this.id}-add">
                <i class="fa-solid fa-plus"></i> Add Row
              </button>
            ` : ''}
            ${this.changes.length > 0 ? `
              <button class="ms-btn ms-btn--sm ms-btn--secondary" id="${this.id}-save">
                <i class="fa-solid fa-save"></i> Save Changes (${this.changes.length})
              </button>
            ` : ''}
          </div>
        </div>
        <div class="ms-table-widget__wrapper">
          <table class="${tableClasses}">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </div>
      </div>
    `;

    this._bindEditHandlers();
    return this;
  }

  _renderEditableCell(value, column, rowIndex, colIndex) {
    const isEditing = this.editingCell === `${rowIndex}-${colIndex}`;

    if (!column.editable) {
      return this._formatCellValue(value, column);
    }

    if (isEditing) {
      if (column.inputType === 'select' && column.options) {
        const options = column.options.map(opt =>
          `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`
        ).join('');
        return `<select class="ms-table-widget__edit-input" data-save="${rowIndex}-${colIndex}">${options}</select>`;
      }
      return `<input type="${column.inputType || 'text'}" class="ms-table-widget__edit-input"
                     value="${value ?? ''}" data-save="${rowIndex}-${colIndex}" autofocus>`;
    }

    return `<span class="ms-table-widget__cell-value">${this._formatCellValue(value, column)}</span>`;
  }

  _bindEditHandlers() {
    // Click to edit
    const editableCells = this.container.querySelectorAll('[data-edit]');
    editableCells.forEach(cell => {
      cell.addEventListener('dblclick', () => {
        this.editingCell = cell.dataset.edit;
        this.render();
        const input = cell.querySelector('.ms-table-widget__edit-input');
        if (input) input.focus();
      });
    });

    // Save on blur/enter
    const editInputs = this.container.querySelectorAll('[data-save]');
    editInputs.forEach(input => {
      const saveCell = () => {
        const [rowIndex, colIndex] = input.dataset.save.split('-').map(Number);
        const key = this.container.querySelector(`[data-edit="${input.dataset.save}"]`).dataset.key;
        const oldValue = (this.data ?? this.config.config.data)[rowIndex][key];
        const newValue = input.value;

        if (oldValue !== newValue) {
          this.changes.push({ rowIndex, key, oldValue, newValue });
          (this.data ?? this.config.config.data)[rowIndex][key] = newValue;
        }

        this.editingCell = null;
        this.render();
      };

      input.addEventListener('blur', saveCell);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveCell();
        if (e.key === 'Escape') {
          this.editingCell = null;
          this.render();
        }
      });
    });

    // Delete row
    const deleteButtons = this.container.querySelectorAll('[data-delete]');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rowIndex = parseInt(btn.dataset.delete);
        const data = this.data ?? this.config.config.data;
        data.splice(rowIndex, 1);
        this.changes.push({ action: 'delete', rowIndex });
        this.render();
      });
    });

    // Add row
    const addBtn = this.container.querySelector(`#${this.id}-add`);
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newRow = {};
        this.config.config.columns.forEach(col => {
          newRow[col.key] = col.defaultValue ?? '';
        });
        const data = this.data ?? this.config.config.data;
        data.push(newRow);
        this.changes.push({ action: 'add', row: newRow });
        this.render();
      });
    }

    // Save changes
    const saveBtn = this.container.querySelector(`#${this.id}-save`);
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (this.config.config.onSave) {
          this.config.config.onSave(this.changes, this.data ?? this.config.config.data);
        }
        this.changes = [];
        this.render();
      });
    }
  }
}

// Register all table widgets
WidgetFactory.register(WIDGET_TYPES.TABLE_BASIC, BasicTableWidget);
WidgetFactory.register(WIDGET_TYPES.TABLE_INTERACTIVE, InteractiveTableWidget);
WidgetFactory.register(WIDGET_TYPES.TABLE_PAGINATED, PaginatedTableWidget);
WidgetFactory.register(WIDGET_TYPES.TABLE_EXPANDABLE, ExpandableTableWidget);
WidgetFactory.register(WIDGET_TYPES.TABLE_EDITABLE, EditableTableWidget);

