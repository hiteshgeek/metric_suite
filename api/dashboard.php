<?php
/**
 * Dashboard Configuration CRUD API
 *
 * Endpoints:
 * GET    /api/dashboard.php         - List all dashboards
 * GET    /api/dashboard.php?id=X    - Get single dashboard
 * POST   /api/dashboard.php         - Create new dashboard
 * PUT    /api/dashboard.php?id=X    - Update dashboard
 * DELETE /api/dashboard.php?id=X    - Delete dashboard
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
        $sql = 'SELECT id FROM dashboard_configs WHERE slug = ?';
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
 * Ensure dashboard_configs table exists
 */
function ensureTable($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS dashboard_configs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            grid_columns INT DEFAULT 12,
            widgets JSON,
            layout JSON,
            settings JSON,
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
                // Get single dashboard
                $stmt = $pdo->prepare('SELECT * FROM dashboard_configs WHERE id = ?');
                $stmt->execute([$id]);
                $config = $stmt->fetch();

                if ($config) {
                    $config['widgets'] = json_decode($config['widgets'], true);
                    $config['layout'] = json_decode($config['layout'], true);
                    $config['settings'] = json_decode($config['settings'], true);
                    echo json_encode(['success' => true, 'data' => $config]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Dashboard not found']);
                }
            } else {
                // List all dashboards
                $stmt = $pdo->query('SELECT id, name, slug, description, created_at, updated_at FROM dashboard_configs ORDER BY updated_at DESC');
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
                INSERT INTO dashboard_configs (name, slug, description, grid_columns, widgets, layout, settings)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'] ?? '',
                $input['gridColumns'] ?? 12,
                json_encode($input['widgets'] ?? []),
                json_encode($input['layout'] ?? []),
                json_encode($input['settings'] ?? [])
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
                UPDATE dashboard_configs
                SET name = ?, slug = ?, description = ?, grid_columns = ?, widgets = ?, layout = ?, settings = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ');

            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'] ?? '',
                $input['gridColumns'] ?? 12,
                json_encode($input['widgets'] ?? []),
                json_encode($input['layout'] ?? []),
                json_encode($input['settings'] ?? []),
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

            $stmt = $pdo->prepare('DELETE FROM dashboard_configs WHERE id = ?');
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Dashboard not found']);
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
