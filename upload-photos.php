<?php
header('Content-Type: application/json');

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('error' => 'Method not allowed'));
    exit;
}

// Get room name
$roomName = isset($_POST['roomName']) ? $_POST['roomName'] : '';
if (empty($roomName)) {
    http_response_code(400);
    echo json_encode(array('error' => 'Room name is required'));
    exit;
}

// Sanitize room name for directory creation
$roomName = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $roomName);

// Create Photos directory if it doesn't exist
$photosDir = __DIR__ . '/Photos';
if (!is_dir($photosDir)) {
    if (!mkdir($photosDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(array('error' => 'Failed to create Photos directory'));
        exit;
    }
}

// Create room subdirectory
$roomDir = $photosDir . '/' . $roomName;
if (!is_dir($roomDir)) {
    if (!mkdir($roomDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(array('error' => 'Failed to create room directory'));
        exit;
    }
}

// Allowed MIME types and max file size (10 MB)
$allowedMimes = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
$maxBytes = 10 * 1024 * 1024;

function validateAndSave($tmpPath, $originalName, $roomDir, $allowedMimes, $maxBytes) {
    $mime = mime_content_type($tmpPath);
    if (!in_array($mime, $allowedMimes, true)) {
        return 'File type not allowed: ' . $originalName;
    }
    if (filesize($tmpPath) > $maxBytes) {
        return 'File too large (max 10 MB): ' . $originalName;
    }
    // Use a safe filename: sanitize and preserve extension from MIME
    $ext = explode('/', $mime)[1];
    if ($ext === 'jpeg') $ext = 'jpg';
    $safeName = preg_replace('/[^a-zA-Z0-9\-_]/', '_', pathinfo($originalName, PATHINFO_FILENAME)) . '.' . $ext;
    if (!move_uploaded_file($tmpPath, $roomDir . '/' . $safeName)) {
        return 'Failed to save file: ' . $originalName;
    }
    return $safeName;
}

// Handle uploaded files
$uploadedFiles = array();
if (isset($_FILES['photos'])) {
    $files = $_FILES['photos'];

    // Handle both single file and array of files
    if (is_array($files['name'])) {
        $count = count($files['name']);
        for ($i = 0; $i < $count; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $result = validateAndSave($files['tmp_name'][$i], $files['name'][$i], $roomDir, $allowedMimes, $maxBytes);
                if (strpos($result, 'File') === 0 && strpos($result, '.') === false) {
                    http_response_code(400);
                    echo json_encode(array('error' => $result));
                    exit;
                }
                $uploadedFiles[] = $result;
            }
        }
    } else {
        // Single file
        if ($files['error'] === UPLOAD_ERR_OK) {
            $result = validateAndSave($files['tmp_name'], $files['name'], $roomDir, $allowedMimes, $maxBytes);
            if (strpos($result, 'File') === 0 && strpos($result, '.') === false) {
                http_response_code(400);
                echo json_encode(array('error' => $result));
                exit;
            }
            $uploadedFiles[] = $result;
        }
    }
}

echo json_encode(array(
    'success' => true,
    'room' => $roomName,
    'uploaded' => $uploadedFiles,
    'count' => count($uploadedFiles)
));
?>