// Simulador del feed de LoL Esports, de Data Dragon, de Twitch y de la página publicada, para las pruebas.
// Partidos: IG vs LYON (3 juegos, ya jugado) y señuelos: T1 vs MKOI (en vivo) y T1 vs KOI (de ayer).
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..'), GEN = path.join(__dirname, '.gen');
const T0 = Date.parse('2026-10-28T20:00:00Z');
const BASE = 'https://userf8a2c4.github.io/riftpulse-overlay/';
const pm = pre => [0, 1, 2, 3, 4].map(i => ({participantId: i + 1, summonerName: 'X ' + pre + i, championId: pre + i, role: ['top', 'jungle', 'mid', 'bottom', 'support'][i]}));
const meta = (b, r, cb, cr) => ({blueTeamMetadata: {esportsTeamId: b, participantMetadata: pm(cb)}, redTeamMetadata: {esportsTeamId: r, participantMetadata: pm(cr)}});
// T1 vs KOI (de ayer) tiene las mismas kills que IG vs LYON J2: un señuelo que «cuadra» por kills y oro en el minuto del HUD
const KILLS = {g1: [5, 1], g2: [2, 3], g3: [8, 4], m1: [0, 0], k1: [2, 3], v1: [6, 2], v2: [3, 4], v3: [0, 0]};
const AHORA = Date.now();
const GAMES = {g1: {start: T0, meta: meta('tIG', 'tLY', 'A', 'B')}, g2: {start: T0 + 3600e3, meta: meta('tIG', 'tLY', 'C', 'D')}, g3: {start: T0 + 7200e3, meta: meta('tLY', 'tIG', 'E', 'F')},
  m1: {start: AHORA - 20 * 60e3, meta: meta('tT1', 'tMK', 'E', 'F')}, k1: {start: T0 - 86400e3, meta: meta('tT1', 'tKO', 'F', 'E')},
  // con {serieViva: true}: TES vs BLG en vivo, al mejor de 3 (el juego 2 en curso; con st.serie = 3, el 3)
  v1: {start: AHORA - 90 * 60e3, meta: meta('tTE', 'tBL', 'A', 'B')}, v2: {start: AHORA - 35 * 60e3, meta: meta('tBL', 'tTE', 'C', 'D')}, v3: {start: AHORA - 2 * 60e3, meta: meta('tTE', 'tBL', 'A', 'B')}};
// la serie en vivo según cómo va (st.serie: 2 = juego 2 en curso; 3 = el 2 terminado y el 3 en curso, con el feed publicado)
const serieViva = st => ev('SV', 'inProgress', AHORA - 95 * 60e3, tm('tTE', 'TES', 1), tm('tBL', 'BLG', st.serie >= 3 ? 1 : 0),
  [{id: 'v1', state: 'completed'}, {id: 'v2', state: st.serie >= 3 ? 'completed' : 'inProgress'}, {id: 'v3', state: st.serie >= 3 && st.detalleAlDia ? 'inProgress' : 'unstarted'}]);
