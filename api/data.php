<?php
/**
 * Data Query Execution API
 *
 * Executes SELECT queries on the main database
 * Returns data and column information for chart rendering
 *
 * POST /api/data.php
 * Body: { "query": "SELECT ..." }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Only POST method is allowed']);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['query'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Query is required']);
        exit;
    }

    $query = trim($input['query']);

    // Execute query using Database helper (includes validation)
    $result = Database::executeQuery($query);

    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
