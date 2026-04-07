<?php
require_once dirname(dirname(__DIR__)) . '/includes/auth.php';
// Database Manager — server-side PHP (no client JS needed for DB ops)

// Load DB config
$dbConfigFile = dirname(dirname(__DIR__)) . '/../.db_config.php';
if (is_readable($dbConfigFile)) {
    require_once $dbConfigFile;
}

$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'facility_mgmt';
$dbUser = getenv('DB_USER') ?: 'conf_user';
$dbPass = getenv('DB_PASS') ?: '';

$table = 'conference_rooms';
$message = '';
$messageType = '';

try {
    $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $dbConnected = true;
} catch (Exception $e) {
    $dbConnected = false;
    $message = 'Database connection failed: ' . htmlspecialchars($e->getMessage());
    $messageType = 'error';
}

// Handle POST actions
if ($dbConnected && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'clear_all') {
        try {
            $pdo->exec("DELETE FROM `$table`");
            $message = 'All records deleted successfully.';
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error clearing records: ' . htmlspecialchars($e->getMessage());
            $messageType = 'error';
        }
    } elseif ($action === 'delete_old') {
        try {
            $stmt = $pdo->prepare("DELETE FROM `$table` WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
            $stmt->execute();
            $count = $stmt->rowCount();
            $message = "Deleted {$count} records older than 90 days.";
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error: ' . htmlspecialchars($e->getMessage());
            $messageType = 'error';
        }
    } elseif ($action === 'delete_one') {
        $id = intval($_POST['record_id'] ?? 0);
        if ($id > 0) {
            try {
                $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = :id");
                $stmt->execute([':id' => $id]);
                $message = $stmt->rowCount() ? "Record #{$id} deleted." : "Record #{$id} not found.";
                $messageType = $stmt->rowCount() ? 'success' : 'error';
            } catch (Exception $e) {
                $message = 'Error: ' . htmlspecialchars($e->getMessage());
                $messageType = 'error';
            }
        }
    } elseif ($action === 'reset_db') {
        try {
            $pdo->exec("DELETE FROM `$table`");
            $pdo->exec("ALTER TABLE `$table` AUTO_INCREMENT = 1");
            $message = 'Database reset successfully. Auto-increment reset to 1.';
            $messageType = 'success';
        } catch (Exception $e) {
            $message = 'Error resetting: ' . htmlspecialchars($e->getMessage());
            $messageType = 'error';
        }
    } elseif ($action === 'import_json') {
        if (!empty($_FILES['json_file']['tmp_name'])) {
            $raw = file_get_contents($_FILES['json_file']['tmp_name']);
            $records = json_decode($raw, true);
            if (!is_array($records)) {
                $message = 'Invalid JSON file.';
                $messageType = 'error';
            } else {
                $allowedFields = ['country','state','city','facility','building','floor','room_name_id','room_type','capacity',
                    'microsoft_teams','room_tech','input_types','room_depth','room_width','room_height','tech_date',
                    'technician_name','racf','technician_notes','touch_panels','ceiling_mics','handheld_mics','lapel_mics',
                    'speakers','displays','inventory'];
                $imported = 0;
                foreach ($records as $rec) {
                    if (!is_array($rec)) continue;
                    $cols = [];
                    $params = [];
                    foreach ($allowedFields as $f) {
                        if (array_key_exists($f, $rec)) {
                            $cols[] = "`$f`";
                            $params[":$f"] = $rec[$f];
                        }
                    }
                    if (empty($cols)) continue;
                    $sql = "INSERT INTO `$table` (" . implode(',', $cols) . ") VALUES (" . implode(',', array_keys($params)) . ")";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $imported++;
                }
                $message = "Imported {$imported} records successfully.";
                $messageType = 'success';
            }
        } else {
            $message = 'No file uploaded.';
            $messageType = 'error';
        }
    }
}

// Gather stats
$stats = ['total' => 0, 'oldest' => null, 'newest' => null];
$records = [];
$searchQuery = '';

