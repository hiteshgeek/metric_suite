<?php
/**
 * Saved Graphs Page
 * List, view, edit, and delete saved graph configurations
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
    <title>Saved Graphs - Metric Suite</title>

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
            Back to Dashboard
        </a>
        <div id="theme-switcher" class="ms-nav__theme-switcher"></div>
    </nav>

    <!-- Main Content -->
    <div class="ms-saved-graphs" data-base-path="<?= htmlspecialchars($basePath) ?>">
        <!-- Header -->
        <div class="ms-saved-graphs__header">
            <div class="ms-saved-graphs__title-section">
                <h1 class="ms-saved-graphs__title">Saved Graphs</h1>
                <p class="ms-saved-graphs__subtitle">Manage your saved graph configurations</p>
            </div>
            <a href="<?= $basePath ?>/pages/graph/configurator.php" class="ms-btn ms-btn--primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Create New Graph
            </a>
        </div>

        <!-- Search and Filters -->
        <div class="ms-saved-graphs__toolbar">
            <div class="ms-saved-graphs__search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" id="ms-search-input" class="ms-input" placeholder="Search graphs...">
            </div>
            <div class="ms-saved-graphs__filters">
                <select id="ms-type-filter" class="ms-select">
                    <option value="">All Types</option>
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="donut">Donut</option>
                    <option value="area">Area</option>
                </select>
            </div>
        </div>

        <!-- Graphs Grid -->
        <div id="ms-graphs-container" class="ms-saved-graphs__grid">
            <!-- Graphs will be loaded here -->
            <div class="ms-saved-graphs__loading">
                <div class="ms-spinner"></div>
                <p>Loading saved graphs...</p>
            </div>
        </div>

        <!-- Empty State -->
        <div id="ms-empty-state" class="ms-saved-graphs__empty" style="display: none;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
                <path d="m13 15 2-2 2 2"/>
                <path d="M13 11v4"/>
            </svg>
            <h3>No Saved Graphs</h3>
            <p>Create your first graph to get started</p>
            <a href="<?= $basePath ?>/pages/graph/configurator.php" class="ms-btn ms-btn--primary">
                Create New Graph
            </a>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="ms-delete-modal" class="ms-modal" style="display: none;">
        <div class="ms-modal__backdrop"></div>
        <div class="ms-modal__content">
            <h3 class="ms-modal__title">Delete Graph</h3>
            <p class="ms-modal__message">Are you sure you want to delete "<span id="ms-delete-name"></span>"? This action cannot be undone.</p>
            <div class="ms-modal__actions">
                <button id="ms-delete-cancel" class="ms-btn ms-btn--outline">Cancel</button>
                <button id="ms-delete-confirm" class="ms-btn ms-btn--danger">Delete</button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script type="module">
        import { ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        // Get base path
        const container = document.querySelector('.ms-saved-graphs');
        const basePath = container.dataset.basePath || '';

        // State
        let graphs = [];
        let deleteTargetId = null;

        // Elements
        const graphsContainer = document.getElementById('ms-graphs-container');
        const emptyState = document.getElementById('ms-empty-state');
        const searchInput = document.getElementById('ms-search-input');
        const typeFilter = document.getElementById('ms-type-filter');
        const deleteModal = document.getElementById('ms-delete-modal');
        const deleteNameSpan = document.getElementById('ms-delete-name');
        const deleteCancelBtn = document.getElementById('ms-delete-cancel');
        const deleteConfirmBtn = document.getElementById('ms-delete-confirm');

        // Chart type icons
        const typeIcons = {
            bar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="6" width="4" height="15"/><rect x="17" y="3" width="4" height="18"/></svg>`,
            line: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 8 14 14 10 10 6 16 2 12"/></svg>`,
            pie: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
            donut: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M22 12h-4"/></svg>`,
            area: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h18V10l-6-6-4 8-4-4-4 4v8z"/></svg>`,
        };

        // Format date
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Render graphs
        function renderGraphs(filteredGraphs = graphs) {
            if (filteredGraphs.length === 0) {
                graphsContainer.innerHTML = '';
                emptyState.style.display = 'flex';
                return;
            }

            emptyState.style.display = 'none';
            graphsContainer.innerHTML = filteredGraphs.map(graph => `
                <div class="ms-graph-card" data-id="${graph.id}">
                    <div class="ms-graph-card__header">
                        <div class="ms-graph-card__icon">
                            ${typeIcons[graph.type] || typeIcons.bar}
                        </div>
                        <span class="ms-graph-card__type">${graph.type}</span>
                    </div>
                    <div class="ms-graph-card__body">
                        <h3 class="ms-graph-card__title">${escapeHtml(graph.name)}</h3>
                        ${graph.description ? `<p class="ms-graph-card__description">${escapeHtml(graph.description)}</p>` : ''}
                        <p class="ms-graph-card__date">Updated ${formatDate(graph.updated_at)}</p>
                    </div>
                    <div class="ms-graph-card__actions">
                        <a href="${basePath}/pages/graph/configurator.php?id=${graph.id}" class="ms-btn ms-btn--primary ms-btn--sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                        </a>
                        <button class="ms-btn ms-btn--outline ms-btn--sm ms-btn--danger-outline" data-delete="${graph.id}" data-name="${escapeHtml(graph.name)}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');

            // Bind delete button events
            graphsContainer.querySelectorAll('[data-delete]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    deleteTargetId = e.currentTarget.dataset.delete;
                    deleteNameSpan.textContent = e.currentTarget.dataset.name;
                    deleteModal.style.display = 'flex';
                });
            });
        }

        // Escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }

        // Fuzzy match scoring
        function fuzzyMatch(text, pattern) {
            if (!pattern) return 1;

            const textLower = text.toLowerCase();
            const patternLower = pattern.toLowerCase();

            // Exact match gets highest score
            if (textLower === patternLower) return 100;

            // Starts with pattern gets high score
            if (textLower.startsWith(patternLower)) return 90;

            // Contains pattern as substring gets good score
            if (textLower.includes(patternLower)) return 80;

            // Fuzzy character matching
            let patternIdx = 0;
            let score = 0;
            let consecutiveBonus = 0;
            let lastMatchIdx = -1;

            for (let i = 0; i < text.length && patternIdx < pattern.length; i++) {
                if (textLower[i] === patternLower[patternIdx]) {
                    score += 10;
                    if (lastMatchIdx === i - 1) consecutiveBonus += 5;
                    if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '_') score += 10;
                    lastMatchIdx = i;
                    patternIdx++;
                }
            }

            return patternIdx === pattern.length ? score + consecutiveBonus : 0;
        }

        // Filter graphs with fuzzy search
        function filterGraphs() {
            const search = searchInput.value.trim();
            const type = typeFilter.value;

            let filtered = graphs;

            // Apply type filter
            if (type) {
                filtered = filtered.filter(graph => graph.type === type);
            }

            // Apply fuzzy search
            if (search) {
                filtered = filtered
                    .map(graph => ({
                        graph,
                        score: Math.max(
                            fuzzyMatch(graph.name, search),
                            fuzzyMatch(graph.description || '', search) * 0.8 // Description matches slightly lower priority
                        )
                    }))
                    .filter(item => item.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map(item => item.graph);
            }

            renderGraphs(filtered);
        }

        // Load graphs
        async function loadGraphs() {
            try {
                const response = await fetch(`${basePath}/api/graph.php`);
                const result = await response.json();

                if (result.success) {
                    graphs = result.data;
                    renderGraphs();
                } else {
                    graphsContainer.innerHTML = `<p class="ms-error">Failed to load graphs: ${result.error}</p>`;
                }
            } catch (error) {
                console.error('Failed to load graphs:', error);
                graphsContainer.innerHTML = `<p class="ms-error">Failed to load graphs. Please try again.</p>`;
            }
        }

        // Delete graph
        async function deleteGraph(id) {
            try {
                const response = await fetch(`${basePath}/api/graph.php?id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (result.success) {
                    graphs = graphs.filter(g => g.id != id);
                    filterGraphs();
                } else {
                    alert('Failed to delete graph: ' + result.error);
                }
            } catch (error) {
                console.error('Failed to delete graph:', error);
                alert('Failed to delete graph. Please try again.');
            }
        }

        // Event listeners
        searchInput.addEventListener('input', filterGraphs);
        typeFilter.addEventListener('change', filterGraphs);

        deleteModal.querySelector('.ms-modal__backdrop').addEventListener('click', () => {
            deleteModal.style.display = 'none';
            deleteTargetId = null;
        });

        deleteCancelBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            deleteTargetId = null;
        });

        deleteConfirmBtn.addEventListener('click', async () => {
            if (deleteTargetId) {
                deleteConfirmBtn.disabled = true;
                deleteConfirmBtn.textContent = 'Deleting...';
                await deleteGraph(deleteTargetId);
                deleteModal.style.display = 'none';
                deleteTargetId = null;
                deleteConfirmBtn.disabled = false;
                deleteConfirmBtn.textContent = 'Delete';
            }
        });

        // Initialize
        loadGraphs();
    </script>
</body>
</html>
