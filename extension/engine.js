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
    if (f.gameState === 'finished') { if (!G.ended && DEMO) DEMO.next = setTimeout(demoNext, 30000); G.ended = true; }
    emit();
  }

  // ---------- retraso del stream (sincronía) ----------
  var VIDEO_DEFAULT = 42;
  var videoDelay = (function () { try { return +(localStorage.getItem('rp_retraso') || VIDEO_DEFAULT); } catch (e) { return VIDEO_DEFAULT; } })();
  var delay = videoDelay;
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
  async function loadEvent(id) {
    var d = await api('getEventDetails', {id: id});
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
        return {name: shortName(p.summonerName), role: p.role, champ: champName(p.championId), share: st.championDamageShare || 0, kp: st.killParticipation || 0,
          k: st.kills || 0, d: st.deaths || 0, a: st.assists || 0, cs: st.creepScore || 0, gold: st.totalGoldEarned || 0, lvl: st.level || 1};
      });
    }
    G.roster = {blue: sideP('blueTeamMetadata'), red: sideP('redTeamMetadata')};
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

  // ---------- extras para casters y streamers ----------
  // Estadísticas pro por campeón (~2,200 juegos 2025–26, misma tabla que la app). Solo descriptivo: no entra al modelo.
  var CHAMP = {"RekSai":{"wr":0.5823,"res":0.0359,"scale":-0.1604,"g":67,"pres":0.0149},"Qiyana":{"wr":0.4899,"res":-0.0094,"scale":0.0293,"g":137,"pres":0.0305},"Ryze":{"wr":0.5256,"res":0.0302,"scale":0.0257,"g":614,"pres":0.1366},"Corki":{"wr":0.4707,"res":-0.0141,"scale":0.026,"g":398,"pres":0.0886},"Neeko":{"wr":0.5117,"res":0.0155,"scale":-0.0383,"g":287,"pres":0.0639},"Ambessa":{"wr":0.4786,"res":-0.0205,"scale":0.0897,"g":479,"pres":0.1066},"Trundle":{"wr":0.5442,"res":0.0227,"scale":0.0488,"g":203,"pres":0.0452},"Taliyah":{"wr":0.4898,"res":0.0018,"scale":-0.045,"g":282,"pres":0.0628},"Sivir":{"wr":0.5751,"res":0.0521,"scale":0.1019,"g":261,"pres":0.0581},"Alistar":{"wr":0.5275,"res":0.0159,"scale":-0.1359,"g":333,"pres":0.0741},"Sion":{"wr":0.4932,"res":-0.0094,"scale":0.0316,"g":353,"pres":0.0785},"MonkeyKing":{"wr":0.4597,"res":-0.0443,"scale":-0.0668,"g":360,"pres":0.0801},"Orianna":{"wr":0.5341,"res":0.0348,"scale":-0.0403,"g":413,"pres":0.0919},"Caitlyn":{"wr":0.5153,"res":0.0018,"scale":-0.0705,"g":283,"pres":0.063},"Karma":{"wr":0.5015,"res":-0.0034,"scale":-0.0317,"g":329,"pres":0.0732},"KSante":{"wr":0.4521,"res":-0.0378,"scale":0.1444,"g":479,"pres":0.1066},"JarvanIV":{"wr":0.5201,"res":0.0171,"scale":0.0565,"g":584,"pres":0.13},"Akali":{"wr":0.5492,"res":0.0449,"scale":0.0059,"g":232,"pres":0.0516},"MissFortune":{"wr":0.4695,"res":0.0012,"scale":0.0195,"g":152,"pres":0.0338},"Rakan":{"wr":0.5804,"res":0.0598,"scale":0.1214,"g":274,"pres":0.061},"Galio":{"wr":0.4856,"res":-0.0224,"scale":0.046,"g":231,"pres":0.0514},"XinZhao":{"wr":0.4648,"res":-0.0393,"scale":-0.0763,"g":528,"pres":0.1175},"Annie":{"wr":0.5263,"res":0.0094,"scale":0.0119,"g":254,"pres":0.0565},"Yunara":{"wr":0.4793,"res":-0.0291,"scale":-0.0387,"g":470,"pres":0.1046},"Renata":{"wr":0.4887,"res":-0.0311,"scale":0.1102,"g":121,"pres":0.0269},"Rumble":{"wr":0.522,"res":0.0336,"scale":0.0193,"g":555,"pres":0.1235},"Vi":{"wr":0.5346,"res":0.0295,"scale":-0.0308,"g":465,"pres":0.1035},"Hwei":{"wr":0.4314,"res":-0.0632,"scale":-0.2344,"g":39,"pres":0.0087},"Smolder":{"wr":0.3333,"res":-0.1251,"scale":-0.1545,"g":15,"pres":0.0033},"Leona":{"wr":0.5079,"res":0.0184,"scale":-0.0484,"g":179,"pres":0.0398},"Varus":{"wr":0.5225,"res":0.0192,"scale":-0.0069,"g":344,"pres":0.0765},"Pantheon":{"wr":0.5116,"res":0.0062,"scale":0.1159,"g":463,"pres":0.103},"Sylas":{"wr":0.4805,"res":-0.0299,"scale":0.0169,"g":142,"pres":0.0316},"Ziggs":{"wr":0.4383,"res":-0.0579,"scale":-0.1133,"g":150,"pres":0.0334},"Nautilus":{"wr":0.4261,"res":-0.0405,"scale":0.0041,"g":387,"pres":0.0861},"Ornn":{"wr":0.5763,"res":0.0603,"scale":0.071,"g":106,"pres":0.0236},"Nocturne":{"wr":0.4934,"res":0.0102,"scale":0.0474,"g":292,"pres":0.065},"Leblanc":{"wr":0.5269,"res":0.0137,"scale":-0.0173,"g":81,"pres":0.018},"Ashe":{"wr":0.6074,"res":0.0818,"scale":-0.0077,"g":314,"pres":0.0699},"Lulu":{"wr":0.4706,"res":-0.0298,"scale":-0.0967,"g":379,"pres":0.0843},"Renekton":{"wr":0.455,"res":-0.0395,"scale":0.021,"g":366,"pres":0.0814},"Aurora":{"wr":0.4392,"res":-0.0509,"scale":0.1509,"g":325,"pres":0.0723},"Kaisa":{"wr":0.4898,"res":-0.0108,"scale":0.0273,"g":184,"pres":0.0409},"Rell":{"wr":0.4304,"res":-0.0311,"scale":0.0868,"g":225,"pres":0.0501},"Ezreal":{"wr":0.5098,"res":0.0132,"scale":-0.0188,"g":549,"pres":0.1222},"Braum":{"wr":0.5213,"res":0.002,"scale":-0.0246,"g":82,"pres":0.0182},"Elise":{"wr":0.4857,"res":0.0341,"scale":0.0455,"g":23,"pres":0.0051},"Mordekaiser":{"wr":0.4167,"res":-0.0515,"scale":-0.1871,"g":12,"pres":0.0027},"Xayah":{"wr":0.6259,"res":0.1064,"scale":0.1444,"g":135,"pres":0.03},"Bard":{"wr":0.5246,"res":0.0124,"scale":0.0093,"g":436,"pres":0.097},"Azir":{"wr":0.4246,"res":-0.0861,"scale":0.0595,"g":313,"pres":0.0696},"Aatrox":{"wr":0.4688,"res":-0.0387,"scale":0.0479,"g":148,"pres":0.0329},"Lucian":{"wr":0.4417,"res":-0.0476,"scale":-0.032,"g":348,"pres":0.0774},"Swain":{"wr":0.5,"res":0.0026,"scale":0.0819,"g":12,"pres":0.0027},"Viktor":{"wr":0.5324,"res":0.0342,"scale":0.0749,"g":266,"pres":0.0592},"Jax":{"wr":0.4861,"res":0.0011,"scale":-0.0364,"g":132,"pres":0.0294},"Draven":{"wr":0.5,"res":0.0162,"scale":-0.1455,"g":16,"pres":0.0036},"Cassiopeia":{"wr":0.5634,"res":0.0538,"scale":-0.0698,"g":256,"pres":0.057},"Poppy":{"wr":0.5694,"res":0.0682,"scale":0.0393,"g":132,"pres":0.0294},"Naafiri":{"wr":0.5016,"res":0.0029,"scale":-0.0903,"g":293,"pres":0.0652},"Yorick":{"wr":0.5172,"res":0.0334,"scale":0.0221,"g":162,"pres":0.036},"Nami":{"wr":0.4745,"res":-0.0178,"scale":-0.0215,"g":243,"pres":0.0541},"Kled":{"wr":0.5814,"res":0.0471,"scale":0.0706,"g":31,"pres":0.0069},"Maokai":{"wr":0.4944,"res":0.0091,"scale":-0.1441,"g":77,"pres":0.0171},"Jhin":{"wr":0.4165,"res":-0.072,"scale":0.0558,"g":377,"pres":0.0839},"Anivia":{"wr":0.416,"res":-0.0776,"scale":-0.0864,"g":226,"pres":0.0503},"Senna":{"wr":0.5167,"res":0.031,"scale":0.0613,"g":48,"pres":0.0107},"Zeri":{"wr":0.4516,"res":-0.0514,"scale":-0.1016,"g":50,"pres":0.0111},"Vayne":{"wr":0.5347,"res":0.0205,"scale":-0.0476,"g":89,"pres":0.0198},"Sejuani":{"wr":0.4605,"res":-0.0258,"scale":-0.0051,"g":64,"pres":0.0142},"DrMundo":{"wr":0.4918,"res":0.0262,"scale":0.1961,"g":110,"pres":0.0245},"Jayce":{"wr":0.4354,"res":-0.0575,"scale":-0.1057,"g":367,"pres":0.0817},"Ahri":{"wr":0.5362,"res":0.0267,"scale":-0.1684,"g":292,"pres":0.065},"Yone":{"wr":0.4773,"res":0.0123,"scale":0.0465,"g":120,"pres":0.0267},"Viego":{"wr":0.3913,"res":-0.0494,"scale":0.0118,"g":11,"pres":0.0024},"Zoe":{"wr":0.5345,"res":0.0314,"scale":0.1277,"g":46,"pres":0.0102},"Skarner":{"wr":0.4897,"res":-0.0036,"scale":-0.138,"g":182,"pres":0.0405},"Ivern":{"wr":0.5882,"res":0.0554,"scale":0.1154,"g":5,"pres":0.0011},"Thresh":{"wr":0.4941,"res":0.0101,"scale":-0.0077,"g":73,"pres":0.0162},"Syndra":{"wr":0.4799,"res":-0.0103,"scale":-0.0718,"g":261,"pres":0.0581},"Gnar":{"wr":0.5482,"res":0.0261,"scale":-0.0464,"g":444,"pres":0.0988},"Kalista":{"wr":0.4836,"res":-0.0326,"scale":0.1657,"g":110,"pres":0.0245},"Camille":{"wr":0.5385,"res":0.0081,"scale":-0.1279,"g":157,"pres":0.0349},"Mel":{"wr":0.4091,"res":-0.0977,"scale":-0.0638,"g":98,"pres":0.0218},"Gragas":{"wr":0.4762,"res":-0.0069,"scale":-0.1911,"g":30,"pres":0.0067},"TahmKench":{"wr":0.4211,"res":-0.0468,"scale":-0.1,"g":7,"pres":0.0016},"Malphite":{"wr":0.4769,"res":-0.0196,"scale":-0.0273,"g":53,"pres":0.0118},"Aphelios":{"wr":0.458,"res":-0.0346,"scale":-0.0319,"g":119,"pres":0.0265},"Kennen":{"wr":0.5231,"res":0.022,"scale":-0.0063,"g":53,"pres":0.0118},"Zaahen":{"wr":0.5091,"res":0.0183,"scale":0.0963,"g":153,"pres":0.034},"LeeSin":{"wr":0.5321,"res":0.0421,"scale":-0.0149,"g":300,"pres":0.0668},"Gwen":{"wr":0.5079,"res":-0.0015,"scale":0.1058,"g":114,"pres":0.0254},"Ekko":{"wr":0.4118,"res":-0.0477,"scale":-0.1364,"g":5,"pres":0.0011},"Blitzcrank":{"wr":0.5333,"res":0.0278,"scale":0.0417,"g":18,"pres":0.004},"Jinx":{"wr":0.5217,"res":0.0295,"scale":-0.0833,"g":34,"pres":0.0076},"Shen":{"wr":0.5714,"res":0.07,"scale":-0.0441,"g":184,"pres":0.0409},"Olaf":{"wr":0.5217,"res":0.0217,"scale":-0.1111,"g":172,"pres":0.0383},"Volibear":{"wr":0.6061,"res":0.071,"scale":0.2152,"g":21,"pres":0.0047},"AurelionSol":{"wr":0.5,"res":0.0204,"scale":0.1833,"g":6,"pres":0.0013},"TwistedFate":{"wr":0.5584,"res":0.0206,"scale":0.1096,"g":142,"pres":0.0316},"Udyr":{"wr":0.3889,"res":-0.0871,"scale":-0.0598,"g":6,"pres":0.0013},"Seraphine":{"wr":0.5623,"res":0.0365,"scale":0.0252,"g":349,"pres":0.0777},"Nidalee":{"wr":0.5714,"res":0.0541,"scale":0.026,"g":16,"pres":0.0036},"Tristana":{"wr":0.5,"res":0.0228,"scale":0.0335,"g":46,"pres":0.0102},"Yuumi":{"wr":0.4783,"res":-0.0297,"scale":0.1143,"g":34,"pres":0.0076},"Milio":{"wr":0.4513,"res":-0.0352,"scale":0.0872,"g":265,"pres":0.059},"Chogath":{"wr":0.439,"res":-0.0538,"scale":0.0841,"g":29,"pres":0.0065},"Yasuo":{"wr":0.56,"res":0.0863,"scale":0.0101,"g":13,"pres":0.0029},"Pyke":{"wr":0.4737,"res":-0.0199,"scale":0.0116,"g":45,"pres":0.01},"Nasus":{"wr":0.5926,"res":0.0871,"scale":0.0375,"g":15,"pres":0.0033},"Khazix":{"wr":0.5,"res":0.0107,"scale":-0.0749,"g":12,"pres":0.0027},"Irelia":{"wr":0.4762,"res":0.0433,"scale":-0.0333,"g":9,"pres":0.002},"Lissandra":{"wr":0.4792,"res":-0.014,"scale":0.0151,"g":36,"pres":0.008},"KogMaw":{"wr":0.5357,"res":0.0318,"scale":-0.0833,"g":16,"pres":0.0036},"Vex":{"wr":0.4211,"res":-0.0384,"scale":-0.1984,"g":7,"pres":0.0016},"Lux":{"wr":0.6739,"res":0.1005,"scale":0.0303,"g":34,"pres":0.0076},"Xerath":{"wr":0.44,"res":-0.0417,"scale":-0.0714,"g":13,"pres":0.0029},"Shyvana":{"wr":0.5333,"res":0.0063,"scale":0.05,"g":18,"pres":0.004},"Urgot":{"wr":0.5294,"res":0.0015,"scale":0.1389,"g":5,"pres":0.0011},"Locke":{"wr":0.4432,"res":-0.0444,"scale":0.0221,"g":76,"pres":0.0169}};
  var ROLES = ['top', 'jungle', 'mid', 'bottom', 'support'];
  var ROL_ES = {top: 'Top', jungle: 'Jungla', mid: 'Mid', bottom: 'ADC', support: 'Soporte'};
  var CHAMP_ES = {MonkeyKing: 'Wukong', KSante: "K'Sante", Kaisa: "Kai'Sa", Khazix: "Kha'Zix", Chogath: "Cho'Gath", KogMaw: "Kog'Maw",
    RekSai: "Rek'Sai", Leblanc: 'LeBlanc', DrMundo: 'Dr. Mundo', JarvanIV: 'Jarvan IV', Velkoz: "Vel'Koz", Belveth: "Bel'Veth", Nunu: 'Nunu y Willump'};
  var champName = function (id) { id = String(id || ''); return CHAMP_ES[id] || id.replace(/([a-z])([A-Z])/g, '$1 $2'); };
  var other = function (side) { return side === 'blue' ? 'red' : 'blue'; };

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
    function f(x, y) { return x >= need ? 1 : y >= need ? 0 : 0.5 * f(x + 1, y) + 0.5 * f(x, y + 1); }
    var ifB = f(wb + 1, wr), ifR = f(wb, wr + 1), p = G.wp.p;
    return {bo: bo, need: need, score: [wb, wr], ifBlue: ifB, ifRed: ifR, pNow: p * ifB + (1 - p) * ifR};
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
        waiting: !!G.waiting, pBlue: G.wp ? G.wp.p : null,
        reasons: G.wp ? G.wp.parts : [], events: G.events.slice(-8), timers: G.t,
        stats: G.last ? {blue: tstat(G.last.blueTeam), red: tstat(G.last.redTeam)} : null,
        samples: G.samples ? G.samples.slice() : [], impact: impactNext(),
        fight: G.fight && G.fight.players ? {gt: G.fight.gt, win: G.fight.win, blue: G.fight.players.blue, red: G.fight.players.red} : null,
        swings: keyMoments(3), comeback: comebackPaths(), draft: draftInfo(), lanes: L, keyPlayer: keyPlayer(L), recap: recap()} : null,
      series: seriesNow(), h2h: M ? h2hFor(bt.code, rt.code) : null,
      demo: DEMO && DEMO.cur ? {blue: DEMO.cur.blue, red: DEMO.cur.red, date: DEMO.cur.date, block: DEMO.cur.block, vel: DEMO.vel} : null,
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
  // volver de la demo (o de una repetición) al partido en vivo
  RiftEngine.live = function () {
    if (DEMO) clearTimeout(DEMO.next);
    DEMO = null; REPLAY = null; M = null; G = null;
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
      if (r.swing) out.push('El giro decisivo: min '+mmss(r.swing.a)+'–'+mmss(r.swing.b)+', <b>+'+Math.round(Math.abs(r.swing.d)*100)+' pts</b> ('+esc(r.swing.cause)+').');
      if (r.key) out.push('Jugador clave: <b>'+esc(r.key.name)+'</b> ('+esc(r.key.code)+', '+esc(r.key.champ)+') · '+r.key.k+'/'+r.key.d+'/'+r.key.a+' · '+Math.round(r.key.share*100)+'% del daño.');
      if (r.stats){ var w=r.stats[r.win], l=r.stats[r.win==='blue'?'red':'blue']; out.push('Kills '+w.kills+'–'+l.kills+' · torres '+w.towers+'–'+l.towers+' · dragones '+w.dragons+'–'+l.dragons+' · Barones '+w.barons+'–'+l.barons+'.'); }
      return out;
    }
    function recapPNG(s){
      var m=s.match, g=s.game, r=g.recap, W=1200, H=675, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      var c=cv.getContext('2d'), wc=r.win==='blue'?'#7cc0ff':'#ff8a8f';
      var bg=c.createLinearGradient(0,0,W,H); bg.addColorStop(0,'#0b1220'); bg.addColorStop(1,'#140d18'); c.fillStyle=bg; c.fillRect(0,0,W,H);
      var glow=c.createRadialGradient(r.win==='blue'?120:W-120,0,10,r.win==='blue'?120:W-120,0,620); glow.addColorStop(0,r.win==='blue'?'rgba(74,163,255,.28)':'rgba(255,90,95,.26)'); glow.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=glow; c.fillRect(0,0,W,H);
      var F=function(w,sz,fam){ return w+' '+sz+'px '+(fam||"'Chakra Petch', Inter, sans-serif"); };
      c.fillStyle='#8b97b0'; c.font=F(700,18); c.fillText('RIFTPULSE · '+(m.league||'').toUpperCase()+(m.gameNo?' · JUEGO '+m.gameNo:''),60,64);
      c.fillStyle=wc; c.font=F(700,64); c.fillText(r.code+' gana',60,140);
      c.fillStyle='#c7d0e2'; c.font=F(500,26,'Inter, sans-serif'); c.fillText('vs '+r.lose+' · '+mmss(r.dur)+(r.comeback?' · ¡remontada desde el '+pct(r.low.p)+'!':''),60,182);
      // trayectoria del ganador
      var X0=60, Y0=222, CW=W-120, CH=220, sm=g.samples, t0=sm[0].gt, span=Math.max(1,sm[sm.length-1].gt-t0);
      c.strokeStyle='#263352'; c.setLineDash([6,6]); c.beginPath(); c.moveTo(X0,Y0+CH/2); c.lineTo(X0+CW,Y0+CH/2); c.stroke(); c.setLineDash([]);
      (g.swings||[]).forEach(function(sw){ c.fillStyle=sw.side==='blue'?'rgba(74,163,255,.12)':'rgba(255,90,95,.12)'; c.fillRect(X0+(sw.a-t0)/span*CW,Y0,Math.max(3,(sw.b-sw.a)/span*CW),CH); });
      c.lineWidth=4; c.lineJoin='round'; c.strokeStyle=wc; c.beginPath();
      sm.forEach(function(p,i){ var v=r.win==='blue'?p.p:1-p.p, x=X0+(p.gt-t0)/span*CW, y=Y0+CH-v*CH; if(i) c.lineTo(x,y); else c.moveTo(x,y); }); c.stroke();
      c.fillStyle='#8b97b0'; c.font=F(500,15,'Inter, sans-serif'); c.fillText('Probabilidad de '+r.code+' según el modelo',X0,Y0+CH+24); c.textAlign='right'; c.fillText('50%',X0+CW,Y0+CH/2-8); c.textAlign='left';
      var lines=recapLines(s).slice(2).map(function(t){ return t.replace(/<[^>]+>/g,''); }), y=Y0+CH+70;
      c.fillStyle='#e8edf7'; c.font=F(500,22,'Inter, sans-serif');
      lines.forEach(function(t){ c.fillText(t.length>92?t.slice(0,90)+'…':t,60,y); y+=38; });
      c.fillStyle='#56627a'; c.font=F(500,14,'Inter, sans-serif');
      c.fillText('Pronóstico y análisis, sin fines de apuestas. No avalado por Riot Games.',60,H-28);
      c.textAlign='right'; c.fillStyle='#3ddc97'; c.font=F(700,15); if (s.precision) c.fillText(Math.round(s.precision.acc15*100)+'% DE ACIERTO AL MIN 15',W-60,H-28);
      return cv.toDataURL('image/png');
    }
    function talk(s){
      var m=s.match, g=s.game, out=[];
      var pb=Math.round(g.pBlue*100), lead = pb>=50, lc = lead?m.blue.code:m.red.code, lp = lead?pb:100-pb;
      out.push('RiftPulse da <b>'+lp+'%</b> a <b>'+esc(lc)+'</b> ahora mismo ('+mmss(g.gt)+').');
      var top=(g.reasons||[]).filter(function(x){ return (x.z>=0)===lead; })[0];
      if (top) out.push('Su mayor factor: <b>'+esc(top.txt)+'</b>.');
      // momentum
      var past=null, sm=g.samples||[];
      for (var i=0;i<sm.length;i++){ if (g.gt-sm[i].gt>=60) past=sm[i]; }
      if (past){ var d=Math.round((g.pBlue-past.p)*100); if (Math.abs(d)>=8){ var who=d>0?m.blue.code:m.red.code; out.push('Giro reciente: <b>'+esc(who)+' '+(d>0?'+':'')+d+' pts</b> en el último minuto de juego.'); } }
      var se=s.series;
      if (se && se.bo>1){ var trail=lead?m.red.code:m.blue.code, pTrail=lead?1-se.ifRed:se.ifBlue; out.push('Si <b>'+esc(trail)+'</b> le da la vuelta a este juego, queda con <b>'+pct(pTrail)+'</b> de llevarse la serie.'); }
      var c=g.comeback;
      if (c && c.reached) out.push('Para remontar, <b>'+esc(c.code)+'</b> necesita <b>'+esc(c.paths[0].txt)+'</b>: con eso vuelve al '+pct(c.paths[0].p)+'.');
      var k=g.keyPlayer;
      if (k && Math.abs(k.gd)>=500) out.push('Jugador clave: <b>'+esc(k.name)+'</b>, '+(k.gd>=0?'+':'−')+k1(k.gd)+' de oro sobre '+esc(k.vs)+' y '+Math.round(k.share*100)+'% del daño de '+esc(k.code)+'.');
      if (g.draft && g.draft.window && g.gt<1500) out.push('Reloj del draft: <b>'+esc(g.draft.window.early)+'</b> tiene que sacar ventaja antes del min ~24; después el draft favorece a <b>'+esc(g.draft.window.late)+'</b>.');
      var o = g.timers && ((g.timers.dragon && g.timers.dragon.at>g.gt)?{k:g.timers.dragon.elder?'Ancestral':'Dragón',v:g.timers.dragon.at-g.gt}:(g.timers.baron && g.timers.baron.at>g.gt)?{k:'Barón',v:g.timers.baron.at-g.gt}:null);
      if (o) out.push('Próximo <b>'+o.k+'</b> en <b>'+mmss(o.v)+'</b>'+(g.impact?': si lo toma '+esc(m.blue.code)+', '+(g.impact.blue>=0?'+':'')+g.impact.blue+' pts; si lo toma '+esc(m.red.code)+', '+(g.impact.red>=0?'+':'')+g.impact.red+' pts.':': objetivo que puede mover la balanza.'));
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
  var BR = {data: null, at: 0, loading: false};
  async function loadBracket() {
    if (BR.loading || Date.now() - BR.at < 60000) return BR.data;
    BR.loading = true;
    try {
      var evs = [], tok = null;
      for (var n = 0; n < 3; n++) {
        var params = {leagueId: WORLDS}; if (tok) params.pageToken = tok;
        var d = await api('getSchedule', params);
        evs = evs.concat(d.schedule.events || []);
        tok = d.schedule.pages && d.schedule.pages.older; if (!tok) break;
      }
      BR.data = buildBracket(evs); BR.at = Date.now();
    } catch (e) {}
    BR.loading = false;
    emit();
    return BR.data;
  }
  RiftEngine.buildBracket = buildBracket;   // la app lo usa con su propio calendario
  RiftEngine.loadBracket = loadBracket;     // el overlay lo pide solo (se refresca cada minuto)
  Object.defineProperty(RiftEngine, 'bracket', {get: function () { return BR.data; }});

  RiftEngine.MODELO = MODELO;       // fuente única de los pesos del modelo (la app los lee de aquí)
  RiftEngine.PRECISION = PRECISION;
  root.RiftEngine = RiftEngine;
})(typeof window !== 'undefined' ? window : this);
