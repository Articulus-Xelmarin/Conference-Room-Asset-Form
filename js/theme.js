// Theme toggle – robust across Chrome/Edge/Firefox (and others)
(function(){
  const KEY='roomFormTheme';

  function canStore(){
    try{
      if(!('localStorage' in window)) return false;
      const t='__t__';
      localStorage.setItem(t,t);
      localStorage.removeItem(t);
      return true;
    }catch(e){ return false; }
  }
  const storageOK=canStore();

  function getSaved(){
    if(!storageOK) return null;
    try{ return localStorage.getItem(KEY); }catch(e){ return null; }
  }
  function setSaved(v){
    if(!storageOK) return;
    try{ localStorage.setItem(KEY,v); }catch(e){}
  }

  function apply(theme){
    const root=document.documentElement;
    root.setAttribute('data-theme', theme);

    const btn=document.getElementById('themeToggle');
    if(btn){
      const isLight = theme==='light';
      btn.setAttribute('aria-pressed', String(isLight));
      const label=btn.querySelector('.theme-label');
      if(label) label.textContent = isLight ? 'Mode: Light' : 'Mode: Dark';
    }
  }

  function init(){
    // Requirement: default to dark.
    const saved=getSaved();
    apply(saved==='light' ? 'light' : 'dark');

    const btn=document.getElementById('themeToggle');
    if(btn){
      btn.addEventListener('click', ()=>{
        const cur=document.documentElement.getAttribute('data-theme') || 'dark';
        const next = (cur==='light') ? 'dark' : 'light';
        setSaved(next);
        apply(next);
      });
    }

    // Autodetect browser capability for prefers-color-scheme.
    // We DO NOT override user choice; we only react if no saved preference exists.
    try{
      if(window.matchMedia){
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const handler = ()=>{
          const current=getSaved();
          if(current!=='light' && current!=='dark'){
            apply(mq.matches ? 'light' : 'dark');
          }
        };
        if(mq.addEventListener) mq.addEventListener('change', handler);
        else if(mq.addListener) mq.addListener(handler);
      }
    }catch(e){}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