if ($dbConnected) {
    try {
        $row = $pdo->query("SELECT COUNT(*) AS c, MIN(created_at) AS oldest, MAX(created_at) AS newest FROM `$table`")->fetch();
        $stats['total'] = (int)$row['c'];
        $stats['oldest'] = $row['oldest'];
        $stats['newest'] = $row['newest'];
    } catch (Exception $e) {}

    // Fetch records for display
    $view = $_GET['view'] ?? '';
    $searchQuery = trim($_GET['q'] ?? '');

    try {
        if ($searchQuery !== '') {
            $like = '%' . $searchQuery . '%';
            $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE room_name_id LIKE :q1 OR facility LIKE :q2 OR city LIKE :q3 OR building LIKE :q4 ORDER BY id DESC");
            $stmt->execute([':q1' => $like, ':q2' => $like, ':q3' => $like, ':q4' => $like]);
            $records = $stmt->fetchAll();
        } elseif ($view === 'all') {
            $records = $pdo->query("SELECT * FROM `$table` ORDER BY id DESC")->fetchAll();
        } elseif ($view === 'recent') {
            $records = $pdo->query("SELECT * FROM `$table` ORDER BY id DESC LIMIT 10")->fetchAll();
        }
    } catch (Exception $e) {
        $message = 'Query error: ' . htmlspecialchars($e->getMessage());
        $messageType = 'error';
    }

    // Export JSON download
    if (($view === 'export') && $dbConnected) {
        $all = $pdo->query("SELECT * FROM `$table` ORDER BY id DESC")->fetchAll();
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="conference-rooms-backup_' . date('Y-m-d') . '.json"');
        echo json_encode($all, JSON_PRETTY_PRINT);
        exit;
    }
}

