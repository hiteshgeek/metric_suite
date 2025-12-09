<?php
/**
 * Database Connection Manager
 *
 * Provides two database connections:
 * - MetricSuite DB: Stores graph configs and metadata
 * - Main DB: External database where data queries run
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

class Database
{
    private static ?PDO $msConnection = null;
    private static ?PDO $mainConnection = null;
    private static bool $envLoaded = false;

    /**
     * Load environment variables
     */
    private static function loadEnv(): void
    {
        if (self::$envLoaded) {
            return;
        }

        $dotenv = Dotenv::createUnsafeImmutable(__DIR__ . '/..');
        $dotenv->safeLoad();
        self::$envLoaded = true;
    }

    /**
     * Get MetricSuite database connection (for storing configs)
     */
    public static function getMetricSuiteConnection(): PDO
    {
        if (self::$msConnection === null) {
            self::loadEnv();

            $host = getenv('MS_DB_HOST') ?: 'localhost';
            $name = getenv('MS_DB_NAME') ?: 'metric_suite';
            $user = getenv('MS_DB_USER') ?: 'root';
            $pass = getenv('MS_DB_PASS') ?: '';

            $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";

            self::$msConnection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        }

        return self::$msConnection;
    }

    /**
     * Get Main database connection (for running data queries)
     */
    public static function getMainConnection(): PDO
    {
        if (self::$mainConnection === null) {
            self::loadEnv();

            $host = getenv('MAIN_DB_HOST') ?: 'localhost';
            $name = getenv('MAIN_DB_NAME') ?: '';
            $user = getenv('MAIN_DB_USER') ?: 'root';
            $pass = getenv('MAIN_DB_PASS') ?: '';

            if (empty($name)) {
                throw new Exception('MAIN_DB_NAME is not configured in .env');
            }

            $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";

            self::$mainConnection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        }

        return self::$mainConnection;
    }

    /**
     * Execute a SELECT query on the main database
     * Returns data and column information
     */
    public static function executeQuery(string $query): array
    {
        // Validate query is SELECT only
        $trimmedQuery = trim($query);
        if (!preg_match('/^SELECT\s/i', $trimmedQuery)) {
            throw new Exception('Only SELECT queries are allowed');
        }

        // Check for dangerous keywords
        $dangerous = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
        foreach ($dangerous as $keyword) {
            if (preg_match('/\b' . $keyword . '\b/i', $trimmedQuery)) {
                throw new Exception("Query contains forbidden keyword: {$keyword}");
            }
        }

        $pdo = self::getMainConnection();
        $stmt = $pdo->query($query);
        $data = $stmt->fetchAll();

        // Get column names
        $columns = [];
        if (!empty($data)) {
            $columns = array_keys($data[0]);
        } else {
            // Get columns from statement metadata if no rows
            $columnCount = $stmt->columnCount();
            for ($i = 0; $i < $columnCount; $i++) {
                $meta = $stmt->getColumnMeta($i);
                $columns[] = $meta['name'];
            }
        }

        return [
            'success' => true,
            'data' => $data,
            'columns' => $columns,
            'rowCount' => count($data)
        ];
    }
}
