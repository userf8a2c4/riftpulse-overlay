/* RiftPulse — motor autónomo para el overlay de espectador.
   Reutiliza EL MISMO modelo logístico (pesos MODELO) y el feed oficial de LoL Esports
   que la app. v1: probabilidad en vivo desde el feed (oro, kills, torres, dragones,
   almas, barón, inhibidores). El previo de Elo y la curva de draft quedan en 0
   (no se cargan aquí para mantener el motor ligero y sin DDragon).
   Extras para casters: giros clave, ruta de remontada, serie en vivo, draft (descriptivo),
   cara a cara, duelos por línea, jugador clave y resumen post-juego. */
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
  // acierto medido según el minuto del juego (589 juegos que el modelo no vio): antes del juego 62 %, min 25 84 %
  function accAt(gt) {
    var pts = [[0, 0.62], [600, PRECISION.acc10], [900, PRECISION.acc15], [1200, PRECISION.acc20], [1500, 0.84]], m = (gt || 0);
    if (m >= 1500) return 0.84;
    for (var i = 1; i < pts.length; i++) if (m <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (m - a[0]) / (b[0] - a[0]); }
    return 0.84;
  }

  // ---------- helpers ----------
  var k1 = function (g) { return (g / 1000).toFixed(1).replace('.', ',') + 'k'; };
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
  var NET = {okAt: 0, errs: 0};  // última respuesta buena y fallos seguidos (tras los reintentos)
  async function fetchRetry(url, opts, tries) {
    tries = tries || 3; var err;
    for (var i = 0; i < tries; i++) {
      try {
        var r = await fetch(url, opts);
        if (r.ok || r.status === 204) { NET.okAt = Date.now(); NET.errs = 0; return r; }
        err = new Error('HTTP ' + r.status);
        if (r.status < 500 && r.status !== 429) break;
      } catch (e) { err = e; }
      if (i < tries - 1) await new Promise(function (res) { setTimeout(res, 400 * (i + 1)); });
    }
    NET.errs++;
    throw err;
  }
  async function api(path, params) {
    var u = new URL(API + path);
    u.searchParams.set('hl', HL);
    for (var k in (params || {})) u.searchParams.set(k, params[k]);
    var r = await fetchRetry(u, {headers: {'x-api-key': KEY}});
    try { return (await r.json()).data; } catch (e) { NET.errs++; throw e; }
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
    var d; try { d = await r.json(); } catch (e) { NET.errs++; return null; }
    // cachea los tramos de más de 2 min (ya no cambian)
    if (t && Date.now() - t > 120000 && FEEDC.size < 800) FEEDC.set(key, d);
    return d;
  }

  // ---------- estado del juego ----------
  var M = null;   // partido (serie)
  var G = null;   // juego actual
  function newGame(id) {
    return {id: id, meta: null, start: null, waiting: false, loading: true, last: null, lastTs: 0, paused: 0, gt: 0,
      samples: [], events: [], wp: null, ended: false, det: null, picos: [],
      pre: null, draft: null,
      t: {dragon: {at: 300, elder: false}, baron: {at: 1200}, baronBuff: null, elderBuff: null, inhibs: []}};  // el Barón aparece al min 20
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
    if (!s || gt - s.gt >= 10) G.samples.push({gt: gt, diff: f.blueTeam.totalGold - f.redTeam.totalGold, p: G.wp.p,
      kb: f.blueTeam.totalKills, kr: f.redTeam.totalKills, tb: f.blueTeam.towers, tr: f.redTeam.towers,
      db: f.blueTeam.dragons.length, dr: f.redTeam.dragons.length, bb: f.blueTeam.barons, br: f.redTeam.barons, ib: f.blueTeam.inhibitors, ir: f.redTeam.inhibitors});
    if (f.gameState === 'finished') { if (!G.ended && DEMO) DEMO.next = setTimeout(demoNext, 30000); G.ended = true; }
    emit();
  }

  // ---------- retraso del stream (sincronía) ----------
  var VIDEO_DEFAULT = 42;
  var videoDelay = (function () { try { return +(localStorage.getItem('rp_retraso') || VIDEO_DEFAULT); } catch (e) { return VIDEO_DEFAULT; } })();
  var delay = videoDelay;
  // ?delay=42 (segundos) en la URL de una pieza de OBS: manda sobre lo guardado y queda recordado
  try { var qd = new URLSearchParams(location.search).get('delay'); if (qd != null && qd !== '' && isFinite(+qd)) { delay = Math.max(0, Math.round(+qd)); localStorage.setItem('rp_retraso', delay); } } catch (e) {}
  // ?stale=25: segundos sin datos nuevos para avisar «datos retrasados»
  var STALE_S = (function () { try { var v = +new URLSearchParams(location.search).get('stale'); return v >= 5 ? v : 25; } catch (e) { return 25; } })();
  var now = function () { return Date.now(); };
  var REPLAY = null;  // modo repetición: {base, real, vel}
  var DEMO = null;    // modo demo: {list, i, vel, cur}: repite juegos reales del Mundial, uno tras otro
  var dataTime = function () { return REPLAY ? (REPLAY.base + (Date.now() - REPLAY.real) * REPLAY.vel) : (now() - delay * 1000); };

  // ---------- descubrir y seguir el partido en vivo ----------
  var GEN = 0;
  async function findLive() {
    var d = await api('getLive');
    var events = (d.schedule.events || []).filter(function (e) { return e.type === 'match' && e.match; });
    // preferir Worlds; si no, el primero
    return events.find(function (e) { return e.league && e.league.slug === 'worlds'; }) || events[0] || null;
  }
  async function loadEvent(id, gen) {
    var d = await api('getEventDetails', {id: id});
    if (gen != null && gen !== RUNGEN) return null;  // mientras esperaba se pasó a otro juego (repetición o video): no pisarlo
    var e = d.event;
    M = {id: id, league: e.league, strategy: e.match.strategy, teams: e.match.teams, games: e.match.games};
    if (M.teams.length === 2) loadH2H(M.teams[0].code, M.teams[1].code).catch(function () {});
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
    if (M) G.score0 = [(sideTeam('blue').result || {}).gameWins || 0, (sideTeam('red').result || {}).gameWins || 0];
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
    try { var dd = await feed('details', G.id, t); if (G === g0) { var df = dd && lastBefore(dd.frames, t); if (df) { updatePlayers(df); emit(); } } } catch (e) {}
  }
  function shortName(s) { s = String(s || ''); var i = s.indexOf(' '); return i > 0 ? s.slice(i + 1) : s; }
  function updatePlayers(df) {
    if (!G || !G.meta || !df || !df.participants) return;
    function sideP(key) {
      var md = (G.meta[key] || {}).participantMetadata || [];
      return md.map(function (p) {
        var st = df.participants.find(function (x) { return x.participantId === p.participantId; }) || {};
        return {name: shortName(p.summonerName), role: p.role, champ: champName(p.championId), champId: p.championId, share: st.championDamageShare || 0, kp: st.killParticipation || 0,
          k: st.kills || 0, d: st.deaths || 0, a: st.assists || 0, cs: st.creepScore || 0, gold: st.totalGoldEarned || 0, lvl: st.level || 1,
          wp: st.wardsPlaced, wd: st.wardsDestroyed, items: Array.isArray(st.items) ? st.items : null};
      });
    }
    var antes = G.roster;
    G.roster = {blue: sideP('blueTeamMetadata'), red: sideP('redTeamMetadata')};
    // qué campos trae de verdad el feed (lo que no viene, no se muestra)
    var todos = G.roster.blue.concat(G.roster.red);
    G.det = {wards: todos.some(function (p) { return typeof p.wp === 'number'; }), items: todos.some(function (p) { return p.items && p.items.length; })};
    if (G.det.items) cargarItems();
    // picos de poder: un jugador completa un ítem
    if (antes && ITEMS) ['blue', 'red'].forEach(function (side) {
      G.roster[side].forEach(function (p, i) {
        var a = antes[side][i], nuevos = completos(p.items).filter(function (id) { return completos(a && a.items).indexOf(id) < 0; });
        nuevos.forEach(function (id) { G.picos.push({gt: G.gt, side: side, name: p.name, champ: p.champ, item: ITEMS[id].n, n: completos(p.items).length}); });
      });
    });
    if (G.picos.length > 12) G.picos = G.picos.slice(-12);
    var byShare = function (a, b) { return b.share - a.share; };
    G.players = {blue: G.roster.blue.slice().sort(byShare), red: G.roster.red.slice().sort(byShare)};
  }

  // ---------- suscripción / snapshot ----------
  var subs = [];
  function tstat(t) { return {gold: t.totalGold, kills: t.totalKills, towers: t.towers, inhibs: t.inhibitors, barons: t.barons,
    dragons: t.dragons.filter(function (d) { return d !== 'elder'; }).length, elders: t.dragons.filter(function (d) { return d === 'elder'; }).length}; }
  // Impacto del próximo objetivo: cuánto movería la probabilidad si cada equipo lo toma (simulación con el modelo).
  function impactNext() {
    if (!G || !G.last || !G.wp || !G.t) return null;
    var gt = G.gt, t = G.t, pick = null;
    var dr = t.dragon ? {kind: 'dragon', name: t.dragon.elder ? 'Ancestral' : 'Dragón', at: t.dragon.at} : null, ba = t.baron ? {kind: 'baron', name: 'Barón', at: t.baron.at} : null;
    // si ya está en el mapa (nadie lo tomó), ese es el que se pelea: el Barón antes que el dragón; si no, el que aparece primero
    if (ba && ba.at <= gt) pick = ba; else if (dr && dr.at <= gt) pick = dr;
    else [dr, ba].forEach(function (c) { if (c && (!pick || c.at < pick.at)) pick = c; });
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

  // ---------- extras para casters y streamers ----------
  // Estadísticas pro por campeón (~2,200 juegos 2025–26, misma tabla que la app). Solo descriptivo: no entra al modelo.
  var CHAMP = {"RekSai":{"wr":0.5823,"res":0.0359,"scale":-0.1604,"g":67,"pres":0.0149},"Qiyana":{"wr":0.4899,"res":-0.0094,"scale":0.0293,"g":137,"pres":0.0305},"Ryze":{"wr":0.5256,"res":0.0302,"scale":0.0257,"g":614,"pres":0.1366},"Corki":{"wr":0.4707,"res":-0.0141,"scale":0.026,"g":398,"pres":0.0886},"Neeko":{"wr":0.5117,"res":0.0155,"scale":-0.0383,"g":287,"pres":0.0639},"Ambessa":{"wr":0.4786,"res":-0.0205,"scale":0.0897,"g":479,"pres":0.1066},"Trundle":{"wr":0.5442,"res":0.0227,"scale":0.0488,"g":203,"pres":0.0452},"Taliyah":{"wr":0.4898,"res":0.0018,"scale":-0.045,"g":282,"pres":0.0628},"Sivir":{"wr":0.5751,"res":0.0521,"scale":0.1019,"g":261,"pres":0.0581},"Alistar":{"wr":0.5275,"res":0.0159,"scale":-0.1359,"g":333,"pres":0.0741},"Sion":{"wr":0.4932,"res":-0.0094,"scale":0.0316,"g":353,"pres":0.0785},"MonkeyKing":{"wr":0.4597,"res":-0.0443,"scale":-0.0668,"g":360,"pres":0.0801},"Orianna":{"wr":0.5341,"res":0.0348,"scale":-0.0403,"g":413,"pres":0.0919},"Caitlyn":{"wr":0.5153,"res":0.0018,"scale":-0.0705,"g":283,"pres":0.063},"Karma":{"wr":0.5015,"res":-0.0034,"scale":-0.0317,"g":329,"pres":0.0732},"KSante":{"wr":0.4521,"res":-0.0378,"scale":0.1444,"g":479,"pres":0.1066},"JarvanIV":{"wr":0.5201,"res":0.0171,"scale":0.0565,"g":584,"pres":0.13},"Akali":{"wr":0.5492,"res":0.0449,"scale":0.0059,"g":232,"pres":0.0516},"MissFortune":{"wr":0.4695,"res":0.0012,"scale":0.0195,"g":152,"pres":0.0338},"Rakan":{"wr":0.5804,"res":0.0598,"scale":0.1214,"g":274,"pres":0.061},"Galio":{"wr":0.4856,"res":-0.0224,"scale":0.046,"g":231,"pres":0.0514},"XinZhao":{"wr":0.4648,"res":-0.0393,"scale":-0.0763,"g":528,"pres":0.1175},"Annie":{"wr":0.5263,"res":0.0094,"scale":0.0119,"g":254,"pres":0.0565},"Yunara":{"wr":0.4793,"res":-0.0291,"scale":-0.0387,"g":470,"pres":0.1046},"Renata":{"wr":0.4887,"res":-0.0311,"scale":0.1102,"g":121,"pres":0.0269},"Rumble":{"wr":0.522,"res":0.0336,"scale":0.0193,"g":555,"pres":0.1235},"Vi":{"wr":0.5346,"res":0.0295,"scale":-0.0308,"g":465,"pres":0.1035},"Hwei":{"wr":0.4314,"res":-0.0632,"scale":-0.2344,"g":39,"pres":0.0087},"Smolder":{"wr":0.3333,"res":-0.1251,"scale":-0.1545,"g":15,"pres":0.0033},"Leona":{"wr":0.5079,"res":0.0184,"scale":-0.0484,"g":179,"pres":0.0398},"Varus":{"wr":0.5225,"res":0.0192,"scale":-0.0069,"g":344,"pres":0.0765},"Pantheon":{"wr":0.5116,"res":0.0062,"scale":0.1159,"g":463,"pres":0.103},"Sylas":{"wr":0.4805,"res":-0.0299,"scale":0.0169,"g":142,"pres":0.0316},"Ziggs":{"wr":0.4383,"res":-0.0579,"scale":-0.1133,"g":150,"pres":0.0334},"Nautilus":{"wr":0.4261,"res":-0.0405,"scale":0.0041,"g":387,"pres":0.0861},"Ornn":{"wr":0.5763,"res":0.0603,"scale":0.071,"g":106,"pres":0.0236},"Nocturne":{"wr":0.4934,"res":0.0102,"scale":0.0474,"g":292,"pres":0.065},"Leblanc":{"wr":0.5269,"res":0.0137,"scale":-0.0173,"g":81,"pres":0.018},"Ashe":{"wr":0.6074,"res":0.0818,"scale":-0.0077,"g":314,"pres":0.0699},"Lulu":{"wr":0.4706,"res":-0.0298,"scale":-0.0967,"g":379,"pres":0.0843},"Renekton":{"wr":0.455,"res":-0.0395,"scale":0.021,"g":366,"pres":0.0814},"Aurora":{"wr":0.4392,"res":-0.0509,"scale":0.1509,"g":325,"pres":0.0723},"Kaisa":{"wr":0.4898,"res":-0.0108,"scale":0.0273,"g":184,"pres":0.0409},"Rell":{"wr":0.4304,"res":-0.0311,"scale":0.0868,"g":225,"pres":0.0501},"Ezreal":{"wr":0.5098,"res":0.0132,"scale":-0.0188,"g":549,"pres":0.1222},"Braum":{"wr":0.5213,"res":0.002,"scale":-0.0246,"g":82,"pres":0.0182},"Elise":{"wr":0.4857,"res":0.0341,"scale":0.0455,"g":23,"pres":0.0051},"Mordekaiser":{"wr":0.4167,"res":-0.0515,"scale":-0.1871,"g":12,"pres":0.0027},"Xayah":{"wr":0.6259,"res":0.1064,"scale":0.1444,"g":135,"pres":0.03},"Bard":{"wr":0.5246,"res":0.0124,"scale":0.0093,"g":436,"pres":0.097},"Azir":{"wr":0.4246,"res":-0.0861,"scale":0.0595,"g":313,"pres":0.0696},"Aatrox":{"wr":0.4688,"res":-0.0387,"scale":0.0479,"g":148,"pres":0.0329},"Lucian":{"wr":0.4417,"res":-0.0476,"scale":-0.032,"g":348,"pres":0.0774},"Swain":{"wr":0.5,"res":0.0026,"scale":0.0819,"g":12,"pres":0.0027},"Viktor":{"wr":0.5324,"res":0.0342,"scale":0.0749,"g":266,"pres":0.0592},"Jax":{"wr":0.4861,"res":0.0011,"scale":-0.0364,"g":132,"pres":0.0294},"Draven":{"wr":0.5,"res":0.0162,"scale":-0.1455,"g":16,"pres":0.0036},"Cassiopeia":{"wr":0.5634,"res":0.0538,"scale":-0.0698,"g":256,"pres":0.057},"Poppy":{"wr":0.5694,"res":0.0682,"scale":0.0393,"g":132,"pres":0.0294},"Naafiri":{"wr":0.5016,"res":0.0029,"scale":-0.0903,"g":293,"pres":0.0652},"Yorick":{"wr":0.5172,"res":0.0334,"scale":0.0221,"g":162,"pres":0.036},"Nami":{"wr":0.4745,"res":-0.0178,"scale":-0.0215,"g":243,"pres":0.0541},"Kled":{"wr":0.5814,"res":0.0471,"scale":0.0706,"g":31,"pres":0.0069},"Maokai":{"wr":0.4944,"res":0.0091,"scale":-0.1441,"g":77,"pres":0.0171},"Jhin":{"wr":0.4165,"res":-0.072,"scale":0.0558,"g":377,"pres":0.0839},"Anivia":{"wr":0.416,"res":-0.0776,"scale":-0.0864,"g":226,"pres":0.0503},"Senna":{"wr":0.5167,"res":0.031,"scale":0.0613,"g":48,"pres":0.0107},"Zeri":{"wr":0.4516,"res":-0.0514,"scale":-0.1016,"g":50,"pres":0.0111},"Vayne":{"wr":0.5347,"res":0.0205,"scale":-0.0476,"g":89,"pres":0.0198},"Sejuani":{"wr":0.4605,"res":-0.0258,"scale":-0.0051,"g":64,"pres":0.0142},"DrMundo":{"wr":0.4918,"res":0.0262,"scale":0.1961,"g":110,"pres":0.0245},"Jayce":{"wr":0.4354,"res":-0.0575,"scale":-0.1057,"g":367,"pres":0.0817},"Ahri":{"wr":0.5362,"res":0.0267,"scale":-0.1684,"g":292,"pres":0.065},"Yone":{"wr":0.4773,"res":0.0123,"scale":0.0465,"g":120,"pres":0.0267},"Viego":{"wr":0.3913,"res":-0.0494,"scale":0.0118,"g":11,"pres":0.0024},"Zoe":{"wr":0.5345,"res":0.0314,"scale":0.1277,"g":46,"pres":0.0102},"Skarner":{"wr":0.4897,"res":-0.0036,"scale":-0.138,"g":182,"pres":0.0405},"Ivern":{"wr":0.5882,"res":0.0554,"scale":0.1154,"g":5,"pres":0.0011},"Thresh":{"wr":0.4941,"res":0.0101,"scale":-0.0077,"g":73,"pres":0.0162},"Syndra":{"wr":0.4799,"res":-0.0103,"scale":-0.0718,"g":261,"pres":0.0581},"Gnar":{"wr":0.5482,"res":0.0261,"scale":-0.0464,"g":444,"pres":0.0988},"Kalista":{"wr":0.4836,"res":-0.0326,"scale":0.1657,"g":110,"pres":0.0245},"Camille":{"wr":0.5385,"res":0.0081,"scale":-0.1279,"g":157,"pres":0.0349},"Mel":{"wr":0.4091,"res":-0.0977,"scale":-0.0638,"g":98,"pres":0.0218},"Gragas":{"wr":0.4762,"res":-0.0069,"scale":-0.1911,"g":30,"pres":0.0067},"TahmKench":{"wr":0.4211,"res":-0.0468,"scale":-0.1,"g":7,"pres":0.0016},"Malphite":{"wr":0.4769,"res":-0.0196,"scale":-0.0273,"g":53,"pres":0.0118},"Aphelios":{"wr":0.458,"res":-0.0346,"scale":-0.0319,"g":119,"pres":0.0265},"Kennen":{"wr":0.5231,"res":0.022,"scale":-0.0063,"g":53,"pres":0.0118},"Zaahen":{"wr":0.5091,"res":0.0183,"scale":0.0963,"g":153,"pres":0.034},"LeeSin":{"wr":0.5321,"res":0.0421,"scale":-0.0149,"g":300,"pres":0.0668},"Gwen":{"wr":0.5079,"res":-0.0015,"scale":0.1058,"g":114,"pres":0.0254},"Ekko":{"wr":0.4118,"res":-0.0477,"scale":-0.1364,"g":5,"pres":0.0011},"Blitzcrank":{"wr":0.5333,"res":0.0278,"scale":0.0417,"g":18,"pres":0.004},"Jinx":{"wr":0.5217,"res":0.0295,"scale":-0.0833,"g":34,"pres":0.0076},"Shen":{"wr":0.5714,"res":0.07,"scale":-0.0441,"g":184,"pres":0.0409},"Olaf":{"wr":0.5217,"res":0.0217,"scale":-0.1111,"g":172,"pres":0.0383},"Volibear":{"wr":0.6061,"res":0.071,"scale":0.2152,"g":21,"pres":0.0047},"AurelionSol":{"wr":0.5,"res":0.0204,"scale":0.1833,"g":6,"pres":0.0013},"TwistedFate":{"wr":0.5584,"res":0.0206,"scale":0.1096,"g":142,"pres":0.0316},"Udyr":{"wr":0.3889,"res":-0.0871,"scale":-0.0598,"g":6,"pres":0.0013},"Seraphine":{"wr":0.5623,"res":0.0365,"scale":0.0252,"g":349,"pres":0.0777},"Nidalee":{"wr":0.5714,"res":0.0541,"scale":0.026,"g":16,"pres":0.0036},"Tristana":{"wr":0.5,"res":0.0228,"scale":0.0335,"g":46,"pres":0.0102},"Yuumi":{"wr":0.4783,"res":-0.0297,"scale":0.1143,"g":34,"pres":0.0076},"Milio":{"wr":0.4513,"res":-0.0352,"scale":0.0872,"g":265,"pres":0.059},"Chogath":{"wr":0.439,"res":-0.0538,"scale":0.0841,"g":29,"pres":0.0065},"Yasuo":{"wr":0.56,"res":0.0863,"scale":0.0101,"g":13,"pres":0.0029},"Pyke":{"wr":0.4737,"res":-0.0199,"scale":0.0116,"g":45,"pres":0.01},"Nasus":{"wr":0.5926,"res":0.0871,"scale":0.0375,"g":15,"pres":0.0033},"Khazix":{"wr":0.5,"res":0.0107,"scale":-0.0749,"g":12,"pres":0.0027},"Irelia":{"wr":0.4762,"res":0.0433,"scale":-0.0333,"g":9,"pres":0.002},"Lissandra":{"wr":0.4792,"res":-0.014,"scale":0.0151,"g":36,"pres":0.008},"KogMaw":{"wr":0.5357,"res":0.0318,"scale":-0.0833,"g":16,"pres":0.0036},"Vex":{"wr":0.4211,"res":-0.0384,"scale":-0.1984,"g":7,"pres":0.0016},"Lux":{"wr":0.6739,"res":0.1005,"scale":0.0303,"g":34,"pres":0.0076},"Xerath":{"wr":0.44,"res":-0.0417,"scale":-0.0714,"g":13,"pres":0.0029},"Shyvana":{"wr":0.5333,"res":0.0063,"scale":0.05,"g":18,"pres":0.004},"Urgot":{"wr":0.5294,"res":0.0015,"scale":0.1389,"g":5,"pres":0.0011},"Locke":{"wr":0.4432,"res":-0.0444,"scale":0.0221,"g":76,"pres":0.0169}};
  var ROLES = ['top', 'jungle', 'mid', 'bottom', 'support'];
  var ROL_ES = {top: 'Top', jungle: 'Jungla', mid: 'Mid', bottom: 'ADC', support: 'Soporte'};
  var CHAMP_ES = {MonkeyKing: 'Wukong', KSante: "K'Sante", Kaisa: "Kai'Sa", Khazix: "Kha'Zix", Chogath: "Cho'Gath", KogMaw: "Kog'Maw",
    RekSai: "Rek'Sai", Leblanc: 'LeBlanc', DrMundo: 'Dr. Mundo', JarvanIV: 'Jarvan IV', Velkoz: "Vel'Koz", Belveth: "Bel'Veth", Nunu: 'Nunu y Willump'};
  var champName = function (id) { id = String(id || ''); return CHAMP_ES[id] || id.replace(/([a-z])([A-Z])/g, '$1 $2'); };
  var other = function (side) { return side === 'blue' ? 'red' : 'blue'; };

  // la causa de un giro, dicha en castellano y desde el equipo del giro: «una pelea ganada 3–0 y el Barón»
  function causaTxt(cause, side) {
    var partes = String(cause || '').split(/,\s*/).filter(Boolean).map(function (c) {
      var p = c.match(/^Pelea:\s*\S+\s+(\d+)\s*[–-]\s*(\d+)\s+\S+/);
      if (p) { var a = +p[1], b = +p[2], mio = side === 'blue' ? a : b, suyo = side === 'blue' ? b : a; return mio >= suyo ? 'una pelea ganada ' + mio + '–' + suyo : 'una pelea perdida ' + mio + '–' + suyo; }
      if (/^Barón/.test(c)) return 'el Barón';
      if (/^Primera sangre/.test(c)) return 'la primera sangre';
      if (/^Inhibidor/.test(c)) return 'un inhibidor';
      if (/^Dragón/.test(c)) return 'el ' + c.replace(' · ¡ALMA!', ' (alma)');
      if (/torres?$/i.test(c)) return /^\d/.test(c) ? c : 'una torre';
      return c;
    });
    return partes.length > 1 ? partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] : partes[0] || '';
  }
  // Giros clave: tramos donde la probabilidad saltó 9 pts o más, con la causa más probable (eventos de ese equipo en el tramo).
  function keyMoments(maxN) {
    var S = G ? G.samples : null, out = [];
    if (!S || S.length < 3) return out;
    var base = S[0];
    for (var i = 1; i < S.length; i++) {
      var dir = Math.sign(S[i].p - base.p);
      if (!dir || Math.abs(S[i].p - base.p) < 0.09) continue;
      var j = i;  // se extiende mientras la ventaja siga creciendo en esa dirección (tolera 2 pts de ruido)
      while (j + 1 < S.length && (S[j + 1].p - base.p) * dir >= (S[j].p - base.p) * dir - 0.02) j++;
      var end = S[j], side = dir > 0 ? 'blue' : 'red', seen = {};
      var evs = G.events.filter(function (e) { return e.gt >= base.gt - 8 && e.gt <= end.gt + 4 && e.side === side && e.kind !== 'tower'; })
        .map(function (e) { return e.txt; }).filter(function (t) { return seen[t] ? false : (seen[t] = true); });
      out.push({a: base.gt, b: end.gt, d: end.p - base.p, side: side, code: code(side), cause: evs.length ? evs.slice(0, 2).join(', ') : 'ventaja de oro y presión en el mapa'});
      base = end; i = j;
    }
    return out.sort(function (x, y) { return Math.abs(y.d) - Math.abs(x.d); }).slice(0, maxN || 3).sort(function (x, y) { return x.a - y.a; });
  }

  // Qué necesita el que va abajo para volver al 50 %: prueba combinaciones pequeñas de objetivos con el mismo modelo.
  function comebackPaths() {
    if (!G || !G.last || !G.wp || G.ended || G.gt < 300) return null;
    var side = G.wp.p < 0.5 ? 'blue' : 'red', pNow = side === 'blue' ? G.wp.p : 1 - G.wp.p;
    if (pNow > 0.45) return null;
    var f0 = G.last, tm0 = f0[side + 'Team'], soulAny = elementals(f0.blueTeam).length >= 4 || elementals(f0.redTeam).length >= 4;
    var atoms = [];  // {txt, cost, grp, fn(team)}
    if (G.gt >= 1200) atoms.push({txt: 'Barón', cost: 2, grp: 'baron', fn: function (t) { t.barons = (t.barons || 0) + 1; }});
    if (soulAny) atoms.push({txt: 'Ancestral', cost: 2, grp: 'drag', fn: function (t) { t.dragons = t.dragons.concat(['elder']); }});
    else if (elementals(tm0).length === 3) atoms.push({txt: 'el alma', cost: 2, grp: 'drag', fn: function (t) { t.dragons = t.dragons.concat(['mountain']); }});
    else atoms.push({txt: 'un dragón', cost: 1, grp: 'drag', fn: function (t) { t.dragons = t.dragons.concat(['mountain']); }});
    [1, 2, 3].forEach(function (n) { if (tm0.towers + n <= 11) atoms.push({txt: n === 1 ? '1 torre' : n + ' torres', cost: n, grp: 'tower', fn: function (t) { t.towers += n; }}); });
    if (tm0.towers >= 3) atoms.push({txt: 'un inhibidor', cost: 2, grp: 'inhib', fn: function (t) { t.inhibitors += 1; }});
    atoms.push({txt: 'una pelea ganada (+3 kills)', cost: 1, grp: 'fight', fn: function (t) { t.totalKills += 3; t.totalGold += 1500; }});
    function evalSet(set) {
      var f; try { f = JSON.parse(JSON.stringify(f0)); } catch (e) { return 0; }
      set.forEach(function (a) { a.fn(f[side + 'Team']); });
      var p = winProb(f, G.gt).p; return side === 'blue' ? p : 1 - p;
    }
    var cands = [];
    function walk(start, set) {
      if (set.length) cands.push({set: set, cost: set.reduce(function (c, a) { return c + a.cost; }, 0), p: evalSet(set)});
      if (set.length === 3) return;
      for (var i = start; i < atoms.length; i++) {
        if (set.some(function (a) { return a.grp === atoms[i].grp; })) continue;
        walk(i + 1, set.concat([atoms[i]]));
      }
    }
    walk(0, []);
    var ok = cands.filter(function (c) { return c.p >= 0.5; }).sort(function (a, b) { return a.cost - b.cost || b.p - a.p; });
    var pick = ok.length ? ok.slice(0, 2) : cands.sort(function (a, b) { return b.p - a.p; }).slice(0, 1);
    var txt = function (c) { var t = c.set.map(function (a) { return a.txt; }); return t.length > 1 ? t.slice(0, -1).join(', ') + ' y ' + t[t.length - 1] : t[0]; };
    return {side: side, code: code(side), p: pNow, reached: ok.length > 0, paths: pick.map(function (c) { return {txt: txt(c), p: c.p}; })};
  }

  // Serie en vivo: probabilidad de llevarse la serie, si se gana o se pierde este juego (los juegos que faltan cuentan 50/50).
  function seriesNow() {
    if (!M || !G || !G.wp || G.ended || !M.strategy || REPLAY) return null;  // en repeticiones el feed solo trae el marcador final
    var bo = M.strategy.count || 1, need = Math.ceil(bo / 2);
    var wb = (sideTeam('blue').result || {}).gameWins || 0, wr = (sideTeam('red').result || {}).gameWins || 0;
    if (wb >= need || wr >= need) return null;
    // los mapas que faltan se estiman con la fuerza de cada equipo (Elo); sin datos, 50/50
    var pm = pMapa(code('blue'), code('red')), q = pm == null ? 0.5 : pm;
    function f(x, y) { return x >= need ? 1 : y >= need ? 0 : q * f(x + 1, y) + (1 - q) * f(x, y + 1); }
    var ifB = f(wb + 1, wr), ifR = f(wb, wr + 1), p = G.wp.p;
    return {bo: bo, need: need, score: [wb, wr], ifBlue: ifB, ifRed: ifR, pNow: p * ifB + (1 - p) * ifR, pMapa: q, metodo: pm == null ? 'mapas que faltan: 50/50 (sin datos de fuerza)' : FUERZA.fuente === 'app' ? 'mapas que faltan estimados con el Elo de RiftPulse' : 'mapas que faltan estimados con los resultados del Mundial'};
  }

  // ---------- colores de cada equipo ----------
  // Colores de marca conocidos (los que faltan se completan leyendo el logo o el HUD del video; si no, el color del lado del mapa).
  var TEAMCOL = {T1: '#E2012D', GEN: '#B08D57', HLE: '#FF6B00', KT: '#E60012', DK: '#1BC3D6', BFX: '#F5C400', NS: '#E8392F',
    BLG: '#21B6F0', TES: '#FF4E1B', JDG: '#D6001C', WBG: '#E6C14A', LNG: '#2FB7E8', IG: '#E8E8E8', AL: '#7A5CFF',
    G2: '#E9E9E9', FNC: '#FF5900', KC: '#2D7BFF', MKOI: '#8C4DFF', TH: '#FF7A00', VIT: '#F2DE00', GX: '#C2A35E', SK: '#E3002B',
    FLY: '#1FA552', TL: '#3E7FE0', C9: '#1BA9E1', '100': '#EB2B2B', DIG: '#F2C230', SR: '#E0453A', LYON: '#B32DE6',
    CFO: '#2DB3E8', PSG: '#003D8F', GAM: '#D9A400', TSW: '#FF5A2B', DFM: '#4AA3FF', SHG: '#FF4A6B', VKS: '#2EE6A6', FUR: '#2B2B2B', RED: '#E3002B', LOUD: '#2BE34B', PNG: '#E8A21B'};
  var LADO = {blue: '#3D8BFF', red: '#FF4655'};
  var COLC = {};  // colores leídos (logo o HUD), por sigla
  try { COLC = JSON.parse(localStorage.getItem('rp_colores') || '{}') || {}; } catch (e) {}
  function hex2rgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16); return isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb2hex(c) { return '#' + c.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); }
  function lum(c) { var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function contraste(c1, c2) { var a = lum(c1), b = lum(c2); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
  function hsl(c) { var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, l = (mx + mn) / 2, d = mx - mn, s2 = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s2, l]; }
  function mezcla(c, d, t) { return c.map(function (v, i) { return v + (d[i] - v) * t; }); }
  var GRAFITO = [12, 14, 18];
  // legible sobre el grafito: se aclara hasta contraste 3:1 (los colores muy oscuros, como el negro de una marca)
  function legible(c) { var x = c.slice(), k = 0; while (contraste(x, GRAFITO) < 3 && k++ < 12) x = mezcla(x, [255, 255, 255], 0.15); return x; }
  function variantes(c) {
    c = legible(c);
    var ink = contraste(c, [255, 255, 255]) >= contraste(c, [12, 14, 18]) ? [255, 255, 255] : [12, 14, 18];  // el texto sobre el color: el de más contraste
    return {main: rgb2hex(c), dark: rgb2hex(mezcla(c, [0, 0, 0], 0.28)), hi: rgb2hex(mezcla(c, [255, 255, 255], 0.38)), ink: rgb2hex(ink), rgb: c.map(Math.round).join(','),
      txt: rgb2hex(contraste(c, GRAFITO) >= 4.5 ? c : mezcla(c, [255, 255, 255], 0.35))};
  }
  function baseDe(code, lado) { var h = COLC[code] || TEAMCOL[code]; return hex2rgb(h) || hex2rgb(LADO[lado]); }
  // colores para un partido: azul (izquierda) y rojo (derecha). Si los dos se parecen, el segundo pasa al color de su lado.
  function colores(codeA, codeB) {
    var a = baseDe(codeA, 'blue'), b = baseDe(codeB, 'red');
    var ha = hsl(legible(a)), hb = hsl(legible(b)), dh = Math.min(Math.abs(ha[0] - hb[0]), 360 - Math.abs(ha[0] - hb[0]));
    var gris = function (h) { return h[1] < 0.18; };
    var parecidos = (gris(ha) && gris(hb)) || (!gris(ha) && !gris(hb) && dh < 40) || contraste(legible(a), legible(b)) < 1.25 && dh < 60;
    if (parecidos) { var alt = hex2rgb(LADO.red), hAlt = hsl(alt), d2 = Math.min(Math.abs(ha[0] - hAlt[0]), 360 - Math.abs(ha[0] - hAlt[0])); b = d2 < 40 ? hex2rgb(LADO.blue) : alt; }
    return {a: variantes(a), b: variantes(b), codes: [codeA, codeB], ajustado: !!parecidos};
  }
  // un color leído del logo o del HUD del video, para una sigla
  function aprenderColor(code, hex) {
    if (!code || !hex2rgb(hex) || COLC[code] === hex) return;
    COLC[code] = hex; try { localStorage.setItem('rp_colores', JSON.stringify(COLC)); } catch (e) {}
  }

  // ---------- fuerza de los equipos (Elo) ----------
  // La app manda su Elo completo (RiftEngine.setFuerza); si no, se calcula un Elo con los resultados del Mundial.
  var FUERZA = {elo: null, fuente: null};
  function eloMundial() {
    var ev = (SCH.events || []).filter(function (e) { return e.state === 'completed' && e.match && (e.match.teams || []).length === 2; })
      .sort(function (a, b) { return a.startTime < b.startTime ? -1 : 1; });
    if (ev.length < 6) return null;
    var E = {};
    ev.forEach(function (e) {
      var a = e.match.teams[0], b = e.match.teams[1]; if (!a.code || !b.code) return;
      var ea = E[a.code] || 1500, eb = E[b.code] || 1500, wa = (a.result || {}).gameWins || 0, wb = (b.result || {}).gameWins || 0;
      if (wa === wb) return;
      var exp = 1 / (1 + Math.pow(10, (eb - ea) / 400)), k = 24 * Math.max(1, Math.abs(wa - wb)) / (wa + wb > 1 ? 1.5 : 1), r = wa > wb ? 1 : 0;
      E[a.code] = ea + k * (r - exp); E[b.code] = eb - k * (r - exp);
    });
    return E;
  }
  function pMapa(a, b) {
    var E = FUERZA.elo || eloMundial(); if (!E || E[a] == null || E[b] == null) return null;
    if (!FUERZA.elo) FUERZA.fuente = 'mundial';
    return 1 / (1 + Math.pow(10, (E[b] - E[a]) / 400));
  }

  // Draft: plan y ventana de poder de cada equipo según la escala de sus campeones (datos pro). No cambia la probabilidad.
  function draftInfo() {
    if (!G || !G.meta) return null;
    if (G.dinfo) return G.dinfo;
    var out = {};
    ['blue', 'red'].forEach(function (side) {
      var ps = (G.meta[side + 'TeamMetadata'] || {}).participantMetadata || [];
      var list = ps.map(function (p) { var st = CHAMP[p.championId]; return {champ: champName(p.championId), role: p.role, wr: st ? st.wr : null, scale: st ? st.scale : 0}; });
      var sc = list.reduce(function (a, c) { return a + c.scale; }, 0) / (list.length || 1);
      var plan = sc >= 0.04 ? 'juego tardío, quiere llegar a peleas grandes' : sc <= -0.04 ? 'juego temprano, quiere ventaja antes del min 20'
        : sc > 0.012 ? 'equilibrado, algo más tardío' : sc < -0.012 ? 'equilibrado, algo más temprano' : 'equilibrado';
      var wrs = list.filter(function (c) { return c.wr != null; });
      out[side] = {code: code(side), scale: sc, plan: plan, champs: list, wr: wrs.length ? wrs.reduce(function (a, c) { return a + c.wr; }, 0) / wrs.length : null};
    });
    out.diff = out.blue.scale - out.red.scale;
    out.window = Math.abs(out.diff) > 0.02 ? {early: code(out.diff > 0 ? 'red' : 'blue'), late: code(out.diff > 0 ? 'blue' : 'red')} : null;
    G.dinfo = out;
    return out;
  }

  // Cara a cara de los dos equipos (2025–26, todas las ligas principales e internacionales). Se guarda 6 h por pareja.
  var LIGAS = ['98767975604431411', '98767991325878492', '113464388705111224', '98767991310872058', '98767991314006698',
    '98767991302996019', '98767991299243165', '98767991332355509', '113476371197627891', '113470291645289904', '113475181634818701',
    '113475149040947852', '116096325848746167', '116838530616006090'];
  var H2H = {};
  async function loadH2H(a, b) {
    var key = [a, b].sort().join('|');
    if (H2H[key]) return;
    try { var c = JSON.parse(localStorage.getItem('rp_h2h_' + key) || 'null'); if (c && Date.now() - c.at < 6 * 3600e3) { H2H[key] = c; emit(); return; } } catch (e) {}
    H2H[key] = {loading: true};
    var evs = [], tok = null;
    try {
      for (var n = 0; n < 15; n++) {
        var params = {leagueId: LIGAS.join(',')}; if (tok) params.pageToken = tok;
        var d = await api('getSchedule', params);
        evs = evs.concat(d.schedule.events || []); tok = d.schedule.pages && d.schedule.pages.older;
        if (!tok || !(d.schedule.events || []).length || d.schedule.events[0].startTime < '2025-01-01') break;
      }
    } catch (e) {}
    var list = evs.filter(function (e) {
      return e.state === 'completed' && e.match && e.startTime >= '2025-01-01' && (e.match.teams || []).length === 2 &&
        e.match.teams.every(function (t) { return t.code === a || t.code === b; }) && e.match.teams[0].code !== e.match.teams[1].code;
    }).sort(function (x, y) { return x.startTime < y.startTime ? 1 : -1; }).map(function (e) {
      var ta = e.match.teams.find(function (t) { return t.code === a; }), tb = e.match.teams.find(function (t) { return t.code === b; });
      return {date: e.startTime.slice(0, 10), league: e.league ? e.league.name : '', ga: (ta.result || {}).gameWins || 0, gb: (tb.result || {}).gameWins || 0};
    });
    var seenD = {}; list = list.filter(function (x) { var k = x.date + x.ga + x.gb; return seenD[k] ? false : (seenD[k] = true); });
    var res = {at: Date.now(), a: a, b: b, wa: list.filter(function (x) { return x.ga > x.gb; }).length, wb: list.filter(function (x) { return x.gb > x.ga; }).length, last: list.slice(0, 5)};
    H2H[key] = res;
    try { localStorage.setItem('rp_h2h_' + key, JSON.stringify(res)); } catch (e) {}
    emit();
  }
  function h2hFor(a, b) {
    var h = H2H[[a, b].sort().join('|')];
    if (!h || h.loading) return null;
    if (h.a === a) return h;  // orientarlo a (azul, rojo)
    return {a: a, b: b, wa: h.wb, wb: h.wa, last: h.last.map(function (x) { return {date: x.date, league: x.league, ga: x.gb, gb: x.ga}; })};
  }

  // Duelo por línea y jugador clave (feed de detalles: oro, CS, K/D/A, % del daño, participación en kills).
  // ---------- ítems: cuáles son completos (de Data Dragon, una sola vez; si no carga, la sección no se muestra) ----------
  var ITEMS = null, ITEMS_PEDIDO = false;
  function cargarItems() {
    if (ITEMS_PEDIDO || typeof fetch === 'undefined') return; ITEMS_PEDIDO = true;
    var dd = 'https://ddragon.leagueoflegends.com/';
    fetch(dd + 'api/versions.json').then(function (r) { return r.json(); }).then(function (v) { return fetch(dd + 'cdn/' + v[0] + '/data/es_MX/item.json'); })
      .then(function (r) { return r.json(); }).then(function (j) {
        var o = {};
        Object.keys(j.data || {}).forEach(function (id) { var it = j.data[id], t = it.tags || [];
          if (it.gold && it.gold.total >= 2200 && !(it.into && it.into.length) && t.indexOf('Boots') < 0 && t.indexOf('Consumable') < 0 && t.indexOf('Trinket') < 0) o[id] = {n: it.name}; });
        ITEMS = Object.keys(o).length ? o : null; if (ITEMS) emit();
      }).catch(function () {});
  }
  function completos(items) { return ITEMS && items ? items.filter(function (id) { return ITEMS[id]; }) : []; }
  // jugadores por equipo: nivel medio, hitos de nivel y, si el feed los trae, visión e ítems completos
  function jugadores() {
    if (!G || !G.roster || !G.roster.blue.length) return null;
    var det = G.det || {};
    var lado = function (side) {
      var ps = G.roster[side], sum = function (f) { return ps.reduce(function (a, p) { return a + (f(p) || 0); }, 0); };
      var o = {lvl: sum(function (p) { return p.lvl; }) / ps.length, n6: ps.filter(function (p) { return p.lvl >= 6; }).length, n11: ps.filter(function (p) { return p.lvl >= 11; }).length, n16: ps.filter(function (p) { return p.lvl >= 16; }).length};
      if (det.wards) { o.wp = sum(function (p) { return p.wp; }); o.wd = sum(function (p) { return p.wd; }); }
      if (det.items && ITEMS) o.items = sum(function (p) { return completos(p.items).length; });
      return o;
    };
    return {blue: lado('blue'), red: lado('red'), wards: !!det.wards, items: !!(det.items && ITEMS), picos: (G.picos || []).slice(-6)};
  }
  function lanes() {
    if (!G || !G.roster) return null;
    return ROLES.map(function (role) {
      var b = G.roster.blue.find(function (p) { return p.role === role; }), r = G.roster.red.find(function (p) { return p.role === role; });
      if (!b || !r) return null;
      return {role: role, label: ROL_ES[role], blue: b, red: r, gd: b.gold - r.gold, csd: b.cs - r.cs};
    }).filter(Boolean);
  }
  function keyPlayer(L) {
    if (!L || !L.length || G.gt < 300) return null;
    var best = null;
    L.forEach(function (l) {
      ['blue', 'red'].forEach(function (side) {
        var p = l[side], gd = side === 'blue' ? l.gd : -l.gd;
        var sc = gd / 1000 + p.share * 8 + p.kp * 3 + (p.k - p.d) * 0.3;
        if (!best || sc > best.sc) best = {sc: sc, side: side, code: code(side), name: p.name, champ: p.champ, role: l.label, vs: l[other(side)].name, gd: gd, share: p.share, kp: p.kp, k: p.k, d: p.d, a: p.a};
      });
    });
    return best;
  }

  // Resumen post-juego: quién ganó, cómo lo vio el modelo, el giro decisivo y el jugador clave.
  function recap() {
    if (!G || !G.ended || !G.samples.length) return null;
    var bw = (sideTeam('blue').result || {}).gameWins || 0, rw = (sideTeam('red').result || {}).gameWins || 0, win = null;
    if (G.score0) { if (bw > G.score0[0]) win = 'blue'; else if (rw > G.score0[1]) win = 'red'; }
    if (!win) win = G.wp && G.wp.p >= 0.5 ? 'blue' : 'red';
    var pw = function (s) { return win === 'blue' ? s.p : 1 - s.p; }, low = G.samples[0];
    G.samples.forEach(function (s) { if (pw(s) < pw(low)) low = s; });
    var sw = keyMoments(3).filter(function (m) { return m.side === win; }).sort(function (x, y) { return Math.abs(y.d) - Math.abs(x.d); })[0] || null;
    var st = G.last ? {blue: tstat(G.last.blueTeam), red: tstat(G.last.redTeam)} : null;
    return {win: win, code: code(win), lose: code(other(win)), dur: G.gt, pre: pw(G.samples[0]), low: {p: pw(low), gt: low.gt},
      comeback: pw(low) < 0.35, swing: sw, key: keyPlayer(lanes()), stats: st, score: [bw, rw]};
  }
  function snapshot() {
    var blueCode = code('blue'), redCode = code('red');
    var bt = sideTeam('blue'), rt = sideTeam('red');
    var L = G ? lanes() : null;
    return {
      ok: !!(G && G.wp),
      match: M ? {id: M.id, league: M.league ? M.league.name : '', strategy: M.strategy,
        gameNo: G ? (M.games || []).findIndex(function (x) { return x.id === G.id; }) + 1 : 0,
        blue: {code: bt.code, img: https(bt.image || ''), wins: REPLAY ? null : (bt.result || {}).gameWins},
        red: {code: rt.code, img: https(rt.image || ''), wins: REPLAY ? null : (rt.result || {}).gameWins}} : null,
      game: G ? {id: G.id, gt: G.gt, state: G.last ? G.last.gameState : null, ended: !!G.ended,
        waiting: !!G.waiting, pBlue: G.wp ? G.wp.p : null, acc: accAt(G.gt),
        reasons: G.wp ? G.wp.parts : [], events: G.events.slice(-8), timers: G.t,
        stats: G.last ? {blue: tstat(G.last.blueTeam), red: tstat(G.last.redTeam)} : null,
        samples: G.samples ? G.samples.slice() : [], impact: impactNext(),
        fight: G.fight && G.fight.players ? {gt: G.fight.gt, win: G.fight.win, blue: G.fight.players.blue, red: G.fight.players.red} : null,
        swings: keyMoments(3), comeback: comebackPaths(), draft: draftInfo(), lanes: L, keyPlayer: keyPlayer(L), recap: recap(), jugadores: jugadores(),
        allEvents: G.events.slice()} : null,
      series: seriesNow(), h2h: M ? h2hFor(bt.code, rt.code) : null, maps: seriesMaps(),
      demo: DEMO && DEMO.cur ? {blue: DEMO.cur.blue, red: DEMO.cur.red, date: DEMO.cur.date, block: DEMO.cur.block, vel: DEMO.vel} : null,
      follow: FOLLOW ? {matchId: FOLLOW.matchId, juego: FOLLOW.juego} : null, feed: feedState(),
      blueCode: blueCode, redCode: redCode, delay: delay, precision: PRECISION, next: NEXTM, at: Date.now()
    };
  }
  // estado de los datos, para mostrarlo en todas las vistas (nunca se borra la última predicción)
  function feedState() {
    var edad = NET.okAt ? Math.round((Date.now() - NET.okAt) / 1000) : null;
    if (DEMO) return {estado: 'demo', txt: 'DEMO · partido ya jugado', edad: edad};
    if (NET.errs >= 2) return {estado: 'caido', txt: 'Sin datos nuevos', edad: edad};
    if (!M) return {estado: 'sin_partido', txt: 'Esperando partido', edad: edad};
    if (G && G.last && G.last.gameState === 'paused') return {estado: 'pausa', txt: 'Juego en pausa', edad: edad};
    if (G && G.start && G.lastTs && !G.ended) {
      var atraso = Math.round((dataTime() - G.lastTs) / 1000);
      if (atraso > STALE_S) return {estado: 'retrasado', txt: 'Datos retrasados · ' + atraso + ' s', edad: atraso};
    }
    return {estado: 'ok', txt: 'Datos al día', edad: edad};
  }
  function emit() { var s = snapshot(); for (var i = 0; i < subs.length; i++) { try { subs[i](s); } catch (e) {} } }

  // ---------- API pública ----------
  var loopId = null, liveId = null, running = false, RUNGEN = 0;
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
      var self = this, gen = ++RUNGEN;
      async function sync() {
        try {
          var evt = await findLive();
          if (gen !== RUNGEN) return;  // ya no se sigue el vivo (repetición o video): no tocar nada
          if (evt && (!M || M.id !== evt.id)) { var g = await loadEvent(evt.id, gen); if (g && gen === RUNGEN) await startGame(g.id); }
          else if (evt && M && (!G || G.ended)) { var g2 = await loadEvent(evt.id, gen); if (g2 && gen === RUNGEN && (!G || g2.id !== G.id)) await startGame(g2.id); }
          else if (!evt) { M = null; G = null; try { NEXTM = await upcoming(); } catch (e) {} emit(); }
        } catch (e) {}
      }
      await sync();
      if (gen !== RUNGEN) return;  // mientras esperaba, se pasó a una repetición: no pisarla con el vivo
      liveId = setInterval(sync, 30000);
      loopId = setInterval(function () { tickWindow().catch(function () {}); }, 2000);
    },
    stop: function () { running = false; RUNGEN++; if (loopId) clearInterval(loopId); if (liveId) clearInterval(liveId); loopId = liveId = null; },
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
      this.stop(); running = true; REPLAY = null; M = null; G = null; GEN++;  // invalida cualquier carga del vivo en curso
      var d = await api('getEventDetails', {id: eventId}); var e = d.event;
      M = {id: eventId, league: e.league, strategy: e.match.strategy, teams: e.match.teams, games: e.match.games};
      if (M.teams.length === 2) loadH2H(M.teams[0].code, M.teams[1].code).catch(function () {});
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

  // ---------- modo demo: un partido real del Mundial ya jugado, acelerado (para probarlo sin partido en vivo) ----------
  async function demoNext() {
    if (!DEMO) return;
    clearTimeout(DEMO.next);
    for (var n = 0; n < DEMO.list.length; n++) {
      var c = DEMO.list[DEMO.i++ % DEMO.list.length];
      DEMO.cur = c;
      try { await RiftEngine.replay(c.id, 1, 3, DEMO.vel); } catch (e) {}
      if (G && G.start) return;  // arrancó
    }
    DEMO.cur = null; emit();
  }
  RiftEngine.demo = async function (vel) {
    this.stop();
    var list = [];
    try { list = await this.recentGames(); } catch (e) {}
    list.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    // primero las series largas (más tensión), las más recientes adelante
    list = list.filter(function (x) { return x.bo >= 3; }).concat(list.filter(function (x) { return x.bo < 3; }));
    DEMO = {list: list.slice(0, 12), i: 0, vel: vel || 8, cur: null, next: null};
    if (!DEMO.list.length) { DEMO = null; emit(); return false; }
    await demoNext();
    return true;
  };
  // ---------- alineaciones de cada juego de la serie (campeones, ganador y duración) ----------
  // El feed oficial no trae los bloqueos (bans): solo las selecciones.
  var MAPS = {}, MAPS_LOADING = {};
  function winnerOf(f) {  // el feed no dice quién ganó: se deduce de lo destruido al final
    var b = f.blueTeam, r = f.redTeam, sb = b.towers + 2 * b.inhibitors, sr = r.towers + 2 * r.inhibitors;
    return sb !== sr ? (sb > sr ? 'blue' : 'red') : (b.totalGold >= r.totalGold ? 'blue' : 'red');
  }
  async function loadMap(gm, n) {
    if (MAPS[gm.id] && (MAPS[gm.id].done || gm.state === 'inProgress')) return;
    if (MAPS_LOADING[gm.id]) return; MAPS_LOADING[gm.id] = true;
    try {
      var c = null; try { c = JSON.parse(localStorage.getItem('rp_map_' + gm.id) || 'null'); } catch (e) {}
      if (c && c.done) { MAPS[gm.id] = c; return; }
      var gi = await gameInfo(gm.id); if (!gi || !gi.meta) return;
      var side = function (k) {
        var md = gi.meta[k + 'TeamMetadata'], tm = (M.teams || []).filter(function (t) { return t.id === md.esportsTeamId; })[0];
        return {code: tm ? tm.code : '?', picks: (md.participantMetadata || []).map(function (p) { return {champId: p.championId, champ: champName(p.championId), role: p.role, name: shortName(p.summonerName)}; })};
      };
      var out = {id: gm.id, n: n, state: gm.state, blue: side('blue'), red: side('red'), patch: gi.meta.patchVersion || '', winner: null, dur: null, done: false};
      if (gm.state === 'completed') {  // buscar el final del juego, de 3 en 3 minutos
        var last = null, t = gi.start + 18 * 60000;
        for (var k = 0; k < 30; k++, t += 180000) {
          var w = await feed('window', gm.id, t), fr = w && w.frames && w.frames.length ? w.frames : null;
          if (!fr) break;
          last = fr[fr.length - 1];
          if (last.gameState === 'finished' || Date.parse(last.rfc460Timestamp) < t - 30000) break;
        }
        if (last) { var ws = winnerOf(last); out.winner = out[ws].code; out.dur = (Date.parse(last.rfc460Timestamp) - gi.start) / 1000; out.done = true; }
      }
      MAPS[gm.id] = out;
      if (out.done) try { localStorage.setItem('rp_map_' + gm.id, JSON.stringify(out)); } catch (e) {}
    } catch (e) {} finally { MAPS_LOADING[gm.id] = false; emit(); }
  }
  function seriesMaps() {
    if (!M || !M.games) return null;
    var list = [];
    M.games.forEach(function (gm, i) {
      if (gm.state !== 'completed' && gm.state !== 'inProgress') return;
      if (!MAPS[gm.id] || (!MAPS[gm.id].done && gm.state === 'completed')) loadMap(gm, i + 1);
      list.push(MAPS[gm.id] || {id: gm.id, n: i + 1, state: gm.state, loading: true});
    });
    return list;
  }

  // ---------- identificar qué juego se ve en el video (para la sincronía automática) ----------
  // o = {gt (s del reloj del juego), tags: [izq, der], gold: [izq, der] en miles | null, kills: [izq, der] | null}
  // Compara contra los datos oficiales de cada juego reciente en ese minuto. Devuelve {matchId, juego, codes, score} o null.
  function lev(a, b) {
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) d[i] = [i];
    for (j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  var tagSim = function (t, c) { t = String(t || '').toUpperCase(); c = String(c || ''); if (!t || !c) return 0; return 1 - lev(t, c) / Math.max(t.length, c.length); };
  var GINFO = {}, EVD = {};
  async function gameInfo(id) {
    if (GINFO[id]) return GINFO[id];
    var w = await feed('window', id);
    if (!w || !w.frames || !w.frames.length) return null;
    return (GINFO[id] = {start: Date.parse(w.frames[0].rfc460Timestamp), meta: w.gameMetadata});
  }
  RiftEngine.identify = async function (o) {
    await loadSchedule();
    // o.sig = [{CODIGO: parecido}, {...}] (izquierda y derecha del HUD); o.tags = [izq, der] como texto, si no hay puntajes
    var tags = (o.tags || []).map(function (t) { return String(t || '').replace(/[^A-Z0-9]/gi, '').toUpperCase(); });
    var sig = o.sig || null, top = sig ? sig.map(function (m) { var v = 0; for (var k in m) v = Math.max(v, m[k]); return v; }) : null;
    var parece = function (lado, code) {  // 0 = igual a lo mejor leído de ese lado; más alto = menos parecido
      if (sig) return sig[lado] && code in sig[lado] ? Math.max(0, top[lado] - sig[lado][code]) * 4 : 0;
      return tags[lado] ? 3 * (1 - tagSim(tags[lado], code)) : 0;
    };
    // todos los partidos del Mundial ya empezados (un VOD puede ser de cualquier día del torneo)
    var recent = matchList().filter(function (x) { return x.state !== 'unstarted' && x.teams[0].code && x.teams[1].code; });
    recent.forEach(function (x) {
      var a = x.teams[0].code, b = x.teams[1].code;
      x.tagScore = -Math.min(parece(0, a) + parece(1, b), parece(0, b) + parece(1, a));
    });
    var cands = recent.slice().sort(function (x, y) { return (y.tagScore - x.tagScore) || (x.state === 'inProgress' ? -1 : 1) || (x.start < y.start ? 1 : -1); }).slice(0, 12);
    var all = [];
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i], ev = EVD[c.id];
      if (!ev) { try { ev = EVD[c.id] = (await api('getEventDetails', {id: c.id})).event; } catch (e) { continue; } }
      var games = (ev.match.games || []);
      for (var k = 0; k < games.length; k++) {
        var gm = games[k];
        if (gm.state !== 'completed' && gm.state !== 'inProgress') continue;
        var gi = await gameInfo(gm.id); if (!gi || !gi.meta) continue;
        var t = gi.start + o.gt * 1000, w = await feed('window', gm.id, t), f = w && lastBefore(w.frames, t);
        if (!f) continue;
        var idOf = function (side) { return gi.meta[side + 'TeamMetadata'].esportsTeamId; };
        var codeOf = function (side) { var tm = ev.match.teams.filter(function (x) { return x.id === idOf(side); })[0]; return tm ? tm.code : null; };
        var cb = codeOf('blue'), cr = codeOf('red');
        // en el HUD de la transmisión el equipo azul va a la izquierda
        var sc = 0;
        sc += parece(0, cb) + parece(1, cr);
        if (o.kills) sc += Math.abs(f.blueTeam.totalKills - o.kills[0]) + Math.abs(f.redTeam.totalKills - o.kills[1]);
        if (o.gold) sc += 2 * (Math.abs(f.blueTeam.totalGold / 1000 - o.gold[0]) + Math.abs(f.redTeam.totalGold / 1000 - o.gold[1]));
        if (gm.state === 'inProgress') sc -= 0.5;
        var champs = function (side) { return ((gi.meta[side + 'TeamMetadata'] || {}).participantMetadata || []).map(function (p) { return p.championId; }); };
        all.push({matchId: c.id, juego: k + 1, gameId: gm.id, codes: [cb, cr], score: sc, live: gm.state === 'inProgress', champs: {blue: champs('blue'), red: champs('red')}});
      }
    }
    if (!all.length) return null;
    all.sort(function (a, b) { return a.score - b.score; });
    var best = all[0];
    best.alts = all.slice(1, 6);  // los más parecidos, para desempatar (por ejemplo, con los campeones en pantalla)
    best.revisados = all.length;
    return best;
  };

  // seguir una repetición que se mira en otro lado (el panel de la app): mismo juego, mismo minuto, pausa y velocidad.
  // o = {matchId, juego, gt, playing, speed, at}; null vuelve al vivo.
  var FOLLOW = null;
  RiftEngine.follow = async function (o) {
    if (!o) { if (FOLLOW) { FOLLOW = null; return this.live(); } return; }
    if (DEMO) { clearTimeout(DEMO.next); DEMO = null; }  // lo que se ve en el video manda sobre la demo
    var gtAt = function () { return Math.max(0, o.gt + (o.playing ? (Date.now() - o.at) / 1000 * (o.speed || 1) : 0)); };
    var same = FOLLOW && FOLLOW.matchId === o.matchId && FOLLOW.juego === o.juego && G && G.start;
    var back = same && gtAt() < G.gt - 5;  // hacia atrás hay que rehacer el estado desde el inicio
    FOLLOW = o;
    if (!same || back) {
      await this.replay(o.matchId, o.juego, Math.max(0.1, gtAt() / 60), 1);
      if (FOLLOW !== o) return;
    }
    if (!G || !G.start) return;
    REPLAY = {base: G.start + G.paused + gtAt() * 1000, real: Date.now(), vel: o.playing ? (o.speed || 1) : 0};
    emit();
  };
  // volver de la demo (o de una repetición) al partido en vivo
  RiftEngine.live = function () {
    if (DEMO) clearTimeout(DEMO.next);
    DEMO = null; REPLAY = null; FOLLOW = null; M = null; G = null;
    this.stop();
    return this.start();
  };
  // arranque según la URL: ?demo reproduce un partido real ya jugado; si no, el partido en vivo
  RiftEngine.auto = function () {
    var q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
    if (q && q.has('demo')) return this.demo(+q.get('demo') || 8);
    return this.start();
  };


  // ---------- textos para casters: frases para comentar y resumen del juego (los usan la mesa y el centro de mando) ----------
  var TXT = (function () {
    var esc=function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
    var pct=function(x){ return Math.round(x*100)+'%'; };
    var k1=function(g){ return (Math.abs(g)/1000).toFixed(1).replace('.',',')+'k'; };
    function recapLines(s){
      var r=s.game.recap, out=[];
      out.push('<b>'+esc(r.code)+'</b> gana en '+mmss(r.dur)+'. Al arrancar el juego el modelo le daba '+pct(r.pre)+'.');
      if (r.comeback) out.push('¡Remontada! Estuvo al <b>'+pct(r.low.p)+'</b> en el min '+mmss(r.low.gt)+'.');
      else out.push('Su peor momento: '+pct(r.low.p)+' en el min '+mmss(r.low.gt)+'.');
      if (r.swing) out.push((r.swing.a<60 && r.swing.b-r.swing.a>360) || (r.swing.b-r.swing.a>600 && !/Barón|Pelea|Ancestral|Inhibidor|ALMA/.test(r.swing.cause||'')) ? 'Ventaja construida de a poco: <b>+'+Math.round(Math.abs(r.swing.d)*100)+' pts</b> entre el min '+mmss(r.swing.a)+' y el '+mmss(r.swing.b)+'.'
        : 'El giro decisivo: min '+mmss(r.swing.a)+'–'+mmss(r.swing.b)+', <b>+'+Math.round(Math.abs(r.swing.d)*100)+' pts</b> con '+esc(causaTxt(r.swing.cause, r.swing.side))+'.');
      if (r.key) out.push('Jugador clave: <b>'+esc(r.key.name)+'</b> ('+esc(r.key.code)+', '+esc(r.key.champ)+') · '+r.key.k+'/'+r.key.d+'/'+r.key.a+' · '+Math.round(r.key.share*100)+'% del daño.');
      if (r.stats){ var w=r.stats[r.win], l=r.stats[r.win==='blue'?'red':'blue']; out.push('Kills '+w.kills+'–'+l.kills+' · torres '+w.towers+'–'+l.towers+' · dragones '+w.dragons+'–'+l.dragons+' · Barones '+w.barons+'–'+l.barons+'.'); }
      return out;
    }
    // imagen del resumen (1200×675): grafito, los colores de cada equipo y la señal de RiftPulse
    function recapPNG(s){
      var m=s.match, g=s.game, r=g.recap, W=1200, H=675, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      var c=cv.getContext('2d'), P=colores(m.blue.code, m.red.code), Wn=r.win==='blue'?P.a:P.b;
      var F=function(w,sz,fam){ return w+' '+sz+'px '+(fam||'"Saira Condensed", sans-serif'); };
      c.fillStyle='#0C0E12'; c.fillRect(0,0,W,H);
      var gl=c.createRadialGradient(r.win==='blue'?100:W-100,0,10,r.win==='blue'?100:W-100,0,720); gl.addColorStop(0,'rgba('+Wn.rgb+',.30)'); gl.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=gl; c.fillRect(0,0,W,H);
      c.fillStyle='#C8FF3E'; c.fillRect(60,66,90,4);
      c.fillStyle='#9AA3B2'; c.font=F(700,22); c.fillText(('Fin del juego'+(m.gameNo?' '+m.gameNo:'')+' · '+(m.league||'')).toUpperCase(),60,96);
      c.fillStyle=Wn.txt; c.font=F(800,84); c.fillText(r.code+' gana',56,176);
      c.fillStyle='#C7CDD8'; c.font=F(500,24,'"Inter Tight", sans-serif'); c.fillText('vs '+r.lose+' · '+mmss(r.dur)+(r.comeback?' · ¡remontada desde el '+pct(r.low.p)+'!':''),60,216);
      // la probabilidad del ganador en todo el juego, con los giros marcados
      var X0=60, Y0=246, CW=W-120, CH=200, sm=g.samples, t0=sm[0].gt, span=Math.max(1,sm[sm.length-1].gt-t0);
      c.fillStyle='#14171D'; c.fillRect(X0,Y0,CW,CH);
      (g.swings||[]).forEach(function(sw){ c.fillStyle='rgba('+(sw.side==='blue'?P.a.rgb:P.b.rgb)+',.16)'; c.fillRect(X0+(sw.a-t0)/span*CW,Y0,Math.max(3,(sw.b-sw.a)/span*CW),CH); });
      c.strokeStyle='rgba(220,226,236,.18)'; c.setLineDash([6,6]); c.beginPath(); c.moveTo(X0,Y0+CH/2); c.lineTo(X0+CW,Y0+CH/2); c.stroke(); c.setLineDash([]);
      c.lineWidth=4; c.lineJoin='round'; c.strokeStyle=Wn.main; c.beginPath();
      sm.forEach(function(p,i){ var v=r.win==='blue'?p.p:1-p.p, x=X0+(p.gt-t0)/span*CW, y=Y0+CH-v*CH; if(i) c.lineTo(x,y); else c.moveTo(x,y); }); c.stroke();
      c.fillStyle='#6E7686'; c.font=F(500,15,'"Inter Tight", sans-serif'); c.fillText('Probabilidad de '+r.code+' según el modelo · sombreado: giros clave',X0,Y0+CH+24); c.textAlign='right'; c.fillText('50%',X0+CW-8,Y0+CH/2-8); c.textAlign='left';
      var lines=recapLines(s).slice(2).map(function(t){ return t.replace(/<[^>]+>/g,''); }), y=Y0+CH+66;
      c.fillStyle='#F2F4F7'; c.font=F(500,22,'"Inter Tight", sans-serif');
      lines.slice(0,3).forEach(function(t){ c.fillText(t.length>92?t.slice(0,90)+'…':t,60,y); y+=36; });
      c.fillStyle='#C8FF3E'; c.fillRect(60,H-62,34,3);
      c.fillStyle='#6E7686'; c.font=F(500,16,'"Inter Tight", sans-serif'); c.fillText('Pronóstico de un modelo propio, sin apuestas. No avalado por Riot Games. #Worlds2026',60,H-30);
      c.textAlign='right'; c.fillStyle='#F2F4F7'; c.font=F(800,24); c.fillText('RIFTPULSE',W-60,H-30);
      if (s.precision){ c.fillStyle='#C8FF3E'; c.font=F(700,18); c.fillText(Math.round(s.precision.acc15*100)+'% DE ACIERTO AL MIN 15',W-60,H-60); }
      c.textAlign='left';
      return cv.toDataURL('image/png');
    }
    function talk(s){
      var m=s.match, g=s.game, out=[];
      var pb=Math.round(g.pBlue*100), lead = pb>=50, lc = lead?m.blue.code:m.red.code, lp = lead?pb:100-pb;
      if (g.ended && g.recap) out.push('<b>'+esc(g.recap.code)+'</b> ganó el juego en '+mmss(g.recap.dur)+'; al final RiftPulse le daba <b>'+(g.recap.win==='blue'?pb:100-pb)+'%</b>.');
      else out.push('RiftPulse da <b>'+lp+'%</b> a <b>'+esc(lc)+'</b> ahora mismo ('+mmss(g.gt)+').');
      var top=(g.reasons||[]).filter(function(x){ return (x.z>=0)===lead && Math.abs(x.z)>=0.15; })[0];  // los factores con poco peso son ruido: no se dicen
      if (top) out.push('Su mayor factor: <b>'+esc(top.txt)+'</b>.');
      // momentum
      var past=null, sm=g.samples||[];
      for (var i=0;i<sm.length;i++){ if (g.gt-sm[i].gt>=60) past=sm[i]; }
      if (past){ var d=Math.round((g.pBlue-past.p)*100); if (Math.abs(d)>=8){ var who=d>0?m.blue.code:m.red.code; out.push('Giro reciente: <b>'+esc(who)+' '+(d>0?'+':'')+d+' pts</b> en el último minuto de juego.'); } }
      var se=s.series;
      if (se && se.bo>1){ var trail=lead?m.red.code:m.blue.code, pTrail=lead?1-se.ifRed:se.ifBlue; out.push('Si <b>'+esc(trail)+'</b> le da la vuelta a este juego, queda con <b>'+pct(pTrail)+'</b> de llevarse la serie.'); }
      var c=g.comeback;
      if (c && c.reached) out.push('Para remontar, <b>'+esc(c.code)+'</b> necesita <b>'+esc(c.paths[0].txt)+'</b>: con eso vuelve al '+pct(c.paths[0].p)+'.');
      var o = g.timers && ((g.timers.dragon && g.timers.dragon.at>g.gt)?{k:g.timers.dragon.elder?'Ancestral':'Dragón',v:g.timers.dragon.at-g.gt}:(g.timers.baron && g.timers.baron.at>g.gt)?{k:'Barón',v:g.timers.baron.at-g.gt}:null);
      if (o) out.push('Próximo <b>'+o.k+'</b> en <b>'+mmss(o.v)+'</b>'+(g.impact?': si lo toma '+esc(m.blue.code)+', '+(g.impact.blue>=0?'+':'')+g.impact.blue+' pts; si lo toma '+esc(m.red.code)+', '+(g.impact.red>=0?'+':'')+g.impact.red+' pts.':': objetivo que puede mover la balanza.'));
      var k=g.keyPlayer;
      if (k && Math.abs(k.gd)>=500) out.push('Jugador clave: <b>'+esc(k.name)+'</b>, '+(k.gd>=0?'+':'−')+k1(k.gd)+' de oro sobre '+esc(k.vs)+' y '+Math.round(k.share*100)+'% del daño de '+esc(k.code)+'.');
      if (g.draft && g.draft.window && g.gt<1500) out.push('Reloj del draft: <b>'+esc(g.draft.window.early)+'</b> tiene que sacar ventaja antes del min ~24; después el draft favorece a <b>'+esc(g.draft.window.late)+'</b>.');
      var h=s.h2h;
      if (h && (h.wa+h.wb)) out.push('Cara a cara 2025–26: <b>'+esc(h.a)+' '+h.wa+'–'+h.wb+' '+esc(h.b)+'</b> en series.');
      return out;
    }
    return {talk: talk, recapLines: recapLines, recapPNG: recapPNG};
  })();
  // frases listas para comentar ({html, text}) y el resumen del juego en texto e imagen (PNG 1200×675)
  RiftEngine.talk = function (s) { s = s || snapshot(); if (!s.match || !s.game || s.game.pBlue == null) return []; return TXT.talk(s).map(function (h) { return {html: h, text: h.replace(/<[^>]+>/g, '')}; }); };
  RiftEngine.recapLines = function (s) { s = s || snapshot(); return s.game && s.game.recap ? TXT.recapLines(s) : []; };
  RiftEngine.recapPNG = function (s) { s = s || snapshot(); return s.game && s.game.recap ? TXT.recapPNG(s) : null; };


  // ---------- cuadro de eliminatorias (cuartos → semis → final) armado desde el calendario ----------
  function koRound(e) { var b = String(e.blockName || '').toLowerCase(); return /cuartos|quarter/.test(b) ? 'qf' : /semi/.test(b) ? 'sf' : /final/.test(b) ? 'f' : null; }
  function koSeries(e) {
    var bo = (e.match.strategy || {}).count || 5, need = Math.ceil(bo / 2);
    var ts = (e.match.teams || []).slice(0, 2).map(function (t) {
      var w = (t.result || {}).gameWins || 0, known = !!t.code && t.code !== 'TBD';
      return {code: known ? t.code : null, img: https(t.image || ''), wins: w, won: e.state === 'completed' && w >= need};
    });
    while (ts.length < 2) ts.push({code: null, img: '', wins: 0, won: false});
    return {id: e.match.id, state: e.state, start: e.startTime, bo: bo, need: need, teams: ts};
  }
  var koEmpty = function () { return {id: null, state: 'unstarted', start: null, bo: 5, need: 3, teams: [{code: null, wins: 0}, {code: null, wins: 0}]}; };
  function buildBracket(events) {
    var R = {qf: [], sf: [], f: []};
    (events || []).filter(function (e) { return e.match && koRound(e); })
      .sort(function (a, b) { return a.startTime < b.startTime ? -1 : 1; })
      .forEach(function (e) { R[koRound(e)].push(koSeries(e)); });
    if (!R.qf.length && !R.sf.length && !R.f.length) return null;
    while (R.qf.length < 4) R.qf.push(koEmpty());
    while (R.sf.length < 2) R.sf.push(koEmpty());
    if (!R.f.length) R.f.push(koEmpty());
    // los cuartos se ordenan por mitad del cuadro: los dos que alimentan cada semifinal van juntos y en el lado de su equipo
    var slots = [null, null, null, null], used = {};
    R.sf.slice(0, 2).forEach(function (sf, i) {
      sf.teams.forEach(function (t, j) {
        if (!t.code) return;
        R.qf.forEach(function (q, k) { if (!used[k] && !slots[2 * i + j] && q.teams.some(function (x) { return x.code === t.code; })) { slots[2 * i + j] = q; used[k] = 1; } });
      });
    });
    R.qf.forEach(function (q, k) { if (!used[k]) slots[slots.indexOf(null)] = q; });
    R.qf = slots;
    // en las llaves sin definir, quiénes pueden llegar
    var cands = function (x) {
      if (!x) return [];
      if (x.state === 'completed') return x.teams.filter(function (t) { return t.won; }).map(function (t) { return t.code; });
      return x.teams.reduce(function (acc, t, j) { return acc.concat(t.code ? [t.code] : (x.from ? x.from[j] : [])); }, []);
    };
    R.sf.forEach(function (x, i) { x.from = [cands(R.qf[2 * i]), cands(R.qf[2 * i + 1])]; });
    R.f.forEach(function (x) { x.from = [cands(R.sf[0]), cands(R.sf[1])]; });
    var fin = R.f[0], ch = fin && fin.state === 'completed' ? fin.teams.filter(function (t) { return t.won; })[0] : null;
    R.champion = ch ? ch.code : null;
    return R;
  }
  // calendario del Mundial (para el cuadro y las predicciones): se pide como mucho una vez por minuto
  var SCH = {events: [], at: 0, loading: null}, BR = {data: null};
  async function loadSchedule() {
    if (SCH.loading) return SCH.loading;
    if (Date.now() - SCH.at < 60000) return SCH.events;
    SCH.loading = (async function () {
      try {
        var evs = [], tok = null;
        for (var n = 0; n < 5; n++) {
          var params = {leagueId: WORLDS}; if (tok) params.pageToken = tok;
          var d = await api('getSchedule', params);
          evs = evs.concat(d.schedule.events || []);
          tok = d.schedule.pages && d.schedule.pages.older; if (!tok) break;
        }
        var seen = {};
        SCH.events = evs.filter(function (e) { return e.match && e.match.id && !seen[e.match.id] && (seen[e.match.id] = 1); });
        SCH.at = Date.now();
        BR.data = buildBracket(SCH.events);
      } catch (e) {}
      SCH.loading = null;
      emit();
      return SCH.events;
    })();
    return SCH.loading;
  }
  async function loadBracket() { await loadSchedule(); return BR.data; }
  // partidos del Mundial con logos y resultado, en orden: {id, start, block, bo, state, teams:[{code, img, wins, won}]}
  function matchList() {
    return SCH.events.filter(function (e) { return (e.match.teams || []).length === 2; })
      .sort(function (a, b) { return a.startTime < b.startTime ? -1 : 1; })
      .map(function (e) { var x = koSeries(e); x.block = e.blockName || ''; return x; });
  }
  RiftEngine.buildBracket = buildBracket;   // la app lo usa con su propio calendario
  RiftEngine.loadBracket = loadBracket;     // el overlay lo pide solo (se refresca cada minuto)
  Object.defineProperty(RiftEngine, 'bracket', {get: function () { return BR.data; }});
  RiftEngine.loadMatches = async function () { await loadSchedule(); return matchList(); };
  // predicciones del stream: opciones para elegir qué partidos mostrar (un día o una fase completa) y los partidos de esa opción
  var dayKey = function (iso) { var d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  RiftEngine.predDays = function (ms) {
    var days = {}, blocks = {}, out = [];
    (ms || []).forEach(function (x) {
      var k = dayKey(x.start); (days[k] = days[k] || {n: 0, b: x.block, at: x.start}).n++;
      if (x.block) (blocks[x.block] = blocks[x.block] || {n: 0, at: x.start}).n++;
    });
    Object.keys(blocks).sort(function (a, b) { return blocks[a].at < blocks[b].at ? -1 : 1; }).forEach(function (b) {
      out.push({key: 'b:' + b, label: 'Fase completa: ' + b + ' · ' + blocks[b].n + ' partidos'});
    });
    Object.keys(days).sort().forEach(function (k) {
      var d = new Date(days[k].at);
      out.push({key: k, label: d.toLocaleDateString('es', {weekday: 'short', day: 'numeric', month: 'short'}) + ' · ' + days[k].b + ' · ' + days[k].n + (days[k].n === 1 ? ' partido' : ' partidos')});
    });
    return out;
  };
  RiftEngine.predMatches = function (ms, sel) {
    ms = ms || [];
    if (sel && sel.indexOf('b:') === 0) return ms.filter(function (x) { return x.block === sel.slice(2); });
    if (!sel || sel === 'auto') {  // el próximo día con partidos sin terminar; si ya no hay, el último
      var hoy = dayKey(Date.now()), next = ms.filter(function (x) { return x.state !== 'completed' && dayKey(x.start) >= hoy; })[0] || ms.filter(function (x) { return x.state !== 'completed'; })[0];
      sel = next ? dayKey(next.start) : ms.length ? dayKey(ms[ms.length - 1].start) : '';
    }
    return ms.filter(function (x) { return dayKey(x.start) === sel; });
  };
  Object.defineProperty(RiftEngine, 'matches', {get: matchList});

  RiftEngine.MODELO = MODELO;       // fuente única de los pesos del modelo (la app los lee de aquí)
  RiftEngine.PRECISION = PRECISION;
  RiftEngine.accAt = accAt;
  RiftEngine.setFuerza = function (elo) { FUERZA.elo = elo && Object.keys(elo).length ? elo : null; FUERZA.fuente = FUERZA.elo ? 'app' : null; emit(); };
  RiftEngine.pMapa = pMapa;
  RiftEngine.colores = colores;
  // ---------- director: qué pieza mostrar en cada momento del juego ----------
  // nivel: 'minimo' (solo la barra y los giros), 'estandar' (más objetivo, pelea y resumen) o 'show' (más oro y duelos de vez en cuando).
  // decidir(s) devuelve {pieza, clave, hasta} o null. Nunca dos piezas grandes a la vez y siempre un respiro entre una y otra.
  // Los giros van aparte, en D.giro ({clave, at, d, side, txt}): son una alerta sobre la barra y salen aunque haya una pieza.
  RiftEngine.crearDirector = function (nivel) {
    var D = {nivel: nivel || 'estandar', actual: null, libreDesde: 0, visto: {}, hist: [], ultimoGiro: 0, ultimoShow: -1e9, log: []};
    var N = function () { var n = {minimo: 0, estandar: 1, show: 2}[D.nivel]; return n == null ? 1 : n; };
    function poner(pieza, clave, seg, datos) {
      var ahora = Date.now(); D.visto[clave] = true;
      D.actual = {pieza: pieza, clave: clave, desde: ahora, hasta: ahora + seg * 1000, datos: datos || null};
      D.log.unshift({pieza: pieza, at: ahora, txt: datos && datos.txt}); D.log = D.log.slice(0, 30);
      return D.actual;
    }
    D.decidir = function (s) {
      var ahora = Date.now(), g = s && s.game, enJuego = g && g.pBlue != null;
      if (enJuego) {
        D.hist.push({t: ahora, p: g.pBlue}); D.hist = D.hist.filter(function (x) { return ahora - x.t <= 90000; });
        // giro: la probabilidad se movió 12 puntos o más en ~40 s. Es una alerta sobre la barra: no compite con las piezas grandes,
        // así que se evalúa siempre (D.giro) y queda en la línea de tiempo
        var antes = null; for (var i = 0; i < D.hist.length; i++) if (ahora - D.hist[i].t >= 38000) antes = D.hist[i];
        if (antes && ahora - D.ultimoGiro > 25000) {
          var dg = Math.round((g.pBlue - antes.p) * 100);
          if (Math.abs(dg) >= 12) { D.ultimoGiro = ahora; D.giro = {clave: 'giro' + ahora, at: ahora, d: dg, side: dg > 0 ? 'blue' : 'red', txt: (dg > 0 ? s.match.blue.code : s.match.red.code) + ' +' + Math.abs(dg)};
            D.log.unshift({pieza: 'giro', at: ahora, txt: D.giro.txt}); D.log = D.log.slice(0, 30); }
        }
      }
      if (D.actual && D.actual.datos && D.actual.datos.manual && ahora < D.actual.hasta) return D.actual;  // lo pedido a mano manda
      if (!enJuego) { D.actual = null; return null; }
      if (D.actual && ahora < D.actual.hasta) return D.actual;
      if (D.actual) { D.actual = null; D.libreDesde = ahora + 6000; }  // respiro entre piezas
      if (ahora < D.libreDesde) return null;
      // 1) resumen al terminar el juego
      if (N() >= 1 && g.ended && g.recap && !D.visto['fin' + g.id]) return poner('resumen', 'fin' + g.id, 20, {txt: g.recap.code + ' gana'});
      // 3) pelea recién terminada: reparto de daño
      if (N() >= 1 && g.fight && g.fight.gt != null && g.gt - g.fight.gt < 40 && !D.visto['pelea' + g.fight.gt]) return poner('pelea', 'pelea' + g.fight.gt, 9, {txt: 'pelea'});
      // 4) objetivo por aparecer (60 s antes): cuánto vale para cada equipo
      var t = g.timers || {}, ob = t.dragon && t.dragon.at > g.gt ? {k: t.dragon.elder ? 'Ancestral' : 'Dragón', at: t.dragon.at} : null;
      if (t.baron && t.baron.at > g.gt && (!ob || t.baron.at < ob.at)) ob = {k: 'Barón', at: t.baron.at};
      if (N() >= 1 && ob && ob.at - g.gt <= 60 && !D.visto['obj' + ob.k + Math.round(ob.at)]) return poner('objetivo', 'obj' + ob.k + Math.round(ob.at), Math.min(20, Math.max(8, ob.at - g.gt)), {txt: ob.k});
      // 5) un equipo muy abajo (30 % o menos, desde el min 10): qué necesita para volver
      var cb = g.comeback;
      if (N() >= 1 && cb && cb.p <= 0.30 && g.gt >= 600 && cb.paths && cb.paths[0] && !D.visto['rem' + g.id + cb.side]) return poner('remontada', 'rem' + g.id + cb.side, 12, {txt: cb.code + ' ' + Math.round(cb.p * 100) + '%'});
      // 6) nivel show: el oro o los duelos cada ~4 min de juego
      if (N() >= 2 && g.gt - D.ultimoShow >= 240 && g.gt > 300) { D.ultimoShow = g.gt; var dd = ['oro', 'duelos', 'historia'][Math.floor(g.gt / 240) % 3]; return poner(dd, dd + Math.round(g.gt), dd === 'historia' ? 14 : 12, {txt: dd}); }
      // 7) a mitad del juego (min 20), una vez: la historia hasta ahí
      if (N() >= 1 && g.gt >= 1200 && g.gt < 1500 && !D.visto['hist' + g.id]) { D.visto['hist' + g.id] = true; return poner('historia', 'hist' + g.id, 14, {txt: 'min 20'}); }
      return null;
    };
    D.saltar = function () { if (D.actual) { D.actual.hasta = 0; } };
    // pedir una pieza a mano (atajos del control): reemplaza a la actual y dura seg segundos
    D.forzar = function (pieza, seg) { D.libreDesde = 0; return poner(pieza, 'man' + pieza + Date.now(), seg || 15, {txt: 'a mano', manual: true}); };
    D.setNivel = function (n) { if ({minimo: 1, estandar: 1, show: 1}[n]) D.nivel = n; };
    D.retener = function (seg) { if (D.actual) D.actual.hasta = Date.now() + (seg || 30) * 1000; };
    return D;
  };
  RiftEngine.aprenderColor = aprenderColor;
  RiftEngine.causaTxt = causaTxt;
  // ---------- la historia del juego: frases a partir de lo que pasó (giros, objetivos, oro) ----------
  var kc = function (g) { return (Math.abs(g) / 1000).toFixed(1).replace('.', ',') + 'k'; };
  var pc = function (x) { return Math.round(x * 100) + '%'; };
  var eh = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var conTexto = function (l) { return l.map(function (h) { return {html: h, text: h.replace(/<[^>]+>/g, '')}; }); };
  RiftEngine.historia = function (s) {
    s = s || snapshot(); var g = s.game, m = s.match;
    if (!m || !g || g.pBlue == null || !g.samples || g.samples.length < 2) return [];
    var C = {blue: '<b class="b">' + eh(m.blue.code) + '</b>', red: '<b class="r">' + eh(m.red.code) + '</b>'}, sm = g.samples, ev = g.allEvents || g.events || [], out = [];
    var cuenta = function (kind, side, hasta) { return ev.filter(function (e) { return e.kind === kind && e.side === side && e.gt <= hasta; }).length; };
    // 1) el arranque, hasta el min 14
    var e14 = sm.filter(function (x) { return x.gt >= 300 && x.gt <= 840; }).pop();  // si se entró tarde al juego, no hay arranque que contar
    if (g.gt >= 420 && e14) {
      var la = e14.diff >= 0 ? 'blue' : 'red', fb = ev.filter(function (e) { return e.kind === 'fb'; })[0];
      var dl = cuenta('dragon', la, 840);
      if (Math.abs(e14.diff) >= 1000) out.push(C[la] + ' tomó el control temprano: +' + kc(e14.diff) + ' de oro al min ' + mmss(e14.gt) + (dl >= 2 ? ' y ' + dl + ' dragones' : '') + '.');
      else out.push('Arranque parejo: al min ' + mmss(e14.gt) + (Math.abs(e14.diff) < 150 ? ' estaban iguales en oro' : ' la diferencia era de ' + kc(e14.diff) + ' de oro') + (fb ? ', con la primera sangre para ' + C[fb.side] : '') + '.');
    }
    // 2) el giro: el más grande; con el juego terminado, el decisivo del ganador (y el del que perdió, si fue mayor)
    var pts = function (w) { return '<b>+' + Math.round(Math.abs(w.d) * 100) + ' puntos</b>'; };
    var giroTxt = function (w, pre) {
      // «de a poco» solo si la ventaja crece desde el arranque, o por más de 10 min sin un Barón ni una pelea que la explique
      var largo = (w.a < 60 && w.b - w.a > 360) || (w.b - w.a > 600 && !/Barón|Pelea|Ancestral|Inhibidor|ALMA/.test(w.cause || ''));
      if (largo) return C[w.side] + ' fue ampliando la ventaja de a poco: ' + pts(w) + ' entre el min ' + mmss(w.a) + ' y el ' + mmss(w.b) + '.';
      var ca = causaTxt(w.cause, w.side);
      return (pre || 'El giro') + ': entre el min ' + mmss(w.a) + ' y el ' + mmss(w.b) + ', ' + C[w.side] + ' sumó ' + pts(w) + (ca ? ' con ' + eh(ca) : '') + '.';
    };
    var sws = (g.swings || []).slice().sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); }), sw = sws[0];
    if (g.ended && g.recap) {
      var gan = g.recap.win, dec = sws.filter(function (w) { return w.side === gan; })[0], per = sws.filter(function (w) { return w.side !== gan; })[0];
      if (dec && Math.abs(dec.d) >= 0.12) out.push(giroTxt(dec, 'El giro decisivo'));
      if (per && Math.abs(per.d) >= 0.12 && (!dec || Math.abs(per.d) > Math.abs(dec.d)))
        out.push(C[per.side] + ' tuvo su momento entre el min ' + mmss(per.a) + ' y el ' + mmss(per.b) + ' (' + pts(per) + '), pero no le alcanzó.');
    } else if (sw && Math.abs(sw.d) >= 0.12) out.push(giroTxt(sw));
    // 3) cómo está ahora (o cómo terminó)
    if (g.ended && g.recap) out.push(C[g.recap.win] + ' cerró el juego en ' + mmss(g.recap.dur) + (g.recap.comeback ? ', remontando desde el ' + pc(g.recap.low.p) : '') + '.');
    else {
      var ld = g.pBlue >= 0.5 ? 'blue' : 'red', ot = ld === 'blue' ? 'red' : 'blue', st = g.stats, xs = [];
      if (st) {
        var gd = (st[ld].gold - st[ot].gold); if (gd >= 800) xs.push('+' + kc(gd) + ' de oro');
        var td = st[ld].towers - st[ot].towers; if (td >= 2) xs.push(td + ' torres más');
        if (st[ld].dragons >= 4) xs.push('el alma de dragón'); else if (st[ld].dragons - st[ot].dragons >= 2) xs.push((st[ld].dragons - st[ot].dragons) + ' dragones más');
      }
      var bb = g.timers && g.timers.baronBuff; if (bb && bb.until > g.gt && bb.side === ld) xs.push('el Barón activo');
      var pl = Math.max(g.pBlue, 1 - g.pBlue);
      out.push((Math.round(pl * 100) === 50 ? 'Ahora está parejo: 50 % para cada uno' : pl < 0.56 ? 'Ahora está parejo: ' + C[ld] + ' apenas arriba, con ' + pc(pl) : 'Ahora ' + C[ld] + ' va ' + pc(pl)) +
        (xs.length ? ', con ' + xs.slice(0, 3).join(', ').replace(/, ([^,]*)$/, ' y $1') : '') + '.');
      // 4) qué necesita el otro
      var c = g.comeback;
      if (c && c.paths && c.paths[0] && c.p < 0.45) out.push(C[c.side] + ' ' + (c.reached ? 'necesita ' : 'se acerca con ') + '<b>' + eh(c.paths[0].txt) + '</b>: con eso vuelve al ' + pc(c.paths[0].p) + '.');
      else if (Math.abs(g.pBlue - 0.5) < 0.08 && g.impact) out.push('Todo abierto: el próximo ' + eh(g.impact.obj) + ' puede inclinarlo.');
    }
    return conTexto(out.slice(0, 5));
  };
  // ---------- qué cambió en el último minuto de juego ----------
  RiftEngine.cambio = function (s) {
    s = s || snapshot(); var g = s.game, m = s.match, sm = g && g.samples;
    if (!m || !sm || sm.length < 3 || !g.stats || g.pBlue == null) return null;
    var past = null; for (var i = 0; i < sm.length; i++) if (g.gt - sm[i].gt >= 60) past = sm[i];
    if (!past || g.gt - past.gt > 150) return null;  // sin una muestra de hace ~1 min (se acaba de entrar), no se compara
    var B = g.stats.blue, Rr = g.stats.red, items = [];
    var add = function (side, n, uno, varios) { if (n > 0) items.push({side: side, code: side === 'blue' ? m.blue.code : m.red.code, txt: '+' + n + ' ' + (n === 1 ? uno : varios)}); };
    var dg = (B.gold - Rr.gold) - past.diff; if (Math.abs(dg) >= 300) items.push({side: dg > 0 ? 'blue' : 'red', code: dg > 0 ? m.blue.code : m.red.code, txt: '+' + kc(dg) + ' de oro'});
    if (past.kb != null) { add('blue', B.kills - past.kb, 'kill', 'kills'); add('red', Rr.kills - past.kr, 'kill', 'kills'); add('blue', B.towers - past.tb, 'torre', 'torres'); add('red', Rr.towers - past.tr, 'torre', 'torres'); }
    if (past.db != null) { add('blue', B.dragons + B.elders - past.db, 'dragón', 'dragones'); add('red', Rr.dragons + Rr.elders - past.dr, 'dragón', 'dragones');
      add('blue', B.barons - past.bb, 'Barón', 'Barones'); add('red', Rr.barons - past.br, 'Barón', 'Barones'); add('blue', B.inhibs - past.ib, 'inhibidor', 'inhibidores'); add('red', Rr.inhibs - past.ir, 'inhibidor', 'inhibidores'); }
    return {dp: Math.round((g.pBlue - past.p) * 100), desde: past.gt, items: items};
  };
  // ---------- qué mirar ahora: el próximo objetivo, cuánto mueve y quién llega mejor ----------
  RiftEngine.mirar = function (s) {
    s = s || snapshot(); var g = s.game, m = s.match;
    if (!m || !g || g.pBlue == null || g.ended) return null;
    // el próximo objetivo; si ya está en el mapa (nadie lo tomó), ese manda, y el Barón antes que el dragón
    var t = g.timers || {}, cs = [];
    if (t.dragon) cs.push({obj: t.dragon.elder ? 'Dragón Ancestral' : 'Dragón', at: t.dragon.at, peso: 1});
    if (t.baron) cs.push({obj: 'Barón', at: t.baron.at, peso: 2});
    if (!cs.length) return null;
    var vivos = cs.filter(function (c) { return c.at <= g.gt; }).sort(function (a, b) { return b.peso - a.peso; });
    var ob = vivos[0] || cs.sort(function (a, b) { return a.at - b.at; })[0];
    var o = {obj: ob.obj, en: Math.max(0, ob.at - g.gt), vivo: ob.at <= g.gt, impacto: g.impact ? {blue: g.impact.blue, red: g.impact.red} : null, mejor: null, por: []};
    var J = g.jugadores, st = g.stats, sc = 0;
    if (J) { var dl = J.blue.lvl - J.red.lvl; if (Math.abs(dl) >= 0.4) { o.por.push({side: dl > 0 ? 'blue' : 'red', txt: 'nivel medio ' + Math.max(J.blue.lvl, J.red.lvl).toFixed(1).replace('.', ',') + ' contra ' + Math.min(J.blue.lvl, J.red.lvl).toFixed(1).replace('.', ',')}); sc += dl * 1.2; }
      if (J.items && J.blue.items !== J.red.items) { var di = J.blue.items - J.red.items; o.por.push({side: di > 0 ? 'blue' : 'red', txt: Math.abs(di) + (Math.abs(di) === 1 ? ' ítem completo más' : ' ítems completos más')}); sc += di * 0.8; } }
    if (st) { var gd = st.blue.gold - st.red.gold; if (Math.abs(gd) >= 700) { o.por.push({side: gd > 0 ? 'blue' : 'red', txt: '+' + kc(gd) + ' de oro'}); sc += gd / 1500; } }
    if (Math.abs(sc) >= 0.6) { o.mejor = sc > 0 ? 'blue' : 'red'; o.por = o.por.filter(function (x) { return x.side === o.mejor; }); o.code = o.mejor === 'blue' ? m.blue.code : m.red.code; }
    else o.por = [];
    return o;
  };
  // banda de confianza del gráfico: más ancha en los minutos en que el modelo acierta menos (es una guía, no un intervalo estadístico)
  RiftEngine.banda = function (gt) { var a = accAt(gt); return a == null ? null : Math.max(0.04, (1 - a) * 0.5); };
  RiftEngine.paleta = function (hex) { var c = hex2rgb(hex); return c ? variantes(c) : null; };  // las variantes de un color cualquiera (tema «Mi canal»)
  RiftEngine.colorConocido = function (code) { return TEAMCOL[code] || null; };
  RiftEngine.contraste = function (h1, h2) { return contraste(hex2rgb(h1), hex2rgb(h2)); };
  // el estado de los datos cambia aunque no lleguen datos: se avisa cada 5 s
  setInterval(function () { if (subs.length) emit(); }, 5000);
  // simulador para «Cómo funciona»: el mismo modelo, con un estado de juego a mano (todo desde el lado azul)
  // o = {min, previa, oro, kills, torres, inhib, barones, dragones, alma, punto, ancestral}
  RiftEngine.simular = function (o) {
    var w = modelW(o.min || 15), x = [1, o.previa || 0, (o.oro || 0) / 1000, (o.kills || 0) / 5, o.torres || 0, o.inhib || 0, o.barones || 0, o.dragones || 0, o.alma || 0, o.punto || 0, o.ancestral || 0, 0];
    var nom = ['Lado azul', 'Fuerza previa', 'Oro', 'Kills', 'Torres', 'Inhibidores', 'Barones', 'Dragones', 'Alma', 'Punto de alma', 'Ancestral'], z = 0, parts = [];
    x.forEach(function (v, i) { var c = w[i] * v; z += c; if (i < nom.length && Math.abs(c) > 0.005) parts.push({txt: nom[i], z: c}); });
    z = Math.max(-4.6, Math.min(4.6, z));
    return {p: 1 / (1 + Math.exp(-z)), parts: parts.sort(function (a, b) { return Math.abs(b.z) - Math.abs(a.z); })};
  };
  root.RiftEngine = RiftEngine;
})(typeof window !== 'undefined' ? window : this);
