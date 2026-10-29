// Contraste de los colores de equipo (WCAG): texto sobre la ficha del equipo, color del equipo sobre el grafito,
// texto del equipo sobre el grafito, y que los dos equipos de un partido siempre se distingan.
const path = require('path');
const {chequear} = require('./mocks');
module.exports = async function () {
  global.window = global; global.location = {search: ''}; global.localStorage = {_: {}, getItem(k) { return this._[k] || null; }, setItem(k, v) { this._[k] = v; }};
  global.fetch = () => Promise.reject(new Error('sin red')); const si = global.setInterval; global.setInterval = () => 0;
  delete require.cache[require.resolve(path.join(__dirname, '..', 'engine.js'))]; require(path.join(__dirname, '..', 'engine.js')); global.setInterval = si;
  const R = global.RiftEngine, G = '#0C0E12', ok0 = [];
  const PARES = [['T1', 'GEN'], ['T1', 'KT'], ['T1', '100'], ['G2', 'IG'], ['BLG', 'C9'], ['HLE', 'FNC'], ['FUR', 'FLY'], ['IG', 'LYON'], ['TES', 'JDG'], ['MKOI', 'AL'], ['XX', 'YY'], ['GEN', 'GX']];
  let ok = true;
  const hue = h => { const n = parseInt(h.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return {h: 0, s: 0}; let x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return {h: (x * 60 + 360) % 360, s: d / (1 - Math.abs(mx + mn - 1))}; };
  for (const [a, b] of PARES) {
    const c = R.colores(a, b), fallas = [];
    for (const [k, v] of [['a', c.a], ['b', c.b]]) {
      if (R.contraste(v.main, G) < 3) fallas.push(k + ': color sobre grafito ' + R.contraste(v.main, G).toFixed(1));
      if (R.contraste(v.txt, G) < 4.5) fallas.push(k + ': texto sobre grafito ' + R.contraste(v.txt, G).toFixed(1));
      if (R.contraste(v.ink, v.main) < 3) fallas.push(k + ': texto de la ficha ' + R.contraste(v.ink, v.main).toFixed(1));
    }
    const ha = hue(c.a.main), hb = hue(c.b.main), dh = Math.min(Math.abs(ha.h - hb.h), 360 - Math.abs(ha.h - hb.h));
    const distintos = (ha.s < 0.18) !== (hb.s < 0.18) || dh >= 40;
    if (!distintos) fallas.push('los dos se parecen (' + Math.round(dh) + '°)');
    ok = chequear(a + ' vs ' + b + ': ' + c.a.main + ' / ' + c.b.main + (c.ajustado ? ' (ajustado)' : ''), !fallas.length, fallas.join(', ')) && ok;
  }
  return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
