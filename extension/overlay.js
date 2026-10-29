/* RiftPulse — overlay personal de espectador (se inyecta sobre el stream; SOLO lo ve el usuario).
   Aporta lo que la transmisión NO sintetiza: probabilidad de victoria + su evolución, y la diferencia
   de oro en el tiempo. Módulos encendibles con triggers. Diseño nativo, acoplable arriba o abajo. Shadow DOM. */
(function () {
  'use strict';
  if (!window.RiftEngine) { console.warn('[RiftPulse] falta engine.js'); return; }
  if (document.getElementById('rp-overlay-host')) return;
  var R = window.RiftEngine;

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var EXT = (function () { try { return JSON.parse(ls('rp_ext5') || '["obj","pg"]'); } catch (e) { return ['obj', 'pg']; } })();  // módulos extra activos
  var POS = ls('rp_pos5') || 'top';
  var POSXY = (function () { try { return JSON.parse(ls('rp_xy5') || 'null'); } catch (e) { return null; } })();

  var host = document.createElement('div');
  host.id = 'rp-overlay-host';
  host.style.cssText = 'position:fixed;z-index:2147483646;width:470px;max-width:94vw;';
  (document.body || document.documentElement).appendChild(host);
  var sh = host.attachShadow({mode: 'open'});
  function place() {
    if (POSXY) { host.style.left = POSXY.l + 'px'; host.style.top = POSXY.t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; return; }
    host.style.left = '50%'; host.style.transform = 'translateX(-50%)';
    if (POS === 'bottom') { host.style.bottom = '116px'; host.style.top = 'auto'; } else { host.style.top = '52px'; host.style.bottom = 'auto'; }
  }
  place();

  function rpFullscreen() { var fs = document.fullscreenElement || document.webkitFullscreenElement || null; var dest = fs || document.body; if (dest && host.parentNode !== dest) dest.appendChild(host); }
  document.addEventListener('fullscreenchange', rpFullscreen);
  document.addEventListener('webkitfullscreenchange', rpFullscreen);

  var CSS = '\
  :host{all:initial}*{box-sizing:border-box;font-family:"Chakra Petch",system-ui,Segoe UI,Roboto,sans-serif}\
  .w{position:relative;background:linear-gradient(180deg,rgba(11,16,27,.9),rgba(7,10,18,.93));border:1px solid rgba(120,150,200,.3);\
     border-radius:11px;box-shadow:0 10px 32px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05);backdrop-filter:blur(7px);color:#e8edf7;overflow:hidden}\
  .hd{display:flex;align-items:center;gap:7px;padding:5px 8px;cursor:grab;border-bottom:1px solid rgba(120,150,200,.16)}.hd.drag{cursor:grabbing}\
  .logo{width:15px;height:15px;flex:none;display:block}\
  .bn{font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#aab6cc}\
  .acc{font-size:9.5px;color:#3ddc97;font-weight:700}\
  .chips{display:flex;gap:4px;margin-left:auto;flex-wrap:wrap}\
  .chip{font-size:10px;font-weight:700;letter-spacing:.2px;color:#8b97b0;background:rgba(20,28,44,.7);border:1px solid rgba(120,150,200,.3);border-radius:99px;padding:2px 8px;cursor:pointer;white-space:nowrap}\
  .chip:hover{color:#e8edf7;border-color:#4aa3ff}\
  .chip.on{color:#06121f;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);border-color:#4aa3ff}\
  .chip.ic{padding:2px 6px}\
  .bd{padding:8px 10px 9px}\
  .prow{display:flex;align-items:center;gap:8px}\
  .tc{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;flex:none;min-width:38px;text-shadow:0 2px 5px rgba(0,0,0,.6)}\
  .tc.b{color:#7cc0ff;text-align:right}.tc.r{color:#ff8a8f}\
  .bar{position:relative;flex:1;height:26px;border-radius:6px;overflow:hidden;display:flex;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}\
  .pb{display:flex;align-items:center;padding:0 9px;color:#06121f;font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pr{display:flex;align-items:center;justify-content:flex-end;padding:0 9px;color:#fff;font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#ff5a5f,#c3506a);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pb.lead{box-shadow:0 0 14px rgba(74,163,255,.6),inset 0 0 20px rgba(255,255,255,.22)}\
  .pr.lead{box-shadow:0 0 14px rgba(255,90,95,.6),inset 0 0 20px rgba(255,255,255,.18)}\
  .mod{margin-top:8px}\
  .mt{display:flex;justify-content:space-between;align-items:baseline;font-size:9.5px;letter-spacing:.7px;text-transform:uppercase;color:#6b7791;margin-bottom:3px}\
  .mt b{font-size:11px;color:#cdd7ea;font-variant-numeric:tabular-nums}\
  .mt b.b{color:#7cc0ff}.mt b.r{color:#ff8a8f}\
  svg.g{display:block;width:100%;height:54px}\
  .vs{display:grid;grid-template-columns:1fr auto 1fr;gap:2px 8px;font-variant-numeric:tabular-nums;align-items:center}\
  .vs .bl{text-align:right;font-weight:700;font-size:12.5px;color:#aeb9cf}.vs .rl{text-align:left;font-weight:700;font-size:12.5px;color:#aeb9cf}\
  .vs .bl.win{color:#7cc0ff}.vs .rl.win{color:#ff8a8f}\
  .vs .lab{text-align:center;font-size:9.5px;color:#8b97b0;min-width:64px}.vs .lab .d{display:block;font-size:9px;font-weight:700}.vs .lab .d.b{color:#7cc0ff}.vs .lab .d.r{color:#ff8a8f}\
  .imp{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}\
  .imp .s{display:flex;align-items:baseline;gap:6px;font-weight:700}.imp .s.l{justify-content:flex-end}\
  .imp .s .c{font-size:12px;color:#aeb9cf}.imp .s .v{font-size:19px;font-variant-numeric:tabular-nums}\
  .imp .s .v.b{color:#7cc0ff}.imp .s .v.r{color:#ff8a8f}.imp .s.big .v{text-shadow:0 0 12px currentColor}\
  .imp .mid{font-size:9.5px;color:#8b97b0;text-align:center;line-height:1.25}\
  .cap{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:7px;font-size:9.5px;color:#8b97b0}\
  .cap b{color:#7fe8bd;font-weight:700}\
  .nub{display:flex;gap:3px;margin-left:4px}\
  .nub button{width:16px;height:16px;border:1px solid rgba(120,150,200,.35);border-radius:4px;background:transparent;color:#8b97b0;font-size:10px;line-height:1;cursor:pointer;padding:0}\
  .nub button:hover{color:#fff;border-color:#4aa3ff}\
  .wait{font-size:12px;color:#8b97b0;text-align:center;padding:5px 0}\
  .mom{position:absolute;left:50%;top:-20px;transform:translateX(-50%);display:none;align-items:center;gap:6px;background:rgba(10,14,22,.95);border:1px solid rgba(242,193,78,.5);border-radius:7px;padding:2px 9px;font-size:11px;font-weight:700;color:#f3e3bd;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.5);z-index:3}\
  .mom.show{display:flex}.mom .zap{color:#f2c14e}.mom .k.b{color:#7cc0ff}.mom .k.r{color:#ff8a8f}\
  ';

  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rplg" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff"/><stop offset=".5" stop-color="#9ab0e6"/><stop offset="1" stop-color="#ff5a5f"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="15" fill="#0d1320" stroke="#2b3c62" stroke-width="3"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rplg)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  sh.innerHTML = '<style>' + CSS + '</style><div class="w" id="w"><div class="mom" id="mom"></div>' +
    '<div class="hd" id="hd">' + LOGO + '<span class="bn">RiftPulse</span><span class="acc" id="acc"></span>' +
      '<div class="chips">' +
        '<button class="chip" data-ext="obj">objetivo</button>' +
        '<button class="chip" data-ext="pg">% tiempo</button>' +
        '<button class="chip" data-ext="gg">oro tiempo</button>' +
        '<button class="chip" data-ext="vs">versus</button>' +
        '<button class="chip ic" id="posbtn" title="Arriba/Abajo">↑↓</button>' +
        '<span class="nub"><button data-d="-5" title="atrasar">−</button><button data-d="5" title="adelantar">+</button></span>' +
      '</div></div><div class="bd" id="bd"></div></div>';
  var wEl = sh.getElementById('w'), hd = sh.getElementById('hd'), bd = sh.getElementById('bd'), accEl = sh.getElementById('acc'), momEl = sh.getElementById('mom');

  function syncChips() { wEl.querySelectorAll('.chip[data-ext]').forEach(function (c) { c.classList.toggle('on', EXT.indexOf(c.getAttribute('data-ext')) >= 0); }); }
  syncChips();
  var LAST = null;
  wEl.querySelectorAll('.chip[data-ext]').forEach(function (c) {
    c.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    c.addEventListener('click', function (e) { e.stopPropagation(); var k = c.getAttribute('data-ext'), i = EXT.indexOf(k); if (i >= 0) EXT.splice(i, 1); else EXT.push(k); ls('rp_ext5', JSON.stringify(EXT)); syncChips(); if (LAST) render(LAST); });
  });
  sh.getElementById('posbtn').addEventListener('click', function (e) { e.stopPropagation(); POS = POS === 'top' ? 'bottom' : 'top'; POSXY = null; ls('rp_xy5', 'null'); ls('rp_pos5', POS); place(); });
  wEl.querySelectorAll('.nub button').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function (e) { e.stopPropagation(); R.nudge(+b.getAttribute('data-d')); }); });

  // arrastrar desde la cabecera
  (function () { var sx, sy, ox, oy, on = false;
    hd.addEventListener('mousedown', function (e) { if (e.target.closest('.chip,.nub')) return; on = true; hd.classList.add('drag'); var r = host.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!on) return; var l = Math.max(0, Math.min(innerWidth - 80, ox + e.clientX - sx)), t = Math.max(0, Math.min(innerHeight - 24, oy + e.clientY - sy)); host.style.left = l + 'px'; host.style.top = t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; });
    window.addEventListener('mouseup', function () { if (!on) return; on = false; hd.classList.remove('drag'); var r = host.getBoundingClientRect(); POSXY = {l: Math.round(r.left), t: Math.round(r.top)}; ls('rp_xy5', JSON.stringify(POSXY)); });
  })();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function k1(g) { return (g >= 0 ? '+' : '−') + (Math.abs(g) / 1000).toFixed(1) + 'k'; }

  // sparkline: valFn devuelve 0..1 (0.5 = neutro). mid = línea de referencia.
  function spark(samples, valFn) {
    if (!samples || samples.length < 2) return '<div class="wait" style="padding:14px 0">Se dibuja conforme avanza el juego…</div>';
    var W = 448, H = 54, t0 = samples[0].gt, t1 = samples[samples.length - 1].gt, span = Math.max(1, t1 - t0);
    var xy = samples.map(function (s) { var v = Math.max(0, Math.min(1, valFn(s))); return [(s.gt - t0) / span * W, H - 3 - v * (H - 6)]; });
    var line = 'M' + xy.map(function (a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join(' L');
    var area = line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z';
    var mid = (H - 3) - 0.5 * (H - 6);
    return '<svg class="g" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="zone" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#4aa3ff" stop-opacity=".34"/><stop offset="' + (mid / H) + '" stop-color="#4aa3ff" stop-opacity=".05"/>' +
      '<stop offset="' + (mid / H) + '" stop-color="#ff5a5f" stop-opacity=".05"/><stop offset="1" stop-color="#ff5a5f" stop-opacity=".34"/></linearGradient></defs>' +
      '<line x1="0" y1="' + mid.toFixed(1) + '" x2="' + W + '" y2="' + mid.toFixed(1) + '" stroke="#38415c" stroke-width="1" stroke-dasharray="4 4"/>' +
      '<path d="' + area + '" fill="url(#zone)"/>' +
      '<path d="' + line + '" fill="none" stroke="#dbe6fb" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  var hist = [], lastMom = 0;
  function render(s) {
    LAST = s;
    accEl.textContent = s.precision ? 'acierta ' + Math.round(s.precision.acc15 * 100) + '%' : '';
    if (!s.match) { bd.innerHTML = '<div class="wait">Buscando un partido del Mundial en vivo…</div>'; return; }
    var m = s.match, g = s.game;
    if (!g || g.pBlue == null) { bd.innerHTML = '<div class="wait">' + esc(m.blue.code) + ' vs ' + esc(m.red.code) + ' · la probabilidad aparece al iniciar el juego</div>'; return; }

    var pb = Math.round(g.pBlue * 100), pr = 100 - pb, lb = pb >= pr ? ' lead' : '', lr = pr > pb ? ' lead' : '';
    var html = '<div class="prow"><span class="tc b">' + esc(m.blue.code) + '</span>' +
      '<div class="bar"><div class="pb' + lb + '" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + pb + '%</div>' +
      '<div class="pr' + lr + '" style="width:' + Math.min(85, Math.max(pr, 15)) + '%">' + pr + '%</div></div>' +
      '<span class="tc r">' + esc(m.red.code) + '</span></div>';

    var sm = g.samples || [];
    if (EXT.indexOf('obj') >= 0 && g.impact) {
      var im = g.impact, ib = Math.max(0, im.blue), ir = Math.max(0, im.red), bigB = ib >= ir;
      html += '<div class="mod"><div class="mt"><span>Impacto del próximo ' + esc(im.obj) + '</span><b>' + mmss(Math.max(0, im.at - g.gt)) + '</b></div>' +
        '<div class="imp"><div class="s l' + (bigB ? ' big' : '') + '"><span class="c">' + esc(m.blue.code) + '</span><span class="v b">+' + ib + '</span></div>' +
        '<div class="mid">pts de prob.<br>en juego</div>' +
        '<div class="s' + (!bigB ? ' big' : '') + '"><span class="v r">+' + ir + '</span><span class="c">' + esc(m.red.code) + '</span></div></div></div>';
    }
    if (EXT.indexOf('pg') >= 0) {
      html += '<div class="mod"><div class="mt"><span>Probabilidad en el tiempo</span><b class="' + (pb >= pr ? 'b' : 'r') + '">' + esc(pb >= pr ? m.blue.code : m.red.code) + ' ' + Math.max(pb, pr) + '%</b></div>' + spark(sm, function (x) { return x.p; }) + '</div>';
    }
    if (EXT.indexOf('gg') >= 0) {
      var mx = sm.reduce(function (a, x) { return Math.max(a, Math.abs(x.diff)); }, 1000);
      var cur = sm.length ? sm[sm.length - 1].diff : 0;
      html += '<div class="mod"><div class="mt"><span>Diferencia de oro</span><b class="' + (cur >= 0 ? 'b' : 'r') + '">' + esc(cur >= 0 ? m.blue.code : m.red.code) + ' ' + k1(Math.abs(cur)) + '</b></div>' + spark(sm, function (x) { return 0.5 + 0.5 * Math.max(-1, Math.min(1, x.diff / mx)); }) + '</div>';
    }
    if (EXT.indexOf('vs') >= 0 && g.stats) {
      var st = g.stats;
      html += '<div class="mod"><div class="mt"><span>Comparación ahora</span></div><div class="vs">' +
        vrow('Oro', st.blue.gold, st.red.gold, function (v) { return (v / 1000).toFixed(1) + 'k'; }, function (d) { return '+' + (d / 1000).toFixed(1) + 'k'; }) +
        vrow('Torres', st.blue.towers, st.red.towers, String) +
        vrow('Dragones', st.blue.dragons, st.red.dragons, String) + '</div></div>';
    }

    var dr = s.delay;
    html += '<div class="cap">' + LOGO.replace('class="logo"', 'class="logo" style="width:12px;height:12px"') + '<span>Probabilidad de victoria en vivo · <b>modelo 75%</b> · min ' + mmss(g.gt) + ' · retraso ' + dr + 's</span></div>';

    bd.innerHTML = html;
    hist.push({t: Date.now(), p: g.pBlue}); checkMomentum(s);
  }
  function mmss(x) { x = Math.max(0, Math.round(x)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); }
  function vrow(lab, bv, rv, fmt, dfmt) { var bw = bv > rv, rw = rv > bv, d = Math.abs(bv - rv);
    var diff = d ? '<span class="d ' + (bw ? 'b' : 'r') + '">' + (dfmt ? dfmt(d) : '+' + d) + '</span>' : '<span class="d" style="color:#5f6b82">=</span>';
    return '<div class="bl' + (bw ? ' win' : '') + '">' + fmt(bv) + '</div><div class="lab">' + lab + diff + '</div><div class="rl' + (rw ? ' win' : '') + '">' + fmt(rv) + '</div>'; }

  function checkMomentum(s) {
    var now = Date.now(); hist = hist.filter(function (x) { return now - x.t <= 90000; });
    if (now - lastMom < 15000) return;
    var past = null; for (var i = 0; i < hist.length; i++) { if (now - hist[i].t >= 34000) past = hist[i]; }
    if (!past) return;
    var d = Math.round((s.game.pBlue - past.p) * 100); if (Math.abs(d) < 11) return;
    var toB = d > 0, code = toB ? s.match.blue.code : s.match.red.code;
    var ev = (s.game.events || []).filter(function (e) { return ['baron', 'elder', 'dragon', 'inhib'].indexOf(e.kind) >= 0 && s.game.gt - e.gt <= 60; }).slice(-1)[0];
    lastMom = now;
    momEl.innerHTML = '<span class="zap">⚡</span><span class="k ' + (toB ? 'b' : 'r') + '">' + esc(code) + ' +' + Math.abs(d) + '</span>' + (ev ? '<span>· ' + esc(ev.txt) + '</span>' : '<span>de momentum</span>');
    momEl.classList.add('show'); setTimeout(function () { momEl.classList.remove('show'); }, 6500);
  }

  R.onUpdate(render);
  R.start();
})();
