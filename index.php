<?php
require_once __DIR__ . '/includes/db.php';

// ── Handle AJAX actions (JSON) ──────────────────────────────────────────
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && stripos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['_action'] ?? 'submit';

    try {
        if ($action === 'submit') {
            $mapped = mapFormToDb($input);
            $editId = isset($input['_editId']) ? (int)$input['_editId'] : 0;
            if ($editId > 0) {
                dbUpdateRoom($editId, $mapped);
                jsonResponse(['success' => true, 'id' => $editId, 'message' => 'Room updated']);
            } else {
                $id = dbInsertRoom($mapped);
                jsonResponse(['success' => true, 'id' => $id, 'message' => 'Room saved']);
            }
        } elseif ($action === 'get-room') {
            $id = (int)($input['id'] ?? 0);
            $room = $id ? dbGetRoomById($id) : null;
            jsonResponse($room ? ['success' => true, 'room' => $room] : ['success' => false, 'error' => 'Not found'], $room ? 200 : 404);
        } elseif ($action === 'delete-room') {
            dbDeleteRoom((int)($input['id'] ?? 0));
            jsonResponse(['success' => true]);
        } elseif ($action === 'insert-raw') {
            $id = dbInsertRoom($input['data'] ?? []);
            jsonResponse(['success' => true, 'id' => $id]);
        } elseif ($action === 'clear-all') {
            dbClearAll();
            jsonResponse(['success' => true]);
        } elseif ($action === 'test') {
        } elseif ($action === 'import-raw') {
            $records = $input['records'] ?? [];
            $count = 0;
            foreach ($records as $rec) { if (!empty($rec['country']) && !empty($rec['room_name_id'])) { dbInsertRoom($rec); $count++; } }
            jsonResponse(['success' => true, 'count' => $count]);
            $stats = dbGetStats();
            jsonResponse(['success' => true, 'stats' => $stats]);
        }
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
    exit;
}

// ── Handle export downloads ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    try {
        $rooms = dbGetAllRooms();
        if ($_GET['action'] === 'export-json') {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="rooms-' . date('Y-m-d') . '.json"');
            echo json_encode($rooms, JSON_PRETTY_PRINT);
            exit;
        }
        if ($_GET['action'] === 'export-csv') {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="rooms-' . date('Y-m-d') . '.csv"');
            if (!empty($rooms)) {
                $out = fopen('php://output', 'w');
                fputcsv($out, array_keys($rooms[0]));
                foreach ($rooms as $row) fputcsv($out, $row);
                fclose($out);
            }
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo $e->getMessage();
        exit;
    }
}

