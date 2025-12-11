/**
 * Counter/KPI Widget Types
 * Extends base Widget with counter-specific functionality
 */

import { WIDGET_TYPES } from '../constants.js';
import { Widget, WidgetFactory } from '../index.js';
import { formatNumber } from '../../Graph/utils.js';

/**
 * Base Counter Widget - shared functionality for all counter types
 */
export class BaseCounterWidget extends Widget {
  constructor(container, config) {
    super(container, config);
    this.animationDuration = config.config?.animationDuration || 1000;
  }

  _init() {
    super._init();
    this.container.classList.add('ms-widget--counter');
  }

  /**
   * Format a value based on configuration
   */
  _formatValue(value, config = {}) {
    if (value === null || value === undefined) return '-';

    const format = config.format || this.config.config?.format || 'number';
    let formatted;

    switch (format) {
      case 'currency':
        formatted = value.toLocaleString(undefined, {
          minimumFractionDigits: config.decimals ?? 2,
          maximumFractionDigits: config.decimals ?? 2,
        });
        break;
      case 'percentage':
        formatted = `${(value * 100).toFixed(config.decimals ?? 1)}%`;
        break;
      case 'compact':
        formatted = this._compactNumber(value);
        break;
      case 'integer':
        formatted = Math.round(value).toLocaleString();
        break;
      default:
        formatted = formatNumber(value);
    }

    const prefix = config.prefix || this.config.config?.prefix || '';
    const suffix = config.suffix || this.config.config?.suffix || '';

    return `${prefix}${formatted}${suffix}`;
  }

  /**
   * Compact number formatting (1K, 1M, 1B)
   */
  _compactNumber(value) {
    if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
    return value.toString();
  }

  /**
   * Animate counter value
   */
  _animateValue(element, start, end, duration = this.animationDuration) {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;

      element.textContent = this._formatValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = this._formatValue(end);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get icon HTML
   */
  _getIconHtml(icon) {
    if (!icon) return '';
    if (icon.startsWith('fa-')) {
      return `<i class="${icon}"></i>`;
    }
    return `<i class="fa-solid ${icon}"></i>`;
  }
}

/**
 * Single Value Counter Widget
 */
export class SingleCounterWidget extends BaseCounterWidget {
  static defaultConfig = {
    value: 0,
    format: 'number',
    prefix: '',
    suffix: '',
    decimals: 0,
    animated: true,
    icon: null,
    color: '#3b82f6',
  };

  render() {
    const cfg = { ...SingleCounterWidget.defaultConfig, ...this.config.config };
    const data = this.data || {};
    const value = data.value ?? cfg.value;

    this.container.innerHTML = `
      <div class="ms-counter-widget ms-counter-widget--single">
        ${cfg.icon ? `
          <div class="ms-counter-widget__icon" style="background-color: ${cfg.color}20; color: ${cfg.color}">
            ${this._getIconHtml(cfg.icon)}
          </div>
        ` : ''}
        <div class="ms-counter-widget__content">
          ${this.config.title ? `<div class="ms-counter-widget__title">${this.config.title}</div>` : ''}
          <div class="ms-counter-widget__value" style="color: ${cfg.color}">
            ${this._formatValue(value, cfg)}
          </div>
          ${this.config.description ? `<div class="ms-counter-widget__description">${this.config.description}</div>` : ''}
        </div>
      </div>
    `;

    // Animate if enabled
    if (cfg.animated && typeof value === 'number') {
      const valueEl = this.container.querySelector('.ms-counter-widget__value');
      this._animateValue(valueEl, 0, value);
    }

    return this;
  }
}

/**
 * Comparison Counter Widget (with delta/trend)
 */
export class ComparisonCounterWidget extends BaseCounterWidget {
  static defaultConfig = {
    currentValue: 0,
    previousValue: 0,
    format: 'number',
    showDelta: true,
    deltaFormat: 'percentage', // percentage, absolute
    trendColors: {
      up: '#22c55e',
      down: '#ef4444',
      neutral: '#6b7280',
    },
  };

