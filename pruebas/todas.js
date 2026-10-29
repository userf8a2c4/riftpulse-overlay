// Corre todas las pruebas de RiftPulse: node pruebas/todas.js
// Requiere: Node, Playwright (con Chromium), Python 3 con Pillow y ffmpeg (para generar los videos).
const {execFileSync} = require('child_process'), fs = require('fs'), path = require('path');
const GEN = path.join(__dirname, '.gen');
if (!fs.existsSync(path.join(GEN, 'vod.webm'))) { console.log('Generando los videos de prueba…'); execFileSync('python3', [path.join(__dirname, 'generar.py')], {stdio: 'inherit'}); }
const PRUEBAS = [['Sincronía con el video', 't_sincronia'], ['Fallos del feed, control y mesa', 't_feed'], ['Extensión real (desde el ZIP)', 't_extension'], ['Legibilidad', 't_legibilidad'], ['Simulador de «Cómo funciona»', 't_simulador']]
  .concat(fs.existsSync(path.join(__dirname, 't_contraste.js')) ? [['Contraste de colores de equipo', 't_contraste']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_director.js')) ? [['Director automático', 't_director']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_magia.js')) ? [['Overlay que lee la sala', 't_magia']] : []);
(async () => {
  const solo = process.argv[2]; let mal = [];
  for (const [nombre, f] of PRUEBAS) {
    if (solo && f !== solo) continue;
    console.log('\n▶ ' + nombre); const t0 = Date.now();
    let ok = false; try { ok = await require('./' + f)(); } catch (e) { console.log('  ✗ error: ' + e.message); }
    console.log('  ' + (ok ? 'OK' : 'FALLÓ') + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)'); if (!ok) mal.push(nombre);
  }
  console.log('\n' + (mal.length ? '✗ Fallaron: ' + mal.join(', ') : '✓ Todas las pruebas pasaron')); process.exit(mal.length ? 1 : 0);
})();
