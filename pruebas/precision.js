// Precisión pública del modelo en el Mundial actual: para cada juego terminado, el motor rehace el juego (igual que en vivo)
// y se guarda su probabilidad a los minutos 10, 15 y 20 y quién ganó. Imprime PRECISION_JSON {...} para precision.json.
// Corre en GitHub Actions (acción «Precisión pública») o en cualquier lado con salida a internet.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z', API = 'https://esports-api.lolesports.com/persisted/gw/', FEED = 'https://feed.lolesports.com/livestats/v1/';
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.route(/www\.twitch\.tv/, r => r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body></body>'}));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.addScriptTag({content: fs.readFileSync(path.join(__dirname, '..', 'engine.js'), 'utf8')});
  const anio = process.env.ANIO || String(new Date().getUTCFullYear());
  const juegos = await p.evaluate(async ([KEY, API, FEED, anio]) => {
    const j = async u => { try { const r = await fetch(u, {headers: {'x-api-key': KEY}}); return r.status === 200 ? r.json() : null; } catch (e) { return null; } };
    const iso = t => new Date(Math.floor(t / 10000) * 10000).toISOString();
    const ms = (await RiftEngine.loadMatches()).filter(x => x.state === 'completed' && String(x.start).slice(0, 4) === anio && x.teams.every(t => t.code));
    const out = [];
    for (const m of ms) {
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
        out.push({fecha: m.start.slice(0, 10), fase: m.block || '', partido: m.id, juego: k + 1, azul: az, rojo: ro, gana: gana === 'blue' ? az : ro, p10: pEn(10), p15: pEn(15), p20: pEn(20)});
      }
    }
    return out;
  }, [KEY, API, FEED, anio]);
  const res = {actualizado: new Date().toISOString(), torneo: 'Mundial ' + anio, juegos};
  console.log('juegos medidos:', juegos.length);
  console.log('PRECISION_JSON ' + JSON.stringify(res));
  await b.close();
})();
