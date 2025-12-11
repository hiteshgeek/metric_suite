/**
 * ApiConnector - Connect to REST API endpoints
 */

import { createElement } from '../utils.js';

export default class ApiConnector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onDataLoaded: null,
      onError: null,
      savedEndpoints: [], // Previously saved endpoints
      ...options,
    };

    this.isLoading = false;
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-api-connector';

    this.container.innerHTML = `
      <div class="ms-api-form">
        <div class="ms-form-group">
          <label class="ms-label">Endpoint URL</label>
          <input type="text" class="ms-input ms-api-url" placeholder="https://api.example.com/data" />
        </div>

        <div class="ms-form-row">
          <div class="ms-form-group ms-form-group-half">
            <label class="ms-label">Method</label>
            <select class="ms-select ms-api-method">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div class="ms-form-group ms-form-group-half">
            <label class="ms-label">Response Format</label>
            <select class="ms-select ms-api-format">
              <option value="auto">Auto-detect</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>

        <div class="ms-api-advanced-toggle">
          <button class="ms-btn ms-btn-text ms-toggle-advanced">
            <i class="fas fa-cog"></i> Advanced Options
          </button>
        </div>

        <div class="ms-api-advanced hidden">
          <div class="ms-form-group">
            <label class="ms-label">Headers (JSON)</label>
            <textarea class="ms-textarea ms-api-headers" rows="3" placeholder='{"Authorization": "Bearer token"}'></textarea>
          </div>

          <div class="ms-form-group ms-api-body-group hidden">
            <label class="ms-label">Request Body (JSON)</label>
            <textarea class="ms-textarea ms-api-body" rows="4" placeholder='{"query": "..."}'></textarea>
          </div>

          <div class="ms-form-group">
            <label class="ms-label">Data Path (for nested JSON)</label>
            <input type="text" class="ms-input ms-api-datapath" placeholder="data.results" />
            <span class="ms-hint">Path to array in response (e.g., "data.items" or "response.records")</span>
          </div>

          <div class="ms-form-group">
            <label class="ms-label">Refresh Interval (seconds)</label>
            <input type="number" class="ms-input ms-api-refresh" placeholder="0 (manual only)" min="0" />
            <span class="ms-hint">Set > 0 for automatic refresh</span>
          </div>
        </div>

        <div class="ms-api-actions">
          <button class="ms-btn ms-btn-primary ms-fetch-btn">
            <i class="fas fa-download"></i> Fetch Data
          </button>
          <button class="ms-btn ms-btn-secondary ms-save-endpoint-btn">
            <i class="fas fa-save"></i> Save Endpoint
          </button>
        </div>
      </div>

      <div class="ms-api-status hidden">
        <div class="ms-api-status-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Fetching data...</span>
        </div>
        <div class="ms-api-status-success hidden">
          <i class="fas fa-check-circle"></i>
          <span class="ms-api-status-message"></span>
        </div>
        <div class="ms-api-status-error hidden">
          <i class="fas fa-exclamation-circle"></i>
          <span class="ms-api-status-message"></span>
        </div>
      </div>

      <div class="ms-api-saved hidden">
        <label class="ms-label">Saved Endpoints</label>
        <div class="ms-api-saved-list"></div>
      </div>
    `;

    // Populate saved endpoints
    this.renderSavedEndpoints();
  }

  attachEventListeners() {
    // Toggle advanced options
    this.container.querySelector('.ms-toggle-advanced').addEventListener('click', () => {
      this.container.querySelector('.ms-api-advanced').classList.toggle('hidden');
    });

    // Method change - show/hide body
    this.container.querySelector('.ms-api-method').addEventListener('change', (e) => {
      const bodyGroup = this.container.querySelector('.ms-api-body-group');
      if (e.target.value === 'POST') {
        bodyGroup.classList.remove('hidden');
      } else {
        bodyGroup.classList.add('hidden');
      }
    });

    // Fetch button
    this.container.querySelector('.ms-fetch-btn').addEventListener('click', () => {
      this.fetchData();
    });

    // Save endpoint
    this.container.querySelector('.ms-save-endpoint-btn').addEventListener('click', () => {
      this.saveEndpoint();
    });

    // Enter key on URL input
    this.container.querySelector('.ms-api-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.fetchData();
      }
    });
  }

  async fetchData() {
    const url = this.container.querySelector('.ms-api-url').value.trim();
    if (!url) {
      this.showError('Please enter a URL');
      return;
    }

    const method = this.container.querySelector('.ms-api-method').value;
    const format = this.container.querySelector('.ms-api-format').value;
    const headersText = this.container.querySelector('.ms-api-headers').value.trim();
    const bodyText = this.container.querySelector('.ms-api-body').value.trim();
    const dataPath = this.container.querySelector('.ms-api-datapath').value.trim();

    // Parse headers
    let headers = { 'Content-Type': 'application/json' };
    if (headersText) {
      try {
        headers = { ...headers, ...JSON.parse(headersText) };
      } catch (e) {
        this.showError('Invalid headers JSON');
        return;
      }
    }

    // Build request options
    const fetchOptions = { method, headers };
    if (method === 'POST' && bodyText) {
      try {
        fetchOptions.body = JSON.stringify(JSON.parse(bodyText));
      } catch (e) {
        this.showError('Invalid request body JSON');
        return;
      }
    }

    this.setLoading(true);

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let responseData;

      // Parse response based on format
      if (format === 'csv' || (format === 'auto' && contentType.includes('csv'))) {
        const text = await response.text();
        responseData = this.parseCSV(text);
      } else {
        const json = await response.json();
        responseData = this.extractData(json, dataPath);
      }

      const { data, columns } = responseData;

      this.showSuccess(`Loaded ${data.length} rows`);

      // Notify callback
      if (this.options.onDataLoaded) {
        this.options.onDataLoaded(data, columns);
      }
    } catch (error) {
      this.showError(error.message);
      if (this.options.onError) {
        this.options.onError(error);
      }
    } finally {
      this.setLoading(false);
    }
  }

  extractData(json, dataPath) {
    let data = json;

    // Navigate to data path
    if (dataPath) {
      const parts = dataPath.split('.');
      for (const part of parts) {
        if (data && typeof data === 'object') {
          data = data[part];
        } else {
          throw new Error(`Invalid data path: ${dataPath}`);
        }
      }
    }

    // Ensure array
    if (!Array.isArray(data)) {
      if (typeof data === 'object') {
        data = [data];
      } else {
        throw new Error('Response is not an array or object');
      }
    }

    if (data.length === 0) {
      throw new Error('No data found in response');
    }

    // Extract columns
    const columns = Object.keys(data[0]);

    return { data, columns };
  }

  parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty response');

    const columns = lines[0].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], ',');
      const row = {};
      columns.forEach((col, idx) => {
        row[col] = this.parseValue(values[idx]);
      });
      data.push(row);
    }

    return { data, columns };
  }

  parseCSVLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    values.push(current.trim());
    return values;
  }

  parseValue(value) {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (!isNaN(num) && value !== '') return num;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return String(value);
  }

  setLoading(loading) {
    this.isLoading = loading;
    const status = this.container.querySelector('.ms-api-status');
    const loadingEl = status.querySelector('.ms-api-status-loading');
    const successEl = status.querySelector('.ms-api-status-success');
    const errorEl = status.querySelector('.ms-api-status-error');

    status.classList.remove('hidden');
    loadingEl.classList.toggle('hidden', !loading);
    if (loading) {
      successEl.classList.add('hidden');
      errorEl.classList.add('hidden');
    }

    // Disable buttons
    this.container.querySelector('.ms-fetch-btn').disabled = loading;
  }

  showSuccess(message) {
    const status = this.container.querySelector('.ms-api-status');
    const successEl = status.querySelector('.ms-api-status-success');
    successEl.querySelector('.ms-api-status-message').textContent = message;
    successEl.classList.remove('hidden');
  }

  showError(message) {
    const status = this.container.querySelector('.ms-api-status');
    const errorEl = status.querySelector('.ms-api-status-error');
    errorEl.querySelector('.ms-api-status-message').textContent = message;
    errorEl.classList.remove('hidden');
    status.classList.remove('hidden');
  }

  saveEndpoint() {
    const url = this.container.querySelector('.ms-api-url').value.trim();
    if (!url) return;

    const endpoint = {
      url,
      method: this.container.querySelector('.ms-api-method').value,
      headers: this.container.querySelector('.ms-api-headers').value,
      body: this.container.querySelector('.ms-api-body').value,
      dataPath: this.container.querySelector('.ms-api-datapath').value,
      name: new URL(url).pathname.split('/').pop() || 'Endpoint',
    };

    // Add to saved (avoid duplicates)
    const exists = this.options.savedEndpoints.find(e => e.url === url);
    if (!exists) {
      this.options.savedEndpoints.push(endpoint);
      this.renderSavedEndpoints();
    }
  }

  renderSavedEndpoints() {
    const container = this.container.querySelector('.ms-api-saved');
    const list = container.querySelector('.ms-api-saved-list');

    if (this.options.savedEndpoints.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    list.innerHTML = '';

    this.options.savedEndpoints.forEach((endpoint, index) => {
      const item = createElement('div', { className: 'ms-api-saved-item' });
      item.innerHTML = `
        <span class="ms-api-saved-name">${endpoint.name}</span>
        <span class="ms-api-saved-url">${endpoint.url}</span>
        <button class="ms-btn ms-btn-icon ms-load-endpoint" data-index="${index}">
          <i class="fas fa-play"></i>
        </button>
        <button class="ms-btn ms-btn-icon ms-remove-endpoint" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      `;
      list.appendChild(item);
    });

    // Attach events
    list.querySelectorAll('.ms-load-endpoint').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.loadEndpoint(this.options.savedEndpoints[idx]);
      });
    });

    list.querySelectorAll('.ms-remove-endpoint').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.options.savedEndpoints.splice(idx, 1);
        this.renderSavedEndpoints();
      });
    });
  }

  loadEndpoint(endpoint) {
    this.container.querySelector('.ms-api-url').value = endpoint.url;
    this.container.querySelector('.ms-api-method').value = endpoint.method;
    this.container.querySelector('.ms-api-headers').value = endpoint.headers || '';
    this.container.querySelector('.ms-api-body').value = endpoint.body || '';
    this.container.querySelector('.ms-api-datapath').value = endpoint.dataPath || '';

    // Show advanced if needed
    if (endpoint.headers || endpoint.body || endpoint.dataPath) {
      this.container.querySelector('.ms-api-advanced').classList.remove('hidden');
    }

    // Auto-fetch
    this.fetchData();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
