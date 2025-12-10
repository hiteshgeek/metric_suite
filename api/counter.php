<?php
/**
 * Counter Configuration CRUD API
 *
 * Endpoints:
 * GET    /api/counter.php         - List all configs
 * GET    /api/counter.php?id=X    - Get single config
 * POST   /api/counter.php         - Create new config
 * PUT    /api/counter.php?id=X    - Update config
 * DELETE /api/counter.php?id=X    - Delete config
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
        $sql = 'SELECT id FROM counter_configs WHERE slug = ?';
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
                $stmt = $pdo->prepare('SELECT * FROM counter_configs WHERE id = ?');
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
                $stmt = $pdo->query('SELECT id, name, slug, title, counter_count, description, created_at, updated_at, thumbnail FROM counter_configs ORDER BY updated_at DESC');
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
                INSERT INTO counter_configs (
                    name, slug, description, config, data_source, data_query, static_data,
                    title, counter_count, layout, bg_color, fg_color, accent_color, palette_id,
                    value_column_1, label_1, prefix_1, suffix_1, format_1, icon_1,
                    value_column_2, label_2, prefix_2, suffix_2, format_2, icon_2,
                    value_column_3, label_3, prefix_3, suffix_3, format_3, icon_3,
                    refresh_interval
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $input['name'],
                $slug,
                $input['description'] ?? null,
                json_encode($input['config'] ?? []),
                $input['data_source'] ?? 'query',
                $input['data_query'] ?? null,
                json_encode($input['static_data'] ?? null),
                $input['title'] ?? null,
                $input['counter_count'] ?? 1,
                $input['layout'] ?? 'horizontal',
                $input['bg_color'] ?? null,
                $input['fg_color'] ?? null,
                $input['accent_color'] ?? null,
                $input['palette_id'] ?? null,
                // Counter 1
                $input['value_column_1'] ?? null,
                $input['label_1'] ?? null,
                $input['prefix_1'] ?? null,
                $input['suffix_1'] ?? null,
                $input['format_1'] ?? null,
                $input['icon_1'] ?? null,
                // Counter 2
                $input['value_column_2'] ?? null,
                $input['label_2'] ?? null,
                $input['prefix_2'] ?? null,
                $input['suffix_2'] ?? null,
                $input['format_2'] ?? null,
                $input['icon_2'] ?? null,
                // Counter 3
                $input['value_column_3'] ?? null,
                $input['label_3'] ?? null,
                $input['prefix_3'] ?? null,
                $input['suffix_3'] ?? null,
                $input['format_3'] ?? null,
                $input['icon_3'] ?? null,
                $input['refresh_interval'] ?? 0,
            ]);

            $newId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $newId, 'slug' => $slug, 'message' => 'Counter created']);
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

            // Map of field names to their input keys
            $fieldMap = [
                'name' => 'name',
                'description' => 'description',
                'config' => 'config',
                'data_source' => 'data_source',
                'data_query' => 'data_query',
                'static_data' => 'static_data',
                'title' => 'title',
                'counter_count' => 'counter_count',
                'layout' => 'layout',
                'bg_color' => 'bg_color',
                'fg_color' => 'fg_color',
                'accent_color' => 'accent_color',
                'palette_id' => 'palette_id',
                'value_column_1' => 'value_column_1',
                'label_1' => 'label_1',
                'prefix_1' => 'prefix_1',
                'suffix_1' => 'suffix_1',
                'format_1' => 'format_1',
                'icon_1' => 'icon_1',
                'value_column_2' => 'value_column_2',
                'label_2' => 'label_2',
                'prefix_2' => 'prefix_2',
                'suffix_2' => 'suffix_2',
                'format_2' => 'format_2',
                'icon_2' => 'icon_2',
                'value_column_3' => 'value_column_3',
                'label_3' => 'label_3',
                'prefix_3' => 'prefix_3',
                'suffix_3' => 'suffix_3',
                'format_3' => 'format_3',
                'icon_3' => 'icon_3',
                'refresh_interval' => 'refresh_interval',
            ];

            foreach ($fieldMap as $dbField => $inputKey) {
                if (isset($input[$inputKey])) {
                    $fields[] = "$dbField = ?";
                    $value = $input[$inputKey];

                    // JSON encode config and static_data
                    if (in_array($dbField, ['config', 'static_data'])) {
                        $value = json_encode($value);
                    }

                    $values[] = $value;
                }
            }

            // Handle name change -> update slug
            if (isset($input['name'])) {
                $slug = generateSlug($pdo, $input['name'], $id);
                $fields[] = 'slug = ?';
                $values[] = $slug;
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No fields to update']);
                exit;
            }

            $values[] = $id;
            $sql = 'UPDATE counter_configs SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);

            echo json_encode(['success' => true, 'message' => 'Counter updated']);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID is required']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM counter_configs WHERE id = ?');
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Counter deleted']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Counter not found']);
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
