<?php
/**
 * Graph Demo Page
 * Showcase various graph configurations and examples
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
    <title>Graph Demos - Metric Suite</title>

    <!-- Favicon -->
    <?php favicon(); ?>

    <!-- Theme Init (prevents flash) -->
    <?php theme_init_script(); ?>

    <!-- Styles -->
    <link rel="stylesheet" href="<?= asset('metric-suite.css') ?>">
    <link rel="stylesheet" href="<?= asset('main.css') ?>">
</head>
<body class="ms-demo-page">
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

    <div class="ms-demo">
        <header class="ms-demo__header">
            <h1>Graph Component Demos</h1>
            <p>Explore various graph configurations and see what's possible with the Graph component.</p>
        </header>

        <div class="ms-demo__grid">
            <!-- Basic Bar Chart -->
            <div class="ms-demo__card">
                <h3>Basic Bar Chart</h3>
                <div class="ms-demo__chart" id="demo-bar-basic"></div>
            </div>

            <!-- Horizontal Bar Chart -->
            <div class="ms-demo__card">
                <h3>Horizontal Bar Chart</h3>
                <div class="ms-demo__chart" id="demo-bar-horizontal"></div>
            </div>

            <!-- Bar Chart with Labels -->
            <div class="ms-demo__card">
                <h3>Bar Chart with Data Labels</h3>
                <div class="ms-demo__chart" id="demo-bar-labels"></div>
            </div>

            <!-- Multi-Series Bar Chart -->
            <div class="ms-demo__card">
                <h3>Multi-Series Bar Chart</h3>
                <div class="ms-demo__chart" id="demo-bar-multi"></div>
            </div>
        </div>

        <div class="ms-demo__cta">
            <a href="<?= $basePath ?>/pages/graph/configurator.php" class="ms-btn ms-btn--primary">
                Open Graph Configurator
            </a>
        </div>
    </div>

    <!-- Scripts -->
    <script type="module">
        import { Graph, ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        // Helper function to get theme-aware colors
        function getChartColors() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                (document.documentElement.getAttribute('data-theme') === 'system' &&
                 window.matchMedia('(prefers-color-scheme: dark)').matches);
            return {
                primary: isDark ? '#60a5fa' : '#3b82f6',
                success: isDark ? '#34d399' : '#10b981',
                warning: isDark ? '#fbbf24' : '#f59e0b',
            };
        }

        const colors = getChartColors();

        // Basic Bar Chart
        new Graph('#demo-bar-basic', {
            type: 'bar',
            title: 'Monthly Sales',
            data: [120, 200, 150, 80, 70, 110, 130],
            xAxis: { data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] },
            colors: [colors.primary],
        });

        // Horizontal Bar Chart
        new Graph('#demo-bar-horizontal', {
            type: 'bar',
            title: 'Product Revenue',
            orientation: 'horizontal',
            data: [320, 280, 250, 200, 180],
            xAxis: { data: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'] },
            colors: [colors.success],
        });

        // Bar Chart with Labels
        new Graph('#demo-bar-labels', {
            type: 'bar',
            title: 'Quarterly Results',
            showLabels: true,
            data: [450, 520, 480, 610],
            xAxis: { data: ['Q1', 'Q2', 'Q3', 'Q4'] },
            colors: [colors.warning],
        });

        // Multi-Series Bar Chart
        new Graph('#demo-bar-multi', {
            type: 'bar',
            title: 'Sales by Region',
            showLegend: true,
            legendPosition: 'top',
            data: [[120, 132, 101, 134], [220, 182, 191, 234], [150, 232, 201, 154]],
            seriesNames: ['East', 'West', 'Central'],
            xAxis: { data: ['Q1', 'Q2', 'Q3', 'Q4'] },
            colors: [colors.primary, colors.success, colors.warning],
        });
    </script>
</body>
</html>
