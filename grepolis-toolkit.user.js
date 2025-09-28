ď»ż// ==UserScript==
// @name         Grepolis Toolkit
// @namespace    https://github.com/TwojNick/grepolis-toolkit
// @version      0.1
// @description  Ikona + panel z trzema zakĹ‚adkami (Nieaktywni, Ghost Towny, Symulator)
// @author       Ty
// @match        https://*.grepolis.com/game/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addToolkitButton() {
        const menu = document.getElementById('ui_box'); // proste miejsce testowe
        if (!menu) return;
        const btn = document.createElement('div');
        btn.innerText = 'âš’ Toolkit';
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
        win.style.width = '400px';
        win.style.height = '300px';
        win.style.background = '#f8f8f8';
        win.style.border = '2px solid #444';
        win.style.zIndex = 9999;
        win.innerHTML = `
            <div style="background:#444;color:#fff;padding:5px">Grepolis Toolkit v0.1</div>
            <div style="padding:10px">
                <button onclick="alert('Nieaktywni â€“ jeszcze nie zaimplementowane')">Nieaktywni</button>
                <button onclick="alert('Ghost Towny â€“ jeszcze nie zaimplementowane')">Ghost Towny</button>
                <button onclick="alert('Symulator â€“ jeszcze nie zaimplementowane')">Symulator</button>
            </div>`;
        document.body.appendChild(win);
    }

    window.addEventListener('load', addToolkitButton);
})();
