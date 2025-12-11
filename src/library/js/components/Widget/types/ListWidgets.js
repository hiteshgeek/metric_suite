/**
 * List Widget Types
 * Various list styles for displaying data collections
 */

import { WIDGET_TYPES } from '../constants.js';
import { Widget, WidgetFactory } from '../index.js';
import { formatNumber } from '../../Graph/utils.js';

/**
 * Base List Widget - shared functionality
 */
export class BaseListWidget extends Widget {
  _init() {
    super._init();
    this.container.classList.add('ms-widget--list');
  }

  /**
   * Format value based on type
   */
  _formatValue(value, format = 'number') {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'currency':
        return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2 });
      case 'percentage':
        return value.toFixed(1) + '%';
      case 'compact':
        if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return value.toString();
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'time':
        return new Date(value).toLocaleTimeString();
      default:
        return typeof value === 'number' ? formatNumber(value) : String(value);
    }
  }

  /**
   * Get icon HTML
   */
  _getIconHtml(icon, color = null) {
    if (!icon) return '';
    const style = color ? `style="color: ${color}"` : '';
    if (icon.startsWith('fa-')) {
      return `<i class="${icon}" ${style}></i>`;
    }
    return `<i class="fa-solid ${icon}" ${style}></i>`;
  }

  /**
   * Get status indicator HTML
   */
  _getStatusHtml(status) {
    const colors = {
      online: '#22c55e',
      offline: '#6b7280',
      busy: '#f59e0b',
      away: '#f97316',
    };
    const color = colors[status] || colors.offline;
    return `<span class="ms-list-widget__status" style="background-color: ${color}"></span>`;
  }
}

/**
 * Simple List Widget
 */
export class SimpleListWidget extends BaseListWidget {
  static defaultConfig = {
    items: [],
    maxItems: 10,
    showIndex: false,
    emptyText: 'No items to display',
  };

  render() {
    const cfg = { ...SimpleListWidget.defaultConfig, ...this.config.config };
    const items = (this.data?.items ?? cfg.items).slice(0, cfg.maxItems);

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="ms-list-widget ms-list-widget--simple">
          ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
          <div class="ms-list-widget__empty">${cfg.emptyText}</div>
        </div>
      `;
      return this;
    }

    const itemsHtml = items.map((item, index) => `
      <div class="ms-list-widget__item">
        ${cfg.showIndex ? `<span class="ms-list-widget__index">${index + 1}</span>` : ''}
        <div class="ms-list-widget__content">
          <span class="ms-list-widget__text">${item.text || item}</span>
          ${item.meta ? `<span class="ms-list-widget__meta">${item.meta}</span>` : ''}
        </div>
        ${item.action ? `<button class="ms-list-widget__action" data-action="${item.action.type}" data-target="${item.action.url || ''}">
          <i class="fa-solid fa-chevron-right"></i>
        </button>` : ''}
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="ms-list-widget ms-list-widget--simple">
        ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
        <div class="ms-list-widget__items">${itemsHtml}</div>
      </div>
    `;

    return this;
  }
}

/**
 * Ranked List Widget (with position indicators and values)
 */
export class RankedListWidget extends BaseListWidget {
  static defaultConfig = {
    items: [],
    maxItems: 10,
    showRankBadge: true,
    valueFormat: 'number',
    highlightTop: 3,
    emptyText: 'No items to display',
  };

  render() {
    const cfg = { ...RankedListWidget.defaultConfig, ...this.config.config };
    const items = (this.data?.items ?? cfg.items).slice(0, cfg.maxItems);

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="ms-list-widget ms-list-widget--ranked">
          ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
          <div class="ms-list-widget__empty">${cfg.emptyText}</div>
        </div>
      `;
      return this;
    }

    const itemsHtml = items.map((item, index) => {
      const rank = item.rank ?? index + 1;
      const isHighlighted = rank <= cfg.highlightTop;
      const rankClass = isHighlighted ? `ms-list-widget__rank--top${rank}` : '';

      return `
        <div class="ms-list-widget__item ${isHighlighted ? 'ms-list-widget__item--highlighted' : ''}">
          ${cfg.showRankBadge ? `
            <span class="ms-list-widget__rank ${rankClass}">${rank}</span>
          ` : ''}
          <div class="ms-list-widget__content">
            <span class="ms-list-widget__label">${item.label}</span>
            ${item.badge ? `<span class="ms-list-widget__badge ms-list-widget__badge--${item.badge}">${item.badge}</span>` : ''}
          </div>
          <span class="ms-list-widget__value">${this._formatValue(item.value, cfg.valueFormat)}</span>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="ms-list-widget ms-list-widget--ranked">
        ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
        <div class="ms-list-widget__items">${itemsHtml}</div>
      </div>
    `;

    return this;
  }
}

/**
 * Grouped List Widget (collapsible sections)
 */
export class GroupedListWidget extends BaseListWidget {
  static defaultConfig = {
    groups: [],
    emptyText: 'No items to display',
  };

