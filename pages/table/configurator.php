<?php
/**
 * Table Widget Configurator Page
 * Create and configure table widgets with live preview
 */

require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/theme-switcher.php';

$basePath = get_base_path();

// Check if editing existing table
$editId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$pageTitle = $editId ? 'Edit Table' : 'Create Table';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?> - Metric Suite</title>

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
<body>
    <!-- Back Navigation -->
    <nav class="ms-nav">
        <a href="<?= $basePath ?>/pages/table/" class="ms-nav__back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Saved Tables
        </a>
        <div id="theme-switcher" class="ms-nav__theme-switcher"></div>
    </nav>

    <!-- Main Configurator Container -->
    <div class="ms-configurator ms-configurator--table">
        <!-- Sidebar Panel -->
        <aside class="ms-configurator__sidebar">
            <div class="ms-configurator__panel">
                <div class="ms-configurator__panel-header">
                    <h2 class="ms-configurator__panel-title">Table Settings</h2>
                </div>
                <div class="ms-configurator__panel-content">
                    <form id="table-form" class="ms-settings-form">
                        <!-- Basic Settings -->
                        <section class="ms-section">
                            <h3 class="ms-section__title">Basic</h3>
                            <div class="ms-section__content">
                                <div class="ms-field">
                                    <label class="ms-field__label" for="table-name">Name</label>
                                    <input type="text" id="table-name" class="ms-input" placeholder="My Table Widget">
                                </div>
                                <div class="ms-field">
                                    <label class="ms-field__label" for="table-title">Title</label>
                                    <input type="text" id="table-title" class="ms-input" placeholder="Widget title">
                                </div>
                                <div class="ms-field">
                                    <label class="ms-field__label" for="table-type">Table Type</label>
                                    <select id="table-type" class="ms-select">
                                        <option value="table-basic">Basic Table</option>
                                        <option value="table-interactive">Interactive (Sort/Filter)</option>
                                        <option value="table-paginated">Paginated Table</option>
                                        <option value="table-expandable">Expandable Rows</option>
                                        <option value="table-editable">Editable Table</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <!-- Columns Configuration -->
                        <section class="ms-section">
                            <h3 class="ms-section__title">Columns</h3>
                            <div class="ms-section__content">
                                <div class="ms-field">
                                    <label class="ms-field__label" for="columns-input">Columns (JSON)</label>
                                    <textarea id="columns-input" class="ms-textarea" rows="6" placeholder='[{"key": "name", "label": "Name"}]'></textarea>
                                    <span class="ms-field__hint">Define columns with key, label, type (text, badge, currency), editable</span>
                                </div>
                            </div>
                        </section>

                        <!-- Type-Specific Options -->
                        <section class="ms-section" id="type-options">
                            <h3 class="ms-section__title">Options</h3>
                            <div class="ms-section__content" id="type-options-content">
                                <!-- Dynamic content based on type -->
                            </div>
                        </section>

                        <!-- Data Source -->
                        <section class="ms-section">
                            <h3 class="ms-section__title">Data</h3>
                            <div class="ms-section__content">
                                <div class="ms-field">
                                    <label class="ms-field__label" for="data-source">Source</label>
                                    <select id="data-source" class="ms-select">
                                        <option value="static">Static Data</option>
                                        <option value="sql">SQL Query</option>
                                        <option value="api">API Endpoint</option>
                                    </select>
                                </div>
                                <div class="ms-field" id="data-input-container">
                                    <label class="ms-field__label" for="data-input">Data (JSON)</label>
                                    <textarea id="data-input" class="ms-textarea" rows="8" placeholder='[{"name": "Row 1", "value": 100}]'></textarea>
                                </div>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </aside>

        <!-- Preview Panel -->
        <main class="ms-configurator__main">
            <div class="ms-configurator__preview-header">
                <h2>Preview</h2>
                <span class="ms-badge--live">Live</span>
            </div>
            <div class="ms-configurator__preview">
                <div id="table-preview" class="ms-table-preview"></div>
            </div>
        </main>

        <!-- Actions -->
        <div class="ms-configurator__actions">
            <button type="button" class="ms-btn ms-btn--secondary" id="btn-cancel">Cancel</button>
            <button type="button" class="ms-btn ms-btn--primary" id="btn-save">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Table
            </button>
        </div>
    </div>

    <!-- Scripts -->
    <script type="module">
        import { ThemeSwitcher, WidgetFactory, WIDGET_TYPES } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        const basePath = '<?= $basePath ?>';
        let currentWidget = null;

        // Type-specific option templates
        const typeOptions = {
            'table-basic': `
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-striped">
                        <span>Striped Rows</span>
                    </label>
                </div>
            `,
            'table-interactive': `
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-sortable" checked>
                        <span>Enable Sorting</span>
                    </label>
                </div>
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-filterable" checked>
                        <span>Enable Filtering</span>
                    </label>
                </div>
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-selectable">
                        <span>Enable Row Selection</span>
                    </label>
                </div>
            `,
            'table-paginated': `
                <div class="ms-field">
                    <label class="ms-field__label" for="opt-pagesize">Page Size</label>
                    <input type="number" id="opt-pagesize" class="ms-input" value="10" min="1">
                </div>
                <div class="ms-field">
                    <label class="ms-field__label" for="opt-pagesizes">Page Size Options (comma-separated)</label>
                    <input type="text" id="opt-pagesizes" class="ms-input" value="5,10,25,50">
                </div>
            `,
            'table-expandable': `
                <div class="ms-field">
                    <label class="ms-field__label" for="opt-expandfield">Expand Content Field</label>
                    <input type="text" id="opt-expandfield" class="ms-input" value="details" placeholder="Field name containing expanded content">
                </div>
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-singleexpand">
                        <span>Single Row Expand Only</span>
                    </label>
                </div>
            `,
            'table-editable': `
                <div class="ms-field">
                    <label class="ms-field__label" for="opt-editablecols">Editable Columns (comma-separated keys)</label>
                    <input type="text" id="opt-editablecols" class="ms-input" placeholder="name,email,status">
                </div>
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-showactions" checked>
                        <span>Show Action Buttons</span>
                    </label>
                </div>
            `
        };

        // Sample columns
        const sampleColumns = [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status', type: 'badge' }
        ];

        // Sample data
        const sampleData = [
            { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', details: 'Additional information about John' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', details: 'Additional information about Jane' },
            { id: 3, name: 'Bob Wilson', email: 'bob@example.com', status: 'Active', details: 'Additional information about Bob' },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Inactive', details: 'Additional information about Alice' },
            { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', status: 'Active', details: 'Additional information about Charlie' }
        ];

        // Initialize with sample data
        document.getElementById('columns-input').value = JSON.stringify(sampleColumns, null, 2);
        document.getElementById('data-input').value = JSON.stringify(sampleData, null, 2);

        // Update type options
        function updateTypeOptions(type) {
            const container = document.getElementById('type-options-content');
            container.innerHTML = typeOptions[type] || '';
            updatePreview();
        }

        // Update preview
        function updatePreview() {
            const type = document.getElementById('table-type').value;
            const title = document.getElementById('table-title').value;
            const previewContainer = document.getElementById('table-preview');

            // Clear existing widget
            previewContainer.innerHTML = '';

            // Parse columns and data
            let columns, data;
            try {
                columns = JSON.parse(document.getElementById('columns-input').value);
            } catch (e) {
                columns = [];
            }
            try {
                data = JSON.parse(document.getElementById('data-input').value);
            } catch (e) {
                data = [];
            }

            // Build config based on type
            const config = {
                type: type,
                title: title || 'Table Preview',
                config: {
                    columns: columns,
                    data: data
                }
            };

            // Type-specific config
            switch (type) {
                case 'table-basic':
                    config.config.striped = document.getElementById('opt-striped')?.checked || false;
                    break;
                case 'table-interactive':
                    config.config.sortable = document.getElementById('opt-sortable')?.checked ?? true;
                    config.config.filterable = document.getElementById('opt-filterable')?.checked ?? true;
                    config.config.selectable = document.getElementById('opt-selectable')?.checked || false;
                    break;
                case 'table-paginated':
                    config.config.pageSize = parseInt(document.getElementById('opt-pagesize')?.value) || 10;
                    const sizes = document.getElementById('opt-pagesizes')?.value || '5,10,25,50';
                    config.config.pageSizeOptions = sizes.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    break;
                case 'table-expandable':
                    config.config.expandField = document.getElementById('opt-expandfield')?.value || 'details';
                    config.config.singleExpand = document.getElementById('opt-singleexpand')?.checked || false;
                    break;
                case 'table-editable':
                    const cols = document.getElementById('opt-editablecols')?.value || '';
                    config.config.editableColumns = cols.split(',').map(s => s.trim()).filter(s => s);
                    config.config.showActions = document.getElementById('opt-showactions')?.checked ?? true;
                    break;
            }

            // Create widget
            try {
                currentWidget = WidgetFactory.create(previewContainer, config);
            } catch (e) {
                console.error('Failed to create widget:', e);
                previewContainer.innerHTML = `<div class="ms-widget__error">Error: ${e.message}</div>`;
            }
        }

        // Event listeners
        document.getElementById('table-type').addEventListener('change', (e) => {
            updateTypeOptions(e.target.value);
        });

        document.getElementById('table-title').addEventListener('input', updatePreview);
        document.getElementById('columns-input').addEventListener('input', updatePreview);
        document.getElementById('data-input').addEventListener('input', updatePreview);
        document.getElementById('type-options-content').addEventListener('change', updatePreview);
        document.getElementById('type-options-content').addEventListener('input', updatePreview);

        document.getElementById('btn-cancel').addEventListener('click', () => {
            window.location.href = basePath + '/pages/table/';
        });

        document.getElementById('btn-save').addEventListener('click', async () => {
            const name = document.getElementById('table-name').value;
            if (!name) {
                alert('Please enter a name for the table');
                return;
            }

            const config = {
                name: name,
                type: document.getElementById('table-type').value,
                title: document.getElementById('table-title').value,
                columns: document.getElementById('columns-input').value,
                data: document.getElementById('data-input').value,
                dataSource: document.getElementById('data-source').value
            };

            try {
                const response = await fetch(basePath + '/api/table.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'save', ...config })
                });
                const result = await response.json();
                if (result.success) {
                    window.location.href = basePath + '/pages/table/';
                } else {
                    alert('Failed to save: ' + (result.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Failed to save table');
            }
        });

        // Initialize
        updateTypeOptions('table-basic');
    </script>

    <style>
        .ms-configurator--table {
            display: grid;
            grid-template-columns: 420px 1fr;
            grid-template-rows: 1fr auto;
            min-height: calc(100vh - 50px);
        }

        .ms-configurator__sidebar {
            grid-row: 1 / 3;
            border-right: 1px solid var(--ms-border);
            background: var(--ms-bg);
            overflow-y: auto;
        }

        .ms-configurator__main {
            padding: var(--ms-space-lg);
            background: var(--ms-bg-secondary);
            overflow-y: auto;
        }

        .ms-configurator__preview-header {
            display: flex;
            align-items: center;
            gap: var(--ms-space-md);
            margin-bottom: var(--ms-space-lg);
        }

        .ms-configurator__preview-header h2 {
            margin: 0;
            font-size: var(--ms-font-size-lg);
        }

        .ms-configurator__preview {
            background: var(--ms-bg);
            border-radius: var(--ms-radius-lg);
            border: 1px solid var(--ms-border);
            min-height: 400px;
            overflow: auto;
        }

        .ms-configurator__actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--ms-space-md);
            padding: var(--ms-space-md) var(--ms-space-lg);
            background: var(--ms-bg);
            border-top: 1px solid var(--ms-border);
        }

        .ms-table-preview {
            min-height: 300px;
        }

        .ms-table-preview .ms-widget {
            height: 100%;
        }
    </style>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
</body>
</html>