// ── Prepare edit data if ?edit=ID ───────────────────────────────────────
$editRoom = null;
if (isset($_GET['edit'])) {
    $editRoom = dbGetRoomById((int)$_GET['edit']);
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title><?= $editRoom ? 'Edit Room' : 'Room Documentation' ?></title>
  <link rel="stylesheet" href="css/theme-dark.css" />
  <link rel="stylesheet" href="css/theme-light.css" />
  <link rel="stylesheet" href="css/base.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <div class="hdr-flex">
        <div class="hdr-brand">
          <img src="Form_Logo.png" alt="Logo" class="site-logo" />
        </div>
        <div class="hdr-actions">
          <a href="./config/index.php" class="btn secondary" title="Configuration Settings">&#x2699;&#xFE0F; Settings</a>
          <button type="button" class="btn ghost" id="themeToggle" aria-pressed="false" title="Toggle light/dark mode"><span class="theme-label">Mode: Dark</span></button>
        </div>
        <div class="hdr-title">
          <h1>Conference Room Documentation</h1>
          <p>Mobile-friendly, audit-ready form for location, room details and AV assets.</p>
        </div>
      </div>
    </div>
  </header>

  <main class="wrap">
    <form id="roomForm" class="form" novalidate>
<?php if ($editRoom): ?>
      <input type="hidden" id="editingRoomId" value="<?= (int)$editRoom['id'] ?>" />
<?php endif; ?>

      <fieldset class="card">
        <legend>Location</legend>
        <div class="grid grid-cols-3">
          <label>Country<span class="req">*</span>
            <input list="countryList" name="Country" placeholder="United States" value="<?= htmlspecialchars($editRoom['country'] ?? '') ?>" required>
          </label>
          <label>State / Province<span class="req">*</span>
            <input name="State/Province" placeholder="Illinois / Ontario" value="<?= htmlspecialchars($editRoom['state'] ?? '') ?>" required>
          </label>
          <label>City<span class="req">*</span>
            <input name="City" placeholder="Moline" value="<?= htmlspecialchars($editRoom['city'] ?? '') ?>" required>
          </label>
          <label>Facility / Campus<span class="req">*</span>
            <input name="Facility" placeholder="Main Campus" value="<?= htmlspecialchars($editRoom['facility'] ?? '') ?>" required>
          </label>
          <label>Building<span class="req">*</span>
            <input name="Building" placeholder="4th" value="<?= htmlspecialchars($editRoom['building'] ?? '') ?>" required>
          </label>
          <label>Floor<span class="req">*</span>
            <input name="Floor" placeholder="1 / 2 / 3 / 4" value="<?= htmlspecialchars($editRoom['floor'] ?? '') ?>" required>
          </label>
          <label>Room Name / ID<span class="req">*</span>
            <input name="RoomNameID" placeholder="e.g., 90HUD MAIN 4-13 or dwbldg6d" value="<?= htmlspecialchars($editRoom['room_name_id'] ?? '') ?>" required>
          </label>
          <label>AVPM (optional)
            <input name="AVPM" placeholder="" />
          </label>
        </div>
      </fieldset>

      <fieldset class="card">
        <legend>Room Details</legend>
        <div class="grid grid-cols-3">
          <label>Capacity
            <input name="Capacity" type="number" min="0" value="<?= htmlspecialchars($editRoom['capacity'] ?? '') ?>" />
          </label>
          <label>Room Type<span class="req">*</span>
            <select name="Room Type" required>
              <option value="">— Select —</option>
<?php
$roomTypes = ['Huddle','Focus Room','Small Conference','Medium Conference','Large Conference','Boardroom','Executive','Training','Classroom','Multipurpose','Collaboration Space','War Room','Briefing Center','All-Hands / Town Hall','Auditorium','Lab','Makerspace','Video Conference Suite','Hotelling / Touchdown'];
foreach ($roomTypes as $rt):
  $sel = (($editRoom['room_type'] ?? '') === $rt) ? ' selected' : '';
?>
              <option<?= $sel ?>><?= $rt ?></option>
<?php endforeach; ?>
            </select>
          </label>
          <label>Microsoft Teams Enabled<span class="req">*</span>
            <select name="Microsoft Teams" required>
              <option value="">— Select —</option>
              <option<?= (($editRoom['microsoft_teams'] ?? '') === 'Yes') ? ' selected' : '' ?>>Yes</option>
              <option<?= (($editRoom['microsoft_teams'] ?? '') === 'No') ? ' selected' : '' ?>>No</option>
            </select>
          </label>
          <label>Room Depth
            <input name="Room Depth" placeholder="e.g., 15'" value="<?= htmlspecialchars($editRoom['room_depth'] ?? '') ?>" />
          </label>
          <label>Room Width
            <input name="Room Width" placeholder="e.g., 12'" value="<?= htmlspecialchars($editRoom['room_width'] ?? '') ?>" />
          </label>
          <label>Room Height
            <input name="Room Height" placeholder="e.g., 10'" value="<?= htmlspecialchars($editRoom['room_height'] ?? '') ?>" />
          </label>
          <label>Room Tech (AMX, Crestron, Extron, etc.)
            <input name="Room Tech" placeholder="AMX; Q-SYS; Crestron" value="<?= htmlspecialchars($editRoom['room_tech'] ?? '') ?>" />
          </label>
          <label>Input Types (HDMI, USB-C, etc.)
            <input name="Input Type" placeholder="HDMI; USB-C" value="<?= htmlspecialchars($editRoom['input_types'] ?? '') ?>" />
          </label>
        </div>
      </fieldset>

      <fieldset class="card">
        <legend>Room Photos</legend>
        <p class="sub">
          <strong>Required Photos:</strong> View from all 4 corners of the room, the display(s), any hardware behind the display, the rack (if there is one in the room), and under the table.<br/>
          <strong>Other Helpful Photos:</strong> Floor boxes / cable cubbies, touch panel mounting, and ceiling mics/speakers.
        </p>
        <div id="photoDropZone" class="drop-zone">
          <div class="drop-zone-prompt">
            <span class="drop-zone-icon">&#x1F4F7;</span>
            <span>Drag &amp; drop photos here, or</span>
            <label class="btn secondary drop-zone-btn">
              Browse Files
              <input type="file" id="roomPhotos" name="RoomPhotos" multiple accept="image/*" class="hidden" />
            </label>
          </div>
        </div>
        <div id="photoQueue" class="photo-queue"></div>
      </fieldset>

      <fieldset class="card">
        <legend>Touch Panel(s)</legend>
        <div id="tpContainer" class="stack"></div>
        <div class="actions">
          <button type="button" id="addTp" class="btn secondary">+ Add Touch Panel</button>
        </div>
      </fieldset>

      <fieldset class="card">
        <legend>Microphones</legend>
        <div class="grid grid-cols-3">
          <label class="check"><input type="checkbox" id="hasCeilingMics" /> Ceiling Mics present</label>
          <label class="check"><input type="checkbox" id="hasHandheldMics" /> Handheld Mics present</label>
          <label class="check"><input type="checkbox" id="hasLapelMics" /> Lapel Mics present</label>
        </div>
        <div id="ceilingBlock" class="nested hidden">
          <h4>Ceiling Mics</h4>
          <div id="ceilingContainer" class="stack"></div>
          <div class="actions"><button type="button" id="addCeiling" class="btn secondary">+ Add Ceiling Mic</button></div>
        </div>
        <div id="handheldBlock" class="nested hidden">
          <h4>Handheld Mics / Receivers</h4>
          <div id="handheldContainer" class="stack"></div>
          <div class="actions"><button type="button" id="addHandheld" class="btn secondary">+ Add Handheld Receiver</button></div>
        </div>
        <div id="lapelBlock" class="nested hidden">
          <h4>Lapel Mics / Receivers</h4>
          <div id="lapelContainer" class="stack"></div>
          <div class="actions"><button type="button" id="addLapel" class="btn secondary">+ Add Lapel Receiver</button></div>
        </div>
      </fieldset>

      <fieldset class="card">
        <legend>Speakers</legend>
        <div class="grid grid-cols-3">
          <label>Number of Speaker Types/Sets
            <input type="number" id="speakerCountInput" min="0" value="1" />
          </label>
        </div>
        <div id="speakerContainer" class="stack stack-margin"></div>
        <div class="actions">
          <button type="button" class="btn secondary" id="addSpeaker">+ Add Speaker</button>
        </div>
      </fieldset>

      <fieldset class="card">
        <legend>Displays</legend>
        <div class="grid grid-cols-3">
          <label>Number of Displays
            <input type="number" id="displayCountInput" min="0" value="1" />
          </label>
          <div></div>
          <div class="help clickable" id="displaySizeHelp">
            <span>How to measure diagonal size?</span>
          </div>
        </div>
        <div class="help-dialog hidden" id="displaySizeHelpDialog">
          <div class="help-content">
            <p><strong>Model number is required.</strong> Please also measure the display when possible for accuracy.<br>
            Measure <strong>diagonally from white corner to white corner</strong> across the visible display area.
            If the measurement is unavailable, providing the <strong>model number</strong> ensures the size can be looked up later.</p>
            <button type="button" class="btn secondary" id="closeHelpDisplaySize">Close</button>
          </div>
        </div>
        <div id="displayContainer" class="stack"></div>
        <div class="actions">
          <button type="button" class="btn secondary" id="addDisplay">+ Add Display</button>
        </div>
      </fieldset>

      <fieldset class="card">
        <legend>Other Devices / Inventory</legend>
        <p class="sub">Capture devices not covered above (DSPs, codecs, extenders, switchers, etc.).</p>
        <div id="invContainer" class="stack"></div>
        <div class="actions"><button type="button" class="btn secondary" id="addInv">+ Add Device</button></div>
      </fieldset>

      <fieldset class="card">
        <legend>Technician</legend>
        <p class="sub"><strong>Required:</strong> Provide technician details for audit and follow-up.</p>
        <div class="grid grid-cols-3">
          <label>Date <span class="req">*</span><input name="Tech Date" type="date" value="<?= htmlspecialchars($editRoom['tech_date'] ?? '') ?>" required /></label>
          <label>Name <span class="req">*</span><input name="Technician Name" placeholder="Your name" value="<?= htmlspecialchars($editRoom['technician_name'] ?? '') ?>" required /></label>
          <label>RACF <span class="req">*</span><input name="RACF" placeholder="e.g., abc123" value="<?= htmlspecialchars($editRoom['racf'] ?? '') ?>" required /></label>
          <label class="grid-full">Notes <span class="req">*</span><textarea name="Technician Notes" rows="3" placeholder="Ticket IDs, symptoms, actions taken..." required><?= htmlspecialchars($editRoom['technician_notes'] ?? '') ?></textarea></label>
        </div>
      </fieldset>

      <div class="toolbar">
        <button type="button" id="submitBtn" class="btn">Submit</button>
        <a href="?action=export-json" class="btn" id="downloadJson">Download JSON</a>
        <a href="?action=export-csv" class="btn" id="downloadCsv">Download CSV</a>
        <label class="btn ghost">Load JSON<input type="file" id="loadJson" accept="application/json" /></label>
        <button type="reset" class="btn ghost">Clear Form</button>
        <a href="./assets/index.php" class="btn secondary">View Assets</a>
      </div>

    </form>

    <datalist id="countryList">
      <option value="United States"></option>
      <option value="Canada"></option>
    </datalist>
  </main>

<?php if ($editRoom): ?>
  <script>
    var EDIT_ROOM_DATA = <?= json_encode($editRoom) ?>;
  </script>
<?php endif; ?>
  <script src="js/theme.js"></script>
  <script src="js/photo-upload.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
