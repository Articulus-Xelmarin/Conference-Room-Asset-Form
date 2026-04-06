// Local Database Manager - SQLite Backend
// Uses sqlite-db.js which provides: getAllRooms, deleteRoom, clearAllRooms, exportDatabase, importDatabase, getDatabaseStats

// ====== DOM Helpers ======
const $ = (sel)=>document.querySelector(sel);
const $$=(sel)=>Array.from(document.querySelectorAll(sel));

// ====== Utility ======
function showStatus(selector, type, msg){ const el=$(selector); if(el){ el.textContent=msg; el.className=type==='success'?'help':'error'; el.style.display='block'; } }
function download(filename, text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/octet-stream'})); a.download=filename; a.click(); }

// ====== Statistics & Initialization ======
function updateStats(){ try{ const records=getAllRooms(); const statsEl=$('#dbStats'); if(statsEl){ const size=JSON.stringify(records).length; const sizeKb=(size/1024).toFixed(2); let oldest='N/A'; let newest='N/A'; if(records.length){ const dates=records.map(r=>new Date(r.createdAt).getTime()).sort(); oldest=new Date(dates[0]).toLocaleDateString(); newest=new Date(dates[dates.length-1]).toLocaleDateString(); } statsEl.innerHTML=`<strong>${records.length} total records</strong> • ${sizeKb} KB • Oldest: ${oldest} • Newest: ${newest}`; } }catch(e){ console.error('Stats error:',e); } }

$('#initializeDb')?.addEventListener('click', async () => {
  if (!confirm('Initialize a fresh database? This will clear all existing data.')) return;
  try {
    await ensureDatabaseReady();
    clearAllRooms();
    updateStats();
    alert('✓ Database initialized and cleared successfully');
  } catch (error) {
    alert('Error initializing database: ' + error.message);
  }
});

// ====== View Records ======
function formatRecordRow(r){ return `<div class="record-row"><strong>${r.room_name||'Unknown'}</strong><br/><small>${r.facility||'N/A'} • ${r.building||'N/A'} • ${new Date(r.createdAt).toLocaleString()}</small></div>`; }

$('#viewAll')?.addEventListener('click',()=>{ try{ const records=getAllRooms(); if(!records.length){ alert('No records in database'); return; } const listEl=$('#recordsList'); listEl.innerHTML=records.map(formatRecordRow).join(''); }catch(e){ alert('Error: '+(e?.message||e)); } });

$('#viewRecent')?.addEventListener('click',()=>{ try{ const records=getAllRooms(); if(!records.length){ alert('No records in database'); return; } const recent=records.slice(-10); const listEl=$('#recordsList'); listEl.innerHTML=recent.map(formatRecordRow).join(''); }catch(e){ alert('Error: '+(e?.message||e)); } });

$('#searchBtn')?.addEventListener('click',()=>{ const query=prompt('Search room name or facility:'); if(!query) return; try{ const records=getAllRooms(); const filtered=records.filter(r=>(r.room_name||'').toLowerCase().includes(query.toLowerCase())||(r.facility||'').toLowerCase().includes(query.toLowerCase())); if(!filtered.length){ alert('No matching records found'); return; } const listEl=$('#recordsList'); listEl.innerHTML=`<p><strong>Found ${filtered.length} matching records:</strong></p>`+filtered.map(formatRecordRow).join(''); }catch(e){ alert('Error: '+(e?.message||e)); } });

// ====== Backup & Restore ======
$('#exportBackup')?.addEventListener('click',()=>{ try{ const records=getAllRooms(); if(!records.length){ alert('No records to export'); return; } const json=JSON.stringify(records,null,2); download(`conference-rooms-backup_${new Date().toISOString().slice(0,10)}.json`, json); showStatus('#backupStatus','success','✓ Backup exported'); }catch(e){ showStatus('#backupStatus','error','Export failed: '+(e?.message||e)); } });

$('#viewBackupInfo')?.addEventListener('click',()=>{ try{ const records=getAllRooms(); if(!records.length){ alert('No records'); return; } const byFacility={}; records.forEach(r=>{ const f=r.facility||'Unknown'; byFacility[f]=(byFacility[f]||0)+1; }); const summary=`Total Records: ${records.length}\n\nBy Facility:\n`+Object.entries(byFacility).map(([f,c])=>`  ${f}: ${c}`).join('\n')+`\n\nDatabase Size: ${(JSON.stringify(records).length/1024).toFixed(2)} KB`; alert(summary); }catch(e){ alert('Error: '+(e?.message||e)); } });

$('#importFile')?.addEventListener('change',(e)=>{ const file=e.target.files[0]; if(!file) return; try{ const reader=new FileReader(); reader.onload=(evt)=>{ try{ const records=JSON.parse(evt.target.result); if(!Array.isArray(records)) throw new Error('Invalid backup format'); let count=0; records.forEach(r=>{ if(r.room_name&&r.facility){ insertRoom({...r,createdAt:r.createdAt||new Date().toISOString()}); count++; } }); showStatus('#backupStatus','success',`✓ Restored ${count} records`); updateStats(); e.target.value=''; }catch(err){ showStatus('#backupStatus','error','Import failed: '+(err?.message||err)); } }; reader.readAsText(file); }catch(err){ showStatus('#backupStatus','error','Import failed: '+(err?.message||err)); } });

// ====== Maintenance ======
$('#compactDb')?.addEventListener('click',()=>{ try{ exportDatabase(); showStatus('#maintenanceStatus','success','✓ Database exported'); updateStats(); }catch(e){ showStatus('#maintenanceStatus','error','Error: '+(e?.message||e)); } });

$('#deleteOldRecords')?.addEventListener('click',()=>{ if(!confirm('Delete records older than 90 days?')) return; try{ const records=getAllRooms(); const ninetyDaysAgo=new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate()-90); let deleted=0; records.forEach(r=>{ const rDate=new Date(r.createdAt); if(rDate<ninetyDaysAgo){ deleteRoom(r.id); deleted++; } }); showStatus('#maintenanceStatus','success',`✓ Deleted ${deleted} records`); updateStats(); }catch(e){ showStatus('#maintenanceStatus','error','Error: '+(e?.message||e)); } });

$('#clearDatabase')?.addEventListener('click',()=>{ if(!confirm('⚠️ This will delete ALL records. Continue?')) return; try{ clearAllRooms(); showStatus('#maintenanceStatus','success','✓ Database cleared'); updateStats(); }catch(e){ showStatus('#maintenanceStatus','error','Clear failed: '+(e?.message||e)); } });

// ====== Initialize on page load ======
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureDatabaseReady();
    updateStats();
  } catch (e) {
    console.error('Database initialization failed:', e);
    $('#dbStats').innerHTML = '<span class="input-error">Failed to initialize database: ' + e.message + '</span>';
  }
});

