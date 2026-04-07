<?php
require_once __DIR__ . '/../includes/db.php';

// Handle delete action
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (($input['_action'] ?? '') === 'delete-room') {
            try {
                dbDeleteRoom((int)($input['id'] ?? 0));
                jsonResponse(['success' => true]);
            } catch (Exception $e) {
                jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
            }
        }
        exit;
    }
}

$roomId = (int)($_GET['id'] ?? 0);
$room = $roomId ? dbGetRoomById($roomId) : null;

function safeJson($val) {
    if (empty($val)) return [];
    if (is_string($val)) {
        $decoded = json_decode($val, true);
        return is_array($decoded) ? $decoded : [];
    }
    return is_array($val) ? $val : [];
}

function e($s) { return htmlspecialchars((string)($s ?? ''), ENT_QUOTES, 'UTF-8'); }

$touchPanels  = safeJson($room['touch_panels'] ?? null);
$displays     = safeJson($room['displays'] ?? null);
$speakers     = safeJson($room['speakers'] ?? null);
$ceilingMics  = safeJson($room['ceiling_mics'] ?? null);
$handheldMics = safeJson($room['handheld_mics'] ?? null);
$lapelMics    = safeJson($room['lapel_mics'] ?? null);
$inventory    = safeJson($room['inventory'] ?? null);

$title = $room ? trim(($room['facility'] ?? '') . ' – ' . ($room['room_name_id'] ?? 'Room Assets'), ' –') : 'Room Not Found';
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title><?= e($title) ?></title>
  <link rel="stylesheet" href="../css/theme-dark.css" />
  <link rel="stylesheet" href="../css/theme-light.css" />
  <link rel="stylesheet" href="../css/base.css" />
  <link rel="stylesheet" href="room.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <div class="hdr-flex">
        <div class="hdr-brand">
          <img src="../Form_Logo.png" alt="Logo" class="site-logo" />
        </div>
        <div class="hdr-actions">
<?php if ($room): ?>
          <a href="../index.php?edit=<?= (int)$room['id'] ?>" class="btn secondary" title="Edit this room">Edit</a>
          <button type="button" class="btn secondary" id="deleteBtn" data-id="<?= (int)$room['id'] ?>" data-name="<?= e($room['room_name_id'] ?? '') ?>">Delete</button>
<?php endif; ?>
          <button type="button" class="btn ghost" id="themeToggle" aria-pressed="false" title="Toggle light/dark mode"><span class="theme-label">Mode: Dark</span></button>
        </div>
      </div>
    </div>
  </header>

  <main class="wrap viewer-container">
<?php if (!$room): ?>
    <div class="card"><p class="text-error">Room not found. <a href="./index.php">Return to finder</a></p></div>
<?php else: ?>

    <!-- Room Summary -->
    <div class="room-header" id="roomHeader">
<?php foreach ([
    'Country' => $room['country'], 'State' => $room['state'], 'City' => $room['city'],
    'Facility' => $room['facility'], 'Building' => $room['building'], 'Floor' => $room['floor'],
    'Room' => $room['room_name_id']
] as $label => $val): if ($val): ?>
      <div class="room-header-item"><strong><?= $label ?></strong><?= e($val) ?></div>
<?php endif; endforeach; ?>
    </div>

    <!-- Room Details -->
    <div class="card asset-section">
      <legend>Room Configuration</legend>
      <table class="asset-table mt-0"><tbody>
<?php
$details = [
    'Room Type' => $room['room_type'], 'Capacity' => $room['capacity'] ? $room['capacity'].' people' : '',
    'Microsoft Teams' => $room['microsoft_teams'], 'Room Tech' => $room['room_tech'],
    'Input Types' => $room['input_types'], 'Room Depth' => $room['room_depth'],
    'Room Width' => $room['room_width'], 'Room Height' => $room['room_height'],
    'Notes' => $room['technician_notes'],
    'Record Created' => $room['created_at'] ? date('M j, Y g:i A', strtotime($room['created_at'])) : '',
];
foreach ($details as $label => $val): if ($val): ?>
        <tr><td><strong><?= $label ?></strong></td><td><?= e($val) ?></td></tr>
