<?php
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

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

// Handle uploaded files
$uploadedFiles = array();
if (isset($_FILES['photos'])) {
    $files = $_FILES['photos'];
    
    // Handle both single file and array of files
    if (is_array($files['name'])) {
        $count = count($files['name']);
        for ($i = 0; $i < $count; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $originalName = basename($files['name'][$i]);
                $targetPath = $roomDir . '/' . $originalName;
                
                if (move_uploaded_file($files['tmp_name'][$i], $targetPath)) {
                    $uploadedFiles[] = $originalName;
                } else {
                    http_response_code(500);
                    echo json_encode(array('error' => 'Failed to save file: ' . $originalName));
                    exit;
                }
            }
        }
    } else {
        // Single file
        if ($files['error'] === UPLOAD_ERR_OK) {
            $originalName = basename($files['name']);
            $targetPath = $roomDir . '/' . $originalName;
            
            if (move_uploaded_file($files['tmp_name'], $targetPath)) {
                $uploadedFiles[] = $originalName;
            } else {
                http_response_code(500);
                echo json_encode(array('error' => 'Failed to save file'));
                exit;
            }
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