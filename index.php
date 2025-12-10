<?php
/**
 * Metric Suite - Dashboard Component Library
 * Main index page with project cards
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/theme-switcher.php';

$basePath = get_base_path();

// Define dashboard components
$components = [
    [
        'id' => 'graph',
        'name' => 'Graphs',
        'description' => 'Create beautiful charts and graphs using Apache ECharts. Supports bar, line, pie, and more chart types.',
        'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><path d="m13 15 2-2 2 2"/><path d="M13 11v4"/></svg>',
        'status' => 'ready',
        'demoLink' => $basePath . '/pages/graph/demo.php',
        'configLink' => $basePath . '/pages/graph/',
    ],
    [
        'id' => 'counter',
        'name' => 'Counters',
        'description' => 'Counter widgets for displaying KPIs, statistics, and numeric metrics. Supports 1-3 counters per widget.',
        'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/><path d="M15 21V9"/></svg>',
        'status' => 'ready',
        'demoLink' => $basePath . '/pages/counter/demo.php',
        'configLink' => $basePath . '/pages/counter/',
    ],
    [
        'id' => 'list',
        'name' => 'Lists',
        'description' => 'Dynamic list components for displaying data in organized, scrollable formats.',
        'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
        'status' => 'coming',
        'demoLink' => null,
        'configLink' => null,
    ],
    [
        'id' => 'table',
        'name' => 'Tables',
        'description' => 'Data tables with sorting, filtering, pagination, and export capabilities.',
        'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>',
        'status' => 'coming',
        'demoLink' => null,
        'configLink' => null,
    ],
    [
        'id' => 'links',
        'name' => 'Links',
        'description' => 'Navigation and link components for creating dashboards with quick access panels.',
        'icon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        'status' => 'coming',
        'demoLink' => null,
        'configLink' => null,
    ],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metric Suite - Dashboard Component Library</title>

    <!-- Favicon -->
    <?php favicon(); ?>

    <!-- Theme Init (prevents flash) -->
    <?php theme_init_script(); ?>

    <!-- Styles -->
    <link rel="stylesheet" href="<?= asset('metric-suite.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
</head>
<body class="ms-index-page">
    <div class="ms-index">
        <!-- Header -->
        <header class="ms-index__header">
            <div class="ms-index__brand">
                <div class="ms-index__logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                </div>
                <div>
                    <h1 class="ms-index__title">Metric Suite</h1>
                    <p class="ms-index__subtitle">Dashboard Component Library</p>
                </div>
                <!-- Theme Switcher -->
                <div id="theme-switcher" class="ms-index__theme-switcher"></div>
            </div>
        </header>

        <!-- Component Cards Grid -->
        <main class="ms-index__main">
            <div class="ms-cards">
                <?php foreach ($components as $component): ?>
                <div class="ms-card <?= $component['status'] === 'coming' ? 'ms-card--disabled' : '' ?>">
                    <div class="ms-card__icon">
                        <?= $component['icon'] ?>
                    </div>
                    <div class="ms-card__content">
                        <h2 class="ms-card__title">
                            <?= htmlspecialchars($component['name']) ?>
                            <?php if ($component['status'] === 'coming'): ?>
                            <span class="ms-card__badge">Coming Soon</span>
                            <?php endif; ?>
                        </h2>
                        <p class="ms-card__description"><?= htmlspecialchars($component['description']) ?></p>
                    </div>
                    <div class="ms-card__actions">
                        <?php if ($component['demoLink']): ?>
                        <a href="<?= $component['demoLink'] ?>" class="ms-btn ms-btn--outline">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            Demo
                        </a>
                        <?php else: ?>
                        <button class="ms-btn ms-btn--outline" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            Demo
                        </button>
                        <?php endif; ?>

                        <?php if ($component['configLink']): ?>
                        <a href="<?= $component['configLink'] ?>" class="ms-btn ms-btn--primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                            Manage
                        </a>
                        <?php else: ?>
                        <button class="ms-btn ms-btn--primary" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                            Manage
                        </button>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </main>

        <!-- Footer -->
        <footer class="ms-index__footer">
            <p>Metric Suite &copy; <?= date('Y') ?> - Modular Dashboard Component Library</p>
        </footer>
    </div>

    <!-- Theme Switcher Script -->
    <?php theme_switcher_script('#theme-switcher', ['showLabels' => true]); ?>
</body>
</html>
