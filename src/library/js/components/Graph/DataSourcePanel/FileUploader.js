/**
 * FileUploader - Handle CSV and JSON file uploads
 */

import { createElement } from '../utils.js';

export default class FileUploader {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      acceptTypes: '.csv,.json',
      parseAs: 'auto', // 'auto', 'csv', 'json'
      maxFileSize: 10 * 1024 * 1024, // 10MB
      onDataLoaded: null,
      onError: null,
      ...options,
    };

    this.currentFile = null;
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';

    // Drop zone
    const dropZone = createElement('div', { className: 'ms-file-dropzone' });
    dropZone.innerHTML = `
      <div class="ms-file-dropzone-content">
        <i class="fas fa-cloud-upload-alt ms-file-dropzone-icon"></i>
        <p class="ms-file-dropzone-text">Drag & drop your file here</p>
        <p class="ms-file-dropzone-subtext">or click to browse</p>
        <input type="file" class="ms-file-input" accept="${this.options.acceptTypes}" />
      </div>
    `;
    this.container.appendChild(dropZone);
    this.dropZone = dropZone;

    // File info
    const fileInfo = createElement('div', { className: 'ms-file-info hidden' });
    fileInfo.innerHTML = `
      <div class="ms-file-info-header">
        <i class="fas fa-file ms-file-icon"></i>
        <span class="ms-file-name"></span>
        <button class="ms-file-remove" title="Remove file">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ms-file-info-details">
        <span class="ms-file-size"></span>
        <span class="ms-file-type"></span>
      </div>
    `;
    this.container.appendChild(fileInfo);
    this.fileInfo = fileInfo;

    // Parse options (for CSV)
    const parseOptions = createElement('div', { className: 'ms-file-parse-options hidden' });
    parseOptions.innerHTML = `
      <div class="ms-form-group">
        <label class="ms-label">Delimiter</label>
        <select class="ms-select ms-csv-delimiter">
          <option value=",">Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="\t">Tab</option>
          <option value="|">Pipe (|)</option>
        </select>
      </div>
      <div class="ms-form-group">
        <label class="ms-checkbox">
          <input type="checkbox" class="ms-csv-header" checked />
          <span>First row is header</span>
        </label>
      </div>
      <button class="ms-btn ms-btn-primary ms-parse-btn">Parse Data</button>
    `;
    this.container.appendChild(parseOptions);
    this.parseOptions = parseOptions;

    // Error message
    const errorMsg = createElement('div', { className: 'ms-file-error hidden' });
    this.container.appendChild(errorMsg);
    this.errorMsg = errorMsg;
  }

  attachEventListeners() {
    const fileInput = this.container.querySelector('.ms-file-input');

    // Click to browse
    this.dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });

    // Drag and drop
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('dragover');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('dragover');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleFile(e.dataTransfer.files[0]);
      }
    });

    // Remove file
    this.container.querySelector('.ms-file-remove').addEventListener('click', () => {
      this.clearFile();
    });

    // Parse button
    this.container.querySelector('.ms-parse-btn').addEventListener('click', () => {
      this.parseFile();
    });
  }

  handleFile(file) {
    // Validate file size
    if (file.size > this.options.maxFileSize) {
      this.showError(`File too large. Maximum size is ${this.formatFileSize(this.options.maxFileSize)}`);
      return;
    }

    // Validate file type
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'json'].includes(extension)) {
      this.showError('Invalid file type. Please upload a CSV or JSON file.');
      return;
    }

    this.currentFile = file;
    this.hideError();

    // Update UI
    this.dropZone.classList.add('hidden');
    this.fileInfo.classList.remove('hidden');
    this.fileInfo.querySelector('.ms-file-name').textContent = file.name;
    this.fileInfo.querySelector('.ms-file-size').textContent = this.formatFileSize(file.size);
    this.fileInfo.querySelector('.ms-file-type').textContent = extension.toUpperCase();

    // Update icon
    const icon = this.fileInfo.querySelector('.ms-file-icon');
    icon.className = `fas ms-file-icon ${extension === 'csv' ? 'fa-file-csv' : 'fa-file-code'}`;

    // Show parse options for CSV
    if (extension === 'csv') {
      this.parseOptions.classList.remove('hidden');
    } else {
      this.parseOptions.classList.add('hidden');
      // Auto-parse JSON
      this.parseFile();
    }
  }

  async parseFile() {
    if (!this.currentFile) return;

    const extension = this.currentFile.name.split('.').pop().toLowerCase();

    try {
      const text = await this.readFileAsText(this.currentFile);

      let data, columns;

      if (extension === 'csv' || this.options.parseAs === 'csv') {
        const delimiter = this.container.querySelector('.ms-csv-delimiter').value;
        const hasHeader = this.container.querySelector('.ms-csv-header').checked;
        ({ data, columns } = this.parseCSV(text, delimiter, hasHeader));
      } else {
        ({ data, columns } = this.parseJSON(text));
      }

      // Notify callback
      if (this.options.onDataLoaded) {
        this.options.onDataLoaded(data, columns);
      }
    } catch (error) {
      this.showError(`Error parsing file: ${error.message}`);
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  parseCSV(text, delimiter = ',', hasHeader = true) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    // Parse header
    const headerLine = lines[0];
    const headerValues = this.parseCSVLine(headerLine, delimiter);

    let columns, dataLines;

    if (hasHeader) {
      columns = headerValues;
      dataLines = lines.slice(1);
    } else {
      columns = headerValues.map((_, i) => `Column ${i + 1}`);
      dataLines = lines;
    }

    // Parse data rows
    const data = dataLines.map(line => {
      const values = this.parseCSVLine(line, delimiter);
      const row = {};
      columns.forEach((col, i) => {
        row[col] = this.parseValue(values[i] || '');
      });
      return row;
    });

    return { data, columns };
  }

  parseCSVLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
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

  parseJSON(text) {
    const parsed = JSON.parse(text);

    let data;
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      data = parsed.data;
    } else if (typeof parsed === 'object') {
      // Single object, wrap in array
      data = [parsed];
    } else {
      throw new Error('Invalid JSON structure. Expected an array or object with data property.');
    }

    if (data.length === 0) {
      throw new Error('No data found in JSON');
    }

    // Extract columns from first object
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

  parseValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    // Try number
    const num = Number(value);
    if (!isNaN(num) && value !== '') {
      return num;
    }

    // Try boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return String(value);
  }

  clearFile() {
    this.currentFile = null;
    this.dropZone.classList.remove('hidden');
    this.fileInfo.classList.add('hidden');
    this.parseOptions.classList.add('hidden');
    this.hideError();

    // Reset file input
    this.container.querySelector('.ms-file-input').value = '';
  }

  showError(message) {
    this.errorMsg.textContent = message;
    this.errorMsg.classList.remove('hidden');
  }

  hideError() {
    this.errorMsg.classList.add('hidden');
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
