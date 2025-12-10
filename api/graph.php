<?php
/**
 * Graph Configuration CRUD API
 *
 * Endpoints:
 * GET    /api/graph.php         - List all configs
 * GET    /api/graph.php?id=X    - Get single config
 * POST   /api/graph.php         - Create new config
 * PUT    /api/graph.php?id=X    - Update config
 * DELETE /api/graph.php?id=X    - Delete config
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
    // Convert to lowercase, replace spaces with hyphens, remove special chars
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[^a-z0-9-]/', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug); // Remove multiple hyphens
    $slug = trim($slug, '-');

    // Ensure uniqueness
    $baseSlug = $slug;
    $counter = 1;

    while (true) {
        $sql = 'SELECT id FROM graph_configs WHERE slug = ?';
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

try {
    $pdo = Database::getMetricSuiteConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single config
                $stmt = $pdo->prepare('SELECT * FROM graph_configs WHERE id = ?');
                $stmt->execute([$id]);
                $config = $stmt->fetch();

                if ($config) {
                    $config['config'] = json_decode($config['config'], true);
                    echo json_encode(['success' => true, 'data' => $config]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Config not found']);
                }
            } else {
                // List all configs with more details
                $stmt = $pdo->query('SELECT id, name, slug, type, description, created_at, updated_at FROM graph_configs ORDER BY updated_at DESC');
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

            // Generate slug from name
            $slug = generateSlug($pdo, $input['name']);

            $stmt = $pdo->prepare('
                INSERT INTO graph_configs (name, slug, type, description, config, data_query, x_column, y_column)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $input['name'],
                $slug,
                $input['type'] ?? 'bar',
                $input['description'] ?? null,
                json_encode($input['config'] ?? []),
                $input['data_query'] ?? null,
                $input['x_column'] ?? null,
                $input['y_column'] ?? null,
            ]);

            $newId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $newId, 'slug' => $slug, 'message' => 'Config created']);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID is required']);
                exit;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            $fields = [];
            $values = [];

            if (isset($input['name'])) {
                $fields[] = 'name = ?';
                $values[] = $input['name'];

                // Update slug when name changes
                $slug = generateSlug($pdo, $input['name'], $id);
                $fields[] = 'slug = ?';
                $values[] = $slug;
            }
            if (isset($input['type'])) {
                $fields[] = 'type = ?';
                $values[] = $input['type'];
            }
            if (isset($input['description'])) {
                $fields[] = 'description = ?';
                $values[] = $input['description'];
            }
            if (isset($input['config'])) {
                $fields[] = 'config = ?';
                $values[] = json_encode($input['config']);
            }
            if (isset($input['data_query'])) {
                $fields[] = 'data_query = ?';
                $values[] = $input['data_query'];
            }
            if (isset($input['x_column'])) {
                $fields[] = 'x_column = ?';
                $values[] = $input['x_column'];
            }
            if (isset($input['y_column'])) {
                $fields[] = 'y_column = ?';
                $values[] = $input['y_column'];
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No fields to update']);
                exit;
            }

            $values[] = $id;
            $sql = 'UPDATE graph_configs SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);

            echo json_encode(['success' => true, 'message' => 'Config updated']);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID is required']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM graph_configs WHERE id = ?');
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Config deleted']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Config not found']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
