<?php
/**
 * Graph Configurator Page
 * Create and configure graph components with live preview
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
    <title>Graph Configurator - Metric Suite</title>

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

    <!-- Main Configurator Container -->
    <div id="graph-configurator" data-base-path="<?= htmlspecialchars($basePath) ?>"></div>

    <!-- Scripts -->
    <script type="module">
        import { GraphConfigurator, ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        // Initialize configurator
        const container = document.getElementById('graph-configurator');
        const basePath = container.dataset.basePath || '';

        new GraphConfigurator(container, {
            saveEndpoint: basePath + '/api/graph.php',
            apiEndpoint: basePath + '/api/data.php',
            schemaEndpoint: basePath + '/api/schema.php',
        });
    </script>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
    <script nomodule src="<?= asset('main.js', 'nomodule') ?>"></script>
</body>
</html>
