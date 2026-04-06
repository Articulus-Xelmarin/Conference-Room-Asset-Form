<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Determine endpoint from REQUEST_URI or PATH_INFO
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$script = parse_url($_SERVER['SCRIPT_NAME'], PHP_URL_PATH);
$endpoint = '';

if (strpos($uri, $script) === 0) {
    $endpoint = substr($uri, strlen($script));
}

$endpoint = trim($endpoint, '/');
if ($endpoint === '') {
    $endpoint = '';
}

// Support calling from /api/health and /api.php/health
if ($endpoint === '' && !empty($_GET['route'])) {
    $endpoint = trim($_GET['route'], '/');
}

// Helper for JSON error
function jsonError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(array('error' => $message));
    exit;
}

// Load DB credentials from a file above the web root (not publicly accessible)
$dbConfigFile = dirname(__DIR__) . '/.db_config.php';
if (is_readable($dbConfigFile)) {
    require_once $dbConfigFile;
}

// Get DB credentials from environment variables or fallback to defaults
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'facility_mgmt';
$dbUser = getenv('DB_USER') ?: 'conf_user';
$dbPass = getenv('DB_PASS') ?: '';

$username = $dbUser;
$password = $dbPass;

if (!empty($_SERVER['PHP_AUTH_USER']) || !empty($_SERVER['HTTP_AUTHORIZATION'])) {
    if (!empty($_SERVER['PHP_AUTH_USER'])) {
        $username = $_SERVER['PHP_AUTH_USER'];
        $password = isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '';
    } else {
        // Fallback parse Authorization header
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
        if (stripos($auth, 'Basic ') === 0) {
            $decoded = base64_decode(substr($auth, 6));
            if ($decoded !== false) {
                list($u, $p) = array_pad(explode(':', $decoded, 2), 2, '');
                $username = $u;
                $password = $p;
            }
        }
    }
}

try {
    $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4", $username, $password, array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ));
} catch (Exception $e) {
    jsonError('Database connection failed: ' . $e->getMessage(), 500);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && (in_array($endpoint, array('health', '')))) {
    echo json_encode(array(
        'status' => 'ok',
        'endpoint' => $endpoint !== '' ? $endpoint : 'health',
    ));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $endpoint === 'records') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        jsonError('Invalid JSON payload', 400);
    }

    $table = isset($body['table']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $body['table']) : 'conference_rooms';
    if ($table === '') {
        jsonError('Table name is required', 400);
    }

    // Build insert field list from allowed fields
    $allowedFields = array(
        'country','state','city','facility','building','floor','room_name_id','room_type','capacity',
        'microsoft_teams','room_tech','input_types','room_depth','room_width','room_height','tech_date',
        'technician_name','racf','technician_notes','touch_panels','ceiling_mics','handheld_mics','lapel_mics',
        'speakers','displays','inventory'
    );

    $insert = array();
    $params = array();

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $body)) {
            $insert[] = "`$field`";
            $params[":$field"] = $body[$field];
        }
    }

    if (empty($insert)) {
        jsonError('No valid fields provided for record insert', 400);
    }

    $columns = implode(',', $insert);
    $values = implode(',', array_map(function($c) { return ':' . trim($c, '`'); }, $insert));

    $sql = "INSERT INTO `$table` ($columns) VALUES ($values)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(array('id' => $pdo->lastInsertId(), 'table' => $table));
    } catch (Exception $e) {
        jsonError('Insert failed: ' . $e->getMessage(), 500);
    }
    exit;
}

jsonError('Not found', 404);
