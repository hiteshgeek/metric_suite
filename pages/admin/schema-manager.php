<?php
/**
 * Schema Manager - Admin Page
 * Fetch and cache database schema from main database
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
    <title>Schema Manager - Metric Suite</title>

    <?php favicon(); ?>
    <?php theme_init_script(); ?>

    <link rel="stylesheet" href="<?= asset('metric-suite.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
    <style>
        .schema-manager {
            max-width: 1000px;
            margin: 0 auto;
            padding: var(--ms-space-xl);
        }
        .schema-manager__header {
            margin-bottom: var(--ms-space-xl);
        }
        .schema-manager__title {
            margin: 0 0 var(--ms-space-xs);
            font-size: var(--ms-font-size-2xl);
        }
        .schema-manager__subtitle {
            margin: 0;
            color: var(--ms-text-secondary);
        }
        .status-card {
            background: var(--ms-bg);
            border: 1px solid var(--ms-border);
            border-radius: var(--ms-radius-lg);
            padding: var(--ms-space-lg);
            margin-bottom: var(--ms-space-lg);
        }
        .status-card__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--ms-space-md);
        }
        .status-card__title {
            margin: 0;
            font-size: var(--ms-font-size-lg);
        }
        .status-badge {
            padding: var(--ms-space-xs) var(--ms-space-sm);
            border-radius: var(--ms-radius-full);
            font-size: var(--ms-font-size-xs);
            font-weight: 500;
        }
        .status-badge--success { background: var(--ms-success-light); color: var(--ms-success); }
        .status-badge--warning { background: var(--ms-warning-light); color: var(--ms-warning); }
        .status-badge--error { background: var(--ms-error-light); color: var(--ms-error); }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--ms-space-md);
        }
        .info-item {
            padding: var(--ms-space-md);
            background: var(--ms-bg-secondary);
            border-radius: var(--ms-radius-md);
        }
        .info-item__label {
            font-size: var(--ms-font-size-xs);
            color: var(--ms-text-muted);
            margin-bottom: var(--ms-space-xs);
        }
        .info-item__value {
            font-size: var(--ms-font-size-lg);
            font-weight: 600;
            color: var(--ms-text);
        }
        .action-buttons {
            display: flex;
            gap: var(--ms-space-sm);
            margin-top: var(--ms-space-lg);
        }
        .log-output {
            background: var(--ms-bg-tertiary);
            border: 1px solid var(--ms-border);
            border-radius: var(--ms-radius-md);
            padding: var(--ms-space-md);
            font-family: var(--ms-font-mono);
            font-size: var(--ms-font-size-sm);
            max-height: 200px;
            overflow-y: auto;
            margin-top: var(--ms-space-md);
            display: none;
        }
        .log-output.show { display: block; }
        .tables-preview {
            margin-top: var(--ms-space-lg);
        }
        .tables-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--ms-space-xs);
            margin-top: var(--ms-space-sm);
        }
        .table-tag {
            padding: var(--ms-space-xs) var(--ms-space-sm);
            background: var(--ms-bg-secondary);
            border-radius: var(--ms-radius-md);
            font-size: var(--ms-font-size-xs);
            font-family: var(--ms-font-mono);
        }
    </style>
</head>
<body class="ms-demo-page">
    <nav class="ms-nav">
        <a href="<?= $basePath ?>/" class="ms-nav__back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Dashboard
        </a>
        <div id="theme-switcher" class="ms-nav__theme-switcher"></div>
    </nav>

    <div class="schema-manager">
        <header class="schema-manager__header">
            <h1 class="schema-manager__title">Schema Manager</h1>
            <p class="schema-manager__subtitle">Fetch and cache database schema for the Graph Configurator</p>
        </header>

        <div class="status-card">
            <div class="status-card__header">
                <h2 class="status-card__title">Cache Status</h2>
                <span id="cache-status" class="status-badge status-badge--warning">Checking...</span>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-item__label">Tables Cached</div>
                    <div class="info-item__value" id="tables-count">-</div>
                </div>
                <div class="info-item">
                    <div class="info-item__label">Last Updated</div>
                    <div class="info-item__value" id="last-updated">-</div>
                </div>
                <div class="info-item">
                    <div class="info-item__label">Database</div>
                    <div class="info-item__value" id="database-name">-</div>
                </div>
            </div>

            <div class="action-buttons">
                <button id="refresh-btn" class="ms-btn ms-btn--primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                        <path d="M16 21h5v-5"/>
                    </svg>
                    Refresh Schema Cache
                </button>
                <button id="view-btn" class="ms-btn ms-btn--outline">View Cached Tables</button>
            </div>

            <div id="log-output" class="log-output"></div>

            <div id="tables-preview" class="tables-preview" style="display:none">
                <h3>Cached Tables</h3>
                <div id="tables-list" class="tables-list"></div>
            </div>
        </div>
    </div>

    <script type="module">
        import { ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        const basePath = '<?= $basePath ?>';
        const cacheEndpoint = basePath + '/api/schema-cache.php';

        const statusBadge = document.getElementById('cache-status');
        const tablesCount = document.getElementById('tables-count');
        const lastUpdated = document.getElementById('last-updated');
        const databaseName = document.getElementById('database-name');
        const refreshBtn = document.getElementById('refresh-btn');
        const viewBtn = document.getElementById('view-btn');
        const logOutput = document.getElementById('log-output');
        const tablesPreview = document.getElementById('tables-preview');
        const tablesList = document.getElementById('tables-list');

        async function checkStatus() {
            try {
                const res = await fetch(cacheEndpoint);
                const data = await res.json();

                if (data.success && data.tables && data.tables.length > 0) {
                    statusBadge.textContent = 'Cached';
                    statusBadge.className = 'status-badge status-badge--success';
                    tablesCount.textContent = data.tables.length;
                    lastUpdated.textContent = data.cached_at ? new Date(data.cached_at).toLocaleString() : 'Unknown';
                    databaseName.textContent = data.database || 'N/A';
                } else {
                    statusBadge.textContent = 'Empty';
                    statusBadge.className = 'status-badge status-badge--warning';
                    tablesCount.textContent = '0';
                    lastUpdated.textContent = 'Never';
                }
            } catch (e) {
                statusBadge.textContent = 'Error';
                statusBadge.className = 'status-badge status-badge--error';
                console.error(e);
            }
        }

        async function refreshCache() {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span>Refreshing...</span>';
            logOutput.classList.add('show');
            logOutput.textContent = 'Connecting to main database...\n';

            try {
                const res = await fetch(cacheEndpoint, { method: 'POST' });
                const data = await res.json();

                if (data.success) {
                    logOutput.textContent += `Success! Cached ${data.tables_cached} tables from ${data.database}\n`;
                    await checkStatus();
                } else {
                    logOutput.textContent += `Error: ${data.error}\n`;
                }
            } catch (e) {
                logOutput.textContent += `Connection failed: ${e.message}\n`;
            } finally {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                        <path d="M16 21h5v-5"/>
                    </svg>
                    Refresh Schema Cache
                `;
            }
        }

        async function viewTables() {
            try {
                const res = await fetch(cacheEndpoint);
                const data = await res.json();

                if (data.success && data.tables) {
                    tablesList.innerHTML = data.tables.map(t =>
                        `<span class="table-tag">${t.name}</span>`
                    ).join('');
                    tablesPreview.style.display = 'block';
                }
            } catch (e) {
                console.error(e);
            }
        }

        refreshBtn.addEventListener('click', refreshCache);
        viewBtn.addEventListener('click', viewTables);

        checkStatus();
    </script>
</body>
</html>
