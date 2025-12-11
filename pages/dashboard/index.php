<?php
/**
 * Dashboard Builder Page
 * Create and manage dashboards with multiple widgets
 */

require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/theme-switcher.php';

$basePath = get_base_path();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Builder - Metric Suite</title>

    <!-- Favicon -->
    <?php favicon(); ?>

    <!-- Theme Init (prevents flash) -->
    <?php theme_init_script(); ?>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

    <!-- Styles -->
    <link rel="stylesheet" href="<?= asset('metric-suite.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
</head>
<body class="ms-dashboard-page">
    <!-- Dashboard Header -->
    <header class="ms-dashboard-builder__header">
        <div class="ms-dashboard-builder__nav">
            <a href="<?= $basePath ?>/" class="ms-nav__back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m15 18-6-6 6-6"/>
                </svg>
                Home
            </a>
        </div>
        <div class="ms-dashboard-builder__title">
            <input type="text" id="dashboard-name" class="ms-dashboard-builder__name-input" value="My Dashboard" placeholder="Dashboard Name">
        </div>
        <div class="ms-dashboard-builder__actions">
            <div id="theme-switcher" class="ms-nav__theme-switcher"></div>
            <button class="ms-btn ms-btn--outline" id="btn-preview">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
                Preview
            </button>
            <button class="ms-btn ms-btn--primary" id="btn-save">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save
            </button>
        </div>
    </header>

    <!-- Toolbar -->
    <div class="ms-dashboard-builder__toolbar">
        <div class="ms-dashboard-builder__toolbar-left">
            <button class="ms-btn ms-btn--sm ms-btn--primary" id="btn-add-widget">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Widget
            </button>
            <div class="ms-btn-group">
                <button class="ms-btn ms-btn--sm ms-btn--ghost" id="btn-undo" title="Undo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                </button>
                <button class="ms-btn ms-btn--sm ms-btn--ghost" id="btn-redo" title="Redo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="m20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="ms-dashboard-builder__toolbar-right">
            <span class="ms-toolbar__label">Grid:</span>
            <select id="grid-cols" class="ms-select ms-select--sm">
                <option value="12">12 columns</option>
                <option value="6">6 columns</option>
                <option value="4">4 columns</option>
            </select>
            <label class="ms-checkbox ms-checkbox--sm">
                <input type="checkbox" id="edit-mode" checked>
                <span>Edit Mode</span>
            </label>
        </div>
    </div>

    <!-- Dashboard Canvas -->
    <main class="ms-dashboard-builder__canvas">
        <div id="dashboard-grid" class="ms-dashboard__grid" data-edit-mode="true">
            <!-- Widgets will be rendered here -->
            <div class="ms-dashboard__empty" id="empty-state">
                <div class="ms-dashboard__empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                </div>
                <h3>Start Building Your Dashboard</h3>
                <p>Click "Add Widget" to add charts, counters, lists, or tables</p>
                <button class="ms-btn ms-btn--primary" id="btn-add-first">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add First Widget
                </button>
            </div>
        </div>
    </main>

    <!-- Widget Picker Modal -->
    <div class="ms-modal" id="widget-picker-modal" style="display: none;">
        <div class="ms-modal__backdrop"></div>
        <div class="ms-modal__content ms-modal__content--lg">
            <div class="ms-modal__header">
                <h3 class="ms-modal__title">Add Widget</h3>
                <button class="ms-modal__close" id="widget-picker-close">&times;</button>
            </div>
            <div class="ms-modal__body">
                <div class="ms-widget-picker">
                    <!-- Charts -->
                    <div class="ms-widget-picker__category">
                        <h4>Charts</h4>
                        <div class="ms-widget-picker__grid">
                            <button class="ms-widget-picker__item" data-type="chart" data-subtype="bar">
                                <span class="ms-widget-picker__icon">📊</span>
                                <span class="ms-widget-picker__label">Bar Chart</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="chart" data-subtype="line">
                                <span class="ms-widget-picker__icon">📈</span>
                                <span class="ms-widget-picker__label">Line Chart</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="chart" data-subtype="pie">
                                <span class="ms-widget-picker__icon">🥧</span>
                                <span class="ms-widget-picker__label">Pie Chart</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="chart" data-subtype="gauge">
                                <span class="ms-widget-picker__icon">⏲️</span>
                                <span class="ms-widget-picker__label">Gauge</span>
                            </button>
                        </div>
                    </div>

                    <!-- Counters -->
                    <div class="ms-widget-picker__category">
                        <h4>Counters / KPIs</h4>
                        <div class="ms-widget-picker__grid">
                            <button class="ms-widget-picker__item" data-type="counter-single">
                                <span class="ms-widget-picker__icon">🔢</span>
                                <span class="ms-widget-picker__label">Single Value</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="counter-comparison">
                                <span class="ms-widget-picker__icon">⇅</span>
                                <span class="ms-widget-picker__label">Comparison</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="counter-sparkline">
                                <span class="ms-widget-picker__icon">📉</span>
                                <span class="ms-widget-picker__label">Sparkline</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="counter-progress">
                                <span class="ms-widget-picker__icon">◐</span>
                                <span class="ms-widget-picker__label">Progress</span>
                            </button>
                        </div>
                    </div>

                    <!-- Lists -->
                    <div class="ms-widget-picker__category">
                        <h4>Lists</h4>
                        <div class="ms-widget-picker__grid">
                            <button class="ms-widget-picker__item" data-type="list-simple">
                                <span class="ms-widget-picker__icon">☰</span>
                                <span class="ms-widget-picker__label">Simple List</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="list-ranked">
                                <span class="ms-widget-picker__icon">🏆</span>
                                <span class="ms-widget-picker__label">Ranked List</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="list-timeline">
                                <span class="ms-widget-picker__icon">📅</span>
                                <span class="ms-widget-picker__label">Timeline</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="list-avatar">
                                <span class="ms-widget-picker__icon">👤</span>
                                <span class="ms-widget-picker__label">Avatar List</span>
                            </button>
                        </div>
                    </div>

                    <!-- Tables -->
                    <div class="ms-widget-picker__category">
                        <h4>Tables</h4>
                        <div class="ms-widget-picker__grid">
                            <button class="ms-widget-picker__item" data-type="table-basic">
                                <span class="ms-widget-picker__icon">▦</span>
                                <span class="ms-widget-picker__label">Basic Table</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="table-interactive">
                                <span class="ms-widget-picker__icon">⇳</span>
                                <span class="ms-widget-picker__label">Interactive</span>
                            </button>
                            <button class="ms-widget-picker__item" data-type="table-paginated">
                                <span class="ms-widget-picker__icon">📄</span>
                                <span class="ms-widget-picker__label">Paginated</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="ms-toast-container" id="ms-toast-container"></div>

    <!-- Scripts -->
    <script type="module">
        import { ThemeSwitcher, WidgetFactory, WIDGET_TYPES, DashboardLayout, WidgetConfigurator } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        const basePath = '<?= $basePath ?>';
        let dashboard = null;
        let widgets = [];
        let editMode = true;

        // Sample widget data templates
        const widgetTemplates = {
            'chart': {
                type: WIDGET_TYPES.CHART,
                title: 'Chart Widget',
                layout: { w: 6, h: 3 },
                config: { chartType: 'bar' }
            },
            'counter-single': {
                type: WIDGET_TYPES.COUNTER_SINGLE,
                title: 'Counter',
                layout: { w: 3, h: 2 },
                config: { value: 1234, label: 'Total', color: '#3b82f6' }
            },
            'counter-comparison': {
                type: WIDGET_TYPES.COUNTER_COMPARISON,
                title: 'Comparison',
                layout: { w: 4, h: 2 },
                config: { currentValue: 1500, previousValue: 1200 }
            },
            'counter-sparkline': {
                type: WIDGET_TYPES.COUNTER_SPARKLINE,
                title: 'Trend',
                layout: { w: 4, h: 2 },
                config: { value: 856, sparklineData: [10, 20, 15, 30, 25, 35] }
            },
            'counter-progress': {
                type: WIDGET_TYPES.COUNTER_PROGRESS,
                title: 'Progress',
                layout: { w: 3, h: 2 },
                config: { value: 75, max: 100 }
            },
            'list-simple': {
                type: WIDGET_TYPES.LIST_SIMPLE,
                title: 'Simple List',
                layout: { w: 4, h: 3 },
                config: { items: [{ text: 'Item 1' }, { text: 'Item 2' }, { text: 'Item 3' }] }
            },
            'list-ranked': {
                type: WIDGET_TYPES.LIST_RANKED,
                title: 'Top Items',
                layout: { w: 4, h: 3 },
                config: { items: [{ name: 'First', value: 100 }, { name: 'Second', value: 80 }, { name: 'Third', value: 60 }], showBars: true }
            },
            'list-timeline': {
                type: WIDGET_TYPES.LIST_TIMELINE,
                title: 'Timeline',
                layout: { w: 6, h: 3 },
                config: { events: [{ time: '10:00', event: 'Event 1' }, { time: '14:00', event: 'Event 2' }] }
            },
            'list-avatar': {
                type: WIDGET_TYPES.LIST_AVATAR,
                title: 'Team',
                layout: { w: 4, h: 3 },
                config: { items: [{ name: 'John Doe', subtitle: 'Developer' }, { name: 'Jane Smith', subtitle: 'Designer' }] }
            },
            'table-basic': {
                type: WIDGET_TYPES.TABLE_BASIC,
                title: 'Data Table',
                layout: { w: 6, h: 3 },
                config: { columns: [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }], data: [{ name: 'Row 1', value: 100 }] }
            },
            'table-interactive': {
                type: WIDGET_TYPES.TABLE_INTERACTIVE,
                title: 'Interactive Table',
                layout: { w: 8, h: 4 },
                config: { columns: [{ key: 'name', label: 'Name' }], data: [], sortable: true, filterable: true }
            },
            'table-paginated': {
                type: WIDGET_TYPES.TABLE_PAGINATED,
                title: 'Paginated Table',
                layout: { w: 12, h: 4 },
                config: { columns: [{ key: 'name', label: 'Name' }], data: [], pageSize: 10 }
            }
        };

        // Initialize dashboard
        function initDashboard() {
            const grid = document.getElementById('dashboard-grid');
            updateEmptyState();
        }

        // Update empty state visibility
        function updateEmptyState() {
            const emptyState = document.getElementById('empty-state');
            const grid = document.getElementById('dashboard-grid');
            const widgetCells = grid.querySelectorAll('.ms-dashboard__cell');

            if (widgetCells.length === 0) {
                emptyState.style.display = 'flex';
            } else {
                emptyState.style.display = 'none';
            }
        }

        // Add widget to dashboard
        function addWidget(type) {
            const template = widgetTemplates[type];
            if (!template) {
                console.error('Unknown widget type:', type);
                return;
            }

            const widgetId = 'widget-' + Date.now();
            const grid = document.getElementById('dashboard-grid');

            // Create widget cell
            const cell = document.createElement('div');
            cell.className = `ms-dashboard__cell ms-dashboard__cell--col-${template.layout.w} ms-dashboard__cell--row-${template.layout.h}`;
            if (editMode) cell.classList.add('ms-dashboard__cell--editing');
            cell.dataset.widgetId = widgetId;

            // Add edit controls
            cell.innerHTML = `
                <div class="ms-dashboard__cell-controls">
                    <button class="ms-dashboard__cell-btn" data-action="edit" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="ms-dashboard__cell-btn ms-dashboard__cell-btn--danger" data-action="delete" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="ms-dashboard__resize-handle"></div>
                <div class="ms-widget-container" id="${widgetId}"></div>
            `;

            // Insert before empty state
            const emptyState = document.getElementById('empty-state');
            grid.insertBefore(cell, emptyState);

            // Create widget instance
            try {
                const widget = WidgetFactory.create(`#${widgetId}`, {
                    ...template,
                    id: widgetId
                });
                widgets.push({ id: widgetId, type, widget, config: template });
            } catch (e) {
                console.error('Failed to create widget:', e);
            }

            // Bind controls
            cell.querySelector('[data-action="delete"]').addEventListener('click', () => {
                if (confirm('Delete this widget?')) {
                    cell.remove();
                    widgets = widgets.filter(w => w.id !== widgetId);
                    updateEmptyState();
                }
            });

            cell.querySelector('[data-action="edit"]').addEventListener('click', () => {
                // Open configurator for this widget
                showToast('Widget configurator coming soon', 'info');
            });

            updateEmptyState();
            closeWidgetPicker();
        }

        // Widget Picker Modal
        const widgetPickerModal = document.getElementById('widget-picker-modal');

        function openWidgetPicker() {
            widgetPickerModal.style.display = 'flex';
        }

        function closeWidgetPicker() {
            widgetPickerModal.style.display = 'none';
        }

        document.getElementById('btn-add-widget').addEventListener('click', openWidgetPicker);
        document.getElementById('btn-add-first').addEventListener('click', openWidgetPicker);
        document.getElementById('widget-picker-close').addEventListener('click', closeWidgetPicker);
        widgetPickerModal.querySelector('.ms-modal__backdrop').addEventListener('click', closeWidgetPicker);

        // Widget picker items
        widgetPickerModal.querySelectorAll('.ms-widget-picker__item').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                addWidget(type);
            });
        });

        // Edit mode toggle
        document.getElementById('edit-mode').addEventListener('change', (e) => {
            editMode = e.target.checked;
            const grid = document.getElementById('dashboard-grid');
            grid.dataset.editMode = editMode;

            grid.querySelectorAll('.ms-dashboard__cell').forEach(cell => {
                if (editMode) {
                    cell.classList.add('ms-dashboard__cell--editing');
                } else {
                    cell.classList.remove('ms-dashboard__cell--editing');
                }
            });
        });

        // Save dashboard
        document.getElementById('btn-save').addEventListener('click', async () => {
            const name = document.getElementById('dashboard-name').value;
            if (!name) {
                showToast('Please enter a dashboard name', 'warning');
                return;
            }

            const config = {
                name,
                widgets: widgets.map(w => ({
                    id: w.id,
                    type: w.type,
                    config: w.config
                }))
            };

            try {
                const response = await fetch(basePath + '/api/dashboard.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'save', ...config })
                });
                const result = await response.json();
                if (result.success) {
                    showToast('Dashboard saved!', 'success');
                } else {
                    showToast('Failed to save: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (e) {
                showToast('Failed to save dashboard', 'error');
            }
        });

        // Preview mode
        document.getElementById('btn-preview').addEventListener('click', () => {
            const editCheckbox = document.getElementById('edit-mode');
            editCheckbox.checked = !editCheckbox.checked;
            editCheckbox.dispatchEvent(new Event('change'));
        });

        // Toast helper
        function showToast(message, type = 'info') {
            const container = document.getElementById('ms-toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `ms-toast ms-toast--${type}`;
            toast.innerHTML = `
                <span class="ms-toast__message">${message}</span>
                <button class="ms-toast__close">&times;</button>
            `;

            toast.querySelector('.ms-toast__close').addEventListener('click', () => toast.remove());
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('ms-toast--hiding');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        // Initialize
        initDashboard();
    </script>

    <style>
        .ms-dashboard-page {
            min-height: 100vh;
            background: var(--ms-bg-secondary);
            display: flex;
            flex-direction: column;
        }

        .ms-dashboard-builder__header {
            display: flex;
            align-items: center;
            gap: var(--ms-space-lg);
            padding: var(--ms-space-sm) var(--ms-space-lg);
            background: var(--ms-bg);
            border-bottom: 1px solid var(--ms-border);
        }

        .ms-dashboard-builder__nav {
            flex-shrink: 0;
        }

        .ms-dashboard-builder__title {
            flex: 1;
        }

        .ms-dashboard-builder__name-input {
            width: 100%;
            max-width: 300px;
            padding: var(--ms-space-xs) var(--ms-space-sm);
            font-size: var(--ms-font-size-lg);
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: var(--ms-radius-md);
            background: transparent;
            color: var(--ms-text);

            &:hover,
            &:focus {
                border-color: var(--ms-border);
                background: var(--ms-bg);
                outline: none;
            }
        }

        .ms-dashboard-builder__actions {
            display: flex;
            align-items: center;
            gap: var(--ms-space-sm);
        }

        .ms-dashboard-builder__toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--ms-space-sm) var(--ms-space-lg);
            background: var(--ms-bg);
            border-bottom: 1px solid var(--ms-border);
        }

        .ms-dashboard-builder__toolbar-left,
        .ms-dashboard-builder__toolbar-right {
            display: flex;
            align-items: center;
            gap: var(--ms-space-md);
        }

        .ms-toolbar__label {
            font-size: var(--ms-font-size-sm);
            color: var(--ms-text-secondary);
        }

        .ms-btn-group {
            display: flex;
            gap: 1px;
        }

        .ms-dashboard-builder__canvas {
            flex: 1;
            padding: var(--ms-space-lg);
            overflow: auto;
        }

        .ms-dashboard__grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: var(--ms-space-md);
            min-height: 400px;
        }

        .ms-dashboard__empty {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--ms-space-2xl);
            background: var(--ms-bg);
            border: 2px dashed var(--ms-border);
            border-radius: var(--ms-radius-lg);
            text-align: center;
        }

        .ms-dashboard__empty-icon {
            color: var(--ms-text-muted);
            margin-bottom: var(--ms-space-md);
            opacity: 0.5;
        }

        .ms-dashboard__empty h3 {
            margin: 0 0 var(--ms-space-sm);
            color: var(--ms-text);
        }

        .ms-dashboard__empty p {
            margin: 0 0 var(--ms-space-lg);
            color: var(--ms-text-secondary);
        }

        /* Widget Picker Modal */
        .ms-modal__content--lg {
            max-width: 700px;
        }

        .ms-widget-picker__category {
            margin-bottom: var(--ms-space-lg);
        }

        .ms-widget-picker__category h4 {
            margin: 0 0 var(--ms-space-sm);
            font-size: var(--ms-font-size-sm);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--ms-text-secondary);
        }

        .ms-widget-picker__grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: var(--ms-space-sm);
        }

        .ms-widget-picker__item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--ms-space-xs);
            padding: var(--ms-space-md);
            background: var(--ms-bg-secondary);
            border: 1px solid var(--ms-border);
            border-radius: var(--ms-radius-md);
            cursor: pointer;
            transition: all var(--ms-transition-fast);
        }

        .ms-widget-picker__item:hover {
            border-color: var(--ms-primary);
            background: var(--ms-primary-light);
        }

        .ms-widget-picker__icon {
            font-size: 24px;
        }

        .ms-widget-picker__label {
            font-size: var(--ms-font-size-xs);
            font-weight: 500;
            text-align: center;
        }

        /* Dashboard cell styles */
        .ms-dashboard__cell {
            position: relative;
            min-height: 150px;
            background: var(--ms-bg);
            border-radius: var(--ms-radius-lg);
            border: 1px solid var(--ms-border);
            overflow: hidden;
        }

        .ms-dashboard__cell--editing {
            &:hover {
                outline: 2px dashed var(--ms-primary);
                outline-offset: 2px;
            }

            .ms-dashboard__cell-controls {
                display: flex;
            }

            .ms-dashboard__resize-handle {
                display: block;
            }
        }

        .ms-dashboard__cell-controls {
            position: absolute;
            top: var(--ms-space-xs);
            right: var(--ms-space-xs);
            display: none;
            gap: var(--ms-space-xs);
            z-index: 10;
        }

        .ms-dashboard__cell-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: var(--ms-radius-sm);
            background: var(--ms-bg);
            color: var(--ms-text-secondary);
            cursor: pointer;
            box-shadow: var(--ms-shadow-sm);
            transition: all var(--ms-transition-fast);
        }

        .ms-dashboard__cell-btn:hover {
            background: var(--ms-primary);
            color: white;
        }

        .ms-dashboard__cell-btn--danger:hover {
            background: var(--ms-error);
        }

        .ms-dashboard__resize-handle {
            display: none;
            position: absolute;
            bottom: 0;
            right: 0;
            width: 16px;
            height: 16px;
            cursor: se-resize;
        }

        .ms-dashboard__resize-handle::after {
            content: '';
            position: absolute;
            bottom: 4px;
            right: 4px;
            width: 8px;
            height: 8px;
            border-right: 2px solid var(--ms-border);
            border-bottom: 2px solid var(--ms-border);
        }

        .ms-widget-container {
            height: 100%;
        }

        .ms-widget-container .ms-widget {
            height: 100%;
            border: none;
            border-radius: 0;
        }

        /* Grid column spans */
        @for $i from 1 through 12 {
            .ms-dashboard__cell--col-#{$i} {
                grid-column: span #{$i};
            }
        }

        @for $i from 1 through 6 {
            .ms-dashboard__cell--row-#{$i} {
                grid-row: span #{$i};
            }
        }

        .ms-dashboard__cell--col-1 { grid-column: span 1; }
        .ms-dashboard__cell--col-2 { grid-column: span 2; }
        .ms-dashboard__cell--col-3 { grid-column: span 3; }
        .ms-dashboard__cell--col-4 { grid-column: span 4; }
        .ms-dashboard__cell--col-5 { grid-column: span 5; }
        .ms-dashboard__cell--col-6 { grid-column: span 6; }
        .ms-dashboard__cell--col-7 { grid-column: span 7; }
        .ms-dashboard__cell--col-8 { grid-column: span 8; }
        .ms-dashboard__cell--col-9 { grid-column: span 9; }
        .ms-dashboard__cell--col-10 { grid-column: span 10; }
        .ms-dashboard__cell--col-11 { grid-column: span 11; }
        .ms-dashboard__cell--col-12 { grid-column: span 12; }

        .ms-dashboard__cell--row-1 { grid-row: span 1; min-height: 100px; }
        .ms-dashboard__cell--row-2 { grid-row: span 2; min-height: 200px; }
        .ms-dashboard__cell--row-3 { grid-row: span 3; min-height: 300px; }
        .ms-dashboard__cell--row-4 { grid-row: span 4; min-height: 400px; }
        .ms-dashboard__cell--row-5 { grid-row: span 5; min-height: 500px; }
        .ms-dashboard__cell--row-6 { grid-row: span 6; min-height: 600px; }

        @media (max-width: 768px) {
            .ms-widget-picker__grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .ms-dashboard__grid {
                grid-template-columns: repeat(4, 1fr);
            }

            .ms-dashboard__cell {
                grid-column: span 4 !important;
            }
        }
    </style>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
</body>
</html>
