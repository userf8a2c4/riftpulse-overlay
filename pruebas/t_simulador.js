// «Cómo funciona»: el simulador usa el mismo modelo del motor, y la página no se desborda en celular.
const {chromium} = require('playwright');
const {montar, chequear, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  for (const [w, h, n] of [[1400, 900, 'computadora'], [390, 844, 'celular']]) {
    const ctx = await b.newContext({viewport: {width: w, height: h}}); await montar(ctx);
    const p = await ctx.newPage(); await p.goto(BASE + 'como-funciona.html'); await p.waitForTimeout(800);
    await p.click('[data-p="temprano"]'); await p.waitForTimeout(300);
    const pb = await p.$eval('#pb', e => parseInt(e.textContent, 10)), ref = await p.evaluate(() => Math.round(RiftEngine.simular({min: 12, oro: 3500, kills: 4, torres: 2, dragones: 1}).p * 100));
    ok = chequear(n + ': el simulador da lo mismo que el motor', pb === ref, pb + '% = ' + ref + '%') && ok;
    ok = chequear(n + ': sin desborde horizontal', !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth))) && ok;
    await ctx.close();
  }
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
