/* RiftPulse — motor autónomo para el overlay de espectador.
   Reutiliza EL MISMO modelo logístico (pesos MODELO) y el feed oficial de LoL Esports
   que la app. v1: probabilidad en vivo desde el feed (oro, kills, torres, dragones,
   almas, barón, inhibidores). El previo de Elo y la curva de draft quedan en 0
   (no se cargan aquí para mantener el motor ligero y sin DDragon). */
(function (root) {
  'use strict';

  // ---------- constantes (mismas que la app) ----------
  var KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';
  var API = 'https://esports-api.lolesports.com/persisted/gw/';
  var FEED = 'https://feed.lolesports.com/livestats/v1/';
  var HL = 'es-MX';
  var WORLDS = '98767975604431411';
  var DRAG = {
    ocean: ['Océano'], mountain: ['Montaña'], infernal: ['Infernal'], cloud: ['Nube'],
    hextech: ['Hextech'], chemtech: ['Quimtech'], elder: ['Ancestral']
  };
  // Modelo entrenado con juegos profesionales 2025–26 (idéntico al de la app).
  var MODELO = {"pre":{"w":[0.2099,0.8968,0.394,-0.1526,0.0837]},"min":{"10":[0.2402,0.8476,0.6668,-0.224,-0.2233,0.0,0.0968,0.3321,0.0,0.0,0.0,0.0779],"15":[0.2933,0.7776,0.4647,0.082,-0.0205,0.0,0.0,0.3271,0.0,0.0,0.0,0.1124],"20":[0.3102,0.6405,0.4355,0.0788,-0.0542,0.0012,0.0,0.3674,0.0,0.014,0.0,0.2169],"25":[0.3222,0.5485,0.3853,0.2027,-0.0673,-0.0616,0.2451,0.4423,-0.0819,-0.2113,0.015,0.274]},"juegos":2247};
  // Precisión verificada (backtest: 589 juegos que el modelo NO vio, ago–oct 2026). Mismo dato que la app.
  var PRECISION = {acc10: 0.6842, acc15: 0.7453, acc20: 0.7857, brier15: 0.1729, juegos: 589};

  // ---------- helpers ----------
  var k1 = function (g) { return (g / 1000).toFixed(1) + 'k'; };
  var mmss = function (s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  var https = function (u) { return (u || '').replace(/^http:/, 'https:'); };
  var iso10 = function (t) { return new Date(Math.floor(t / 10000) * 10000).toISOString().replace(/\.\d{3}Z$/, 'Z'); };
  var elementals = function (t) { return t.dragons.filter(function (d) { return d !== 'elder'; }); };
  function lastBefore(frames, t) {
    if (!frames || !frames.length) return null;
    var out = null;
    for (var i = 0; i < frames.length; i++) { if (Date.parse(frames[i].rfc460Timestamp) <= t) out = frames[i]; else break; }
    return out || frames[0];
  }

  // ---------- red (fetch directo; los endpoints de LoL Esports son CORS-abiertos) ----------
  async function fetchRetry(url, opts, tries) {
    tries = tries || 3; var err;
    for (var i = 0; i < tries; i++) {
      try {
        var r = await fetch(url, opts);
        if (r.ok || r.status === 204) return r;
        err = new Error('HTTP ' + r.status);
        if (r.status < 500 && r.status !== 429) break;
      } catch (e) { err = e; }
      if (i < tries - 1) await new Promise(function (res) { setTimeout(res, 400 * (i + 1)); });
    }
    throw err;
  }
  async function api(path, params) {
    var u = new URL(API + path);
    u.searchParams.set('hl', HL);
    for (var k in (params || {})) u.searchParams.set(k, params[k]);
    var r = await fetchRetry(u, {headers: {'x-api-key': KEY}});
    return (await r.json()).data;
  }
  var FEEDC = new Map();
  async function feed(kind, id, t) {
    var u = new URL(FEED + kind + '/' + id);
    if (t) u.searchParams.set('startingTime', iso10(t));
    var key = kind + '|' + id + '|' + (t ? iso10(t) : '');
    if (FEEDC.has(key)) return FEEDC.get(key);
    var r;
    try { r = await fetchRetry(u); } catch (e) { return null; }
    if (!r || r.status === 204) return null;
    var d = await r.json();
    // cachea los tramos de más de 2 min (ya no cambian)
    if (t && Date.now() - t > 120000 && FEEDC.size < 800) FEEDC.set(key, d);
    return d;
  }

  // ---------- estado del juego ----------
  var M = null;   // partido (serie)
  var G = null;   // juego actual
  function newGame(id) {
    return {id: id, meta: null, start: null, waiting: false, loading: true, last: null, lastTs: 0, paused: 0, gt: 0,
      samples: [], events: [], wp: null, ended: false,
      pre: null, draft: null,
      t: {dragon: {at: 300, elder: false}, baron: null, baronBuff: null, elderBuff: null, inhibs: []}};
  }
  function sideTeam(side) {
    var fb = {code: side === 'blue' ? 'AZUL' : 'ROJO'};
    if (!M) return fb;
    var id = G && G.meta ? G.meta[side + 'TeamMetadata'].esportsTeamId : null;
    if (!id) return M.teams[side === 'blue' ? 0 : 1] || fb;
    return M.teams.find(function (t) { return t.id === id; }) || M.teams[side === 'blue' ? 0 : 1] || fb;
  }
  var code = function (side) { return sideTeam(side).code; };
  function ev(gt, side, txt, kind) { G.events.push({gt: gt, side: side, txt: txt, kind: kind}); }

  function detect(prev, cur, gt) {
    ['blue', 'red'].forEach(function (side) {
      var a = prev[side + 'Team'], b = cur[side + 'Team'];
      b.dragons.slice(a.dragons.length).forEach(function (d) {
        if (d === 'elder') {
          G.t.elderBuff = {side: side, until: gt + 150}; G.t.dragon = {at: gt + 360, elder: true};
          ev(gt, side, 'Dragón Ancestral', 'elder');
        } else {
          var soul = elementals(b).length >= 4;
          G.t.dragon = {at: gt + (soul ? 360 : 300), elder: soul};
          ev(gt, side, 'Dragón ' + (DRAG[d] ? DRAG[d][0] : d) + (soul ? ' · ¡ALMA!' : ''), 'dragon');
        }
      });
      if (b.barons > a.barons) {
        G.t.baronBuff = {side: side, until: gt + 180, start: gt};
        G.t.baron = {at: gt + 360};
        ev(gt, side, 'Barón Nashor', 'baron');
      }
      if (b.towers > a.towers) ev(gt, side, (b.towers - a.towers > 1 ? (b.towers - a.towers) + ' torres' : 'Torre'), 'tower');
      for (var i = a.inhibitors; i < b.inhibitors; i++) { G.t.inhibs.push({side: side, until: gt + 300}); ev(gt, side, 'Inhibidor', 'inhib'); }
    });
    var k0 = prev.blueTeam.totalKills + prev.redTeam.totalKills;
    if (k0 === 0 && cur.blueTeam.totalKills + cur.redTeam.totalKills > 0)
      ev(gt, cur.blueTeam.totalKills > 0 ? 'blue' : 'red', 'Primera sangre', 'fb');
    var dk = (cur.blueTeam.totalKills - prev.blueTeam.totalKills) + (cur.redTeam.totalKills - prev.redTeam.totalKills);
    if (dk >= 3) {
      var bk = cur.blueTeam.totalKills - prev.blueTeam.totalKills, rk = cur.redTeam.totalKills - prev.redTeam.totalKills;
      ev(gt, bk >= rk ? 'blue' : 'red', 'Pelea: ' + code('blue') + ' ' + bk + ' – ' + rk + ' ' + code('red'), 'fight');
      G.fight = {gt: gt, win: bk >= rk ? 'blue' : 'red', players: G.players ? JSON.parse(JSON.stringify(G.players)) : null};
    }
  }

  // ---------- modelo (idéntico a winProbModelo de la app) ----------
  function modelW(min) {
    var ks = Object.keys(MODELO.min).map(Number).sort(function (a, b) { return a - b; });
    var pts = [[0, [MODELO.pre.w[0], 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]].concat(ks.map(function (k) { return [k, MODELO.min[k]]; }));
    if (min >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (var i = 1; i < pts.length; i++) if (min <= pts[i][0]) {
      var a = pts[i - 1][0], wa = pts[i - 1][1], bb = pts[i][0], wb = pts[i][1], t = (min - a) / (bb - a);
      return wa.map(function (v, j) { return v + (wb[j] - v) * t; });
    }
  }
  function winProb(f, gt) {
    var b = f.blueTeam, r = f.redTeam, min = gt / 60, parts = [], w = modelW(min);
    var el = function (t) { return elementals(t).length; }, eld = function (t) { return t.dragons.filter(function (d) { return d === 'elder'; }).length; };
    var gd = b.totalGold - r.totalGold;
    var pl = function (n, s1, s2) { return Math.abs(n) + ' ' + (Math.abs(n) === 1 ? s1 : s2); };
    var x = [1, G.pre ? (G.pre.zNoSide != null ? G.pre.zNoSide : G.pre.z) : 0, gd / 1000, (b.totalKills - r.totalKills) / 5, b.towers - r.towers, b.inhibitors - r.inhibitors,
      b.barons - r.barons, el(b) - el(r), (el(b) >= 4 ? 1 : 0) - (el(r) >= 4 ? 1 : 0), (el(b) === 3 ? 1 : 0) - (el(r) === 3 ? 1 : 0), eld(b) - eld(r), G.draft ? (G.draft.blue.scale - G.draft.red.scale) * 10 : 0];
    var txt = ['Lado del mapa', 'Predicción previa', k1(Math.abs(gd)) + ' de oro de ventaja', pl(b.totalKills - r.totalKills, 'kill más', 'kills más'),
      pl(b.towers - r.towers, 'torre más', 'torres más'), pl(b.inhibitors - r.inhibitors, 'inhibidor más', 'inhibidores más'), pl(b.barons - r.barons, 'Barón más', 'Barones más'),
      pl(el(b) - el(r), 'dragón más', 'dragones más'), 'Alma de dragón', 'Punto de alma', 'Dragón Ancestral', 'Curva del draft'];
    var zAll = 0;
    x.forEach(function (v, i) { var z = w[i] * v; zAll += z; if (Math.abs(z) > 0.01 && (i < 2 || w[i] > 0)) parts.push({z: z, txt: txt[i]}); });
    var z = Math.max(-4.6, Math.min(4.6, zAll));
    return {p: 1 / (1 + Math.exp(-z)), parts: parts.sort(function (a, c) { return Math.abs(c.z) - Math.abs(a.z); }).slice(0, 4)};
  }

  function processFrame(f) {
    var ts = Date.parse(f.rfc460Timestamp);
    if (ts <= G.lastTs) return;
    var prev = G.last;
    if (prev && prev.gameState === 'paused') G.paused += ts - G.lastTs;
    var gt = Math.max(0, (ts - G.start - G.paused) / 1000);
    if (prev) detect(prev, f, gt);
    G.last = f; G.lastTs = ts; G.gt = gt;
    G.wp = winProb(f, gt);
    var s = G.samples[G.samples.length - 1];
    if (!s || gt - s.gt >= 10) G.samples.push({gt: gt, diff: f.blueTeam.totalGold - f.redTeam.totalGold, p: G.wp.p});
    if (f.gameState === 'finished') { G.ended = true; }
    emit();
  }

  // ---------- retraso del stream (sincronía) ----------
  var VIDEO_DEFAULT = 42;
  var videoDelay = (function () { try { return +(localStorage.getItem('rp_retraso') || VIDEO_DEFAULT); } catch (e) { return VIDEO_DEFAULT; } })();
  var delay = videoDelay;
  var now = function () { return Date.now(); };
  var REPLAY = null;  // modo repetición: {base, real, vel}
  var dataTime = function () { return REPLAY ? (REPLAY.base + (Date.now() - REPLAY.real) * REPLAY.vel) : (now() - delay * 1000); };

  // ---------- descubrir y seguir el partido en vivo ----------
  var GEN = 0;
  async function findLive() {
    var d = await api('getLive');
    var events = (d.schedule.events || []).filter(function (e) { return e.type === 'match' && e.match; });
    // preferir Worlds; si no, el primero
    return events.find(function (e) { return e.league && e.league.slug === 'worlds'; }) || events[0] || null;
  }
  async function loadEvent(id) {
    var d = await api('getEventDetails', {id: id});
    var e = d.event;
    M = {id: id, league: e.league, strategy: e.match.strategy, teams: e.match.teams, games: e.match.games};
    return M.games.find(function (x) { return x.state === 'inProgress'; });
  }
  var NEXTM = null;  // próximo partido (cuando no hay nada en vivo)
  async function upcoming() {
    var d = await api('getSchedule', {leagueId: WORLDS});
    var ev = (d.schedule.events || []).filter(function (e) { return e.state === 'unstarted' && e.match && (e.match.teams || []).every(function (t) { return t.code && t.code !== 'TBD'; }); })[0];
    return ev ? {blue: ev.match.teams[0].code, red: ev.match.teams[1].code, at: ev.startTime, block: ev.blockName || ''} : null;
  }
  async function startGame(id) {
    var gen = ++GEN;
    G = newGame(id);
    var w0;
    try { w0 = await feed('window', id); } catch (e) { w0 = null; }
    if (gen !== GEN) return;
    if (!w0 || !w0.frames || !w0.frames.length) { G.waiting = true; G.loading = false; emit(); return; }
    G.waiting = false; G.meta = w0.gameMetadata;
    G.start = Date.parse(w0.frames[0].rfc460Timestamp);
    processFrame(w0.frames[0]);
    G.loading = false;
    await tickWindow();
  }
  async function tickWindow() {
    if (!G || G.loading) { if (G && G.waiting) { await startGame(G.id); } return; }
    if (!G.start) return;
    var t = dataTime(), g0 = G;
    var w = await feed('window', G.id, t);
    if (G !== g0 || G.loading) return;
    var f = w && lastBefore(w.frames, t);
    if (f) processFrame(f);
    try { var dd = await feed('details', G.id, t); if (G === g0) { var df = dd && lastBefore(dd.frames, t); if (df) updatePlayers(df); } } catch (e) {}
  }
  function shortName(s) { s = String(s || ''); var i = s.indexOf(' '); return i > 0 ? s.slice(i + 1) : s; }
  function updatePlayers(df) {
    if (!G || !G.meta || !df || !df.participants) return;
    function sideP(key) {
      var md = (G.meta[key] || {}).participantMetadata || [];
      return md.map(function (p) { var st = df.participants.find(function (x) { return x.participantId === p.participantId; }); return {name: shortName(p.summonerName), role: p.role, share: st ? (st.championDamageShare || 0) : 0}; }).sort(function (a, b) { return b.share - a.share; });
    }
    G.players = {blue: sideP('blueTeamMetadata'), red: sideP('redTeamMetadata')};
  }

  // ---------- suscripción / snapshot ----------
  var subs = [];
  function tstat(t) { return {gold: t.totalGold, kills: t.totalKills, towers: t.towers, inhibs: t.inhibitors, barons: t.barons,
    dragons: t.dragons.filter(function (d) { return d !== 'elder'; }).length, elders: t.dragons.filter(function (d) { return d === 'elder'; }).length}; }
  // Impacto del próximo objetivo: cuánto movería la probabilidad si cada equipo lo toma (simulación con el modelo).
  function impactNext() {
    if (!G || !G.last || !G.wp || !G.t) return null;
    var gt = G.gt, t = G.t, pick = null;
    if (t.dragon && t.dragon.at > gt) pick = {kind: 'dragon', name: t.dragon.elder ? 'Ancestral' : 'Dragón', at: t.dragon.at};
    if (t.baron && t.baron.at > gt && (!pick || t.baron.at < pick.at)) pick = {kind: 'baron', name: 'Barón', at: t.baron.at};
    if (!pick) return null;
    var base = G.wp.p;
    function sim(side) {
      var f; try { f = JSON.parse(JSON.stringify(G.last)); } catch (e) { return base; }
      var tm = f[side + 'Team'];
      if (pick.kind === 'baron') tm.barons = (tm.barons || 0) + 1;
      else tm.dragons = (tm.dragons || []).concat([pick.name === 'Ancestral' ? 'elder' : 'mountain']);
      return winProb(f, gt).p;
    }
    return {obj: pick.name, at: pick.at, blue: Math.round((sim('blue') - base) * 100), red: Math.round((base - sim('red')) * 100)};
  }
  function snapshot() {
    var blueCode = code('blue'), redCode = code('red');
    var bt = sideTeam('blue'), rt = sideTeam('red');
    var score = M ? M.teams.map(function (t) { return (t.result || {}).gameWins; }) : null;
    return {
      ok: !!(G && G.wp),
      match: M ? {id: M.id, league: M.league ? M.league.name : '', strategy: M.strategy,
        blue: {code: bt.code, img: https(bt.image || ''), wins: (bt.result || {}).gameWins},
        red: {code: rt.code, img: https(rt.image || ''), wins: (rt.result || {}).gameWins}} : null,
      game: G ? {id: G.id, gt: G.gt, state: G.last ? G.last.gameState : null, ended: !!G.ended,
        waiting: !!G.waiting, pBlue: G.wp ? G.wp.p : null,
        reasons: G.wp ? G.wp.parts : [], events: G.events.slice(-8), timers: G.t,
        stats: G.last ? {blue: tstat(G.last.blueTeam), red: tstat(G.last.redTeam)} : null,
        samples: G.samples ? G.samples.slice() : [], impact: impactNext(),
        fight: G.fight && G.fight.players ? {gt: G.fight.gt, win: G.fight.win, blue: G.fight.players.blue, red: G.fight.players.red} : null} : null,
      blueCode: blueCode, redCode: redCode, delay: delay, precision: PRECISION, next: NEXTM, at: Date.now()
    };
  }
  function emit() { var s = snapshot(); for (var i = 0; i < subs.length; i++) { try { subs[i](s); } catch (e) {} } }

  // ---------- API pública ----------
  var loopId = null, liveId = null, running = false;
  var RiftEngine = {
    get state() { return snapshot(); },
    get delay() { return delay; },
    setDelay: function (sec) { delay = Math.max(0, Math.round(sec)); try { localStorage.setItem('rp_retraso', delay); } catch (e) {} emit(); },
    nudge: function (sec) { this.setDelay(delay + sec); },
    // clavar el overlay al minuto del juego que se ve en pantalla (sincronía exacta en un paso)
    syncTo: function (secs) { if (!G || !G.start || REPLAY) return false; this.setDelay((now() - G.start - G.paused) / 1000 - secs); return true; },
    onUpdate: function (fn) { if (typeof fn === 'function') { subs.push(fn); try { fn(snapshot()); } catch (e) {} } return function () { subs = subs.filter(function (f) { return f !== fn; }); }; },
    findLive: findLive,
    // arranca: busca el partido en vivo, lo carga y sigue el feed cada 2 s
    start: async function () {
      if (running) return; running = true;
      var self = this;
      async function sync() {
        try {
          var evt = await findLive();
          if (evt && (!M || M.id !== evt.id)) { var g = await loadEvent(evt.id); if (g) await startGame(g.id); }
          else if (evt && M && (!G || G.ended)) { var g2 = await loadEvent(evt.id); if (g2 && (!G || g2.id !== G.id)) await startGame(g2.id); }
          else if (!evt) { M = null; G = null; try { NEXTM = await upcoming(); } catch (e) {} emit(); }
        } catch (e) {}
      }
      await sync();
      liveId = setInterval(sync, 30000);
      loopId = setInterval(function () { tickWindow().catch(function () {}); }, 2000);
    },
    stop: function () { running = false; if (loopId) clearInterval(loopId); if (liveId) clearInterval(liveId); loopId = liveId = null; },
    // ---------- modo repetición (para probar sobre un VOD) ----------
    // lista de partidos de Worlds ya jugados, para elegir cuál repetir
    recentGames: async function () {
      var all = [], token = null;
      for (var i = 0; i < 4; i++) {
        var params = {leagueId: WORLDS}; if (token) params.pageToken = token;
        var d; try { d = await api('getSchedule', params); } catch (e) { break; }
        all = all.concat(d.schedule.events || []);
        token = d.schedule.pages && d.schedule.pages.older; if (!token) break;
      }
      return all.filter(function (e) { return e.state === 'completed' && e.match && (e.match.teams || []).every(function (t) { return t.code && t.code !== 'TBD'; }); })
        .map(function (e) { return {id: e.match.id, blue: e.match.teams[0].code, red: e.match.teams[1].code, bo: (e.match.strategy || {}).count || 1, date: e.startTime, block: e.blockName || ''}; }).reverse();
    },
    // reproduce un juego ya jugado desde el minuto `min`, acelerado `vel` veces
    replay: async function (eventId, juego, min, vel) {
      this.stop(); running = true; REPLAY = null; M = null; G = null;
      var d = await api('getEventDetails', {id: eventId}); var e = d.event;
      M = {id: eventId, league: e.league, strategy: e.match.strategy, teams: e.match.teams, games: e.match.games};
      var g = M.games[(juego || 1) - 1] || M.games.find(function (x) { return x.state !== 'unstarted'; });
      if (!g) { emit(); return; }
      var w0; try { w0 = await feed('window', g.id); } catch (ex) { w0 = null; }
      if (!w0 || !w0.frames || !w0.frames.length) { emit(); return; }
      G = newGame(g.id); G.meta = w0.gameMetadata; G.start = Date.parse(w0.frames[0].rfc460Timestamp); G.waiting = false; G.loading = false;
      processFrame(w0.frames[0]);
      var startMs = G.start + Math.max(0.1, (min == null ? 8 : min)) * 60000;
      for (var t = G.start + 30000; t < startMs; t += 30000) { try { var w = await feed('window', g.id, t); var f = w && lastBefore(w.frames, t); if (f) processFrame(f); } catch (ex2) {} }
      REPLAY = {base: startMs, real: Date.now(), vel: vel || 6};
      emit();
      loopId = setInterval(function () { tickWindow().catch(function () {}); }, 1000);
    }
  };

  RiftEngine.MODELO = MODELO;       // fuente única de los pesos del modelo (la app los lee de aquí)
  RiftEngine.PRECISION = PRECISION;
  root.RiftEngine = RiftEngine;
})(typeof window !== 'undefined' ? window : this);
