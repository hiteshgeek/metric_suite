<?php
/**
 * List Widget Configurator Page
 * Create and configure list widgets with live preview
 */

require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/theme-switcher.php';

$basePath = get_base_path();

// Check if editing existing list
$editId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$pageTitle = $editId ? 'Edit List' : 'Create List';
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
        <a href="<?= $basePath ?>/pages/list/" class="ms-nav__back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Saved Lists
        </a>
        <div id="theme-switcher" class="ms-nav__theme-switcher"></div>
    </nav>

    <!-- Main Configurator Container -->
    <div class="ms-configurator ms-configurator--list">
        <!-- Sidebar Panel -->
        <aside class="ms-configurator__sidebar">
            <div class="ms-configurator__panel">
                <div class="ms-configurator__panel-header">
                    <h2 class="ms-configurator__panel-title">List Settings</h2>
                </div>
                <div class="ms-configurator__panel-content">
                    <form id="list-form" class="ms-settings-form">
                        <!-- Basic Settings -->
                        <section class="ms-section">
                            <h3 class="ms-section__title">Basic</h3>
                            <div class="ms-section__content">
                                <div class="ms-field">
                                    <label class="ms-field__label" for="list-name">Name</label>
                                    <input type="text" id="list-name" class="ms-input" placeholder="My List Widget">
                                </div>
                                <div class="ms-field">
                                    <label class="ms-field__label" for="list-title">Title</label>
                                    <input type="text" id="list-title" class="ms-input" placeholder="Widget title">
                                </div>
                                <div class="ms-field">
                                    <label class="ms-field__label" for="list-type">List Type</label>
                                    <select id="list-type" class="ms-select">
                                        <option value="list-simple">Simple List</option>
                                        <option value="list-ranked">Ranked List</option>
                                        <option value="list-grouped">Grouped List</option>
                                        <option value="list-avatar">Avatar List</option>
                                        <option value="list-timeline">Timeline List</option>
                                    </select>
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
                            <h3 class="ms-section__title">Data Source</h3>
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
                                    <textarea id="data-input" class="ms-textarea" rows="6" placeholder='[{"text": "Item 1"}, {"text": "Item 2"}]'></textarea>
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
                <div id="list-preview" class="ms-list-preview"></div>
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
                Save List
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
            'list-simple': `
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-bullets">
                        <span>Show Bullets</span>
                    </label>
                </div>
            `,
            'list-ranked': `
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-bars" checked>
                        <span>Show Progress Bars</span>
                    </label>
                </div>
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-medals" checked>
                        <span>Show Medal Colors</span>
                    </label>
                </div>
                <div class="ms-field">
                    <label class="ms-field__label" for="opt-max">Max Items</label>
                    <input type="number" id="opt-max" class="ms-input" value="10" min="1">
                </div>
            `,
            'list-grouped': `
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-collapsible" checked>
                        <span>Collapsible Groups</span>
                    </label>
                </div>
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-expanded" checked>
                        <span>Default Expanded</span>
                    </label>
                </div>
            `,
            'list-avatar': `
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-status">
                        <span>Show Status Indicator</span>
                    </label>
                </div>
            `,
            'list-timeline': `
                <div class="ms-field">
                    <label class="ms-checkbox">
                        <input type="checkbox" id="opt-descriptions" checked>
                        <span>Show Descriptions</span>
                    </label>
                </div>
            `
        };

        // Sample data for each type
        const sampleData = {
            'list-simple': [
                { text: 'First item in the list' },
                { text: 'Second item with details' },
                { text: 'Third item entry' },
                { text: 'Fourth item here' },
                { text: 'Fifth and final item' }
            ],
            'list-ranked': [
                { name: 'Product Alpha', value: 1250 },
                { name: 'Product Beta', value: 980 },
                { name: 'Product Gamma', value: 756 },
                { name: 'Product Delta', value: 534 },
                { name: 'Product Epsilon', value: 312 }
            ],
            'list-grouped': {
                groups: [
                    { name: 'Category A', items: [{ text: 'Item A1' }, { text: 'Item A2' }] },
                    { name: 'Category B', items: [{ text: 'Item B1' }, { text: 'Item B2' }, { text: 'Item B3' }] }
                ]
            },
            'list-avatar': [
                { name: 'John Smith', subtitle: 'Developer', initials: 'JS' },
                { name: 'Jane Doe', subtitle: 'Designer', initials: 'JD' },
                { name: 'Bob Wilson', subtitle: 'Manager', initials: 'BW' }
            ],
            'list-timeline': {
                events: [
                    { time: '2024-01-15', event: 'Project Started', description: 'Initial kickoff meeting', status: 'success' },
                    { time: '2024-02-01', event: 'Phase 1 Complete', description: 'Design approved', status: 'success' },
                    { time: '2024-02-15', event: 'Development', description: 'In progress', status: 'warning' }
                ]
            }
        };

        // Update type options
        function updateTypeOptions(type) {
            const container = document.getElementById('type-options-content');
            container.innerHTML = typeOptions[type] || '';

            // Update sample data
            const dataInput = document.getElementById('data-input');
            const data = sampleData[type];
            if (data) {
                dataInput.value = JSON.stringify(data, null, 2);
            }

            updatePreview();
        }

        // Update preview
        function updatePreview() {
            const type = document.getElementById('list-type').value;
            const title = document.getElementById('list-title').value;
            const previewContainer = document.getElementById('list-preview');

            // Clear existing widget
            previewContainer.innerHTML = '';

            // Parse data
            let data;
            try {
                data = JSON.parse(document.getElementById('data-input').value);
            } catch (e) {
                data = [];
            }

            // Build config based on type
            const config = {
                type: type,
                title: title || 'List Preview',
                config: {}
            };

            // Type-specific config
            switch (type) {
                case 'list-simple':
                    config.config.items = Array.isArray(data) ? data : [];
                    config.config.showBullets = document.getElementById('opt-bullets')?.checked || false;
                    break;
                case 'list-ranked':
                    config.config.items = Array.isArray(data) ? data : [];
                    config.config.showBars = document.getElementById('opt-bars')?.checked ?? true;
                    config.config.showMedals = document.getElementById('opt-medals')?.checked ?? true;
                    config.config.maxItems = parseInt(document.getElementById('opt-max')?.value) || 10;
                    break;
                case 'list-grouped':
                    config.config.groups = data.groups || [];
                    config.config.collapsible = document.getElementById('opt-collapsible')?.checked ?? true;
                    config.config.defaultExpanded = document.getElementById('opt-expanded')?.checked ?? true;
                    break;
                case 'list-avatar':
                    config.config.items = Array.isArray(data) ? data : [];
                    config.config.showStatus = document.getElementById('opt-status')?.checked || false;
                    break;
                case 'list-timeline':
                    config.config.events = data.events || [];
                    config.config.showDescriptions = document.getElementById('opt-descriptions')?.checked ?? true;
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
        document.getElementById('list-type').addEventListener('change', (e) => {
            updateTypeOptions(e.target.value);
        });

        document.getElementById('list-title').addEventListener('input', updatePreview);
        document.getElementById('data-input').addEventListener('input', updatePreview);
        document.getElementById('type-options-content').addEventListener('change', updatePreview);

        document.getElementById('btn-cancel').addEventListener('click', () => {
            window.location.href = basePath + '/pages/list/';
        });

        document.getElementById('btn-save').addEventListener('click', async () => {
            const name = document.getElementById('list-name').value;
            if (!name) {
                alert('Please enter a name for the list');
                return;
            }

            const config = {
                name: name,
                type: document.getElementById('list-type').value,
                title: document.getElementById('list-title').value,
                data: document.getElementById('data-input').value,
                dataSource: document.getElementById('data-source').value
            };

            try {
                const response = await fetch(basePath + '/api/list.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'save', ...config })
                });
                const result = await response.json();
                if (result.success) {
                    window.location.href = basePath + '/pages/list/';
                } else {
                    alert('Failed to save: ' + (result.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Failed to save list');
            }
        });

        // Initialize
        updateTypeOptions('list-simple');
    </script>

    <style>
        .ms-configurator--list {
            display: grid;
            grid-template-columns: 380px 1fr;
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
            padding: var(--ms-space-lg);
        }

        .ms-configurator__actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--ms-space-md);
            padding: var(--ms-space-md) var(--ms-space-lg);
            background: var(--ms-bg);
            border-top: 1px solid var(--ms-border);
        }

        .ms-list-preview {
            min-height: 300px;
        }

        .ms-list-preview .ms-widget {
            height: 100%;
        }
    </style>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
</body>
</html>
