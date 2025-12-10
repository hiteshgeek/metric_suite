<?php
/**
 * Graph Thumbnail API
 *
 * Handles storing and retrieving graph thumbnails
 *
 * POST /api/graph-thumbnail.php - Upload/update thumbnail
 * GET  /api/graph-thumbnail.php?id=X - Get thumbnail path for a graph
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

// Thumbnail storage directory (relative to project root)
define('THUMBNAIL_DIR', __DIR__ . '/../uploads/thumbnails');

// Get base path for URL generation
$basePath = get_base_path();
define('THUMBNAIL_URL_PATH', $basePath . '/uploads/thumbnails');

// Ensure thumbnail directory exists
if (!is_dir(THUMBNAIL_DIR)) {
    mkdir(THUMBNAIL_DIR, 0755, true);
}

try {
    $pdo = Database::getMetricSuiteConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Get thumbnail path for a graph
            $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Graph ID is required']);
                exit;
            }

            $stmt = $pdo->prepare('SELECT thumbnail FROM graph_configs WHERE id = ?');
            $stmt->execute([$id]);
            $result = $stmt->fetch();

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'thumbnail' => $result['thumbnail'] ? THUMBNAIL_URL_PATH . '/' . $result['thumbnail'] : null
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Graph not found']);
            }
            break;

        case 'POST':
            // Upload/update thumbnail
            $input = json_decode(file_get_contents('php://input'), true);

            $graphId = isset($input['graph_id']) ? (int)$input['graph_id'] : null;
            $imageData = $input['image'] ?? null;

            if (!$graphId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Graph ID is required']);
                exit;
            }

            if (!$imageData) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Image data is required']);
                exit;
            }

            // Verify graph exists
            $stmt = $pdo->prepare('SELECT id, thumbnail FROM graph_configs WHERE id = ?');
            $stmt->execute([$graphId]);
            $graph = $stmt->fetch();

            if (!$graph) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Graph not found']);
                exit;
            }

            // Parse base64 image data
            if (preg_match('/^data:image\/(png|jpeg|jpg|gif);base64,/', $imageData, $matches)) {
                $imageType = $matches[1];
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $imageData = base64_decode($imageData);

                if ($imageData === false) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Invalid image data']);
                    exit;
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid image format. Expected base64 encoded image.']);
                exit;
            }

            // Delete old thumbnail if exists
            if ($graph['thumbnail']) {
                $oldPath = THUMBNAIL_DIR . '/' . $graph['thumbnail'];
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            // Generate unique filename
            $filename = 'graph-' . $graphId . '-' . time() . '.' . $imageType;
            $filepath = THUMBNAIL_DIR . '/' . $filename;

            // Save image file
            if (file_put_contents($filepath, $imageData) === false) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to save image file']);
                exit;
            }

            // Update database with thumbnail path
            $stmt = $pdo->prepare('UPDATE graph_configs SET thumbnail = ? WHERE id = ?');
            $stmt->execute([$filename, $graphId]);

            echo json_encode([
                'success' => true,
                'message' => 'Thumbnail saved',
                'thumbnail' => THUMBNAIL_URL_PATH . '/' . $filename
            ]);
            break;

        case 'DELETE':
            // Delete thumbnail
            $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Graph ID is required']);
                exit;
            }

            // Get current thumbnail
            $stmt = $pdo->prepare('SELECT thumbnail FROM graph_configs WHERE id = ?');
            $stmt->execute([$id]);
            $graph = $stmt->fetch();

            if (!$graph) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Graph not found']);
                exit;
            }

            // Delete file if exists
            if ($graph['thumbnail']) {
                $filepath = THUMBNAIL_DIR . '/' . $graph['thumbnail'];
                if (file_exists($filepath)) {
                    unlink($filepath);
                }
            }

            // Clear thumbnail in database
            $stmt = $pdo->prepare('UPDATE graph_configs SET thumbnail = NULL WHERE id = ?');
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Thumbnail deleted'
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
