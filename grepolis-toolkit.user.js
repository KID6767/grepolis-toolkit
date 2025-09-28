// ==UserScript==
// @name         Grepolis Toolkit
// @namespace    https://github.com/KID6767/grepolis-toolkit
// @version      0.4
// @description  Toolkit: Nieaktywni, Ghost Towny, Symulator podróży z animowanymi trasami
// @author       Ty
// @match        https://*.grepolis.com/game/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = "grepolisToolkitData";

    // ------------------- FETCH DATA -------------------
    async function fetchWorldData() {
        const host = window.location.host;
        const baseUrl = `https://${host}/data`;

        try {
            const [playersRes, townsRes] = await Promise.all([
                fetch(`${baseUrl}/players.txt`),
                fetch(`${baseUrl}/towns.txt`)
            ]);

            const playersText = await playersRes.text();
            const townsText = await townsRes.text();

            const timestamp = new Date().toISOString();
            const snapshot = {
                timestamp,
                players: playersText,
                towns: townsText
            };

            let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            history.push(snapshot);
            if (history.length > 10) history.shift();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

            console.log("✅ Grepolis Toolkit v0.4 - dane pobrane:", snapshot);
        } catch (err) {
            console.error("❌ Błąd pobierania danych Grepolis:", err);
        }
    }

    // ------------------- TOOLKIT PANEL -------------------
    function addToolkitButton() {
        const menu = document.getElementById('ui_box');
        if (!menu) return;
        const btn = document.createElement('div');
        btn.innerText = '⚒ Toolkit';
        btn.style.cursor = 'pointer';
        btn.style.padding = '5px';
        btn.style.background = '#333';
        btn.style.color = '#fff';
        btn.onclick = () => showToolkitPanel();
        menu.appendChild(btn);
    }

    function showToolkitPanel() {
        const win = document.createElement('div');
        win.style.position = 'fixed';
        win.style.top = '100px';
        win.style.left = '100px';
        win.style.width = '500px';
        win.style.height = '400px';
        win.style.background = '#f8f8f8';
        win.style.border = '2px solid #444';
        win.style.zIndex = 9999;
        win.style.animation = 'fadeIn 0.5s';
        win.innerHTML = `
            <style>
            @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
            .tab { display:inline-block; padding:5px 10px; background:#ddd; margin:2px; cursor:pointer; }
            .tab.active { background:#444; color:#fff; }
            .tabContent { display:none; padding:10px; }
            </style>
            <div style="background:#444;color:#fff;padding:5px">⚒ Grepolis Toolkit v0.4</div>
            <div id="gtabs">
                <div class="tab active" data-tab="inactive">Nieaktywni</div>
                <div class="tab" data-tab="ghosts">Ghost Towny</div>
                <div class="tab" data-tab="simulator">Symulator</div>
            </div>
            <div id="gcontent">
                <div id="inactive" class="tabContent" style="display:block">Raport nieaktywnych - wkrótce</div>
                <div id="ghosts" class="tabContent">Lista ghostów - wkrótce</div>
                <div id="simulator" class="tabContent">
                    <label>Start (x|y): <input id="startCoords" placeholder="500|500"/></label><br/>
                    <label>Cel (x|y): <input id="targetCoords" placeholder="505|503"/></label><br/>
                    <label>Statek:
                        <select id="shipType">
                            <option value="colonize">Kolonizacyjny</option>
                            <option value="fire">Ogniowy</option>
                            <option value="bireme">Birem</option>
                            <option value="trireme">Trirem</option>
                            <option value="transport">Transportowy</option>
                        </select>
                    </label><br/>
                    <button id="simulateBtn">Symuluj</button>
                </div>
            </div>`;
        document.body.appendChild(win);

        // obsługa tabów
        win.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = () => {
                win.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                win.querySelectorAll('.tabContent').forEach(c => c.style.display = 'none');
                document.getElementById(tab.dataset.tab).style.display = 'block';
            };
        });

        // obsługa symulatora
        document.getElementById('simulateBtn').onclick = () => {
            const start = document.getElementById('startCoords').value.split('|').map(Number);
            const target = document.getElementById('targetCoords').value.split('|').map(Number);
            const ship = document.getElementById('shipType').value;
            if (start.length !== 2 || target.length !== 2) {
                alert("Podaj poprawne współrzędne");
                return;
            }
            drawRoute(start, target, ship);
        };
    }

    // ------------------- MAPA I LINIE -------------------
    function drawRoute(start, target, ship) {
        let overlay = document.getElementById("gtOverlay");
        if (!overlay) {
            overlay = document.createElement("canvas");
            overlay.id = "gtOverlay";
            overlay.width = window.innerWidth;
            overlay.height = window.innerHeight;
            overlay.style.position = "absolute";
            overlay.style.left = "0";
            overlay.style.top = "0";
            overlay.style.pointerEvents = "none";
            overlay.style.zIndex = 9998;
            document.body.appendChild(overlay);
        }
        const ctx = overlay.getContext("2d");
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        const colors = {
            colonize: "yellow",
            fire: "red",
            bireme: "white",
            trireme: "blue",
            transport: "brown"
        };

        const [x1, y1] = start;
        const [x2, y2] = target;

        let offset = 0;
        function animate() {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            ctx.setLineDash([10, 10]);
            ctx.lineDashOffset = -offset;
            ctx.beginPath();
            ctx.moveTo(x1 * 5, y1 * 5); // przeskalowane dla widoczności
            ctx.lineTo(x2 * 5, y2 * 5);
            ctx.strokeStyle = colors[ship] || "gray";
            ctx.lineWidth = 3;
            ctx.stroke();
            offset += 2;
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ------------------- START -------------------
    window.addEventListener('load', () => {
        addToolkitButton();
        fetchWorldData();
    });
})();