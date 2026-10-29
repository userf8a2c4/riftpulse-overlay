// Sondeo con datos REALES (no usa simuladores): qué trae el feed de lolesports y qué dice el motor sobre un juego real del Mundial.
// Corre en GitHub Actions (Acciones → «Sondeo del feed real» → Run workflow) o en cualquier lado con salida a internet: node pruebas/sondeo.js
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const ENG = fs.readFileSync(path.join(__dirname, '..', 'engine.js'), 'utf8');
const KEY = (ENG.match(/KEY = '([^']+)'/) || [])[1], WORLDS = (ENG.match(/WORLDS = '([^']+)'/) || [])[1];
const API = 'https://esports-api.lolesports.com/persisted/gw/', FEED = 'https://feed.lolesports.com/livestats/v1/';
const j = async (u, h) => { const r = await fetch(u, {headers: h || {}}); if (!r.ok) throw new Error(r.status + ' ' + u); return r.status === 204 ? null : r.json(); };
const iso = t => { const d = new Date(Math.floor(t / 10000) * 10000); return d.toISOString().replace(/\.\d+Z$/, '.000Z'); };
(async () => {
  const out = {};
  const sch = await j(API + 'getSchedule?hl=es-MX&leagueId=' + WORLDS, {'x-api-key': KEY});
  const ev = sch.data.schedule.events.filter(e => e.match);
  out.calendario = ev.slice(-12).map(e => [e.startTime, e.state, e.blockName, e.match.teams.map(t => t.code + ' ' + ((t.result || {}).gameWins ?? '')).join(' vs '), e.match.id]);
  const hecho = ev.filter(e => e.state === 'completed').pop(), vivo = ev.find(e => e.state === 'inProgress');
  out.vivo = vivo ? vivo.match.teams.map(t => t.code).join(' vs ') : null;
  const det = await j(API + 'getEventDetails?hl=es-MX&id=' + hecho.match.id, {'x-api-key': KEY});
  const juegos = det.data.event.match.games.filter(g => g.state === 'completed');
  out.partido = {id: hecho.match.id, equipos: hecho.match.teams.map(t => t.code), juegos: juegos.map(g => g.number + ':' + g.id)};
  const g = juegos[juegos.length - 1];
  const w0 = await j(FEED + 'window/' + g.id), t0 = Date.parse(w0.frames[0].rfc460Timestamp);
  const t15 = iso(t0 + 15 * 60e3);
  const w15 = await j(FEED + 'window/' + g.id + '?startingTime=' + t15), d15 = await j(FEED + 'details/' + g.id + '?startingTime=' + t15);
  const p = d15 && d15.frames && d15.frames[d15.frames.length - 1].participants[0];
  out.feed = {frameVentana: Object.keys(w15.frames[0].blueTeam), participanteDetalle: p ? Object.keys(p) : null, ejemplo: p ? {level: p.level, items: p.items, wardsPlaced: p.wardsPlaced, wardsDestroyed: p.wardsDestroyed} : null};
  // el motor real sobre ese juego real, en el minuto 22
  const b = await chromium.launch(), pg = await (await b.newContext()).newPage();
  pg.on('pageerror', e => (out.errores = out.errores || []).push(e.message));
  await pg.goto('https://userf8a2c4.github.io/riftpulse-overlay/control.html'); await pg.waitForTimeout(3000);
  await pg.evaluate(([m, n]) => RiftEngine.replay(m, n, 22, 1), [hecho.match.id, g.number]); await pg.waitForTimeout(12000);
  out.motor = await pg.evaluate(() => { const s = RiftEngine.state, gm = s.game || {};
    return {partido: s.match && s.match.blue.code + ' vs ' + s.match.red.code, gt: Math.round(gm.gt), p: gm.pBlue, muestras: (gm.samples || []).length,
      historia: RiftEngine.historia(s).map(x => x.text), cambio: RiftEngine.cambio(s), mirar: RiftEngine.mirar(s), jugadores: gm.jugadores, giros: gm.swings, impacto: gm.impact, colores: RiftEngine.colores(s.match.blue.code, s.match.red.code)}; });
  await b.close();
  console.log('=== SONDEO ===\n' + JSON.stringify(out, null, 1));
})().catch(e => { console.log('FALLÓ: ' + e.stack); process.exit(1); });
