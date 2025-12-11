<?php
/**
 * Saved Tables Page
 * Displays list of all saved table widget configurations
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
    <title>Saved Tables - Metric Suite</title>

    <!-- Favicon -->
    <?php favicon(); ?>

    <!-- Theme Init (prevents flash) -->
    <?php theme_init_script(); ?>

    <!-- Styles -->
    <link rel="stylesheet" href="<?= asset('metric-suite.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
</head>
<body>
    <!-- Back Navigation -->
    <nav class="ms-nav">
        <a href="<?= $basePath ?>/" class="ms-nav__back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
        </a>
        <div id="theme-switcher" class="ms-nav__theme-switcher"></div>
    </nav>

    <!-- Main Content -->
    <main class="ms-saved-items" data-base-path="<?= htmlspecialchars($basePath) ?>">
        <header class="ms-saved-items__header">
            <div class="ms-saved-items__title-section">
                <h1 class="ms-saved-items__title">Saved Tables</h1>
                <p class="ms-saved-items__subtitle">Manage your table widgets</p>
            </div>
            <div class="ms-saved-items__actions">
                <a href="<?= $basePath ?>/pages/table/demo.php" class="ms-btn ms-btn--outline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    View Demo
                </a>
                <a href="<?= $basePath ?>/pages/table/configurator.php" class="ms-btn ms-btn--primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Table
                </a>
            </div>
        </header>

        <!-- Toolbar -->
        <div class="ms-saved-graphs__toolbar">
            <div class="ms-saved-graphs__search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" class="ms-input" id="ms-search-input" placeholder="Search tables...">
            </div>
        </div>

        <!-- Items Grid -->
        <div class="ms-saved-items__grid" id="ms-items-grid">
            <div class="ms-saved-graphs__loading">
                <div class="ms-spinner"></div>
                <span>Loading tables...</span>
            </div>
        </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div class="ms-modal" id="ms-delete-modal" style="display: none;">
        <div class="ms-modal__backdrop"></div>
        <div class="ms-modal__content">
            <div class="ms-modal__header">
                <h3 class="ms-modal__title">Delete Table</h3>
                <button class="ms-modal__close" id="ms-delete-modal-close">&times;</button>
            </div>
            <p class="ms-modal__message">Are you sure you want to delete this table? This action cannot be undone.</p>
            <div class="ms-modal__actions">
                <button class="ms-btn ms-btn--ghost" id="ms-delete-cancel">Cancel</button>
                <button class="ms-btn ms-btn--danger" id="ms-delete-confirm">Delete</button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="ms-toast-container" id="ms-toast-container"></div>

    <!-- Scripts -->
    <script type="module">
        import { ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        const basePath = document.querySelector('.ms-saved-items').dataset.basePath || '';
        const grid = document.getElementById('ms-items-grid');
        const searchInput = document.getElementById('ms-search-input');
        const deleteModal = document.getElementById('ms-delete-modal');
        let items = [];
        let itemToDelete = null;

        // Table type labels
        const typeLabels = {
            'table-basic': 'Basic Table',
            'table-interactive': 'Interactive',
            'table-paginated': 'Paginated',
            'table-expandable': 'Expandable',
            'table-editable': 'Editable'
        };

        // Load items
        async function loadItems() {
            try {
                const response = await fetch(`${basePath}/api/table.php`);
                const result = await response.json();

                if (result.success) {
                    items = result.data || [];
                    renderItems(items);
                } else {
                    throw new Error(result.error || 'Failed to load tables');
                }
            } catch (error) {
                console.error('Load error:', error);
                // Show empty state (API might not exist yet)
                items = [];
                renderItems([]);
            }
        }

        // Render items
        function renderItems(data) {
            if (data.length === 0) {
                grid.innerHTML = `
                    <div class="ms-saved-graphs__empty" style="grid-column: 1 / -1;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M3 9h18"/>
                            <path d="M3 15h18"/>
                            <path d="M9 3v18"/>
                        </svg>
                        <h3>No Tables Yet</h3>
                        <p>Create your first table widget to get started.</p>
                        <a href="${basePath}/pages/table/configurator.php" class="ms-btn ms-btn--primary">Create Table</a>
                    </div>
                `;
                return;
            }

            grid.innerHTML = data.map(item => `
                <div class="ms-item-card" data-id="${item.id}">
                    <div class="ms-item-card__preview">
                        <div class="ms-item-card__type-badge">${typeLabels[item.type] || item.type}</div>
                    </div>
                    <div class="ms-item-card__body">
                        <h3 class="ms-item-card__name">${escapeHtml(item.name)}</h3>
                        <p class="ms-item-card__meta">
                            ${item.title || 'Untitled'} &bull;
                            Updated ${formatDate(item.updated_at)}
                        </p>
                    </div>
                    <div class="ms-item-card__actions">
                        <a href="${basePath}/pages/table/configurator.php?id=${item.id}" class="ms-btn ms-btn--outline ms-btn--sm">Edit</a>
                        <button class="ms-btn ms-btn--ghost ms-btn--sm ms-btn--danger-text" data-delete="${item.id}">Delete</button>
                    </div>
                </div>
            `).join('');

            // Bind delete buttons
            grid.querySelectorAll('[data-delete]').forEach(btn => {
                btn.addEventListener('click', () => {
                    itemToDelete = btn.dataset.delete;
                    deleteModal.style.display = 'flex';
                });
            });
        }

        // Search functionality
        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.type && item.type.toLowerCase().includes(query))
            );
            renderItems(filtered);
        });

        // Delete modal handlers
        document.getElementById('ms-delete-modal-close')?.addEventListener('click', closeModal);
        document.getElementById('ms-delete-cancel')?.addEventListener('click', closeModal);
        deleteModal.querySelector('.ms-modal__backdrop')?.addEventListener('click', closeModal);

        function closeModal() {
            deleteModal.style.display = 'none';
            itemToDelete = null;
        }

        document.getElementById('ms-delete-confirm')?.addEventListener('click', async () => {
            if (!itemToDelete) return;

            try {
                const response = await fetch(`${basePath}/api/table.php?id=${itemToDelete}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (result.success) {
                    showToast('Table deleted', 'success');
                    closeModal();
                    loadItems();
                } else {
                    throw new Error(result.error || 'Delete failed');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });

        // Helper functions
        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        function formatDate(dateStr) {
            if (!dateStr) return 'Unknown';
            const date = new Date(dateStr);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }

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
        loadItems();
    </script>

    <style>
        .ms-saved-items {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--ms-space-lg);
        }

        .ms-saved-items__header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--ms-space-lg);
            flex-wrap: wrap;
            gap: var(--ms-space-md);
        }

        .ms-saved-items__title {
            margin: 0;
            font-size: var(--ms-font-size-2xl);
            font-weight: 600;
        }

        .ms-saved-items__subtitle {
            margin: var(--ms-space-xs) 0 0;
            color: var(--ms-text-secondary);
        }

        .ms-saved-items__actions {
            display: flex;
            gap: var(--ms-space-sm);
        }

        .ms-saved-items__grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: var(--ms-space-lg);
        }

        .ms-item-card {
            background: var(--ms-bg);
            border: 1px solid var(--ms-border);
            border-radius: var(--ms-radius-lg);
            overflow: hidden;
            transition: all var(--ms-transition-base);
        }

        .ms-item-card:hover {
            border-color: var(--ms-border-hover);
            box-shadow: var(--ms-shadow-md);
        }

        .ms-item-card__preview {
            height: 100px;
            background: var(--ms-bg-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .ms-item-card__type-badge {
            padding: var(--ms-space-xs) var(--ms-space-md);
            background: var(--ms-primary);
            color: white;
            font-size: var(--ms-font-size-sm);
            font-weight: 500;
            border-radius: var(--ms-radius-full);
        }

        .ms-item-card__body {
            padding: var(--ms-space-md);
        }

        .ms-item-card__name {
            margin: 0 0 var(--ms-space-xs);
            font-size: var(--ms-font-size-base);
            font-weight: 600;
        }

        .ms-item-card__meta {
            margin: 0;
            font-size: var(--ms-font-size-sm);
            color: var(--ms-text-secondary);
        }

        .ms-item-card__actions {
            display: flex;
            gap: var(--ms-space-sm);
            padding: var(--ms-space-md);
            border-top: 1px solid var(--ms-border);
            background: var(--ms-bg-secondary);
        }
    </style>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
</body>
</html>
