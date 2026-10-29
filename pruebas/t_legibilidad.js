// Ningún texto por debajo de 12 px en las páginas (las etiquetas dentro de gráficos SVG se escalan y no cuentan).
const {chromium} = require('playwright');
const {montar, chequear, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1400, height: 900}}); await montar(ctx); let ok = true;
  const scan = () => { const out = {}; document.querySelectorAll('body *').forEach(e => { if (e.closest('svg')) return; const t = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).length; if (!t) return;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; const cs = getComputedStyle(e), fz = parseFloat(cs.fontSize);
    if (fz < 11.95 && cs.visibility !== 'hidden') { const k = (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : e.tagName) + ' ' + fz + 'px'; out[k] = (out[k] || 0) + 1; } }); return out; };
  for (const [url, vistas] of [['app.html', ['inicio', 'partido', 'copa', 'hist', 'pickem', 'mando']], ['analista.html', [null]], ['control.html', [null]], ['index.html', [null]], ['como-funciona.html', [null]]]) {
    const p = await ctx.newPage(); p.on('pageerror', () => {}); await p.goto(BASE + url); await p.waitForTimeout(2500);
    for (const v of vistas) { if (v) { await p.evaluate(v => setVista(v), v); await p.waitForTimeout(800); }
      const r = await p.evaluate(scan); ok = chequear('sin texto de menos de 12 px · ' + url + (v ? ' › ' + v : ''), !Object.keys(r).length, Object.keys(r).length ? JSON.stringify(r) : '') && ok; }
    await p.close();
  }
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
