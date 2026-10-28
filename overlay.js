/* RiftPulse — overlay personal de espectador.
   Se inyecta sobre el reproductor (twitch.tv / lolesports.com), SOLO lo ve el usuario.
   Usa window.RiftEngine (engine.js, cargado antes). Sin APIs de Chrome: corre igual en
   una página de prueba. Shadow DOM para no chocar con el CSS del sitio. */
(function () {
  'use strict';
  if (!window.RiftEngine) { console.warn('[RiftPulse] falta engine.js'); return; }
  if (document.getElementById('rp-overlay-host')) return;  // no duplicar
  var R = window.RiftEngine;

  var POSKEY = 'rp_overlay_pos', COLKEY = 'rp_overlay_col';
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------- host + shadow ----------
  var host = document.createElement('div');
  host.id = 'rp-overlay-host';
  host.style.cssText = 'position:fixed;z-index:2147483646;top:16px;right:16px;width:300px;max-width:92vw;';
  (document.body || document.documentElement).appendChild(host);
  var sh = host.attachShadow({mode: 'open'});

  // Mantener el overlay visible en pantalla completa: el navegador solo pinta el elemento
  // en fullscreen y sus descendientes, así que re-parentamos el host ahí (y lo devolvemos al salir).
  function rpFullscreen() {
    var fs = document.fullscreenElement || document.webkitFullscreenElement || null;
    var dest = fs || document.body;
    if (dest && host.parentNode !== dest) dest.appendChild(host);  // appendChild mueve el nodo: conserva Shadow DOM, listeners y estado
  }
  document.addEventListener('fullscreenchange', rpFullscreen);
  document.addEventListener('webkitfullscreenchange', rpFullscreen);

  var CSS = '\
  :host{all:initial}\
  *{box-sizing:border-box;font-family:"Chakra Petch",system-ui,Segoe UI,Roboto,sans-serif}\
  .w{background:linear-gradient(180deg,rgba(18,26,42,.94),rgba(11,16,26,.94));border:1px solid #263352;border-radius:14px;\
     box-shadow:0 14px 40px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05);color:#e8edf7;overflow:hidden;backdrop-filter:blur(8px)}\
  .hd{display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:grab;user-select:none;background:rgba(255,255,255,.03);border-bottom:1px solid #1b2439}\
  .hd.drag{cursor:grabbing}\
  .logo{width:19px;height:19px;flex:none;display:block}\
  .ttl{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#cdd7ea}\
  .sp{flex:1}\
  .ic{width:22px;height:22px;border:1px solid #2a3654;border-radius:6px;background:transparent;color:#8b97b0;font-size:12px;cursor:pointer;display:grid;place-items:center;padding:0}\
  .ic:hover{color:#e8edf7;border-color:#4aa3ff}\
  .bd{padding:10px}\
  .teams{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px}\
  .tc{font-size:17px;font-weight:700;letter-spacing:.4px;font-variant-numeric:tabular-nums}\
  .tc.b{color:#7cc0ff}.tc.r{color:#ff8a8f}\
  .sc{font-size:14px;font-weight:700;color:#cdd7ea;font-variant-numeric:tabular-nums;background:#0d1320;border:1px solid #1b2439;border-radius:6px;padding:2px 8px}\
  .bar{display:flex;height:26px;border-radius:7px;overflow:hidden;font-weight:700;font-size:13px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}\
  .bar .pb{display:flex;align-items:center;padding:0 8px;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);color:#06121f;transition:width .6s cubic-bezier(.4,0,.2,1);white-space:nowrap;overflow:hidden}\
  .bar .pr{display:flex;align-items:center;justify-content:flex-end;padding:0 8px;background:linear-gradient(180deg,#ff5a5f,#c3506a);color:#fff;transition:width .6s cubic-bezier(.4,0,.2,1);white-space:nowrap;overflow:hidden}\
  .bar .pb.lead{box-shadow:0 0 14px rgba(74,163,255,.5),inset 0 0 20px rgba(255,255,255,.22)}\
  .bar .pr.lead{box-shadow:0 0 14px rgba(255,90,95,.5),inset 0 0 20px rgba(255,255,255,.18)}\
  .meta{display:flex;align-items:center;justify-content:space-between;margin-top:7px;font-size:11px;color:#8b97b0}\
  .gt{font-variant-numeric:tabular-nums;color:#cdd7ea;font-weight:700}\
  .rz{list-style:none;margin:8px 0 0;padding:0;font-size:11.5px;color:#aeb9cf}\
  .rz li{padding:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\
  .rz li::before{content:"›";color:#f2c14e;margin-right:6px}\
  .wait{font-size:12px;color:#8b97b0;text-align:center;padding:10px 4px}\
  .prec{font-size:10.5px;color:#8b97b0;text-align:center;margin:7px 0 0;padding-top:7px;border-top:1px solid #1b2439}\
  .prec b{color:#3ddc97;font-weight:700}\
  .ft{display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding-top:8px;border-top:1px solid #1b2439;font-size:10.5px;color:#6b7791}\
  .dl{display:flex;align-items:center;gap:4px}\
  .dl button{width:20px;height:20px;border:1px solid #2a3654;border-radius:5px;background:transparent;color:#8b97b0;font-size:12px;cursor:pointer;padding:0;line-height:1}\
  .dl button:hover{color:#e8edf7;border-color:#4aa3ff}\
  .col .bd{display:none}\
  ';

  sh.innerHTML = '<style>' + CSS + '</style>' +
    '<div class="w" id="w">' +
      '<div class="hd" id="hd"><svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rplg" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff"/><stop offset=".5" stop-color="#9ab0e6"/><stop offset="1" stop-color="#ff5a5f"/></linearGradient></defs><rect x="3" y="3" width="58" height="58" rx="16" fill="#0d1320" stroke="#2b3c62" stroke-width="2"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rplg)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="30" cy="17" r="3.4" fill="#fff"/></svg><span class="ttl">RiftPulse</span><span class="sp"></span>' +
        '<button class="ic" id="col" title="Plegar">—</button></div>' +
      '<div class="bd" id="bd"></div>' +
    '</div>';

  var wEl = sh.getElementById('w'), bd = sh.getElementById('bd'), hd = sh.getElementById('hd'), colBtn = sh.getElementById('col');

  // ---------- posición guardada ----------
  (function () {
    var p = ls(POSKEY);
    if (p) { try { var o = JSON.parse(p); host.style.left = o.l + 'px'; host.style.top = o.t + 'px'; host.style.right = 'auto'; } catch (e) {} }
    if (ls(COLKEY) === '1') { wEl.classList.add('col'); colBtn.textContent = '+'; }
  })();

  // ---------- plegar ----------
  colBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var c = wEl.classList.toggle('col');
    colBtn.textContent = c ? '+' : '—';
    ls(COLKEY, c ? '1' : '0');
  });

  // ---------- arrastrar ----------
  (function () {
    var sx, sy, ox, oy, on = false;
    hd.addEventListener('mousedown', function (e) {
      if (e.target === colBtn) return;
      on = true; hd.classList.add('drag');
      var r = host.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!on) return;
      var l = Math.max(0, Math.min(window.innerWidth - 60, ox + e.clientX - sx));
      var t = Math.max(0, Math.min(window.innerHeight - 30, oy + e.clientY - sy));
      host.style.left = l + 'px'; host.style.top = t + 'px'; host.style.right = 'auto';
    });
    window.addEventListener('mouseup', function () {
      if (!on) return; on = false; hd.classList.remove('drag');
      var r = host.getBoundingClientRect(); ls(POSKEY, JSON.stringify({l: Math.round(r.left), t: Math.round(r.top)}));
    });
  })();

  // ---------- render ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function nextObj(timers, gt) {
    if (!timers) return '';
    var out = [];
    if (timers.dragon && timers.dragon.at > gt) out.push((timers.dragon.elder ? 'Ancestral' : 'Dragón') + ' ' + mmss(timers.dragon.at - gt));
    if (timers.baron && timers.baron.at > gt) out.push('Barón ' + mmss(timers.baron.at - gt));
    return out.join(' · ');
  }

  function render(s) {
    if (!s.match) { bd.innerHTML = '<div class="wait">Buscando un partido del Mundial en vivo…</div>' + prec(s); return; }
    var m = s.match, g = s.game;
    var head = '<div class="teams"><span class="tc b">' + esc(m.blue.code) + '</span>' +
      '<span class="sc">' + (m.blue.wins != null ? m.blue.wins : 0) + ' – ' + (m.red.wins != null ? m.red.wins : 0) + '</span>' +
      '<span class="tc r">' + esc(m.red.code) + '</span></div>';

    if (!g || g.pBlue == null) {
      bd.innerHTML = head + '<div class="wait">' + (g && g.waiting ? 'Esperando datos del juego…' : 'La partida aún no empieza.') + '</div>' + prec(s) + footer(s);
      return;
    }
    var pb = Math.round(g.pBlue * 100), pr = 100 - pb;
    var lb = pb >= pr ? ' lead' : '', lr = pr > pb ? ' lead' : '';
    var bar = '<div class="bar"><div class="pb' + lb + '" style="width:' + Math.min(86, Math.max(pb, 14)) + '%">' + esc(m.blue.code) + ' ' + pb + '%</div>' +
      '<div class="pr' + lr + '" style="width:' + Math.min(86, Math.max(pr, 14)) + '%">' + pr + '% ' + esc(m.red.code) + '</div></div>';
    var obj = nextObj(g.timers, g.gt);
    var meta = '<div class="meta"><span class="gt">' + mmss(g.gt) + '</span><span>' + esc(obj) + '</span></div>';
    var reasons = (g.reasons || []).slice(0, 2).map(function (r) { return '<li>' + esc(r.txt) + '</li>'; }).join('');
    bd.innerHTML = head + bar + meta + (reasons ? '<ul class="rz">' + reasons + '</ul>' : '') + prec(s) + footer(s);
    wireFooter(s);
  }

  function prec(s) {
    var P = s.precision;
    if (!P) return '';
    return '<div class="prec">Acierto del modelo: <b>' + Math.round(P.acc15 * 100) + '%</b> al min 15 · ' + P.juegos + ' juegos que no vio</div>';
  }
  function footer(s) {
    return '<div class="ft"><span>Pronóstico · no es una casa de apuestas</span>' +
      '<span class="dl">retraso ' + s.delay + 's <button data-d="-5" title="menos">−</button><button data-d="5" title="más">+</button></span></div>';
  }
  function wireFooter() {
    var btns = bd.querySelectorAll('.dl button');
    btns.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); R.nudge(+b.getAttribute('data-d')); }); });
  }

  R.onUpdate(render);
  R.start();
})();
