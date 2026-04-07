<?php
/**
 * Shared database helper — all pages include this for DB operations.
 * Credentials come from /var/www/.db_config.php (above web root).
 */

function getDbConnection() {
    static $pdo = null;
    if ($pdo) return $pdo;
    require_once '/var/www/.db_config.php';
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $name = getenv('DB_NAME') ?: 'facility_mgmt';
    $user = getenv('DB_USER') ?: 'conf_user';
    $pass = getenv('DB_PASS') ?: '';
    $dsn  = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $pdo  = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

$ALLOWED_COLS = [
    'country','state','city','facility','building','floor',
    'room_name_id','room_type','capacity','microsoft_teams',
    'room_tech','input_types','room_depth','room_width','room_height',
    'tech_date','technician_name','racf','technician_notes',
    'touch_panels','ceiling_mics','handheld_mics','lapel_mics',
    'speakers','displays','inventory'
];

/** Map form-field names (JS) → DB column names */
function mapFormToDb(array $d): array {
    return [
        'country'          => $d['Country'] ?? '',
        'state'            => $d['State/Province'] ?? '',
        'city'             => $d['City'] ?? '',
        'facility'         => $d['Facility'] ?? '',
        'building'         => $d['Building'] ?? '',
        'floor'            => $d['Floor'] ?? '',
        'room_name_id'     => $d['RoomNameID'] ?? '',
        'room_type'        => $d['Room Type'] ?? '',
        'capacity'         => $d['Capacity'] ?? null,
        'microsoft_teams'  => $d['Microsoft Teams'] ?? '',
        'room_tech'        => $d['Room Tech'] ?? '',
        'input_types'      => $d['Input Type'] ?? '',
        'room_depth'       => $d['Room Depth'] ?? '',
        'room_width'       => $d['Room Width'] ?? '',
        'room_height'      => $d['Room Height'] ?? '',
        'tech_date'        => $d['Tech Date'] ?? '',
        'technician_name'  => $d['Technician Name'] ?? '',
        'racf'             => $d['RACF'] ?? '',
        'technician_notes' => $d['Technician Notes'] ?? '',
        'touch_panels'     => is_string($d['TouchPanels'] ?? null) ? $d['TouchPanels'] : json_encode($d['TouchPanels'] ?? []),
        'ceiling_mics'     => is_string($d['CeilingMics'] ?? null) ? $d['CeilingMics'] : json_encode($d['CeilingMics'] ?? []),
        'handheld_mics'    => is_string($d['HandheldMics'] ?? null) ? $d['HandheldMics'] : json_encode($d['HandheldMics'] ?? []),
        'lapel_mics'       => is_string($d['LapelMics'] ?? null) ? $d['LapelMics'] : json_encode($d['LapelMics'] ?? []),
        'speakers'         => is_string($d['Speakers'] ?? null) ? $d['Speakers'] : json_encode($d['Speakers'] ?? []),
        'displays'         => is_string($d['Displays'] ?? null) ? $d['Displays'] : json_encode($d['Displays'] ?? []),
        'inventory'        => is_string($d['Inventory'] ?? null) ? $d['Inventory'] : json_encode($d['Inventory'] ?? []),
    ];
}

function dbGetAllRooms(string $search = ''): array {
    $pdo = getDbConnection();
    if ($search !== '') {
        $like = "%{$search}%";
        $stmt = $pdo->prepare("SELECT * FROM conference_rooms WHERE room_name_id LIKE ? OR facility LIKE ? OR city LIKE ? OR country LIKE ? OR state LIKE ? ORDER BY updated_at DESC");
        $stmt->execute([$like, $like, $like, $like, $like]);
    } else {
        $stmt = $pdo->query("SELECT * FROM conference_rooms ORDER BY updated_at DESC");
    }
    return $stmt->fetchAll();
}

function dbGetRoomById(int $id) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT * FROM conference_rooms WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function dbInsertRoom(array $data): int {
    global $ALLOWED_COLS;
    $pdo = getDbConnection();
    $filtered = array_intersect_key($data, array_flip($ALLOWED_COLS));
    if (empty($filtered)) throw new Exception('No valid columns');
    $cols = implode(', ', array_keys($filtered));
    $phs  = implode(', ', array_fill(0, count($filtered), '?'));
    $stmt = $pdo->prepare("INSERT INTO conference_rooms ({$cols}) VALUES ({$phs})");
    $stmt->execute(array_values($filtered));
    return (int)$pdo->lastInsertId();
}

function dbUpdateRoom(int $id, array $data): void {
    global $ALLOWED_COLS;
    $pdo = getDbConnection();
    $filtered = array_intersect_key($data, array_flip($ALLOWED_COLS));
    if (empty($filtered)) throw new Exception('No valid columns');
    $sets = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($filtered)));
    $vals = array_values($filtered);
    $vals[] = $id;
    $stmt = $pdo->prepare("UPDATE conference_rooms SET {$sets} WHERE id = ?");
    $stmt->execute($vals);
}

function dbDeleteRoom(int $id): void {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("DELETE FROM conference_rooms WHERE id = ?");
    $stmt->execute([$id]);
}

function dbClearAll(): void {
    getDbConnection()->exec("DELETE FROM conference_rooms");
}

function dbGetStats(): array {
    $pdo = getDbConnection();
    return [
        'total_records' => (int)$pdo->query("SELECT COUNT(*) FROM conference_rooms")->fetchColumn(),
        'oldest_record' => $pdo->query("SELECT MIN(created_at) FROM conference_rooms")->fetchColumn(),
        'newest_record' => $pdo->query("SELECT MAX(updated_at) FROM conference_rooms")->fetchColumn(),
    ];
}

/** Send JSON response and exit */
function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
