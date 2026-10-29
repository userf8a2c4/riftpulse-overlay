// Junta los juegos profesionales 2025–26 desde el feed público de lolesports, para reentrenar el modelo.
// Por juego: el draft, cuadros en los min 10, 15, 20 y 25 (equipos y jugadores) y quién ganó.
// Corre en GitHub Actions (acción «Reentrenar el modelo»): node modelo/recolectar.js → modelo/datos/juegos.jsonl y series.json
const fs = require('fs'), path = require('path');
const ENG = fs.readFileSync(path.join(__dirname, '..', 'engine.js'), 'utf8');
const KEY = ENG.match(/KEY = '([^']+)'/)[1];
const API = 'https://esports-api.lolesports.com/persisted/gw/', FEED = 'https://feed.lolesports.com/livestats/v1/';
const DESDE = process.env.DESDE || '2025-01-01';
const LIGAS = (process.env.LIGAS || 'lck,lpl,lec,lcs,lta_n,lta_s,lta_cross,cblol-brazil,lcp,worlds,msi,first_stand,esports_world_cup').split(',');
const OUT = path.join(__dirname, 'datos'); fs.mkdirSync(OUT, {recursive: true});
const espera = ms => new Promise(r => setTimeout(r, ms));
async function j(u, api) {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(u, {headers: api ? {'x-api-key': KEY} : {}}); if (r.status === 204 || r.status === 404) return null; if (r.ok) return r.json(); } catch (e) {}
    await espera(800 * (i + 1));
  }
  return null;
}
const iso = t => new Date(Math.floor(t / 10000) * 10000).toISOString().replace(/\.\d+Z$/, '.000Z');
const ts = f => Date.parse(f.rfc460Timestamp);
const ganador = f => { const s = x => x.inhibitors * 3 + x.towers; const b = f.blueTeam, r = f.redTeam; return s(b) !== s(r) ? (s(b) > s(r) ? 'blue' : 'red') : (b.totalGold >= r.totalGold ? 'blue' : 'red'); };
// un cuadro de equipo + el detalle por jugador, en el minuto pedido
function foto(f, d) {
  const eq = t => ({oro: t.totalGold, kills: t.totalKills, torres: t.towers, inhib: t.inhibitors, barones: t.barons, dragones: t.dragons});
  const o = {estado: f.gameState, azul: eq(f.blueTeam), rojo: eq(f.redTeam)};
  const ps = (d && d.participants) || [], lado = (a, b) => ps.filter(p => p.participantId >= a && p.participantId <= b);
  const sum = (xs, k) => xs.reduce((s, p) => s + (+p[k] || 0), 0);
  if (ps.length >= 10) for (const [k, xs] of [['azul', lado(1, 5)], ['rojo', lado(6, 10)]]) {
    o[k].nivel = sum(xs, 'level') / 5; o[k].cs = sum(xs, 'creepScore'); o[k].wp = sum(xs, 'wardsPlaced'); o[k].wd = sum(xs, 'wardsDestroyed');
    o[k].items = xs.map(p => p.items || []);
  }
  return o;
}
async function juego(id) {
  const w0 = await j(FEED + 'window/' + id); if (!w0 || !w0.frames || !w0.frames.length) return null;
  const t0 = ts(w0.frames[0]), out = {id, meta: w0.gameMetadata, inicio: w0.frames[0].rfc460Timestamp, minutos: {}};
  for (const m of [10, 15, 20, 25]) {
    const t = iso(t0 + m * 60000), [w, d] = await Promise.all([j(FEED + 'window/' + id + '?startingTime=' + t), j(FEED + 'details/' + id + '?startingTime=' + t)]);
    const f = w && w.frames && w.frames[w.frames.length - 1], df = d && d.frames && d.frames[d.frames.length - 1];
    if (!f || ts(f) < t0 + (m - 1) * 60000) break;   // el juego ya había terminado
    out.minutos[m] = foto(f, df);
  }
  // el final: después del final el feed repite los últimos cuadros
  const wf = await j(FEED + 'window/' + id + '?startingTime=' + iso(t0 + 85 * 60000)), ff = wf && wf.frames && wf.frames[wf.frames.length - 1];
  if (!ff) return null;
  out.duracion = Math.round((ts(ff) - t0) / 1000); out.ganador = ganador(ff); out.terminado = ff.gameState === 'finished';
  return out;
}
(async () => {
  const lg = await j(API + 'getLeagues?hl=es-MX', true), ligas = ((lg && lg.data.leagues) || []).filter(l => LIGAS.includes(l.slug));
  console.log('ligas:', ligas.map(l => l.slug).join(', '), '| disponibles:', ((lg && lg.data.leagues) || []).map(l => l.slug).join(' '));
  const series = [], juegos = fs.createWriteStream(path.join(OUT, 'juegos.jsonl'));
  let nj = 0, descartadas = 0;
  for (const l of ligas) {
    let tok = null, evs = [];
    for (let n = 0; n < 40; n++) {
      const d = await j(API + 'getSchedule?hl=es-MX&leagueId=' + l.id + (tok ? '&pageToken=' + encodeURIComponent(tok) : ''), true);
      if (!d) break; const e = d.data.schedule.events || []; evs = evs.concat(e);
      tok = d.data.schedule.pages && d.data.schedule.pages.older; if (!tok || (e.length && e[0].startTime < DESDE)) break;
    }
    evs = evs.filter(e => e.match && e.state === 'completed' && e.startTime >= DESDE && e.match.teams.length === 2);
    console.log(l.slug + ':', evs.length, 'series');
    // de a varias series a la vez, sin saturar el feed
    for (let i = 0; i < evs.length; i += 4) {
      await Promise.all(evs.slice(i, i + 4).map(async e => {
        const [a, b] = e.match.teams, wa = (a.result || {}).gameWins || 0, wb = (b.result || {}).gameWins || 0;
        series.push({fecha: e.startTime, liga: l.slug, a: a.code, b: b.code, wa, wb});
        const det = await j(API + 'getEventDetails?hl=es-MX&id=' + e.match.id, true); if (!det) return;
        const T = det.data.event.match.teams, gs = det.data.event.match.games.filter(g => g.state === 'completed');
        const res = [];
        for (const g of gs) { const x = await juego(g.id); if (x) res.push(x); }
        // control: los ganadores por juego tienen que sumar el marcador de la serie; si no, la serie se descarta
        const cod = (x, lado) => { const tid = x.meta[lado + 'TeamMetadata'].esportsTeamId; return (T.find(t => t.id === tid) || {}).code; };
        const cuenta = {}; res.forEach(x => { const c = cod(x, x.ganador); cuenta[c] = (cuenta[c] || 0) + 1; });
        if ((cuenta[a.code] || 0) !== wa || (cuenta[b.code] || 0) !== wb) { descartadas++; return; }
        res.forEach(x => { x.fecha = e.startTime; x.liga = l.slug; x.azul = cod(x, 'blue'); x.rojo = cod(x, 'red'); juegos.write(JSON.stringify(x) + '\n'); nj++; });
      }));
      if (i % 40 === 0) console.log('  ', l.slug, i, '/', evs.length, '· juegos:', nj);
    }
  }
  juegos.end();
  fs.writeFileSync(path.join(OUT, 'series.json'), JSON.stringify(series));
  console.log('LISTO · juegos:', nj, '· series:', series.length, '· series descartadas por no cuadrar:', descartadas);
})();
