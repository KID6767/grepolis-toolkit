// ==UserScript==
// @name         Grepolis Toolkit
// @namespace    https://github.com/KID6767/grepolis-toolkit
// @version      0.7
// @description  Planer ataków, wyszukiwarka ghostów/nieaktywnych, animowane trasy i BBCode
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
  #gt-badge{position:absolute;z-index:99998;padding:6px 9px}
  #gt-panel{position:fixed;right:18px;bottom:18px;width:380px;max-height:80vh;overflow:auto;background:rgba(0,0,0,.85);border:1px solid #6d5a2f;border-radius:14px;color:#f1e4c2;z-index:99997;display:none}
  #gt-panel header{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #6d5a2f}
  #gt-tabs{display:flex;gap:6px;padding:8px 10px}
  .gt-tab{flex:1;padding:8px 10px;text-align:center;border:1px solid #6d5a2f;border-radius:8px;background:#201b16;cursor:pointer}
  .gt-tab.active{background:#2a241d}
  .gt-sec{padding:10px 12px}
  .gt-field{margin-bottom:8px}
  .gt-field label{display:block;margin-bottom:4px;opacity:.9}
  .gt-input, .gt-select{width:100%;padding:6px 8px;border-radius:8px;border:1px solid #6d5a2f;background:#161310;color:#f1e4c2}
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
  canvas#gt-route{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:9990}
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
    document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
  }

  /***********************
   *  UI: BADGE + PANEL  *
   ***********************/
  const panel = document.createElement('div');
  panel.id = 'gt-panel';
  panel.innerHTML = `
    <header>
      <div style="display:flex;align-items:center;gap:8px"><span class="gt-badge-dot"></span><b>Grepolis Toolkit</b></div>
      <div class="gt-btn" id="gt-close" style="padding:4px 8px">✖</div>
    </header>
    <div id="gt-tabs">
      <div class="gt-tab active" data-tab="planner">⚔️ Planer</div>
      <div class="gt-tab" data-tab="finder">🗺️ Finder</div>
    </div>
    <section class="gt-sec" id="gt-planner">
      <div class="gt-field gt-autocomplete">
        <label>Miasto startowe (nazwa lub ID)</label>
        <input class="gt-input" id="gt-start" placeholder="np. Ateny / 12345">
        <div class="gt-autolist" id="gt-start-list" style="display:none"></div>
      </div>
      <div class="gt-field gt-autocomplete">
        <label>Miasto docelowe (nazwa lub ID)</label>
        <input class="gt-input" id="gt-target" placeholder="np. Sparta / 54321">
        <div class="gt-autolist" id="gt-target-list" style="display:none"></div>
      </div>

      <div class="gt-row">
        <div class="gt-field">
          <label>Jednostka</label>
          <select class="gt-select" id="gt-unit">
            <option value="colonize">Statek kolonizacyjny</option>
            <option value="fire">Statek ogniowy</option>
            <option value="bireme">Birema</option>
            <option value="trireme">Trirema</option>
            <option value="transport">Transportowiec</option>
          </select>
        </div>
        <div class="gt-field">
          <label>Prędkość świata</label>
          <input class="gt-input" id="gt-worldspeed" type="number" min="1" step="0.1" value="1">
        </div>
      </div>

      <div class="gt-row">
        <div class="gt-field"><label><input type="checkbox" id="gt-b-poseidon"> Posejdon (+10%)</label></div>
        <div class="gt-field"><label><input type="checkbox" id="gt-b-sails"> Żagle (+10%)</label></div>
        <div class="gt-field"><label><input type="checkbox" id="gt-b-captain"> Kapitan (+10%)</label></div>
      </div>

      <div class="gt-actions">
        <div class="gt-btn" id="gt-calc" style="flex:2;padding:8px">Oblicz ETA</div>
        <div class="gt-btn" id="gt-bbcode" style="flex:1;padding:8px">BBCode</div>
      </div>
      <div id="gt-result" style="margin-top:8px;opacity:.95"></div>
    </section>

    <section class="gt-sec" id="gt-finder" style="display:none">
      <div class="gt-actions" style="margin-bottom:8px">
        <div class="gt-btn" id="gt-scan-island" style="flex:2;padding:8px">Skanuj widoczną wyspę</div>
        <div class="gt-btn" id="gt-clear" style="flex:1;padding:8px">Wyczyść</div>
      </div>
      <table class="gt-table" id="gt-table">
        <thead><tr><th>Miasto</th><th>Właściciel</th><th>Typ</th><th>→ Planer</th></tr></thead>
        <tbody></tbody>
      </table>
      <small style="opacity:.75">Wskazówka: skaner czyta DOM aktualnie widocznej wyspy (lista miast).</small>
    </section>
  `;
  document.body.appendChild(panel);

  // BADGE przy portrecie (spróbuj przypiąć do „krążka” dowódcy; fallback: prawy-dolny róg)
  const badge = document.createElement('div');
  badge.id = 'gt-badge';
  badge.className = 'gt-btn';
  badge.textContent = '⚓ GT';
  document.body.appendChild(badge);

  function mountBadgeNearPortrait() {
    // lista kandydatów – różne skórki gry mają różne klasy
    const candidates = [
      '.advisor_frame',              // okrągły portret doradcy
      '#ui_advisor',                 // niektóre światy
      '.ui_box .circle',             // generycznie
      '.portrait'                    // fallback
    ];
    let host=null;
    for (const sel of candidates){
      const el=document.querySelector(sel);
      if (el){ host=el; break; }
    }
    if (host){
      const r = host.getBoundingClientRect();
      badge.style.position='fixed';
      badge.style.left = (r.left - 28)+'px'; // tuż z lewej strony portretu (miejsce na screenie)
      badge.style.top  = (r.top + 12)+'px';
    } else {
      // fallback – prawy/dolny róg
      badge.style.position='fixed';
      badge.style.right='18px';
      badge.style.bottom='18px';
    }
  }
  mountBadgeNearPortrait();
  window.addEventListener('resize', mountBadgeNearPortrait);

  // toggle panel
  const openPanel = () => { panel.style.display='block'; panel.style.opacity='0'; setTimeout(()=>panel.style.opacity='1', 15); };
  const closePanel= () => { panel.style.opacity='0'; setTimeout(()=>panel.style.display='none', 180); };
  badge.addEventListener('click', ()=> panel.style.display==='none' ? openPanel() : closePanel());
  panel.querySelector('#gt-close').addEventListener('click', closePanel);

  /***********************
   *  DATA: TOWNS / UX   *
   ***********************/
  // pobierz listę miast gracza z globali gry (jeśli dostępne)
  function getMyTowns(){
    try{
      // typowo w Grepolis dostępne jest ITowns._byId lub ITowns.towns
      const list = [];
      const towns = (window.ITowns && (ITowns._byId || ITowns.towns)) || {};
      for (const k in towns){
        const t = towns[k] || {};
        const id = +t.id || +k;
        const name = t.name || t.attributes?.name;
        const x = t.x || t.attributes?.x;
        const y = t.y || t.attributes?.y;
        if (id && name) list.push({id, name, x, y});
      }
      return list;
    }catch(e){ return []; }
  }

  function mountAutocomplete(inputEl, listEl, sourceFn){
    inputEl.addEventListener('input', ()=>{
      const q = inputEl.value.trim().toLowerCase();
      const data = sourceFn().filter(t=> (''+t.id).includes(q) || (t.name||'').toLowerCase().includes(q)).slice(0,50);
      listEl.innerHTML = data.map(t=>`<div data-id="${t.id}">${t.name} <small>#${t.id}${(t.x!=null&&t.y!=null)?` · ${t.x}|${t.y}`:''}</small></div>`).join('');
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

  const myTowns = ()=> getMyTowns();
  mountAutocomplete(document.getElementById('gt-start'),  document.getElementById('gt-start-list'),  myTowns);
  mountAutocomplete(document.getElementById('gt-target'), document.getElementById('gt-target-list'), myTowns);

  // zapamiętywanie ustawień
  (function restoreSettings(){
    const s = LS.get('gt_settings', {});
    if (s.unit) document.getElementById('gt-unit').value = s.unit;
    if (s.ws)   document.getElementById('gt-worldspeed').value = s.ws;
    ['poseidon','sails','captain'].forEach(k=>{
      const el=document.getElementById('gt-b-'+k);
      if (el && s[k]!=null) el.checked = !!s[k];
    });
  })();
  function saveSettings(){
    LS.set('gt_settings',{
      unit: document.getElementById('gt-unit').value,
      ws: +document.getElementById('gt-worldspeed').value || 1,
      poseidon: document.getElementById('gt-b-poseidon').checked,
      sails:    document.getElementById('gt-b-sails').checked,
      captain:  document.getElementById('gt-b-captain').checked
    });
  }

  /***********************
   *  PLANNER / ROUTING  *
   ***********************/
  const SPEEDS = { // pola/sek (umowne – dopasujesz na świecie)
    colonize: 0.20, fire: 0.30, bireme: 0.35, trireme: 0.32, transport: 0.25
  };

  // płótno do rysowania tras
  const canvas = document.createElement('canvas'); canvas.id='gt-route'; document.body.appendChild(canvas);
  function syncCanvasSize(){ canvas.width=innerWidth; canvas.height=innerHeight; }
  window.addEventListener('resize', syncCanvasSize); syncCanvasSize();

  function colorForUnit(u){
    return {colonize:'#ffd200', fire:'#ff0033', bireme:'#ffffff', trireme:'#2a7cff', transport:'#8d6b3a'}[u] || '#ffd200';
  }

  function parseTownToken(token){
    // akceptuje "Nazwa #12345 · x|y" lub samo ID; spróbuje dopasować z myTowns
    const idMatch = (token.match(/#(\d+)/)||token.match(/^(\d+)$/)||[])[1];
    if (idMatch){
      const t = myTowns().find(x=>(''+x.id)===idMatch);
      if (t) return t;
      return {id:+idMatch, name:`#${idMatch}`};
    }
    const xy = (token.match(/(\d+)\s*\|\s*(\d+)/)||[]); // x|y
    const byName = myTowns().find(x=>(x.name||'').toLowerCase()===token.toLowerCase());
    if (byName) return byName;
    if (xy[1]) return {id:null,name:token,x:+xy[1],y:+xy[2]};
    return null;
  }

  function calcETA(from, to, unit, worldSpeed, buffs){
    // dystans w "polach"; czas = dystans / (speed * worldSpeed * buff)
    const dx=(to.x-from.x), dy=(to.y-from.y), dist=Math.hypot(dx,dy);
    let v = (SPEEDS[unit]||0.2) * (worldSpeed||1);
    if (buffs.poseidon) v*=1.10; if (buffs.sails) v*=1.10; if (buffs.captain) v*=1.10;
    const seconds = dist / v;
    const eta = new Date(Date.now() + seconds*1000);
    return {dist: +dist.toFixed(2), seconds: Math.round(seconds), eta};
  }

  function drawRoute(from, to, unit){
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (!from || !to || from.x==null || to.x==null) return;
    // bardzo uproszczony mapping współrzędnych gry na ekran (heurystyka: środek ekranu to środek świata bazowo)
    const map = p => ({ x: (p.x/1000)*canvas.width, y: (p.y/1000)*canvas.height });
    const a=map(from), b=map(to);
    const col = colorForUnit(unit);
    ctx.lineWidth=3; ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    // animowana kropka
    let t=0; const dot = ()=>{ t=(t+0.01)%1; const x=a.x+(b.x-a.x)*t, y=a.y+(b.y-a.y)*t;
      ctx.clearRect(0,0,canvas.width,canvas.height); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill(); anim=requestAnimationFrame(dot); };
    if (window.gtAnim) cancelAnimationFrame(window.gtAnim); window.gtAnim=requestAnimationFrame(dot);
  }

  document.getElementById('gt-calc').addEventListener('click', ()=>{
    const from = parseTownToken(document.getElementById('gt-start').value.trim());
    const to   = parseTownToken(document.getElementById('gt-target').value.trim());
    const unit = document.getElementById('gt-unit').value;
    const ws   = +document.getElementById('gt-worldspeed').value || 1;
    const buffs= {poseidon:gt('gt-b-poseidon').checked, sails:gt('gt-b-sails').checked, captain:gt('gt-b-captain').checked};
    if (!from || !to || from.x==null || to.x==null){ toast('Wybierz miasta z listy lub podaj ID/koordy.'); return; }
    const r = calcETA(from,to,unit,ws,buffs);
    document.getElementById('gt-result').innerHTML =
      `Dystans: <b>${r.dist}</b> pól • Czas: <b>${r.seconds}s</b><br>ETA: <b>${r.eta.toLocaleString()}</b>`;
    drawRoute(from,to,unit);
    saveSettings();
  });

  document.getElementById('gt-bbcode').addEventListener('click', ()=>{
    const s=document.getElementById('gt-start').value, t=document.getElementById('gt-target').value;
    const u=document.getElementById('gt-unit').value;
    const ws=+document.getElementById('gt-worldspeed').value||1;
    const buffs=['poseidon','sails','captain'].filter(k=>gt('gt-b-'+k).checked).map(k=>({poseidon:'Posejdon',sails:'Żagle',captain:'Kapitan'})[k]).join(', ')||'brak';
    const bb = `[table]
[**]Planer ataków[/**]
[tr][td]Start[/td][td]${s}[/td][/tr]
[tr][td]Cel[/td][td]${t}[/td][/tr]
[tr][td]Jednostka[/td][td]${u}[/td][/tr]
[tr][td]Prędkość świata[/td][td]${ws}[/td][/tr]
[tr][td]Buffy[/td][td]${buffs}[/td][/tr]
[/table]`;
    navigator.clipboard.writeText(bb).then(()=>toast('BBCode skopiowany do schowka'));
  });

  function gt(id){ return document.getElementById(id) }

  /***********************
   *  FINDER (ISLAND)    *
   ***********************/
  const tbody = document.querySelector('#gt-table tbody');

  function pushRow(city){
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${city.name||'-'} ${city.id?`<small>#${city.id}</small>`:''}</td>
                    <td>${city.owner||'-'}</td>
                    <td>${city.type||'-'}</td>
                    <td><span class="gt-btn" style="padding:2px 6px" data-fill="${city.display}">Ustaw</span></td>`;
    tbody.appendChild(tr);
  }

  // heurystyczny skaner DOM widocznej wyspy (czyta listę miast z panelu gry, jeśli jest rozwinięta)
  function scanVisibleIsland(){
    tbody.innerHTML='';
    let found=0;
    // szukamy elementów zawierających miasta na wyspie – różne klasy w zależności od builda
    const candidates = Array.from(document.querySelectorAll('.island_view .town_name, .island_town_name, .town_name_link, .island_info .towns li'));
    const uniq = new Set();
    for (const el of candidates){
      const name = (el.textContent||'').trim();
      if (!name || uniq.has(name)) continue;
      uniq.add(name);
      const wrap = el.closest('li, .town_row, .game_list_item') || el;
      const owner = (wrap.querySelector('.owner_name, .player_name, .owner')||{}).textContent?.trim() || '';
      const isGhost = !owner || owner==='-';
      const id = +(wrap.getAttribute('data-townid')||wrap.dataset?.id||'0') || null;
      const city = { id, name, owner: owner||'-', type: isGhost?'Ghost':'Miasto', display: `${name}${id?` #${id}`:''}` };
      pushRow(city); found++;
    }
    toast(found?`Znaleziono ${found} miast na widocznej wyspie`:'Nie znaleziono listy miast – otwórz panel wyspy i spróbuj ponownie');
  }

  document.getElementById('gt-scan-island').addEventListener('click', scanVisibleIsland);
  document.getElementById('gt-clear').addEventListener('click', ()=> (tbody.innerHTML=''));
  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-fill]');
    if (!btn) return;
    const token = btn.getAttribute('data-fill');
    document.getElementById('gt-target').value = token;
    toast('Ustawiono cel w Planerze');
    // przełącz na kartę Planer
    switchTab('planner');
  });

  /***********************
   *  TABS               *
   ***********************/
  function switchTab(name){
    document.querySelectorAll('.gt-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
    document.getElementById('gt-planner').style.display = (name==='planner')?'block':'none';
    document.getElementById('gt-finder').style.display  = (name==='finder')?'block':'none';
  }
  document.querySelectorAll('.gt-tab').forEach(t=> t.addEventListener('click', ()=>switchTab(t.dataset.tab)));

  // mały „welcome”
  setTimeout(()=> toast('Grepolis Toolkit v0.7 gotowy'), 800);
})();
