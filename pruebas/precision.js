// Precisión pública del modelo en el Mundial actual: para cada juego terminado, el motor rehace el juego (igual que en vivo)
// y se guarda su probabilidad antes del juego y a los minutos 10, 15 y 20, y quién ganó. Imprime PRECISION_JSON {...} para datos/precision.json.
// La fuerza de los equipos es la de RiftEngine.elo con los resultados ANTERIORES a cada partido (nada del futuro); al final,
// con todos los resultados, queda la fuerza de hoy: con SALIDA_FUERZA=datos/fuerza.json se guarda para el motor en vivo.
// Corre en GitHub Actions (acción «Precisión pública») o en cualquier lado con salida a internet.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z', API = 'https://esports-api.lolesports.com/persisted/gw/', FEED = 'https://feed.lolesports.com/livestats/v1/';
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.route(/www\.twitch\.tv/, r => r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body></body>'}));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.addScriptTag({content: 'window.RP_SIN_FUERZA = 1;'});  // sin datos/fuerza.json (es la de hoy: sabría resultados futuros)
  await p.addScriptTag({content: fs.readFileSync(path.join(__dirname, '..', 'engine.js'), 'utf8')});
  const anio = process.env.ANIO || String(new Date().getUTCFullYear());
  const medido = await p.evaluate(async ([KEY, API, FEED, anio, MODO]) => {
    const j = async u => { try { const r = await fetch(u, {headers: {'x-api-key': KEY}}); return r.status === 200 ? r.json() : null; } catch (e) { return null; } };
    const iso = t => new Date(Math.floor(t / 10000) * 10000).toISOString();
    const ms = (await RiftEngine.loadMatches()).filter(x => x.state === 'completed' && String(x.start).slice(0, 4) === anio && x.teams.every(t => t.code))
      .sort((x, y) => (x.start < y.start ? -1 : 1));
    // todos los resultados de 2025–26 de las ligas del Elo (los mismos que usa la app)
    const E = RiftEngine.elo, ids = E.LIGAS.join(',');
    let evs = [], tok = null;
    for (let n = 0; n < 60; n++) {
      const d = await j(API + 'getSchedule?hl=es-MX&leagueId=' + ids + (tok ? '&pageToken=' + encodeURIComponent(tok) : '')); if (!d) break;
      const e = d.data.schedule.events || []; evs = e.concat(evs); tok = d.data.schedule.pages && d.data.schedule.pages.older;
      if (!tok || !e.length || e[0].startTime < '2025-01-01') break;
    }
    const todos = evs.filter(e => e.type === 'match' && e.match && e.startTime >= '2025-01-01').sort((x, y) => (x.startTime < y.startTime ? -1 : 1));
    const F = E.nuevo(); E.regiones(F, todos); let ip = 0;
    const avanzar = hasta => { while (ip < todos.length && todos[ip].startTime < hasta) { if (todos[ip].state === 'completed') E.paso(F, todos[ip]); ip++; } };
    // MODO=mundial: para comparar, la fuerza vieja del motor (un Elo solo con el Mundial), también sin resultados futuros
    const mundialHasta = hasta => {
      const W = {__: 0};  // nunca vacía: si no, el motor caería en su Elo del Mundial con todos los resultados (los del futuro también)
      todos.filter(e => e.league && e.league.slug === 'worlds' && e.state === 'completed' && e.startTime >= anio && e.startTime < hasta).forEach(e => {
        const a = e.match.teams[0], b = e.match.teams[1]; if (!a.code || !b.code) return;
        const ea = W[a.code] || 1500, eb = W[b.code] || 1500, wa = (a.result || {}).gameWins || 0, wb = (b.result || {}).gameWins || 0; if (wa === wb) return;
        const x = 1 / (1 + Math.pow(10, (eb - ea) / 400)), k = 24 * Math.max(1, Math.abs(wa - wb)) / (wa + wb > 1 ? 1.5 : 1), r = wa > wb ? 1 : 0;
        W[a.code] = ea + k * (r - x); W[b.code] = eb - k * (r - x);
      });
      return W;
    };
    const out = [];
    for (const m of ms) {
      avanzar(m.start);
      if (MODO === 'mundial') RiftEngine.setFuerza(mundialHasta(m.start)); else if (F.n > 50) RiftEngine.setFuerza(E.tabla(F));
      const d = await j(API + 'getEventDetails?hl=es-MX&id=' + m.id); if (!d) continue;
      const ev = d.data.event;
      for (const [k, g] of ev.match.games.entries()) {
        if (g.state !== 'completed') continue;
        const w0 = await j(FEED + 'window/' + g.id); if (!w0 || !w0.frames || !w0.frames.length) continue;
        const lado = id => (ev.match.teams.find(t => t.id === id) || {}).code, az = lado(w0.gameMetadata.blueTeamMetadata.esportsTeamId), ro = lado(w0.gameMetadata.redTeamMetadata.esportsTeamId);
        // quién ganó: el último cuadro (inhibidores y torres; si empatan, el oro)
        const ini = Date.parse(w0.frames[0].rfc460Timestamp);
        let fin = null; for (const h of [70, 55, 45, 38, 32]) { const w = await j(FEED + 'window/' + g.id + '?startingTime=' + iso(ini + h * 60000)); if (w && w.frames && w.frames.length) { fin = w.frames[w.frames.length - 1]; if (fin.gameState === 'finished') break; } }
        if (!fin) continue;
        const sc = x => x.inhibitors * 3 + x.towers, gana = sc(fin.blueTeam) !== sc(fin.redTeam) ? (sc(fin.blueTeam) > sc(fin.redTeam) ? 'blue' : 'red') : (fin.blueTeam.totalGold >= fin.redTeam.totalGold ? 'blue' : 'red');
        // la probabilidad del motor, rehaciendo el juego hasta el min 20 (las muestras quedan cada 10 s)
        try { await RiftEngine.replay(m.id, k + 1, 20.2, 1); } catch (e) { continue; }
        await new Promise(r => setTimeout(r, 300));
        const sm = (RiftEngine.state.game && RiftEngine.state.game.samples) || [], pEn = min => { let x = null; sm.forEach(s => { if (s.gt <= min * 60 + 5) x = s; }); return x && Math.abs(x.gt - min * 60) <= 30 ? Math.round(x.p * 1000) / 1000 : null; };
        const pre = RiftEngine.state.game && RiftEngine.state.game.pre, p0 = pre && pre.elo ? Math.round(pre.p * 1000) / 1000 : null;
        out.push({fecha: m.start.slice(0, 10), fase: m.block || '', partido: m.id, juego: k + 1, azul: az, rojo: ro, gana: gana === 'blue' ? az : ro, p0, p10: pEn(10), p15: pEn(15), p20: pEn(20)});
      }
    }
    avanzar('9999');
    return {out, fuerza: {actualizado: new Date().toISOString(), series: F.n, elo: E.tabla(F), region: F.reg, ajuste: F.off}};
  }, [KEY, API, FEED, anio, process.env.MODO || 'elo']);
  const juegos = medido.out, fuerza = medido.fuerza;
  const res = {actualizado: new Date().toISOString(), torneo: 'Mundial ' + anio, fuerza: 'Elo de RiftPulse con los resultados anteriores a cada partido', juegos};
  console.log('fuerza de los equipos:', fuerza.series, 'series ·', Object.keys(fuerza.elo).length, 'equipos');
  if (process.env.SALIDA_FUERZA && fuerza.series > 500) fs.writeFileSync(process.env.SALIDA_FUERZA, JSON.stringify(fuerza) + '\n');
  console.log('juegos medidos:', juegos.length);
  console.log('PRECISION_JSON ' + JSON.stringify(res));
  // con SALIDA=datos/precision.json la guarda (la acción programada la sube sola); nunca pisa datos buenos con menos juegos
  if (process.env.SALIDA) {
    let antes = 0; try { antes = JSON.parse(fs.readFileSync(process.env.SALIDA, 'utf8')).juegos.length; } catch (e) {}
    if (juegos.length >= antes && juegos.length) fs.writeFileSync(process.env.SALIDA, JSON.stringify(res) + '\n'); else console.log('no se guarda: ' + juegos.length + ' juegos contra ' + antes);
  }
  await b.close();
})();