  render() {
    const cfg = { ...GroupedListWidget.defaultConfig, ...this.config.config };
    const groups = this.data?.groups ?? cfg.groups;

    if (groups.length === 0) {
      this.container.innerHTML = `
        <div class="ms-list-widget ms-list-widget--grouped">
          ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
          <div class="ms-list-widget__empty">${cfg.emptyText}</div>
        </div>
      `;
      return this;
    }

    const groupsHtml = groups.map((group, groupIndex) => {
      const isCollapsed = group.collapsed ?? false;
      const itemsHtml = (group.items || []).map(item => `
        <div class="ms-list-widget__item">
          <div class="ms-list-widget__content">
            <span class="ms-list-widget__text">${item.text}</span>
            ${item.meta ? `<span class="ms-list-widget__meta">${item.meta}</span>` : ''}
          </div>
        </div>
      `).join('');

      return `
        <div class="ms-list-widget__group ${isCollapsed ? 'is-collapsed' : ''}" data-group="${groupIndex}">
          <div class="ms-list-widget__group-header" data-toggle="group">
            <span class="ms-list-widget__group-title">${group.header}</span>
            <span class="ms-list-widget__group-count">${group.items?.length || 0}</span>
            <i class="fa-solid fa-chevron-down ms-list-widget__group-toggle"></i>
          </div>
          <div class="ms-list-widget__group-items">
            ${itemsHtml}
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="ms-list-widget ms-list-widget--grouped">
        ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
        <div class="ms-list-widget__groups">${groupsHtml}</div>
      </div>
    `;

    // Bind group toggle events
    this._bindGroupToggles();

    return this;
  }

  _bindGroupToggles() {
    const headers = this.container.querySelectorAll('[data-toggle="group"]');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.ms-list-widget__group');
        group.classList.toggle('is-collapsed');
      });
    });
  }
}

/**
 * Avatar List Widget (user/member lists with avatars)
 */
export class AvatarListWidget extends BaseListWidget {
  static defaultConfig = {
    items: [],
    maxItems: 10,
    layout: 'vertical', // vertical, horizontal
    showStatus: true,
    emptyText: 'No members to display',
  };

  render() {
    const cfg = { ...AvatarListWidget.defaultConfig, ...this.config.config };
    const items = (this.data?.items ?? cfg.items).slice(0, cfg.maxItems);

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="ms-list-widget ms-list-widget--avatar ms-list-widget--${cfg.layout}">
          ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
          <div class="ms-list-widget__empty">${cfg.emptyText}</div>
        </div>
      `;
      return this;
    }

    const itemsHtml = items.map(item => {
      const avatarContent = item.avatar
        ? (item.avatar.startsWith('http')
          ? `<img src="${item.avatar}" alt="${item.primary || ''}">`
          : `<span class="ms-list-widget__initials">${item.avatar}</span>`)
        : `<span class="ms-list-widget__initials">${this._getInitials(item.primary)}</span>`;

      return `
        <div class="ms-list-widget__item">
          <div class="ms-list-widget__avatar">
            ${avatarContent}
            ${cfg.showStatus && item.status ? this._getStatusHtml(item.status) : ''}
          </div>
          <div class="ms-list-widget__content">
            <span class="ms-list-widget__primary">${item.primary}</span>
            ${item.secondary ? `<span class="ms-list-widget__secondary">${item.secondary}</span>` : ''}
          </div>
          ${item.action ? `
            <a href="${item.action.url || '#'}" class="ms-list-widget__action-link">
              <i class="fa-solid fa-chevron-right"></i>
            </a>
          ` : ''}
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="ms-list-widget ms-list-widget--avatar ms-list-widget--${cfg.layout}">
        ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
        <div class="ms-list-widget__items">${itemsHtml}</div>
      </div>
    `;

    return this;
  }

  _getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}

/**
 * Timeline List Widget (vertical timeline with events)
 */
export class TimelineListWidget extends BaseListWidget {
  static defaultConfig = {
    items: [],
    orientation: 'vertical', // vertical, horizontal
    showTimestamp: true,
    emptyText: 'No events to display',
  };

  render() {
    const cfg = { ...TimelineListWidget.defaultConfig, ...this.config.config };
    const items = this.data?.items ?? cfg.items;

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="ms-list-widget ms-list-widget--timeline ms-list-widget--${cfg.orientation}">
          ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
          <div class="ms-list-widget__empty">${cfg.emptyText}</div>
        </div>
      `;
      return this;
    }

    const itemsHtml = items.map((item, index) => {
      const color = item.color || '#3b82f6';
      const isLast = index === items.length - 1;

      return `
        <div class="ms-list-widget__timeline-item ${isLast ? 'ms-list-widget__timeline-item--last' : ''}">
          <div class="ms-list-widget__timeline-marker" style="background-color: ${color}">
            ${item.icon ? this._getIconHtml(item.icon) : ''}
          </div>
          <div class="ms-list-widget__timeline-content">
            ${cfg.showTimestamp && item.timestamp ? `
              <span class="ms-list-widget__timeline-time">${this._formatTimestamp(item.timestamp)}</span>
            ` : ''}
            <span class="ms-list-widget__timeline-event">${item.event}</span>
            ${item.description ? `<p class="ms-list-widget__timeline-description">${item.description}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="ms-list-widget ms-list-widget--timeline ms-list-widget--${cfg.orientation}">
        ${this.config.title ? `<div class="ms-list-widget__header"><h3>${this.config.title}</h3></div>` : ''}
        <div class="ms-list-widget__timeline">${itemsHtml}</div>
      </div>
    `;

    return this;
  }

  _formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

// Register all list widgets
WidgetFactory.register(WIDGET_TYPES.LIST_SIMPLE, SimpleListWidget);
WidgetFactory.register(WIDGET_TYPES.LIST_RANKED, RankedListWidget);
WidgetFactory.register(WIDGET_TYPES.LIST_GROUPED, GroupedListWidget);
WidgetFactory.register(WIDGET_TYPES.LIST_AVATAR, AvatarListWidget);
WidgetFactory.register(WIDGET_TYPES.LIST_TIMELINE, TimelineListWidget);

