/**
 * FieldSelector - Drag-and-drop field selection for queries
 */

import { createElement } from '../utils.js';

export default class FieldSelector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      columns: [], // [{name, type}]
      onSelectionChange: null,
      allowAggregates: true,
      ...options,
    };

    this.selectedFields = [];
    this.draggedItem = null;

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-field-selector';

    this.container.innerHTML = `
      <div class="ms-fs-toolbar">
        <button class="ms-btn ms-btn-text ms-fs-select-all">
          <i class="fas fa-check-double"></i> Select All
        </button>
        <button class="ms-btn ms-btn-text ms-fs-clear-all">
          <i class="fas fa-times"></i> Clear
        </button>
      </div>
      <div class="ms-fs-available">
        <div class="ms-fs-label">Available Fields</div>
        <div class="ms-fs-available-list"></div>
      </div>
      <div class="ms-fs-selected">
        <div class="ms-fs-label">Selected Fields (drag to reorder)</div>
        <div class="ms-fs-selected-list" data-dropzone="selected"></div>
      </div>
    `;

    this.renderAvailableFields();
    this.renderSelectedFields();
  }

  renderAvailableFields() {
    const list = this.container.querySelector('.ms-fs-available-list');
    list.innerHTML = '';

    if (this.options.columns.length === 0) {
      list.innerHTML = '<div class="ms-fs-empty">Select a table first</div>';
      return;
    }

    this.options.columns.forEach(column => {
      const isSelected = this.selectedFields.some(f => f.name === column.name && !f.aggregate);

      const fieldEl = createElement('div', {
        className: `ms-fs-field ${isSelected ? 'selected' : ''}`,
        draggable: 'true',
        'data-name': column.name,
        'data-type': column.type,
      });

      const typeIcon = this.getTypeIcon(column.type);

      fieldEl.innerHTML = `
        <i class="fas ${typeIcon} ms-fs-field-type"></i>
        <span class="ms-fs-field-name">${column.name}</span>
        <button class="ms-btn ms-btn-icon ms-fs-add-field" title="Add">
          <i class="fas fa-plus"></i>
        </button>
      `;

      list.appendChild(fieldEl);
    });
  }

  renderSelectedFields() {
    const list = this.container.querySelector('.ms-fs-selected-list');
    list.innerHTML = '';

    if (this.selectedFields.length === 0) {
      list.innerHTML = '<div class="ms-fs-empty ms-fs-dropzone">Drag fields here or click + to add</div>';
      return;
    }

    this.selectedFields.forEach((field, index) => {
      const fieldEl = createElement('div', {
        className: 'ms-fs-selected-field',
        draggable: 'true',
        'data-index': index,
      });

      let displayName = field.name;
      if (field.aggregate) {
        displayName = `${field.aggregate}(${field.name})`;
      }
      if (field.alias) {
        displayName += ` AS ${field.alias}`;
      }

      fieldEl.innerHTML = `
        <i class="fas fa-grip-vertical ms-fs-drag-handle"></i>
        <span class="ms-fs-field-name">${displayName}</span>
        ${this.options.allowAggregates ? `
          <select class="ms-select ms-select-sm ms-fs-aggregate">
            <option value="">No Aggregate</option>
            <option value="COUNT" ${field.aggregate === 'COUNT' ? 'selected' : ''}>COUNT</option>
            <option value="SUM" ${field.aggregate === 'SUM' ? 'selected' : ''}>SUM</option>
            <option value="AVG" ${field.aggregate === 'AVG' ? 'selected' : ''}>AVG</option>
            <option value="MIN" ${field.aggregate === 'MIN' ? 'selected' : ''}>MIN</option>
            <option value="MAX" ${field.aggregate === 'MAX' ? 'selected' : ''}>MAX</option>
          </select>
        ` : ''}
        <button class="ms-btn ms-btn-icon ms-fs-remove-field" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      `;

      list.appendChild(fieldEl);
    });
  }

  attachEventListeners() {
    // Select all
    this.container.querySelector('.ms-fs-select-all').addEventListener('click', () => {
      this.selectAll();
    });

    // Clear all
    this.container.querySelector('.ms-fs-clear-all').addEventListener('click', () => {
      this.clear();
    });

    // Add field buttons
    this.container.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.ms-fs-add-field');
      if (addBtn) {
        const fieldEl = addBtn.closest('.ms-fs-field');
        this.addField(fieldEl.dataset.name, fieldEl.dataset.type);
      }

      const removeBtn = e.target.closest('.ms-fs-remove-field');
      if (removeBtn) {
        const fieldEl = removeBtn.closest('.ms-fs-selected-field');
        this.removeField(parseInt(fieldEl.dataset.index));
      }
    });

    // Aggregate change
    this.container.addEventListener('change', (e) => {
      if (e.target.classList.contains('ms-fs-aggregate')) {
        const fieldEl = e.target.closest('.ms-fs-selected-field');
        const index = parseInt(fieldEl.dataset.index);
        this.selectedFields[index].aggregate = e.target.value || null;
        this.notifyChange();
        this.renderSelectedFields();
      }
    });

    // Drag and drop from available
    const availableList = this.container.querySelector('.ms-fs-available-list');
    availableList.addEventListener('dragstart', (e) => {
      const fieldEl = e.target.closest('.ms-fs-field');
      if (fieldEl) {
        this.draggedItem = {
          type: 'new',
          name: fieldEl.dataset.name,
          dataType: fieldEl.dataset.type,
        };
        e.dataTransfer.effectAllowed = 'copy';
      }
    });

    // Drag and drop from selected (reorder)
    const selectedList = this.container.querySelector('.ms-fs-selected-list');

    selectedList.addEventListener('dragstart', (e) => {
      const fieldEl = e.target.closest('.ms-fs-selected-field');
      if (fieldEl) {
        this.draggedItem = {
          type: 'reorder',
          index: parseInt(fieldEl.dataset.index),
        };
        e.dataTransfer.effectAllowed = 'move';
        fieldEl.classList.add('dragging');
      }
    });

    selectedList.addEventListener('dragend', (e) => {
      const fieldEl = e.target.closest('.ms-fs-selected-field');
      if (fieldEl) {
        fieldEl.classList.remove('dragging');
      }
      this.draggedItem = null;
    });

    selectedList.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = this.draggedItem?.type === 'new' ? 'copy' : 'move';

      // Visual feedback for drop position
      const afterElement = this.getDragAfterElement(selectedList, e.clientY);
      const dragging = selectedList.querySelector('.dragging');

      if (afterElement == null) {
        if (dragging) selectedList.appendChild(dragging);
      } else {
        if (dragging) selectedList.insertBefore(dragging, afterElement);
      }
    });

    selectedList.addEventListener('drop', (e) => {
      e.preventDefault();

      if (this.draggedItem?.type === 'new') {
        // Add new field
        this.addField(this.draggedItem.name, this.draggedItem.dataType);
      } else if (this.draggedItem?.type === 'reorder') {
        // Reorder
        const dragging = selectedList.querySelector('.dragging');
        if (dragging) {
          const newIndex = Array.from(selectedList.children)
            .filter(el => el.classList.contains('ms-fs-selected-field'))
            .indexOf(dragging);

          if (newIndex !== this.draggedItem.index) {
            const [removed] = this.selectedFields.splice(this.draggedItem.index, 1);
            this.selectedFields.splice(newIndex, 0, removed);
            this.notifyChange();
          }
        }
      }

      this.draggedItem = null;
    });

    // Double-click to add
    availableList.addEventListener('dblclick', (e) => {
      const fieldEl = e.target.closest('.ms-fs-field');
      if (fieldEl) {
        this.addField(fieldEl.dataset.name, fieldEl.dataset.type);
      }
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ms-fs-selected-field:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  addField(name, type) {
    // Check if already selected
    const exists = this.selectedFields.some(f => f.name === name && !f.aggregate);
    if (exists) return;

    this.selectedFields.push({
      name,
      type,
      aggregate: null,
      alias: null,
    });

    this.renderAvailableFields();
    this.renderSelectedFields();
    this.notifyChange();
  }

  removeField(index) {
    this.selectedFields.splice(index, 1);
    this.renderAvailableFields();
    this.renderSelectedFields();
    this.notifyChange();
  }

  selectAll() {
    this.selectedFields = this.options.columns.map(col => ({
      name: col.name,
      type: col.type,
      aggregate: null,
      alias: null,
    }));

    this.renderAvailableFields();
    this.renderSelectedFields();
    this.notifyChange();
  }

  clear() {
    this.selectedFields = [];
    this.renderAvailableFields();
    this.renderSelectedFields();
    this.notifyChange();
  }

  setColumns(columns) {
    this.options.columns = columns;
    this.selectedFields = [];
    this.renderAvailableFields();
    this.renderSelectedFields();
  }

  setSelectedFields(fields) {
    this.selectedFields = fields.map(f => ({
      name: f.name || f,
      type: f.type || 'string',
      aggregate: f.aggregate || null,
      alias: f.alias || null,
    }));
    this.renderAvailableFields();
    this.renderSelectedFields();
  }

  getSelectedFields() {
    return [...this.selectedFields];
  }

  notifyChange() {
    if (this.options.onSelectionChange) {
      this.options.onSelectionChange(this.getSelectedFields());
    }
  }

  getTypeIcon(type) {
    const typeMap = {
      'int': 'fa-hashtag',
      'integer': 'fa-hashtag',
      'bigint': 'fa-hashtag',
      'float': 'fa-percentage',
      'double': 'fa-percentage',
      'decimal': 'fa-percentage',
      'number': 'fa-hashtag',
      'varchar': 'fa-font',
      'text': 'fa-align-left',
      'string': 'fa-font',
      'date': 'fa-calendar',
      'datetime': 'fa-clock',
      'timestamp': 'fa-clock',
      'boolean': 'fa-toggle-on',
      'bool': 'fa-toggle-on',
    };

    return typeMap[type?.toLowerCase()] || 'fa-circle';
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