// Facility breakdown for backup info
$facilityBreakdown = [];
if (isset($_GET['view']) && $_GET['view'] === 'info' && $dbConnected) {
    try {
        $stmt = $pdo->query("SELECT COALESCE(facility, 'Unknown') AS fac, COUNT(*) AS cnt FROM `$table` GROUP BY facility ORDER BY cnt DESC");
        $facilityBreakdown = $stmt->fetchAll();
    } catch (Exception $e) {}
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Database Manager</title>
  <link rel="stylesheet" href="../../css/theme-dark.css" />
  <link rel="stylesheet" href="../../css/theme-light.css" />
  <link rel="stylesheet" href="../../css/base.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <div class="hdr-flex">
        <div class="hdr-brand">
          <img src="../../Form_Logo.png" alt="Logo" class="site-logo" />
        </div>
        <div class="hdr-actions">
          <a href="?logout" class="btn secondary">Logout</a>
          <button type="button" class="btn ghost" id="themeToggle" aria-pressed="false" title="Toggle light/dark mode"><span class="theme-label">Mode: Dark</span></button>
        </div>
<<<<<<< HEAD
        <div class="hdr-title">
          <h1>Database Manager</h1>
          <p>Direct database access for administration and maintenance.</p>
        </div>
=======
>>>>>>> 069272d78edbbccf334855ac1a98e3e9efea0bb3
      </div>
    </div>
  </header>

  <main class="wrap db-container">

<?php if ($message): ?>
    <div class="card" style="border-left:3px solid <?= $messageType === 'success' ? '#4caf50' : '#f44336' ?>; margin-bottom:1rem;">
      <p class="<?= $messageType === 'success' ? 'help' : 'error' ?>" style="margin:0;"><?= htmlspecialchars($message) ?></p>
    </div>
<?php endif; ?>

    <!-- Statistics -->
    <div class="card section-card">
      <legend>Database Statistics</legend>
<?php if ($dbConnected): ?>
      <p class="help">
        <strong><?= $stats['total'] ?> total records</strong>
        &bull; Oldest: <?= $stats['oldest'] ? date('M j, Y', strtotime($stats['oldest'])) : 'N/A' ?>
        &bull; Newest: <?= $stats['newest'] ? date('M j, Y', strtotime($stats['newest'])) : 'N/A' ?>
        &bull; Server: <?= htmlspecialchars($dbHost . ':' . $dbPort) ?>
        &bull; Database: <?= htmlspecialchars($dbName) ?>
      </p>
      <div class="row-flex-wrap-gap mt-12">
        <form method="post" onsubmit="return confirm('Reset the database? This deletes ALL records and resets the auto-increment.');">
          <input type="hidden" name="action" value="reset_db" />
          <button type="submit" class="btn secondary">Initialize / Reset Database</button>
        </form>
      </div>
<?php else: ?>
      <p class="error">Not connected to database.</p>
<?php endif; ?>
    </div>

    <!-- View Records -->
    <div class="card section-card">
      <legend>View Records</legend>
      <p class="sub">Browse all conference room records in the database.</p>
      <div class="row-flex-wrap-gap">
        <a href="?view=all" class="btn">View All Records</a>
        <a href="?view=recent" class="btn secondary">View Recent 10</a>
      </div>
      <form method="get" class="mt-12" style="display:flex;gap:8px;align-items:center;">
        <input type="text" name="q" value="<?= htmlspecialchars($searchQuery) ?>" placeholder="Search room name, facility, city, building..." style="flex:1;" />
        <button type="submit" class="btn secondary">Search</button>
      </form>

<?php if (!empty($records)): ?>
      <p class="help mt-12"><strong><?= count($records) ?> record<?= count($records) !== 1 ? 's' : '' ?> found</strong></p>
      <div class="mt-8">
<?php   foreach ($records as $r): ?>
        <div class="record-row" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div>
            <strong><?= htmlspecialchars($r['room_name_id'] ?: 'Unknown') ?></strong><br/>
            <small><?= htmlspecialchars($r['facility'] ?: 'N/A') ?> &bull; <?= htmlspecialchars($r['building'] ?: 'N/A') ?> &bull; <?= $r['created_at'] ? date('M j, Y g:ia', strtotime($r['created_at'])) : 'N/A' ?></small>
          </div>
          <form method="post" style="margin:0;" onsubmit="return confirm('Delete record #<?= $r['id'] ?>?');">
            <input type="hidden" name="action" value="delete_one" />
            <input type="hidden" name="record_id" value="<?= $r['id'] ?>" />
            <button type="submit" class="btn ghost text-error" style="padding:4px 10px;font-size:0.8rem;">Delete</button>
          </form>
        </div>
<?php   endforeach; ?>
      </div>
<?php elseif (isset($_GET['view']) || $searchQuery !== ''): ?>
      <p class="muted mt-12">No records found.</p>
<?php endif; ?>
    </div>

    <!-- Backup & Restore -->
    <div class="card section-card">
      <legend>Backup &amp; Restore</legend>
      <p class="sub">Export your database as JSON or restore from a previous backup.</p>
      <div class="row-flex-wrap-gap">
        <a href="?view=export" class="btn">Export as JSON</a>
        <a href="?view=info" class="btn secondary">View Backup Info</a>
        <form method="post" enctype="multipart/form-data" style="display:inline-flex;align-items:center;gap:8px;margin:0;">
          <input type="hidden" name="action" value="import_json" />
          <label class="btn ghost" style="cursor:pointer;">
            <input type="file" name="json_file" accept="application/json,.json" style="display:none;" onchange="this.form.submit();" />
            Load Backup File
          </label>
        </form>
      </div>

<?php if (!empty($facilityBreakdown)): ?>
      <div class="mt-12">
        <p class="help"><strong>Records by Facility:</strong></p>
        <table class="asset-table mt-8" style="max-width:400px;">
          <thead><tr><th>Facility</th><th>Count</th></tr></thead>
          <tbody>
<?php   foreach ($facilityBreakdown as $fb): ?>
            <tr><td><?= htmlspecialchars($fb['fac']) ?></td><td><?= $fb['cnt'] ?></td></tr>
<?php   endforeach; ?>
          </tbody>
        </table>
      </div>
<?php elseif (isset($_GET['view']) && $_GET['view'] === 'info' && $stats['total'] === 0): ?>
      <p class="muted mt-12">No records in database.</p>
<?php endif; ?>
    </div>

    <!-- Maintenance -->
    <div class="card section-card">
      <legend>Maintenance</legend>
      <p class="sub">Perform database maintenance operations.</p>
      <div class="row-flex-wrap-gap">
        <form method="post" onsubmit="return confirm('Delete all records older than 90 days?');">
          <input type="hidden" name="action" value="delete_old" />
          <button type="submit" class="btn secondary">Delete Records Older Than 90 Days</button>
        </form>
        <form method="post" onsubmit="return confirm('DELETE ALL RECORDS? This cannot be undone.');">
          <input type="hidden" name="action" value="clear_all" />
          <button type="submit" class="btn secondary text-error">Clear All Records</button>
        </form>
      </div>
    </div>

    <!-- Navigation -->
    <div class="bottom-border-row">
      <a href="../../index.php" class="btn">Back to Form</a>
      <a href="../../config/index.php" class="btn secondary">Configuration &amp; Settings</a>
    </div>
  </main>

  <script src="../../js/theme.js"></script>
</body>
</html>
