<?php
/**
 * Counter Demo Page
 * Showcase different counter configurations
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
    <title>Counter Demo - Metric Suite</title>

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
            Back to Home
        </a>
        <div id="theme-switcher" class="ms-nav__theme-switcher"></div>
    </nav>

    <!-- Demo Content -->
    <main class="ms-demo">
        <header class="ms-demo__header">
            <h1>Counter Components</h1>
            <p>Display KPIs and metrics with customizable counter widgets</p>
        </header>

        <!-- Demo Grid -->
        <div class="ms-demo__grid">
            <!-- Single Counter -->
            <div class="ms-demo__card">
                <h3>Single Counter</h3>
                <div class="ms-demo__counter" id="demo-single"></div>
            </div>

            <!-- Double Counter -->
            <div class="ms-demo__card">
                <h3>Two Counters</h3>
                <div class="ms-demo__counter" id="demo-double"></div>
            </div>

            <!-- Triple Counter -->
            <div class="ms-demo__card">
                <h3>Three Counters</h3>
                <div class="ms-demo__counter" id="demo-triple"></div>
            </div>

            <!-- With Icons -->
            <div class="ms-demo__card">
                <h3>With Icons</h3>
                <div class="ms-demo__counter" id="demo-icons"></div>
            </div>

            <!-- Vertical Layout -->
            <div class="ms-demo__card">
                <h3>Vertical Layout</h3>
                <div class="ms-demo__counter" id="demo-vertical"></div>
            </div>

            <!-- Custom Colors -->
            <div class="ms-demo__card">
                <h3>Custom Colors</h3>
                <div class="ms-demo__counter" id="demo-colors"></div>
            </div>
        </div>

        <!-- CTA -->
        <div class="ms-demo__cta">
            <a href="<?= $basePath ?>/pages/counter/configurator.php" class="ms-btn ms-btn--primary ms-btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Your Own Counter
            </a>
        </div>
    </main>

    <!-- Scripts -->
    <script type="module">
        import { Counter, ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        // Single Counter
        new Counter('#demo-single', {
            title: 'Total Revenue',
            counters: [
                { value: 125000, label: 'This Month', prefix: '$', format: 'compact' }
            ]
        });

        // Double Counter
        new Counter('#demo-double', {
            counters: [
                { value: 12543, label: 'Active Users', format: 'integer' },
                { value: 89.5, label: 'Satisfaction', suffix: '%', format: 'decimal' }
            ]
        });

        // Triple Counter
        new Counter('#demo-triple', {
            counters: [
                { value: 1234, label: 'Orders', format: 'integer' },
                { value: 45678, label: 'Revenue', prefix: '$', format: 'compact' },
                { value: 98.2, label: 'Fulfillment', suffix: '%' }
            ]
        });

        // With Icons
        new Counter('#demo-icons', {
            counters: [
                { value: 3420, label: 'Users', icon: 'users', format: 'integer' },
                { value: 156000, label: 'Sales', icon: 'dollar', prefix: '$', format: 'compact' },
                { value: 24.5, label: 'Growth', icon: 'trending-up', suffix: '%' }
            ]
        });

        // Vertical Layout
        new Counter('#demo-vertical', {
            layout: 'vertical',
            counters: [
                { value: 847, label: 'New Orders', icon: 'cart' },
                { value: 156, label: 'Pending', icon: 'clock' },
                { value: 23, label: 'Completed', icon: 'check' }
            ]
        });

        // Custom Colors
        new Counter('#demo-colors', {
            title: 'Performance',
            bgColor: '#1e1b4b',
            fgColor: '#e0e7ff',
            accentColor: '#a78bfa',
            counters: [
                { value: 99.9, label: 'Uptime', suffix: '%' },
                { value: 42, label: 'Response (ms)' }
            ]
        });
    </script>

    <style>
        .ms-demo__counter {
            padding: var(--ms-space-md);
            min-height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ms-demo__counter .ms-counter {
            width: 100%;
        }
    </style>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
    <script nomodule src="<?= asset('main.js', 'nomodule') ?>"></script>
</body>
</html>
