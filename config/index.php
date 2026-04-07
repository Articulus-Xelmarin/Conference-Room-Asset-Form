<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

// Handle AJAX actions
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && stripos($ct, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['_action'] ?? '';
    try {
        if ($action === 'test') {
            $stats = dbGetStats();
            jsonResponse(['success' => true, 'stats' => $stats]);
        } elseif ($action === 'generate-samples') {
            $samples = [
                ['country'=>'United States','state'=>'Illinois','city'=>'Moline','facility'=>'Main Campus','building'=>'4th','floor'=>'1','room_name_id'=>'90HUD MAIN 4-13','room_type'=>'Large Conference','microsoft_teams'=>'Yes','capacity'=>40,'room_width'=>'25','room_depth'=>'35','room_height'=>'10','room_tech'=>'Full AV Integration','input_types'=>'HDMI, USB-C, Wireless','technician_notes'=>'Main conference room with full AV integration.','touch_panels'=>json_encode([['type'=>'Crestron','model'=>'TSW-1060','serial'=>'TS-001','mac'=>'4C:26:A7:7D:8A:57','location'=>'Wall near entry','ip'=>'10.100.50.101']]),'ceiling_mics'=>json_encode([['make'=>'Shure','model'=>'MX410/2','qty'=>2]]),'handheld_mics'=>json_encode([['qty'=>2,'receiver_sn'=>'RX-0456','dante'=>'No']]),'lapel_mics'=>json_encode([['qty'=>4,'receiver_sn'=>'RX-0789','dante'=>'No']]),'speakers'=>json_encode([['type'=>'Ceiling','make'=>'QSC','model'=>'AC-C1','quantity'=>6]]),'displays'=>json_encode([['type'=>'Display','make'=>'Sony','model'=>'FWD-98Z9D','size'=>'98"','serial'=>'SONY-001']]),'inventory'=>json_encode([['device_type'=>'Codec','make'=>'Cisco','model'=>'SX80','location'=>'AV Rack']]),'technician_name'=>'James Smith','racf'=>'jsmith','tech_date'=>date('Y-m-d')],
                ['country'=>'United States','state'=>'Illinois','city'=>'Moline','facility'=>'Main Campus','building'=>'4th','floor'=>'2','room_name_id'=>'85HUD MAIN 4-27','room_type'=>'Medium Conference','microsoft_teams'=>'Yes','capacity'=>25,'room_width'=>'18','room_depth'=>'28','room_height'=>'9','room_tech'=>'Standard AV','input_types'=>'HDMI, Wireless','technician_notes'=>'Smaller meeting space.','touch_panels'=>json_encode([['type'=>'AMX','model'=>'N7XX','serial'=>'AMX-001','mac'=>'4C:26:A7:7D:8D:44','location'=>'Table']]),'ceiling_mics'=>json_encode([['make'=>'Shure','model'=>'MX412','qty'=>1]]),'handheld_mics'=>json_encode([['qty'=>1,'receiver_sn'=>'RX-0200','dante'=>'Yes']]),'lapel_mics'=>'[]','speakers'=>json_encode([['type'=>'Ceiling','make'=>'Bose','model'=>'MI2CEILING','quantity'=>4]]),'displays'=>json_encode([['type'=>'Display','make'=>'LG','model'=>'OLED83C3PUA','size'=>'83"','serial'=>'LG-0001']]),'inventory'=>json_encode([['device_type'=>'Codec','make'=>'Polycom','model'=>'RealPresence Trio','location'=>'Cabinet']]),'technician_name'=>'Maria Garcia','racf'=>'mgarcia','tech_date'=>date('Y-m-d')],
                ['country'=>'United States','state'=>'Illinois','city'=>'Moline','facility'=>'Building 6','building'=>'6D','floor'=>'3','room_name_id'=>'Collaboration Hub','room_type'=>'Collaboration Space','microsoft_teams'=>'Yes','capacity'=>15,'room_width'=>'15','room_depth'=>'20','room_height'=>'9','room_tech'=>'Interactive','input_types'=>'USB-C, Wireless','technician_notes'=>'Huddle space for small team meetings.','touch_panels'=>'[]','ceiling_mics'=>json_encode([['make'=>'Audio-Technica','model'=>'U4100','qty'=>1]]),'handheld_mics'=>'[]','lapel_mics'=>'[]','speakers'=>json_encode([['type'=>'Tabletop','make'=>'Bose','model'=>'S1 Pro','quantity'=>2]]),'displays'=>json_encode([['type'=>'Display','make'=>'Microsoft','model'=>'Surface Hub 3','size'=>'85"','serial'=>'MSH-001']]),'inventory'=>'[]','technician_name'=>'Robert Chen','racf'=>'rchen','tech_date'=>date('Y-m-d')],
                ['country'=>'Canada','state'=>'Ontario','city'=>'Toronto','facility'=>'Canada HQ','building'=>'Tower A','floor'=>'5','room_name_id'=>'Executive Boardroom','room_type'=>'Boardroom','microsoft_teams'=>'Yes','capacity'=>30,'room_width'=>'22','room_depth'=>'32','room_height'=>'11','room_tech'=>'Premium AV','input_types'=>'HDMI, USB-C, SDI','technician_notes'=>'Premium video conferencing suite.','touch_panels'=>json_encode([['type'=>'Crestron','model'=>'TSW-760','serial'=>'TS-002','mac'=>'4C:26:A7:7D:8F:66','location'=>'Wall','ip'=>'10.100.60.101']]),'ceiling_mics'=>json_encode([['make'=>'Shure','model'=>'MX414','qty'=>3]]),'handheld_mics'=>json_encode([['qty'=>2,'receiver_sn'=>'RX-0500','dante'=>'Yes']]),'lapel_mics'=>json_encode([['qty'=>6,'receiver_sn'=>'RX-0600','dante'=>'Yes']]),'speakers'=>json_encode([['type'=>'Ceiling','make'=>'JBL','model'=>'Control Contractor','quantity'=>8]]),'displays'=>json_encode([['type'=>'Display','make'=>'Samsung','model'=>'QN98LST','size'=>'98"','serial'=>'SAM-001']]),'inventory'=>json_encode([['device_type'=>'Codec','make'=>'Cisco','model'=>'SX20','location'=>'Rack']]),'technician_name'=>'David Thompson','racf'=>'dthompson','tech_date'=>date('Y-m-d')],
                ['country'=>'United States','state'=>'Iowa','city'=>'Dubuque','facility'=>'Operations Center','building'=>'2','floor'=>'1','room_name_id'=>'Control Room','room_type'=>'War Room','microsoft_teams'=>'No','capacity'=>20,'room_width'=>'20','room_depth'=>'25','room_height'=>'9','room_tech'=>'Monitoring','input_types'=>'HDMI, DisplayPort','technician_notes'=>'Critical infrastructure monitoring.','touch_panels'=>json_encode([['type'=>'Extron','model'=>'TLP Pro 3100','serial'=>'EXT-001','mac'=>'4C:26:A7:7D:91:88','location'=>'Multiple walls']]),'ceiling_mics'=>'[]','handheld_mics'=>'[]','lapel_mics'=>'[]','speakers'=>json_encode([['type'=>'Ceiling','make'=>'Extron','model'=>'XPA','quantity'=>4]]),'displays'=>json_encode([['type'=>'Display','make'=>'Christie','model'=>'DHD850','size'=>'85"','serial'=>'CHR-001'],['type'=>'Display','make'=>'Christie','model'=>'DHD850','size'=>'85"','serial'=>'CHR-002']]),'inventory'=>json_encode([['device_type'=>'Switcher','make'=>'Extron','model'=>'DXP 6x2','location'=>'Rack']]),'technician_name'=>'Lisa Anderson','racf'=>'landerson','tech_date'=>date('Y-m-d')]
            ];
            $count = 0;
            foreach ($samples as $s) { dbInsertRoom($s); $count++; }
            jsonResponse(['success' => true, 'count' => $count]);
        } elseif ($action === 'clear-all') {
            dbClearAll();
            jsonResponse(['success' => true]);
        } elseif ($action === 'import') {
            $records = $input['records'] ?? [];
            $count = 0;
            foreach ($records as $rec) {
                if (!empty($rec['country']) && !empty($rec['room_name_id'])) {
                    dbInsertRoom($rec);
                    $count++;
                }
            }
            jsonResponse(['success' => true, 'count' => $count]);
        } elseif ($action === 'change-password') {
            $newPassword = $input['newPassword'] ?? '';
            if (strlen($newPassword) < 4) {
                jsonResponse(['success' => false, 'error' => 'Password must be at least 4 characters'], 400);
            }
            $hash = password_hash($newPassword, PASSWORD_DEFAULT);
            $hashFile = __DIR__ . '/../includes/auth_password.php';
            $written = file_put_contents($hashFile, "<?php\nreturn '" . addslashes($hash) . "';\n");
            jsonResponse($written !== false ? ['success' => true] : ['success' => false, 'error' => 'Could not save password']);
        }
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
    exit;
}

// Get stats for display
$stats = ['total_records' => 0, 'oldest_record' => null, 'newest_record' => null];
try { $stats = dbGetStats(); } catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Settings</title>
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
      </div>
    </div>
  </header>

  <main class="wrap">
    <div class="header-row">
      <h2 class="mt-0">Settings &amp; Configuration</h2>
      <a href="?logout" class="btn secondary">Logout</a>
    </div>

    <!-- Database Status -->
    <div class="card section-card">
      <legend>Database Status</legend>
      <p class="sub">Server-side MariaDB connection via PHP. No client-side credentials needed.</p>
      <table class="asset-table mt-0"><tbody>
        <tr><td><strong>Total Records</strong></td><td><?= $stats['total_records'] ?></td></tr>
        <tr><td><strong>Oldest Record</strong></td><td><?= $stats['oldest_record'] ?: '—' ?></td></tr>
        <tr><td><strong>Newest Record</strong></td><td><?= $stats['newest_record'] ?: '—' ?></td></tr>
      </tbody></table>
      <div class="row-flex-gap mt-12">
        <button type="button" id="testConnection" class="btn secondary">Test Connection</button>
      </div>
      <p id="connectionStatus" class="mt-8 hidden"></p>
    </div>

    <!-- Password Management -->
    <div class="card section-card">
      <legend>Security</legend>
      <p class="sub">Change your configuration password.</p>
      <div class="grid grid-cols-2">
        <label>New Password<input type="password" id="newPassword" placeholder="Leave empty to keep current" autocomplete="off" /></label>
        <label>Confirm Password<input type="password" id="confirmPassword" placeholder="Leave empty to keep current" autocomplete="off" /></label>
      </div>
      <button type="button" id="changePassword" class="btn mt-12">Update Password</button>
      <p id="passwordStatus" class="mt-8 hidden"></p>
    </div>

    <!-- Testing & Sample Data -->
    <div class="card section-card">
      <legend>Testing &amp; Sample Data</legend>
      <p class="sub">Generate realistic sample conference rooms for testing.</p>
      <div class="row-flex-wrap-gap">
        <button type="button" id="generateSampleBtn" class="btn secondary">Generate 5 Sample Rooms</button>
        <button type="button" id="clearDbBtn" class="btn ghost text-error">Clear All Data</button>
      </div>
      <p id="sampleStatus" class="mt-8 hidden"></p>
    </div>

    <!-- Navigation -->
    <div class="bottom-border-row">
      <a href="../index.php" class="btn secondary">Back to Form</a>
      <a href="../database/manager/index.php" class="btn secondary">Database Manager</a>
    </div>
  </main>

  <script src="../js/theme.js"></script>
  <script>
    function showStatus(el, type, msg) { el.textContent = msg; el.className = type === 'success' ? 'help' : 'error'; el.style.display = 'block'; }

    // Password change
    document.getElementById('changePassword').addEventListener('click', function() {
      var np = document.getElementById('newPassword').value;
      var cp = document.getElementById('confirmPassword').value;
      var st = document.getElementById('passwordStatus');
      if (!np) { showStatus(st, 'error', 'New password is required'); return; }
      if (np !== cp) { showStatus(st, 'error', 'Passwords do not match'); return; }
      phpAction('change-password', {newPassword: np}).then(function(j) {
        if (j.success) { showStatus(st, 'success', 'Password updated successfully'); document.getElementById('newPassword').value = ''; document.getElementById('confirmPassword').value = ''; }
        else showStatus(st, 'error', 'Error: ' + (j.error || 'Unknown error'));
      }).catch(function(e) { showStatus(st, 'error', 'Error: ' + e.message); });
    });

    function phpAction(action, extra) {
      return fetch(window.location.pathname, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Object.assign({_action: action}, extra || {}))
      }).then(function(r) { return r.json(); });
    }

    // Test connection
    document.getElementById('testConnection').addEventListener('click', function() {
      var st = document.getElementById('connectionStatus');
      phpAction('test').then(function(j) {
        if (j.success) showStatus(st, 'success', 'Connection OK — ' + j.stats.total_records + ' records');
        else showStatus(st, 'error', 'Failed: ' + j.error);
      }).catch(function(e) { showStatus(st, 'error', 'Error: ' + e.message); });
    });

    // Generate samples
    document.getElementById('generateSampleBtn').addEventListener('click', function() {
      var st = document.getElementById('sampleStatus');
      phpAction('generate-samples').then(function(j) {
        if (j.success) { showStatus(st, 'success', 'Generated ' + j.count + ' sample rooms'); }
        else showStatus(st, 'error', 'Error: ' + j.error);
      }).catch(function(e) { showStatus(st, 'error', 'Error: ' + e.message); });
    });

    // Clear all
    document.getElementById('clearDbBtn').addEventListener('click', function() {
      if (!confirm('This will DELETE ALL records. Are you sure?')) return;
      var st = document.getElementById('sampleStatus');
      phpAction('clear-all').then(function(j) {
        if (j.success) showStatus(st, 'success', 'All data cleared');
        else showStatus(st, 'error', 'Error: ' + j.error);
      }).catch(function(e) { showStatus(st, 'error', 'Error: ' + e.message); });
    });
  </script>
</body>
</html>
