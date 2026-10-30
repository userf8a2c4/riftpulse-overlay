// Imágenes promocionales de la Chrome Web Store (docs/chrome-web-store/promo-440x280.png y promo-1400x560.png): node pruebas/promo.js
// Fondo grafito, el logo, la frase y la barra de probabilidad (azul a la izquierda, rojo a la derecha; datos de ejemplo).
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
process.env.RP_FUENTES = '1';
const {montar, RAIZ, BASE} = require('./mocks');
const OUT = path.join(RAIZ, 'docs', 'chrome-web-store');
const logo = fs.readFileSync(path.join(RAIZ, 'logo.svg'), 'utf8');
const captura = 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, '1-overlay.png')).toString('base64');
const css = `<link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;800&family=Inter+Tight:wght@500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{background:#0C0E12;color:#F2F4F7;font-family:'Inter Tight',system-ui,sans-serif;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(70% 90% at 15% 20%,rgba(34,211,238,.16),transparent 60%),radial-gradient(60% 80% at 95% 100%,rgba(61,139,255,.18),transparent 60%),radial-gradient(50% 70% at 100% 0%,rgba(255,70,85,.14),transparent 60%),#0C0E12}
.marca{display:flex;align-items:center;gap:14px}.marca svg{display:block}.rp{font:800 30px 'Saira Condensed';letter-spacing:5px}
h1{font:800 'Saira Condensed';line-height:1.02}.slo{color:#22D3EE;font-weight:700}
.bar{display:flex;align-items:center;gap:12px;background:rgba(20,23,29,.92);border:1px solid rgba(220,226,236,.14);border-radius:14px;padding:12px 16px}
.code{font:800 22px 'Saira Condensed';padding:4px 10px;border-radius:7px;color:#fff}.a{background:#3D8BFF}.b{background:#FF4655}
.pct{font:800 34px 'Saira Condensed';font-variant-numeric:tabular-nums}.pct small{font-size:.5em;opacity:.7}.m{color:#9AA3B2}
.meter{height:8px;border-radius:99px;background:#FF4655;overflow:hidden;flex:1}.meter i{display:block;height:8px;width:72%;background:#3D8BFF;border-right:2px solid #14171D}</style>`;
const barra = '<div class="bar"><span class="code a">GEN</span><span class="pct">72<small>%</small></span><div class="meter"><i></i></div><span class="pct m">28<small>%</small></span><span class="code b">T1</span></div>';
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext(); await montar(ctx);
  const p = await ctx.newPage();
  await p.goto(BASE + 'index.html');
  // marquesina 1400×560
  await p.setViewportSize({width: 1400, height: 560});
  await p.setContent(css + `<div class="bg"></div><div style="position:absolute;left:80px;top:70px;width:600px">
    <div class="marca">${logo.replace('<svg', '<svg width="64" height="64"')}<span class="rp">RIFTPULSE</span></div>
    <h1 style="font-size:66px;margin-top:34px">Tu segunda pantalla<br>del Mundial</h1>
    <div class="slo" style="font-size:28px;margin-top:16px">El Mundial, jugada a jugada</div>
    <div style="font-size:20px;color:#C9D0DB;margin-top:22px;line-height:1.45">Quién va ganando, en vivo, sobre el video de Twitch y lolesports.<br>Sincronizado solo con el minuto que estás viendo.</div></div>
    <div style="position:absolute;right:60px;top:60px;width:640px;height:440px;border-radius:18px;overflow:hidden;border:1px solid rgba(220,226,236,.16);box-shadow:0 24px 70px rgba(0,0,0,.6)">
      <img src="${captura}" style="position:absolute;left:-6px;top:-14px;width:820px"></div>`);
  await p.waitForTimeout(1500);
  await p.screenshot({path: path.join(OUT, 'promo-1400x560.png')});
  // pequeña 440×280
  await p.setViewportSize({width: 440, height: 280});
  await p.setContent(css + `<div class="bg"></div><div style="position:absolute;inset:26px 26px">
    <div class="marca">${logo.replace('<svg', '<svg width="40" height="40"')}<span class="rp" style="font-size:22px;letter-spacing:4px">RIFTPULSE</span></div>
    <h1 style="font-size:34px;margin-top:16px">Tu segunda pantalla<br>del Mundial</h1>
    <div class="slo" style="font-size:17px;margin-top:6px">El Mundial, jugada a jugada</div>
    <div style="margin-top:16px;transform:scale(.78);transform-origin:0 0;width:500px">${barra}</div></div>`);
  await p.waitForTimeout(1200);
  await p.screenshot({path: path.join(OUT, 'promo-440x280.png')});
  await b.close(); console.log('Promocionales en docs/chrome-web-store/');
})();
