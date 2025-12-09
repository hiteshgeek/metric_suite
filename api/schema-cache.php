<?php
/**
 * Schema Cache API
 *
 * GET  - Retrieve cached schema (fast, from local DB)
 * POST - Refresh cache from main database (slow, admin only)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Refresh cache from main database
        echo json_encode(refreshSchemaCache());
    } else {
        // Get cached schema
        $table = $_GET['table'] ?? null;
        echo json_encode(getCachedSchema($table));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Get schema from local cache
 */
function getCachedSchema($tableName = null)
{
    $pdo = Database::getMetricSuiteConnection();

    if ($tableName) {
        // Get specific table
        $stmt = $pdo->prepare("SELECT schema_json, cached_at FROM schema_cache WHERE table_name = ?");
        $stmt->execute([$tableName]);
        $row = $stmt->fetch();

        if (!$row) {
            return ['success' => false, 'error' => 'Table not found in cache'];
        }

        $data = json_decode($row['schema_json'], true);
        $data['cached_at'] = $row['cached_at'];
        $data['success'] = true;
        return $data;
    }

    // Get all tables
    $stmt = $pdo->query("SELECT table_name, schema_json, cached_at FROM schema_cache ORDER BY table_name");
    $rows = $stmt->fetchAll();

    $tables = [];
    $cachedAt = null;

    foreach ($rows as $row) {
        $schema = json_decode($row['schema_json'], true);
        $tables[] = [
            'name' => $row['table_name'],
            'row_count' => $schema['row_count'] ?? null,
            'comment' => $schema['comment'] ?? ''
        ];
        $cachedAt = $row['cached_at'];
    }

    return [
        'success' => true,
        'tables' => $tables,
        'cached_at' => $cachedAt,
        'from_cache' => true
    ];
}

/**
 * Refresh schema cache from main database
 */
function refreshSchemaCache()
{
    $mainPdo = Database::getMainConnection();
    $cachePdo = Database::getMetricSuiteConnection();
    $dbName = $_ENV['MAIN_DB_NAME'];

    // Get all tables
    $stmt = $mainPdo->prepare("
        SELECT
            TABLE_NAME as name,
            TABLE_ROWS as row_count,
            TABLE_COMMENT as comment
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    ");
    $stmt->execute([$dbName]);
    $tables = $stmt->fetchAll();

    $cached = 0;

    foreach ($tables as $table) {
        $tableName = $table['name'];

        // Get columns
        $stmt = $mainPdo->prepare("
            SELECT
                COLUMN_NAME as name,
                DATA_TYPE as type,
                COLUMN_TYPE as full_type,
                IS_NULLABLE as nullable,
                COLUMN_KEY as key_type,
                COLUMN_DEFAULT as default_value,
                EXTRA as extra
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        ");
        $stmt->execute([$dbName, $tableName]);
        $columns = $stmt->fetchAll();

        // Get primary key
        $stmt = $mainPdo->prepare("
            SELECT COLUMN_NAME as name
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
        ");
        $stmt->execute([$dbName, $tableName]);
        $primaryKey = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Get foreign keys
        $stmt = $mainPdo->prepare("
            SELECT
                COLUMN_NAME as column_name,
                REFERENCED_TABLE_NAME as referenced_table,
                REFERENCED_COLUMN_NAME as referenced_column
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        $stmt->execute([$dbName, $tableName]);
        $foreignKeys = $stmt->fetchAll();

        // Build schema JSON
        $schemaData = [
            'table' => $tableName,
            'row_count' => $table['row_count'],
            'comment' => $table['comment'],
            'columns' => $columns,
            'primaryKey' => $primaryKey,
            'foreignKeys' => $foreignKeys
        ];

        // Upsert into cache
        $stmt = $cachePdo->prepare("
            INSERT INTO schema_cache (database_name, table_name, schema_json, cached_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE schema_json = VALUES(schema_json), cached_at = NOW()
        ");
        $stmt->execute([$dbName, $tableName, json_encode($schemaData)]);
        $cached++;
    }

    // Remove tables that no longer exist
    $tableNames = array_column($tables, 'name');
    if (!empty($tableNames)) {
        $placeholders = implode(',', array_fill(0, count($tableNames), '?'));
        $stmt = $cachePdo->prepare("DELETE FROM schema_cache WHERE database_name = ? AND table_name NOT IN ($placeholders)");
        $stmt->execute(array_merge([$dbName], $tableNames));
    }

    return [
        'success' => true,
        'message' => "Cached {$cached} tables from {$dbName}",
        'tables_cached' => $cached,
        'database' => $dbName
    ];
}
