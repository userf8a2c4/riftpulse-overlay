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
  // ---- en vivo: qué tan frescos llegan los datos y qué muestra el motor (lo corre la acción programada durante los partidos) ----
  if (vivo) {
    try {
      const dv = await j(API + 'getEventDetails?hl=es-MX&id=' + vivo.match.id, {'x-api-key': KEY}), jv = dv.data.event.match.games.find(g => g.state === 'inProgress');
      if (jv) {
        const muestras = [];
        for (let i = 0; i < 4; i++) {
          const wv = await j(FEED + 'window/' + jv.id), f = wv && wv.frames && wv.frames[wv.frames.length - 1];
          if (f) muestras.push({atrasoSeg: Math.round((Date.now() - Date.parse(f.rfc460Timestamp)) / 1000), estado: f.gameState, oro: [f.blueTeam.totalGold, f.redTeam.totalGold], kills: [f.blueTeam.totalKills, f.redTeam.totalKills]});
          await new Promise(r => setTimeout(r, 10000));
        }
        out.feedVivo = {juego: jv.number, muestras};
      } else out.feedVivo = 'serie en curso, pero sin juego en vivo ahora (draft o entre juegos)';
    } catch (e) { out.feedVivo = 'error: ' + e.message; }
  }
  if (process.env.SOLO_VIVO === 'true' && !vivo) { console.log('=== SONDEO ===\n' + JSON.stringify({calendario: out.calendario.slice(0, 4), vivo: null}, null, 1)); return; }
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
  // las páginas salen de este repositorio (no de la publicada): así se prueba el código recién subido
  const b = await chromium.launch(), cx = await b.newContext();
  await cx.route(/userf8a2c4\.github\.io\/riftpulse-overlay\//, r => { const f = path.join(__dirname, '..', decodeURIComponent(new URL(r.request().url()).pathname.replace('/riftpulse-overlay/', '')) || 'index.html');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.continue();
    r.fulfill({contentType: {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'}[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f)}); });
  const pg = await cx.newPage();
  if (vivo) {  // el motor siguiendo el partido en vivo, como en la app (con el retraso por defecto)
    const pv = await cx.newPage(); await pv.goto('https://userf8a2c4.github.io/riftpulse-overlay/control.html'); await pv.waitForTimeout(25000);
    out.motorVivo = await pv.evaluate(() => { const s = RiftEngine.state, g = s.game || {}; return {partido: s.match && s.match.blue.code + ' vs ' + s.match.red.code, juego: s.match && s.match.gameNo, gt: Math.round(g.gt || 0), p: g.pBlue, feed: s.feed, retraso: s.delay,
      historia: RiftEngine.historia(s).map(x => x.text), mirar: RiftEngine.mirar(s), jugadores: g.jugadores, eventos: (g.events || []).map(e => e.txt)}; });
    await pv.close();
    if (process.env.SOLO_VIVO === 'true') { await b.close(); console.log('=== SONDEO ===\n' + JSON.stringify(out, null, 1)); return; }
  }
  pg.on('pageerror', e => (out.errores = out.errores || []).push(e.message));
  await pg.goto('https://userf8a2c4.github.io/riftpulse-overlay/control.html'); await pg.waitForTimeout(3000);
  await pg.evaluate(([m, n]) => RiftEngine.replay(m, n, 22, 1), [hecho.match.id, g.number]); await pg.waitForTimeout(12000);
  out.motor = await pg.evaluate(() => { const s = RiftEngine.state, gm = s.game || {};
    return {partido: s.match && s.match.blue.code + ' vs ' + s.match.red.code, gt: Math.round(gm.gt), p: gm.pBlue, muestras: (gm.samples || []).length,
      historia: RiftEngine.historia(s).map(x => x.text), cambio: RiftEngine.cambio(s), mirar: RiftEngine.mirar(s), jugadores: gm.jugadores, giros: gm.swings, impacto: gm.impact, colores: RiftEngine.colores(s.match.blue.code, s.match.red.code)}; });
  // muchos juegos reales: los últimos partidos terminados, en varios minutos de cada juego
  const raros = [], textos = [];
  const malo = t => /undefined|NaN|null|\[object|Infinity/.test(t);
  for (const e of ev.filter(x => x.state === 'completed').slice(-8)) {
    let gs = [];
    try { gs = (await j(API + 'getEventDetails?hl=es-MX&id=' + e.match.id, {'x-api-key': KEY})).data.event.match.games.filter(x => x.state === 'completed'); } catch (x) { continue; }
    for (const gm of gs) for (const min of [8, 16, 26, 60]) {
      await pg.evaluate(([m, n, mi]) => RiftEngine.replay(m, n, mi, 1), [e.match.id, gm.number, min]); await pg.waitForTimeout(min === 60 ? 9000 : 6000);
      const r = await pg.evaluate(() => { const s = RiftEngine.state, g = s.game || {}; const t = [];
        RiftEngine.historia(s).forEach(x => t.push(x.text)); RiftEngine.talk(s).forEach(x => t.push(x.text)); RiftEngine.recapLines(s).forEach(x => t.push(x.replace(/<[^>]+>/g, '')));
        const mi = RiftEngine.mirar(s), cb = RiftEngine.cambio(s);
        return {partido: s.match && s.match.blue.code + '-' + s.match.red.code, gt: Math.round(g.gt || 0), p: g.pBlue, fin: !!g.ended, t, mirar: mi && mi.obj + (mi.vivo ? ' (ya está)' : ' en ' + Math.round(mi.en)) + (mi.mejor ? ' · mejor ' + mi.code : ''),
          cambio: cb && (cb.dp + ' pts · ' + cb.items.map(x => x.code + ' ' + x.txt).join(', ')), jug: g.jugadores && [g.jugadores.blue.items, g.jugadores.red.items, g.jugadores.blue.wp, g.jugadores.red.wp]}; });
      const id = r.partido + ' J' + gm.number + ' min ' + min;
      if (r.p == null || isNaN(r.p)) raros.push(id + ': sin probabilidad');
      r.t.forEach(x => { if (malo(x)) raros.push(id + ': ' + x); });
      if (min === 16 || min === 60) textos.push({id, gt: r.gt, p: r.p && Math.round(r.p * 100), fin: r.fin, historia: r.t.slice(0, 5), mirar: r.mirar, cambio: r.cambio, jug: r.jug});
    }
  }
  out.masivo = {revisados: textos.length, raros, textos};
  await b.close();
  console.log('=== SONDEO ===\n' + JSON.stringify(out, null, 1));
})().catch(e => { console.log('FALLÓ: ' + e.stack); process.exit(1); });
