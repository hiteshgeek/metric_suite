<?php
/**
 * Database Schema API
 * Provides metadata about the main database for query building
 *
 * Endpoints:
 * GET /api/schema.php - Get all tables
 * GET /api/schema.php?table=tablename - Get columns, keys, and relationships for a table
 * GET /api/schema.php?relationships=1 - Get all foreign key relationships
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

try {
    $pdo = Database::getMainConnection();
    $dbName = $_ENV['MAIN_DB_NAME'];

    // Get specific table details
    if (isset($_GET['table'])) {
        $tableName = $_GET['table'];
        echo json_encode(getTableDetails($pdo, $dbName, $tableName));
        exit;
    }

    // Get all relationships
    if (isset($_GET['relationships'])) {
        echo json_encode(getAllRelationships($pdo, $dbName));
        exit;
    }

    // Default: Get all tables
    echo json_encode(getAllTables($pdo, $dbName));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Get all tables in the database
 */
function getAllTables(PDO $pdo, string $dbName): array
{
    $stmt = $pdo->prepare("
        SELECT
            TABLE_NAME as name,
            TABLE_ROWS as row_count,
            TABLE_COMMENT as comment,
            ENGINE as engine
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    ");
    $stmt->execute([$dbName]);
    $tables = $stmt->fetchAll();

    return [
        'success' => true,
        'database' => $dbName,
        'tables' => $tables
    ];
}

/**
 * Get detailed information about a specific table
 */
function getTableDetails(PDO $pdo, string $dbName, string $tableName): array
{
    // Validate table name (prevent SQL injection)
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $tableName)) {
        throw new Exception('Invalid table name');
    }

    // Get columns
    $stmt = $pdo->prepare("
        SELECT
            COLUMN_NAME as name,
            DATA_TYPE as type,
            COLUMN_TYPE as full_type,
            IS_NULLABLE as nullable,
            COLUMN_KEY as key_type,
            COLUMN_DEFAULT as default_value,
            EXTRA as extra,
            COLUMN_COMMENT as comment
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    ");
    $stmt->execute([$dbName, $tableName]);
    $columns = $stmt->fetchAll();

    // Get primary key
    $stmt = $pdo->prepare("
        SELECT COLUMN_NAME as name
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = 'PRIMARY'
        ORDER BY ORDINAL_POSITION
    ");
    $stmt->execute([$dbName, $tableName]);
    $primaryKey = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Get indexes
    $stmt = $pdo->prepare("
        SELECT
            INDEX_NAME as name,
            NON_UNIQUE as non_unique,
            GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        GROUP BY INDEX_NAME, NON_UNIQUE
    ");
    $stmt->execute([$dbName, $tableName]);
    $indexes = $stmt->fetchAll();

    // Get foreign keys (this table references others)
    $stmt = $pdo->prepare("
        SELECT
            CONSTRAINT_NAME as name,
            COLUMN_NAME as column_name,
            REFERENCED_TABLE_NAME as referenced_table,
            REFERENCED_COLUMN_NAME as referenced_column
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    ");
    $stmt->execute([$dbName, $tableName]);
    $foreignKeys = $stmt->fetchAll();

    // Get reverse relationships (other tables reference this table)
    $stmt = $pdo->prepare("
        SELECT
            TABLE_NAME as referencing_table,
            COLUMN_NAME as referencing_column,
            CONSTRAINT_NAME as name
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    ");
    $stmt->execute([$dbName, $tableName]);
    $referencedBy = $stmt->fetchAll();

    // Get sample data (first 5 rows)
    $stmt = $pdo->query("SELECT * FROM `{$tableName}` LIMIT 5");
    $sampleData = $stmt->fetchAll();

    return [
        'success' => true,
        'table' => $tableName,
        'columns' => $columns,
        'primaryKey' => $primaryKey,
        'indexes' => $indexes,
        'foreignKeys' => $foreignKeys,
        'referencedBy' => $referencedBy,
        'sampleData' => $sampleData
    ];
}

/**
 * Get all foreign key relationships in the database
 */
function getAllRelationships(PDO $pdo, string $dbName): array
{
    $stmt = $pdo->prepare("
        SELECT
            TABLE_NAME as source_table,
            COLUMN_NAME as source_column,
            REFERENCED_TABLE_NAME as target_table,
            REFERENCED_COLUMN_NAME as target_column,
            CONSTRAINT_NAME as constraint_name
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME
    ");
    $stmt->execute([$dbName]);
    $relationships = $stmt->fetchAll();

    // Build a relationship map for easy lookup
    $map = [];
    foreach ($relationships as $rel) {
        $sourceTable = $rel['source_table'];
        if (!isset($map[$sourceTable])) {
            $map[$sourceTable] = [];
        }
        $map[$sourceTable][] = [
            'column' => $rel['source_column'],
            'references' => [
                'table' => $rel['target_table'],
                'column' => $rel['target_column']
            ]
        ];
    }

    return [
        'success' => true,
        'relationships' => $relationships,
        'map' => $map
    ];
}
