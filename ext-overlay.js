/* RiftPulse — overlay personal de espectador (se inyecta sobre el stream; SOLO lo ve el usuario).
   Barra HORIZONTAL que se acopla al HUD de la transmisión. Aporta lo que el stream no sintetiza:
   probabilidad de victoria, impacto del próximo objetivo y la trayectoria. Módulos con triggers.
   Usa window.RiftEngine (engine.js). Shadow DOM. */
(function () {
  'use strict';
  if (!window.RiftEngine) { console.warn('[RiftPulse] falta engine.js'); return; }
  if (document.getElementById('rp-overlay-host')) return;
  var R = window.RiftEngine;

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var EXT = (function () { try { return JSON.parse(ls('rp_ext6') || '["obj","pg"]'); } catch (e) { return ['obj', 'pg']; } })();
  var POS = ls('rp_pos6') || 'top';
  var DMG = ls('rp_dmg6') !== '0';  // reparto de daño automático tras cada pelea
  var XY = (function () { try { return JSON.parse(ls('rp_xy6') || 'null'); } catch (e) { return null; } })();

  if (!document.getElementById('rp-fonts')) { var fl = document.createElement('link'); fl.id = 'rp-fonts'; fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&display=swap'; (document.head || document.documentElement).appendChild(fl); }
  var host = document.createElement('div');
  host.id = 'rp-overlay-host';
  host.style.cssText = 'position:fixed;z-index:2147483646;max-width:96vw;';
  (document.body || document.documentElement).appendChild(host);
  var sh = host.attachShadow({mode: 'open'});
  // el video principal de la página (el más grande que esté visible)
  function mainVideo() {
    var best = null, area = 0;
    document.querySelectorAll('video').forEach(function (v) { var r = v.getBoundingClientRect(), a = r.width * r.height; if (a > area && r.width > 200) { best = v; area = a; } });
    return best;
  }
  // arriba = justo debajo del marcador oficial de la transmisión; abajo = encima del panel de jugadores
  function place() {
    if (XY) { host.style.left = XY.l + 'px'; host.style.top = XY.t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; return; }
    var v = mainVideo(), r = v ? v.getBoundingClientRect() : null;
    host.style.transform = 'translateX(-50%)';
    host.style.left = r ? (r.left + r.width / 2) + 'px' : '50%';
    if (POS === 'bottom') { host.style.top = 'auto'; host.style.bottom = r ? Math.max(8, innerHeight - (r.top + r.height * 0.70)) + 'px' : '112px'; }
    else { host.style.bottom = 'auto'; host.style.top = r ? Math.max(8, r.top + r.height * 0.125) + 'px' : '52px'; }
  }
  setInterval(place, 2000);
  place();

  function rpFullscreen() { var fs = document.fullscreenElement || document.webkitFullscreenElement || null; var dest = fs || document.body; if (dest && host.parentNode !== dest) dest.appendChild(host); }
  document.addEventListener('fullscreenchange', rpFullscreen);
  document.addEventListener('webkitfullscreenchange', rpFullscreen);

  var CSS = '\
  :host{all:initial}*{box-sizing:border-box;font-family:Oswald,"Chakra Petch",system-ui,"Segoe UI",Roboto,sans-serif}\
  .w{position:relative;display:inline-flex;align-items:stretch;height:48px;border-radius:5px;overflow:visible;\
     background:linear-gradient(180deg,rgba(16,30,62,.94),rgba(6,12,28,.96));border:1px solid rgba(150,180,230,.24);\
     box-shadow:0 14px 34px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(8px);color:#eef3fb;cursor:grab}\
  .w::after{content:"";position:absolute;left:-1px;top:-1px;width:70px;height:2px;background:linear-gradient(90deg,#f2c14e,rgba(242,193,78,0));border-radius:5px 0 0 0;pointer-events:none}\
  .w.drag{cursor:grabbing}\
  .seg{display:flex;flex-direction:column;justify-content:center;padding:0 13px;border-right:1px solid rgba(150,180,230,.14);white-space:nowrap}\
  .seg:last-child{border-right:0}\
  .brand{align-items:center;flex-direction:row;gap:8px;background:linear-gradient(90deg,rgba(242,193,78,.1),rgba(242,193,78,0))}.brand .logo{width:20px;height:20px;display:block}\
  .brand .bn{font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#eef3fb}\
  .prob{flex-direction:row;align-items:center;gap:10px}\
  .tc{font-family:Anton,Oswald,sans-serif;font-size:19px;letter-spacing:1px;text-shadow:0 2px 6px rgba(0,0,0,.6)}\
  .tc.b{color:#6fb8ff}.tc.r{color:#ff7a86}\
  .bar{position:relative;width:196px;height:26px;display:flex;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);background:rgba(255,255,255,.06)}\
  .pb{display:flex;align-items:center;padding:0 12px;color:#04101f;font-weight:700;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#7cc4ff,#2f7fe0);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pr{display:flex;align-items:center;justify-content:flex-end;padding:0 12px;color:#fff;font-weight:700;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#ff7684,#c93a52);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pb.lead{background:linear-gradient(180deg,#a3d6ff,#4aa3ff 45%,#2f7fe0);box-shadow:inset 0 0 14px rgba(255,255,255,.35)}\
  .pr.lead{background:linear-gradient(180deg,#ffa0aa,#ff4d5e 45%,#c93a52);box-shadow:inset 0 0 14px rgba(255,255,255,.3)}\
  .sl{font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#8fa0c2;line-height:1.3}\
  .sv{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.25;color:#eef3fb;letter-spacing:.4px}\
  .sv b{font-weight:700}.sv b.b{color:#6fb8ff}.sv b.r{color:#ff7a86}.sv .mut{color:#8fa0c2;font-weight:400;font-size:11px}\
  .obj .sv2{font-size:11px;color:#8fa0c2}\
  .spark{display:flex;align-items:center;gap:8px}\
  .spark svg{display:block;width:96px;height:30px}\
  .acc{align-items:center;background:linear-gradient(270deg,rgba(61,220,151,.08),rgba(61,220,151,0))}.acc .n{font-size:16px;font-weight:700;color:#3ddc97;font-variant-numeric:tabular-nums}.acc .l{font-size:8.5px;letter-spacing:1.6px;text-transform:uppercase;color:#8fa0c2}\
  .next{flex-direction:row;align-items:center;gap:8px;font-weight:700}\
  .next .vs{font-family:Anton,Oswald,sans-serif;font-weight:400;font-size:16px;letter-spacing:1px}.next .vs .b{color:#6fb8ff}.next .vs .r{color:#ff7a86}\
  .next .in{font-size:11px;color:#8fa0c2;font-weight:400;letter-spacing:.6px}\
  .wait{display:flex;align-items:center;padding:0 14px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8fa0c2}\
  /* controles al pasar el mouse */\
  .ctl{position:absolute;left:50%;transform:translateX(-50%);top:calc(100% + 6px);display:none;gap:4px;align-items:center;\
     background:rgba(6,12,28,.96);border:1px solid rgba(150,180,230,.24);border-radius:4px;padding:4px 6px;box-shadow:0 8px 20px rgba(0,0,0,.5)}\
  .w:hover .ctl{display:flex}\
  .chip{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#8fa0c2;background:rgba(13,24,48,.8);border:1px solid rgba(150,180,230,.24);border-radius:3px;padding:2px 8px;cursor:pointer;white-space:nowrap}\
  .chip.on{color:#06121f;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);border-color:#4aa3ff}.chip:hover{color:#e8edf7}\
  .chip.on:hover{color:#06121f}\
  .ctl button.ic{width:18px;height:18px;border:1px solid rgba(120,150,200,.35);border-radius:5px;background:transparent;color:#8b97b0;font-size:11px;line-height:1;cursor:pointer;padding:0}\
  .ctl button.ic:hover{color:#fff;border-color:#4aa3ff}\
  .mom{position:absolute;left:50%;top:-22px;transform:translateX(-50%);display:none;align-items:center;gap:6px;background:rgba(6,12,28,.96);border:1px solid rgba(242,193,78,.6);border-radius:3px;padding:2px 10px;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#f6e7c1;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.5);z-index:3}\
  .mom.show{display:flex}.mom .zap{color:#f2c14e}.mom .k.b{color:#7cc0ff}.mom .k.r{color:#ff8a8f}\
  .dmg{position:absolute;left:50%;top:calc(100% + 9px);transform:translateX(-50%);display:none;width:470px;max-width:92vw;\
     background:linear-gradient(180deg,rgba(16,30,62,.96),rgba(6,12,28,.97));border:1px solid rgba(150,180,230,.24);border-radius:5px;padding:10px 13px;box-shadow:0 12px 32px rgba(0,0,0,.6);z-index:4}\
  .dmg.show{display:block}\
  .dh{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#f2c14e;margin-bottom:7px;display:flex;justify-content:space-between}.dh .wl{color:#cdd7ea;font-weight:700}\
  .dcols{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px}\
  .drow{display:flex;align-items:center;gap:7px;padding:1px 0}\
  .dn{font-size:12px;font-weight:600;letter-spacing:.6px;width:64px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}\
  .dbar{flex:1;height:7px;border-radius:1px;background:rgba(120,150,200,.14);overflow:hidden}.dbar>div{height:7px;border-radius:4px}\
  .dcol.b .dbar>div{background:linear-gradient(90deg,#2f7fe0,#4aa3ff)}.dcol.r .dbar>div{background:linear-gradient(90deg,#c3506a,#ff5a5f)}\
  .dcol.b .dn{color:#7cc0ff}.dcol.r .dn{color:#ff8a8f}\
  .dp{font-size:10.5px;font-variant-numeric:tabular-nums;color:#aeb9cf;width:30px;text-align:right;flex:none}\
  .syncg{display:flex;align-items:center;gap:3px;font-size:9.5px;color:#8b97b0;border-left:1px solid rgba(120,150,200,.25);padding-left:6px;margin-left:2px}\
  .syncg input{width:42px;height:18px;background:rgba(20,28,44,.7);border:1px solid rgba(120,150,200,.3);border-radius:5px;color:#e8edf7;font:inherit;font-size:11px;text-align:center;padding:0 3px}\
  .syncg input:focus{outline:none;border-color:#4aa3ff}.syncg input.bad{border-color:#ff5a5f}\
  .ast{font-size:9.5px;letter-spacing:1px;color:#8fa0c2;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:4px}\
  .ast.ok{color:#3ddc97}\
  .syncg .gt{font-variant-numeric:tabular-nums;color:#aab6cc;font-weight:700}\
  ';

  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rplg" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff"/><stop offset=".5" stop-color="#9ab0e6"/><stop offset="1" stop-color="#ff5a5f"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="15" fill="#0d1320" stroke="#2b3c62" stroke-width="3"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rplg)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  sh.innerHTML = '<style>' + CSS + '</style><div class="w" id="w"><div class="mom" id="mom"></div><div class="dmg" id="dmg"></div><div id="body" style="display:inline-flex"></div>' +
    '<div class="ctl" id="ctl"><span class="chip" id="autoc" title="Lee el reloj y el marcador del video y se sincroniza solo">auto-sync</span><span class="ast" id="ast"></span><span class="chip" data-ext="obj">objetivo</span><span class="chip" data-ext="pg">trayectoria</span>' +
    '<button class="ic" id="posbtn" title="arriba/abajo">↑↓</button><button class="ic" data-d="-5" title="atrasar">−</button><button class="ic" data-d="5" title="adelantar">+</button>' +
    '<span class="syncg" title="Escribe el minuto que ves en el stream y pulsa ⟲ (o Enter) para clavar el overlay a ese momento">ves <input id="scm" placeholder="mm:ss" maxlength="5"><button class="ic" id="syncb" title="sincronizar al minuto que ves">⟲</button> va <span class="gt" id="gtnow">—</span></span></div></div>';
  var wEl = sh.getElementById('w'), body = sh.getElementById('body'), ctl = sh.getElementById('ctl'), momEl = sh.getElementById('mom'), dmgEl = sh.getElementById('dmg');

  function syncChips() { ctl.querySelectorAll('.chip[data-ext]').forEach(function (c) { c.classList.toggle('on', EXT.indexOf(c.getAttribute('data-ext')) >= 0); }); }
  syncChips();
  var LAST = null;
  ctl.querySelectorAll('.chip[data-ext]').forEach(function (c) { c.addEventListener('mousedown', function (e) { e.stopPropagation(); }); c.addEventListener('click', function (e) { e.stopPropagation(); var k = c.getAttribute('data-ext'), i = EXT.indexOf(k); if (i >= 0) EXT.splice(i, 1); else EXT.push(k); ls('rp_ext6', JSON.stringify(EXT)); syncChips(); if (LAST) render(LAST); }); });
  sh.getElementById('posbtn').addEventListener('click', function (e) { e.stopPropagation(); POS = POS === 'top' ? 'bottom' : 'top'; XY = null; ls('rp_xy6', 'null'); ls('rp_pos6', POS); place(); });
  ctl.querySelectorAll('button[data-d]').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function (e) { e.stopPropagation(); R.nudge(+b.getAttribute('data-d')); }); });
  var scmEl = sh.getElementById('scm'), gtnowEl = sh.getElementById('gtnow');
  function doSync() {
    var m = (scmEl.value || '').trim().match(/^(\d{1,2})(?::([0-5]?\d))?$/);
    var ok = !!m && R.syncTo(+m[1] * 60 + (+m[2] || 0));
    scmEl.classList.toggle('bad', !ok); if (ok) { scmEl.value = ''; scmEl.blur(); }
  }
  sh.getElementById('syncb').addEventListener('mousedown', function (e) { e.stopPropagation(); });
  sh.getElementById('syncb').addEventListener('click', function (e) { e.stopPropagation(); doSync(); });
  scmEl.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  scmEl.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') doSync(); });
  scmEl.addEventListener('input', function () { scmEl.classList.remove('bad'); });

  (function () { var sx, sy, ox, oy, on = false;
    wEl.addEventListener('mousedown', function (e) { if (e.target.closest('.ctl')) return; on = true; wEl.classList.add('drag'); var r = host.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!on) return; var l = Math.max(0, Math.min(innerWidth - 80, ox + e.clientX - sx)), t = Math.max(0, Math.min(innerHeight - 24, oy + e.clientY - sy)); host.style.left = l + 'px'; host.style.top = t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; });
    window.addEventListener('mouseup', function () { if (!on) return; on = false; wEl.classList.remove('drag'); var r = host.getBoundingClientRect(); XY = {l: Math.round(r.left), t: Math.round(r.top)}; ls('rp_xy6', JSON.stringify(XY)); });
  })();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function mmss(x) { x = Math.max(0, Math.round(x)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); }
  function miniSpark(sm) {
    if (!sm || sm.length < 2) return '<svg viewBox="0 0 96 30"></svg>';
    var W = 96, H = 30, t0 = sm[0].gt, t1 = sm[sm.length - 1].gt, span = Math.max(1, t1 - t0);
    var xy = sm.map(function (s) { var v = Math.max(0, Math.min(1, s.p)); return [(s.gt - t0) / span * W, H - 2 - v * (H - 4)]; });
    var line = 'M' + xy.map(function (a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join(' L');
    var area = line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z', mid = H / 2;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="z" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff" stop-opacity=".4"/><stop offset=".5" stop-color="#4aa3ff" stop-opacity=".05"/><stop offset=".5" stop-color="#ff5a5f" stop-opacity=".05"/><stop offset="1" stop-color="#ff5a5f" stop-opacity=".4"/></linearGradient></defs><line x1="0" y1="' + mid + '" x2="' + W + '" y2="' + mid + '" stroke="#38415c" stroke-width="1" stroke-dasharray="3 3"/><path d="' + area + '" fill="url(#z)"/><path d="' + line + '" fill="none" stroke="#dbe6fb" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  var hist = [], lastMom = 0, lastFightGt = -1, fightTimer = null;
  function showFight(s) {
    if (!DMG) return;
    var f = s.game && s.game.fight;
    if (!f || f.gt == null || !(f.blue || f.red)) return;
    if (f.gt === lastFightGt) return;  // ya mostrada
    lastFightGt = f.gt;
    var m = s.match;
    function col(side, cls) {
      side = side || []; var mx = side.reduce(function (a, p) { return Math.max(a, p.share); }, 0.01);
      return '<div class="dcol ' + cls + '">' + side.map(function (p) { return '<div class="drow"><span class="dn">' + esc(p.name) + '</span><div class="dbar"><div style="width:' + Math.round(p.share / mx * 100) + '%"></div></div><span class="dp">' + Math.round(p.share * 100) + '%</span></div>'; }).join('') + '</div>';
    }
    dmgEl.innerHTML = '<div class="dh"><span>Reparto de daño · tras la pelea</span><span class="wl">' + esc(f.win === 'blue' ? m.blue.code : m.red.code) + ' ganó el cambio</span></div><div class="dcols">' + col(f.blue, 'b') + col(f.red, 'r') + '</div>';
    dmgEl.classList.add('show');
    clearTimeout(fightTimer); fightTimer = setTimeout(function () { dmgEl.classList.remove('show'); }, 8500);
  }
  function render(s) {
    LAST = s;
    gtnowEl.textContent = s.game && s.game.pBlue != null ? mmss(s.game.gt) : '—';
    if (!s.match) {
      if (s.next) { body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div>' +
        '<div class="seg next"><span class="sl">Próximo partido</span><span class="vs"><span class="b">' + esc(s.next.blue) + '</span> vs <span class="r">' + esc(s.next.red) + '</span></span></div>'; }
      else body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div><div class="wait">buscando partido del Mundial…</div>';
      return;
    }
    var m = s.match, g = s.game;
    var html = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div>';

    if (!g || g.pBlue == null) {
      html += '<div class="seg prob"><span class="tc b">' + esc(m.blue.code) + '</span><span class="sl" style="padding:0 4px">' + ((g && g.waiting) ? 'cargando juego…' : 'por empezar') + '</span><span class="tc r">' + esc(m.red.code) + '</span></div>';
      if (s.next) html += '<div class="seg next"><span class="sl">Próximo</span><span class="vs"><span class="b">' + esc(s.next.blue) + '</span> vs <span class="r">' + esc(s.next.red) + '</span></span></div>';
      body.innerHTML = html; return;
    }

    var pb = Math.round(g.pBlue * 100), pr = 100 - pb, lb = pb >= pr ? ' lead' : '', lr = pr > pb ? ' lead' : '';
    html += '<div class="seg prob"><span class="tc b">' + esc(m.blue.code) + '</span>' +
      '<div class="bar"><div class="pb' + lb + '" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + pb + '%</div><div class="pr' + lr + '" style="width:' + Math.min(85, Math.max(pr, 15)) + '%">' + pr + '%</div></div>' +
      '<span class="tc r">' + esc(m.red.code) + '</span></div>';

    if (EXT.indexOf('obj') >= 0 && g.impact) {
      var im = g.impact, ib = Math.max(0, im.blue), ir = Math.max(0, im.red), bigB = ib >= ir;
      html += '<div class="seg obj"><span class="sl">Próx. ' + esc(im.obj) + ' · ' + mmss(Math.max(0, im.at - g.gt)) + '</span>' +
        '<span class="sv"><b class="' + (bigB ? 'b' : 'r') + '">' + esc(bigB ? m.blue.code : m.red.code) + ' +' + Math.max(ib, ir) + '</b> <span class="mut">' + esc(bigB ? m.red.code : m.blue.code) + ' +' + Math.min(ib, ir) + '</span></span></div>';
    }
    if (EXT.indexOf('pg') >= 0) {
      html += '<div class="seg spark">' + miniSpark(g.samples || []) + '<div style="display:flex;flex-direction:column"><span class="sl">trayectoria</span><span class="sv">' + esc(pb >= pr ? m.blue.code : m.red.code) + ' ' + Math.max(pb, pr) + '%</span></div></div>';
    }
    html += '<div class="seg acc"><span class="n">' + (s.precision ? Math.round(s.precision.acc15 * 100) + '%' : '—') + '</span><span class="l">acierto</span></div>';

    body.innerHTML = html;
    hist.push({t: Date.now(), p: g.pBlue}); checkMomentum(s); showFight(s);
  }

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

  // ---------- órdenes del centro de mando (pestaña «Mando» del panel lateral de la extensión) ----------
  function applyCmd(c, inicial) {
    if (!c) return;
    if (c.ext) { EXT = c.ext.slice(); ls('rp_ext6', JSON.stringify(EXT)); syncChips(); }
    if (c.pos) { POS = c.pos; XY = null; ls('rp_xy6', 'null'); ls('rp_pos6', POS); place(); }
    if (c.dmg != null) { DMG = !!c.dmg; ls('rp_dmg6', DMG ? '1' : '0'); if (!DMG) dmgEl.classList.remove('show'); }
    if (c.hidden != null) host.style.display = c.hidden ? 'none' : '';
    if (!inicial && c.sync) R.syncTo(c.sync.secs + (Date.now() - c.sync.at) / 1000);  // las órdenes de un solo uso no se repiten al recargar
    if (!inicial && c.nudge) R.nudge(c.nudge);
    if (LAST) render(LAST);
  }
  var hayStorage = false;
  try { hayStorage = !!(chrome.storage && chrome.storage.local); } catch (e) {}
  if (hayStorage) {
    chrome.storage.local.get('rp_cmd', function (o) { applyCmd(o && o.rp_cmd, true); });
    chrome.storage.onChanged.addListener(function (ch, area) { if (area === 'local' && ch.rp_cmd) applyCmd(ch.rp_cmd.newValue, false); });
  } else {
    // cargado desde la web como «script de usuario»: no ve el almacenamiento, se lo pide al proceso de fondo
    var ultimaN = null;
    var pedir = function (inicial) {
      try { chrome.runtime.sendMessage({type: 'rp-cmd-get'}, function (o) {
        var c = o && o.rp_cmd; if (!c || c.n === ultimaN) return;
        ultimaN = c.n; applyCmd(c, inicial);
      }); } catch (e) {}
    };
    pedir(true); setInterval(function () { pedir(false); }, 1500);
  }

  // ---------- sincronía automática: lee del video el reloj del juego, los equipos y el marcador ----------
  // Zonas del HUD de la transmisión del Mundial, relativas al cuadro del video.
  var ZONAS = {
    reloj: [0.455, 0.062, 0.545, 0.112, 'blanco'],
    tagI: [0.29, 0.0, 0.375, 0.055, 'color'], tagD: [0.625, 0.0, 0.715, 0.055, 'color'],
    oroI: [0.415, 0.012, 0.458, 0.058, 'blanco'], oroD: [0.548, 0.012, 0.59, 0.058, 'blanco'],
    killI: [0.468, 0.01, 0.497, 0.065, 'blanco'], killD: [0.503, 0.01, 0.533, 0.065, 'blanco']
  };
  var LISTA = {reloj: '0123456789:', tagI: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', tagD: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', oroI: '0123456789.K', oroD: '0123456789.K', killI: '0123456789', killD: '0123456789'};
  var MODO = {reloj: '7', tagI: '8', tagD: '8', oroI: '7', oroD: '7', killI: '8', killD: '8'};  // línea / palabra
  var AS = {on: ls('rp_auto6') !== '0', busy: false, id: null, anchor: null, prev: null, err: '', tries: 0};
  // recorta una zona del cuadro y la deja en negro sobre blanco, ampliada, lista para leer
  function zona(v, z) {
    var vw = v.videoWidth, vh = v.videoHeight, sx = z[0] * vw, sy = z[1] * vh, sw = (z[2] - z[0]) * vw, sh2 = (z[3] - z[1]) * vh;
    var k = Math.max(1, Math.min(4, 110 / sh2)), c = document.createElement('canvas');
    c.width = Math.round(sw * k); c.height = Math.round(sh2 * k);
    var x = c.getContext('2d', {willReadFrequently: true});
    x.imageSmoothingQuality = 'high'; x.drawImage(v, sx, sy, sw, sh2, 0, 0, c.width, c.height);
    var d = x.getImageData(0, 0, c.width, c.height), p = d.data;  // falla si el video está protegido
    for (var i = 0; i < p.length; i += 4) {
      var mx = Math.max(p[i], p[i + 1], p[i + 2]), mn = Math.min(p[i], p[i + 1], p[i + 2]);
      var tinta = z[4] === 'color' ? (mx > 110 && mx - mn > 80) : mn > 165;
      p[i] = p[i + 1] = p[i + 2] = tinta ? 0 : 255; p[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    return c.toDataURL('image/png');
  }
  function leer(imgs) {
    var wl = {}, psm = {}; Object.keys(imgs).forEach(function (k) { wl[k] = LISTA[k]; psm[k] = MODO[k]; });
    if (window.RP_OCR) return window.RP_OCR(imgs, wl, psm);
    return new Promise(function (res) { try { chrome.runtime.sendMessage({type: 'rp-ocr', images: imgs, wl: wl, psm: psm}, function (r) { res(r || {}); }); } catch (e) { res({}); } });
  }
  var autoc = sh.getElementById('autoc'), astEl = sh.getElementById('ast');
  function asEstado(t, ok) { astEl.textContent = t; astEl.classList.toggle('ok', !!ok); }
  function asChip() { autoc.classList.toggle('on', AS.on); if (!AS.on) asEstado(''); }
  asChip();
  autoc.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  autoc.addEventListener('click', function (e) { e.stopPropagation(); AS.on = !AS.on; ls('rp_auto6', AS.on ? '1' : '0'); AS.id = null; AS.anchor = null; asChip(); if (!AS.on) R.follow(null); });
  // minuto de juego esperado según el último anclaje (sigue la pausa y la velocidad del video)
  function esperado(v) { var a = AS.anchor; return a ? a.gt + (a.playing ? (Date.now() - a.at) / 1000 * a.speed : 0) : null; }
  function anclar(v, gt) {
    AS.anchor = {gt: gt, at: Date.now(), playing: !v.paused, speed: v.playbackRate || 1};
    R.follow({matchId: AS.id.matchId, juego: AS.id.juego, gt: gt, playing: AS.anchor.playing, speed: AS.anchor.speed, at: AS.anchor.at});
  }
  async function asTick() {
    if (!AS.on || AS.busy) return;
    var v = mainVideo(); if (!v || v.readyState < 2 || !v.videoWidth) return;
    AS.busy = true;
    try {
      var t0 = Date.now(), need = !AS.id || (++AS.tries % 8 === 0), imgs = {reloj: zona(v, ZONAS.reloj)};
      if (need) ['tagI', 'tagD', 'oroI', 'oroD', 'killI', 'killD'].forEach(function (k) { imgs[k] = zona(v, ZONAS[k]); });
      // el reloj puede llegar sin los dos puntos («112» = 1:12): con 3 o 4 cifras, las dos últimas son los segundos
      var r = await leer(imgs), rl = String(r.reloj || '').replace(/[^\d:]/g, ''), m = rl.match(/(\d{1,2}):(\d{2})/) || rl.match(/^(\d{1,2})(\d{2})$/);
      if (!m || +m[2] > 59) { asEstado(AS.id ? 'sincronizado · sin reloj a la vista' : 'buscando el reloj del juego…', !!AS.id); return; }
      var gt = +m[1] * 60 + +m[2] + (v.paused ? 0 : (Date.now() - t0) / 1000 * (v.playbackRate || 1) * 0.5);
      // dos lecturas coherentes seguidas antes de confiar
      var p = AS.prev; AS.prev = {gt: gt, at: Date.now(), rate: v.paused ? 0 : (v.playbackRate || 1)};
      if (!p || Math.abs((gt - p.gt) - (AS.prev.at - p.at) / 1000 * AS.prev.rate) > 3) { if (!AS.id) asEstado('leyendo el reloj… ' + m[1] + ':' + m[2]); return; }
      if (need) {
        var num = function (x) { var q = String(x || '').match(/\d+(\.\d)?/); return q ? parseFloat(q[0]) : null; };
        var tags = [String(r.tagI || '').trim(), String(r.tagD || '').trim()];
        var gold = [num(r.oroI), num(r.oroD)], kills = [num(r.killI), num(r.killD)];
        var id = await R.identify({gt: gt, tags: tags, gold: gold[0] != null && gold[1] != null ? gold : null, kills: kills[0] != null && kills[1] != null ? kills : null});
        if (id && (!AS.id || id.matchId !== AS.id.matchId || id.juego !== AS.id.juego)) { AS.id = id; anclar(v, gt); }
      }
      if (!AS.id) { asEstado('no reconozco el partido todavía…'); return; }
      var e = esperado(v);
      if (e == null || Math.abs(gt - e) > 2) anclar(v, gt);
      asEstado('auto · ' + AS.id.codes.join(' vs ') + ' · J' + AS.id.juego + ' · ' + m[1] + ':' + m[2], true);
    } catch (err) {
      asEstado(/insecure|tainted|SecurityError/i.test(String(err)) ? 'este video no se puede leer (protegido)' : 'auto-sync: ' + String(err).slice(0, 40));
    } finally { AS.busy = false; }
  }
  setInterval(function () { asTick(); }, 2000);
  // pausa, velocidad o salto del video: re-anclar al instante con lo que ya sabemos
  ['pause', 'play', 'ratechange'].forEach(function (ev) { document.addEventListener(ev, function (e) {
    if (!AS.on || !AS.id || e.target !== mainVideo()) return; var g = esperado(e.target); if (g != null) anclar(e.target, g); }, true); });
  document.addEventListener('seeked', function (e) { if (AS.on && e.target === mainVideo()) { AS.anchor = null; AS.prev = null; } }, true);

  R.onUpdate(render);
  if (!window.RP_NO_AUTOSTART) R.start();
})();
