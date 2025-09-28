// ==UserScript==
// @name         Grepolis Toolkit
// @namespace    https://github.com/KID6767/grepolis-toolkit
// @version      0.6
// @description  Planer ataków, nieaktywni gracze, ghost towns i więcej
// @author       KID6767 & ChatGPT
// @match        https://*.grepolis.com/game/*
// @icon         https://github.com/KID6767/grepolis-toolkit/raw/main/assets/logo.svg
// @updateURL    https://github.com/KID6767/grepolis-toolkit/raw/main/grepolis-toolkit.user.js
// @downloadURL  https://github.com/KID6767/grepolis-toolkit/raw/main/grepolis-toolkit.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Dodajemy ikonkę do interfejsu
    const menu = document.querySelector('#ui_box'); // główny UI
    const btn = document.createElement('div');
    btn.innerHTML = '⚔️ Toolkit';
    btn.style.cssText = `
        cursor:pointer;
        background:#222;
        color:#f5c400;
        padding:5px 10px;
        border-radius:6px;
        margin:5px;
        text-align:center;
    `;
    menu.appendChild(btn);

    // Panel
    const panel = document.createElement('div');
    panel.id = "toolkitPanel";
    panel.innerHTML = `
        <div style="padding:10px;color:white;">
            <h3>Planer Ataków</h3>
            <label>Miasto startowe: <input id="startCity" type="text" placeholder="123|456"></label><br>
            <label>Miasto docelowe: <input id="targetCity" type="text" placeholder="321|654"></label><br>
            <label>Jednostka:
                <select id="unit">
                  <option value="colony">Kolonizacyjny</option>
                  <option value="fire">Ognisty</option>
                  <option value="bireme">Birema</option>
                  <option value="trireme">Trirema</option>
                  <option value="transport">Transportowy</option>
                </select>
            </label><br>
            <button id="calcBtn">Oblicz ETA</button>
        </div>
    `;
    panel.style.cssText = `
        display:none;
        position:absolute;
        top:100px;right:50px;
        width:250px;
        background:rgba(0,0,0,0.85);
        border-radius:12px;
        z-index:9999;
        transition: all 0.4s ease-in-out;
    `;
    document.body.appendChild(panel);

    // Obsługa kliknięcia
    btn.addEventListener('click', () => {
        if (panel.style.display === "none") {
            panel.style.display = "block";
            panel.style.opacity = "0";
            setTimeout(()=> panel.style.opacity = "1", 50);
        } else {
            panel.style.opacity = "0";
            setTimeout(()=> panel.style.display = "none", 400);
        }
    });
})();
