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
  var XY = (function () { try { return JSON.parse(ls('rp_xy6') || 'null'); } catch (e) { return null; } })();

  var host = document.createElement('div');
  host.id = 'rp-overlay-host';
  host.style.cssText = 'position:fixed;z-index:2147483646;max-width:96vw;';
  (document.body || document.documentElement).appendChild(host);
  var sh = host.attachShadow({mode: 'open'});
  function place() {
    if (XY) { host.style.left = XY.l + 'px'; host.style.top = XY.t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; return; }
    host.style.left = '50%'; host.style.transform = 'translateX(-50%)';
    if (POS === 'bottom') { host.style.bottom = '112px'; host.style.top = 'auto'; } else { host.style.top = '52px'; host.style.bottom = 'auto'; }
  }
  place();

  function rpFullscreen() { var fs = document.fullscreenElement || document.webkitFullscreenElement || null; var dest = fs || document.body; if (dest && host.parentNode !== dest) dest.appendChild(host); }
  document.addEventListener('fullscreenchange', rpFullscreen);
  document.addEventListener('webkitfullscreenchange', rpFullscreen);

  var CSS = '\
  :host{all:initial}*{box-sizing:border-box;font-family:"Chakra Petch",system-ui,Segoe UI,Roboto,sans-serif}\
  .w{position:relative;display:inline-flex;align-items:stretch;height:46px;border-radius:9px;overflow:visible;\
     background:linear-gradient(180deg,rgba(12,17,28,.92),rgba(7,10,18,.94));border:1px solid rgba(120,150,200,.32);\
     box-shadow:0 10px 30px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05);backdrop-filter:blur(7px);color:#e8edf7;cursor:grab}\
  .w.drag{cursor:grabbing}\
  .seg{display:flex;flex-direction:column;justify-content:center;padding:0 12px;border-right:1px solid rgba(120,150,200,.16);white-space:nowrap}\
  .seg:last-child{border-right:0}\
  .brand{align-items:center;flex-direction:row;gap:7px}.brand .logo{width:17px;height:17px;display:block}\
  .brand .bn{font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#aab6cc}\
  .prob{flex-direction:row;align-items:center;gap:9px}\
  .tc{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;text-shadow:0 2px 5px rgba(0,0,0,.6)}\
  .tc.b{color:#7cc0ff}.tc.r{color:#ff8a8f}\
  .bar{position:relative;width:188px;height:24px;border-radius:6px;overflow:hidden;display:flex;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}\
  .pb{display:flex;align-items:center;padding:0 8px;color:#06121f;font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pr{display:flex;align-items:center;justify-content:flex-end;padding:0 8px;color:#fff;font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#ff5a5f,#c3506a);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pb.lead{box-shadow:0 0 13px rgba(74,163,255,.6),inset 0 0 18px rgba(255,255,255,.22)}\
  .pr.lead{box-shadow:0 0 13px rgba(255,90,95,.6),inset 0 0 18px rgba(255,255,255,.18)}\
  .sl{font-size:9px;letter-spacing:.6px;text-transform:uppercase;color:#6b7791;line-height:1.3}\
  .sv{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.25;color:#cdd7ea}\
  .sv b{font-weight:700}.sv b.b{color:#7cc0ff}.sv b.r{color:#ff8a8f}.sv .mut{color:#8b97b0;font-weight:400;font-size:11px}\
  .obj .sv2{font-size:11px;color:#8b97b0}\
  .spark{display:flex;align-items:center;gap:8px}\
  .spark svg{display:block;width:96px;height:30px}\
  .acc{align-items:center}.acc .n{font-size:14px;font-weight:700;color:#3ddc97;font-variant-numeric:tabular-nums}.acc .l{font-size:8.5px;letter-spacing:.5px;text-transform:uppercase;color:#6b7791}\
  .next{flex-direction:row;align-items:center;gap:8px;font-weight:700}\
  .next .vs{font-size:14px;font-variant-numeric:tabular-nums}.next .vs .b{color:#7cc0ff}.next .vs .r{color:#ff8a8f}\
  .next .in{font-size:11px;color:#8b97b0;font-weight:400}\
  .wait{display:flex;align-items:center;padding:0 14px;font-size:12px;color:#8b97b0}\
  /* controles al pasar el mouse */\
  .ctl{position:absolute;left:50%;transform:translateX(-50%);top:calc(100% + 6px);display:none;gap:4px;align-items:center;\
     background:rgba(10,14,22,.95);border:1px solid rgba(120,150,200,.3);border-radius:8px;padding:4px 6px;box-shadow:0 8px 20px rgba(0,0,0,.5)}\
  .w:hover .ctl{display:flex}\
  .chip{font-size:10px;font-weight:700;color:#8b97b0;background:rgba(20,28,44,.7);border:1px solid rgba(120,150,200,.3);border-radius:99px;padding:2px 8px;cursor:pointer;white-space:nowrap}\
  .chip.on{color:#06121f;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);border-color:#4aa3ff}.chip:hover{color:#e8edf7}\
  .chip.on:hover{color:#06121f}\
  .ctl button.ic{width:18px;height:18px;border:1px solid rgba(120,150,200,.35);border-radius:5px;background:transparent;color:#8b97b0;font-size:11px;line-height:1;cursor:pointer;padding:0}\
  .ctl button.ic:hover{color:#fff;border-color:#4aa3ff}\
  .mom{position:absolute;left:50%;top:-22px;transform:translateX(-50%);display:none;align-items:center;gap:6px;background:rgba(10,14,22,.96);border:1px solid rgba(242,193,78,.5);border-radius:7px;padding:2px 9px;font-size:11px;font-weight:700;color:#f3e3bd;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.5);z-index:3}\
  .mom.show{display:flex}.mom .zap{color:#f2c14e}.mom .k.b{color:#7cc0ff}.mom .k.r{color:#ff8a8f}\
  .dmg{position:absolute;left:50%;top:calc(100% + 9px);transform:translateX(-50%);display:none;width:470px;max-width:92vw;\
     background:linear-gradient(180deg,rgba(13,19,31,.96),rgba(8,12,20,.97));border:1px solid rgba(120,150,200,.32);border-radius:11px;padding:9px 12px;box-shadow:0 12px 32px rgba(0,0,0,.6);z-index:4}\
  .dmg.show{display:block}\
  .dh{font-size:9.5px;letter-spacing:.8px;text-transform:uppercase;color:#6b7791;margin-bottom:7px;display:flex;justify-content:space-between}.dh .wl{color:#cdd7ea;font-weight:700}\
  .dcols{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px}\
  .drow{display:flex;align-items:center;gap:7px;padding:1px 0}\
  .dn{font-size:11px;font-weight:700;width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}\
  .dbar{flex:1;height:7px;border-radius:4px;background:rgba(120,150,200,.14);overflow:hidden}.dbar>div{height:7px;border-radius:4px}\
  .dcol.b .dbar>div{background:linear-gradient(90deg,#2f7fe0,#4aa3ff)}.dcol.r .dbar>div{background:linear-gradient(90deg,#c3506a,#ff5a5f)}\
  .dcol.b .dn{color:#7cc0ff}.dcol.r .dn{color:#ff8a8f}\
  .dp{font-size:10.5px;font-variant-numeric:tabular-nums;color:#aeb9cf;width:30px;text-align:right;flex:none}\
  .syncg{display:flex;align-items:center;gap:3px;font-size:9.5px;color:#8b97b0;border-left:1px solid rgba(120,150,200,.25);padding-left:6px;margin-left:2px}\
  .syncg input{width:42px;height:18px;background:rgba(20,28,44,.7);border:1px solid rgba(120,150,200,.3);border-radius:5px;color:#e8edf7;font:inherit;font-size:11px;text-align:center;padding:0 3px}\
  .syncg input:focus{outline:none;border-color:#4aa3ff}.syncg input.bad{border-color:#ff5a5f}\
  .syncg .gt{font-variant-numeric:tabular-nums;color:#aab6cc;font-weight:700}\
  ';

  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rplg" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff"/><stop offset=".5" stop-color="#9ab0e6"/><stop offset="1" stop-color="#ff5a5f"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="15" fill="#0d1320" stroke="#2b3c62" stroke-width="3"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rplg)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  sh.innerHTML = '<style>' + CSS + '</style><div class="w" id="w"><div class="mom" id="mom"></div><div class="dmg" id="dmg"></div><div id="body" style="display:inline-flex"></div>' +
    '<div class="ctl" id="ctl"><span class="chip" data-ext="obj">objetivo</span><span class="chip" data-ext="pg">trayectoria</span>' +
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
      html += '<div class="seg spark">' + miniSpark(g.samples || []) + '<div><span class="sl">trayectoria</span><span class="sv ' + (pb >= pr ? '' : '') + '">' + esc(pb >= pr ? m.blue.code : m.red.code) + ' ' + Math.max(pb, pr) + '%</span></div></div>';
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

  R.onUpdate(render);
  if (!window.RP_NO_AUTOSTART) R.start();
})();
