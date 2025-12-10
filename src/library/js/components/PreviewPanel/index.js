/**
 * PreviewPanel Component
 * Shared preview panel with header, screenshot functionality, and export options
 */

import { createElement } from '../Graph/utils.js';

export class PreviewPanel {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      throw new Error('PreviewPanel: Container element not found');
    }

    this.options = {
      title: 'Preview',
      type: 'generic', // 'graph', 'counter', 'generic'
      showScreenshot: true,
      showExport: true,
      screenshotEndpoint: null,
      onScreenshot: null,
      onExportHTML: null,
      onExportJS: null,
      onExportJSON: null,
      ...options,
    };

    this.screenshotDropdownOpen = false;
    this.hasThumbnail = false;

    this._init();
  }

  _init() {
    this.container.innerHTML = '';
    this.container.className = 'ms-configurator__preview';

    // Create preview container
    this.previewEl = this._createPreviewContainer();
    this.container.appendChild(this.previewEl);

    // Create export section if enabled
    if (this.options.showExport) {
      this.exportEl = this._createExportSection();
      this.container.appendChild(this.exportEl);
    }

    this._bindEvents();
  }

  _createPreviewContainer() {
    const container = createElement('div', { className: 'ms-preview' });

    // Header
    const header = createElement('div', { className: 'ms-preview__header' }, [
      createElement('div', { className: 'ms-preview__title-group' }, [
        createElement('h3', { className: 'ms-preview__name', id: 'ms-preview-name' }, [this.options.title]),
        createElement('span', { className: 'ms-preview__badge' }, ['Live Preview']),
      ]),
    ]);

    // Screenshot button (if enabled)
    if (this.options.showScreenshot) {
      header.appendChild(this._createScreenshotButton());
    }

    container.appendChild(header);

    // Content area
    const content = createElement('div', {
      className: 'ms-preview__content',
      id: 'ms-preview-content',
    });
    container.appendChild(content);

    return container;
  }

  _createScreenshotButton() {
    const wrapper = createElement('div', { className: 'ms-screenshot', id: 'ms-screenshot' }, [
      createElement('button', {
        className: 'ms-screenshot__btn',
        id: 'ms-screenshot-btn',
        title: 'Capture image',
      }),
      createElement('button', {
        className: 'ms-screenshot__dropdown-toggle',
        id: 'ms-screenshot-toggle',
        title: 'Screenshot options',
      }),
      createElement('div', { className: 'ms-screenshot__dropdown', id: 'ms-screenshot-dropdown' }, [
        // Thumbnail actions
        createElement('div', { className: 'ms-screenshot__actions', id: 'ms-thumbnail-actions', style: 'display: none;' }, [
          createElement('button', { className: 'ms-screenshot__action', id: 'ms-thumbnail-view', title: 'View thumbnail' }, [
            createElement('span', { className: 'ms-screenshot__action-icon' }),
            'View Thumbnail',
          ]),
          createElement('button', { className: 'ms-screenshot__action ms-screenshot__action--danger', id: 'ms-thumbnail-delete', title: 'Delete thumbnail' }, [
            createElement('span', { className: 'ms-screenshot__action-icon' }),
            'Delete Thumbnail',
          ]),
          createElement('div', { className: 'ms-screenshot__divider' }),
        ]),
        // Capture options
        createElement('div', { className: 'ms-screenshot__options-label' }, ['On Capture']),
        createElement('label', { className: 'ms-screenshot__option' }, [
          createElement('input', { type: 'checkbox', id: 'ms-screenshot-download', checked: true }),
          createElement('span', {}, ['Download image']),
        ]),
        createElement('label', { className: 'ms-screenshot__option' }, [
          createElement('input', { type: 'checkbox', id: 'ms-screenshot-show-preview' }),
          createElement('span', {}, ['Show preview']),
        ]),
        createElement('div', { className: 'ms-screenshot__note' }, ['Screenshots are automatically saved to server']),
      ]),
    ]);

    // Add icons
    wrapper.querySelector('#ms-screenshot-btn').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    `;
    wrapper.querySelector('#ms-screenshot-toggle').innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    `;
    wrapper.querySelector('#ms-thumbnail-view .ms-screenshot__action-icon').innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `;
    wrapper.querySelector('#ms-thumbnail-delete .ms-screenshot__action-icon').innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;

    return wrapper;
  }

  _createExportSection() {
    return createElement('div', { className: 'ms-export' }, [
      createElement('h3', {}, ['Export']),
      createElement('div', { className: 'ms-export__buttons' }, [
        createElement('button', {
          className: 'ms-btn ms-btn--outline',
          id: 'ms-export-html-btn',
        }, ['Copy HTML']),
        createElement('button', {
          className: 'ms-btn ms-btn--outline',
          id: 'ms-export-js-btn',
        }, ['Copy JS']),
        createElement('button', {
          className: 'ms-btn ms-btn--outline',
          id: 'ms-export-json-btn',
        }, ['Download JSON']),
      ]),
    ]);
  }

  _bindEvents() {
    // Screenshot button
    const screenshotBtn = document.getElementById('ms-screenshot-btn');
    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', () => {
        if (this.options.onScreenshot) {
          this.options.onScreenshot();
        }
      });
    }

    // Screenshot dropdown toggle
    const toggleBtn = document.getElementById('ms-screenshot-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleDropdown();
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#ms-screenshot')) {
        this._closeDropdown();
      }
    });

    // Export buttons
    document.getElementById('ms-export-html-btn')?.addEventListener('click', () => {
      if (this.options.onExportHTML) this.options.onExportHTML();
    });

    document.getElementById('ms-export-js-btn')?.addEventListener('click', () => {
      if (this.options.onExportJS) this.options.onExportJS();
    });

    document.getElementById('ms-export-json-btn')?.addEventListener('click', () => {
      if (this.options.onExportJSON) this.options.onExportJSON();
    });
  }

  _toggleDropdown() {
    const dropdown = document.getElementById('ms-screenshot-dropdown');
    if (dropdown) {
      this.screenshotDropdownOpen = !this.screenshotDropdownOpen;
      dropdown.classList.toggle('is-open', this.screenshotDropdownOpen);
    }
  }

  _closeDropdown() {
    const dropdown = document.getElementById('ms-screenshot-dropdown');
    if (dropdown) {
      this.screenshotDropdownOpen = false;
      dropdown.classList.remove('is-open');
    }
  }

  setTitle(title) {
    const nameEl = document.getElementById('ms-preview-name');
    if (nameEl) {
      nameEl.textContent = title || this.options.title;
    }
  }

  setThumbnail(hasThumbnail) {
    this.hasThumbnail = hasThumbnail;
    const actions = document.getElementById('ms-thumbnail-actions');
    if (actions) {
      actions.style.display = hasThumbnail ? 'block' : 'none';
    }
  }

  getContentElement() {
    return document.getElementById('ms-preview-content');
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default PreviewPanel;
