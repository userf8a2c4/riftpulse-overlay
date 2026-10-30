// Diagnóstico del reconocimiento con los datos reales de lolesports: le pasa al motor lo que se leyó del HUD y muestra
// el puntaje de cada candidato. Uso: LECTURAS='[{"gt":1205,"tags":["CFO","KC"],"kills":[4,3],"gold":[38,33],"juego":2}]' node pruebas/diagnostico.js
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.route(/www\.twitch\.tv/, r => r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body></body>'}));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.addScriptTag({content: fs.readFileSync(path.join(__dirname, '..', 'engine.js'), 'utf8')});
  for (const o of JSON.parse(process.env.LECTURAS || '[]')) {
    const r = await p.evaluate(async o => {
      let id = await RiftEngine.identify(Object.assign({vivo: false}, o)); if (id && (id.sinSiglas || id.pendiente)) id = null;
      const ms = await RiftEngine.loadMatches();
      return {id: id && [id].concat(id.alts || []).map(x => x.codes.join('-') + ' J' + x.juego + ' score=' + x.score.toFixed(2) + ' kd=' + x.kd), partidos: ms.filter(m => m.teams.some(t => o.tags.includes(t.code))).map(m => m.teams.map(t => t.code).join('-') + ' ' + m.state + ' ' + m.start)};
    }, o);
    console.log('LECTURA', JSON.stringify(o)); console.log('  candidatos:', JSON.stringify(r.id, null, 1)); console.log('  partidos con esos equipos:', JSON.stringify(r.partidos));
  }
  // los juegos de un partido: cuándo empieza su feed, el estado de cada minuto y en qué minuto del feed cuadra mejor lo leído
  if (process.env.PARTIDO) {
    const [codA, codB] = process.env.PARTIDO.split('-'), L = JSON.parse(process.env.LECTURAS || '[]')[0] || {};
    const out = await p.evaluate(async ([a, bb, o]) => {
      const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z', API = 'https://esports-api.lolesports.com/persisted/gw/', FEED = 'https://feed.lolesports.com/livestats/v1/';
      const j = async u => { const r = await fetch(u, {headers: {'x-api-key': KEY}}); return r.status === 200 ? r.json() : null; };
      const iso = t => new Date(Math.floor(t / 10000) * 10000).toISOString();
      const ms = (await RiftEngine.loadMatches()).filter(m => m.teams.some(t => t.code === a) && m.teams.some(t => t.code === bb));
      const res = [];
      for (const m of ms) {
        const ev = (await j(API + 'getEventDetails?hl=es-MX&id=' + m.id)).data.event;
        for (const [k, g] of ev.match.games.entries()) {
          const w0 = await j(FEED + 'window/' + g.id); if (!w0) { res.push({juego: k + 1, estado: g.state, feed: 'sin datos'}); continue; }
          const ini = Date.parse(w0.frames[0].rfc460Timestamp), lado = id => (ev.match.teams.find(t => t.id === id) || {}).code;
          const r = {juego: k + 1, estado: g.state, azul: lado(w0.gameMetadata.blueTeamMetadata.esportsTeamId), rojo: lado(w0.gameMetadata.redTeamMetadata.esportsTeamId), inicioFeed: new Date(ini).toISOString(), primerEstado: w0.frames[0].gameState, minutos: []};
          for (let gt = 0; gt <= 2400; gt += 60) {
            const w = await j(FEED + 'window/' + g.id + '?startingTime=' + iso(ini + gt * 1000)); const f = w && w.frames && w.frames[0];
            if (!f) continue;
            r.minutos.push(gt / 60 + "'" + ' ' + f.gameState + ' k ' + f.blueTeam.totalKills + '-' + f.redTeam.totalKills + ' oro ' + (f.blueTeam.totalGold / 1000).toFixed(1) + '-' + (f.redTeam.totalGold / 1000).toFixed(1));
          }
          res.push(r);
        }
      }
      return res;
    }, [codA, codB, L]);
    console.log('PARTIDO', process.env.PARTIDO, JSON.stringify(out, null, 1));
  }
  await b.close();
})();
