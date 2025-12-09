/**
 * Schema Explorer Component
 * Browse database tables, columns, keys, and relationships
 * Helps build queries with autocomplete
 */

import { generateId } from '../Graph/utils.js';

export class SchemaExplorer {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      console.error('[SchemaExplorer] Container not found');
      return;
    }

    this.options = {
      schemaEndpoint: options.schemaEndpoint || '/api/schema-cache.php',
      onTableSelect: options.onTableSelect || null,
      onColumnSelect: options.onColumnSelect || null,
      onInsertQuery: options.onInsertQuery || null,
      ...options
    };

    this.tables = [];
    this.relationships = {};
    this.selectedTable = null;
    this.tableDetails = {};

    this.init();
  }

  async init() {
    this.render();
    await this.loadTables();
    await this.loadRelationships();
  }

  render() {
    this.container.innerHTML = `
      <div class="ms-schema-explorer">
        <div class="ms-schema-explorer__header">
          <h3 class="ms-schema-explorer__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            Database Schema
          </h3>
          <button type="button" class="ms-schema-explorer__refresh" title="Refresh schema">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
          </button>
        </div>

        <div class="ms-schema-explorer__search">
          <input
            type="text"
            class="ms-input"
            placeholder="Search tables..."
            id="schema-search-${generateId()}"
          />
        </div>

        <div class="ms-schema-explorer__content">
          <div class="ms-schema-explorer__tables">
            <div class="ms-schema-explorer__loading">Loading tables...</div>
          </div>

          <div class="ms-schema-explorer__details" style="display: none;">
            <div class="ms-schema-explorer__details-content"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Search
    const searchInput = this.container.querySelector('.ms-schema-explorer__search input');
    searchInput?.addEventListener('input', (e) => this.filterTables(e.target.value));

    // Refresh
    const refreshBtn = this.container.querySelector('.ms-schema-explorer__refresh');
    refreshBtn?.addEventListener('click', () => this.refresh());
  }

  async loadTables() {
    const tablesContainer = this.container.querySelector('.ms-schema-explorer__tables');

    try {
      const response = await fetch(this.options.schemaEndpoint);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load tables');
      }

      this.tables = data.tables || [];
      this.databaseName = data.database;
      this.renderTables();

    } catch (error) {
      tablesContainer.innerHTML = `
        <div class="ms-schema-explorer__error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>${error.message}</span>
        </div>
      `;
    }
  }

  async loadRelationships() {
    try {
      const response = await fetch(`${this.options.schemaEndpoint}?relationships=1`);
      const data = await response.json();

      if (data.success) {
        this.relationships = data.map || {};
      }
    } catch (error) {
      console.error('[SchemaExplorer] Failed to load relationships:', error);
    }
  }

  renderTables() {
    const tablesContainer = this.container.querySelector('.ms-schema-explorer__tables');

    if (this.tables.length === 0) {
      tablesContainer.innerHTML = `
        <div class="ms-schema-explorer__empty">
          No tables found in database
        </div>
      `;
      return;
    }

    tablesContainer.innerHTML = `
      <div class="ms-schema-explorer__db-name">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        ${this.databaseName}
      </div>
      <ul class="ms-schema-explorer__table-list">
        ${this.tables.map(table => `
          <li class="ms-schema-explorer__table-item" data-table="${table.name}">
            <div class="ms-schema-explorer__table-name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
              <span>${table.name}</span>
              ${this.relationships[table.name] ? `
                <span class="ms-schema-explorer__fk-badge" title="Has foreign keys">FK</span>
              ` : ''}
            </div>
            <span class="ms-schema-explorer__row-count">${this.formatRowCount(table.row_count)}</span>
          </li>
        `).join('')}
      </ul>
    `;

    // Bind click events
    tablesContainer.querySelectorAll('.ms-schema-explorer__table-item').forEach(item => {
      item.addEventListener('click', () => this.selectTable(item.dataset.table));
    });
  }

  async selectTable(tableName) {
    // Update selected state
    this.container.querySelectorAll('.ms-schema-explorer__table-item').forEach(item => {
      item.classList.toggle('is-selected', item.dataset.table === tableName);
    });

    this.selectedTable = tableName;

    // Show details panel
    const detailsPanel = this.container.querySelector('.ms-schema-explorer__details');
    const detailsContent = this.container.querySelector('.ms-schema-explorer__details-content');
    detailsPanel.style.display = 'block';
    detailsContent.innerHTML = '<div class="ms-schema-explorer__loading">Loading...</div>';

    try {
      // Load table details if not cached
      if (!this.tableDetails[tableName]) {
        const response = await fetch(`${this.options.schemaEndpoint}?table=${encodeURIComponent(tableName)}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load table details');
        }

        this.tableDetails[tableName] = data;
      }

      this.renderTableDetails(tableName);

      if (this.options.onTableSelect) {
        this.options.onTableSelect(tableName, this.tableDetails[tableName]);
      }

    } catch (error) {
      detailsContent.innerHTML = `
        <div class="ms-schema-explorer__error">
          ${error.message}
        </div>
      `;
    }
  }

  renderTableDetails(tableName) {
    const details = this.tableDetails[tableName];
    const detailsContent = this.container.querySelector('.ms-schema-explorer__details-content');

    detailsContent.innerHTML = `
      <div class="ms-schema-explorer__table-header">
        <h4>${tableName}</h4>
        <div class="ms-schema-explorer__table-actions">
          <button type="button" class="ms-btn ms-btn--sm ms-btn--outline" data-action="select-all">
            SELECT *
          </button>
          <button type="button" class="ms-btn ms-btn--sm ms-btn--outline" data-action="copy-name">
            Copy Name
          </button>
        </div>
      </div>

      <div class="ms-schema-explorer__section">
        <h5>Columns</h5>
        <ul class="ms-schema-explorer__columns">
          ${details.columns.map(col => `
            <li class="ms-schema-explorer__column" data-column="${col.name}">
              <div class="ms-schema-explorer__column-info">
                <span class="ms-schema-explorer__column-name">
                  ${col.key_type === 'PRI' ? '<span class="ms-schema-explorer__key-icon" title="Primary Key">🔑</span>' : ''}
                  ${col.key_type === 'MUL' ? '<span class="ms-schema-explorer__key-icon" title="Foreign Key">🔗</span>' : ''}
                  ${col.name}
                </span>
                <span class="ms-schema-explorer__column-type">${col.full_type}</span>
              </div>
              <button type="button" class="ms-schema-explorer__column-add" title="Add to query">+</button>
            </li>
          `).join('')}
        </ul>
      </div>

      ${details.foreignKeys.length > 0 ? `
        <div class="ms-schema-explorer__section">
          <h5>Foreign Keys</h5>
          <ul class="ms-schema-explorer__fk-list">
            ${details.foreignKeys.map(fk => `
              <li class="ms-schema-explorer__fk-item">
                <span class="ms-schema-explorer__fk-column">${fk.column_name}</span>
                <span class="ms-schema-explorer__fk-arrow">→</span>
                <span class="ms-schema-explorer__fk-ref">${fk.referenced_table}.${fk.referenced_column}</span>
                <button type="button" class="ms-btn ms-btn--sm ms-btn--ghost" data-action="add-join"
                  data-from="${tableName}" data-from-col="${fk.column_name}"
                  data-to="${fk.referenced_table}" data-to-col="${fk.referenced_column}">
                  JOIN
                </button>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${details.referencedBy.length > 0 ? `
        <div class="ms-schema-explorer__section">
          <h5>Referenced By</h5>
          <ul class="ms-schema-explorer__fk-list">
            ${details.referencedBy.map(ref => `
              <li class="ms-schema-explorer__fk-item">
                <span class="ms-schema-explorer__fk-ref">${ref.referencing_table}.${ref.referencing_column}</span>
                <span class="ms-schema-explorer__fk-arrow">→</span>
                <span class="ms-schema-explorer__fk-column">this</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${details.sampleData.length > 0 ? `
        <div class="ms-schema-explorer__section">
          <h5>Sample Data (${details.sampleData.length} rows)</h5>
          <div class="ms-schema-explorer__sample-data">
            <table>
              <thead>
                <tr>
                  ${Object.keys(details.sampleData[0]).map(col => `<th>${col}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${details.sampleData.map(row => `
                  <tr>
                    ${Object.values(row).map(val => `<td>${this.formatValue(val)}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    // Bind action events
    this.bindDetailsEvents(tableName, details);
  }

  bindDetailsEvents(tableName, details) {
    const detailsContent = this.container.querySelector('.ms-schema-explorer__details-content');

    // SELECT * button
    detailsContent.querySelector('[data-action="select-all"]')?.addEventListener('click', () => {
      const query = `SELECT * FROM \`${tableName}\` LIMIT 100`;
      if (this.options.onInsertQuery) {
        this.options.onInsertQuery(query);
      }
    });

    // Copy name button
    detailsContent.querySelector('[data-action="copy-name"]')?.addEventListener('click', () => {
      navigator.clipboard.writeText(tableName);
    });

    // Column click handlers
    detailsContent.querySelectorAll('.ms-schema-explorer__column').forEach(colEl => {
      const colName = colEl.dataset.column;

      // Click on column name
      colEl.querySelector('.ms-schema-explorer__column-name')?.addEventListener('click', () => {
        if (this.options.onColumnSelect) {
          this.options.onColumnSelect(tableName, colName, details.columns.find(c => c.name === colName));
        }
      });

      // Add button
      colEl.querySelector('.ms-schema-explorer__column-add')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.options.onInsertQuery) {
          this.options.onInsertQuery(`\`${tableName}\`.\`${colName}\``);
        }
      });
    });

    // JOIN buttons
    detailsContent.querySelectorAll('[data-action="add-join"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const joinQuery = `JOIN \`${btn.dataset.to}\` ON \`${btn.dataset.from}\`.\`${btn.dataset.fromCol}\` = \`${btn.dataset.to}\`.\`${btn.dataset.toCol}\``;
        if (this.options.onInsertQuery) {
          this.options.onInsertQuery(joinQuery);
        }
      });
    });
  }

  filterTables(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.container.querySelectorAll('.ms-schema-explorer__table-item').forEach(item => {
      const tableName = item.dataset.table.toLowerCase();
      item.style.display = tableName.includes(term) ? '' : 'none';
    });
  }

  async refresh() {
    this.tableDetails = {};
    this.selectedTable = null;

    const detailsPanel = this.container.querySelector('.ms-schema-explorer__details');
    detailsPanel.style.display = 'none';

    const tablesContainer = this.container.querySelector('.ms-schema-explorer__tables');
    tablesContainer.innerHTML = '<div class="ms-schema-explorer__loading">Loading tables...</div>';

    await this.loadTables();
    await this.loadRelationships();
  }

  formatRowCount(count) {
    if (count === null || count === undefined) return '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  formatValue(val) {
    if (val === null) return '<span class="null">NULL</span>';
    if (val === '') return '<span class="empty">""</span>';
    if (typeof val === 'string' && val.length > 50) {
      return `${val.substring(0, 47)}...`;
    }
    return String(val);
  }

  getSelectedTable() {
    return this.selectedTable;
  }

  getTableDetails(tableName) {
    return this.tableDetails[tableName] || null;
  }

  getTables() {
    return this.tables;
  }

  getRelationships() {
    return this.relationships;
  }
}
