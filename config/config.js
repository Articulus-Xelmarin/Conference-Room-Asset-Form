// Configuration management with password protection
// MariaDB-only storage via DB_API (db-api.js)

const CONFIG_KEY='formStorageConfig';
const PASSWORD_KEY='configPassword';
const SESSION_KEY='configAuthenticated';
const DEFAULT_PASSWORD='admin'; // Default password

// ====== Password & Auth ======
function hashPassword(pwd){ return btoa(pwd); }
function verifyPassword(pwd){ const stored=localStorage.getItem(PASSWORD_KEY); const defaultHash=hashPassword(DEFAULT_PASSWORD); const storedHash=stored||defaultHash; return hashPassword(pwd)===storedHash; }
function setPassword(pwd){ localStorage.setItem(PASSWORD_KEY, hashPassword(pwd)); }
function isAuthenticated(){ return sessionStorage.getItem(SESSION_KEY)==='true'; }
function setAuthenticated(){ sessionStorage.setItem(SESSION_KEY,'true'); }
function clearAuthentication(){ sessionStorage.removeItem(SESSION_KEY); }

// ====== Config Storage ======
function getConfig(){ try{ const cfg=localStorage.getItem(CONFIG_KEY); return cfg?JSON.parse(cfg):{apiUrl:'/api.php',tableName:'conference_rooms',dbUsername:'',dbPassword:''}; }catch{ return {apiUrl:'/api.php',tableName:'conference_rooms',dbUsername:'',dbPassword:''}; } }
function saveConfig(cfg){ try{ localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }catch{} }

// ====== DOM Helpers ======
const $ = (sel)=>document.querySelector(sel);
const $$=(sel)=>Array.from(document.querySelectorAll(sel));

// ====== UI Functions ======
function showAuth(){
  const authEl=$('[id="authScreen"]');
  const configEl=$('[id="configContent"]');
  if(authEl){ authEl.classList.remove('hidden'); authEl.style.display='block'; }
  if(configEl){ configEl.classList.add('hidden'); configEl.style.display='none'; }
}
function showConfig(){
  const authEl=$('[id="authScreen"]');
  const configEl=$('[id="configContent"]');
  if(authEl){ authEl.classList.add('hidden'); authEl.style.display='none'; }
  if(configEl){ configEl.classList.remove('hidden'); configEl.style.display='block'; }
}

function loadConfigUI(){ const cfg=getConfig(); $('#apiUrl').value=cfg.apiUrl||''; $('#tableName').value=cfg.tableName||''; $('#dbUsername').value=cfg.dbUsername||''; $('#dbPassword').value=cfg.dbPassword||''; }

// ====== Password Management ======
$('#authSubmit')?.addEventListener('click',()=>{ const pwd=$('#passwordInput').value; if(!pwd){ showError('#authError','Password is required'); return; } if(verifyPassword(pwd)){ setAuthenticated(); showConfig(); loadConfigUI(); }else{ showError('#authError','Incorrect password'); $('#passwordInput').value=''; } });

$('#logoutBtn')?.addEventListener('click',()=>{ clearAuthentication(); location.reload(); });

$('#passwordInput')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') $('#authSubmit').click(); });

$('#changePassword')?.addEventListener('click',()=>{ const newPwd=$('#newPassword').value; const confirm=$('#confirmPassword').value; const statusEl=$('#passwordStatus'); statusEl.style.display='block'; if(!newPwd){ showStatus(statusEl,'error','New password is required'); return; } if(newPwd!==confirm){ showStatus(statusEl,'error','Passwords do not match'); return; } setPassword(newPwd); showStatus(statusEl,'success','Password updated successfully'); $('#newPassword').value=''; $('#confirmPassword').value=''; });

// ====== MariaDB Configuration ======
$('#testConnection')?.addEventListener('click',async ()=>{ const statusEl=$('#connectionStatus'); statusEl.style.display='block'; try{ const apiUrl=$('#apiUrl').value; const username=$('#dbUsername').value; const password=$('#dbPassword').value; if(!apiUrl) throw new Error('API URL is required'); const headers={'Accept':'application/json','Content-Type':'application/json'}; if(username&&password){ const b64=btoa(`${username}:${password}`); headers['Authorization']=`Basic ${b64}`; } const ctl=new AbortController(); const id=setTimeout(()=>ctl.abort(),15000); const res=await fetch(`${apiUrl}/health`,{headers,signal:ctl.signal}); clearTimeout(id); if(res.ok){ showStatus(statusEl,'success','Connection successful'); }else{ showStatus(statusEl,'error','Connection failed: '+res.status); } }catch(e){ showStatus(statusEl,'error','Error: '+(e?.message||e)); } });

$('#saveMariadbSettings')?.addEventListener('click',()=>{ const cfg=getConfig(); cfg.apiUrl=$('#apiUrl').value; cfg.tableName=$('#tableName').value; cfg.dbUsername=$('#dbUsername').value; cfg.dbPassword=$('#dbPassword').value; saveConfig(cfg); showStatus($('#connectionStatus'),'success','MariaDB settings saved'); });

// ====== Save All Settings ======
$('#saveAllSettings')?.addEventListener('click',()=>{ const cfg=getConfig(); cfg.apiUrl=$('#apiUrl').value; cfg.tableName=$('#tableName').value; cfg.dbUsername=$('#dbUsername').value; cfg.dbPassword=$('#dbPassword').value; saveConfig(cfg); alert('All settings saved successfully'); });

// ====== Sample Data Generation ======
$('#generateSampleBtn')?.addEventListener('click', async () => {
  const statusEl = $('#sampleStatus');
  statusEl.style.display = 'block';
  try {
    const results = await generateSampleRooms();
    showStatus(statusEl, 'success', `Generated ${results.length} sample rooms. Open Assets > Room Finder to view.`);
  } catch (error) {
    showStatus(statusEl, 'error', `Error generating sample data: ${error.message}`);
  }
});

$('#clearDbBtn')?.addEventListener('click', async () => {
  if (!confirm('This will DELETE ALL records in the database. Are you sure?')) return;
  const statusEl = $('#sampleStatus');
  statusEl.style.display = 'block';
  try {
    await clearAllData();
    showStatus(statusEl, 'success', 'All data cleared successfully');
  } catch (error) {
    showStatus(statusEl, 'error', `Error clearing data: ${error.message}`);
  }
});

// ====== Helpers ======
function showStatus(el, type, msg){ el.textContent=msg; el.className=type==='success'?'help':'error'; }
function showError(selector, msg){ const el=$(selector); if(el){ el.textContent=msg; el.style.display='block'; } }

// ====== Initialize ======
window.addEventListener('DOMContentLoaded',()=>{ if(isAuthenticated()){ showConfig(); loadConfigUI(); }else{ showAuth(); } });
