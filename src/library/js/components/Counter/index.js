/**
 * Counter Component
 * Dashboard Card Design - Full color backgrounds with icons
 * Displays 1-3 counter values with customizable styling and layouts
 */

import { generateId, debounce, formatNumber } from '../Graph/utils.js';

// Available card colors
const CARD_COLORS = {
  blue: '#3b82f6',
  teal: '#14b8a6',
  olive: '#84cc16',
  purple: '#8b5cf6',
  red: '#ef4444',
  pink: '#ec4899',
  orange: '#f97316',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  indigo: '#6366f1',
  rose: '#f43f5e',
};

export class Counter {
  constructor(container, options = {}) {
    this.container =
      typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error('Counter: Container element not found');
    }

    if (!this.container.id) {
      this.container.id = generateId('counter');
    }

    // Default options
    this.options = {
      title: '',
      layout: 'row', // 'row' | 'row-featured' | 'stack' | 'grid' | 'horizontal' | 'vertical'
      featuredIndex: 0, // Which counter is featured (0, 1, or 2)
      counters: [], // Array of counter configs
      bgColor: null,
      fgColor: null,
      accentColor: null,
      animate: true,
      animationDuration: 1000,
      compact: false, // Compact mode for dashboard grids
      showCheckbox: false, // Show selection checkbox
      ...options,
    };

    // Map legacy layout names
    if (this.options.layout === 'horizontal') {
      this.options.layout = 'row';
    } else if (this.options.layout === 'vertical') {
      this.options.layout = 'stack';
    }

    this._init();