  render() {
    const cfg = { ...ComparisonCounterWidget.defaultConfig, ...this.config.config };
    const data = this.data || {};

    const currentValue = data.currentValue ?? cfg.currentValue;
    const previousValue = data.previousValue ?? cfg.previousValue;

    // Calculate delta
    let delta = 0;
    let deltaText = '';
    let trend = 'neutral';

    if (previousValue !== 0) {
      delta = ((currentValue - previousValue) / previousValue) * 100;
      if (cfg.deltaFormat === 'absolute') {
        deltaText = (currentValue - previousValue >= 0 ? '+' : '') + this._formatValue(currentValue - previousValue, cfg);
      } else {
        deltaText = (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
      }
      trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
    }

    const trendColor = cfg.trendColors[trend];
    const trendIcon = trend === 'up' ? 'fa-arrow-up' : trend === 'down' ? 'fa-arrow-down' : 'fa-minus';

    this.container.innerHTML = `
      <div class="ms-counter-widget ms-counter-widget--comparison">
        <div class="ms-counter-widget__content">
          ${this.config.title ? `<div class="ms-counter-widget__title">${this.config.title}</div>` : ''}
          <div class="ms-counter-widget__value">
            ${this._formatValue(currentValue, cfg)}
          </div>
          ${cfg.showDelta ? `
            <div class="ms-counter-widget__delta" style="color: ${trendColor}">
              <i class="fa-solid ${trendIcon}"></i>
              <span>${deltaText}</span>
              ${cfg.comparisonLabel ? `<span class="ms-counter-widget__delta-label">${cfg.comparisonLabel}</span>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    return this;
  }
}

/**
 * Sparkline Counter Widget (mini chart below value)
 */
export class SparklineCounterWidget extends BaseCounterWidget {
  static defaultConfig = {
    value: 0,
    sparklineData: [],
    sparklineType: 'line', // line, bar, area
    sparklineColor: '#3b82f6',
    sparklineHeight: 40,
  };

  render() {
    const cfg = { ...SparklineCounterWidget.defaultConfig, ...this.config.config };
    const data = this.data || {};
    const value = data.value ?? cfg.value;
    const sparklineData = data.sparklineData ?? cfg.sparklineData;

    this.container.innerHTML = `
      <div class="ms-counter-widget ms-counter-widget--sparkline">
        <div class="ms-counter-widget__content">
          ${this.config.title ? `<div class="ms-counter-widget__title">${this.config.title}</div>` : ''}
          <div class="ms-counter-widget__value">
            ${this._formatValue(value, cfg)}
          </div>
        </div>
        <div class="ms-counter-widget__sparkline" id="${this.id}-sparkline"></div>
      </div>
    `;

    // Render sparkline using SVG
    if (sparklineData.length > 0) {
      this._renderSparkline(sparklineData, cfg);
    }

    return this;
  }

  _renderSparkline(data, cfg) {
    const container = this.container.querySelector('.ms-counter-widget__sparkline');
    if (!container) return;

    const width = container.offsetWidth || 200;
    const height = cfg.sparklineHeight;
    const padding = 4;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return { x, y };
    });

    if (cfg.sparklineType === 'bar') {
      const barWidth = (width - padding * 2) / data.length - 2;
      const bars = data.map((value, index) => {
        const x = padding + (index / data.length) * (width - padding * 2);
        const barHeight = ((value - min) / range) * (height - padding * 2);
        const y = height - padding - barHeight;
        return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${cfg.sparklineColor}" opacity="0.8" rx="1"/>`;
      }).join('');

      container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          ${bars}
        </svg>
      `;
    } else {
      const pathD = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');

      let areaPath = '';
      if (cfg.sparklineType === 'area') {
        areaPath = `
          <path d="${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z"
                fill="${cfg.sparklineColor}" opacity="0.2"/>
        `;
      }

      container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          ${areaPath}
          <path d="${pathD}" fill="none" stroke="${cfg.sparklineColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="3" fill="${cfg.sparklineColor}"/>
        </svg>
      `;
    }
  }
}

/**
 * Progress Counter Widget (shows progress toward goal)
 */
export class ProgressCounterWidget extends BaseCounterWidget {
  static defaultConfig = {
    currentValue: 0,
    targetValue: 100,
    format: 'number',
    showPercentage: true,
    progressType: 'bar', // bar, circle, semicircle
    color: '#8b5cf6',
    trackColor: '#e2e8f0',
  };

  render() {
    const cfg = { ...ProgressCounterWidget.defaultConfig, ...this.config.config };
    const data = this.data || {};

    const currentValue = data.currentValue ?? cfg.currentValue;
    const targetValue = data.targetValue ?? cfg.targetValue;
    const percentage = Math.min((currentValue / targetValue) * 100, 100);

    this.container.innerHTML = `
      <div class="ms-counter-widget ms-counter-widget--progress">
        <div class="ms-counter-widget__content">
          ${this.config.title ? `<div class="ms-counter-widget__title">${this.config.title}</div>` : ''}
          <div class="ms-counter-widget__value">
            ${this._formatValue(currentValue, cfg)}
            <span class="ms-counter-widget__target">/ ${this._formatValue(targetValue, cfg)}</span>
          </div>
          ${cfg.showPercentage ? `<div class="ms-counter-widget__percentage">${percentage.toFixed(1)}%</div>` : ''}
        </div>
        ${this._renderProgress(percentage, cfg)}
      </div>
    `;

    return this;
  }

