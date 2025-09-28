// ==UserScript==
// @name         Grepolis Toolkit
// @namespace    https://github.com/KID6767/grepolis-toolkit
// @version      1.0.0
// @description  Planner (ETA, multi-target, BBCode, minimap, notifications) + Finder (island/player/alliance/ghosts) + Log + Settings + animated logo
// @author       KID6767
// @match        https://*.grepolis.com/*
// @match        http://*.grepolis.com/*
// @exclude      https://forum*.grepolis.*/*
// @exclude      http://forum*.grepolis.*/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  /**********************
   *  UTIL / STYLES
   **********************/
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const LS = {
    get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d } },
    set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
  };
  const KEYS = {settings:'gt_settings', targets:'gt_targets', log:'gt_log', cache:'gt_cache'};

  GM_addStyle(`
  .gt-toast{position:fixed;right:18px;bottom:18px;background:rgba(20,18,15,.96);color:#f7e3b1;border:1px solid #6d5a2f;padding:10px 12px;border-radius:10px;z-index:999999;box-shadow:0 10px 24px rgba(0,0,0,.5)}
  .gt-btn{cursor:pointer;border-radius:8px;border:1px solid #6d5a2f;background:#1f1b16;color:#ffd257;font-weight:700;display:inline-flex;gap:6px;align-items:center;justify-content:center;user-select:none}
  #gt-panel{position:fixed;right:18px;bottom:18px;width:460px;max-height:80vh;overflow:auto;background:rgba(0,0,0,.88);border:1px solid #6d5a2f;border-radius:14px;color:#f1e4c2;z-index:99997;display:none}
  #gt-panel header{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #6d5a2f}
  #gt-tabs{display:flex;gap:6px;padding:8px 10px}
  .gt-tab{flex:1;padding:8px 10px;text-align:center;border:1px solid #6d5a2f;border-radius:8px;background:#201b16;cursor:pointer}
  .gt-tab.active{background:#2a241d}
  .gt-sec{padding:10px 12px}
  .gt-field{margin-bottom:8px}
  .gt-field label{display:block;margin-bottom:4px;opacity:.9}
  .gt-input,.gt-select,.gt-text{width:100%;padding:6px 8px;border-radius:8px;border:1px solid #6d5a2f;background:#161310;color:#f1e4c2}
  .gt-row{display:flex;gap:8px}.gt-row>*{flex:1}
  .gt-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
  .gt-table{width:100%;border-collapse:collapse;margin-top:6px}
  .gt-table th,.gt-table td{border-bottom:1px solid #443722;padding:6px 4px;text-align:left}
  .gt-note{opacity:.75;font-size:12px}
  .gt-target{display:flex;align-items:center;justify-content:space-between;border:1px solid #443722;border-radius:8px;padding:6px;margin-top:6px}
  canvas#gt-route{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:99990}
  canvas#gt-minimap{width:100%;height:180px;background:#0f0c09;border:1px solid #3b2f18;border-radius:8px}
  #gt-menu-btn{font-weight:700}
  .gt-logo{width:22px;height:22px;display:inline-block;vertical-align:middle}
  `);

  const SPEEDS = { colonize:0.20, fire:0.30, bireme:0.35, trireme:0.32, transport:0.25 };

  const toast = (msg, ms=2200)=>{
    const t=document.createElement('div'); t.className='gt-toast'; t.textContent=msg;
    document.body.appendChild(t); setTimeout(()=>t.remove(),ms);
  };
  const escapeHtml = s => s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  /**********************
   *  INLINE LOGO (SVG)
   **********************/
  const GT_SVG = `
    <svg viewBox="0 0 64 64" class="gt-logo" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="f" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g fill="#ffd257" filter="url(#f)">
        <rect x="28" y="10" width="8" height="28" rx="3"/>
        <circle cx="32" cy="8" r="4"/>
        <rect x="12" y="28" width="40" height="14" rx="6"/>
        <rect x="18" y="24" width="6" height="10" rx="3"/>
        <rect x="40" y="24" width="6" height="10" rx="3"/>
        <path d="M24 42v6a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-6z"/>
      </g>
    </svg>
  `;
  const logoNode = ()=> {
    const d = document.createElement('span');
    d.innerHTML = GT_SVG; return d.firstElementChild;
  };

  /**********************
   *  PANEL (single)
   **********************/
  const panel = document.createElement('div');
  panel.id = 'gt-panel';
  panel.innerHTML = `
    <header>
      <div style="display:flex;align-items:center;gap:8px">
        ${GT_SVG}
        <b>Grepolis Toolkit</b>
        <canvas id="gt-logo-anim" width="28" height="28" style="margin-left:6px"></canvas>
      </div>
      <div class="gt-btn" id="gt-close" style="padding:4px 8px">X</div>
    </header>

    <div id="gt-tabs">
      <div class="gt-tab active" data-tab="planner">Planner</div>
      <div class="gt-tab" data-tab="finder">Finder</div>
      <div class="gt-tab" data-tab="log">Log</div>
      <div class="gt-tab" data-tab="settings">Settings</div>
    </div>

    <!-- PLANNER -->
    <section class="gt-sec" id="gt-planner">
      <div class="gt-row">
        <div class="gt-field">
          <label>Start town (name or ID)</label>
          <input class="gt-input" id="gt-start" placeholder="e.g. Athens or 12345">
        </div>
        <div class="gt-field">
          <label>World speed</label>
          <input class="gt-input" id="gt-worldspeed" type="number" min="1" step="0.1" value="1">
          <small class="gt-note">Auto-detected</small>
        </div>
      </div>

      <div class="gt-row">
        <div class="gt-field"><label><input type="checkbox" id="gt-b-poseidon"> Poseidon (+10%)</label></div>
        <div class="gt-field"><label><input type="checkbox" id="gt-b-sails"> Sails (+10%)</label></div>
        <div class="gt-field"><label><input type="checkbox" id="gt-b-captain"> Captain (+10%)</label></div>
      </div>

      <div class="gt-field">
        <label>Add target (name/ID or coords x|y)</label>
        <input class="gt-input" id="gt-target" placeholder="e.g. Sparta or 54321 or 421|537">
      </div>

      <div class="gt-row">
        <div class="gt-field">
          <label>Unit</label>
          <select class="gt-select" id="gt-unit">
            <option value="colonize">Colony ship</option>
            <option value="fire">Fire ship</option>
            <option value="bireme">Bireme</option>
            <option value="trireme">Trireme</option>
            <option value="transport">Transport</option>
          </select>
        </div>
        <div class="gt-field">
          <label>Notify when ETA < (min)</label>
          <input class="gt-input" id="gt-notify-min" type="number" min="1" value="30">
        </div>
      </div>

      <div class="gt-actions">
        <div class="gt-btn" id="gt-add-target" style="padding:8px">Add target</div>
        <div class="gt-btn" id="gt-calc-all" style="padding:8px">Recalculate all</div>
        <div class="gt-btn" id="gt-bbcode-all" style="padding:8px">BBCode (all)</div>
        <div class="gt-btn" id="gt-export" style="padding:8px">Export JSON</div>
        <div class="gt-btn" id="gt-import" style="padding:8px">Import JSON</div>
      </div>

      <div id="gt-targets"></div>
      <div style="margin-top:10px"><canvas id="gt-minimap" width="440" height="180"></canvas></div>
    </section>

    <!-- FINDER -->
    <section class="gt-sec" id="gt-finder" style="display:none">
      <div class="gt-row">
        <div class="gt-field">
          <label>Mode</label>
          <select class="gt-select" id="gt-fmode">
            <option value="island">Visible island</option>
            <option value="player">Player</option>
            <option value="alliance">Alliance</option>
            <option value="ghosts_near">Ghosts near start</option>
          </select>
        </div>
        <div class="gt-field">
          <label>Query (name or ID)</label>
          <input class="gt-input" id="gt-fquery" placeholder="Player/Alliance">
        </div>
      </div>
      <div class="gt-row">
        <div class="gt-field"><label><input type="checkbox" id="gt-only-ghosts"> Only ghost towns</label></div>
        <div class="gt-field"><label><input type="checkbox" id="gt-exclude-allies"> Exclude alliance towns</label></div>
        <div class="gt-field"><label>Radius (ghosts near)</label><input class="gt-input" id="gt-radius" type="number" value="100"></div>
      </div>
      <div class="gt-row">
        <div class="gt-field"><label>Points < max</label><input class="gt-input" id="gt-maxpoints" type="number" placeholder="e.g. 2000"></div>
        <div class="gt-field"><label>Filter name</label><input class="gt-input" id="gt-namefilter" placeholder="substring"></div>
      </div>
      <div class="gt-actions" style="margin-bottom:8px">
        <div class="gt-btn" id="gt-find" style="flex:2;padding:8px">Find</div>
        <div class="gt-btn" id="gt-clear" style="flex:1;padding:8px">Clear</div>
      </div>
      <table class="gt-table" id="gt-table">
        <thead><tr><th>Town</th><th>Owner</th><th>Type</th><th>→ Planner</th></tr></thead>
        <tbody></tbody>
      </table>
      <small class="gt-note">Player/Alliance use in-game models when available. Ghosts near uses your locally cached island scans.</small>
    </section>

    <!-- LOG -->
    <section class="gt-sec" id="gt-log" style="display:none">
      <div class="gt-actions">
        <div class="gt-btn" id="gt-log-clear" style="padding:6px 10px">Clear log</div>
        <div class="gt-btn" id="gt-log-copy"  style="padding:6px 10px">Copy log</div>
      </div>
      <div id="gt-loglist" style="margin-top:8px"></div>
      <div id="gt-stats" class="gt-note" style="margin-top:10px"></div>
    </section>

    <!-- SETTINGS -->
    <section class="gt-sec" id="gt-settings" style="display:none">
      <div class="gt-field">
        <label>Theme</label>
        <select class="gt-select" id="gt-theme">
          <option value="goldblack">Gold Black</option>
          <option value="dark">Dark</option>
          <option value="classic">Classic</option>
        </select>
      </div>
      <div class="gt-note">Settings are saved locally in your browser.</div>
    </section>
  `;
  document.body.appendChild(panel);

  const openPanel = () => { panel.style.display='block'; panel.style.opacity='0'; setTimeout(()=>panel.style.opacity='1', 25); };
  const closePanel= () => { panel.style.opacity='0'; setTimeout(()=>panel.style.display='none', 160); };
  $('#gt-close').addEventListener('click', closePanel);
  $$('#gt-tabs .gt-tab').forEach(t=> t.addEventListener('click', ()=>{
    $$('#gt-tabs .gt-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    $$('#gt-panel .gt-sec').forEach(sec=> sec.style.display='none');
    $('#gt-'+t.dataset.tab).style.display='block';
  }));

  /**********************
   *  ICON in footer
   **********************/
  function insertMenuButton(){
    const menu = document.querySelector('#ui_box ul#ui_footer_links');
    if (!menu || $('#gt-menu-btn')) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.id='gt-menu-btn'; a.href='#';
    a.appendChild(logoNode());
    a.appendChild(document.createTextNode(' Toolkit'));
    a.addEventListener('click', e=>{ e.preventDefault(); openPanel(); });
    li.appendChild(a); menu.appendChild(li);
  }
  const menuObs = new MutationObserver(insertMenuButton);
  menuObs.observe(document.body,{childList:true,subtree:true});
  setTimeout(insertMenuButton, 1200);

  // Hotkey Alt+T
  document.addEventListener('keydown', (e)=>{
    if (e.altKey && e.key.toLowerCase()==='t'){
      (panel.style.display==='none' || !panel.style.display) ? openPanel() : closePanel();
    }
  });

  // Startup toast
  setTimeout(()=> toast('Grepolis Toolkit: loaded'), 900);

  /**********************
   *  LOGO ANIMATION (tiny)
   **********************/
  (function logoAnim(){
    const c = $('#gt-logo-anim'); if (!c) return;
    const ctx = c.getContext('2d'); let t=0;
    function draw(){
      const w=c.width, h=c.height; t+=0.05;
      ctx.clearRect(0,0,w,h);
      ctx.globalAlpha=0.25+0.25*Math.sin(t);
      ctx.fillStyle='#ffd257';
      ctx.beginPath(); ctx.arc(w/2, h/2, 10+2*Math.sin(t*2), 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /**********************
   *  GLOBAL STATE
   **********************/
  let targets = LS.get(KEYS.targets, []);
  let logArr  = LS.get(KEYS.log, []);
  let lastScannedTowns = LS.get(KEYS.cache, []);

  const logPush = (type, msg, meta)=>{
    const row = {ts:Date.now(), type, msg, meta:meta||null};
    logArr.unshift(row);
    logArr = logArr.slice(0,250);
    LS.set(KEYS.log, logArr);
    renderLog(); updateStats();
  };
  function renderLog(){
    const box = $('#gt-loglist'); if (!box) return;
    if (!logArr.length){ box.innerHTML = '<div class="gt-note">Empty.</div>'; return; }
    box.innerHTML = logArr.map(x=> `<div style="padding:6px 0;border-bottom:1px solid #443722">
      <div><b>[${new Date(x.ts).toLocaleString()}]</b> ${x.type.toUpperCase()}: ${x.msg}</div>
      ${x.meta? `<pre class="gt-text" style="white-space:pre-wrap;margin-top:4px">${escapeHtml(JSON.stringify(x.meta,null,2))}</pre>`:''}
    </div>`).join('');
  }
  const updateStats = ()=>{
    const scans   = logArr.filter(x=>x.type==='scan').length;
    const calcs   = logArr.filter(x=>x.type==='calc').length;
    const exports = logArr.filter(x=>x.type==='export').length;
    $('#gt-stats').textContent = `Scans: ${scans} • Calcs: ${calcs} • Exports: ${exports}`;
  };
  $('#gt-log-clear').addEventListener('click', ()=>{ LS.set(KEYS.log, []); logArr=[]; renderLog(); updateStats(); });
  $('#gt-log-copy').addEventListener('click', ()=>{ navigator.clipboard.writeText(JSON.stringify(logArr,null,2)); toast('Log copied'); });

  /**********************
   *  DATA (my towns)
   **********************/
  function getMyTowns(){
    try{
      const list = [];
      const towns = (window.ITowns && (ITowns._byId || ITowns.towns)) || {};
      for (const k in towns){
        const t = towns[k] || {};
        const id = +t.id || +k;
        const name = t.name || t.attributes?.name;
        const x = t.x || t.attributes?.x;
        const y = t.y || t.attributes?.y;
        if (id && name) list.push({id, name, x, y, owner: window.Game?.player_name || '-', type:'Town'});
      }
      return list;
    }catch(e){ return []; }
  }
  const dedupe = arr => { const m=new Map(); arr.forEach(x=> m.set((x.id||x.name)+'', x)); return Array.from(m.values()); };
  const allTargets = () => dedupe(getMyTowns().concat(lastScannedTowns));

  // auto world speed
  (function autoWorldSpeed(){
    try{
      const ws = window.Game?.game_speed || window.Game?.world_speed || 1;
      const el = $('#gt-worldspeed'); if (ws && el) el.value = ws;
    }catch(_){}
  })();

  /**********************
   *  PLANNER / ROUTES
   **********************/
  const colorForUnit = u => ({colonize:'#ffd200', fire:'#ff0033', bireme:'#ffffff', trireme:'#2a7cff', transport:'#8d6b3a'}[u] || '#ffd200');

  function parseTownToken(token){
    if (!token) return null;
    const idMatch = (token.match(/#(\d+)/)||token.match(/^(\d+)$/)||[])[1];
    if (idMatch){
      const t = allTargets().find(x=>(''+x.id)===idMatch) || getMyTowns().find(x=>(''+x.id)===idMatch);
      if (t) return t; return {id:+idMatch, name:`#${idMatch}`};
    }
    const xy = (token.match(/(\d+)\s*\|\s*(\d+)/)||[]);
    const byName = allTargets().find(x=>(x.name||'').toLowerCase()===token.toLowerCase()) || getMyTowns().find(x=>(x.name||'').toLowerCase()===token.toLowerCase());
    if (byName) return byName;
    if (xy[1]) return {id:null,name:token,x:+xy[1],y:+xy[2]};
    return null;
  }
  function calcETA(from, to, unit, worldSpeed, buffs){
    const dx=(to.x-from.x), dy=(to.y-from.y), dist=Math.hypot(dx,dy);
    let v = (SPEEDS[unit]||0.2) * (worldSpeed||1);
    if (buffs.poseidon) v*=1.10; if (buffs.sails) v*=1.10; if (buffs.captain) v*=1.10;
    const seconds = dist / v;
    const eta = new Date(Date.now() + seconds*1000);
    return {dist:+dist.toFixed(2), seconds:Math.round(seconds), eta};
  }
  const hms = secs => { const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };

  // overlay route
  const canvas = document.createElement('canvas'); canvas.id='gt-route'; document.body.appendChild(canvas);
  function syncCanvasSize(){ canvas.width=innerWidth; canvas.height=innerHeight; }
  window.addEventListener('resize', syncCanvasSize); syncCanvasSize();
  const mapToScreen = p => ({ x: (p.x/1000)*canvas.width, y: (p.y/1000)*canvas.height });
  let anim;
  function drawRoute(from,to,unit){
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (!from || !to || from.x==null || to.x==null) return;
    const a=mapToScreen(from), b=mapToScreen(to);
    const col = colorForUnit(unit);
    ctx.lineWidth=3; ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    let t=0;
    const dot = ()=>{
      t=(t+0.01)%1; const x=a.x+(b.x-a.x)*t, y=a.y+(b.y-a.y)*t;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
      anim=requestAnimationFrame(dot);
    };
    if (anim) cancelAnimationFrame(anim);
    anim=requestAnimationFrame(dot);
  }

  function saveTargets(){ LS.set(KEYS.targets, targets); renderTargets(); }
  function removeTarget(i){ targets.splice(i,1); saveTargets(); }
  function renderTargets(){
    const box = $('#gt-targets'); if (!box) return;
    if (!targets.length){ box.innerHTML = '<div class="gt-note">No targets yet. Add one above.</div>'; return; }
    const ws=+$('#gt-worldspeed').value||1, buffs={poseidon:$('#gt-b-poseidon').checked, sails:$('#gt-b-sails').checked, captain:$('#gt-b-captain').checked};
    const from = parseTownToken($('#gt-start').value.trim());
    box.innerHTML = targets.map((t,idx)=>{
      let res = {dist:'-', seconds:0, eta:new Date()};
      if (from && t.x!=null) res = calcETA(from, t, t.unit, ws, buffs);
      const etaStr = res.eta ? res.eta.toLocaleString() : '-';
      const hmsStr = res.seconds ? hms(res.seconds) : '-';
      return `<div class="gt-target" data-i="${idx}">
        <div>
          <div><b>${t.name||t.token}</b> ${t.id?`<small>#${t.id}</small>`:''} ${t.x!=null?`<small>· ${t.x}|${t.y}</small>`:''}</div>
          <div class="gt-note">Unit ${t.unit} • Dist ${res.dist} • ${hmsStr} • ETA ${etaStr}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <select class="gt-select gt-unit-change" style="width:auto">
            ${Object.keys(SPEEDS).map(u=>`<option value="${u}" ${u===t.unit?'selected':''}>${u}</option>`).join('')}
          </select>
          <div class="gt-btn gt-go" style="padding:4px 8px">Route</div>
          <div class="gt-btn gt-del" style="padding:4px 8px">X</div>
        </div>
      </div>`;
    }).join('');
  }
  $('#gt-targets').addEventListener('click', (e)=>{
    const row = e.target.closest('.gt-target'); if (!row) return;
    const i = +row.dataset.i;
    if (e.target.classList.contains('gt-del')) removeTarget(i);
    if (e.target.classList.contains('gt-go')){
      const from = parseTownToken($('#gt-start').value.trim());
      const t = targets[i]; if (!from || !t || t.x==null){ toast('Pick valid start & target'); return; }
      drawRoute(from, t, t.unit);
      logPush('calc', `Route ${t.name||t.token}`, {from:$('#gt-start').value, target:t});
    }
  });
  $('#gt-targets').addEventListener('change', (e)=>{
    if (!e.target.classList.contains('gt-unit-change')) return;
    const row = e.target.closest('.gt-target'); const i=+row.dataset.i;
    targets[i].unit = e.target.value; saveTargets();
  });

  $('#gt-add-target').addEventListener('click', ()=>{
    const tok = $('#gt-target').value.trim(); if (!tok){ toast('Enter target'); return; }
    const t = parseTownToken(tok) || {token:tok};
    const unit = $('#gt-unit').value;
    const entry = { token:tok, unit, id:t.id||null, name:t.name||tok, x:t.x??null, y:t.y??null, owner:t.owner||'-' };
    targets.push(entry); saveTargets();
    $('#gt-target').value='';
    logPush('plan', `Added target ${entry.name}`, entry);
  });
  $('#gt-calc-all').addEventListener('click', ()=>{
    const from = parseTownToken($('#gt-start').value.trim());
    if (!from){ toast('Pick start town'); return; }
    const ws=+$('#gt-worldspeed').value||1, buffs={poseidon:$('#gt-b-poseidon').checked, sails:$('#gt-b-sails').checked, captain:$('#gt-b-captain').checked};
    targets.forEach(t=>{
      if (t.x==null) return;
      const r = calcETA(from,t,t.unit,ws,buffs);
      logPush('calc', `ETA ${t.name}: ${hms(r.seconds)} (${r.eta.toLocaleString()})`, {start:$('#gt-start').value, target:t, res:r});
    });
    renderTargets();
    toast('Recalculated');
  });
  $('#gt-bbcode-all').addEventListener('click', ()=>{
    const from = $('#gt-start').value;
    const ws=+$('#gt-worldspeed').value||1;
    const buffs=['poseidon','sails','captain'].map(k=>$('#gt-b-'+k).checked?({poseidon:'Poseidon',sails:'Sails',captain:'Captain'})[k]:null).filter(Boolean).join(', ')||'none';
    const rows = targets.map(t=>{
      const tt = (t.name||t.token) + (t.id?` #${t.id}`:'') + (t.x!=null?` (${t.x}|${t.y})`:``);
      return `[tr][td]${tt}[/td][td]${t.unit}[/td][/tr]`;
    }).join('\n');
    const bb = `[table]
[**]Attack Planner — ${from}[/**]
[tr][td]World speed[/td][td]${ws}[/td][/tr]
[tr][td]Buffs[/td][td]${buffs}[/td][/tr]
${rows}
[/table]`;
    navigator.clipboard.writeText(bb).then(()=>{ toast('BBCode copied'); logPush('export','BBCode (all) copied',{count:targets.length}); });
  });
  $('#gt-export').addEventListener('click', ()=>{
    const data = { version:'1.0.0', start:$('#gt-start').value, ws:+$('#gt-worldspeed').value||1,
      buffs:{poseidon:$('#gt-b-poseidon').checked, sails:$('#gt-b-sails').checked, captain:$('#gt-b-captain').checked}, targets };
    navigator.clipboard.writeText(JSON.stringify(data)).then(()=>{ toast('JSON copied'); logPush('export','JSON copied',data); });
  });
  $('#gt-import').addEventListener('click', async ()=>{
    const txt = prompt('Paste JSON'); if (!txt) return;
    try{
      const data = JSON.parse(txt);
      if (data.start) $('#gt-start').value = data.start;
      if (data.ws) $('#gt-worldspeed').value = data.ws;
      if (data.buffs){ $('#gt-b-poseidon').checked=!!data.buffs.poseidon; $('#gt-b-sails').checked=!!data.buffs.sails; $('#gt-b-captain').checked=!!data.buffs.captain; }
      if (Array.isArray(data.targets)) targets = data.targets; saveTargets();
      toast('Imported'); logPush('import','Plan imported',data);
    }catch(e){ toast('Invalid JSON'); }
  });

  // minimap
  const mini = $('#gt-minimap');
  function drawMinimap(){
    const ctx = mini.getContext('2d');
    ctx.clearRect(0,0,mini.width,mini.height);
    ctx.strokeStyle='#2a241d'; ctx.lineWidth=1;
    for (let x=0;x<mini.width;x+=22){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,mini.height); ctx.stroke(); }
    for (let y=0;y<mini.height;y+=22){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(mini.width,y); ctx.stroke(); }
    const map = p => ({ x: (p.x/1000)*mini.width, y: (p.y/1000)*mini.height });
    const from = parseTownToken($('#gt-start').value.trim());
    if (from && from.x!=null){ const a=map(from); ctx.fillStyle='#00e676'; ctx.beginPath(); ctx.arc(a.x,a.y,4,0,Math.PI*2); ctx.fill(); }
    targets.forEach(t=>{ if (t.x==null) return; const b=map(t); const col = colorForUnit(t.unit); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(b.x,b.y,3,0,Math.PI*2); ctx.fill(); });
  }
  setInterval(drawMinimap, 1000);

  // ETA notifications
  setInterval(()=>{
    const from = parseTownToken($('#gt-start').value.trim()); if (!from) return;
    const ws=+$('#gt-worldspeed').value||1, buffs={poseidon:$('#gt-b-poseidon').checked, sails:$('#gt-b-sails').checked, captain:$('#gt-b-captain').checked};
    const mins = +$('#gt-notify-min').value || 30, threshold = mins*60;
    for (const t of targets){
      if (t.x==null) continue;
      const r = calcETA(from,t,t.unit,ws,buffs);
      if (r.seconds <= threshold) toast(`ETA ${t.name||t.token} in ${hms(r.seconds)}`);
    }
  }, 15000);

  /**********************
   *  FINDER
   **********************/
  const tbody = $('#gt-table tbody');
  function pushRow(city){
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${city.name||'-'} ${city.id?`<small>#${city.id}</small>`:''}</td>
                    <td>${city.owner||'-'}</td>
                    <td>${city.type||'-'}</td>
                    <td><span class="gt-btn" style="padding:2px 6px" data-fill="${(city.name||'')}${city.id?` #${city.id}`:''}">Use</span></td>`;
    tbody.appendChild(tr);
  }

  function scanVisibleIsland(){
    tbody.innerHTML=''; let found=0; const uniq=new Set(); const rows=[];
    const nodes = Array.from(document.querySelectorAll('.island_view .town_name, .island_town_name, .town_name_link, .island_info .towns li'));
    for (const el of nodes){
      const name = (el.textContent||'').trim(); if (!name || uniq.has(name)) continue; uniq.add(name);
      const wrap = el.closest('li, .town_row, .game_list_item') || el;
      const owner = (wrap.querySelector('.owner_name, .player_name, .owner')||{}).textContent?.trim() || '';
      const isGhost = !owner || owner==='-' || /ghost/i.test(owner);
      const id = +(wrap.getAttribute('data-townid')||wrap.dataset?.id||'0') || null;
      const x = +(wrap.getAttribute('data-x')||wrap.dataset?.x||'NaN'); const y = +(wrap.getAttribute('data-y')||wrap.dataset?.y||'NaN');
      const city = { id, name, owner: owner||'-', type: isGhost?'Ghost':'Town', x:isFinite(x)?x:null, y:isFinite(y)?y:null };
      rows.push(city);
    }
    rows.forEach(c=>{ pushRow(c); found++; });
    lastScannedTowns = dedupe(lastScannedTowns.concat(rows));
    LS.set(KEYS.cache, lastScannedTowns);
    toast(found?`Found ${found} towns on island`:'Open island panel and try again');
    logPush('scan', `Island scan: ${found} towns`, {found});
  }

  // in-game frontend_bridge (best effort)
  function fbCall(model_url, args){
    return new Promise((resolve)=>{
      try{
        const payload = {model_url, arguments: args||{}};
        const body = new URLSearchParams();
        body.set('json', JSON.stringify(payload));
        body.set('csrfToken', (window.Game && Game.csrfToken) || '');
        fetch('/game/frontend_bridge', {method:'POST', body, credentials:'same-origin'})
          .then(r=>r.json()).then(res=> resolve(res?.json || []))
          .catch(()=> resolve([]));
      }catch(_){ resolve([]); }
    });
  }
  async function findPlayerByNameOrId(q){
    if (!q) return null;
    if (/^\d+$/.test(q)) return {id:+q, name:`#${q}`};
    const rank = await fbCall('RankingPlayer', {search_text:q, page:0});
    const hit = (rank||[]).find(p=>(p.name||'').toLowerCase()===q.toLowerCase());
    return hit? {id:+hit.id, name:hit.name}: null;
  }
  async function getPlayerTowns(playerId){
    const list = await fbCall('PlayerTowns', {player_id:+playerId});
    return (list||[]).map(t=> ({id:+t.id, name:t.name, x:+t.x, y:+t.y, owner:t.player_name||'-', type:'Town', points:+(t.points||0)}));
  }
  async function findAllianceByNameOrId(q){
    if (!q) return null; if (/^\d+$/.test(q)) return {id:+q, name:`#${q}`};
    const rank = await fbCall('RankingAlliance', {search_text:q, page:0});
    const hit = (rank||[]).find(a=>(a.name||'').toLowerCase()===q.toLowerCase());
    return hit? {id:+hit.id, name:hit.name}: null;
  }
  async function getAllianceMembers(allianceId){
    const list = await fbCall('AllianceMember', {alliance_id:+allianceId, page:0});
    return (list||[]).map(m=> ({id:+m.player_id, name:m.player_name}));
  }
  async function getAllianceTowns(allianceId){
    const members = await getAllianceMembers(allianceId);
    const out=[]; for (const m of members){ const mt=await getPlayerTowns(m.id); mt.forEach(t=> out.push(t)); }
    return out;
  }
  async function ghostsNearStart(radius){
    const start = parseTownToken($('#gt-start').value.trim());
    if (!start || start.x==null) { toast('Set Start first'); return []; }
    const r = +radius || 100;
    const pool = [...lastScannedTowns];
    return pool.filter(t=> (!t.owner || t.owner==='-' || /ghost/i.test(t.owner)) && t.x!=null && Math.hypot(t.x-start.x, t.y-start.y)<=r)
               .map(t=> ({...t, type:'Ghost'}));
  }
  function applyFilters(rows){
    const onlyGhosts = $('#gt-only-ghosts').checked;
    const exAllies  = $('#gt-exclude-allies').checked;
    const maxp = +$('#gt-maxpoints').value || null;
    const namef = $('#gt-namefilter').value.trim().toLowerCase();
    let filtered = rows;
    if (onlyGhosts) filtered = filtered.filter(x=> !x.owner || x.owner==='-' || /ghost/i.test(x.owner) || x.type==='Ghost');
    if (exAllies && window.Game?.alliance_id){ filtered = filtered.filter(x=> (x.alliance_id||0) !== Game.alliance_id); }
    if (maxp) filtered = filtered.filter(x=> (x.points||0) <= maxp);
    if (namef) filtered = filtered.filter(x=> (x.name||'').toLowerCase().includes(namef));
    return filtered;
  }
  async function runFinder(){
    tbody.innerHTML = '';
    const mode = $('#gt-fmode').value;
    const q = $('#gt-fquery').value.trim();
    let rows = [];
    if (mode==='island'){ scanVisibleIsland(); return; }
    if (mode==='player'){
      const player = /^\d+$/.test(q) ? {id:+q, name:`#${q}`} : await findPlayerByNameOrId(q);
      if (!player){ toast('Player not found'); return; }
      rows = await getPlayerTowns(player.id);
    }
    if (mode==='alliance'){
      const ally = /^\d+$/.test(q) ? {id:+q, name:`#${q}`} : await findAllianceByNameOrId(q);
      if (!ally){ toast('Alliance not found'); return; }
      rows = await getAllianceTowns(ally.id);
    }
    if (mode==='ghosts_near'){ rows = await ghostsNearStart($('#gt-radius').value); }

    rows = applyFilters(rows);
    const uniq = new Map(); rows.forEach(x=> uniq.set(x.id||x.name, x));
    const out = Array.from(uniq.values());
    out.forEach(pushRow);
    lastScannedTowns = dedupe(lastScannedTowns.concat(out));
    LS.set(KEYS.cache, lastScannedTowns);
    toast(`Found ${out.length} towns`);
    logPush('scan', `Finder ${mode}: ${out.length} results`, {mode,q,count:out.length});
  }
  $('#gt-find').addEventListener('click', runFinder);
  $('#gt-clear').addEventListener('click', ()=> (tbody.innerHTML=''));
  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-fill]'); if (!btn) return;
    const token = btn.getAttribute('data-fill');
    $('#gt-target').value = token; toast('Target filled');
    $$('#gt-tabs .gt-tab').find(x=>x.dataset.tab==='planner').click();
  });

  /**********************
   *  SETTINGS / THEMES
   **********************/
  (function restoreSettings(){
    const s = LS.get(KEYS.settings, {});
    if (s.unit) $('#gt-unit').value = s.unit;
    if (s.ws)   $('#gt-worldspeed').value = s.ws;
    ['poseidon','sails','captain'].forEach(k=>{ const el=$('#gt-b-'+k); if (el && s[k]!=null) el.checked = !!s[k]; });
    if (s.theme) { document.body.classList.add('hs-theme-'+s.theme); $('#gt-theme').value=s.theme; }
  })();
  function saveSettings(){
    LS.set(KEYS.settings,{
      unit: $('#gt-unit').value,
      ws: +$('#gt-worldspeed').value || 1,
      poseidon: $('#gt-b-poseidon').checked,
      sails:    $('#gt-b-sails').checked,
      captain:  $('#gt-b-captain').checked,
      theme: $('#gt-theme').value
    });
  }
  $('#gt-theme').addEventListener('change', ()=>{
    document.body.classList.remove("hs-theme-goldblack","hs-theme-dark","hs-theme-classic");
    const t=$('#gt-theme').value; document.body.classList.add('hs-theme-'+t); saveSettings();
  });
  GM_addStyle(`
  body.hs-theme-goldblack{--hs-bg:#1d1a15;--hs-panel:#1f1b16;--hs-accent:#ffd257;--hs-text:#f1e4c2;--hs-border:#6d5a2f;background:#0f0e0c;}
  body.hs-theme-dark{--hs-bg:#0c0e12;--hs-panel:#10131a;--hs-accent:#7ed0ff;--hs-text:#e6f0ff;--hs-border:#2a3a53;background:#080a0f;}
  body.hs-theme-classic{--hs-bg:#171717;--hs-panel:#202020;--hs-accent:#f0f0f0;--hs-text:#f0f0f0;--hs-border:#3a3a3a;background:#121212;}
  `);

  /**********************
   *  INIT
   **********************/
  renderTargets(); renderLog(); updateStats(); setInterval(drawMinimap, 1000);

})();