    // Setup resize handler
    this._resizeHandler = debounce(() => this._adjustLayout(), 100);
    window.addEventListener('resize', this._resizeHandler);

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(this._resizeHandler);
      this._resizeObserver.observe(this.container);
    }
  }

  _init() {
    this.container.innerHTML = '';
    this.container.className = 'ms-counter';

    // Apply compact mode
    if (this.options.compact) {
      this.container.classList.add('ms-counter--compact');
    }

    // Apply layout class
    const layout = this.options.layout;
    if (layout === 'stack') {
      this.container.classList.add('ms-counter--stack');
    } else if (layout === 'grid') {
      this.container.classList.add('ms-counter--grid');
    } else if (layout === 'row-featured') {
      this.container.classList.add('ms-counter--row-featured');
    }
    // 'row' is the default, no extra class needed

    // Apply custom colors
    if (this.options.bgColor) {
      this.container.style.setProperty('--counter-bg', this.options.bgColor);
    }
    if (this.options.fgColor) {
      this.container.style.setProperty('--counter-fg', this.options.fgColor);
    }
    if (this.options.accentColor) {
      this.container.style.setProperty('--counter-accent', this.options.accentColor);
    }

    // Create title if present
    if (this.options.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'ms-counter__title';
      titleEl.textContent = this.options.title;
      this.container.appendChild(titleEl);
    }

    // Create counters container
    this.countersEl = document.createElement('div');
    this.countersEl.className = 'ms-counter__items';
    this.container.appendChild(this.countersEl);

    // Render counters
    this._renderCounters();
  }

  _renderCounters() {
    this.countersEl.innerHTML = '';

    const counters = this.options.counters || [];
    const count = Math.min(counters.length, 3);
    const layout = this.options.layout;
    const featuredIndex = this.options.featuredIndex || 0;

    if (count === 0) {
      // Show placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'ms-counter__placeholder';
      placeholder.textContent = 'No counters configured';
      this.countersEl.appendChild(placeholder);
      return;
    }

    // Set counter count and layout attributes for styling
    this.countersEl.setAttribute('data-count', count);
    this.countersEl.setAttribute('data-layout', layout);

    // For row-featured layout, render featured counter first
    if (layout === 'row-featured' && count > 1) {
      // Reorder: featured first, then others
      const reordered = [];
      reordered.push({ config: counters[featuredIndex], originalIndex: featuredIndex, isFeatured: true });
      for (let i = 0; i < count; i++) {
        if (i !== featuredIndex) {
          reordered.push({ config: counters[i], originalIndex: i, isFeatured: false });
        }
      }

      for (const item of reordered) {
        const counterEl = this._createCounterElement(item.config, item.originalIndex, item.isFeatured);
        this.countersEl.appendChild(counterEl);
      }
    } else {
      // Normal rendering
      for (let i = 0; i < count; i++) {
        const counterConfig = counters[i];
        const isFeatured = layout === 'row-featured' && i === featuredIndex;
        const counterEl = this._createCounterElement(counterConfig, i, isFeatured);
        this.countersEl.appendChild(counterEl);
      }
    }
  }

  _createCounterElement(config, index, isFeatured = false) {
    const el = document.createElement('div');
    el.className = 'ms-counter__item';
    el.setAttribute('data-index', index);

    if (isFeatured) {
      el.classList.add('ms-counter__item--featured');
    }

    // Apply color preset class or custom color
    const cardColor = config.cardColor || 'blue';
    if (CARD_COLORS[cardColor]) {
      el.classList.add(`ms-counter__item--${cardColor}`);
    }

    // Create colored header section
    const header = document.createElement('div');
    header.className = 'ms-counter__card-header';

    // Apply custom card color if provided (hex value)
    if (config.cardColorCustom) {
      header.style.background = config.cardColorCustom;
    } else if (cardColor && !CARD_COLORS[cardColor]) {
      // If cardColor is a hex value
      header.style.background = cardColor;
    }

    // Checkbox (optional)
    if (this.options.showCheckbox) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'ms-counter__checkbox';
      checkbox.setAttribute('data-counter-index', index);
      header.appendChild(checkbox);
    }

    // Icon with semi-transparent background
    if (config.icon) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'ms-counter__icon-wrapper';

      const iconEl = document.createElement('div');
      iconEl.className = 'ms-counter__icon';
      iconEl.innerHTML = this._getIconHtml(config.icon);
      iconWrapper.appendChild(iconEl);

      header.appendChild(iconWrapper);
    }

    // Main content area (label + value)
    const mainContent = document.createElement('div');
    mainContent.className = 'ms-counter__main-content';

    // Label (small text above value)
    if (config.label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'ms-counter__label';
      labelEl.textContent = config.label;
      mainContent.appendChild(labelEl);
    }

    // Value (large number)
    const valueEl = document.createElement('div');
    valueEl.className = 'ms-counter__value';
    valueEl.setAttribute('data-value', config.value ?? 0);

    const formattedValue = this._formatValue(config);
    if (this.options.animate && config.value !== undefined) {
      valueEl.textContent = config.prefix || '';
      this._animateValue(valueEl, 0, config.value, config);
    } else {
      valueEl.textContent = formattedValue;
    }

    mainContent.appendChild(valueEl);

    // Trend indicator in header (optional)
    if (config.change !== undefined && config.change !== null && !config.showTrendInFooter) {
      const trendEl = this._createTrendIndicator(config.change, config.changeText);
      mainContent.appendChild(trendEl);
    }

    header.appendChild(mainContent);

    // Secondary metrics row (optional - e.g., Active | Inactive)
    if (config.secondaryMetrics && config.secondaryMetrics.length > 0) {
      const secondaryRow = document.createElement('div');
      secondaryRow.className = 'ms-counter__secondary';

      for (const metric of config.secondaryMetrics) {
        const metricEl = document.createElement('div');
        metricEl.className = 'ms-counter__secondary-item';

        const metricLabel = document.createElement('span');
        metricLabel.className = 'ms-counter__secondary-label';
        metricLabel.textContent = metric.label || '';

        const metricValue = document.createElement('span');
        metricValue.className = 'ms-counter__secondary-value';
        metricValue.textContent = this._formatSecondaryValue(metric);

        metricEl.appendChild(metricLabel);
        metricEl.appendChild(metricValue);
        secondaryRow.appendChild(metricEl);
      }

      header.appendChild(secondaryRow);
    }

    el.appendChild(header);

    // Card footer (optional - title and description)
    if (config.cardTitle || config.cardDescription || config.showTrendInFooter) {
      const footer = document.createElement('div');
      footer.className = 'ms-counter__card-footer';

      if (config.cardTitle) {
        const titleEl = document.createElement('div');
        titleEl.className = 'ms-counter__card-title';
        titleEl.textContent = config.cardTitle;
        footer.appendChild(titleEl);
      }

      if (config.cardDescription) {
        const descEl = document.createElement('p');
        descEl.className = 'ms-counter__card-description';
        descEl.textContent = config.cardDescription;
        footer.appendChild(descEl);
      }

      // Trend indicator in footer
      if (config.showTrendInFooter && config.change !== undefined && config.change !== null) {
        const trendEl = this._createTrendIndicator(config.change, config.changeText);
        footer.appendChild(trendEl);
      }

      el.appendChild(footer);
    }

    return el;
  }

  _formatSecondaryValue(metric) {
    let value = metric.value;

    if (value === undefined || value === null) {
      return '-';
    }

    // Format number
    if (metric.format === 'compact') {
      value = this._compactNumber(value);
    } else if (typeof value === 'number') {
      value = formatNumber(value);
    }

    // Add prefix and suffix
    const prefix = metric.prefix || '';
    const suffix = metric.suffix || '';

    return `${prefix}${value}${suffix}`;
  }

  _createTrendIndicator(change, changeText) {
    const trendWrapper = document.createElement('div');
    trendWrapper.className = 'ms-counter__trend';

    const isPositive = change >= 0;
    const isNeutral = change === 0;

    // Change badge
    const badge = document.createElement('span');
    badge.className = `ms-counter__trend-badge ${isNeutral ? '' : (isPositive ? 'ms-counter__trend-badge--positive' : 'ms-counter__trend-badge--negative')}`;

    // Format change value
    const changeValue = Math.abs(change);
    const changeFormatted = changeValue % 1 === 0 ? changeValue.toString() : changeValue.toFixed(1);
    badge.textContent = `${isPositive && !isNeutral ? '+' : (isNeutral ? '' : '-')}${changeFormatted}%`;

    trendWrapper.appendChild(badge);

    // Comparison text (e.g., "than last week")
    if (changeText) {
      const text = document.createElement('span');
      text.className = 'ms-counter__trend-text';
      text.textContent = changeText;
      trendWrapper.appendChild(text);
    }

    return trendWrapper;
  }

  _formatValue(config) {
    let value = config.value;

    if (value === undefined || value === null) {
      return '-';
    }

    // Format number based on config
    if (config.format) {
      value = this._applyFormat(value, config.format);
    } else if (typeof value === 'number') {
      value = formatNumber(value);
    }

    // Add prefix and suffix
    const prefix = config.prefix || '';
    const suffix = config.suffix || '';

    return `${prefix}${value}${suffix}`;
  }

  _applyFormat(value, format) {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }

    switch (format) {
      case 'integer':
        return Math.round(value).toLocaleString();
      case 'decimal':
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'percent':
        return (value * 100).toFixed(1);
      case 'compact':
        return this._compactNumber(value);
      case 'currency':
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      default:
        return value.toLocaleString();
    }
  }

  _compactNumber(value) {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  _animateValue(element, start, end, config) {
    const duration = this.options.animationDuration;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;

      element.textContent = this._formatValue({ ...config, value: current });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = this._formatValue({ ...config, value: end });
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get icon HTML - supports both Font Awesome classes and legacy SVG icons
   */
  _getIconHtml(iconName) {
    // If it's a Font Awesome class (starts with 'fa-')
    if (iconName && iconName.startsWith('fa-')) {
      return `<i class="${iconName}"></i>`;
    }

    // Legacy SVG icons for backward compatibility
    const legacyIcons = {
      'trending-up': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
      'trending-down': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
      'users': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'dollar': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      'percent': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
      'activity': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
      'box': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
      'clock': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      'check': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      'alert': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      'star': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'heart': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      'cart': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      'eye': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      'download': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    };

    return legacyIcons[iconName] || legacyIcons['activity'];
  }

  _adjustLayout() {
    // Adjust layout based on container width if needed
    const width = this.container.offsetWidth;
    const layout = this.options.layout;

    // Auto-stack on narrow containers for row layouts
    if (width < 300 && (layout === 'row' || layout === 'row-featured')) {
      this.container.classList.add('ms-counter--responsive-stack');
    } else {
      this.container.classList.remove('ms-counter--responsive-stack');
    }
  }

  /**
   * Update counter values
   */
  setData(data) {
    if (!Array.isArray(data)) {
      console.warn('Counter.setData expects an array');
      return this;
    }

    // Update counters with new data
    this.options.counters = data.map((item, i) => ({
      ...this.options.counters[i],
      ...item,
    }));

    this._renderCounters();
    return this;
  }

  /**
   * Update a single counter by index
   */
  setCounter(index, config) {
    if (index >= 0 && index < 3) {
      this.options.counters[index] = {
        ...this.options.counters[index],
        ...config,
      };
      this._renderCounters();
    }
    return this;
  }

  /**
   * Update options
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    this._init();
    return this;
  }

  /**
   * Load data from API
   */
  async loadData(url, options = {}) {
    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const row = result.data[0];

        // Map columns to counter values
        const counters = [];
        for (let i = 1; i <= 3; i++) {
          const valueCol = options[`valueColumn${i}`] || `count_${i}`;
          const labelCol = options[`labelColumn${i}`] || `description_${i}`;

          if (row[valueCol] !== undefined) {
            counters.push({
              ...this.options.counters[i - 1],
              value: parseFloat(row[valueCol]) || 0,
              label: row[labelCol] || this.options.counters[i - 1]?.label,
            });
          }
        }

        if (counters.length > 0) {
          this.setData(counters);
        }
      }

      return result;
    } catch (error) {
      console.error('Counter: Failed to load data', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.options };
  }

  /**
   * Export as JSON string
   */
  toJSON() {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    window.removeEventListener('resize', this._resizeHandler);

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    this.container.innerHTML = '';
    this.container = null;
  }

  /**
   * Create from saved configuration
   */
  static fromConfig(container, config) {
    return new Counter(container, config);
  }

  /**
   * Get available card colors
   */
  static getCardColors() {
    return Object.entries(CARD_COLORS).map(([name, value]) => ({
      name,
      value,
      label: name.charAt(0).toUpperCase() + name.slice(1),
    }));
  }

  /**
   * Get available icons list organized by category
   * Uses Font Awesome 6 free icons
   */
  static getAvailableIcons() {
    return [
      // Business & Finance
      { value: 'fa-solid fa-dollar-sign', label: 'Dollar', category: 'finance' },
      { value: 'fa-solid fa-coins', label: 'Coins', category: 'finance' },
      { value: 'fa-solid fa-money-bill', label: 'Money Bill', category: 'finance' },
      { value: 'fa-solid fa-money-bill-wave', label: 'Money Wave', category: 'finance' },
      { value: 'fa-solid fa-credit-card', label: 'Credit Card', category: 'finance' },
      { value: 'fa-solid fa-wallet', label: 'Wallet', category: 'finance' },
      { value: 'fa-solid fa-piggy-bank', label: 'Piggy Bank', category: 'finance' },
      { value: 'fa-solid fa-sack-dollar', label: 'Money Sack', category: 'finance' },
      { value: 'fa-solid fa-receipt', label: 'Receipt', category: 'finance' },
      { value: 'fa-solid fa-percent', label: 'Percent', category: 'finance' },

      // Charts & Analytics
      { value: 'fa-solid fa-chart-line', label: 'Line Chart', category: 'charts' },
      { value: 'fa-solid fa-chart-bar', label: 'Bar Chart', category: 'charts' },
      { value: 'fa-solid fa-chart-pie', label: 'Pie Chart', category: 'charts' },
      { value: 'fa-solid fa-chart-area', label: 'Area Chart', category: 'charts' },
      { value: 'fa-solid fa-chart-column', label: 'Column Chart', category: 'charts' },
      { value: 'fa-solid fa-arrow-trend-up', label: 'Trend Up', category: 'charts' },
      { value: 'fa-solid fa-arrow-trend-down', label: 'Trend Down', category: 'charts' },
      { value: 'fa-solid fa-chart-simple', label: 'Simple Chart', category: 'charts' },
      { value: 'fa-solid fa-signal', label: 'Signal', category: 'charts' },
      { value: 'fa-solid fa-gauge-high', label: 'Gauge', category: 'charts' },

      // People & Users
      { value: 'fa-solid fa-user', label: 'User', category: 'people' },
      { value: 'fa-solid fa-users', label: 'Users', category: 'people' },
      { value: 'fa-solid fa-user-group', label: 'User Group', category: 'people' },
      { value: 'fa-solid fa-people-group', label: 'People Group', category: 'people' },
      { value: 'fa-solid fa-user-plus', label: 'User Plus', category: 'people' },
      { value: 'fa-solid fa-user-check', label: 'User Check', category: 'people' },
      { value: 'fa-solid fa-user-tie', label: 'Business User', category: 'people' },
      { value: 'fa-solid fa-handshake', label: 'Handshake', category: 'people' },
      { value: 'fa-solid fa-address-book', label: 'Address Book', category: 'people' },
      { value: 'fa-solid fa-id-card', label: 'ID Card', category: 'people' },

      // Shopping & E-commerce
      { value: 'fa-solid fa-cart-shopping', label: 'Cart', category: 'shopping' },
      { value: 'fa-solid fa-bag-shopping', label: 'Shopping Bag', category: 'shopping' },
      { value: 'fa-solid fa-basket-shopping', label: 'Basket', category: 'shopping' },
      { value: 'fa-solid fa-store', label: 'Store', category: 'shopping' },
      { value: 'fa-solid fa-shop', label: 'Shop', category: 'shopping' },
      { value: 'fa-solid fa-tags', label: 'Tags', category: 'shopping' },
      { value: 'fa-solid fa-tag', label: 'Tag', category: 'shopping' },
      { value: 'fa-solid fa-barcode', label: 'Barcode', category: 'shopping' },
      { value: 'fa-solid fa-box', label: 'Box', category: 'shopping' },
      { value: 'fa-solid fa-boxes-stacked', label: 'Boxes', category: 'shopping' },

      // Status & Feedback
      { value: 'fa-solid fa-check', label: 'Check', category: 'status' },
      { value: 'fa-solid fa-check-circle', label: 'Check Circle', category: 'status' },
      { value: 'fa-solid fa-circle-check', label: 'Circle Check', category: 'status' },
      { value: 'fa-solid fa-xmark', label: 'X Mark', category: 'status' },
      { value: 'fa-solid fa-circle-xmark', label: 'Circle X', category: 'status' },
      { value: 'fa-solid fa-exclamation', label: 'Exclamation', category: 'status' },
      { value: 'fa-solid fa-triangle-exclamation', label: 'Warning', category: 'status' },
      { value: 'fa-solid fa-circle-exclamation', label: 'Alert Circle', category: 'status' },
      { value: 'fa-solid fa-circle-info', label: 'Info', category: 'status' },
      { value: 'fa-solid fa-question', label: 'Question', category: 'status' },

      // Time & Calendar
      { value: 'fa-solid fa-clock', label: 'Clock', category: 'time' },
      { value: 'fa-regular fa-clock', label: 'Clock Outline', category: 'time' },
      { value: 'fa-solid fa-stopwatch', label: 'Stopwatch', category: 'time' },
      { value: 'fa-solid fa-hourglass', label: 'Hourglass', category: 'time' },
      { value: 'fa-solid fa-hourglass-half', label: 'Hourglass Half', category: 'time' },
      { value: 'fa-solid fa-calendar', label: 'Calendar', category: 'time' },
      { value: 'fa-solid fa-calendar-days', label: 'Calendar Days', category: 'time' },
      { value: 'fa-solid fa-calendar-check', label: 'Calendar Check', category: 'time' },
      { value: 'fa-solid fa-history', label: 'History', category: 'time' },
      { value: 'fa-solid fa-timeline', label: 'Timeline', category: 'time' },

      // Communication
      { value: 'fa-solid fa-envelope', label: 'Envelope', category: 'communication' },
      { value: 'fa-solid fa-envelope-open', label: 'Envelope Open', category: 'communication' },
      { value: 'fa-solid fa-message', label: 'Message', category: 'communication' },
      { value: 'fa-solid fa-comments', label: 'Comments', category: 'communication' },
      { value: 'fa-solid fa-phone', label: 'Phone', category: 'communication' },
      { value: 'fa-solid fa-bell', label: 'Bell', category: 'communication' },
      { value: 'fa-solid fa-bullhorn', label: 'Bullhorn', category: 'communication' },
      { value: 'fa-solid fa-paper-plane', label: 'Paper Plane', category: 'communication' },
      { value: 'fa-solid fa-at', label: 'At Sign', category: 'communication' },
      { value: 'fa-solid fa-share-nodes', label: 'Share', category: 'communication' },

      // Files & Documents
      { value: 'fa-solid fa-file', label: 'File', category: 'files' },
      { value: 'fa-solid fa-file-lines', label: 'Document', category: 'files' },
      { value: 'fa-solid fa-folder', label: 'Folder', category: 'files' },
      { value: 'fa-solid fa-folder-open', label: 'Folder Open', category: 'files' },
      { value: 'fa-solid fa-file-pdf', label: 'PDF', category: 'files' },
      { value: 'fa-solid fa-file-excel', label: 'Excel', category: 'files' },
      { value: 'fa-solid fa-clipboard', label: 'Clipboard', category: 'files' },
      { value: 'fa-solid fa-clipboard-list', label: 'Clipboard List', category: 'files' },
      { value: 'fa-solid fa-copy', label: 'Copy', category: 'files' },
      { value: 'fa-solid fa-paste', label: 'Paste', category: 'files' },

      // Actions
      { value: 'fa-solid fa-download', label: 'Download', category: 'actions' },
      { value: 'fa-solid fa-upload', label: 'Upload', category: 'actions' },
      { value: 'fa-solid fa-cloud-download', label: 'Cloud Download', category: 'actions' },
      { value: 'fa-solid fa-cloud-upload', label: 'Cloud Upload', category: 'actions' },
      { value: 'fa-solid fa-sync', label: 'Sync', category: 'actions' },
      { value: 'fa-solid fa-rotate', label: 'Rotate', category: 'actions' },
      { value: 'fa-solid fa-arrows-rotate', label: 'Refresh', category: 'actions' },
      { value: 'fa-solid fa-magnifying-glass', label: 'Search', category: 'actions' },
      { value: 'fa-solid fa-filter', label: 'Filter', category: 'actions' },
      { value: 'fa-solid fa-sort', label: 'Sort', category: 'actions' },

      // Ratings & Favorites
      { value: 'fa-solid fa-star', label: 'Star', category: 'ratings' },
      { value: 'fa-regular fa-star', label: 'Star Outline', category: 'ratings' },
      { value: 'fa-solid fa-star-half-stroke', label: 'Star Half', category: 'ratings' },
      { value: 'fa-solid fa-heart', label: 'Heart', category: 'ratings' },
      { value: 'fa-regular fa-heart', label: 'Heart Outline', category: 'ratings' },
      { value: 'fa-solid fa-thumbs-up', label: 'Thumbs Up', category: 'ratings' },
      { value: 'fa-solid fa-thumbs-down', label: 'Thumbs Down', category: 'ratings' },
      { value: 'fa-solid fa-fire', label: 'Fire', category: 'ratings' },
      { value: 'fa-solid fa-bolt', label: 'Bolt', category: 'ratings' },
      { value: 'fa-solid fa-award', label: 'Award', category: 'ratings' },

      // Views & Visibility
      { value: 'fa-solid fa-eye', label: 'Eye', category: 'views' },
      { value: 'fa-solid fa-eye-slash', label: 'Eye Slash', category: 'views' },
      { value: 'fa-solid fa-glasses', label: 'Glasses', category: 'views' },
      { value: 'fa-solid fa-binoculars', label: 'Binoculars', category: 'views' },
      { value: 'fa-solid fa-expand', label: 'Expand', category: 'views' },
      { value: 'fa-solid fa-compress', label: 'Compress', category: 'views' },
      { value: 'fa-solid fa-maximize', label: 'Maximize', category: 'views' },
      { value: 'fa-solid fa-minimize', label: 'Minimize', category: 'views' },
      { value: 'fa-solid fa-up-right-and-down-left-from-center', label: 'Fullscreen', category: 'views' },
      { value: 'fa-solid fa-layer-group', label: 'Layers', category: 'views' },

      // Technology
      { value: 'fa-solid fa-database', label: 'Database', category: 'tech' },
      { value: 'fa-solid fa-server', label: 'Server', category: 'tech' },
      { value: 'fa-solid fa-cloud', label: 'Cloud', category: 'tech' },
      { value: 'fa-solid fa-code', label: 'Code', category: 'tech' },
      { value: 'fa-solid fa-terminal', label: 'Terminal', category: 'tech' },
      { value: 'fa-solid fa-laptop', label: 'Laptop', category: 'tech' },
      { value: 'fa-solid fa-desktop', label: 'Desktop', category: 'tech' },
      { value: 'fa-solid fa-mobile', label: 'Mobile', category: 'tech' },
      { value: 'fa-solid fa-wifi', label: 'WiFi', category: 'tech' },
      { value: 'fa-solid fa-globe', label: 'Globe', category: 'tech' },

      // Location & Navigation
      { value: 'fa-solid fa-location-dot', label: 'Location', category: 'location' },
      { value: 'fa-solid fa-map', label: 'Map', category: 'location' },
      { value: 'fa-solid fa-map-pin', label: 'Map Pin', category: 'location' },
      { value: 'fa-solid fa-compass', label: 'Compass', category: 'location' },
      { value: 'fa-solid fa-earth-americas', label: 'Earth', category: 'location' },
      { value: 'fa-solid fa-house', label: 'House', category: 'location' },
      { value: 'fa-solid fa-building', label: 'Building', category: 'location' },
      { value: 'fa-solid fa-city', label: 'City', category: 'location' },
      { value: 'fa-solid fa-warehouse', label: 'Warehouse', category: 'location' },
      { value: 'fa-solid fa-industry', label: 'Industry', category: 'location' },

      // Transport & Shipping
      { value: 'fa-solid fa-truck', label: 'Truck', category: 'transport' },
      { value: 'fa-solid fa-truck-fast', label: 'Fast Delivery', category: 'transport' },
      { value: 'fa-solid fa-shipping-fast', label: 'Shipping', category: 'transport' },
      { value: 'fa-solid fa-plane', label: 'Plane', category: 'transport' },
      { value: 'fa-solid fa-car', label: 'Car', category: 'transport' },
      { value: 'fa-solid fa-bicycle', label: 'Bicycle', category: 'transport' },
      { value: 'fa-solid fa-motorcycle', label: 'Motorcycle', category: 'transport' },
      { value: 'fa-solid fa-ship', label: 'Ship', category: 'transport' },
      { value: 'fa-solid fa-rocket', label: 'Rocket', category: 'transport' },
      { value: 'fa-solid fa-parachute-box', label: 'Package Drop', category: 'transport' },

      // Security
      { value: 'fa-solid fa-lock', label: 'Lock', category: 'security' },
      { value: 'fa-solid fa-lock-open', label: 'Unlock', category: 'security' },
      { value: 'fa-solid fa-shield', label: 'Shield', category: 'security' },
      { value: 'fa-solid fa-shield-halved', label: 'Shield Half', category: 'security' },
      { value: 'fa-solid fa-key', label: 'Key', category: 'security' },
      { value: 'fa-solid fa-fingerprint', label: 'Fingerprint', category: 'security' },
      { value: 'fa-solid fa-user-shield', label: 'User Shield', category: 'security' },
      { value: 'fa-solid fa-vault', label: 'Vault', category: 'security' },
      { value: 'fa-solid fa-ban', label: 'Ban', category: 'security' },
      { value: 'fa-solid fa-circle-user', label: 'User Circle', category: 'security' },

      // Misc
      { value: 'fa-solid fa-gear', label: 'Gear', category: 'misc' },
      { value: 'fa-solid fa-gears', label: 'Gears', category: 'misc' },
      { value: 'fa-solid fa-sliders', label: 'Sliders', category: 'misc' },
      { value: 'fa-solid fa-wrench', label: 'Wrench', category: 'misc' },
      { value: 'fa-solid fa-screwdriver-wrench', label: 'Tools', category: 'misc' },
      { value: 'fa-solid fa-lightbulb', label: 'Lightbulb', category: 'misc' },
      { value: 'fa-solid fa-magic-wand-sparkles', label: 'Magic Wand', category: 'misc' },
      { value: 'fa-solid fa-puzzle-piece', label: 'Puzzle', category: 'misc' },
      { value: 'fa-solid fa-trophy', label: 'Trophy', category: 'misc' },
      { value: 'fa-solid fa-medal', label: 'Medal', category: 'misc' },
    ];
  }

  /**
   * Get icon categories
   */
  static getIconCategories() {
    return [
      { value: 'finance', label: 'Business & Finance' },
      { value: 'charts', label: 'Charts & Analytics' },
      { value: 'people', label: 'People & Users' },
      { value: 'shopping', label: 'Shopping' },
      { value: 'status', label: 'Status & Feedback' },
      { value: 'time', label: 'Time & Calendar' },
      { value: 'communication', label: 'Communication' },
      { value: 'files', label: 'Files & Documents' },
      { value: 'actions', label: 'Actions' },
      { value: 'ratings', label: 'Ratings & Favorites' },
      { value: 'views', label: 'Views & Visibility' },
      { value: 'tech', label: 'Technology' },
      { value: 'location', label: 'Location' },
      { value: 'transport', label: 'Transport & Shipping' },
      { value: 'security', label: 'Security' },
      { value: 'misc', label: 'Miscellaneous' },
    ];
  }

  /**
   * Get Font Awesome icon HTML
   */
  static getIconHtml(iconClass) {
    if (!iconClass) return null;
    return `<i class="${iconClass}"></i>`;
  }

  /**
   * Get available formats
   */
  static getAvailableFormats() {
    return [
      { value: 'default', label: 'Default' },
      { value: 'integer', label: 'Integer (1,234)' },
      { value: 'decimal', label: 'Decimal (1,234.56)' },
      { value: 'percent', label: 'Percent (12.3)' },
      { value: 'compact', label: 'Compact (1.2K, 3.4M)' },
      { value: 'currency', label: 'Currency (1,234.56)' },
    ];
  }
}

export default Counter;
