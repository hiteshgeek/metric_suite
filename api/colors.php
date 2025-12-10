<?php
/**
 * Color Palettes API
 * CRUD operations for color palettes
 *
 * Endpoints:
 * GET    /api/colors.php              - Get all palettes
 * GET    /api/colors.php?id=1         - Get single palette
 * GET    /api/colors.php?default=1    - Get default palette
 * POST   /api/colors.php              - Create new palette
 * PUT    /api/colors.php?id=1         - Update palette
 * DELETE /api/colors.php?id=1         - Delete palette (non-system only)
 * POST   /api/colors.php?setDefault=1 - Set palette as default
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

try {
    $pdo = Database::getMetricSuiteConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            handleGet($pdo);
            break;
        case 'POST':
            handlePost($pdo);
            break;
        case 'PUT':
            handlePut($pdo);
            break;
        case 'DELETE':
            handleDelete($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * GET - Retrieve palettes
 */
function handleGet(PDO $pdo): void
{
    // Get single palette by ID
    if (isset($_GET['id'])) {
        $id = (int) $_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM color_palettes WHERE id = ?");
        $stmt->execute([$id]);
        $palette = $stmt->fetch();

        if (!$palette) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Palette not found']);
            return;
        }

        $palette['colors'] = json_decode($palette['colors'], true);
        echo json_encode(['success' => true, 'palette' => $palette]);
        return;
    }

    // Get default palette
    if (isset($_GET['default'])) {
        $stmt = $pdo->query("SELECT * FROM color_palettes WHERE is_default = 1 LIMIT 1");
        $palette = $stmt->fetch();

        if (!$palette) {
            // Return first palette if no default set
            $stmt = $pdo->query("SELECT * FROM color_palettes ORDER BY sort_order LIMIT 1");
            $palette = $stmt->fetch();
        }

        if ($palette) {
            $palette['colors'] = json_decode($palette['colors'], true);
        }

        echo json_encode(['success' => true, 'palette' => $palette]);
        return;
    }

    // Get all palettes
    $stmt = $pdo->query("SELECT * FROM color_palettes ORDER BY sort_order, name");
    $palettes = $stmt->fetchAll();

    // Decode colors JSON for each palette
    foreach ($palettes as &$palette) {
        $palette['colors'] = json_decode($palette['colors'], true);
    }

    echo json_encode(['success' => true, 'palettes' => $palettes]);
}

/**
 * POST - Create new palette or set default
 */
function handlePost(PDO $pdo): void
{
    $input = json_decode(file_get_contents('php://input'), true);

    // Set default palette
    if (isset($_GET['setDefault'])) {
        $id = (int) $_GET['setDefault'];

        // Clear existing default
        $pdo->exec("UPDATE color_palettes SET is_default = 0 WHERE is_default = 1");

        // Set new default
        $stmt = $pdo->prepare("UPDATE color_palettes SET is_default = 1 WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Default palette updated']);
        return;
    }

    // Create new palette
    if (!isset($input['name']) || !isset($input['colors'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Name and colors are required']);
        return;
    }

    $name = trim($input['name']);
    $description = trim($input['description'] ?? '');
    $colors = $input['colors'];

    // Validate colors is an array of hex codes
    if (!is_array($colors) || count($colors) < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Colors must be an array with at least one color']);
        return;
    }

    foreach ($colors as $color) {
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Invalid color format: {$color}. Use hex format like #FF5733"]);
            return;
        }
    }

    // Get next sort order
    $stmt = $pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM color_palettes");
    $nextOrder = $stmt->fetchColumn();

    $stmt = $pdo->prepare("
        INSERT INTO color_palettes (name, description, colors, sort_order)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
        $name,
        $description,
        json_encode($colors),
        $nextOrder
    ]);

    $id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Palette created',
        'id' => $id,
        'palette' => [
            'id' => $id,
            'name' => $name,
            'description' => $description,
            'colors' => $colors,
            'is_default' => 0,
            'is_system' => 0,
            'sort_order' => $nextOrder
        ]
    ]);
}

/**
 * PUT - Update existing palette
 */
function handlePut(PDO $pdo): void
{
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Palette ID required']);
        return;
    }

    $id = (int) $_GET['id'];
    $input = json_decode(file_get_contents('php://input'), true);

    // Check if palette exists
    $stmt = $pdo->prepare("SELECT * FROM color_palettes WHERE id = ?");
    $stmt->execute([$id]);
    $palette = $stmt->fetch();

    if (!$palette) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Palette not found']);
        return;
    }

    // Build update query dynamically
    $updates = [];
    $params = [];

    if (isset($input['name'])) {
        $updates[] = 'name = ?';
        $params[] = trim($input['name']);
    }

    if (isset($input['description'])) {
        $updates[] = 'description = ?';
        $params[] = trim($input['description']);
    }

    if (isset($input['colors'])) {
        $colors = $input['colors'];

        // Validate colors
        if (!is_array($colors) || count($colors) < 1) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Colors must be an array with at least one color']);
            return;
        }

        foreach ($colors as $color) {
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => "Invalid color format: {$color}"]);
                return;
            }
        }

        $updates[] = 'colors = ?';
        $params[] = json_encode($colors);
    }

    if (isset($input['sort_order'])) {
        $updates[] = 'sort_order = ?';
        $params[] = (int) $input['sort_order'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        return;
    }

    $params[] = $id;
    $sql = "UPDATE color_palettes SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Return updated palette
    $stmt = $pdo->prepare("SELECT * FROM color_palettes WHERE id = ?");
    $stmt->execute([$id]);
    $updated = $stmt->fetch();
    $updated['colors'] = json_decode($updated['colors'], true);

    echo json_encode(['success' => true, 'message' => 'Palette updated', 'palette' => $updated]);
}

/**
 * DELETE - Remove palette (non-system only)
 */
function handleDelete(PDO $pdo): void
{
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Palette ID required']);
        return;
    }

    $id = (int) $_GET['id'];

    // Check if palette exists and is not a system palette
    $stmt = $pdo->prepare("SELECT * FROM color_palettes WHERE id = ?");
    $stmt->execute([$id]);
    $palette = $stmt->fetch();

    if (!$palette) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Palette not found']);
        return;
    }

    if ($palette['is_system']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Cannot delete system palettes']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM color_palettes WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Palette deleted']);
}
