// El overlay sobre video real de la transmisión, con los datos reales de lolesports (corre en la acción «Probar con video real»).
// Uso: node pruebas/real.js video.webm → una línea por segundo con lo que leyó y lo que mostró, y un resumen.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..'), VIDEO = process.argv[2];
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1500, height: 900}});
  await ctx.route(/www\.twitch\.tv/, r => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('.webm')) {
      const buf = fs.readFileSync(VIDEO), rg = /bytes=(\d+)-(\d*)/.exec(r.request().headers()['range'] || '');
      // de a pedazos de 4 MB (un video largo entero no pasa por el protocolo del navegador)
      const a = rg ? +rg[1] : 0, z = Math.min(rg && rg[2] ? +rg[2] : buf.length - 1, a + 4e6 - 1, buf.length - 1);
      return r.fulfill({status: 206, contentType: 'video/webm', headers: {'accept-ranges': 'bytes', 'content-range': 'bytes ' + a + '-' + z + '/' + buf.length}, body: buf.slice(a, z + 1)});
    }
    r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body style="margin:0;background:#000"><video id="v" src="/video.webm" muted style="position:absolute;left:100px;top:60px;width:1280px;height:720px"></video></body>'});
  });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('error de página:', e.message));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await p.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  const dur = await p.evaluate(() => document.getElementById('v').duration);
  const n = {t: 0, reloj: 0, visible: 0, cards: 0, ctlOk: 0, ctlMal: 0, cambios: 0}, partidos = {}, series = {}; let ultId = '', ultCtl = '';
  for (;;) {
    await p.waitForTimeout(1000);
    const e = await p.evaluate(() => {
      const sh = document.getElementById('rp-overlay-host').shadowRoot, w = sh.getElementById('w'), AS = window.__rpAS || {}, d = AS.diag || {}, v = document.getElementById('v');
      const cs = getComputedStyle(w), vis = cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.1 && !w.classList.contains('oculto');
      const cx = sh.getElementById('cardsx');
      return {ct: v.currentTime, ended: v.ended, reloj: d.reloj, zona: d.zona, visto: AS.visto ? Date.now() - AS.visto : null, id: AS.id ? AS.id.codes.join('-') + ' J' + AS.id.juego : '', estado: d.estado || '',
        siglas: (d.siglas || []).map(s => (s[0] || {}).code + ':' + ((s[0] || {}).s || 0).toFixed(2)).join(' '), mk: d.marcador ? JSON.stringify({k: d.marcador.kills, o: d.marcador.gold}) : '', serie: d.serie || '', control: d.control || '', gtMostrado: (window.RiftEngine && RiftEngine.state && RiftEngine.state.game) ? Math.round(RiftEngine.state.game.gt) : null,
        vis, chico: w.classList.contains('chico'), cards: cx ? cx.innerText.replace(/\s+/g, ' ').slice(0, 40) : '', body: sh.getElementById('body').innerText.replace(/\s+/g, ' ').slice(0, 50)};
    });
    n.t++; if (e.visto != null && e.visto < 1500) n.reloj++; if (e.vis) n.visible++; if (e.cards) n.cards++; if (e.id) partidos[e.id] = (partidos[e.id] || 0) + 1; if (e.serie) series[e.serie] = (series[e.serie] || 0) + 1;
    // controles (cada ~10 s el overlay compara las kills del HUD con las del feed en el minuto que muestra) y cambios de partido
    if (e.control && e.control !== ultCtl) { ultCtl = e.control; if (/✓/.test(e.control)) n.ctlOk++; else if (/✗/.test(e.control)) n.ctlMal++; }
    if (e.id && ultId && e.id !== ultId) n.cambios++; if (e.id) ultId = e.id;
    console.log([Math.round(e.ct), 'reloj=' + e.reloj, 'z=' + e.zona, 'hace=' + (e.visto == null ? '-' : Math.round(e.visto / 1000)), e.id || '·', e.serie ? 'serie=' + e.serie : '', e.siglas, e.mk, e.vis ? (e.chico ? 'PASTILLA' : 'VISIBLE') : 'oculto', e.cards ? 'paneles: ' + e.cards : '', '| ' + e.body].join(' '));
    if (process.env.RP_IMG && n.t % 45 === 0) { const jpg = await p.screenshot({type: 'jpeg', quality: 35, clip: {x: 100, y: 60, width: 1280, height: 720}}); console.log('IMG s' + String(n.t).padStart(3, '0') + '.jpg ' + jpg.toString('base64')); }
    if (e.ended || e.ct >= dur - 0.5) break;
  }
  console.log('RESUMEN segundos=' + n.t + ' reloj_leido=' + n.reloj + ' visible=' + n.visible + ' con_paneles=' + n.cards + ' partidos=' + JSON.stringify(partidos) + ' serie_en_pantalla=' + JSON.stringify(series) + ' controles_ok=' + n.ctlOk + ' controles_mal=' + n.ctlMal + ' cambios_de_partido=' + n.cambios);
  await b.close();
})();
