<?php
/**
 * Test Script - Fetch Single Table Info
 * Use this to verify database connection and schema API
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/db.php';

$basePath = get_base_path();

// Get table name from query string or use default
$tableName = $_GET['table'] ?? null;

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schema Test - Metric Suite</title>
    <?php favicon(); ?>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
            color: #1e293b;
        }
        h1 { color: #3b82f6; }
        h2 { color: #64748b; font-size: 1.1rem; margin-top: 2rem; }
        .card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .error { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }
        .success { background: #d1fae5; border-color: #10b981; color: #047857; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }
        th, td {
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        th { background: #f1f5f9; font-weight: 600; }
        tr:hover td { background: #f8fafc; }
        code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8rem;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .badge-pk { background: #fef3c7; color: #92400e; }
        .badge-fk { background: #dbeafe; color: #1e40af; }
        .tables-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        }
        .tables-list a {
            padding: 6px 12px;
            background: #f1f5f9;
            border-radius: 6px;
            text-decoration: none;
            color: #3b82f6;
            font-size: 0.875rem;
        }
        .tables-list a:hover { background: #dbeafe; }
        .tables-list a.active { background: #3b82f6; color: white; }
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <h1>Schema Test</h1>
    <p><a href="<?= $basePath ?>/">&larr; Back to Dashboard</a></p>

<?php
try {
    $pdo = Database::getMainConnection();
    $dbName = $_ENV['MAIN_DB_NAME'];

    echo '<div class="card success">';
    echo '<strong>Connected to:</strong> ' . htmlspecialchars($dbName);
    echo '</div>';

    // Get all tables
    $stmt = $pdo->prepare("
        SELECT TABLE_NAME as name, TABLE_ROWS as row_count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    ");
    $stmt->execute([$dbName]);
    $tables = $stmt->fetchAll();

    echo '<h2>Tables in Database</h2>';
    echo '<div class="tables-list">';
    foreach ($tables as $t) {
        $isActive = $t['name'] === $tableName ? ' active' : '';
        echo '<a href="?table=' . urlencode($t['name']) . '" class="' . $isActive . '">';
        echo htmlspecialchars($t['name']) . ' <small>(' . ($t['row_count'] ?? '?') . ')</small>';
        echo '</a>';
    }
    echo '</div>';

    // Show selected table details
    if ($tableName) {
        echo '<h2>Table: ' . htmlspecialchars($tableName) . '</h2>';

        // Columns
        $stmt = $pdo->prepare("
            SELECT
                COLUMN_NAME as name,
                COLUMN_TYPE as type,
                IS_NULLABLE as nullable,
                COLUMN_KEY as key_type,
                COLUMN_DEFAULT as default_val,
                EXTRA as extra
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        ");
        $stmt->execute([$dbName, $tableName]);
        $columns = $stmt->fetchAll();

        echo '<div class="card">';
        echo '<h3 style="margin-top:0">Columns</h3>';
        echo '<table>';
        echo '<tr><th>Name</th><th>Type</th><th>Nullable</th><th>Key</th><th>Default</th><th>Extra</th></tr>';
        foreach ($columns as $col) {
            $keyBadge = '';
            if ($col['key_type'] === 'PRI') {
                $keyBadge = '<span class="badge badge-pk">PK</span>';
            } elseif ($col['key_type'] === 'MUL') {
                $keyBadge = '<span class="badge badge-fk">FK</span>';
            }
            echo '<tr>';
            echo '<td><code>' . htmlspecialchars($col['name']) . '</code></td>';
            echo '<td>' . htmlspecialchars($col['type']) . '</td>';
            echo '<td>' . $col['nullable'] . '</td>';
            echo '<td>' . $keyBadge . '</td>';
            echo '<td>' . htmlspecialchars($col['default_val'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($col['extra']) . '</td>';
            echo '</tr>';
        }
        echo '</table>';
        echo '</div>';

        // Foreign Keys
        $stmt = $pdo->prepare("
            SELECT
                COLUMN_NAME as col,
                REFERENCED_TABLE_NAME as ref_table,
                REFERENCED_COLUMN_NAME as ref_col
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        $stmt->execute([$dbName, $tableName]);
        $foreignKeys = $stmt->fetchAll();

        if (!empty($foreignKeys)) {
            echo '<div class="card">';
            echo '<h3 style="margin-top:0">Foreign Keys</h3>';
            echo '<table>';
            echo '<tr><th>Column</th><th>References</th></tr>';
            foreach ($foreignKeys as $fk) {
                echo '<tr>';
                echo '<td><code>' . htmlspecialchars($fk['col']) . '</code></td>';
                echo '<td><code>' . htmlspecialchars($fk['ref_table']) . '.' . htmlspecialchars($fk['ref_col']) . '</code></td>';
                echo '</tr>';
            }
            echo '</table>';
            echo '</div>';
        }

        // Sample Data
        $stmt = $pdo->query("SELECT * FROM `{$tableName}` LIMIT 5");
        $sampleData = $stmt->fetchAll();

        if (!empty($sampleData)) {
            echo '<div class="card">';
            echo '<h3 style="margin-top:0">Sample Data (5 rows)</h3>';
            echo '<div style="overflow-x:auto">';
            echo '<table>';
            echo '<tr>';
            foreach (array_keys($sampleData[0]) as $colName) {
                echo '<th>' . htmlspecialchars($colName) . '</th>';
            }
            echo '</tr>';
            foreach ($sampleData as $row) {
                echo '<tr>';
                foreach ($row as $val) {
                    $display = $val === null ? '<em style="color:#94a3b8">NULL</em>' : htmlspecialchars(substr($val, 0, 50));
                    echo '<td>' . $display . '</td>';
                }
                echo '</tr>';
            }
            echo '</table>';
            echo '</div>';
            echo '</div>';
        }

        // Example Query
        $colNames = array_column($columns, 'name');
        $selectCols = count($colNames) > 5 ? array_slice($colNames, 0, 5) : $colNames;
        $exampleQuery = "SELECT " . implode(', ', $selectCols) . "\nFROM `{$tableName}`\nLIMIT 100;";

        echo '<div class="card">';
        echo '<h3 style="margin-top:0">Example Query</h3>';
        echo '<pre>' . htmlspecialchars($exampleQuery) . '</pre>';
        echo '</div>';
    }

} catch (Exception $e) {
    echo '<div class="card error">';
    echo '<strong>Error:</strong> ' . htmlspecialchars($e->getMessage());
    echo '</div>';
    echo '<p>Make sure you have configured your <code>.env</code> file with MAIN_DB_* credentials.</p>';
}
?>

</body>
</html>
