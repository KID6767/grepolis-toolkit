// ==UserScript==
// @name         Grepolis Toolkit
// @namespace    https://github.com/KID6767/grepolis-toolkit
$10.8
// @description  Planer atakĂłw, globalny finder (player/alliance/ghost), animowane trasy, BBCode v2 i historia kalkulacji
// @author       KID6767
// @match        https://*.grepolis.com/game/*
// @icon         https://github.com/KID6767/grepolis-toolkit/raw/main/assets/logo.svg
// @updateURL    https://github.com/KID6767/grepolis-toolkit/raw/main/grepolis-toolkit.user.js
// @downloadURL  https://github.com/KID6767/grepolis-toolkit/raw/main/grepolis-toolkit.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  /***********************
   *  STYLES & HELPERS   *
   ***********************/
  const CSS = `
  .gt-toast{position:fixed;right:18px;bottom:18px;background:rgba(20,18,15,.96);color:#f7e3b1;border:1px solid #6d5a2f;padding:10px 12px;border-radius:10px;z-index:999999;box-shadow:0 10px 24px rgba(0,0,0,.5)}
  .gt-btn{cursor:pointer;border-radius:10px;border:1px solid #6d5a2f;background:#1f1b16;color:#ffd257;font-weight:700;display:inline-flex;gap:6px;align-items:center;justify-content:center}
  #gt-panel{position:absolute;left:0;bottom:0;width:420px;max-height:70vh;overflow:auto;background:rgba(0,0,0,.88);border:1px solid #6d5a2f;border-radius:14px;color:#f1e4c2;z-index:9;display:none}
  #gt-panel header{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #6d5a2f}
  #gt-tabs{display:flex;gap:6px;padding:8px 10px}
  .gt-tab{flex:1;padding:8px 10px;text-align:center;border:1px solid #6d5a2f;border-radius:8px;background:#201b16;cursor:pointer}
  .gt-tab.active{background:#2a241d}
  .gt-sec{padding:10px 12px}
  .gt-field{margin-bottom:8px}
  .gt-field label{display:block;margin-bottom:4px;opacity:.9}
  .gt-input, .gt-select, .gt-text{width:100%;padding:6px 8px;border-radius:8px;border:1px solid #6d5a2f;background:#161310;color:#f1e4c2}
  .gt-row{display:flex;gap:8px}
  .gt-row > *{flex:1}
  .gt-actions{display:flex;gap:8px;margin-top:8px}
  .gt-table{width:100%;border-collapse:collapse;margin-top:6px}
  .gt-table th,.gt-table td{border-bottom:1px solid #443722;padding:6px 4px;text-align:left}
  .gt-badge-dot{width:12px;height:12px;border-radius:50%;background:#ffd257;display:inline-block;box-shadow:0 0 10px #ffd257aa}
  .gt-autocomplete{position:relative}
  .gt-autolist{position:absolute;left:0;right:0;top:100%;background:#1c1713;border:1px solid #6d5a2f;border-radius:8px;z-index:99999;max-height:240px;overflow:auto}
  .gt-autolist div{padding:6px 8px;cursor:pointer}
  .gt-autolist div:hover{background:#2a241d}
  canvas#gt-route{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:8}
  .gt-note{opacity:.75;font-size:12px}
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const LS = {
    get(k, def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch{ return def }},
    set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
  };

  function toast(msg){
    const t=document.createElement('div'); t.className='gt-toast'; t.textContent=msg;
    document.body.appendChild(t); setTimeout(()=>t.remove(),2300);
  }

  const $ = sel => document.querySelector(sel);

  /**************************
   *  PANEL UNDER "FORUM"   *
   **************************/
  const panel = document.createElement('div');
  panel.id = 'gt-panel';
  panel.innerHTML = `
    <header>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="gt-badge-dot"></span><b>Grepolis Toolkit</b>
      </div>
      <div class="gt-btn" id="gt-close" style="padding:4px 8px">âś–</div>
    </header>
    <div id="gt-tabs">
      <div class="gt-tab active" data-tab="planner">âš”ď¸Ź Planner</div>
      <div class="gt-tab" data-tab="finder">đź—şď¸Ź Finder</div>
      <div class="gt-tab" data-tab="history">đź§­ History</div>
    </div>

    <!-- PLANNER -->
    <section class="gt-sec" id="gt-planner">
      <div class="gt-field gt-autocomplete">
        <label>Start town (name or ID)</label>
        <input class="gt-input" id="gt-start" placeholder="e.g. Athens or 12345">
        <div class="gt-autolist" id="gt-start-list" style="display:none"></div>
      </div>
      <div class="gt-field gt-autocomplete">
        <label>Target town (name or ID)</label>
        <input class="gt-input" id="gt-target" placeholder="e.g. Sparta or 54321">
        <div class="gt-autolist" id="gt-target-list" style="display:none"></div>
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
          <label>World speed</label>
          <input class="gt-input" id="gt-worldspeed" type="number" min="1" step="0.1" value="1">
          <small class="gt-note">Auto-detected on load</small>
        </div>
      </div>

      <div class="gt-row">
        <div class="gt-field"><label><input type="checkbox" id="gt-b-poseidon"> Poseidon (+10%)</label></div>
        <div class="gt-field"><label><input type="checkbox" id="gt-b-sails"> Sails (+10%)</label></div>
        <div class="gt-field"><label><input type="checkbox" id="gt-b-captain"> Captain (+10%)</label></div>
      </div>

      <div class="gt-actions">
        <div class="gt-btn" id="gt-calc" style="flex:2;padding:8px">Calculate ETA</div>
        <div class="gt-btn" id="gt-bbcode" style="flex:1;padding:8px">BBCode</div>
      </div>
      <div id="gt-result" style="margin-top:8px;opacity:.95"></div>
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
            <option value="ghosts_near">Ghosts near start (beta)</option>
          </select>
        </div>
        <div class="gt-field">
          <label>Query (name or ID)</label>
          <input class="gt-input" id="gt-fquery" placeholder="Player/Alliance name or ID">
        </div>
      </div>
      <div class="gt-row">
        <div class="gt-field"><label><input type="checkbox" id="gt-only-ghosts"> Only ghost towns</label></div>
        <div class="gt-field"><label>Radius (for ghosts near)</label><input class="gt-input" id="gt-radius" type="number" value="100"></div>
      </div>

      <div class="gt-actions" style="margin-bottom:8px">
        <div class="gt-btn" id="gt-find" style="flex:2;padding:8px">Find</div>
        <div class="gt-btn" id="gt-clear" style="flex:1;padding:8px">Clear</div>
      </div>

      <table class="gt-table" id="gt-table">
        <thead><tr><th>Town</th><th>Owner</th><th>Type</th><th>â†’ Planner</th></tr></thead>
        <tbody></tbody>
      </table>
      <small class="gt-note">Island mode reads towns from the currently visible island in the UI. Player/Alliance modes query in-game models. Ghosts near uses local map probe (beta).</small>
    </section>

    <!-- HISTORY -->
    <section class="gt-sec" id="gt-history" style="display:none">
      <div id="gt-hlist"></div>
      <div class="gt-actions" style="margin-top:8px">
        <div class="gt-btn" id="gt-hclear" style="flex:1;padding:8px">Clear history</div>
      </div>
    </section>
  `;

  // mount panel under the left navi bar (under Forum block); fallback to body
  (function mountPanel() {
    const leftMenu = document.querySelector('#ui_box .navi_bar');
    if (leftMenu) {
      leftMenu.style.position = 'relative';
      leftMenu.appendChild(panel);
    } else {
      document.body.appendChild(panel);
      // fallback absolute position bottom-left
      panel.style.position = 'fixed';
      panel.style.left = '18px';
      panel.style.bottom = '18px';
    }
  })();

  // open/close
  function openPanel(){ panel.style.display='block'; panel.style.opacity='0'; setTimeout(()=>panel.style.opacity='1', 25); }
  function closePanel(){ panel.style.opacity='0'; setTimeout(()=>panel.style.display='none', 160); }
  $('#gt-close').addEventListener('click', closePanel);

  // add small launcher button under Forum (left bar)
  (function addLauncher(){
    const li = document.createElement('div');
    li.className = 'gt-btn';
    li.style.cssText = 'margin:8px 6px; padding:6px 10px; display:flex; gap:6px; align-items:center;';
    li.innerHTML = 'âš“ Toolkit';
    li.addEventListener('click', ()=> (panel.style.display==='none'?openPanel():closePanel()));
    const leftMenu = document.querySelector('#ui_box .navi_bar');
    (leftMenu || document.body).appendChild(li);
  })();

  /***********************
   *  DATA: TOWNS / UX   *
   ***********************/
  // my towns from in-game globals
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
        if (id && name) list.push({id, name, x, y, owner: Game.player_name, type:'Town'});
      }
      return list;
    }catch(e){ return []; }
  }

  // autocomplete
  function mountAutocomplete(inputEl, listEl, sourceFn){
    inputEl.addEventListener('input', ()=>{
      const q = inputEl.value.trim().toLowerCase();
      const data = sourceFn().filter(t=> (''+t.id).includes(q) || (t.name||'').toLowerCase().includes(q)).slice(0,80);
      listEl.innerHTML = data.map(t=>`<div data-id="${t.id}">${t.name} <small>#${t.id}${(t.x!=null&&t.y!=null)?` Â· ${t.x}|${t.y}`:''}</small></div>`).join('');
      listEl.style.display = data.length ? 'block':'none';
    });
    listEl.addEventListener('click', (e)=>{
      const row = e.target.closest('div[data-id]');
      if (!row) return;
      inputEl.value = row.textContent.trim();
      inputEl.dataset.id = row.dataset.id;
      listEl.style.display='none';
    });
    document.addEventListener('click', (e)=>{ if (!listEl.contains(e.target) && e.target!==inputEl) listEl.style.display='none'; });
  }

  // auto world speed
  (function autoWorldSpeed(){
    try{
      const ws = window.Game?.game_speed || window.Game?.world_speed || 1;
      const el = $('#gt-worldspeed');
      if (ws && el) el.value = ws;
    }catch(_){}
  })();

  // planners settings restore/save
  const SettingsKey = 'gt_settings';
  (function restoreSettings(){
    const s = LS.get(SettingsKey, {});
    if (s.unit) $('#gt-unit').value = s.unit;
    if (s.ws)   $('#gt-worldspeed').value = s.ws;
    ['poseidon','sails','captain'].forEach(k=>{
      const el=$('#gt-b-'+k); if (el && s[k]!=null) el.checked = !!s[k];
    });
  })();
  function saveSettings(){
    LS.set(SettingsKey,{
      unit: $('#gt-unit').value,
      ws: +$('#gt-worldspeed').value || 1,
      poseidon: $('#gt-b-poseidon').checked,
      sails:    $('#gt-b-sails').checked,
      captain:  $('#gt-b-captain').checked
    });
  }

  /***********************
   *  PLANNER / ROUTING  *
   ***********************/
  const SPEEDS = { // fields / sec (tune per world if needed)
    colonize: 0.20, fire: 0.30, bireme: 0.35, trireme: 0.32, transport: 0.25
  };

  // draw animated route
  const canvas = document.createElement('canvas'); canvas.id='gt-route'; document.body.appendChild(canvas);
  function syncCanvasSize(){ canvas.width=innerWidth; canvas.height=innerHeight; }
  window.addEventListener('resize', syncCanvasSize); syncCanvasSize();

  function colorForUnit(u){
    return {colonize:'#ffd200', fire:'#ff0033', bireme:'#ffffff', trireme:'#2a7cff', transport:'#8d6b3a'}[u] || '#ffd200';
  }

  function mapToScreen(p){
    // heuristic mapping (screen space) â€“ good enough for visual hint
    return { x: (p.x/1000)*canvas.width, y: (p.y/1000)*canvas.height };
  }

  function parseTownToken(token){
    if (!token) return null;
    const idMatch = (token.match(/#(\d+)/)||token.match(/^(\d+)$/)||[])[1];
    if (idMatch){
      const t = allTargets().find(x=>(''+x.id)===idMatch) || getMyTowns().find(x=>(''+x.id)===idMatch);
      if (t) return t;
      return {id:+idMatch, name:`#${idMatch}`};
    }
    const xy = (token.match(/(\d+)\s*\|\s*(\d+)/)||[]); // x|y
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

  function formatHMS(secs){
    const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

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

  // calculation + history
  const HistoryKey = 'gt_history';
  function pushHistory(entry){
    const arr = LS.get(HistoryKey, []);
    arr.unshift(entry);
    LS.set(HistoryKey, arr.slice(0,10));
    renderHistory();
  }
  function renderHistory(){
    const box = $('#gt-hlist'); if (!box) return;
    const arr = LS.get(HistoryKey, []);
    if (!arr.length){ box.innerHTML = '<div class="gt-note">Empty.</div>'; return; }
    box.innerHTML = arr.map(x=>`<div style="padding:6px 0;border-bottom:1px solid #443722">
      <div><b>${x.start}</b> â†’ <b>${x.target}</b> [${x.unit}]</div>
      <div class="gt-note">Dist ${x.dist} â€˘ ${x.hms} â€˘ ETA ${x.eta}</div>
    </div>`).join('');
  }
  $('#gt-hclear').addEventListener('click', ()=>{ LS.set(HistoryKey, []); renderHistory(); });

  $('#gt-calc').addEventListener('click', ()=>{
    const from = parseTownToken($('#gt-start').value.trim());
    const to   = parseTownToken($('#gt-target').value.trim());
    const unit = $('#gt-unit').value;
    const ws   = +$('#gt-worldspeed').value || 1;
    const buffs= {poseidon:$('#gt-b-poseidon').checked, sails:$('#gt-b-sails').checked, captain:$('#gt-b-captain').checked};
    if (!from || !to || from.x==null || to.x==null){ toast('Pick towns from list or provide ID/coords.'); return; }
    const r = calcETA(from,to,unit,ws,buffs);
    const hms = formatHMS(r.seconds);
    $('#gt-result').innerHTML =
      `Distance: <b>${r.dist}</b> fields â€˘ Time: <b>${hms}</b><br>ETA: <b>${r.eta.toLocaleString()}</b>`;
    drawRoute(from,to,unit);
    saveSettings();
    pushHistory({start:$('#gt-start').value, target:$('#gt-target').value, unit, dist:r.dist, hms, eta:r.eta.toLocaleString()});
  });

  $('#gt-bbcode').addEventListener('click', ()=>{
    const s=$('#gt-start').value, t=$('#gt-target').value;
    const u=$('#gt-unit').value, ws=+$('#gt-worldspeed').value||1;
    const buffs=['poseidon','sails','captain'].filter(k=>$('#gt-b-'+k).checked).map(k=>({poseidon:'Poseidon',sails:'Sails',captain:'Captain'})[k]).join(', ')||'none';
    const bb = `[table]
[**]Attack Planner[/**]
[tr][td]Start[/td][td]${s}[/td][/tr]
[tr][td]Target[/td][td]${t}[/td][/tr]
[tr][td]Unit[/td][td]${u}[/td][/tr]
[tr][td]World speed[/td][td]${ws}[/td][/tr]
[tr][td]Buffs[/td][td]${buffs}[/td][/tr]
[/table]`;
    navigator.clipboard.writeText(bb).then(()=>toast('BBCode copied to clipboard'));
  });

  /***********************
   *  FINDER (GLOBAL)    *
   ***********************/
  const tbody = $('#gt-table tbody');
  let lastScannedTowns = []; // cache for target autocomplete

  function pushRow(city){
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${city.name||'-'} ${city.id?`<small>#${city.id}</small>`:''}</td>
                    <td>${city.owner||'-'}</td>
                    <td>${city.type||'-'}</td>
                    <td><span class="gt-btn" style="padding:2px 6px" data-fill="${(city.name||'')}${city.id?` #${city.id}`:''}">Use</span></td>`;
    tbody.appendChild(tr);
  }

  function scanVisibleIsland(){
    tbody.innerHTML=''; lastScannedTowns = [];
    let found=0;
    const candidates = Array.from(document.querySelectorAll('.island_view .town_name, .island_town_name, .town_name_link, .island_info .towns li'));
    const uniq = new Set();
    for (const el of candidates){
      const name = (el.textContent||'').trim();
      if (!name || uniq.has(name)) continue;
      uniq.add(name);
      const wrap = el.closest('li, .town_row, .game_list_item') || el;
      const owner = (wrap.querySelector('.owner_name, .player_name, .owner')||{}).textContent?.trim() || '';
      const isGhost = !owner || owner==='-' || /ghost/i.test(owner);
      const id = +(wrap.getAttribute('data-townid')||wrap.dataset?.id||'0') || null;
      const city = { id, name, owner: owner||'-', type: isGhost?'Ghost':'Town', display: `${name}${id?` #${id}`:''}` };
      pushRow(city); found++; lastScannedTowns.push(city);
    }
    toast(found?`Found ${found} towns on visible island`:'Open island panel and try again');
  }

  // in-game models (same-origin)
  function fbCall(model_url, args){
    return new Promise((resolve,reject)=>{
      const payload = {model_url, arguments: args||{}};
      const body = new URLSearchParams();
      body.set('json', JSON.stringify(payload));
      body.set('csrfToken', (window.Game && Game.csrfToken) || '');
      fetch('/game/frontend_bridge', {method:'POST', body, credentials:'same-origin'})
        .then(r=>r.json()).then(res=>{
          if (res && res.json) resolve(res.json);
          else resolve([]);
        }).catch(err=>{ console.error(err); resolve([]); });
    });
  }

  async function findPlayerByNameOrId(q){
    if (!q) return null;
    if (/^\d+$/.test(q)) return {id:+q, name:`#${q}`};
    // try Player model (lightweight) â€“ some builds expose it, fallback to Ranking
    const rank = await fbCall('RankingPlayer', {search_text:q, page:0}); // best-effort
    const hit = (rank||[]).find(p=>(p.name||'').toLowerCase()===q.toLowerCase());
    return hit? {id:+hit.id, name:hit.name}: null;
  }

  async function getPlayerTowns(playerId){
    const list = await fbCall('PlayerTowns', {player_id:+playerId});
    return (list||[]).map(t=> ({id:+t.id, name:t.name, x:+t.x, y:+t.y, owner:t.player_name||'-', type:'Town'}));
  }

  async function findAllianceByNameOrId(q){
    if (!q) return null;
    if (/^\d+$/.test(q)) return {id:+q, name:`#${q}`};
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
    const towns = [];
    for (const m of members){
      const mt = await getPlayerTowns(m.id);
      mt.forEach(t=> towns.push(t));
    }
    return towns;
  }

  // ghosts near start (beta): probe around start coords by sampling visible DOM tiles the user visits
  async function ghostsNearStart(radius){
    // best-effort: use lastScannedTowns cache (visible islands user browsed) and filter by owner
    const start = parseTownToken($('#gt-start').value.trim());
    if (!start || start.x==null) { toast('Set Start town first'); return []; }
    const r = +radius || 100;
    const pool = [...lastScannedTowns]; // islands seen by user
    return pool.filter(t=> (!t.owner || t.owner==='-' || /ghost/i.test(t.owner)) && t.x!=null && Math.hypot(t.x-start.x, t.y-start.y)<=r)
               .map(t=> ({...t, type:'Ghost'}));
  }

  async function runFinder(){
    tbody.innerHTML = '';
    const mode = $('#gt-fmode').value;
    const onlyGhosts = $('#gt-only-ghosts').checked;
    const q = $('#gt-fquery').value.trim();
    let rows = [];

    if (mode==='island'){
      scanVisibleIsland();
      return;
    }
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
    if (mode==='ghosts_near'){
      rows = await ghostsNearStart($('#gt-radius').value);
    }

    if (onlyGhosts) rows = rows.filter(x=> !x.owner || x.owner==='-' || /ghost/i.test(x.owner) || x.type==='Ghost');

    const uniq = new Map();
    rows.forEach(x=> uniq.set(x.id||x.name, x));
    const out = Array.from(uniq.values());
    out.forEach(pushRow);
    lastScannedTowns = dedupeTargets(lastScannedTowns.concat(out));
    toast(`Found ${out.length} towns`);
  }

  $('#gt-find').addEventListener('click', runFinder);
  $('#gt-clear').addEventListener('click', ()=> (tbody.innerHTML=''));

  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-fill]');
    if (!btn) return;
    const token = btn.getAttribute('data-fill');
    $('#gt-target').value = token;
    toast('Target filled in Planner');
    switchTab('planner');
  });

  /***********************
   *  AUTOCOMPLETE SOURCES
   ***********************/
  function dedupeTargets(arr){
    const m=new Map(); arr.forEach(x=> m.set((x.id||x.name)+'', x)); return Array.from(m.values());
  }
  function allTargets(){
    // my towns + cached towns from finder
    return dedupeTargets(getMyTowns().concat(lastScannedTowns));
  }
  mountAutocomplete($('#gt-start'),  $('#gt-start-list'),  ()=>getMyTowns());
  mountAutocomplete($('#gt-target'), $('#gt-target-list'), ()=>allTargets());

  /***********************
   *  TABS               *
   ***********************/
  function switchTab(name){
    document.querySelectorAll('.gt-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
    $('#gt-planner').style.display = (name==='planner')?'block':'none';
    $('#gt-finder').style.display  = (name==='finder')?'block':'none';
    $('#gt-history').style.display = (name==='history')?'block':'none';
  }
  document.querySelectorAll('.gt-tab').forEach(t=> t.addEventListener('click', ()=>switchTab(t.dataset.tab)));
  renderHistory();

  // small welcome
  setTimeout(()=> toast('Grepolis Toolkit v0.8 ready'), 800);
})();

