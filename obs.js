/* RiftPulse — gráficos de transmisión para OBS (Browser Source).
   Página transparente. Autodetecta el partido de Worlds en vivo vía window.RiftEngine.
   Una sola base, varias piezas conmutables con ?view= :
     bar (lower-third, por defecto) · big (tarjeta grande) · alert (alerta de momentum)
     objectives (bug de objetivos) · keys (claves del momento)
   La vista "bar" además obedece al panel de control (control.html) en vivo por
   BroadcastChannel + localStorage (ambos dentro de OBS comparten navegador).
   Nota: el pronóstico previo (Elo) y "lo predijimos" requieren portar el Elo al motor;
   aquí todo es el modelo EN VIVO. */
(function () {
  'use strict';
  if (!window.RiftEngine) { console.warn('[RiftPulse] falta engine.js'); return; }
  var R = window.RiftEngine, Q = new URLSearchParams(location.search);
  var VIEW = (Q.get('view') || 'bar').toLowerCase();
  var SCALE = Math.max(0.6, Math.min(2.4, parseFloat(Q.get('scale') || '1') || 1));

  // ---------- config (vista bar): defaults <- URL <- control ----------
  var cfg = {
    modules: (Q.get('modules') || 'prob,pregame,momentum,timers,brand').split(',').map(function (s) { return s.trim(); }),
    pos: (Q.get('pos') === 'top' ? 'top' : 'bottom'),
    hidden: false
  };
  try { var sv = JSON.parse(localStorage.getItem('rp_ctrl') || 'null'); if (sv && VIEW === 'bar') { if (sv.modules) cfg.modules = sv.modules; if (sv.pos) cfg.pos = sv.pos; if (sv.hidden != null) cfg.hidden = sv.hidden; } } catch (e) {}
  function has(m) { return cfg.modules.indexOf(m) >= 0; }

  var S = SCALE;
  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rpog" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff"/><stop offset=".5" stop-color="#9ab0e6"/><stop offset="1" stop-color="#ff5a5f"/></linearGradient></defs><rect x="3" y="3" width="58" height="58" rx="16" fill="#0d1320" stroke="#2b3c62" stroke-width="2"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rpog)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="30" cy="17" r="3.4" fill="#fff"/></svg>';

  // ---------- estilos ----------
  var css = '\
  .rp-ovl{position:fixed;display:flex;flex-direction:column;gap:14px;padding:26px;pointer-events:none;font-size:' + (16 * S) + 'px}\
  .rp-ovl.bottom{left:0;right:0;bottom:0;align-items:center;justify-content:flex-end}\
  .rp-ovl.top{left:0;right:0;top:0;align-items:center}\
  .rp-ovl.tl{top:0;left:0;align-items:flex-start}\
  .rp-ovl.tc{top:0;left:0;right:0;align-items:center}\
  .rp-ovl.hide{display:none}\
  .logo{display:block}\
  .rp-bar{display:flex;align-items:center;gap:18px;background:linear-gradient(180deg,rgba(16,24,40,.92),rgba(9,14,24,.94));\
    border:1px solid rgba(74,112,170,.5);border-radius:16px;padding:12px 18px;box-shadow:0 10px 36px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(3px)}\
  .rp-brand{display:flex;align-items:center;gap:9px;flex:none;padding-right:16px;border-right:1px solid rgba(74,112,170,.3)}\
  .rp-brand .logo{width:' + (34 * S) + 'px;height:' + (34 * S) + 'px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.5))}\
  .rp-bn{font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:' + (17 * S) + 'px;letter-spacing:.5px;line-height:1}\
  .rp-bs{font-size:' + (10.5 * S) + 'px;color:#3ddc97;font-weight:700;margin-top:2px}\
  .rp-core{display:flex;align-items:center;gap:14px}\
  .rp-tc{font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:' + (26 * S) + 'px;letter-spacing:.5px;font-variant-numeric:tabular-nums;text-shadow:0 2px 6px rgba(0,0,0,.6)}\
  .rp-tc.b{color:#7cc0ff}.rp-tc.r{color:#ff8a8f}\
  .rp-pbar{width:' + (360 * S) + 'px;height:' + (30 * S) + 'px;border-radius:9px;overflow:hidden;display:flex;font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:' + (15 * S) + 'px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}\
  .rp-pb{display:flex;align-items:center;padding:0 10px;color:#06121f;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);transition:width .7s cubic-bezier(.4,0,.2,1)}\
  .rp-pr{display:flex;align-items:center;justify-content:flex-end;padding:0 10px;color:#fff;background:linear-gradient(180deg,#ff5a5f,#c3506a);transition:width .7s cubic-bezier(.4,0,.2,1)}\
  .rp-pb.lead{box-shadow:0 0 16px rgba(74,163,255,.6),inset 0 0 22px rgba(255,255,255,.22)}\
  .rp-pr.lead{box-shadow:0 0 16px rgba(255,90,95,.6),inset 0 0 22px rgba(255,255,255,.18)}\
  .rp-side{display:flex;align-items:center;gap:16px;flex:none;padding-left:16px;border-left:1px solid rgba(74,112,170,.3);font-family:"Chakra Petch",sans-serif;font-variant-numeric:tabular-nums}\
  .rp-tm{display:flex;flex-direction:column;align-items:center;line-height:1.1}\
  .rp-tm .v{font-weight:700;font-size:' + (18 * S) + 'px}.rp-tm .k{font-size:' + (9.5 * S) + 'px;color:#8b97b0;text-transform:uppercase;letter-spacing:.6px;font-family:"Inter"}\
  .rp-gt{font-weight:700;font-size:' + (18 * S) + 'px;color:#cdd7ea}\
  .rp-callout{display:flex;align-items:center;gap:9px;background:linear-gradient(180deg,rgba(20,29,48,.96),rgba(12,18,30,.96));\
    border:1px solid rgba(242,193,78,.55);border-radius:12px;padding:9px 16px;font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:' + (16 * S) + 'px;color:#f3e3bd;\
    box-shadow:0 8px 28px rgba(0,0,0,.5);opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}\
  .rp-callout.show{opacity:1;transform:none}\
  .rp-callout .zap{color:#f2c14e;font-size:' + (18 * S) + 'px}\
  .rp-callout .cc.b{color:#7cc0ff}.rp-callout .cc.r{color:#ff8a8f}\
  /* big */\
  .rp-big{background:linear-gradient(180deg,rgba(16,24,40,.94),rgba(9,14,24,.95));border:1px solid rgba(74,112,170,.5);border-radius:18px;padding:18px 22px;\
    box-shadow:0 14px 44px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06);min-width:' + (320 * S) + 'px}\
  .rp-big .hd{display:flex;align-items:center;gap:10px;margin-bottom:12px}\
  .rp-big .hd .logo{width:' + (26 * S) + 'px;height:' + (26 * S) + 'px}\
  .rp-big .hd .t{font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:' + (13 * S) + 'px;letter-spacing:.8px;text-transform:uppercase;color:#cdd7ea}\
  .rp-big .n{font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:' + (56 * S) + 'px;line-height:1;font-variant-numeric:tabular-nums}\
  .rp-big .who{font-size:' + (15 * S) + 'px;color:#8b97b0;margin:4px 0 12px}\
  /* keys */\
  .rp-keys{background:linear-gradient(180deg,rgba(16,24,40,.94),rgba(9,14,24,.95));border:1px solid rgba(74,112,170,.5);border-radius:16px;padding:16px 20px;box-shadow:0 12px 40px rgba(0,0,0,.6);min-width:' + (320 * S) + 'px}\
  .rp-keys .t{font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:' + (13 * S) + 'px;letter-spacing:.8px;text-transform:uppercase;color:#f2c14e;margin-bottom:10px}\
  .rp-keys ul{list-style:none;margin:0;padding:0}\
  .rp-keys li{display:flex;align-items:center;gap:10px;font-size:' + (16 * S) + 'px;padding:6px 0}\
  .rp-keys .d{width:9px;height:9px;border-radius:50%;flex:none}.rp-keys .d.b{background:#4aa3ff}.rp-keys .d.r{background:#ff5a5f}\
  /* objectives */\
  .rp-obj{display:flex;gap:10px;background:linear-gradient(180deg,rgba(16,24,40,.92),rgba(9,14,24,.94));border:1px solid rgba(74,112,170,.5);\
    border-radius:14px;padding:10px 14px;box-shadow:0 10px 32px rgba(0,0,0,.55);font-family:"Chakra Petch",sans-serif;font-variant-numeric:tabular-nums}\
  .rp-obj .tm{display:flex;flex-direction:column;align-items:center;line-height:1.1}\
  .rp-obj .v{font-weight:700;font-size:' + (20 * S) + 'px}.rp-obj .k{font-size:' + (10 * S) + 'px;color:#8b97b0;text-transform:uppercase;letter-spacing:.6px;font-family:"Inter"}\
  ';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function nextObj(t, gt) {
    if (!t) return null;
    if (t.dragon && t.dragon.at > gt) return {k: t.dragon.elder ? 'Ancestral' : 'Dragón', v: mmss(t.dragon.at - gt)};
    if (t.baron && t.baron.at > gt) return {k: 'Barón', v: mmss(t.baron.at - gt)};
    return null;
  }

  // ---------- contenedor ----------
  var posClass = VIEW === 'bar' ? cfg.pos : VIEW === 'alert' ? 'tc' : VIEW === 'objectives' || VIEW === 'big' || VIEW === 'keys' ? 'tl' : 'bottom';
  var ovl = document.createElement('div'); ovl.className = 'rp-ovl ' + posClass;
  var callout = document.createElement('div'); callout.className = 'rp-callout';
  var main = document.createElement('div');
  if (VIEW === 'bar') { main.className = 'rp-bar'; if (cfg.pos === 'top') { ovl.appendChild(main); ovl.appendChild(callout); } else { ovl.appendChild(callout); ovl.appendChild(main); } }
  else if (VIEW === 'alert') { ovl.appendChild(callout); }
  else { ovl.appendChild(main); }
  document.body.appendChild(ovl);
  function applyHidden() { ovl.classList.toggle('hide', !!cfg.hidden); }
  applyHidden();

  // ---------- render por vista ----------
  var hist = [], lastCallout = 0;

  function render(s) {
    if (VIEW === 'bar') return renderBar(s);
    if (VIEW === 'big') return renderBig(s);
    if (VIEW === 'keys') return renderKeys(s);
    if (VIEW === 'objectives') return renderObj(s);
    if (VIEW === 'alert') { if (s.game && s.game.pBlue != null) { hist.push({t: Date.now(), p: s.game.pBlue}); checkMomentum(s); } return; }
    renderBar(s);
  }

  function brandHTML(s) {
    var tr = (has('brand') && s.precision) ? '<div class="rp-bs">' + Math.round(s.precision.acc15 * 100) + '% de acierto</div>' : '';
    return '<div class="rp-brand">' + LOGO + '<div><div class="rp-bn">RiftPulse</div>' + tr + '</div></div>';
  }

  function renderBar(s) {
    ovl.className = 'rp-ovl ' + cfg.pos; applyHidden();
    if (!s.match) { main.style.display = 'none'; return; }
    main.style.display = 'flex';
    var m = s.match, g = s.game, core, side = '';
    if (g && g.pBlue != null && has('prob')) {
      var pb = Math.round(g.pBlue * 100), pr = 100 - pb, lb = pb >= pr ? ' lead' : '', lr = pr > pb ? ' lead' : '';
      core = '<div class="rp-core"><span class="rp-tc b">' + esc(m.blue.code) + '</span>' +
        '<div class="rp-pbar"><div class="rp-pb' + lb + '" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + pb + '%</div>' +
        '<div class="rp-pr' + lr + '" style="width:' + Math.min(85, Math.max(pr, 15)) + '%">' + pr + '%</div></div>' +
        '<span class="rp-tc r">' + esc(m.red.code) + '</span></div>';
      if (has('timers')) { var o = nextObj(g.timers, g.gt);
        side = '<div class="rp-side"><span class="rp-gt">' + mmss(g.gt) + '</span>' + (o ? '<div class="rp-tm"><span class="v">' + o.v + '</span><span class="k">' + o.k + '</span></div>' : '') + '</div>'; }
      main.innerHTML = brandHTML(s) + core + side;
      if (has('momentum')) { hist.push({t: Date.now(), p: g.pBlue}); checkMomentum(s); }
    } else if (has('pregame')) {
      main.innerHTML = brandHTML(s) + '<div class="rp-core"><span class="rp-tc b">' + esc(m.blue.code) + '</span><span class="rp-gt">vs</span><span class="rp-tc r">' + esc(m.red.code) + '</span></div>';
    } else { main.style.display = 'none'; }
  }

  function renderBig(s) {
    if (!s.match || !s.game || s.game.pBlue == null) { main.style.display = 'none'; return; }
    main.style.display = 'block'; main.className = 'rp-big';
    var m = s.match, pb = Math.round(s.game.pBlue * 100), lead = pb >= 50, lc = lead ? m.blue.code : m.red.code, lp = lead ? pb : 100 - pb;
    main.innerHTML = '<div class="hd">' + LOGO + '<span class="t">RiftPulse · probabilidad en vivo</span></div>' +
      '<div class="n" style="color:' + (lead ? '#7cc0ff' : '#ff8a8f') + '">' + lp + '%</div><div class="who">a favor de ' + esc(lc) + ' · min ' + mmss(s.game.gt) + '</div>' +
      '<div class="rp-pbar"><div class="rp-pb" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + esc(m.blue.code) + '</div><div class="rp-pr" style="width:' + Math.min(85, Math.max(100 - pb, 15)) + '%">' + esc(m.red.code) + '</div></div>';
  }

  function renderKeys(s) {
    if (!s.match || !s.game || !s.game.reasons || !s.game.reasons.length) { main.style.display = 'none'; return; }
    main.style.display = 'block'; main.className = 'rp-keys';
    var m = s.match, li = s.game.reasons.slice(0, 4).map(function (x) { var b = x.z >= 0; return '<li><span class="d ' + (b ? 'b' : 'r') + '"></span>' + esc(x.txt) + ' <span style="color:#8b97b0;margin-left:auto;font-size:.8em">' + (b ? m.blue.code : m.red.code) + '</span></li>'; }).join('');
    main.innerHTML = '<div class="t">⚑ Claves del momento</div><ul>' + li + '</ul>';
  }

  function renderObj(s) {
    if (!s.match || !s.game || s.game.pBlue == null) { main.style.display = 'none'; return; }
    main.style.display = 'flex'; main.className = 'rp-obj';
    var g = s.game, items = [['Tiempo', mmss(g.gt)]], o = nextObj(g.timers, g.gt);
    if (g.timers && g.timers.dragon && g.timers.dragon.at > g.gt) items.push([g.timers.dragon.elder ? 'Ancestral' : 'Dragón', mmss(g.timers.dragon.at - g.gt)]);
    if (g.timers && g.timers.baron && g.timers.baron.at > g.gt) items.push(['Barón', mmss(g.timers.baron.at - g.gt)]);
    main.innerHTML = items.map(function (a) { return '<div class="tm"><span class="v">' + a[1] + '</span><span class="k">' + a[0] + '</span></div>'; }).join('');
  }

  function showCallout(html) { callout.innerHTML = html; callout.classList.add('show'); setTimeout(function () { callout.classList.remove('show'); }, 7000); }
  function checkMomentum(s) {
    var now = Date.now(); hist = hist.filter(function (x) { return now - x.t <= 90000; });
    if (now - lastCallout < 18000) return;
    var past = null; for (var i = 0; i < hist.length; i++) { if (now - hist[i].t >= 38000) past = hist[i]; }
    if (!past) return;
    var d = Math.round((s.game.pBlue - past.p) * 100); if (Math.abs(d) < 12) return;
    var toB = d > 0, code = toB ? s.match.blue.code : s.match.red.code;
    var ev = (s.game.events || []).filter(function (e) { return ['baron', 'elder', 'dragon', 'inhib'].indexOf(e.kind) >= 0 && s.game.gt - e.gt <= 60; }).slice(-1)[0];
    lastCallout = now;
    showCallout('<span class="zap">⚡</span><span class="cc ' + (toB ? 'b' : 'r') + '">' + esc(code) + ' +' + Math.abs(d) + ' pts</span>' + (ev ? ' · ' + esc(ev.txt) : ''));
  }

  // ---------- panel de control (solo vista bar) ----------
  if (VIEW === 'bar') {
    function applyCtrl(o) {
      if (!o) return;
      if (o.modules) cfg.modules = o.modules;
      if (o.pos) cfg.pos = o.pos;
      if (o.hidden != null) cfg.hidden = o.hidden;
      if (o.testAlert) showCallout('<span class="zap">⚡</span><span class="cc b">Alerta de prueba</span>');
      if (R.state) render(R.state);
    }
    try { var bc = new BroadcastChannel('riftpulse-ctrl'); bc.onmessage = function (e) { applyCtrl(e.data); }; } catch (e) {}
    window.addEventListener('storage', function (e) { if (e.key === 'rp_ctrl') { try { applyCtrl(JSON.parse(e.newValue || 'null')); } catch (x) {} } });
  }

  R.onUpdate(render);
  R.start();
})();