<?php endif; endforeach; ?>
      </tbody></table>
    </div>

    <!-- Room Photos -->
    <div class="card asset-section">
      <legend>Room Photos</legend>
<?php
$photoDir = '/var/www/html/Photos/' . preg_replace('/[^a-zA-Z0-9\-_]/', '_', $room['room_name_id'] ?? '');
$webDir   = '/Photos/' . preg_replace('/[^a-zA-Z0-9\-_]/', '_', $room['room_name_id'] ?? '');
$photos   = (is_dir($photoDir)) ? array_diff(scandir($photoDir), ['.','..']) : [];
if (empty($photos)): ?>
      <p class="muted">No photos uploaded</p>
<?php else: ?>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
  <?php foreach ($photos as $photo): ?>
        <div style="text-align:center">
          <img src="<?= e($webDir . '/' . $photo) ?>" alt="<?= e($photo) ?>" style="max-width:240px;max-height:180px;border-radius:6px" onerror="this.style.display='none'" />
          <br/><small class="muted"><?= e($photo) ?></small>
        </div>
  <?php endforeach; ?>
      </div>
<?php endif; ?>
    </div>

    <!-- Touch Panels -->
    <div class="card asset-section">
      <legend>Touch Panels / Control Systems</legend>
<?php if (empty($touchPanels)): ?>
      <div class="empty-section">No touch panels recorded</div>
<?php else: ?>
      <table class="asset-table">
        <thead><tr><th>Type</th><th>Model</th><th>Serial</th><th>MAC Address</th><th>Location</th><th>IP</th></tr></thead>
        <tbody>
<?php foreach ($touchPanels as $p): ?>
          <tr><td><?= e($p['type'] ?? '–') ?></td><td><?= e($p['model'] ?? '–') ?></td><td><?= e($p['serial'] ?? '–') ?></td><td><code><?= e($p['mac'] ?? '–') ?></code></td><td><?= e($p['location'] ?? '–') ?></td><td><code><?= e($p['ip'] ?? '–') ?></code></td></tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
    </div>

    <!-- Displays -->
    <div class="card asset-section">
      <legend>Displays &amp; Projectors</legend>
<?php if (empty($displays)): ?>
      <div class="empty-section">No displays recorded</div>
<?php else: ?>
      <table class="asset-table">
        <thead><tr><th>Type</th><th>Make</th><th>Model</th><th>Size</th><th>Serial</th><th>MAC</th><th>IP</th></tr></thead>
        <tbody>
<?php foreach ($displays as $d): ?>
          <tr><td><?= e($d['type'] ?? '–') ?></td><td><?= e($d['make'] ?? '–') ?></td><td><?= e($d['model'] ?? '–') ?></td><td><?= e($d['size'] ?? '–') ?></td><td><?= e($d['serial'] ?? $d['sn'] ?? '–') ?></td><td><code><?= e($d['mac'] ?? '–') ?></code></td><td><code><?= e($d['ip'] ?? '–') ?></code></td></tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
    </div>

    <!-- Speakers -->
    <div class="card asset-section">
      <legend>Speakers</legend>
<?php if (empty($speakers)): ?>
      <div class="empty-section">No speakers recorded</div>
<?php else: ?>
      <table class="asset-table">
        <thead><tr><th>Type</th><th>Make</th><th>Model</th><th>Quantity</th></tr></thead>
        <tbody>
<?php foreach ($speakers as $s): ?>
          <tr><td><?= e($s['type'] ?? '–') ?></td><td><?= e($s['make'] ?? '–') ?></td><td><?= e($s['model'] ?? '–') ?></td><td><?= e($s['qty'] ?? $s['quantity'] ?? 1) ?></td></tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
    </div>

    <!-- Microphones -->
    <div class="card asset-section">
      <legend>Microphones</legend>
<?php
$hasMics = !empty($ceilingMics) || !empty($handheldMics) || !empty($lapelMics);
if (!$hasMics): ?>
      <div class="empty-section">No microphones recorded</div>
