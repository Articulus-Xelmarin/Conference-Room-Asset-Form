<?php
require_once __DIR__ . '/../includes/db.php';

// Handle AJAX delete
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

$search = trim($_GET['q'] ?? '');
$rooms = [];
$error = '';
try {
    $rooms = dbGetAllRooms($search);
} catch (Exception $e) {
    $error = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Room Asset Viewer</title>
  <link rel="stylesheet" href="../css/theme-dark.css" />
  <link rel="stylesheet" href="../css/theme-light.css" />
  <link rel="stylesheet" href="../css/base.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <div class="hdr-flex">
        <div class="hdr-brand">
          <img src="../Form_Logo.png" alt="Logo" class="site-logo" />
        </div>
        <div class="hdr-actions">
          <button type="button" class="btn ghost" id="themeToggle" aria-pressed="false" title="Toggle light/dark mode"><span class="theme-label">Mode: Dark</span></button>
        </div>
        <div class="hdr-title">
          <h1>Room Asset Viewer</h1>
          <p>Browse and search all documented conference rooms.</p>
        </div>
      </div>
    </div>
  </header>

  <main class="wrap finder-container">
    <form method="get" action="" style="margin-bottom:12px">
      <input type="text" name="q" id="roomSearch" class="search-bar"
             placeholder="Filter rooms by name, location, or equipment..."
             value="<?= htmlspecialchars($search) ?>" />
    </form>

    <div id="roomList" class="room-list">
<?php if ($error): ?>
      <p class="text-error">Error loading rooms: <?= htmlspecialchars($error) ?></p>
<?php elseif (empty($rooms)): ?>
      <p>No rooms found.</p>
<?php else: ?>
  <?php foreach ($rooms as $room): ?>
      <div class="room-item" data-id="<?= (int)$room['id'] ?>">
        <div class="room-item-content">
          <div class="room-item-left">
            <a href="./room.php?id=<?= (int)$room['id'] ?>" class="room-item-heading"><?= htmlspecialchars($room['room_name_id'] ?: '(Unnamed Room)') ?></a>
            <p class="room-item-subtext"><?= htmlspecialchars(implode(', ', array_filter([$room['facility'], $room['city'], $room['state'], $room['country']]))) ?></p>
          </div>
          <button class="delete-btn btn-delete-sm" data-id="<?= (int)$room['id'] ?>" data-name="<?= htmlspecialchars($room['room_name_id'] ?? '') ?>">Delete</button>
        </div>
      </div>
  <?php endforeach; ?>
<?php endif; ?>
    </div>

    <div class="footer-actions">
      <a href="../index.php" class="btn secondary">Back to Form</a>
      <a href="../database/manager/index.php" class="btn secondary">Database Manager</a>
    </div>
  </main>

  <script src="../js/theme.js"></script>
  <script>
    // Click room item → navigate to viewer
    document.querySelectorAll('.room-item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        if (e.target.closest('.delete-btn') || e.target.closest('a')) return;
        var link = item.querySelector('a.room-item-heading');
        if (link) window.location.href = link.href;
      });
    });

    // Delete button
    document.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.dataset.id;
        var name = btn.dataset.name;
        if (!confirm('Delete "' + name + '"?\n\nThis action cannot be undone.')) return;
        fetch(window.location.pathname, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({_action: 'delete-room', id: parseInt(id)})
        }).then(function(r) { return r.json(); }).then(function(j) {
          if (j.success) location.reload();
          else alert('Error: ' + (j.error || 'Unknown'));
        }).catch(function(err) { alert('Delete failed: ' + err.message); });
      });
    });

    // Live search (client side for instant filtering)
    var allItems = Array.from(document.querySelectorAll('.room-item'));
    document.getElementById('roomSearch').addEventListener('input', function() {
      var q = this.value.toLowerCase();
      allItems.forEach(function(item) {
        var text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });
  </script>
</body>
</html>
