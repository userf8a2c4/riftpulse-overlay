// Corre todas las pruebas de RiftPulse: node pruebas/todas.js
// Requiere: Node, Playwright (con Chromium), Python 3 con Pillow y ffmpeg (para generar los videos).
const {execFileSync} = require('child_process'), fs = require('fs'), path = require('path');
const GEN = path.join(__dirname, '.gen');
if (!fs.existsSync(path.join(GEN, 'vivoclip.webm'))) { console.log('Generando los videos de prueba…'); execFileSync('python3', [path.join(__dirname, 'generar.py')], {stdio: 'inherit'}); }
const PRUEBAS = [['Sincronía con el video', 't_sincronia'], ['Fallos del feed, control y mesa', 't_feed'], ['Extensión real (desde el ZIP)', 't_extension'], ['Legibilidad', 't_legibilidad'], ['Simulador de «Cómo funciona»', 't_simulador']]
  .concat(fs.existsSync(path.join(__dirname, 't_contraste.js')) ? [['Contraste de colores de equipo', 't_contraste']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_director.js')) ? [['Director automático', 't_director']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_magia.js')) ? [['Overlay que lee la sala', 't_magia']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_pausa.js')) ? [['Pausas del juego', 't_pausa']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_serie.js')) ? [['En vivo: la serie que avanza y los clips', 't_serie']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_previa.js')) ? [['Previa del próximo partido', 't_previa']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_historia.js')) ? [['Información que cuenta la historia', 't_historia']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_app.js')) ? [['App para fans', 't_app']] : [])
  .concat(fs.existsSync(path.join(__dirname, 't_espectador.js')) ? [['Para el espectador', 't_espectador']] : []);
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
