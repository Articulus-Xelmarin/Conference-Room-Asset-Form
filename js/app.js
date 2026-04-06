// ------- Required fields -------
const REQUIRED_FIELDS=[ 'Country','State/Province','City','Facility','Building','Floor','RoomNameID','Room Type','Microsoft Teams', 'Tech Date','Technician Name','RACF','Technician Notes' ];

// === Conference Room Form – v0.2.1 ===
// Adds: MariaDB or Local IndexedDB storage options

// ------- Storage Configuration -------
const STORAGE_KEY='formStorageConfig';
const DB_NAME='ConferenceRoomDB';
const DB_VERSION=1;
const DB_STORE='rooms';

function getConfig(){ try{ const cfg=localStorage.getItem(STORAGE_KEY); return cfg?JSON.parse(cfg):{storageType:'remote',apiUrl:'api.php',tableName:'conference_rooms',dbUsername:'conf_user',dbPassword:'JHSdfuy45klaye45'}; }catch{ return {storageType:'remote',apiUrl:'api.php',tableName:'conference_rooms',dbUsername:'conf_user',dbPassword:'JHSdfuy45klaye45'}; } }

// Database functions now use sqlite-db.js with SQLite backend
// See js/sqlite-db.js for: initDatabase, insertRoom, getAllRooms, deleteRoom, clearAllRooms, exportDatabase, importDatabase

