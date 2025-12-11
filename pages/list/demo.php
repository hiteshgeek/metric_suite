<?php
/**
 * List Widget Demo Page
 * Showcase different list widget configurations
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
    <title>List Demo - Metric Suite</title>

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
            <h1>List Widgets</h1>
            <p>Display data in organized, dynamic list formats</p>
        </header>

        <!-- Demo Grid -->
        <div class="ms-demo__grid">
            <!-- Simple List -->
            <div class="ms-demo__card">
                <h3>Simple List</h3>
                <div class="ms-demo__widget" id="demo-simple"></div>
            </div>

            <!-- Ranked List -->
            <div class="ms-demo__card">
                <h3>Ranked List</h3>
                <div class="ms-demo__widget" id="demo-ranked"></div>
            </div>

            <!-- Grouped List -->
            <div class="ms-demo__card">
                <h3>Grouped List</h3>
                <div class="ms-demo__widget" id="demo-grouped"></div>
            </div>

            <!-- Avatar List -->
            <div class="ms-demo__card">
                <h3>Avatar List</h3>
                <div class="ms-demo__widget" id="demo-avatar"></div>
            </div>

            <!-- Timeline List -->
            <div class="ms-demo__card" style="grid-column: span 2;">
                <h3>Timeline List</h3>
                <div class="ms-demo__widget" id="demo-timeline"></div>
            </div>
        </div>

        <!-- CTA -->
        <div class="ms-demo__cta">
            <a href="<?= $basePath ?>/pages/list/configurator.php" class="ms-btn ms-btn--primary ms-btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Your Own List
            </a>
        </div>
    </main>

    <!-- Scripts -->
    <script type="module">
        import { ThemeSwitcher, WidgetFactory, WIDGET_TYPES } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        // Simple List
        WidgetFactory.create('#demo-simple', {
            type: WIDGET_TYPES.LIST_SIMPLE,
            title: 'Recent Activities',
            config: {
                items: [
                    { text: 'User login from New York' },
                    { text: 'New order #1234 received' },
                    { text: 'Payment processed successfully' },
                    { text: 'Product inventory updated' },
                    { text: 'Email campaign sent' }
                ]
            }
        });

        // Ranked List
        WidgetFactory.create('#demo-ranked', {
            type: WIDGET_TYPES.LIST_RANKED,
            title: 'Top Products',
            config: {
                items: [
                    { name: 'Wireless Headphones', value: 1234 },
                    { name: 'Smart Watch Pro', value: 987 },
                    { name: 'Laptop Stand', value: 756 },
                    { name: 'USB-C Hub', value: 543 },
                    { name: 'Mechanical Keyboard', value: 421 }
                ],
                showBars: true,
                showMedals: true
            }
        });

        // Grouped List
        WidgetFactory.create('#demo-grouped', {
            type: WIDGET_TYPES.LIST_GROUPED,
            title: 'Team Members',
            config: {
                groups: [
                    {
                        name: 'Engineering',
                        items: [
                            { text: 'John Developer' },
                            { text: 'Jane Architect' },
                            { text: 'Bob Backend' }
                        ]
                    },
                    {
                        name: 'Design',
                        items: [
                            { text: 'Alice Designer' },
                            { text: 'Carol UX' }
                        ]
                    },
                    {
                        name: 'Product',
                        items: [
                            { text: 'Dave PM' }
                        ]
                    }
                ],
                collapsible: true,
                defaultExpanded: true
            }
        });

        // Avatar List
        WidgetFactory.create('#demo-avatar', {
            type: WIDGET_TYPES.LIST_AVATAR,
            title: 'Team',
            config: {
                items: [
                    { name: 'Sarah Johnson', subtitle: 'CEO', initials: 'SJ' },
                    { name: 'Mike Chen', subtitle: 'CTO', initials: 'MC' },
                    { name: 'Emily Davis', subtitle: 'Lead Designer', initials: 'ED' },
                    { name: 'Alex Kim', subtitle: 'Developer', initials: 'AK' }
                ]
            }
        });

        // Timeline List
        WidgetFactory.create('#demo-timeline', {
            type: WIDGET_TYPES.LIST_TIMELINE,
            title: 'Project Timeline',
            config: {
                events: [
                    {
                        time: '2024-01-15 09:00',
                        event: 'Project Kickoff',
                        description: 'Initial planning meeting with stakeholders',
                        status: 'success'
                    },
                    {
                        time: '2024-01-20 14:30',
                        event: 'Design Phase Started',
                        description: 'UI/UX design work begins',
                        status: 'success'
                    },
                    {
                        time: '2024-02-01 10:00',
                        event: 'Development Sprint 1',
                        description: 'Core functionality implementation',
                        status: 'warning'
                    },
                    {
                        time: '2024-02-15',
                        event: 'Beta Release',
                        description: 'Internal testing phase',
                        status: 'pending'
                    }
                ]
            }
        });
    </script>

    <style>
        .ms-demo__widget {
            min-height: 200px;
        }

        .ms-demo__widget .ms-widget {
            height: 100%;
        }
    </style>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
</body>
</html>
