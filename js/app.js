// === Conference Room Form – PHP Backend ===
// All DB operations go through server-side PHP (no client-side auth headers)

// ------- Required fields -------
const REQUIRED_FIELDS = ['Country','State/Province','City','Facility','Building','Floor','RoomNameID','Room Type','Microsoft Teams','Tech Date','Technician Name','RACF','Technician Notes'];

// ------- Utility helpers -------
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function download(filename, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type: 'application/octet-stream'})); a.download = filename; a.click(); }
const esc = s => `${s ?? ''}`.replaceAll('"', '""');

// MAC formatter
function normalizeMac(raw) { const hex = (raw || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 12); return hex.match(/.{1,2}/g)?.join(':') || ''; }
function bindMacAutoFormat(input) { const handler = () => { input.value = normalizeMac(input.value); }; input.addEventListener('input', handler); input.addEventListener('blur', handler); input.addEventListener('paste', () => setTimeout(handler, 0)); }

// ------- PHP API helper (no auth headers) -------
function phpPost(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function(r) { return r.json(); }).then(function(j) {
    if (j.success === false) throw new Error(j.error || 'Server error');
    return j;
  });
}

// ------- Repeater builders -------
function touchPanelRow(values) { values = values || {}; const node = el('<div class="row card row-card-compact">' +
  '<label>Type<input name="tp_type" value="' + (values.type || '') + '" placeholder="AMX / Crestron / Extron"/></label>' +
  '<label>Model<input name="tp_model" value="' + (values.model || '') + '" placeholder="MD-1002 / UC-MMX30-T"/></label>' +
  '<label>Serial<input name="tp_serial" value="' + (values.serial || '') + '" placeholder="Serial"/></label>' +
  '<label>MAC<input name="tp_mac" value="' + (values.mac || '') + '" placeholder="4C:26:A7:7D:8A:57" data-mac/></label>' +
  '<label>Location<input name="tp_location" value="' + (values.location || '') + '" placeholder="Wall / Table"/></label>' +
  '<label>IP (Optional)<input name="tp_ip" value="' + (values.ip || '') + '" placeholder="10.x.x.x"/></label>' +
  '<button type="button" class="btn secondary remove">Remove</button>' +
  '</div>'); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function ceilingMicRow(values) { values = values || {}; const node = el('<div class="row card row-card-compact">' +
  '<label>Quantity<input name="cm_qty" type="number" min="1" value="' + (values.qty || 1) + '"/></label>' +
  '<label>Make<input name="cm_make" value="' + (values.make || '') + '"/></label>' +
  '<label>Model<input name="cm_model" value="' + (values.model || '') + '"/></label>' +
  '<label>MAC Address<input name="cm_mac" value="' + (values.mac || '') + '" placeholder="optional" data-mac/></label>' +
  '<label>Serial<input name="cm_sn" value="' + (values.sn || '') + '" placeholder="optional"/></label>' +
  '<button type="button" class="btn secondary remove">Remove</button>' +
  '</div>'); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function handheldRow(values) { values = values || {}; const node = el('<div class="row card row-card-compact">' +
  '<label>Quantity<input name="hh_qty" type="number" min="1" value="' + (values.qty || 1) + '"/></label>' +
  '<label>Receiver Serial<input name="hh_receiver_sn" value="' + (values.receiver_sn || '') + '"/></label>' +
  '<label>Dante?<select name="hh_dante"><option value="">—</option><option' + (values.dante === 'Yes' ? ' selected' : '') + '>Yes</option><option' + (values.dante === 'No' ? ' selected' : '') + '>No</option></select></label>' +
  '<label>Receiver MAC (optional)<input name="hh_mac" value="' + (values.mac || '') + '" placeholder="4C:26:…" data-mac/></label>' +
  '<label>Notes<input name="hh_notes" value="' + (values.notes || '') + '" placeholder="optional"/></label>' +
  '<button type="button" class="btn secondary remove">Remove</button>' +
  '</div>'); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function lapelRow(values) { values = values || {}; const node = el('<div class="row card row-card-compact">' +
  '<label>Quantity<input name="lp_qty" type="number" min="1" value="' + (values.qty || 1) + '"/></label>' +
  '<label>Receiver Serial<input name="lp_receiver_sn" value="' + (values.receiver_sn || '') + '"/></label>' +
  '<label>Dante?<select name="lp_dante"><option value="">—</option><option' + (values.dante === 'Yes' ? ' selected' : '') + '>Yes</option><option' + (values.dante === 'No' ? ' selected' : '') + '>No</option></select></label>' +
  '<label>Receiver MAC (optional)<input name="lp_mac" value="' + (values.mac || '') + '" placeholder="4C:26:…" data-mac/></label>' +
  '<label>Notes<input name="lp_notes" value="' + (values.notes || '') + '" placeholder="optional"/></label>' +
  '<button type="button" class="btn secondary remove">Remove</button>' +
  '</div>'); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function speakerRow(values) { values = values || {}; return el('<div class="row card row-card-compact">' +
  '<label>Speaker Type<select name="spk_type"><option value="">— Select —</option>' +
  '<option' + (values.type === 'Ceiling' ? ' selected' : '') + '>Ceiling</option>' +
  '<option' + (values.type === 'Sound Bar' ? ' selected' : '') + '>Sound Bar</option>' +
  '<option' + (values.type === 'Wall' ? ' selected' : '') + '>Wall</option>' +
  '<option' + (values.type === 'Pendant' ? ' selected' : '') + '>Pendant</option>' +
  '<option' + (values.type === 'Tabletop' ? ' selected' : '') + '>Tabletop</option>' +
  '<option' + (values.type === 'Line Array' ? ' selected' : '') + '>Line Array</option>' +
  '<option' + (values.type === 'Column' ? ' selected' : '') + '>Column</option>' +
  '</select></label>' +
  '<label>Make<input name="spk_make" value="' + (values.make || '') + '"/></label>' +
  '<label>Model<input name="spk_model" value="' + (values.model || '') + '"/></label>' +
  '<label>Quantity<input name="spk_qty" type="number" min="1" value="' + (values.qty || '') + '"/></label>' +
  '<div></div><div></div>' +
  '<button type="button" class="btn secondary remove">Remove</button>' +
  '</div>'); }

function displayRow(values) { values = values || {}; const node = el('<div class="row card row-card-compact">' +
  '<label>Type<select name="disp_type"><option value="">— Select —</option>' +
  '<option' + (values.type === 'Monitor' ? ' selected' : '') + '>Monitor</option>' +
  '<option' + (values.type === 'Projector' ? ' selected' : '') + '>Projector</option>' +
  '<option' + (values.type === 'Video Wall' ? ' selected' : '') + '>Video Wall</option>' +
  '</select></label>' +
  '<label>Make<input name="disp_make" value="' + (values.make || '') + '"/></label>' +
  '<label>Model<input name="disp_model" value="' + (values.model || '') + '"/></label>' +
  '<label>Monitor / Projector – Size<input name="disp_size" value="' + (values.size || '') + '" placeholder="55"/></label>' +
  '<label>Barcode<input name="disp_barcode" value="' + (values.barcode || '') + '"/></label>' +
  '<label>Serial<input name="disp_sn" value="' + (values.sn || '') + '"/></label>' +
  '<label>MAC<input name="disp_mac" value="' + (values.mac || '') + '" placeholder="4C:26:…" data-mac/></label>' +
  '<label>IP<input name="disp_ip" value="' + (values.ip || '') + '"/></label>' +
  '<label>Manufacture Date<input name="disp_mfg" type="date" value="' + (values.mfg || '') + '"/></label>' +
  '<button type="button" class="btn secondary remove">Remove</button>' +
  '</div>'); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function inventoryRow(values) { values = values || {}; return el('<div class="row row-compact">' +
  '<input name="inv_type" placeholder="DSP / Codec / Switch / Extender" value="' + (values['Device Type'] || values.device_type || '') + '" />' +
  '<input name="inv_make" placeholder="AMX / Biamp / QSC / Shure" value="' + (values['Device Make'] || values.make || '') + '" />' +
  '<input name="inv_model" placeholder="Model" value="' + (values['Device Model'] || values.model || '') + '" />' +
  '<input name="inv_loc" placeholder="Rack / Table / Ceiling" value="' + (values['Location'] || values.location || '') + '" />' +
  '<input name="inv_barcode" placeholder="Asset Tag" value="' + (values['Barcode'] || values.barcode || '') + '" />' +
  '<input name="inv_sn" placeholder="Serial" value="' + (values['Serial Number'] || values.serial || '') + '" />' +
  '<button type="button" class="btn secondary remove">\u2715</button>' +
  '</div>'); }

// ------- DOM refs -------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const form = $('#roomForm');
const tpContainer = $('#tpContainer');
const ceilingBlock = $('#ceilingBlock');
const handheldBlock = $('#handheldBlock');
const lapelBlock = $('#lapelBlock');
const hasCeiling = $('#hasCeilingMics');
const hasHandheld = $('#hasHandheldMics');
const hasLapel = $('#hasLapelMics');
const ceilingContainer = $('#ceilingContainer');
const handheldContainer = $('#handheldContainer');
const lapelContainer = $('#lapelContainer');
const speakerContainer = $('#speakerContainer');
const speakerCountInput = $('#speakerCountInput');
const displayContainer = $('#displayContainer');
const displayCountInput = $('#displayCountInput');
const invContainer = document.getElementById('invContainer');

// ------- Add/Remove binding -------
function bindRemove(row) { row.querySelector('.remove')?.addEventListener('click', () => { row.remove(); syncDisplayCountFromRows(); syncSpeakerCountFromRows(); }); }

// ------- Count sync -------
function syncSpeakerCountToRows() { const desired = Number(speakerCountInput?.value || 0); const current = $$('#speakerContainer .row').length; if (desired > current) { for (let i = current; i < desired; i++) { const r = speakerRow(); bindRemove(r); speakerContainer.appendChild(r); } } else if (desired < current) { const rows = $$('#speakerContainer .row'); for (let i = current - 1; i >= desired; i--) rows[i].remove(); } }
function syncSpeakerCountFromRows() { if (speakerCountInput) speakerCountInput.value = String($$('#speakerContainer .row').length); }
function syncDisplayCountToRows() { const desired = Number(displayCountInput?.value || 0); const current = $$('#displayContainer .row').length; if (desired > current) { for (let i = current; i < desired; i++) { const r = displayRow(); bindRemove(r); displayContainer.appendChild(r); } } else if (desired < current) { const rows = $$('#displayContainer .row'); for (let i = current - 1; i >= desired; i--) rows[i].remove(); } }
function syncDisplayCountFromRows() { if (displayCountInput) displayCountInput.value = String($$('#displayContainer .row').length); }

// ------- Wire UI events -------
$('#addTp')?.addEventListener('click', () => { const r = touchPanelRow(); bindRemove(r); tpContainer.appendChild(r); });
$('#addCeiling')?.addEventListener('click', () => { const r = ceilingMicRow(); bindRemove(r); ceilingContainer.appendChild(r); });
$('#addHandheld')?.addEventListener('click', () => { const r = handheldRow(); bindRemove(r); handheldContainer.appendChild(r); });
$('#addLapel')?.addEventListener('click', () => { const r = lapelRow(); bindRemove(r); lapelContainer.appendChild(r); });
$('#addSpeaker')?.addEventListener('click', () => { const r = speakerRow(); bindRemove(r); speakerContainer.appendChild(r); syncSpeakerCountFromRows(); });
speakerCountInput?.addEventListener('input', syncSpeakerCountToRows);
$('#addDisplay')?.addEventListener('click', () => { const r = displayRow(); bindRemove(r); displayContainer.appendChild(r); syncDisplayCountFromRows(); });
displayCountInput?.addEventListener('input', syncDisplayCountToRows);
$('#addInv')?.addEventListener('click', () => { const r = inventoryRow(); bindRemove(r); invContainer.appendChild(r); });

hasCeiling?.addEventListener('change', () => { ceilingBlock.classList.toggle('hidden', !hasCeiling.checked); if (hasCeiling.checked && !ceilingContainer.children.length) $('#addCeiling').click(); });
hasHandheld?.addEventListener('change', () => { handheldBlock.classList.toggle('hidden', !hasHandheld.checked); if (hasHandheld.checked && !handheldContainer.children.length) $('#addHandheld').click(); });
hasLapel?.addEventListener('change', () => { lapelBlock.classList.toggle('hidden', !hasLapel.checked); if (hasLapel.checked && !lapelContainer.children.length) $('#addLapel').click(); });

// ------- Collectors -------
function collectPanels() { return $$('#tpContainer .row').map(r => ({ type: r.querySelector('[name="tp_type"]').value, model: r.querySelector('[name="tp_model"]').value, serial: r.querySelector('[name="tp_serial"]').value, mac: r.querySelector('[name="tp_mac"]').value, location: r.querySelector('[name="tp_location"]').value, ip: r.querySelector('[name="tp_ip"]').value })); }
function collectCeiling() { return $$('#ceilingContainer .row').map(r => ({ qty: Number(r.querySelector('[name="cm_qty"]').value || 0), make: r.querySelector('[name="cm_make"]').value, model: r.querySelector('[name="cm_model"]').value, mac: r.querySelector('[name="cm_mac"]').value, sn: r.querySelector('[name="cm_sn"]').value })); }
function collectHandheld() { return $$('#handheldContainer .row').map(r => ({ qty: Number(r.querySelector('[name="hh_qty"]').value || 0), receiver_sn: r.querySelector('[name="hh_receiver_sn"]').value, dante: r.querySelector('[name="hh_dante"]').value, mac: r.querySelector('[name="hh_mac"]').value, notes: r.querySelector('[name="hh_notes"]').value })); }
function collectLapel() { return $$('#lapelContainer .row').map(r => ({ qty: Number(r.querySelector('[name="lp_qty"]').value || 0), receiver_sn: r.querySelector('[name="lp_receiver_sn"]').value, dante: r.querySelector('[name="lp_dante"]').value, mac: r.querySelector('[name="lp_mac"]').value, notes: r.querySelector('[name="lp_notes"]').value })); }
function collectSpeakers() { return $$('#speakerContainer .row').map(r => ({ type: r.querySelector('[name="spk_type"]').value, make: r.querySelector('[name="spk_make"]').value, model: r.querySelector('[name="spk_model"]').value, qty: r.querySelector('[name="spk_qty"]').value })); }
function collectDisplays() { return $$('#displayContainer .row').map(r => ({ type: r.querySelector('[name="disp_type"]').value, make: r.querySelector('[name="disp_make"]').value, model: r.querySelector('[name="disp_model"]').value, size: r.querySelector('[name="disp_size"]').value, barcode: r.querySelector('[name="disp_barcode"]').value, sn: r.querySelector('[name="disp_sn"]').value, mac: r.querySelector('[name="disp_mac"]').value, ip: r.querySelector('[name="disp_ip"]').value, mfg: r.querySelector('[name="disp_mfg"]').value })); }
function collectInventory() { return $$('#invContainer .row').map(r => ({ 'Device Type': r.querySelector('[name="inv_type"]').value, 'Device Make': r.querySelector('[name="inv_make"]').value, 'Device Model': r.querySelector('[name="inv_model"]').value, 'Location': r.querySelector('[name="inv_loc"]').value, 'Barcode': r.querySelector('[name="inv_barcode"]').value, 'Serial Number': r.querySelector('[name="inv_sn"]').value })); }

// ------- Form serializer -------
function formToObject(form) {
  const base = {};
  new FormData(form).forEach(function(v, k) { if (k !== 'RoomPhotos') base[k] = v; });
  base.TouchPanels = collectPanels();
  base.CeilingMics = hasCeiling?.checked ? collectCeiling() : [];
  base.HandheldMics = hasHandheld?.checked ? collectHandheld() : [];
  base.LapelMics = hasLapel?.checked ? collectLapel() : [];
  base.Speakers = collectSpeakers();
  base.Displays = collectDisplays();
  base.Inventory = collectInventory();
  return base;
}

function validateRequired(data) {
  const errs = [];
  if (!data['Country']) errs.push('Country is required');
  if (!data['Facility']) errs.push('Facility is required');
  if (!data['RoomNameID']) errs.push('Room Name / ID is required');
  return errs;
}

// ------- Submit -------
async function handleSubmit() {
  try {
    const data = formToObject(form);
    const errs = validateRequired(data);
    if (errs.length) throw new Error('Validation failed:\n- ' + errs.join('\n- '));

    // Upload photos first (via photo-upload.js — uses FormData, no auth headers)
    if (typeof uploadPhotosToServer === 'function') {
      try { await uploadPhotosToServer(data['RoomNameID']); }
      catch (e) { console.warn('Photo upload warning:', e); }
    }

    // Submit to PHP
    const editId = document.getElementById('editingRoomId')?.value || '';
    data._action = 'submit';
    if (editId) data._editId = parseInt(editId);

    const result = await phpPost(window.location.pathname, data);
    alert(result.message + (result.id ? '\nRecord ID: ' + result.id : ''));

    if (editId) {
      window.location.href = './assets/room.php?id=' + result.id;
    }
  } catch (e) {
    alert('Submit failed: ' + (e?.message || e));
  }
}
$('#submitBtn')?.addEventListener('click', handleSubmit);

// ------- Load JSON file into form -------
$('#loadJson')?.addEventListener('change', function(e) {
  var file = e.target.files?.[0];
  if (!file) return;
  file.text().then(function(text) {
    try {
      var data = JSON.parse(text);

      // If it's an array (DB export), import via PHP
      if (Array.isArray(data)) {
        phpPost(window.location.pathname, { _action: 'import-raw', records: data })
          .then(function(j) { alert('Imported ' + (j.count || 0) + ' records'); })
          .catch(function(err) { alert('Import failed: ' + err.message); });
        e.target.value = '';
        return;
      }

      // Single room JSON — populate form
      if (data.Date && !data['Tech Date']) data['Tech Date'] = data.Date;
      if (data.Tech && !data['Technician Name']) data['Technician Name'] = data.Tech;
      if (data.Notes && !data['Technician Notes']) data['Technician Notes'] = data.Notes;

      Object.entries(data).forEach(function(kv) {
        if (['TouchPanels','CeilingMics','HandheldMics','LapelMics','Speakers','Displays','Inventory','Room Photos'].includes(kv[0])) return;
        var input = form.querySelector('[name="' + CSS.escape(kv[0]) + '"]');
        if (input) input.value = typeof kv[1] === 'string' ? kv[1] : (kv[1] ?? '');
      });

      tpContainer.innerHTML = '';
      (data.TouchPanels || []).forEach(function(i) { var r = touchPanelRow(i); bindRemove(r); tpContainer.appendChild(r); });

      hasCeiling && (hasCeiling.checked = (data.CeilingMics || []).length > 0);
      hasHandheld && (hasHandheld.checked = (data.HandheldMics || []).length > 0);
      hasLapel && (hasLapel.checked = (data.LapelMics || []).length > 0);
      ceilingBlock && ceilingBlock.classList.toggle('hidden', !hasCeiling?.checked);
      handheldBlock && handheldBlock.classList.toggle('hidden', !hasHandheld?.checked);
      lapelBlock && lapelBlock.classList.toggle('hidden', !hasLapel?.checked);

      ceilingContainer.innerHTML = '';
      (data.CeilingMics || []).forEach(function(i) { var r = ceilingMicRow(i); bindRemove(r); ceilingContainer.appendChild(r); });
      handheldContainer.innerHTML = '';
      (data.HandheldMics || []).forEach(function(i) { var r = handheldRow(i); bindRemove(r); handheldContainer.appendChild(r); });
      lapelContainer.innerHTML = '';
      (data.LapelMics || []).forEach(function(i) { var r = lapelRow(i); bindRemove(r); lapelContainer.appendChild(r); });

      speakerContainer.innerHTML = '';
      (data.Speakers || []).forEach(function(i) { var r = speakerRow(i); bindRemove(r); speakerContainer.appendChild(r); });
      syncSpeakerCountFromRows();

      displayContainer.innerHTML = '';
      (data.Displays || []).forEach(function(i) { var r = displayRow(i); bindRemove(r); displayContainer.appendChild(r); });
      syncDisplayCountFromRows();

      invContainer.innerHTML = '';
      (data.Inventory || []).forEach(function(i) { var r = inventoryRow(i); bindRemove(r); invContainer.appendChild(r); });
    } catch (err) {
      alert('Load failed: ' + (err?.message || err));
    }
    e.target.value = '';
  });
});

// ------- Seed default rows -------
(function() { var r = touchPanelRow(); bindRemove(r); tpContainer?.appendChild(r); })();
(function() { var r = speakerRow(); bindRemove(r); speakerContainer?.appendChild(r); syncSpeakerCountFromRows(); })();
(function() { var r = displayRow(); bindRemove(r); displayContainer?.appendChild(r); syncDisplayCountFromRows(); })();
(function() { var r = inventoryRow(); bindRemove(r); invContainer?.appendChild(r); })();

// ------- Load edit data from PHP-embedded JSON -------
(function() {
  if (typeof EDIT_ROOM_DATA === 'undefined') return;
  var room = EDIT_ROOM_DATA;

  // Clear default rows
  tpContainer.innerHTML = '';
  speakerContainer.innerHTML = '';
  displayContainer.innerHTML = '';
  invContainer.innerHTML = '';
  ceilingContainer.innerHTML = '';
  handheldContainer.innerHTML = '';
  lapelContainer.innerHTML = '';

  // Map DB columns → form field names
  var fieldMap = {
    country: 'Country', state: 'State/Province', city: 'City',
    facility: 'Facility', building: 'Building', floor: 'Floor',
    room_name_id: 'RoomNameID', room_type: 'Room Type', capacity: 'Capacity',
    microsoft_teams: 'Microsoft Teams', room_tech: 'Room Tech',
    input_types: 'Input Type', room_depth: 'Room Depth', room_width: 'Room Width',
    room_height: 'Room Height', tech_date: 'Tech Date',
    technician_name: 'Technician Name', racf: 'RACF', technician_notes: 'Technician Notes'
  };

  Object.entries(fieldMap).forEach(function(kv) {
    var val = room[kv[0]];
    if (val === null || val === undefined) return;
    var input = form.querySelector('[name="' + CSS.escape(kv[1]) + '"]');
    if (input) input.value = String(val);
  });

  function parseJson(v) { if (!v) return []; try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return []; } }

  var tp = parseJson(room.touch_panels);
  tp.forEach(function(i) { var r = touchPanelRow(i); bindRemove(r); tpContainer.appendChild(r); });
  if (!tp.length) { var r = touchPanelRow(); bindRemove(r); tpContainer.appendChild(r); }

  var cm = parseJson(room.ceiling_mics);
  var hh = parseJson(room.handheld_mics);
  var lp = parseJson(room.lapel_mics);
  hasCeiling && (hasCeiling.checked = cm.length > 0);
  hasHandheld && (hasHandheld.checked = hh.length > 0);
  hasLapel && (hasLapel.checked = lp.length > 0);
  ceilingBlock && ceilingBlock.classList.toggle('hidden', !cm.length);
  handheldBlock && handheldBlock.classList.toggle('hidden', !hh.length);
  lapelBlock && lapelBlock.classList.toggle('hidden', !lp.length);
  cm.forEach(function(i) { var r = ceilingMicRow(i); bindRemove(r); ceilingContainer.appendChild(r); });
  hh.forEach(function(i) { var r = handheldRow(i); bindRemove(r); handheldContainer.appendChild(r); });
  lp.forEach(function(i) { var r = lapelRow(i); bindRemove(r); lapelContainer.appendChild(r); });

  var sp = parseJson(room.speakers);
  sp.forEach(function(i) { var r = speakerRow(i); bindRemove(r); speakerContainer.appendChild(r); });
  if (!sp.length) { var r = speakerRow(); bindRemove(r); speakerContainer.appendChild(r); }
  syncSpeakerCountFromRows();

  var di = parseJson(room.displays);
  di.forEach(function(i) { var r = displayRow(i); bindRemove(r); displayContainer.appendChild(r); });
  if (!di.length) { var r = displayRow(); bindRemove(r); displayContainer.appendChild(r); }
  syncDisplayCountFromRows();

  var inv = parseJson(room.inventory);
  inv.forEach(function(i) { var r = inventoryRow(i); bindRemove(r); invContainer.appendChild(r); });
  if (!inv.length) { var r = inventoryRow(); bindRemove(r); invContainer.appendChild(r); }
})();

// ------- Help dialog -------
$('#displaySizeHelp')?.addEventListener('click', () => { $('#displaySizeHelpDialog')?.classList.remove('hidden'); });
$('#closeHelpDisplaySize')?.addEventListener('click', () => { $('#displaySizeHelpDialog')?.classList.add('hidden'); });