<?php else:
  $micTypes = ['Ceiling Microphones' => $ceilingMics, 'Handheld Microphones' => $handheldMics, 'Lapel/Lavalier Microphones' => $lapelMics];
  foreach ($micTypes as $label => $mics): if (!empty($mics)): ?>
      <div class="margin-bottom-16">
        <h4 class="mt-0 mb-8"><?= $label ?></h4>
        <table class="asset-table font-small">
          <thead><tr><th>Make</th><th>Model</th><th>Quantity</th><th>Frequency/Location</th><th>Serial Numbers</th></tr></thead>
          <tbody>
<?php foreach ($mics as $m): ?>
            <tr><td><?= e($m['make'] ?? '–') ?></td><td><?= e($m['model'] ?? '–') ?></td><td><?= e($m['qty'] ?? $m['quantity'] ?? 1) ?></td><td><?= e($m['frequency'] ?? $m['location'] ?? '–') ?></td><td><code class="font-xsmall"><?= e($m['sn'] ?? $m['serials'] ?? $m['receiver_sn'] ?? '–') ?></code></td></tr>
<?php endforeach; ?>
          </tbody>
        </table>
      </div>
  <?php endif; endforeach; ?>
<?php endif; ?>
    </div>

    <!-- Other Inventory -->
    <div class="card asset-section">
      <legend>Other Devices / Inventory</legend>
<?php if (empty($inventory)): ?>
      <div class="empty-section">No other devices recorded</div>
<?php else: ?>
      <table class="asset-table">
        <thead><tr><th>Device Type</th><th>Make</th><th>Model</th><th>Location</th><th>Barcode</th><th>Serial</th></tr></thead>
        <tbody>
<?php foreach ($inventory as $item): ?>
          <tr><td><?= e($item['Device Type'] ?? $item['device_type'] ?? '–') ?></td><td><?= e($item['Device Make'] ?? $item['make'] ?? '–') ?></td><td><?= e($item['Device Model'] ?? $item['model'] ?? '–') ?></td><td><?= e($item['Location'] ?? $item['location'] ?? '–') ?></td><td><code><?= e($item['Barcode'] ?? $item['barcode'] ?? '–') ?></code></td><td><code><?= e($item['Serial Number'] ?? $item['serial'] ?? '–') ?></code></td></tr>
<?php endforeach; ?>
        </tbody>
      </table>
<?php endif; ?>
    </div>

    <!-- Technician Info -->
    <div class="card asset-section">
      <legend>Technician Information</legend>
<?php if ($room['technician_name'] || $room['tech_date']): ?>
      <table class="asset-table mt-0"><tbody>
<?php if ($room['tech_date']): ?><tr><td><strong>Date</strong></td><td><?= e($room['tech_date']) ?></td></tr><?php endif; ?>
<?php if ($room['technician_name']): ?><tr><td><strong>Technician</strong></td><td><?= e($room['technician_name']) ?></td></tr><?php endif; ?>
<?php if ($room['racf']): ?><tr><td><strong>RACF</strong></td><td><?= e($room['racf']) ?></td></tr><?php endif; ?>
      </tbody></table>
<?php else: ?>
      <p class="muted">No technician information recorded</p>
<?php endif; ?>
    </div>

    <!-- Navigation -->
    <div class="navigation-footer">
      <a href="./index.php" class="btn">Back to Room Finder</a>
      <a href="../index.php" class="btn secondary">Back to Form</a>
    </div>

<?php endif; ?>
  </main>

  <script src="../js/theme.js"></script>
<?php if ($room): ?>
  <script>
    document.getElementById('deleteBtn')?.addEventListener('click', function() {
      var id = this.dataset.id, name = this.dataset.name;
      if (!confirm('Delete "' + name + '"?\n\nThis action cannot be undone.')) return;
      fetch(window.location.pathname + '?id=' + id, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({_action: 'delete-room', id: parseInt(id)})
      }).then(function(r) { return r.json(); }).then(function(j) {
        if (j.success) { alert('Room deleted'); window.location.href = './index.php'; }
        else alert('Error: ' + (j.error || 'Unknown'));
      }).catch(function(err) { alert('Delete failed: ' + err.message); });
    });
  </script>
<?php endif; ?>
</body>
</html>