  _renderProgress(percentage, cfg) {
    if (cfg.progressType === 'circle') {
      const radius = 40;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return `
        <div class="ms-counter-widget__progress-circle">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="${radius}" stroke="${cfg.trackColor}" stroke-width="8" fill="none"/>
            <circle cx="50" cy="50" r="${radius}" stroke="${cfg.color}" stroke-width="8" fill="none"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                    transform="rotate(-90 50 50)" stroke-linecap="round"/>
          </svg>
          <div class="ms-counter-widget__progress-text">${percentage.toFixed(0)}%</div>
        </div>
      `;
    }

    if (cfg.progressType === 'semicircle') {
      const radius = 50;
      const circumference = Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return `
        <div class="ms-counter-widget__progress-semicircle">
          <svg width="120" height="70" viewBox="0 0 120 70">
            <path d="M 10,60 A 50,50 0 0,1 110,60" stroke="${cfg.trackColor}" stroke-width="10" fill="none"/>
            <path d="M 10,60 A 50,50 0 0,1 110,60" stroke="${cfg.color}" stroke-width="10" fill="none"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
          </svg>
        </div>
      `;
    }

    // Default: bar
    return `
      <div class="ms-counter-widget__progress-bar">
        <div class="ms-counter-widget__progress-track" style="background-color: ${cfg.trackColor}">
          <div class="ms-counter-widget__progress-fill" style="width: ${percentage}%; background-color: ${cfg.color}"></div>
        </div>
      </div>
    `;
  }
}

/**
 * Gauge Counter Widget (speedometer-style)
 */
export class GaugeCounterWidget extends BaseCounterWidget {
  static defaultConfig = {
    value: 0,
    min: 0,
    max: 100,
    thresholds: [
      { value: 30, color: '#ef4444' },
      { value: 70, color: '#f59e0b' },
      { value: 100, color: '#22c55e' },
    ],
    showValue: true,
    unit: '',
  };

  render() {
    const cfg = { ...GaugeCounterWidget.defaultConfig, ...this.config.config };
    const data = this.data || {};
    const value = data.value ?? cfg.value;

    // Normalize value to 0-100 range
    const normalizedValue = ((value - cfg.min) / (cfg.max - cfg.min)) * 100;

    // Get color based on thresholds
    let color = cfg.thresholds[cfg.thresholds.length - 1].color;
    for (const threshold of cfg.thresholds) {
      if (normalizedValue <= threshold.value) {
        color = threshold.color;
        break;
      }
    }

    // Calculate gauge angle (180 degree arc)
    const angle = (normalizedValue / 100) * 180 - 90;

    this.container.innerHTML = `
      <div class="ms-counter-widget ms-counter-widget--gauge">
        ${this.config.title ? `<div class="ms-counter-widget__title">${this.config.title}</div>` : ''}
        <div class="ms-counter-widget__gauge">
          <svg viewBox="0 0 120 70" width="100%" height="80">
            <!-- Background arc -->
            <path d="M 10,60 A 50,50 0 0,1 110,60" stroke="#e2e8f0" stroke-width="8" fill="none"/>
            <!-- Colored segments -->
            ${this._renderGaugeSegments(cfg)}
            <!-- Needle -->
            <g transform="rotate(${angle} 60 60)">
              <line x1="60" y1="60" x2="60" y2="20" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <circle cx="60" cy="60" r="6" fill="${color}"/>
            </g>
          </svg>
          ${cfg.showValue ? `
            <div class="ms-counter-widget__gauge-value" style="color: ${color}">
              ${value}${cfg.unit}
            </div>
          ` : ''}
        </div>
        <div class="ms-counter-widget__gauge-labels">
          <span>${cfg.min}</span>
          <span>${cfg.max}</span>
        </div>
      </div>
    `;

    return this;
  }

  _renderGaugeSegments(cfg) {
    const segments = [];
    let prevValue = 0;

    for (const threshold of cfg.thresholds) {
      const startAngle = (prevValue / 100) * Math.PI;
      const endAngle = (threshold.value / 100) * Math.PI;

      const x1 = 60 + 50 * Math.cos(Math.PI - startAngle);
      const y1 = 60 - 50 * Math.sin(Math.PI - startAngle);
      const x2 = 60 + 50 * Math.cos(Math.PI - endAngle);
      const y2 = 60 - 50 * Math.sin(Math.PI - endAngle);

      const largeArc = (threshold.value - prevValue) > 50 ? 1 : 0;

      segments.push(`
        <path d="M ${x1},${y1} A 50,50 0 ${largeArc},1 ${x2},${y2}"
              stroke="${threshold.color}" stroke-width="4" fill="none" opacity="0.3"/>
      `);

      prevValue = threshold.value;
    }

    return segments.join('');
  }
}

// Register all counter widgets with the factory
WidgetFactory.register(WIDGET_TYPES.COUNTER_SINGLE, SingleCounterWidget);
WidgetFactory.register(WIDGET_TYPES.COUNTER_COMPARISON, ComparisonCounterWidget);
WidgetFactory.register(WIDGET_TYPES.COUNTER_SPARKLINE, SparklineCounterWidget);
WidgetFactory.register(WIDGET_TYPES.COUNTER_PROGRESS, ProgressCounterWidget);
WidgetFactory.register(WIDGET_TYPES.COUNTER_GAUGE, GaugeCounterWidget);

