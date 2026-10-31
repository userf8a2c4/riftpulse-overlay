/* RiftPulse — «el chat contra el modelo». En el overlay de OBS con ?canal=nombre_del_canal: antes de cada Barón o dragón
   (y al empezar cada juego) el chat vota quién se lo lleva escribiendo 1 o 2 (o las siglas); RiftPulse muestra su
   predicción y, cuando pasa, quién acertó: el chat o el modelo, con un ranking del chat. Sin apuestas: solo puntos.
   El chat se lee de forma anónima (solo lectura, como cualquier visitante): no hace falta cuenta ni permisos. */
(function () {
  var Q = new URLSearchParams(window.RP_PARAMS || location.search), CANAL = (Q.get('canal') || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  var R = window.RiftEngine; if (!CANAL || !R) return;
  var EN = (function () { try { return localStorage.getItem('rp_lang') === 'en'; } catch (e) { return false; } })();
  var L = function (es, en) { return EN ? en : es; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var CLAVE = 'rp_chat_' + CANAL, DB;
  try { DB = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { DB = null; }
  DB = DB || {pts: {}, chat: {ok: 0, n: 0}, modelo: {ok: 0, n: 0}, hechas: {}};
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(DB)); } catch (e) {} }

  // ---------- la tarjeta (abajo a la izquierda, fuera del marcador y de la barra) ----------
  var css = document.createElement('style');
  css.textContent = '.rp-vt{position:fixed;left:28px;bottom:150px;width:360px;z-index:50;font-family:Inter Tight,system-ui,sans-serif;color:#f2f4f7;' +
    'background:rgba(12,14,18,.72);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 14px;box-shadow:0 12px 30px rgba(0,0,0,.45);' +
    'text-shadow:0 1px 2px rgba(0,0,0,.6);opacity:0;transform:translateY(10px);transition:opacity .4s,transform .4s;pointer-events:none}' +
    '.rp-vt.on{opacity:1;transform:none}.rp-vt h4{margin:0 0 6px;font:800 15px Saira Condensed,sans-serif;letter-spacing:.6px;text-transform:uppercase}' +
    '.rp-vt .vh{font-size:12px;color:#aab2c0;margin-bottom:8px}.rp-vt .vh b{color:#fff}' +
    '.rp-vt .vb{display:flex;height:22px;border-radius:6px;overflow:hidden;font:700 12px Inter Tight,sans-serif}.rp-vt .vb div{display:flex;align-items:center;padding:0 7px;white-space:nowrap;transition:width .6s}' +
    '.rp-vt .vb .a{background:var(--team-a,#3b82f6)}.rp-vt .vb .b{background:var(--team-b,#ef4444);justify-content:flex-end}' +
    '.rp-vt .vm{margin-top:8px;font-size:13px}.rp-vt .ok{color:#3ddc97}.rp-vt .no{color:#ff6b78}' +
    '.rp-vt .rk{margin-top:8px;font-size:12px;color:#c7cdd8}.rp-vt .rk b{color:#fff}.rp-vt .sc{float:right;font:700 12px Inter Tight,sans-serif;color:#aab2c0}';
  document.head.appendChild(css);
  var card = document.createElement('div'); card.className = 'rp-vt'; document.body.appendChild(card);
  function mostrar(html) { card.innerHTML = html; card.classList.add('on'); }
  function ocultar() { card.classList.remove('on'); }

  // ---------- el chat de Twitch (IRC por websocket, anónimo) ----------
  var ws = null, reintento = 0;
  function conectar() {
    try { ws = new WebSocket(window.RP_CHAT_WS || 'wss://irc-ws.chat.twitch.tv:443'); } catch (e) { return setTimeout(conectar, 10000); }
    ws.onopen = function () { reintento = 0; ws.send('NICK justinfan' + Math.floor(10000 + Math.random() * 80000)); ws.send('JOIN #' + CANAL); };
    ws.onmessage = function (e) {
      String(e.data).split('\r\n').forEach(function (l) {
        if (/^PING/.test(l)) { ws.send(l.replace('PING', 'PONG')); return; }
        var m = l.match(/^:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.*)$/); if (m) votar(m[1], m[2]);
      });
    };
    ws.onclose = function () { setTimeout(conectar, Math.min(30000, 2000 * Math.pow(2, reintento++))); };
  }
  conectar();

  // ---------- la votación ----------
  var V = null;  // {clave, tipo: 'objetivo'|'juego', obj, a, b, hasta, desde, modelo: {side, p}, v: {usuario: lado}, gt0, resultado}
  function votar(u, t) {
    if (!V || V.resultado || Date.now() > V.hasta) return;
    t = String(t).trim().toUpperCase().replace(/^!/, '');
    var side = t === '1' || t === V.a ? 'blue' : t === '2' || t === V.b ? 'red' : null;
    if (side) { V.v[u.toLowerCase()] = side; pintar(); }
  }
  function cuenta() { var a = 0, b = 0; for (var u in V.v) { if (V.v[u] === 'blue') a++; else b++; } return {a: a, b: b, n: a + b}; }
  function abrir(o) {
    V = {clave: o.clave, tipo: o.tipo, obj: o.obj || '', a: o.a, b: o.b, desde: Date.now(), hasta: Date.now() + (o.seg || 45) * 1000, modelo: o.modelo, v: {}, gt0: o.gt0 || 0, resultado: null};
    DB.hechas[o.clave] = 1; guardar(); pintar();
  }
  function cerrar(side) {
    if (!V || V.resultado) return;
    var c = cuenta(), mayoria = c.n ? (c.a >= c.b ? 'blue' : 'red') : null;
    V.resultado = {side: side, chat: mayoria === side, modelo: V.modelo.side === side, n: c.n, pct: c.n ? Math.round((side === 'blue' ? c.a : c.b) / c.n * 100) : 0};
    if (c.n) { DB.chat.n++; if (V.resultado.chat) DB.chat.ok++; }
    DB.modelo.n++; if (V.resultado.modelo) DB.modelo.ok++;
    for (var u in V.v) if (V.v[u] === side) DB.pts[u] = (DB.pts[u] || 0) + 1;
    guardar(); pintar();
    var este = V; setTimeout(function () { if (V === este) { V = null; ocultar(); } }, 14000);
  }
  function cancelar() { V = null; ocultar(); }
  function marcador() { return '<span class="sc">' + L('Chat', 'Chat') + ' ' + DB.chat.ok + ' · ' + L('Modelo', 'Model') + ' ' + DB.modelo.ok + '</span>'; }
  function ranking() {
    var top = Object.keys(DB.pts).sort(function (x, y) { return DB.pts[y] - DB.pts[x]; }).slice(0, 3);
    return top.length ? '<div class="rk">🏆 ' + top.map(function (u, i) { return '<b>' + esc(u) + '</b> ' + DB.pts[u]; }).join(' · ') + '</div>' : '';
  }
  function pintar() {
    if (!V) return ocultar();
    var c = cuenta(), pa = c.n ? Math.round(c.a / c.n * 100) : 50, q = V.tipo === 'juego' ? L('¿Quién gana este juego?', 'Who wins this game?') : L('¿Quién se lleva el ', 'Who takes the ') + esc(V.obj) + '?';
    var barra = '<div class="vb"><div class="a" style="width:' + Math.max(18, Math.min(82, pa)) + '%">1 ' + esc(V.a) + ' ' + (c.n ? pa + '%' : '') + '</div><div class="b" style="width:' + Math.max(18, Math.min(82, 100 - pa)) + '%">' + (c.n ? (100 - pa) + '% ' : '') + esc(V.b) + ' 2</div></div>';
    var mod = L('El modelo dice: ', 'The model says: ') + '<b>' + esc(V.modelo.side === 'blue' ? V.a : V.b) + '</b> (' + Math.round(V.modelo.p * 100) + ' %)';
    if (!V.resultado) {
      var abierta = Date.now() <= V.hasta;
      mostrar(marcador() + '<h4>🗳 ' + q + '</h4><div class="vh">' + (abierta ? L('Escribí <b>1</b> o <b>2</b> en el chat', 'Type <b>1</b> or <b>2</b> in chat') : L('Votación cerrada · a ver qué pasa', 'Voting closed · let\'s see')) + ' · ' + c.n + ' ' + L('votos', 'votes') + '</div>' + barra + '<div class="vm">' + mod + '</div>');
      return;
    }
    var r = V.resultado, gana = esc(r.side === 'blue' ? V.a : V.b);
    mostrar(marcador() + '<h4>' + (V.tipo === 'juego' ? gana + L(' gana el juego', ' wins the game') : gana + L(' se lleva el ', ' takes the ') + esc(V.obj)) + '</h4>' +
      '<div class="vm">' + L('El chat', 'Chat') + ': <b class="' + (r.chat ? 'ok' : 'no') + '">' + (r.n ? (r.chat ? '✓ ' : '✗ ') + r.pct + L(' % votó ', '% voted ') + gana : L('sin votos', 'no votes')) + '</b></div>' +
      '<div class="vm">' + L('El modelo', 'Model') + ': <b class="' + (r.modelo ? 'ok' : 'no') + '">' + (r.modelo ? '✓' : '✗') + ' ' + esc(V.modelo.side === 'blue' ? V.a : V.b) + '</b></div>' + ranking());
  }
  setInterval(function () { if (V && !V.resultado) pintar(); }, 1000);  // la cuenta regresiva de «votación abierta»

  // ---------- cuándo abrir y cómo resolver: del estado del motor ----------
  var KIND = {'Barón': ['baron'], 'Dragón': ['dragon'], 'Ancestral': ['elder', 'dragon']};
  R.onUpdate(function (s) {
    var g = s && s.game, m = s && s.match; if (!g || !m || g.pBlue == null) return;
    var a = m.blue.code, b = m.red.code, fav = g.pBlue >= 0.5 ? 'blue' : 'red', pf = Math.max(g.pBlue, 1 - g.pBlue);
    // resolver la abierta
    if (V && !V.resultado) {
      if (V.tipo === 'juego') { if (g.ended && g.recap) cerrar(g.recap.code === a ? 'blue' : 'red'); }
      else {
        var e = (g.events || []).filter(function (x) { return x.gt >= V.gt0 - 5 && (KIND[V.obj] || []).indexOf(x.kind) >= 0; })[0];
        if (e) cerrar(e.side); else if (g.gt - V.gt0 > 300 || g.ended) cancelar();
      }
      return;
    }
    if (V || g.ended) return;
    // al empezar el juego: ¿quién gana?
    var kj = 'juego' + g.id;
    if (g.gt < 150 && !DB.hechas[kj]) return abrir({clave: kj, tipo: 'juego', a: a, b: b, seg: 90, modelo: {side: fav, p: pf}, gt0: g.gt});
    // el minuto previo a un Barón o un dragón
    var im = g.impact; if (!im || !KIND[im.obj] || im.at - g.gt > 60 || im.at - g.gt < 5) return;
    var ko = 'obj' + g.id + im.obj + Math.round(im.at);
    if (!DB.hechas[ko]) abrir({clave: ko, tipo: 'objetivo', obj: im.obj, a: a, b: b, seg: Math.max(20, Math.min(50, im.at - g.gt)), modelo: {side: fav, p: pf}, gt0: g.gt});
  });
  // para el control y las pruebas
  window.RPVOTO = {abrir: abrir, cerrar: cerrar, votar: votar, estado: function () { return V ? JSON.parse(JSON.stringify(V)) : null; }, db: function () { return DB; },
    reiniciar: function () { DB = {pts: {}, chat: {ok: 0, n: 0}, modelo: {ok: 0, n: 0}, hechas: {}}; guardar(); cancelar(); }};
})();