// el juego 1 de IG vs LYON termina a los 25:00 (después el feed repite el último cuadro, ya «finished»)
const DUR = {g1: 1500};
// el juego 2 tiene una pausa de 5 min (como KC vs CFO en el Mundial 2026): del segundo 600 al 900 del feed el juego no avanza
// y el feed sigue mandando cuadros con el oro quieto, sin marcarla como pausa. El reloj del HUD no la cuenta
// con {pausaVivo: true}, el juego en vivo (T1 vs MKOI) también tuvo una pausa de 10 min (del 300 al 900 del feed) que ya terminó
const PAUSA = {g2: [600, 900]}, PAUSA_VIVO = Object.assign({m1: [300, 900]}, PAUSA);
let P = PAUSA;
const enJuego = (t, id) => { const gs = GAMES[id], p = P[id]; let s = (t - gs.start) / 1000; if (p) s = s < p[0] ? s : s < p[1] ? p[0] : s - (p[1] - p[0]); return gs.start + s * 1000; };
const frame = (tf, id) => {
  let t = enJuego(tf, id); const gs0 = GAMES[id], fin = DUR[id] != null && (t - gs0.start) / 1000 >= DUR[id];
  if (fin) t = gs0.start + DUR[id] * 1000;
  const gs = GAMES[id], gt = (t - gs.start) / 1000, f = Math.min(1, Math.max(0, (gt - 200) / 818)), k = KILLS[id];
  const tm = i => ({totalGold: Math.round(2500 + gt * 26.5 + (i ? 60 : 0)), totalKills: Math.round(k[i] * f), towers: 0, inhibitors: 0, barons: 0, dragons: [], participants: []});
  return {rfc460Timestamp: new Date(tf).toISOString(), gameState: fin ? 'finished' : 'in_game', blueTeam: tm(0), redTeam: tm(1)};
};
// detalles por jugador (oro, nivel, KDA, daño): números fijos que crecen con el minuto
const DSH = [0.24, 0.16, 0.3, 0.22, 0.08];
const detalle = (tf, id) => {
  const t = enJuego(tf, id), gs = GAMES[id], gt = Math.max(0, (t - gs.start) / 1000), k = KILLS[id], f = Math.min(1, Math.max(0, (gt - 200) / 818));
  const participants = [];
  for (let i = 0; i < 10; i++) { const r = i % 5, lado = i < 5 ? 0 : 1;
    participants.push({participantId: i + 1, level: Math.min(18, 1 + Math.floor(gt / 95)), kills: Math.round(k[lado] * f * [0.2, 0.2, 0.3, 0.3, 0][r]), deaths: Math.round(k[1 - lado] * f * 0.2), assists: Math.round(k[lado] * f * 0.5),
      creepScore: Math.round(gt / 60 * [7.5, 5.5, 8, 8.5, 1][r]), wardsPlaced: Math.round(gt / 60 * [0.4, 0.8, 0.5, 0.4, 1.6][r] * (lado ? 0.85 : 1)), wardsDestroyed: Math.round(gt / 60 * [0.1, 0.3, 0.1, 0.1, 0.4][r]),
      items: [1055, 3006].concat(gt > 600 + r * 60 + lado * 90 ? [3031] : []).concat(gt > 1100 + r * 60 ? [3089] : []), totalGoldEarned: Math.round(500 + gt * [6.4, 5.2, 6.8, 7, 4][r] + (lado ? 0 : 40) * r), championDamageShare: DSH[(r + lado) % 5], killParticipation: 0.5 + r * 0.05}); }
  return {rfc460Timestamp: new Date(tf).toISOString(), participants};
};
const ev = (id, st, start, a, b, games, bloque) => ({type: 'match', startTime: new Date(start).toISOString(), blockName: bloque || 'Fase Suiza', state: st, league: {name: 'Worlds', slug: 'worlds'}, match: {id, strategy: {count: games.length}, teams: [a, b], games}});
const tm = (id, code, w) => ({id, code, name: code, result: {gameWins: w}});
const EVS = {
  MLI: ev('MLI', 'completed', T0, tm('tIG', 'IG', 2), tm('tLY', 'LYON', 1), ['g1', 'g2', 'g3'].map(id => ({id, state: 'completed'}))),
  TM: ev('TM', 'inProgress', AHORA - 20 * 60e3, tm('tT1', 'T1', 0), tm('tMK', 'MKOI', 0), [{id: 'm1', state: 'inProgress'}]),
  TK: ev('TK', 'completed', T0 - 86400e3, tm('tT1', 'T1', 1), tm('tKO', 'KOI', 0), [{id: 'k1', state: 'completed'}]),
  PX: ev('PX', 'unstarted', AHORA + 2 * 3600e3, tm('tG2', 'G2', 0), tm('tHL', 'HLE', 0), [{id: 'p1', state: 'unstarted'}, {id: 'p2', state: 'unstarted'}, {id: 'p3', state: 'unstarted'}])};
const TIPOS = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webm': 'video/webm', '.zip': 'application/zip', '.ttf': 'font/ttf'};
const HDR = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*'};

