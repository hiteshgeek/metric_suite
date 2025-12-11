<?php
/**
 * List Widget Configuration CRUD API
 *
 * Endpoints:
 * GET    /api/list.php         - List all configs
 * GET    /api/list.php?id=X    - Get single config
 * POST   /api/list.php         - Create new config
 * PUT    /api/list.php?id=X    - Update config
 * DELETE /api/list.php?id=X    - Delete config
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug($pdo, $name, $excludeId = null) {
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[^a-z0-9-]/', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug);
    $slug = trim($slug, '-');

    $baseSlug = $slug;
    $counter = 1;

    while (true) {
        $sql = 'SELECT id FROM list_configs WHERE slug = ?';
        $params = [$slug];

        if ($excludeId) {
            $sql .= ' AND id != ?';
            $params[] = $excludeId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if (!$stmt->fetch()) {
            break;
        }

        $slug = $baseSlug . '-' . $counter;
        $counter++;
    }

    return $slug;
}

/**
 * Ensure list_configs table exists
 */
function ensureTable($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS list_configs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            type VARCHAR(50) NOT NULL DEFAULT 'list-simple',
            title VARCHAR(255),
            description TEXT,
            config JSON,
            data_source VARCHAR(50) DEFAULT 'static',
            static_data JSON,
            query TEXT,
            api_url VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
}

try {
    $pdo = Database::getMetricSuiteConnection();
    ensureTable($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single config
                $stmt = $pdo->prepare('SELECT * FROM list_configs WHERE id = ?');
                $stmt->execute([$id]);
                $config = $stmt->fetch();

                if ($config) {
                    $config['config'] = json_decode($config['config'], true);
                    $config['static_data'] = json_decode($config['static_data'], true);
                    echo json_encode(['success' => true, 'data' => $config]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Config not found']);
                }
            } else {
                // List all configs
                $stmt = $pdo->query('SELECT id, name, slug, type, title, created_at, updated_at FROM list_configs ORDER BY updated_at DESC');
                $configs = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $configs]);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['name'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Name is required']);
                exit;
            }

            $slug = generateSlug($pdo, $input['name']);

            $stmt = $pdo->prepare('
                INSERT INTO list_configs (name, slug, type, title, description, config, data_source, static_data, query, api_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $input['name'],
                $slug,
                $input['type'] ?? 'list-simple',
                $input['title'] ?? '',
                $input['description'] ?? '',
                json_encode($input['config'] ?? []),
                $input['dataSource'] ?? 'static',
                $input['data'] ?? '[]',
                $input['query'] ?? '',
                $input['apiUrl'] ?? ''
            ]);

            $newId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $newId, 'slug' => $slug]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID is required']);
                exit;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['name'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Name is required']);
                exit;
            }

            $slug = generateSlug($pdo, $input['name'], $id);

            $stmt = $pdo->prepare('
                UPDATE list_configs
                SET name = ?, slug = ?, type = ?, title = ?, description = ?, config = ?,
                    data_source = ?, static_data = ?, query = ?, api_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ');

            $stmt->execute([
                $input['name'],
                $slug,
                $input['type'] ?? 'list-simple',
                $input['title'] ?? '',
                $input['description'] ?? '',
                json_encode($input['config'] ?? []),
                $input['dataSource'] ?? 'static',
                $input['data'] ?? '[]',
                $input['query'] ?? '',
                $input['apiUrl'] ?? '',
                $id
            ]);

            echo json_encode(['success' => true, 'slug' => $slug]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID is required']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM list_configs WHERE id = ?');
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Config not found']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
