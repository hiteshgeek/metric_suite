/**
 * Counter Component
 * Displays 1-3 counter values with customizable styling and layouts
 */

import { generateId, debounce, formatNumber } from '../Graph/utils.js';

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

    // Apply custom icon color if provided
    if (config.iconColor) {
      el.style.setProperty('--counter-icon-color', config.iconColor);
    }

    // Icon (optional) - now with colored background
    if (config.icon) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'ms-counter__icon-wrapper';

      const iconEl = document.createElement('div');
      iconEl.className = 'ms-counter__icon';
      iconEl.innerHTML = this._getIconSvg(config.icon);
      iconWrapper.appendChild(iconEl);

      el.appendChild(iconWrapper);
    }

    // Content wrapper (for value, label, and trend)
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'ms-counter__content';

    // Label (moved to top in card layout)
    if (config.label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'ms-counter__label';
      labelEl.textContent = config.label;
      contentWrapper.appendChild(labelEl);
    }

    // Subtitle/secondary text (optional)
    if (config.subtitle) {
      const subtitleEl = document.createElement('div');
      subtitleEl.className = 'ms-counter__subtitle';
      subtitleEl.textContent = config.subtitle;
      contentWrapper.appendChild(subtitleEl);
    }

    // Value
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

    contentWrapper.appendChild(valueEl);

    // Trend indicator (optional) - shows change percentage
    if (config.change !== undefined && config.change !== null) {
      const trendEl = this._createTrendIndicator(config.change, config.changeText);
      contentWrapper.appendChild(trendEl);
    }

    el.appendChild(contentWrapper);

    return el;
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

  _getIconSvg(iconName) {
    const icons = {
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

    return icons[iconName] || icons['activity'];
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
   * Get available icons list
   */
  static getAvailableIcons() {
    return [
      { value: 'trending-up', label: 'Trending Up' },
      { value: 'trending-down', label: 'Trending Down' },
      { value: 'users', label: 'Users' },
      { value: 'dollar', label: 'Dollar' },
      { value: 'percent', label: 'Percent' },
      { value: 'activity', label: 'Activity' },
      { value: 'box', label: 'Box' },
      { value: 'clock', label: 'Clock' },
      { value: 'check', label: 'Check' },
      { value: 'alert', label: 'Alert' },
      { value: 'star', label: 'Star' },
      { value: 'heart', label: 'Heart' },
      { value: 'cart', label: 'Cart' },
      { value: 'eye', label: 'Eye' },
      { value: 'download', label: 'Download' },
    ];
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
