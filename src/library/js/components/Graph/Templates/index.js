/**
 * Chart Templates - Pre-built chart configurations
 */

import { createElement } from '../utils.js';
import { templates } from './templateData.js';

export default class TemplateSelector {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.options = {
      onTemplateSelect: null,
      showPreview: true,
      ...options,
    };

    this.templates = templates;
    this.selectedCategory = 'all';

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-template-selector';

    // Get unique categories
    const categories = ['all', ...new Set(this.templates.map(t => t.category))];

    this.container.innerHTML = `
      <div class="ms-ts-header">
        <span class="ms-ts-title">Chart Templates</span>
        <div class="ms-ts-search">
          <i class="fas fa-search"></i>
          <input type="text" class="ms-input ms-ts-search-input" placeholder="Search templates..." />
        </div>
      </div>

      <div class="ms-ts-categories">
        ${categories.map(cat => `
          <button class="ms-ts-category ${cat === this.selectedCategory ? 'active' : ''}" data-category="${cat}">
            ${this.getCategoryLabel(cat)}
          </button>
        `).join('')}
      </div>

      <div class="ms-ts-grid"></div>
    `;

    this.renderTemplates();
  }

  renderTemplates(searchTerm = '') {
    const grid = this.container.querySelector('.ms-ts-grid');
    grid.innerHTML = '';

    let filteredTemplates = this.templates;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === this.selectedCategory);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
      );
    }

    if (filteredTemplates.length === 0) {
      grid.innerHTML = '<div class="ms-ts-empty">No templates found</div>';
      return;
    }

    filteredTemplates.forEach(template => {
      const card = this.createTemplateCard(template);
      grid.appendChild(card);
    });
  }

  createTemplateCard(template) {
    const card = createElement('div', {
      className: 'ms-ts-card',
      'data-id': template.id,
    });

    const typeIcon = this.getChartIcon(template.chartType);

    card.innerHTML = `
      <div class="ms-ts-card-preview">
        <i class="fas ${typeIcon} ms-ts-card-icon"></i>
      </div>
      <div class="ms-ts-card-content">
        <h4 class="ms-ts-card-title">${template.name}</h4>
        <p class="ms-ts-card-description">${template.description}</p>
        <div class="ms-ts-card-meta">
          <span class="ms-ts-card-type">${template.chartType}</span>
          <span class="ms-ts-card-category">${template.category}</span>
        </div>
      </div>
      <div class="ms-ts-card-actions">
        <button class="ms-btn ms-btn-primary ms-ts-use-btn">Use Template</button>
        ${this.options.showPreview ? '<button class="ms-btn ms-btn-secondary ms-ts-preview-btn">Preview</button>' : ''}
      </div>
    `;

    return card;
  }

  attachEventListeners() {
    // Category filter
    this.container.querySelectorAll('.ms-ts-category').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.dataset.category;
        this.container.querySelectorAll('.ms-ts-category').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderTemplates(this.container.querySelector('.ms-ts-search-input').value);
      });
    });

    // Search
    this.container.querySelector('.ms-ts-search-input').addEventListener('input', (e) => {
      this.renderTemplates(e.target.value);
    });

    // Template actions (using event delegation)
    this.container.querySelector('.ms-ts-grid').addEventListener('click', (e) => {
      const useBtn = e.target.closest('.ms-ts-use-btn');
      const previewBtn = e.target.closest('.ms-ts-preview-btn');
      const card = e.target.closest('.ms-ts-card');

      if (!card) return;

      const templateId = card.dataset.id;
      const template = this.templates.find(t => t.id === templateId);

      if (useBtn && template) {
        this.selectTemplate(template);
      }

      if (previewBtn && template) {
        this.previewTemplate(template);
      }
    });
  }

  selectTemplate(template) {
    if (this.options.onTemplateSelect) {
      this.options.onTemplateSelect(template);
    }
  }

  previewTemplate(template) {
    // Create modal preview
    const modal = createElement('div', { className: 'ms-ts-modal' });
    modal.innerHTML = `
      <div class="ms-ts-modal-content">
        <div class="ms-ts-modal-header">
          <h3>${template.name}</h3>
          <button class="ms-btn ms-btn-icon ms-ts-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="ms-ts-modal-body">
          <div class="ms-ts-modal-preview" id="template-preview-chart"></div>
          <div class="ms-ts-modal-info">
            <p><strong>Type:</strong> ${template.chartType}</p>
            <p><strong>Category:</strong> ${template.category}</p>
            <p><strong>Description:</strong> ${template.description}</p>
          </div>
        </div>
        <div class="ms-ts-modal-footer">
          <button class="ms-btn ms-btn-secondary ms-ts-modal-close-btn">Close</button>
          <button class="ms-btn ms-btn-primary ms-ts-modal-use-btn">Use This Template</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Render preview chart if echarts is available
    if (window.echarts) {
      const chartContainer = modal.querySelector('#template-preview-chart');
      const chart = echarts.init(chartContainer);
      chart.setOption(template.config);
    }

    // Close events
    modal.querySelector('.ms-ts-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.ms-ts-modal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.ms-ts-modal-use-btn').addEventListener('click', () => {
      this.selectTemplate(template);
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  getCategoryLabel(category) {
    const labels = {
      all: 'All Templates',
      sales: 'Sales & Revenue',
      distribution: 'Distribution',
      comparison: 'Comparison',
      technical: 'Technical',
      progress: 'Progress & Status',
      financial: 'Financial',
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  getChartIcon(chartType) {
    const icons = {
      bar: 'fa-chart-bar',
      line: 'fa-chart-line',
      pie: 'fa-chart-pie',
      donut: 'fa-circle-notch',
      area: 'fa-chart-area',
      scatter: 'fa-braille',
      radar: 'fa-spider',
      heatmap: 'fa-th',
      candlestick: 'fa-chart-candlestick',
      funnel: 'fa-filter',
      gauge: 'fa-tachometer-alt',
    };
    return icons[chartType] || 'fa-chart-bar';
  }

  /**
   * Add a custom template
   */
  addTemplate(template) {
    this.templates.push({
      id: `custom-${Date.now()}`,
      ...template,
    });
    this.renderTemplates();
  }

  /**
   * Get template by ID
   */
  getTemplate(id) {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Get all templates
   */
  getAllTemplates() {
    return [...this.templates];
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
