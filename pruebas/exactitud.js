// Exactitud del reconocimiento con datos REALES del Mundial: para los últimos juegos (y el que está en vivo), en varios minutos,
// se le pasa al motor lo que mostraría el HUD (siglas, kills, oro y la serie) y se mira si elige el juego correcto.
// También sin siglas legibles. Se comparan versiones del motor: MOTORES='engine.js,/tmp/engine_antes.js' node pruebas/exactitud.js
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z', API = 'https://esports-api.lolesports.com/persisted/gw/', FEED = 'https://feed.lolesports.com/livestats/v1/';
(async () => {
  const b = await chromium.launch();
  const motores = (process.env.MOTORES || 'engine.js').split(',');
  let casos = null;
  for (const m of motores) {
    const p = await b.newPage();
    await p.route(/www\.twitch\.tv/, r => r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body></body>'}));
    await p.goto('https://www.twitch.tv/videos/1');
    await p.addScriptTag({content: fs.readFileSync(path.isAbsolute(m) ? m : path.join(__dirname, '..', m), 'utf8')});
    // los casos (una sola vez): los últimos juegos del Mundial con feed, en los minutos 2, 7, 14 y 24
    if (!casos) casos = await p.evaluate(async ([KEY, API, FEED]) => {
      const j = async u => { try { const r = await fetch(u, {headers: {'x-api-key': KEY}}); return r.status === 200 ? r.json() : null; } catch (e) { return null; } };
      const iso = t => new Date(Math.floor(t / 10000) * 10000).toISOString();
      const ms = (await RiftEngine.loadMatches()).filter(x => x.state !== 'unstarted' && x.teams.every(t => t.code)).slice(-7);
      const out = [];
      for (const m of ms) {
        const ev = (await j(API + 'getEventDetails?hl=es-MX&id=' + m.id)).data.event, gs = ev.match.games;
        let wa = 0, wb = 0;
        for (const [k, g] of gs.entries()) {
          if (g.state === 'unstarted') continue;
          const w0 = await j(FEED + 'window/' + g.id); if (!w0 || !w0.frames || !w0.frames.length) continue;
          const ini = Date.parse(w0.frames[0].rfc460Timestamp), lado = id => (ev.match.teams.find(t => t.id === id) || {}).code;
          const az = lado(w0.gameMetadata.blueTeamMetadata.esportsTeamId), ro = lado(w0.gameMetadata.redTeamMetadata.esportsTeamId);
          for (const gt of [120, 420, 840, 1440]) {
            if (g.state === 'inProgress' && ini + gt * 1000 > Date.now() - 60000) continue;
            const w = await j(FEED + 'window/' + g.id + '?startingTime=' + iso(ini + gt * 1000)), f = w && w.frames && w.frames[w.frames.length - 1];
            if (!f || f.gameState === 'finished') continue;
            const vAz = ev.match.teams[0].code === az ? wa : wb, vRo = ev.match.teams[0].code === az ? wb : wa;
            out.push({partido: az + ' vs ' + ro, juego: k + 1, gameId: g.id, vivo: g.state === 'inProgress', gt, tags: [az, ro], kills: [f.blueTeam.totalKills, f.redTeam.totalKills],
              gold: [Math.round(f.blueTeam.totalGold / 100) / 10, Math.round(f.redTeam.totalGold / 100) / 10], serie: [vAz, vRo]});
          }
          // quién ganó ese juego (para la serie del juego siguiente)
          const wf = await j(FEED + 'window/' + g.id + '?startingTime=' + iso(ini + 3600e3)); const ff = wf && wf.frames && wf.frames[wf.frames.length - 1];
          if (ff && g.state === 'completed') { const sc = x => x.inhibitors * 3 + x.towers, azGana = sc(ff.blueTeam) >= sc(ff.redTeam); if ((azGana ? az : ro) === ev.match.teams[0].code) wa++; else wb++; }
        }
      }
      return out;
    }, [KEY, API, FEED]);
    const res = await p.evaluate(async casos => {
      const r = [];
      for (const c of casos) for (const variante of ['siglas', 'sin siglas']) {
        const o = {gt: c.gt, vivo: c.vivo, tags: variante === 'siglas' ? c.tags : ['', ''], kills: c.kills, gold: c.gold, juego: c.serie[0] + c.serie[1] + 1};
        let id = null; try { id = await RiftEngine.identify(o); } catch (e) {}
        const dio = !id ? 'nada' : id.sinSiglas ? 'no muestra nada (sin siglas)' : id.pendiente ? 'espera ' + id.codes.join('-') + ' J' + id.juego : id.codes.join(' vs ') + ' J' + id.juego;
        r.push({caso: c.partido + ' J' + c.juego + (c.vivo ? ' (vivo)' : '') + ' min ' + Math.round(c.gt / 60) + ' · ' + variante, ok: !!(id && id.gameId === c.gameId), equipos: !!(id && id.codes && id.codes.slice().sort().join() === c.tags.slice().sort().join()),
          // lo grave es mostrar OTROS equipos; no mostrar nada sin siglas es lo correcto
          otros: !!(id && id.codes && !id.pendiente && id.codes.slice().sort().join() !== c.tags.slice().sort().join()), dio});
      }
      return r;
    }, casos);
    const bien = res.filter(x => x.ok).length, eq = res.filter(x => x.equipos).length, otros = res.filter(x => x.otros).length;
    console.log('\n=== MOTOR', m, '· juego correcto', bien + '/' + res.length, '· equipos correctos', eq + '/' + res.length, '· OTROS EQUIPOS en pantalla', otros + '/' + res.length);
    res.forEach(x => console.log((x.ok ? '  ✓ ' : x.otros ? '  ✗ ' : '  · ') + x.caso + ' → ' + x.dio));
    await p.close();
  }
  await b.close();
})();
