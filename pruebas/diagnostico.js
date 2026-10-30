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
      const id = await RiftEngine.identify(Object.assign({vivo: false}, o));
      const ms = await RiftEngine.loadMatches();
      return {id: id && [id].concat(id.alts || []).map(x => x.codes.join('-') + ' J' + x.juego + ' score=' + x.score.toFixed(2) + ' kd=' + x.kd), partidos: ms.filter(m => m.teams.some(t => o.tags.includes(t.code))).map(m => m.teams.map(t => t.code).join('-') + ' ' + m.state + ' ' + m.start)};
    }, o);
    console.log('LECTURA', JSON.stringify(o)); console.log('  candidatos:', JSON.stringify(r.id, null, 1)); console.log('  partidos con esos equipos:', JSON.stringify(r.partidos));
  }
  await b.close();
})();
