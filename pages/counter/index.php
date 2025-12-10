<?php
/**
 * Saved Counters Page
 * Displays list of all saved counter configurations
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
    <title>Saved Counters - Metric Suite</title>

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
    <main class="ms-saved-counters" data-base-path="<?= htmlspecialchars($basePath) ?>">
        <header class="ms-saved-counters__header">
            <div class="ms-saved-counters__title-section">
                <h1 class="ms-saved-counters__title">Saved Counters</h1>
                <p class="ms-saved-counters__subtitle">Manage your counter widgets</p>
            </div>
            <div class="ms-saved-counters__actions">
                <a href="<?= $basePath ?>/pages/counter/configurator.php" class="ms-btn ms-btn--primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Counter
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
                <input type="text" class="ms-input" id="ms-search-input" placeholder="Search counters...">
            </div>
        </div>

        <!-- Counters Grid -->
        <div class="ms-saved-counters__grid" id="ms-counters-grid">
            <div class="ms-saved-graphs__loading">
                <div class="ms-spinner"></div>
                <span>Loading counters...</span>
            </div>
        </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div class="ms-modal" id="ms-delete-modal" style="display: none;">
        <div class="ms-modal__backdrop"></div>
        <div class="ms-modal__content">
            <div class="ms-modal__header">
                <h3 class="ms-modal__title">Delete Counter</h3>
                <button class="ms-modal__close" id="ms-delete-modal-close">&times;</button>
            </div>
            <p class="ms-modal__message">Are you sure you want to delete this counter? This action cannot be undone.</p>
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
        import { Counter, ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        const basePath = document.querySelector('.ms-saved-counters').dataset.basePath || '';
        const grid = document.getElementById('ms-counters-grid');
        const searchInput = document.getElementById('ms-search-input');
        const deleteModal = document.getElementById('ms-delete-modal');
        let counters = [];
        let counterToDelete = null;

        // Load counters
        async function loadCounters() {
            try {
                const response = await fetch(`${basePath}/api/counter.php`);
                const result = await response.json();

                if (result.success) {
                    counters = result.data || [];
                    renderCounters(counters);
                } else {
                    throw new Error(result.error || 'Failed to load counters');
                }
            } catch (error) {
                console.error('Load error:', error);
                grid.innerHTML = `
                    <div class="ms-saved-graphs__empty" style="grid-column: 1 / -1;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <h3>Error Loading Counters</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }

        // Render counters
        function renderCounters(items) {
            if (items.length === 0) {
                grid.innerHTML = `
                    <div class="ms-saved-graphs__empty" style="grid-column: 1 / -1;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M3 9h18"/>
                            <path d="M9 21V9"/>
                        </svg>
                        <h3>No Counters Yet</h3>
                        <p>Create your first counter widget to get started.</p>
                        <a href="${basePath}/pages/counter/configurator.php" class="ms-btn ms-btn--primary">Create Counter</a>
                    </div>
                `;
                return;
            }

            grid.innerHTML = items.map(counter => `
                <div class="ms-counter-card" data-id="${counter.id}">
                    <div class="ms-counter-card__preview">
                        <div class="ms-counter-mini" id="counter-preview-${counter.id}"></div>
                    </div>
                    <div class="ms-counter-card__body">
                        <h3 class="ms-counter-card__name">${escapeHtml(counter.name)}</h3>
                        <p class="ms-counter-card__meta">
                            ${counter.counter_count || 1} counter${(counter.counter_count || 1) > 1 ? 's' : ''} &bull;
                            Updated ${formatDate(counter.updated_at)}
                        </p>
                    </div>
                    <div class="ms-counter-card__actions">
                        <a href="${basePath}/pages/counter/configurator.php?id=${counter.id}" class="ms-btn ms-btn--outline ms-btn--sm">Edit</a>
                        <button class="ms-btn ms-btn--ghost ms-btn--sm ms-btn--danger-text" data-delete="${counter.id}">Delete</button>
                    </div>
                </div>
            `).join('');

            // Initialize mini counter previews
            items.forEach(counter => {
                const previewEl = document.getElementById(`counter-preview-${counter.id}`);
                if (previewEl) {
                    initMiniPreview(previewEl, counter);
                }
            });

            // Bind delete buttons
            grid.querySelectorAll('[data-delete]').forEach(btn => {
                btn.addEventListener('click', () => {
                    counterToDelete = btn.dataset.delete;
                    deleteModal.style.display = 'flex';
                });
            });
        }

        // Initialize mini preview for counter card
        function initMiniPreview(container, config) {
            const count = config.counter_count || 1;
            const counters = [];

            for (let i = 1; i <= count; i++) {
                counters.push({
                    value: Math.floor(Math.random() * 10000),
                    label: config[`label_${i}`] || `Counter ${i}`,
                    prefix: config[`prefix_${i}`] || '',
                    suffix: config[`suffix_${i}`] || '',
                });
            }

            try {
                new Counter(container, {
                    title: config.title || '',
                    layout: config.layout || 'horizontal',
                    bgColor: config.bg_color || '#ffffff',
                    fgColor: config.fg_color || '#1f2937',
                    accentColor: config.accent_color || '#6366f1',
                    counters,
                    animate: false,
                });
            } catch (e) {
                console.warn('Failed to init preview:', e);
            }
        }

        // Search functionality
        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = counters.filter(c =>
                c.name.toLowerCase().includes(query) ||
                (c.title && c.title.toLowerCase().includes(query)) ||
                (c.description && c.description.toLowerCase().includes(query))
            );
            renderCounters(filtered);
        });

        // Delete modal handlers
        document.getElementById('ms-delete-modal-close')?.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            counterToDelete = null;
        });

        document.getElementById('ms-delete-cancel')?.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            counterToDelete = null;
        });

        deleteModal.querySelector('.ms-modal__backdrop')?.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            counterToDelete = null;
        });

        document.getElementById('ms-delete-confirm')?.addEventListener('click', async () => {
            if (!counterToDelete) return;

            try {
                const response = await fetch(`${basePath}/api/counter.php?id=${counterToDelete}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (result.success) {
                    showToast('Counter deleted', 'success');
                    deleteModal.style.display = 'none';
                    counterToDelete = null;
                    loadCounters();
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
        loadCounters();
    </script>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
    <script nomodule src="<?= asset('main.js', 'nomodule') ?>"></script>
</body>
</html>
