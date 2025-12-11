/**
 * ClipboardPaste - Handle data pasted from clipboard
 * Supports tabular data from Excel, Google Sheets, etc.
 */

import { createElement } from '../utils.js';

export default class ClipboardPaste {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onDataLoaded: null,
      onError: null,
      ...options,
    };

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-clipboard-paste';

    this.container.innerHTML = `
      <div class="ms-clipboard-area">
        <textarea
          class="ms-clipboard-textarea"
          placeholder="Paste data here from Excel, Google Sheets, or tab/comma separated text...

Example formats:
- Tab-separated (from Excel/Sheets)
- Comma-separated (CSV)
- JSON array

Tips:
- Press Ctrl+V to paste
- First row should contain column headers"
        ></textarea>
      </div>

      <div class="ms-clipboard-options">
        <div class="ms-form-row">
          <div class="ms-form-group ms-form-group-half">
            <label class="ms-label">Format</label>
            <select class="ms-select ms-clipboard-format">
              <option value="auto">Auto-detect</option>
              <option value="tsv">Tab-separated</option>
              <option value="csv">Comma-separated</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div class="ms-form-group ms-form-group-half">
            <label class="ms-checkbox">
              <input type="checkbox" class="ms-clipboard-header" checked />
              <span>First row is header</span>
            </label>
          </div>
        </div>
      </div>

      <div class="ms-clipboard-actions">
        <button class="ms-btn ms-btn-primary ms-parse-btn">
          <i class="fas fa-table"></i> Parse Data
        </button>
        <button class="ms-btn ms-btn-secondary ms-clear-btn">
          <i class="fas fa-eraser"></i> Clear
        </button>
      </div>

      <div class="ms-clipboard-status hidden">
        <div class="ms-clipboard-status-success hidden">
          <i class="fas fa-check-circle"></i>
          <span class="ms-clipboard-status-message"></span>
        </div>
        <div class="ms-clipboard-status-error hidden">
          <i class="fas fa-exclamation-circle"></i>
          <span class="ms-clipboard-status-message"></span>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const textarea = this.container.querySelector('.ms-clipboard-textarea');

    // Parse button
    this.container.querySelector('.ms-parse-btn').addEventListener('click', () => {
      this.parseData();
    });

    // Clear button
    this.container.querySelector('.ms-clear-btn').addEventListener('click', () => {
      textarea.value = '';
      this.hideStatus();
    });

    // Auto-parse on paste
    textarea.addEventListener('paste', () => {
      // Wait for paste to complete
      setTimeout(() => {
        this.parseData();
      }, 100);
    });

    // Keyboard shortcut
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.parseData();
      }
    });
  }

  parseData() {
    const text = this.container.querySelector('.ms-clipboard-textarea').value.trim();
    if (!text) {
      this.showError('Please paste some data first');
      return;
    }

    const format = this.container.querySelector('.ms-clipboard-format').value;
    const hasHeader = this.container.querySelector('.ms-clipboard-header').checked;

    try {
      let data, columns;

      // Detect or use specified format
      const detectedFormat = format === 'auto' ? this.detectFormat(text) : format;

      switch (detectedFormat) {
        case 'json':
          ({ data, columns } = this.parseJSON(text));
          break;
        case 'csv':
          ({ data, columns } = this.parseDelimited(text, ',', hasHeader));
          break;
        case 'tsv':
        default:
          ({ data, columns } = this.parseDelimited(text, '\t', hasHeader));
          break;
      }

      this.showSuccess(`Parsed ${data.length} rows × ${columns.length} columns`);

      // Notify callback
      if (this.options.onDataLoaded) {
        this.options.onDataLoaded(data, columns);
      }
    } catch (error) {
      this.showError(error.message);
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  detectFormat(text) {
    // Check for JSON
    const trimmed = text.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch (e) {
        // Not valid JSON
      }
    }

    // Count delimiters in first line
    const firstLine = text.split(/\r?\n/)[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;

    // If more tabs than commas, likely TSV (from Excel/Sheets)
    if (tabCount > commaCount && tabCount > 0) {
      return 'tsv';
    }

    // Default to CSV
    return 'csv';
  }

  parseJSON(text) {
    const parsed = JSON.parse(text);

    let data;
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (typeof parsed === 'object') {
      data = [parsed];
    } else {
      throw new Error('Invalid JSON format');
    }

    if (data.length === 0) {
      throw new Error('No data found in JSON');
    }

    const columns = Object.keys(data[0]);

    // Parse values
    data = data.map(row => {
      const parsed = {};
      columns.forEach(col => {
        parsed[col] = this.parseValue(row[col]);
      });
      return parsed;
    });

    return { data, columns };
  }

  parseDelimited(text, delimiter, hasHeader) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('No data to parse');
    }

    // Parse first line for headers or data
    const firstRow = this.parseLine(lines[0], delimiter);

    let columns, dataLines;

    if (hasHeader) {
      columns = firstRow.map(col => col.trim() || `Column ${columns?.length || 0}`);
      dataLines = lines.slice(1);
    } else {
      columns = firstRow.map((_, i) => `Column ${i + 1}`);
      dataLines = lines;
    }

    // Parse data rows
    const data = dataLines.map(line => {
      const values = this.parseLine(line, delimiter);
      const row = {};
      columns.forEach((col, i) => {
        row[col] = this.parseValue(values[i] || '');
      });
      return row;
    });

    return { data, columns };
  }

  parseLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    values.push(current);
    return values;
  }

  parseValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    // Clean up common Excel/Sheets artifacts
    let cleaned = String(value).trim();

    // Remove surrounding quotes
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // Try number
    const num = Number(cleaned);
    if (!isNaN(num) && cleaned !== '') {
      return num;
    }

    // Try boolean
    if (cleaned.toLowerCase() === 'true') return true;
    if (cleaned.toLowerCase() === 'false') return false;

    // Check for date patterns (basic)
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    ];

    for (const pattern of datePatterns) {
      if (pattern.test(cleaned)) {
        const date = new Date(cleaned);
        if (!isNaN(date.getTime())) {
          return cleaned; // Keep as string for now
        }
      }
    }

    return cleaned;
  }

  showSuccess(message) {
    const status = this.container.querySelector('.ms-clipboard-status');
    const successEl = status.querySelector('.ms-clipboard-status-success');
    const errorEl = status.querySelector('.ms-clipboard-status-error');

    status.classList.remove('hidden');
    successEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    successEl.querySelector('.ms-clipboard-status-message').textContent = message;
  }

  showError(message) {
    const status = this.container.querySelector('.ms-clipboard-status');
    const successEl = status.querySelector('.ms-clipboard-status-success');
    const errorEl = status.querySelector('.ms-clipboard-status-error');

    status.classList.remove('hidden');
    successEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorEl.querySelector('.ms-clipboard-status-message').textContent = message;
  }

  hideStatus() {
    this.container.querySelector('.ms-clipboard-status').classList.add('hidden');
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