// estado: {modo: 'ok' | 'caido' | 'congelado', cong: ms}
async function montar(ctx, o) {
  o = o || {}; const st = {modo: 'ok', cong: 0, video: o.video || 'vod.webm', detalles: o.detalles !== false, serie: 2, detalleAlDia: false};
  // {sinVivo: true}: no hay ningún partido en curso (T1 vs MKOI no está)
  const evs = () => { const e = o.serieViva ? Object.assign({SV: serieViva(st)}, EVS) : Object.assign({}, EVS); if (o.sinVivo) delete e.TM; return e; };
  P = o.pausaVivo ? PAUSA_VIVO : PAUSA;
  // el navegador de las pruebas, en español (RiftPulse arranca en el idioma del navegador)
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'language', {get: () => 'es-AR'}); } catch (e) {} });
  await ctx.route(/lolesports\.com/, r => {
    if (st.modo === 'caido') return r.fulfill({status: 500, body: 'x'});
    const u = new URL(r.request().url()); let data = {};
    if (/getSchedule/.test(u.pathname)) data = {schedule: {pages: {}, events: Object.values(evs())}};
    else if (/getEventDetails/.test(u.pathname)) { const e = evs()[u.searchParams.get('id')]; if (!e) return r.fulfill({status: 404, headers: HDR, body: '{}'}); data = {event: {league: {name: 'Worlds'}, match: e.match}}; }
    else if (/getLive/.test(u.pathname)) data = {schedule: {events: o.sinVivo ? [] : [Object.assign({}, EVS.TM, {id: 'TM'})]}};
    else if (/\/window\//.test(u.pathname)) {
      const id = u.pathname.split('/').pop(), gs = GAMES[id], s = u.searchParams.get('startingTime');
      if (!gs || (id === 'v3' && st.serie < 3)) return r.fulfill({status: 204, headers: HDR, body: ''});  // el juego 3 todavía sin feed
      let t = s ? Date.parse(s) : gs.start; if (st.modo === 'congelado' && s) t = Math.min(t, st.cong);
      return r.fulfill({contentType: 'application/json', headers: HDR, body: JSON.stringify({gameMetadata: gs.meta, frames: s ? [frame(t, id), frame(t + 5000, id), frame(t + 9000, id)] : [frame(gs.start, id)]})});
    } else if (/\/details\//.test(u.pathname)) {
      const id = u.pathname.split('/').pop(), gs = GAMES[id], s = u.searchParams.get('startingTime');
      if (!gs || !s || !st.detalles) return r.fulfill({status: 204, headers: HDR, body: ''});
      let t = Date.parse(s); if (st.modo === 'congelado') t = Math.min(t, st.cong);
      return r.fulfill({contentType: 'application/json', headers: HDR, body: JSON.stringify({frames: [detalle(t, id), detalle(t + 5000, id)]})});
    }
    r.fulfill({contentType: 'application/json', headers: HDR, body: JSON.stringify({data})});
  });
  await ctx.route(/ddragon/, r => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('versions.json')) return r.fulfill({contentType: 'application/json', headers: HDR, body: '["15.1.1"]'});
    if (u.pathname.endsWith('item.json')) return r.fulfill({contentType: 'application/json', headers: HDR, body: JSON.stringify({data: {
      1055: {name: 'Espada de Doran', gold: {total: 450}, tags: ['Damage']}, 3006: {name: 'Grebas del berserker', gold: {total: 1100}, tags: ['Boots']},
      3031: {name: 'Filo del infinito', gold: {total: 3450}, tags: ['Damage']}, 3089: {name: 'Sombrero mortal de Rabadon', gold: {total: 3600}, tags: ['SpellDamage']}}})});
    const f = path.join(GEN, 'iconos', path.basename(u.pathname));
    if (!fs.existsSync(f)) return r.fulfill({status: 404, headers: HDR, body: ''});
    r.fulfill({contentType: 'image/png', headers: HDR, body: fs.readFileSync(f)});
  });
  // las tipografías reales solo para las capturas (RP_FUENTES=1); en las pruebas, sin red externa
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => process.env.RP_FUENTES ? r.continue() : r.fulfill({status: 404, body: ''}));
  await ctx.route(/userf8a2c4\.github\.io/, r => {
    const f = decodeURIComponent(new URL(r.request().url()).pathname.replace('/riftpulse-overlay/', '')) || 'index.html', fp = path.join(RAIZ, f);
    if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return r.fulfill({status: 404, body: ''});
    r.fulfill({contentType: TIPOS[path.extname(fp)] || 'text/plain', body: fs.readFileSync(fp)});
  });
  await ctx.route(/www\.twitch\.tv/, r => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('.webm')) {  // con rangos (206), como un servidor de video real: así se puede saltar dentro del video
      const buf = fs.readFileSync(path.join(GEN, st.video)), rg = /bytes=(\d+)-(\d*)/.exec(r.request().headers()['range'] || '');
      if (!rg) return r.fulfill({status: 200, contentType: 'video/webm', headers: {'accept-ranges': 'bytes'}, body: buf});
      const a = +rg[1], z = rg[2] ? Math.min(+rg[2], buf.length - 1) : buf.length - 1;
      return r.fulfill({status: 206, contentType: 'video/webm', headers: {'accept-ranges': 'bytes', 'content-range': 'bytes ' + a + '-' + z + '/' + buf.length}, body: buf.slice(a, z + 1)});
    }
    r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body style="margin:0;background:#000"><video id="v" src="/video.webm" muted style="position:absolute;left:100px;top:60px;width:1280px;height:720px"></video></body>'});
  });
  return st;
}
// resultado de una prueba: imprime y devuelve si pasó
function chequear(nombre, ok, detalle) { console.log((ok ? '  ✓ ' : '  ✗ ') + nombre + (detalle ? ' — ' + detalle : '')); return !!ok; }
module.exports = {montar, chequear, BASE, RAIZ, GEN, T0, EVS};
