<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

$allowedFields = array(
    'country','state','city','facility','building','floor','room_name_id','room_type','capacity',
    'microsoft_teams','room_tech','input_types','room_depth','room_width','room_height','tech_date',
    'technician_name','racf','technician_notes','touch_panels','ceiling_mics','handheld_mics','lapel_mics',
    'speakers','displays','inventory'
);

$table = 'conference_rooms';

// ---- Health ----
if ($_SERVER['REQUEST_METHOD'] === 'GET' && (in_array($endpoint, array('health', '')))) {
    echo json_encode(array('status' => 'ok'));
    exit;
}

// ---- Stats ----
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $endpoint === 'stats') {
    $stmt = $pdo->query("SELECT COUNT(*) as total, MIN(created_at) as oldest, MAX(created_at) as newest FROM `$table`");
    $row = $stmt->fetch();
    echo json_encode(array(
        'total_records' => (int)$row['total'],
        'oldest_record' => $row['oldest'],
        'newest_record' => $row['newest']
    ));
    exit;
}

// ---- GET records (list all or search) ----
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $endpoint === 'records') {
    $search = isset($_GET['q']) ? $_GET['q'] : '';
    if ($search !== '') {
        $like = '%' . $search . '%';
        $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE room_name_id LIKE :q1 OR facility LIKE :q2 OR city LIKE :q3 OR country LIKE :q4 OR building LIKE :q5 ORDER BY id DESC");
        $stmt->execute(array(':q1'=>$like, ':q2'=>$like, ':q3'=>$like, ':q4'=>$like, ':q5'=>$like));
    } else {
        $stmt = $pdo->query("SELECT * FROM `$table` ORDER BY id DESC");
    }
    echo json_encode($stmt->fetchAll());
    exit;
}

// ---- GET records/{id} ----
if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('#^records/(\d+)$#', $endpoint, $m)) {
    $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = :id");
    $stmt->execute(array(':id' => $m[1]));
    $row = $stmt->fetch();
    if (!$row) jsonError('Record not found', 404);
    echo json_encode($row);
    exit;
}

// ---- POST records (insert) ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $endpoint === 'records') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        jsonError('Invalid JSON payload', 400);
    }

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

// ---- PUT records/{id} (update) ----
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && preg_match('#^records/(\d+)$#', $endpoint, $m)) {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        jsonError('Invalid JSON payload', 400);
    }

    $sets = array();
    $params = array(':id' => $m[1]);

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $body)) {
            $sets[] = "`$field` = :$field";
            $params[":$field"] = $body[$field];
        }
    }

    if (empty($sets)) {
        jsonError('No valid fields provided for update', 400);
    }

    $sql = "UPDATE `$table` SET " . implode(',', $sets) . " WHERE id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ($stmt->rowCount() === 0) jsonError('Record not found', 404);
        echo json_encode(array('updated' => true, 'id' => $m[1]));
    } catch (Exception $e) {
        jsonError('Update failed: ' . $e->getMessage(), 500);
    }
    exit;
}

// ---- DELETE records/{id} ----
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && preg_match('#^records/(\d+)$#', $endpoint, $m)) {
    $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = :id");
    $stmt->execute(array(':id' => $m[1]));
    if ($stmt->rowCount() === 0) jsonError('Record not found', 404);
    echo json_encode(array('deleted' => true, 'id' => $m[1]));
    exit;
}

// ---- DELETE records (clear all) ----
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $endpoint === 'records') {
    $stmt = $pdo->exec("DELETE FROM `$table`");
    echo json_encode(array('deleted' => true, 'count' => $stmt));
    exit;
}

jsonError('Not found', 404);
