<?php
/**
 * Table Widget Demo Page
 * Showcase different table widget configurations
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
    <title>Table Demo - Metric Suite</title>

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
            <h1>Table Widgets</h1>
            <p>Display and interact with data in powerful table formats</p>
        </header>

        <!-- Demo Grid -->
        <div class="ms-demo__grid ms-demo__grid--full">
            <!-- Basic Table -->
            <div class="ms-demo__card">
                <h3>Basic Table</h3>
                <div class="ms-demo__widget" id="demo-basic"></div>
            </div>

            <!-- Interactive Table -->
            <div class="ms-demo__card">
                <h3>Interactive Table (Sortable + Filterable)</h3>
                <div class="ms-demo__widget" id="demo-interactive"></div>
            </div>

            <!-- Paginated Table -->
            <div class="ms-demo__card" style="grid-column: span 2;">
                <h3>Paginated Table</h3>
                <div class="ms-demo__widget" id="demo-paginated"></div>
            </div>

            <!-- Expandable Table -->
            <div class="ms-demo__card">
                <h3>Expandable Rows</h3>
                <div class="ms-demo__widget" id="demo-expandable"></div>
            </div>

            <!-- Editable Table -->
            <div class="ms-demo__card">
                <h3>Editable Table</h3>
                <div class="ms-demo__widget" id="demo-editable"></div>
            </div>
        </div>

        <!-- CTA -->
        <div class="ms-demo__cta">
            <a href="<?= $basePath ?>/pages/table/configurator.php" class="ms-btn ms-btn--primary ms-btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Your Own Table
            </a>
        </div>
    </main>

    <!-- Scripts -->
    <script type="module">
        import { ThemeSwitcher, WidgetFactory, WIDGET_TYPES } from '<?= asset('metric-suite.js') ?>';

        // Initialize theme switcher
        new ThemeSwitcher('#theme-switcher', { showLabels: false });

        // Sample data
        const employees = [
            { id: 1, name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering', salary: 95000, status: 'Active' },
            { id: 2, name: 'Bob Smith', email: 'bob@company.com', department: 'Marketing', salary: 75000, status: 'Active' },
            { id: 3, name: 'Carol Williams', email: 'carol@company.com', department: 'Sales', salary: 85000, status: 'Active' },
            { id: 4, name: 'David Brown', email: 'david@company.com', department: 'Engineering', salary: 105000, status: 'On Leave' },
            { id: 5, name: 'Eva Martinez', email: 'eva@company.com', department: 'HR', salary: 70000, status: 'Active' },
        ];

        const columns = [
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'department', label: 'Department' },
            { key: 'salary', label: 'Salary', format: 'currency' },
            { key: 'status', label: 'Status', type: 'badge' }
        ];

        // Basic Table
        WidgetFactory.create('#demo-basic', {
            type: WIDGET_TYPES.TABLE_BASIC,
            title: 'Employee List',
            config: {
                columns: columns.slice(0, 4),
                data: employees.slice(0, 4)
            }
        });

        // Interactive Table
        WidgetFactory.create('#demo-interactive', {
            type: WIDGET_TYPES.TABLE_INTERACTIVE,
            title: 'Employee Directory',
            config: {
                columns: columns,
                data: employees,
                sortable: true,
                filterable: true,
                selectable: true
            }
        });

        // Generate more data for pagination
        const moreEmployees = [];
        const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Support'];
        const statuses = ['Active', 'On Leave', 'Remote'];
        for (let i = 1; i <= 50; i++) {
            moreEmployees.push({
                id: i,
                name: `Employee ${i}`,
                email: `employee${i}@company.com`,
                department: departments[i % departments.length],
                salary: 50000 + Math.floor(Math.random() * 60000),
                status: statuses[i % statuses.length]
            });
        }

        // Paginated Table
        WidgetFactory.create('#demo-paginated', {
            type: WIDGET_TYPES.TABLE_PAGINATED,
            title: 'All Employees',
            config: {
                columns: columns,
                data: moreEmployees,
                pageSize: 10,
                pageSizeOptions: [5, 10, 25, 50]
            }
        });

        // Expandable Table
        const ordersWithDetails = [
            { id: 'ORD-001', customer: 'Acme Corp', total: 1250.00, status: 'Delivered', details: 'Shipped via FedEx. Tracking: 1Z999AA10123456784' },
            { id: 'ORD-002', customer: 'TechStart Inc', total: 3400.00, status: 'Processing', details: 'Payment verified. Preparing for shipment.' },
            { id: 'ORD-003', customer: 'Global Services', total: 890.50, status: 'Pending', details: 'Awaiting payment confirmation.' },
            { id: 'ORD-004', customer: 'Local Shop', total: 445.00, status: 'Delivered', details: 'Delivered to reception desk.' },
        ];

        WidgetFactory.create('#demo-expandable', {
            type: WIDGET_TYPES.TABLE_EXPANDABLE,
            title: 'Orders',
            config: {
                columns: [
                    { key: 'id', label: 'Order ID' },
                    { key: 'customer', label: 'Customer' },
                    { key: 'total', label: 'Total', format: 'currency' },
                    { key: 'status', label: 'Status', type: 'badge' }
                ],
                data: ordersWithDetails,
                expandField: 'details'
            }
        });

        // Editable Table
        const products = [
            { id: 1, name: 'Widget Pro', price: 29.99, stock: 150, active: true },
            { id: 2, name: 'Gadget Plus', price: 49.99, stock: 75, active: true },
            { id: 3, name: 'Tool Basic', price: 19.99, stock: 200, active: false },
            { id: 4, name: 'Device Max', price: 99.99, stock: 30, active: true },
        ];

        WidgetFactory.create('#demo-editable', {
            type: WIDGET_TYPES.TABLE_EDITABLE,
            title: 'Products',
            config: {
                columns: [
                    { key: 'name', label: 'Product Name', editable: true },
                    { key: 'price', label: 'Price', format: 'currency', editable: true },
                    { key: 'stock', label: 'Stock', editable: true },
                    { key: 'active', label: 'Active', type: 'boolean', editable: true }
                ],
                data: products,
                editableColumns: ['name', 'price', 'stock', 'active'],
                showActions: true
            }
        });
    </script>

    <style>
        .ms-demo__grid--full {
            grid-template-columns: 1fr 1fr;
        }

        .ms-demo__widget {
            min-height: 250px;
            overflow: auto;
        }

        .ms-demo__widget .ms-widget {
            height: 100%;
        }

        @media (max-width: 768px) {
            .ms-demo__grid--full {
                grid-template-columns: 1fr;
            }

            .ms-demo__card[style*="span 2"] {
                grid-column: span 1 !important;
            }
        }
    </style>

    <!-- Fallback for older browsers -->
    <script nomodule src="<?= asset('metric-suite.js', 'nomodule') ?>"></script>
</body>
</html>