// ------- Utility helpers -------
function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }
function download(filename, text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/octet-stream'})); a.download=filename; a.click(); }
const esc=s=>`${s??''}`.replaceAll('"','""');

// MAC formatter: auto‑insert colons, uppercase, max 12 hex
function normalizeMac(raw){ const hex=(raw||'').replace(/[^0-9a-fA-F]/g,'').toUpperCase().slice(0,12); return hex.match(/.{1,2}/g)?.join(':')||''; }
function bindMacAutoFormat(input){ const handler=()=>{ input.value=normalizeMac(input.value);}; input.addEventListener('input',handler); input.addEventListener('blur',handler); input.addEventListener('paste',()=>setTimeout(handler,0)); }

// File to base64 converter
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload photos to server
async function uploadPhotosToServer(roomName) {
  const photoFiles = Array.from(document.querySelector('[name="RoomPhotos"]')?.files || []);
  if (photoFiles.length === 0) return;

  const formData = new FormData();
  formData.append('roomName', roomName);
  
  for (let i = 0; i < photoFiles.length; i++) {
    formData.append('photos[]', photoFiles[i]);
  }
  
  const response = await fetch('upload-photos.php', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('Photos uploaded successfully:', result);
}

// ------- Repeater builders -------
function touchPanelRow(values={}){ const node=el(`<div class="row card row-card-compact">
  <label>Type<input name="tp_type" value="${values.type||''}" placeholder="AMX / Crestron / Extron"/></label>
  <label>Model<input name="tp_model" value="${values.model||''}" placeholder="MD-1002 / UC-MMX30-T"/></label>
  <label>Serial<input name="tp_serial" value="${values.serial||''}" placeholder="Serial"/></label>
  <label>MAC<input name="tp_mac" value="${values.mac||''}" placeholder="4C:26:A7:7D:8A:57" data-mac/></label>
  <label>Location<input name="tp_location" value="${values.location||''}" placeholder="Wall / Table"/></label>
  <label>IP (Optional)<input name="tp_ip" value="${values.ip||''}" placeholder="10.x.x.x"/></label>
  <button type="button" class="btn secondary remove">Remove</button>
</div>`); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function ceilingMicRow(values={}){ const node=el(`<div class="row card row-card-compact">
  <label>Quantity<input name="cm_qty" type="number" min="1" value="${values.qty||1}"/></label>
  <label>Make<input name="cm_make" value="${values.make||''}"/></label>
  <label>Model<input name="cm_model" value="${values.model||''}"/></label>
  <label>MAC Address<input name="cm_mac" value="${values.mac||''}" placeholder="optional" data-mac/></label>
  <label>Serial<input name="cm_sn" value="${values.sn||''}" placeholder="optional"/></label>
  <button type="button" class="btn secondary remove">Remove</button>
</div>`); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function handheldRow(values={}){ const node=el(`<div class="row card row-card-compact">
  <label>Quantity<input name="hh_qty" type="number" min="1" value="${values.qty||1}"/></label>
  <label>Receiver Serial<input name="hh_receiver_sn" value="${values.receiver_sn||''}"/></label>
  <label>Dante?<n-select><select name="hh_dante"><option value="">—</option><option ${values.dante==='Yes'?'selected':''}>Yes</option><option ${values.dante==='No'?'selected':''}>No</option></select></n-select></label>
  <label>Receiver MAC (optional)<input name="hh_mac" value="${values.mac||''}" placeholder="4C:26:…" data-mac/></label>
  <label>Notes<input name="hh_notes" value="${values.notes||''}" placeholder="optional"/></label>
  <button type="button" class="btn secondary remove">Remove</button>
</div>`); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function lapelRow(values={}){ const node=el(`<div class="row card row-card-compact">
  <label>Quantity<input name="lp_qty" type="number" min="1" value="${values.qty||1}"/></label>
  <label>Receiver Serial<input name="lp_receiver_sn" value="${values.receiver_sn||''}"/></label>
  <label>Dante?<n-select><select name="lp_dante"><option value="">—</option><option ${values.dante==='Yes'?'selected':''}>Yes</option><option ${values.dante==='No'?'selected':''}>No</option></select></n-select></label>
  <label>Receiver MAC (optional)<input name="lp_mac" value="${values.mac||''}" placeholder="4C:26:…" data-mac/></label>
  <label>Notes<input name="lp_notes" value="${values.notes||''}" placeholder="optional"/></label>
  <button type="button" class="btn secondary remove">Remove</button>
</div>`); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

function speakerRow(values={}){ const node=el(`<div class="row card row-card-compact">
  <label>Speaker Type
    <select name="spk_type">
      <option value="">— Select —</option>
      <option ${values.type==='Ceiling'?'selected':''}>Ceiling</option>
      <option ${values.type==='Sound Bar'?'selected':''}>Sound Bar</option>
      <option ${values.type==='Wall'?'selected':''}>Wall</option>
      <option ${values.type==='Pendant'?'selected':''}>Pendant</option>
      <option ${values.type==='Tabletop'?'selected':''}>Tabletop</option>
      <option ${values.type==='Line Array'?'selected':''}>Line Array</option>
      <option ${values.type==='Column'?'selected':''}>Column</option>
    </select>
  </label>
  <label>Make<input name="spk_make" value="${values.make||''}"/></label>
  <label>Model<input name="spk_model" value="${values.model||''}"/></label>
  <label>Quantity<input name="spk_qty" type="number" min="1" value="${values.qty||''}"/></label>
  <div></div><div></div>
  <button type="button" class="btn secondary remove">Remove</button>
</div>`); return node; }

function displayRow(values={}){ const node=el(`<div class="row card row-card-compact">
  <label>Type
    <select name="disp_type">
      <option value="">— Select —</option>
      <option ${values.type==='Monitor'?'selected':''}>Monitor</option>
      <option ${values.type==='Projector'?'selected':''}>Projector</option>
      <option ${values.type==='Video Wall'?'selected':''}>Video Wall</option>
    </select>
  </label>
  <label>Make<input name="disp_make" value="${values.make||''}"/></label>
  <label>Model<input name="disp_model" value="${values.model||''}"/></label>
  <label>Monitor / Projector – Size<input name="disp_size" value="${values.size||''}" placeholder="55"/></label>
  <label>Barcode<input name="disp_barcode" value="${values.barcode||''}"/></label>
  <label>Serial<input name="disp_sn" value="${values.sn||''}"/></label>
  <label>MAC<input name="disp_mac" value="${values.mac||''}" placeholder="4C:26:…" data-mac/></label>
  <label>IP<input name="disp_ip" value="${values.ip||''}"/></label>
  <label>Manufacture Date<input name="disp_mfg" type="date" value="${values.mfg||''}"/></label>
  <button type="button" class="btn secondary remove">Remove</button>
</div>`); node.querySelectorAll('[data-mac]').forEach(bindMacAutoFormat); return node; }

// ------- DOM refs & helpers -------
const $ = (sel)=>document.querySelector(sel); const $$=(sel)=>Array.from(document.querySelectorAll(sel));
const form=$('#roomForm');
const tpContainer=$('#tpContainer');
const addTpBtn=$('#addTp');
const ceilingBlock=$('#ceilingBlock');
const handheldBlock=$('#handheldBlock');
const lapelBlock=$('#lapelBlock');
const hasCeiling=$('#hasCeilingMics');
const hasHandheld=$('#hasHandheldMics');
const hasLapel=$('#hasLapelMics');
const addCeilingBtn=$('#addCeiling');
const addHandheldBtn=$('#addHandheld');
const addLapelBtn=$('#addLapel');
const ceilingContainer=$('#ceilingContainer');
const handheldContainer=$('#handheldContainer');
const lapelContainer=$('#lapelContainer');

const speakerContainer=$('#speakerContainer');
const speakerCountInput=$('#speakerCountInput');

const displayContainer=$('#displayContainer');
const displayCountInput=$('#displayCountInput');

// ------- Add/Remove binding -------
function bindRemove(row){ row.querySelector('.remove')?.addEventListener('click', ()=>{ row.remove(); syncDisplayCountFromRows(); syncSpeakerCountFromRows(); }); }

// ------- Speakers & Displays count synchronization -------
function syncSpeakerCountToRows(){ const desired=Number(speakerCountInput?.value||0); const current=$$('#speakerContainer .row').length; if(desired>current){ for(let i=current;i<desired;i++){ const r=speakerRow(); bindRemove(r); speakerContainer.appendChild(r);} } else if(desired<current){ const rows=$$('#speakerContainer .row'); for(let i=current-1;i>=desired;i--){ rows[i].remove(); } } }
function syncSpeakerCountFromRows(){ const count=$$('#speakerContainer .row').length; if(speakerCountInput) speakerCountInput.value=String(count); }

function syncDisplayCountToRows(){ const desired=Number(displayCountInput?.value||0); const current=$$('#displayContainer .row').length; if(desired>current){ for(let i=current;i<desired;i++){ const r=displayRow(); bindRemove(r); displayContainer.appendChild(r);} } else if(desired<current){ const rows=$$('#displayContainer .row'); for(let i=current-1;i>=desired;i--){ rows[i].remove(); } } }
function syncDisplayCountFromRows(){ const count=$$('#displayContainer .row').length; if(displayCountInput) displayCountInput.value=String(count); }

// ------- Wire UI events -------
addTpBtn?.addEventListener('click', ()=>{ const r=touchPanelRow(); bindRemove(r); tpContainer.appendChild(r); });
addCeilingBtn?.addEventListener('click', ()=>{ const r=ceilingMicRow(); bindRemove(r); ceilingContainer.appendChild(r); });
addHandheldBtn?.addEventListener('click', ()=>{ const r=handheldRow(); bindRemove(r); handheldContainer.appendChild(r); });
addLapelBtn?.addEventListener('click', ()=>{ const r=lapelRow(); bindRemove(r); lapelContainer.appendChild(r); });

$('#addSpeaker')?.addEventListener('click', ()=>{ const r=speakerRow(); bindRemove(r); speakerContainer.appendChild(r); syncSpeakerCountFromRows(); });
speakerCountInput?.addEventListener('input', syncSpeakerCountToRows);

$('#addDisplay')?.addEventListener('click', ()=>{ const r=displayRow(); bindRemove(r); displayContainer.appendChild(r); syncDisplayCountFromRows(); });
displayCountInput?.addEventListener('input', syncDisplayCountToRows);

hasCeiling?.addEventListener('change', ()=>{ ceilingBlock.classList.toggle('hidden', !hasCeiling.checked); if(hasCeiling.checked && !ceilingContainer.children.length){ addCeilingBtn.click(); }});
hasHandheld?.addEventListener('change', ()=>{ handheldBlock.classList.toggle('hidden', !hasHandheld.checked); if(hasHandheld.checked && !handheldContainer.children.length){ addHandheldBtn.click(); }});
hasLapel?.addEventListener('change', ()=>{ lapelBlock.classList.toggle('hidden', !hasLapel.checked); if(hasLapel.checked && !lapelContainer.children.length){ addLapelBtn.click(); }});

// ------- Collectors -------
function collectPanels(){ return $$('#tpContainer .row').map(r=>({ type:r.querySelector('[name="tp_type"]').value, model:r.querySelector('[name="tp_model"]').value, serial:r.querySelector('[name="tp_serial"]').value, mac:r.querySelector('[name="tp_mac"]').value, location:r.querySelector('[name="tp_location"]').value, ip:r.querySelector('[name="tp_ip"]').value })); }
function collectCeiling(){ return $$('#ceilingContainer .row').map(r=>({ qty:Number(r.querySelector('[name="cm_qty"]').value||0), make:r.querySelector('[name="cm_make"]').value, model:r.querySelector('[name="cm_model"]').value, mac:r.querySelector('[name="cm_mac"]').value, sn:r.querySelector('[name="cm_sn"]').value })); }
function collectHandheld(){ return $$('#handheldContainer .row').map(r=>({ qty:Number(r.querySelector('[name="hh_qty"]').value||0), receiver_sn:r.querySelector('[name="hh_receiver_sn"]').value, dante:r.querySelector('[name="hh_dante"]').value, mac:r.querySelector('[name="hh_mac"]').value, notes:r.querySelector('[name="hh_notes"]').value })); }
function collectLapel(){ return $$('#lapelContainer .row').map(r=>({ qty:Number(r.querySelector('[name="lp_qty"]').value||0), receiver_sn:r.querySelector('[name="lp_receiver_sn"]').value, dante:r.querySelector('[name="lp_dante"]').value, mac:r.querySelector('[name="lp_mac"]').value, notes:r.querySelector('[name="lp_notes"]').value })); }
function collectSpeakers(){ return $$('#speakerContainer .row').map(r=>({ type:r.querySelector('[name="spk_type"]').value, make:r.querySelector('[name="spk_make"]').value, model:r.querySelector('[name="spk_model"]').value, qty:r.querySelector('[name="spk_qty"]').value })); }
function collectDisplays(){ return $$('#displayContainer .row').map(r=>({ type:r.querySelector('[name="disp_type"]').value, make:r.querySelector('[name="disp_make"]').value, model:r.querySelector('[name="disp_model"]').value, size:r.querySelector('[name="disp_size"]').value, barcode:r.querySelector('[name="disp_barcode"]').value, sn:r.querySelector('[name="disp_sn"]').value, mac:r.querySelector('[name="disp_mac"]').value, ip:r.querySelector('[name="disp_ip"]').value, mfg:r.querySelector('[name="disp_mfg"]').value })); }
function collectInventory(){ return $$('#invContainer .row').map(r=>({ 'Device Type':r.querySelector('[name="inv_type"]').value, 'Device Make':r.querySelector('[name="inv_make"]').value, 'Device Model':r.querySelector('[name="inv_model"]').value, 'Location':r.querySelector('[name="inv_loc"]').value, 'Barcode':r.querySelector('[name="inv_barcode"]').value, 'Serial Number':r.querySelector('[name="inv_sn"]').value })); }
function semijoin(arr,key){ return arr.map(o=>o[key]).filter(Boolean).join('; '); }

// ------- Serialize & Validate -------
async function formToObject(form){
  const base={}; new FormData(form).forEach((v,k)=>{ 
    // Skip file objects directly in the standard serialize so we can handle them manually
    if(k !== 'RoomPhotos') { base[k]=v; }
  });
  const touchPanels=collectPanels(); const ceiling=hasCeiling?.checked?collectCeiling():[]; const handheld=hasHandheld?.checked?collectHandheld():[]; const lapel=hasLapel?.checked?collectLapel():[]; const speakers=collectSpeakers(); const displays=collectDisplays(); const inventory=collectInventory();
  const ceilingQty=ceiling.reduce((a,b)=>a+(b.qty||0),0); const handheldQty=handheld.reduce((a,b)=>a+(b.qty||0),0); const lapelQty=lapel.reduce((a,b)=>a+(b.qty||0),0);
  const handheldDante=handheld.some(i=>i.dante==='Yes')?'Yes':(handheld.length?'No':''); const lapelDante=lapel.some(i=>i.dante==='Yes')?'Yes':(lapel.length?'No':'');
  
  // Collect photos as base64
  const photoFiles = Array.from(document.querySelector('[name="RoomPhotos"]')?.files || []);
  const photos = [];
  for (const file of photoFiles) {
    const base64 = await fileToBase64(file);
    photos.push({ name: file.name, data: base64 });
  }

  return { ...base,
    'Room Photos': photoFiles.map(f => f.name).join('; '),
    photos: photos,
    TouchPanels:touchPanels, CeilingMics:ceiling, HandheldMics:handheld, LapelMics:lapel, Speakers:speakers, Displays:displays, Inventory:inventory,
    'Number of Touch Panels':touchPanels.length||'', 'Touch Panel Type':semijoin(touchPanels,'type'), 'Touch Panel Model':semijoin(touchPanels,'model'), 'Touch Panel Serial Number':semijoin(touchPanels,'serial'), 'Touch Panel Location':semijoin(touchPanels,'location'), 'Touch Panel MAC Address':semijoin(touchPanels,'mac'), 'Touch Panel IP':semijoin(touchPanels,'ip'),
    'Ceiling Mics':ceiling.length?'Yes':'No','How Many Ceiling Mics':ceilingQty||'','Ceiling Mic Make':semijoin(ceiling,'make'),'Ceiling Mic Model':semijoin(ceiling,'model'),'Ceiling Mic Mac Address':semijoin(ceiling,'mac'),'Ceiling Mic Serial Number':semijoin(ceiling,'sn'),
    'Handheld Mics':handheld.length?'Yes':'No','How Many Handheld Mics':handheldQty||'','Handheld Mic Receiver Serial Number':semijoin(handheld,'receiver_sn'),'Is Handheld Mic Reciever Dante':handheldDante,'Handheld Mic Receiver MAC':semijoin(handheld,'mac'),
    'Lapel Mics':lapel.length?'Yes':'No','How Many Lapel Mics':lapelQty||'','Lapel Mic Receiver Serial Number':semijoin(lapel,'receiver_sn'),'Is Lapel Mic Reciever Dante':lapelDante,'Lapel Mic Receiver MAC':semijoin(lapel,'mac'),
    'Number of Speaker Sets':speakers.length||'', 'Speaker Type':semijoin(speakers,'type'), 'Speaker Make':semijoin(speakers,'make'), 'Speaker Model':semijoin(speakers,'model'), 'Speaker Quantity':semijoin(speakers,'qty'),
    'Number of Displays':displays.length||'','Display Type':semijoin(displays,'type'),'Display Make':semijoin(displays,'make'),'Display Model':semijoin(displays,'model'),'Display Size':semijoin(displays,'size'),'Display Barcode':semijoin(displays,'barcode'),'Display Serial Number':semijoin(displays,'sn'),'Display MAC Address':semijoin(displays,'mac'),'Display IP':semijoin(displays,'ip'),'Manufacture Date':semijoin(displays,'mfg')
  };
}

function validateRequired(data){ const errs=[]; if(!data['Country']) errs.push('Country is required'); if(!data['Facility']) errs.push('Facility is required'); if(!data['RoomNameID']) errs.push('Room Name / ID is required'); return errs; }

// ------- Export (CSV/JSON) -------
function toCsv(obj){ const omit=new Set(['TouchPanels','CeilingMics','HandheldMics','LapelMics','Speakers','Displays','Inventory']); const flat=Object.fromEntries(Object.entries(obj).filter(([k])=>!omit.has(k))); const cols=Object.keys(flat); const header=cols.map(c=>`"${esc(c)}"`).join(','); const row=cols.map(c=>`"${esc(flat[c])}"`).join(','); return header+'\n'+row; }

$('#downloadJson')?.addEventListener('click', ()=>{ const data=formToObject(form); const errs=validateRequired(data); if(errs.length){ alert('Please fix:\n- '+errs.join('\n- ')); return; } download(`conference-room_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(data,null,2)); });
$('#downloadCsv')?.addEventListener('click', ()=>{ const data=formToObject(form); const errs=validateRequired(data); if(errs.length){ alert('Please fix:\n- '+errs.join('\n- ')); return; } download(`conference-room_${new Date().toISOString().slice(0,10)}.csv`, toCsv(data)); });

// ------- Load JSON -------
$('#loadJson')?.addEventListener('change', async (e)=>{ try{ const file=e.target.files[0]; if(!file) return; const text=await file.text(); const data=JSON.parse(text);
  // Backward-compat (v0.2.0 -> v0.2.1)
  if(data?.Date && !data['Tech Date']) data['Tech Date']=data.Date;
  if(data?.Tech && !data['Technician Name']) data['Technician Name']=data.Tech;
  if(data?.Notes && !data['Technician Notes']) data['Technician Notes']=data.Notes;
  Object.entries(data).forEach(([k,v])=>{ if(['TouchPanels','CeilingMics','HandheldMics','LapelMics','Speakers','Displays','Inventory', 'Room Photos'].includes(k)) return; const el=form.querySelector(`[name="${CSS.escape(k)}"]`); if(el){ el.value=typeof v==='string'?v:(v??''); }});
  tpContainer.innerHTML=''; (data.TouchPanels||[]).forEach(i=>{ const r=touchPanelRow(i); bindRemove(r); tpContainer.appendChild(r); });
  hasCeiling && (hasCeiling.checked=(data.CeilingMics||[]).length>0 || data['Ceiling Mics']==='Yes');
  hasHandheld && (hasHandheld.checked=(data.HandheldMics||[]).length>0 || data['Handheld Mics']==='Yes');
  hasLapel && (hasLapel.checked=(data.LapelMics||[]).length>0 || data['Lapel Mics']==='Yes');
  ceilingBlock && ceilingBlock.classList.toggle('hidden', !hasCeiling?.checked);
  handheldBlock && handheldBlock.classList.toggle('hidden', !hasHandheld?.checked);
  lapelBlock && lapelBlock.classList.toggle('hidden', !hasLapel?.checked);

  speakerContainer.innerHTML=''; (data.Speakers||[]).forEach(i=>{ const r=speakerRow(i); bindRemove(r); speakerContainer.appendChild(r); });
  syncSpeakerCountFromRows();

  displayContainer.innerHTML=''; (data.Displays||[]).forEach(i=>{ const r=displayRow(i); bindRemove(r); displayContainer.appendChild(r); });
  syncDisplayCountFromRows();

  // Inventory
  const invContainer=document.getElementById('invContainer');
  invContainer.innerHTML=''; (data.Inventory||[]).forEach(i=>{ const row=el(`<div class="row row-compact">
    <input name="inv_type" placeholder="DSP / Codec / Switch / Extender" value="${i['Device Type']||''}" />
    <input name="inv_make" placeholder="AMX / Biamp / QSC / Shure" value="${i['Device Make']||''}" />
    <input name="inv_model" placeholder="Model" value="${i['Device Model']||''}" />
    <input name="inv_loc" placeholder="Rack / Table / Ceiling" value="${i['Location']||''}" />
    <input name="inv_barcode" placeholder="Asset Tag" value="${i['Barcode']||''}" />
    <input name="inv_sn" placeholder="Serial" value="${i['Serial Number']||''}" />
    <button type="button" class="btn secondary remove">✕</button>
  </div>`); invContainer.appendChild(row); bindRemove(row); });

}catch(err){ alert('Load failed: '+(err?.message||err)); } });

// ------- Seed defaults -------
(function(){ const r=touchPanelRow(); bindRemove(r); tpContainer?.appendChild(r); })();
(function(){ const r=speakerRow(); bindRemove(r); speakerContainer?.appendChild(r); syncSpeakerCountFromRows(); })();
(function(){ const r=displayRow(); bindRemove(r); displayContainer?.appendChild(r); syncDisplayCountFromRows(); })();
(function(){ const r=el(`<div class="row row-compact">
  <input name="inv_type" placeholder="DSP / Codec / Switch / Extender" />
  <input name="inv_make" placeholder="AMX / Biamp / QSC / Shure" />
  <input name="inv_model" placeholder="Model" />
  <input name="inv_loc" placeholder="Rack / Table / Ceiling" />
  <input name="inv_barcode" placeholder="Asset Tag" />
  <input name="inv_sn" placeholder="Serial" />
  <button type="button" class="btn secondary remove">✕</button>
</div>`); document.getElementById('invContainer')?.appendChild(r); bindRemove(r); })();
$('#addInv')?.addEventListener('click', ()=>{ const r=el(`<div class="row row-compact">
  <input name="inv_type" placeholder="DSP / Codec / Switch / Extender" />
  <input name="inv_make" placeholder="AMX / Biamp / QSC / Shure" />
  <input name="inv_model" placeholder="Model" />
  <input name="inv_loc" placeholder="Rack / Table / Ceiling" />
  <input name="inv_barcode" placeholder="Asset Tag" />
  <input name="inv_sn" placeholder="Serial" />
  <button type="button" class="btn secondary remove">✕</button>
</div>`); document.getElementById('invContainer')?.appendChild(r); bindRemove(r); });

// ------- Convert database room format to form format -------
function convertRoomToFormData(room) {
  return {
    Country: room.country || '',
    'State/Province': room.state || '',
    City: room.city || '',
    Facility: room.facility || '',
    Building: room.building || '',
    Floor: room.floor || '',
    RoomNameID: room.room_name || '',
    'Room Code': room.room_code || '',
    'Room Type': room.room_type || '',
    Capacity: room.capacity || '',
    'Room Width': room.room_width || '',
    'Room Length': room.room_length || '',
    'Room Height': room.room_height || '',
    'Room Features': room.room_features || '',
    'Technician Name': room.tech_name || '',
    'Tech Date': room.createdAt ? room.createdAt.split('T')[0] : '',
    RACF: room.tacf || '',
    'Technician Notes': room.notes || '',
    TouchPanels: room.touch_panels ? (typeof room.touch_panels === 'string' ? JSON.parse(room.touch_panels) : room.touch_panels) : [],
    CeilingMics: room.ceiling_mics ? (typeof room.ceiling_mics === 'string' ? JSON.parse(room.ceiling_mics) : room.ceiling_mics) : [],
    HandheldMics: room.handheld_mics ? (typeof room.handheld_mics === 'string' ? JSON.parse(room.handheld_mics) : room.handheld_mics) : [],
    LapelMics: room.lapel_mics ? (typeof room.lapel_mics === 'string' ? JSON.parse(room.lapel_mics) : room.lapel_mics) : [],
    Speakers: room.speakers ? (typeof room.speakers === 'string' ? JSON.parse(room.speakers) : room.speakers) : [],
    Displays: room.displays ? (typeof room.displays === 'string' ? JSON.parse(room.displays) : room.displays) : [],
    Inventory: room.inventory ? (typeof room.inventory === 'string' ? JSON.parse(room.inventory) : room.inventory) : []
  };
}

// ------- Load editing room from sessionStorage or database -------
(async function(){
  const editingRoom = sessionStorage.getItem('editingRoom');
  const editingRoomId = sessionStorage.getItem('editingRoomId');
  
  // If only room ID is stored, fetch from database
  let data = null;
  if (editingRoomId && !editingRoom) {
    try {
      await ensureDatabaseReady();
      const allRooms = getAllRooms();
      const room = allRooms.find(r => r.id === parseInt(editingRoomId));
      if (room) {
        // Convert database format to form format
        data = convertRoomToFormData(room);
        sessionStorage.setItem('editingRoom', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching room from database:', err);
    }
  } else if (editingRoom) {
    try {
      data = JSON.parse(editingRoom);
    } catch (err) {
      console.error('Error parsing editingRoom:', err);
    }
  }
  
  if (data) {
    try {
      
      // Set form title
      const titleEl = document.querySelector('h1');
      if (titleEl) titleEl.textContent = 'Edit Room';
      
      // Clear default rows
      tpContainer.innerHTML = '';
      speakerContainer.innerHTML = '';
      displayContainer.innerHTML = '';
      document.getElementById('invContainer').innerHTML = '';
      ceilingContainer.innerHTML = '';
      handheldContainer.innerHTML = '';
      lapelContainer.innerHTML = '';
      
      // Load basic fields
      Object.entries(data).forEach(([k, v]) => {
        if (!['TouchPanels', 'CeilingMics', 'HandheldMics', 'LapelMics', 'Speakers', 'Displays', 'Inventory'].includes(k)) {
          const el_field = form.querySelector(`[name="${CSS.escape(k)}"]`);
          if (el_field) {
            el_field.value = typeof v === 'string' ? v : (v ?? '');
          }
        }
      });
      
      // Load touch panels
      (data.TouchPanels || []).forEach(i => {
        const r = touchPanelRow(i);
        bindRemove(r);
        tpContainer.appendChild(r);
      });
      
      // Load microphones
      hasCeiling && (hasCeiling.checked = (data.CeilingMics || []).length > 0);
      hasHandheld && (hasHandheld.checked = (data.HandheldMics || []).length > 0);
      hasLapel && (hasLapel.checked = (data.LapelMics || []).length > 0);
      
      ceilingBlock && ceilingBlock.classList.toggle('hidden', !hasCeiling?.checked);
      handheldBlock && handheldBlock.classList.toggle('hidden', !hasHandheld?.checked);
      lapelBlock && lapelBlock.classList.toggle('hidden', !hasLapel?.checked);
      
      (data.CeilingMics || []).forEach(i => {
        const r = ceilingMicRow(i);
        bindRemove(r);
        ceilingContainer.appendChild(r);
      });
      
      (data.HandheldMics || []).forEach(i => {
        const r = handheldRow(i);
        bindRemove(r);
        handheldContainer.appendChild(r);
      });
      
      (data.LapelMics || []).forEach(i => {
        const r = lapelRow(i);
        bindRemove(r);
        lapelContainer.appendChild(r);
      });
      
      // Load speakers
      speakerContainer.innerHTML = '';
      (data.Speakers || []).forEach(i => {
        const r = speakerRow(i);
        bindRemove(r);
        speakerContainer.appendChild(r);
      });
      syncSpeakerCountFromRows();
      
      // Load displays
      displayContainer.innerHTML = '';
      (data.Displays || []).forEach(i => {
        const r = displayRow(i);
        bindRemove(r);
        displayContainer.appendChild(r);
      });
      syncDisplayCountFromRows();
      
      // Load inventory
      const invContainer = document.getElementById('invContainer');
      invContainer.innerHTML = '';
      (data.Inventory || []).forEach(i => {
        const row = el(`<div class="row row-compact">
          <input name="inv_type" placeholder="DSP / Codec / Switch / Extender" value="${i['Device Type'] || ''}" />
          <input name="inv_make" placeholder="AMX / Biamp / QSC / Shure" value="${i['Device Make'] || ''}" />
          <input name="inv_model" placeholder="Model" value="${i['Device Model'] || ''}" />
          <input name="inv_loc" placeholder="Rack / Table / Ceiling" value="${i['Location'] || ''}" />
          <input name="inv_barcode" placeholder="Asset Tag" value="${i['Barcode'] || ''}" />
          <input name="inv_sn" placeholder="Serial" value="${i['Serial Number'] || ''}" />
          <button type="button" class="btn secondary remove">✕</button>
        </div>`);
        invContainer.appendChild(row);
        bindRemove(row);
      });
      
      // Store roomId for potential updates
      if (editingRoomId) {
        sessionStorage.setItem('editingRoomId', editingRoomId);
      }
      
      // Clear sessionStorage
      sessionStorage.removeItem('editingRoom');
    } catch (err) {
      console.error('Error loading editing room:', err);
    }
  }
})();

// ---------------- MariaDB Hooks ----------------
function dbConfig(){ const cfg=getConfig(); return { apiUrl:cfg.apiUrl||'api.php', table:cfg.tableName||'conference_rooms', username:cfg.dbUsername||'conf_user', password:cfg.dbPassword||'JHSdfuy45klaye45' }; }
function dbHeaders(cfg){ const h={'Accept':'application/json','Content-Type':'application/json'}; if(cfg.username&&cfg.password){ const b64=btoa(`${cfg.username}:${cfg.password}`); h['Authorization']=`Basic ${b64}`; } return h; }
async function httpJson(url, opts={}, timeoutMs=20000){ const ctl=new AbortController(); const id=setTimeout(()=>ctl.abort('timeout'), timeoutMs); try{ const res=await fetch(url,{...opts,signal:ctl.signal}); const text=await res.text(); let json=null; try{ json=text?JSON.parse(text):null; }catch{} if(!res.ok){ const msg=(json?.error?.message)||json?.message||text||`HTTP ${res.status}`; const detail=(json?.error?.detail)||''; const err=new Error(`${msg}${detail?` – ${detail}`:''}`); err.status=res.status; err.body=text; throw err; } return json; } finally{ clearTimeout(id); } }
function mapToMariaDB(data){ return { country:data['Country']||'', state:data['State/Province']||'', city:data['City']||'', facility:data['Facility']||'', building:data['Building']||'', floor:data['Floor']||'', room_name_id:data['RoomNameID']||'', room_type:data['Room Type']||'', capacity:data['Capacity']||null, microsoft_teams:data['Microsoft Teams']||'', room_tech:data['Room Tech']||'', input_types:data['Input Type']||'', room_depth:data['Room Depth']||'', room_width:data['Room Width']||'', room_height:data['Room Height']||'', tech_date:data['Tech Date']||'', technician_name:data['Technician Name']||'', racf:data['RACF']||'', technician_notes:data['Technician Notes']||'', touch_panels:JSON.stringify(data.TouchPanels||[]), ceiling_mics:JSON.stringify(data.CeilingMics||[]), handheld_mics:JSON.stringify(data.HandheldMics||[]), lapel_mics:JSON.stringify(data.LapelMics||[]), speakers:JSON.stringify(data.Speakers||[]), displays:JSON.stringify(data.Displays||[]), inventory:JSON.stringify(data.Inventory||[]) }; }
async function dbCreateRecord(cfg, payload){ payload.table = cfg.table || 'conference_rooms'; const url = `${cfg.apiUrl}/records`; return httpJson(url, { method:'POST', headers:dbHeaders(cfg), body:JSON.stringify(payload) }); }

async function handleSubmit(){ try{ const cfg=getConfig(); const data=await formToObject(form); const errs=validateRequired(data); if(errs.length) throw new Error('Validation failed:\n- '+errs.join('\n- ')); 

  // Try to upload photos to server for both storage modes
  try {
    await uploadPhotosToServer(data['RoomNameID']);
  } catch (e) {
    console.warn('Could not upload photos to server:', e);
  }

  if(cfg.storageType==='local'){ await ensureDatabaseReady(); const editingRoomId = sessionStorage.getItem('editingRoomId'); if(editingRoomId){ updateRoom(editingRoomId, data); sessionStorage.removeItem('editingRoomId'); alert('Room updated successfully.\n\n💾 Download your database from Settings > Database Export & Import'); window.location.href = '../index.html'; } else { const roomData={...data,createdAt:new Date().toISOString()}; insertRoom(roomData); const allRooms=getAllRooms(); alert('Saved to SQLite database successfully.\nTotal records: '+allRooms.length+'\n\n💾 Download your database from Settings > Database Export & Import'); } } else { const dbCfg=dbConfig(); if(!dbCfg.apiUrl) throw new Error('API URL is required'); const payload=mapToMariaDB(data); const j=await dbCreateRecord(dbCfg, payload); const id=j?.id; alert('Submitted to MariaDB successfully.'+(id?`\nRecord ID: ${id}`:'')); } } catch(e){ alert('Submit failed: '+(e?.message||e)); } }
async function dbTestConnection(){ try{ const cfg=dbConfig(); if(!cfg.apiUrl) throw new Error('API URL is required'); const url=`${cfg.apiUrl}/health`; const result=await httpJson(url, { headers:dbHeaders(cfg) }, 15000); alert('MariaDB backend connection OK\n'+JSON.stringify(result)); } catch(e){ alert('MariaDB connection failed: '+(e?.message||e)); } }
$('#submitBtn')?.addEventListener('click', handleSubmit);
$('#dbTest')?.addEventListener('click', dbTestConnection);
$('#downloadJson')?.addEventListener('click', () => {
  try {
    const rooms = getAllRooms();
    const json = JSON.stringify(rooms, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], {type: 'application/json'}));
    a.download = `rooms-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  } catch (e) {
    alert('Error downloading: ' + e.message);
  }
});
$('#downloadCsv')?.addEventListener('click', () => {
  try {
    const rooms = getAllRooms();
    if (!rooms.length) throw new Error('No records to export');
    const headers = Object.keys(rooms[0]);
    const csv = [headers.join(','), ...rooms.map(r => headers.map(h => `\"${(r[h]||'').toString().replace(/\"/g, '\"\"')}\"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    a.download = `rooms-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  } catch (e) {
    alert('Error downloading: ' + e.message);
  }
});
$('#loadJson')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      if (!Array.isArray(data)) throw new Error('JSON must be an array of rooms');
      let saved = 0;
      data.forEach(room => {
        if (room.country && room.room_name) {
          insertRoom({...room, createdAt: room.createdAt || new Date().toISOString()});
          saved++;
        }
      });
      alert(`Loaded ${saved} records from JSON`);
      e.target.value = '';
    } catch (err) {
      alert('Error loading JSON: ' + err.message);
      e.target.value = '';
    }
  };
  reader.readAsText(file);
})

// ------- Help dialog events -------
$('#displaySizeHelp')?.addEventListener('click', ()=>{ $('#displaySizeHelpDialog')?.classList.remove('hidden'); });
$('#closeHelpDisplaySize')?.addEventListener('click', ()=>{ $('#displaySizeHelpDialog')?.classList.add('hidden'); });