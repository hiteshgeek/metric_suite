/**
 * QueryBuilder - Visual SQL Query Builder
 * Provides a drag-and-drop interface for building SQL queries
 * with two-way sync to SQL text editor
 */

import { createElement } from '../utils.js';
import FieldSelector from './FieldSelector.js';
import FilterBuilder from './FilterBuilder.js';
import AggregationSelector from './AggregationSelector.js';
import { parseSQL } from './SqlParser.js';
import { generateSQL } from './SqlGenerator.js';

export default class QueryBuilder {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.options = {
      tables: [], // Available tables [{name, columns: [{name, type}]}]
      onQueryChange: null,
      onSqlChange: null,
      showSqlPreview: true,
      syncWithEditor: true,
      ...options,
    };

    // Query state
    this.query = {
      select: [],
      from: '',
      joins: [],
      where: [],
      groupBy: [],
      orderBy: [],
      limit: null,
    };

    // Sub-components
    this.fieldSelector = null;
    this.filterBuilder = null;
    this.aggregationSelector = null;

    this.init();
  }

  init() {
    this.render();
    this.initComponents();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-query-builder';

    this.container.innerHTML = `
      <div class="ms-qb-header">
        <span class="ms-qb-title">Visual Query Builder</span>
        <div class="ms-qb-actions">
          <button class="ms-btn ms-btn-icon ms-qb-clear" title="Clear query">
            <i class="fas fa-eraser"></i>
          </button>
          <button class="ms-btn ms-btn-icon ms-qb-help" title="Help">
            <i class="fas fa-question-circle"></i>
          </button>
        </div>
      </div>

      <div class="ms-qb-content">
        <!-- Table Selection -->
        <div class="ms-qb-section ms-qb-table-section">
          <div class="ms-qb-section-header">
            <i class="fas fa-database"></i>
            <span>FROM Table</span>
          </div>
          <div class="ms-qb-section-content">
            <select class="ms-select ms-qb-table-select">
              <option value="">Select a table...</option>
            </select>
          </div>
        </div>

        <!-- Field Selection -->
        <div class="ms-qb-section ms-qb-fields-section">
          <div class="ms-qb-section-header">
            <i class="fas fa-columns"></i>
            <span>SELECT Fields</span>
          </div>
          <div class="ms-qb-section-content">
            <div class="ms-qb-field-selector"></div>
          </div>
        </div>

        <!-- Joins -->
        <div class="ms-qb-section ms-qb-joins-section">
          <div class="ms-qb-section-header ms-qb-collapsible" data-section="joins">
            <i class="fas fa-link"></i>
            <span>JOIN Tables</span>
            <i class="fas fa-chevron-down ms-qb-collapse-icon"></i>
          </div>
          <div class="ms-qb-section-content ms-qb-collapsible-content collapsed">
            <div class="ms-qb-joins-list"></div>
            <button class="ms-btn ms-btn-text ms-qb-add-join">
              <i class="fas fa-plus"></i> Add Join
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="ms-qb-section ms-qb-filters-section">
          <div class="ms-qb-section-header ms-qb-collapsible" data-section="filters">
            <i class="fas fa-filter"></i>
            <span>WHERE Filters</span>
            <i class="fas fa-chevron-down ms-qb-collapse-icon"></i>
          </div>
          <div class="ms-qb-section-content ms-qb-collapsible-content collapsed">
            <div class="ms-qb-filter-builder"></div>
          </div>
        </div>

        <!-- Group By -->
        <div class="ms-qb-section ms-qb-groupby-section">
          <div class="ms-qb-section-header ms-qb-collapsible" data-section="groupby">
            <i class="fas fa-layer-group"></i>
            <span>GROUP BY</span>
            <i class="fas fa-chevron-down ms-qb-collapse-icon"></i>
          </div>
          <div class="ms-qb-section-content ms-qb-collapsible-content collapsed">
            <div class="ms-qb-aggregation-selector"></div>
          </div>
        </div>

        <!-- Order By -->
        <div class="ms-qb-section ms-qb-orderby-section">
          <div class="ms-qb-section-header ms-qb-collapsible" data-section="orderby">
            <i class="fas fa-sort"></i>
            <span>ORDER BY</span>
            <i class="fas fa-chevron-down ms-qb-collapse-icon"></i>
          </div>
          <div class="ms-qb-section-content ms-qb-collapsible-content collapsed">
            <div class="ms-qb-orderby-list"></div>
            <button class="ms-btn ms-btn-text ms-qb-add-orderby">
              <i class="fas fa-plus"></i> Add Sorting
            </button>
          </div>
        </div>

        <!-- Limit -->
        <div class="ms-qb-section ms-qb-limit-section">
          <div class="ms-qb-section-header">
            <i class="fas fa-hashtag"></i>
            <span>LIMIT</span>
          </div>
          <div class="ms-qb-section-content">
            <input type="number" class="ms-input ms-qb-limit" placeholder="No limit" min="1" />
          </div>
        </div>
      </div>

      <!-- SQL Preview -->
      <div class="ms-qb-sql-preview ${this.options.showSqlPreview ? '' : 'hidden'}">
        <div class="ms-qb-sql-header">
          <span>Generated SQL</span>
          <button class="ms-btn ms-btn-icon ms-qb-copy-sql" title="Copy SQL">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <pre class="ms-qb-sql-code"></pre>
      </div>
    `;

    // Populate table select
    this.populateTableSelect();
  }

  initComponents() {
    // Field Selector
    this.fieldSelector = new FieldSelector(
      this.container.querySelector('.ms-qb-field-selector'),
      {
        columns: [],
        onSelectionChange: (fields) => this.handleFieldsChange(fields),
      }
    );

    // Filter Builder
    this.filterBuilder = new FilterBuilder(
      this.container.querySelector('.ms-qb-filter-builder'),
      {
        columns: [],
        onFiltersChange: (filters) => this.handleFiltersChange(filters),
      }
    );

    // Aggregation Selector
    this.aggregationSelector = new AggregationSelector(
      this.container.querySelector('.ms-qb-aggregation-selector'),
      {
        columns: [],
        onAggregationChange: (aggregation) => this.handleAggregationChange(aggregation),
      }
    );
  }

  attachEventListeners() {
    // Table select
    this.container.querySelector('.ms-qb-table-select').addEventListener('change', (e) => {
      this.handleTableChange(e.target.value);
    });

    // Collapsible sections
    this.container.querySelectorAll('.ms-qb-collapsible').forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.ms-qb-collapse-icon');
        content.classList.toggle('collapsed');
        icon.classList.toggle('rotated');
      });
    });

    // Add Join button
    this.container.querySelector('.ms-qb-add-join').addEventListener('click', () => {
      this.addJoin();
    });

    // Add Order By button
    this.container.querySelector('.ms-qb-add-orderby').addEventListener('click', () => {
      this.addOrderBy();
    });

    // Limit input
    this.container.querySelector('.ms-qb-limit').addEventListener('change', (e) => {
      this.query.limit = e.target.value ? parseInt(e.target.value) : null;
      this.updateQuery();
    });

    // Clear button
    this.container.querySelector('.ms-qb-clear').addEventListener('click', () => {
      this.clearQuery();
    });

    // Copy SQL button
    this.container.querySelector('.ms-qb-copy-sql').addEventListener('click', () => {
      this.copySQL();
    });
  }

  populateTableSelect() {
    const select = this.container.querySelector('.ms-qb-table-select');
    select.innerHTML = '<option value="">Select a table...</option>';

    this.options.tables.forEach(table => {
      const option = document.createElement('option');
      option.value = table.name;
      option.textContent = table.name;
      select.appendChild(option);
    });
  }

  handleTableChange(tableName) {
    this.query.from = tableName;

    // Get columns for selected table
    const table = this.options.tables.find(t => t.name === tableName);
    const columns = table ? table.columns : [];

    // Update sub-components with new columns
    this.fieldSelector.setColumns(columns);
    this.filterBuilder.setColumns(columns);
    this.aggregationSelector.setColumns(columns);

    // Clear joins list (need to re-select join tables)
    this.container.querySelector('.ms-qb-joins-list').innerHTML = '';
    this.query.joins = [];

    // Clear order by list
    this.container.querySelector('.ms-qb-orderby-list').innerHTML = '';
    this.query.orderBy = [];

    this.updateQuery();
  }

  handleFieldsChange(fields) {
    this.query.select = fields;
    this.updateQuery();
  }

  handleFiltersChange(filters) {
    this.query.where = filters;
    this.updateQuery();
  }

  handleAggregationChange(aggregation) {
    this.query.groupBy = aggregation.groupBy || [];
    // Update select with aggregated fields
    if (aggregation.aggregatedFields) {
      // Merge selected fields with aggregated
      const regularFields = this.query.select.filter(f => !f.aggregate);
      this.query.select = [...regularFields, ...aggregation.aggregatedFields];
    }
    this.updateQuery();
  }

  addJoin() {
    const joinsList = this.container.querySelector('.ms-qb-joins-list');
    const joinId = `join-${Date.now()}`;

    const joinEl = createElement('div', {
      className: 'ms-qb-join-item',
      'data-id': joinId,
    });

    // Build table options
    const tableOptions = this.options.tables
      .filter(t => t.name !== this.query.from)
      .map(t => `<option value="${t.name}">${t.name}</option>`)
      .join('');

    joinEl.innerHTML = `
      <div class="ms-qb-join-row">
        <select class="ms-select ms-qb-join-type">
          <option value="INNER">INNER JOIN</option>
          <option value="LEFT">LEFT JOIN</option>
          <option value="RIGHT">RIGHT JOIN</option>
        </select>
        <select class="ms-select ms-qb-join-table">
          <option value="">Select table...</option>
          ${tableOptions}
        </select>
        <button class="ms-btn ms-btn-icon ms-qb-remove-join" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ms-qb-join-on hidden">
        <span>ON</span>
        <select class="ms-select ms-qb-join-left-col"></select>
        <span>=</span>
        <select class="ms-select ms-qb-join-right-col"></select>
      </div>
    `;

    joinsList.appendChild(joinEl);

    // Attach events
    const joinTypeSelect = joinEl.querySelector('.ms-qb-join-type');
    const joinTableSelect = joinEl.querySelector('.ms-qb-join-table');
    const removeBtn = joinEl.querySelector('.ms-qb-remove-join');
    const leftColSelect = joinEl.querySelector('.ms-qb-join-left-col');
    const rightColSelect = joinEl.querySelector('.ms-qb-join-right-col');
    const joinOn = joinEl.querySelector('.ms-qb-join-on');

    joinTableSelect.addEventListener('change', () => {
      const tableName = joinTableSelect.value;
      if (tableName) {
        // Show ON clause
        joinOn.classList.remove('hidden');

        // Populate left columns (from main table)
        const mainTable = this.options.tables.find(t => t.name === this.query.from);
        leftColSelect.innerHTML = (mainTable?.columns || [])
          .map(c => `<option value="${this.query.from}.${c.name}">${this.query.from}.${c.name}</option>`)
          .join('');

        // Populate right columns (from joined table)
        const joinTable = this.options.tables.find(t => t.name === tableName);
        rightColSelect.innerHTML = (joinTable?.columns || [])
          .map(c => `<option value="${tableName}.${c.name}">${tableName}.${c.name}</option>`)
          .join('');
      } else {
        joinOn.classList.add('hidden');
      }
      this.updateJoins();
    });

    joinTypeSelect.addEventListener('change', () => this.updateJoins());
    leftColSelect.addEventListener('change', () => this.updateJoins());
    rightColSelect.addEventListener('change', () => this.updateJoins());

    removeBtn.addEventListener('click', () => {
      joinEl.remove();
      this.updateJoins();
    });
  }

  updateJoins() {
    const joins = [];
    this.container.querySelectorAll('.ms-qb-join-item').forEach(joinEl => {
      const type = joinEl.querySelector('.ms-qb-join-type').value;
      const table = joinEl.querySelector('.ms-qb-join-table').value;
      const leftCol = joinEl.querySelector('.ms-qb-join-left-col').value;
      const rightCol = joinEl.querySelector('.ms-qb-join-right-col').value;

      if (table && leftCol && rightCol) {
        joins.push({ type, table, leftCol, rightCol });
      }
    });
    this.query.joins = joins;
    this.updateQuery();
  }

  addOrderBy() {
    const orderByList = this.container.querySelector('.ms-qb-orderby-list');

    // Get available columns
    const mainTable = this.options.tables.find(t => t.name === this.query.from);
    const columns = mainTable?.columns || [];

    const orderEl = createElement('div', { className: 'ms-qb-orderby-item' });

    const columnOptions = columns
      .map(c => `<option value="${c.name}">${c.name}</option>`)
      .join('');

    orderEl.innerHTML = `
      <select class="ms-select ms-qb-orderby-col">
        <option value="">Select field...</option>
        ${columnOptions}
      </select>
      <select class="ms-select ms-qb-orderby-dir">
        <option value="ASC">Ascending</option>
        <option value="DESC">Descending</option>
      </select>
      <button class="ms-btn ms-btn-icon ms-qb-remove-orderby" title="Remove">
        <i class="fas fa-times"></i>
      </button>
    `;

    orderByList.appendChild(orderEl);

    // Attach events
    orderEl.querySelector('.ms-qb-orderby-col').addEventListener('change', () => this.updateOrderBy());
    orderEl.querySelector('.ms-qb-orderby-dir').addEventListener('change', () => this.updateOrderBy());
    orderEl.querySelector('.ms-qb-remove-orderby').addEventListener('click', () => {
      orderEl.remove();
      this.updateOrderBy();
    });
  }

  updateOrderBy() {
    const orderBy = [];
    this.container.querySelectorAll('.ms-qb-orderby-item').forEach(orderEl => {
      const column = orderEl.querySelector('.ms-qb-orderby-col').value;
      const direction = orderEl.querySelector('.ms-qb-orderby-dir').value;

      if (column) {
        orderBy.push({ column, direction });
      }
    });
    this.query.orderBy = orderBy;
    this.updateQuery();
  }

  updateQuery() {
    // Generate SQL
    const sql = generateSQL(this.query);

    // Update SQL preview
    if (this.options.showSqlPreview) {
      this.container.querySelector('.ms-qb-sql-code').textContent = sql;
    }

    // Notify callbacks
    if (this.options.onQueryChange) {
      this.options.onQueryChange(this.query);
    }

    if (this.options.onSqlChange) {
      this.options.onSqlChange(sql);
    }
  }

  /**
   * Set query from SQL string (two-way sync)
   */
  setFromSQL(sql) {
    try {
      const parsed = parseSQL(sql);
      this.query = parsed;
      this.syncUIFromQuery();
    } catch (error) {
      console.warn('Could not parse SQL:', error);
    }
  }

  /**
   * Sync UI controls from query object
   */
  syncUIFromQuery() {
    // Set table
    const tableSelect = this.container.querySelector('.ms-qb-table-select');
    tableSelect.value = this.query.from || '';
    if (this.query.from) {
      this.handleTableChange(this.query.from);
    }

    // Set fields
    this.fieldSelector.setSelectedFields(this.query.select);

    // Set filters
    this.filterBuilder.setFilters(this.query.where);

    // Set group by
    this.aggregationSelector.setGroupBy(this.query.groupBy);

    // Set limit
    const limitInput = this.container.querySelector('.ms-qb-limit');
    limitInput.value = this.query.limit || '';

    // Update SQL preview
    this.updateQuery();
  }

  /**
   * Get current SQL string
   */
  getSQL() {
    return generateSQL(this.query);
  }

  /**
   * Get query object
   */
  getQuery() {
    return { ...this.query };
  }

  /**
   * Set available tables
   */
  setTables(tables) {
    this.options.tables = tables;
    this.populateTableSelect();
  }

  /**
   * Clear the query
   */
  clearQuery() {
    this.query = {
      select: [],
      from: '',
      joins: [],
      where: [],
      groupBy: [],
      orderBy: [],
      limit: null,
    };

    // Reset UI
    this.container.querySelector('.ms-qb-table-select').value = '';
    this.container.querySelector('.ms-qb-limit').value = '';
    this.container.querySelector('.ms-qb-joins-list').innerHTML = '';
    this.container.querySelector('.ms-qb-orderby-list').innerHTML = '';

    this.fieldSelector.clear();
    this.filterBuilder.clear();
    this.aggregationSelector.clear();

    this.updateQuery();
  }

  /**
   * Copy SQL to clipboard
   */
  copySQL() {
    const sql = this.getSQL();
    navigator.clipboard.writeText(sql).then(() => {
      // Show feedback
      const copyBtn = this.container.querySelector('.ms-qb-copy-sql');
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 2000);
    });
  }

  destroy() {
    if (this.fieldSelector) this.fieldSelector.destroy();
    if (this.filterBuilder) this.filterBuilder.destroy();
    if (this.aggregationSelector) this.aggregationSelector.destroy();
    this.container.innerHTML = '';
  }
}
