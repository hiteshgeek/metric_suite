/**
 * DataSourcePanel - Main panel for managing data sources
 * Supports SQL queries, CSV/JSON file upload, API endpoints, and clipboard paste
 */

import { createElement } from '../utils.js';
import FileUploader from './FileUploader.js';
import ApiConnector from './ApiConnector.js';
import ClipboardPaste from './ClipboardPaste.js';

/**
 * Data source types
 */
export const DATA_SOURCE_TYPES = {
  SQL: 'sql',
  CSV: 'csv',
  JSON: 'json',
  API: 'api',
  CLIPBOARD: 'clipboard',
  MANUAL: 'manual',
};

/**
 * DataSourcePanel class
 */
export default class DataSourcePanel {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.options = {
      onDataChange: null,
      onSourceTypeChange: null,
      showSqlEditor: true,
      showFileUpload: true,
      showApiConnector: true,
      showClipboard: true,
      ...options,
    };

    this.currentSourceType = DATA_SOURCE_TYPES.SQL;
    this.data = null;
    this.columns = [];

    // Sub-components
    this.fileUploader = null;
    this.apiConnector = null;
    this.clipboardPaste = null;

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-datasource-panel';

    // Source type selector tabs
    const tabsContainer = createElement('div', { className: 'ms-datasource-tabs' });

    const tabs = [
      { type: DATA_SOURCE_TYPES.SQL, label: 'SQL Query', icon: 'fa-database', show: this.options.showSqlEditor },
      { type: DATA_SOURCE_TYPES.CSV, label: 'CSV', icon: 'fa-file-csv', show: this.options.showFileUpload },
      { type: DATA_SOURCE_TYPES.JSON, label: 'JSON', icon: 'fa-file-code', show: this.options.showFileUpload },
      { type: DATA_SOURCE_TYPES.API, label: 'API', icon: 'fa-plug', show: this.options.showApiConnector },
      { type: DATA_SOURCE_TYPES.CLIPBOARD, label: 'Paste', icon: 'fa-clipboard', show: this.options.showClipboard },
    ];

    tabs.forEach(tab => {
      if (!tab.show) return;

      const tabBtn = createElement('button', {
        className: `ms-datasource-tab ${this.currentSourceType === tab.type ? 'active' : ''}`,
        'data-type': tab.type,
      }, [
        createElement('i', { className: `fas ${tab.icon}` }),
        createElement('span', {}, [tab.label]),
      ]);

      tabsContainer.appendChild(tabBtn);
    });

    this.container.appendChild(tabsContainer);

    // Content panels
    const contentContainer = createElement('div', { className: 'ms-datasource-content' });

    // SQL Panel (placeholder - will integrate with existing SchemaExplorer)
    const sqlPanel = createElement('div', {
      className: `ms-datasource-panel-content ${this.currentSourceType === DATA_SOURCE_TYPES.SQL ? 'active' : ''}`,
      'data-panel': DATA_SOURCE_TYPES.SQL,
    });
    sqlPanel.innerHTML = `
      <div class="ms-datasource-sql-placeholder">
        <p>SQL query editor is integrated with the Schema Explorer.</p>
        <p>Use the query panel on the left to write SQL queries.</p>
      </div>
    `;
    contentContainer.appendChild(sqlPanel);

    // CSV Panel
    const csvPanel = createElement('div', {
      className: `ms-datasource-panel-content ${this.currentSourceType === DATA_SOURCE_TYPES.CSV ? 'active' : ''}`,
      'data-panel': DATA_SOURCE_TYPES.CSV,
    });
    this.fileUploader = new FileUploader(csvPanel, {
      acceptTypes: '.csv',
      onDataLoaded: (data, columns) => this.handleDataLoaded(data, columns, DATA_SOURCE_TYPES.CSV),
    });
    contentContainer.appendChild(csvPanel);

    // JSON Panel
    const jsonPanel = createElement('div', {
      className: `ms-datasource-panel-content ${this.currentSourceType === DATA_SOURCE_TYPES.JSON ? 'active' : ''}`,
      'data-panel': DATA_SOURCE_TYPES.JSON,
    });
    const jsonUploader = new FileUploader(jsonPanel, {
      acceptTypes: '.json',
      parseAs: 'json',
      onDataLoaded: (data, columns) => this.handleDataLoaded(data, columns, DATA_SOURCE_TYPES.JSON),
    });
    contentContainer.appendChild(jsonPanel);

    // API Panel
    const apiPanel = createElement('div', {
      className: `ms-datasource-panel-content ${this.currentSourceType === DATA_SOURCE_TYPES.API ? 'active' : ''}`,
      'data-panel': DATA_SOURCE_TYPES.API,
    });
    this.apiConnector = new ApiConnector(apiPanel, {
      onDataLoaded: (data, columns) => this.handleDataLoaded(data, columns, DATA_SOURCE_TYPES.API),
    });
    contentContainer.appendChild(apiPanel);

    // Clipboard Panel
    const clipboardPanel = createElement('div', {
      className: `ms-datasource-panel-content ${this.currentSourceType === DATA_SOURCE_TYPES.CLIPBOARD ? 'active' : ''}`,
      'data-panel': DATA_SOURCE_TYPES.CLIPBOARD,
    });
    this.clipboardPaste = new ClipboardPaste(clipboardPanel, {
      onDataLoaded: (data, columns) => this.handleDataLoaded(data, columns, DATA_SOURCE_TYPES.CLIPBOARD),
    });
    contentContainer.appendChild(clipboardPanel);

    this.container.appendChild(contentContainer);

    // Data preview section
    const previewSection = createElement('div', { className: 'ms-datasource-preview' });
    previewSection.innerHTML = `
      <div class="ms-datasource-preview-header">
        <span class="ms-datasource-preview-title">Data Preview</span>
        <span class="ms-datasource-preview-info"></span>
      </div>
      <div class="ms-datasource-preview-table"></div>
    `;
    this.container.appendChild(previewSection);
  }

  attachEventListeners() {
    // Tab switching
    this.container.querySelectorAll('.ms-datasource-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.setSourceType(type);
      });
    });
  }

  setSourceType(type) {
    this.currentSourceType = type;

    // Update tabs
    this.container.querySelectorAll('.ms-datasource-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });

    // Update panels
    this.container.querySelectorAll('.ms-datasource-panel-content').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === type);
    });

    // Notify callback
    if (this.options.onSourceTypeChange) {
      this.options.onSourceTypeChange(type);
    }
  }

  handleDataLoaded(data, columns, sourceType) {
    this.data = data;
    this.columns = columns;

    // Update preview
    this.updatePreview();

    // Notify callback
    if (this.options.onDataChange) {
      this.options.onDataChange({
        data,
        columns,
        sourceType,
      });
    }
  }

  updatePreview() {
    const previewInfo = this.container.querySelector('.ms-datasource-preview-info');
    const previewTable = this.container.querySelector('.ms-datasource-preview-table');

    if (!this.data || this.data.length === 0) {
      previewInfo.textContent = 'No data loaded';
      previewTable.innerHTML = '<div class="ms-datasource-no-data">Load data from a source above</div>';
      return;
    }

    previewInfo.textContent = `${this.data.length} rows × ${this.columns.length} columns`;

    // Build preview table (show first 5 rows)
    const previewData = this.data.slice(0, 5);
    let tableHtml = '<table class="ms-datasource-table">';

    // Header
    tableHtml += '<thead><tr>';
    this.columns.forEach(col => {
      tableHtml += `<th>${this.escapeHtml(col)}</th>`;
    });
    tableHtml += '</tr></thead>';

    // Body
    tableHtml += '<tbody>';
    previewData.forEach(row => {
      tableHtml += '<tr>';
      this.columns.forEach(col => {
        const value = row[col] ?? '';
        tableHtml += `<td>${this.escapeHtml(String(value))}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    if (this.data.length > 5) {
      tableHtml += `<div class="ms-datasource-more">... and ${this.data.length - 5} more rows</div>`;
    }

    previewTable.innerHTML = tableHtml;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get current data
   */
  getData() {
    return {
      data: this.data,
      columns: this.columns,
      sourceType: this.currentSourceType,
    };
  }

  /**
   * Set data programmatically
   */
  setData(data, columns, sourceType = DATA_SOURCE_TYPES.MANUAL) {
    this.handleDataLoaded(data, columns, sourceType);
  }

  /**
   * Clear data
   */
  clearData() {
    this.data = null;
    this.columns = [];
    this.updatePreview();
  }

  /**
   * Destroy the panel
   */
  destroy() {
    if (this.fileUploader) this.fileUploader.destroy();
    if (this.apiConnector) this.apiConnector.destroy();
    if (this.clipboardPaste) this.clipboardPaste.destroy();
    this.container.innerHTML = '';
  }
}
