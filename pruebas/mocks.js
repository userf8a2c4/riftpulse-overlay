// Simulador del feed de LoL Esports, de Data Dragon, de Twitch y de la página publicada, para las pruebas.
// Partidos: IG vs LYON (3 juegos, ya jugado) y señuelos: T1 vs MKOI (en vivo) y T1 vs KOI (de ayer).
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..'), GEN = path.join(__dirname, '.gen');
const T0 = Date.parse('2026-10-28T20:00:00Z');
const BASE = 'https://userf8a2c4.github.io/riftpulse-overlay/';
const pm = pre => [0, 1, 2, 3, 4].map(i => ({participantId: i + 1, summonerName: 'X ' + pre + i, championId: pre + i, role: ['top', 'jungle', 'mid', 'bottom', 'support'][i]}));
const meta = (b, r, cb, cr) => ({blueTeamMetadata: {esportsTeamId: b, participantMetadata: pm(cb)}, redTeamMetadata: {esportsTeamId: r, participantMetadata: pm(cr)}});
const KILLS = {g1: [5, 1], g2: [2, 3], g3: [8, 4], m1: [0, 0], k1: [1, 0]};
const AHORA = Date.now();
const GAMES = {g1: {start: T0, meta: meta('tIG', 'tLY', 'A', 'B')}, g2: {start: T0 + 3600e3, meta: meta('tIG', 'tLY', 'C', 'D')}, g3: {start: T0 + 7200e3, meta: meta('tLY', 'tIG', 'E', 'F')},
  m1: {start: AHORA - 20 * 60e3, meta: meta('tT1', 'tMK', 'E', 'F')}, k1: {start: T0 - 86400e3, meta: meta('tT1', 'tKO', 'F', 'E')}};
const frame = (t, id) => {
  const gs = GAMES[id], gt = (t - gs.start) / 1000, f = Math.min(1, Math.max(0, (gt - 200) / 818)), k = KILLS[id];
  const tm = i => ({totalGold: Math.round(2500 + gt * 26.5 + (i ? 60 : 0)), totalKills: Math.round(k[i] * f), towers: 0, inhibitors: 0, barons: 0, dragons: [], participants: []});
  return {rfc460Timestamp: new Date(t).toISOString(), gameState: 'in_game', blueTeam: tm(0), redTeam: tm(1)};
};
const ev = (id, st, start, a, b, games, bloque) => ({type: 'match', startTime: new Date(start).toISOString(), blockName: bloque || 'Fase Suiza', state: st, league: {name: 'Worlds', slug: 'worlds'}, match: {id, strategy: {count: games.length}, teams: [a, b], games}});
const tm = (id, code, w) => ({id, code, name: code, result: {gameWins: w}});
const EVS = {
  MLI: ev('MLI', 'completed', T0, tm('tIG', 'IG', 2), tm('tLY', 'LYON', 1), ['g1', 'g2', 'g3'].map(id => ({id, state: 'completed'}))),
  TM: ev('TM', 'inProgress', AHORA - 20 * 60e3, tm('tT1', 'T1', 0), tm('tMK', 'MKOI', 0), [{id: 'm1', state: 'inProgress'}]),
  TK: ev('TK', 'completed', T0 - 86400e3, tm('tT1', 'T1', 1), tm('tKO', 'KOI', 0), [{id: 'k1', state: 'completed'}])};
const TIPOS = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webm': 'video/webm', '.zip': 'application/zip', '.ttf': 'font/ttf'};
const HDR = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*'};

// estado: {modo: 'ok' | 'caido' | 'congelado', cong: ms}
async function montar(ctx, o) {
  o = o || {}; const st = {modo: 'ok', cong: 0, video: o.video || 'vod.webm'};
  await ctx.route(/lolesports\.com/, r => {
    if (st.modo === 'caido') return r.fulfill({status: 500, body: 'x'});
    const u = new URL(r.request().url()); let data = {};
    if (/getSchedule/.test(u.pathname)) data = {schedule: {pages: {}, events: Object.values(EVS)}};
    else if (/getEventDetails/.test(u.pathname)) { const e = EVS[u.searchParams.get('id')]; data = {event: {league: {name: 'Worlds'}, match: e.match}}; }
    else if (/getLive/.test(u.pathname)) data = {schedule: {events: [Object.assign({}, EVS.TM, {id: 'TM'})]}};
    else if (/\/window\//.test(u.pathname)) {
      const id = u.pathname.split('/').pop(), gs = GAMES[id], s = u.searchParams.get('startingTime');
      if (!gs) return r.fulfill({status: 204, headers: HDR, body: ''});
      let t = s ? Date.parse(s) : gs.start; if (st.modo === 'congelado' && s) t = Math.min(t, st.cong);
      return r.fulfill({contentType: 'application/json', headers: HDR, body: JSON.stringify({gameMetadata: gs.meta, frames: s ? [frame(t, id), frame(t + 5000, id), frame(t + 9000, id)] : [frame(gs.start, id)]})});
    } else if (/\/details\//.test(u.pathname)) return r.fulfill({status: 204, headers: HDR, body: ''});
    r.fulfill({contentType: 'application/json', headers: HDR, body: JSON.stringify({data})});
  });
  await ctx.route(/ddragon/, r => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('versions.json')) return r.fulfill({contentType: 'application/json', headers: HDR, body: '["15.1.1"]'});
    const f = path.join(GEN, 'iconos', path.basename(u.pathname));
    if (!fs.existsSync(f)) return r.fulfill({status: 404, headers: HDR, body: ''});
    r.fulfill({contentType: 'image/png', headers: HDR, body: fs.readFileSync(f)});
  });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.fulfill({status: 404, body: ''}));
  await ctx.route(/userf8a2c4\.github\.io/, r => {
    const f = decodeURIComponent(new URL(r.request().url()).pathname.replace('/riftpulse-overlay/', '')) || 'index.html', fp = path.join(RAIZ, f);
    if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return r.fulfill({status: 404, body: ''});
    r.fulfill({contentType: TIPOS[path.extname(fp)] || 'text/plain', body: fs.readFileSync(fp)});
  });
  await ctx.route(/www\.twitch\.tv/, r => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('.webm')) return r.fulfill({contentType: 'video/webm', body: fs.readFileSync(path.join(GEN, st.video))});
    r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body style="margin:0;background:#000"><video id="v" src="/video.webm" muted style="position:absolute;left:100px;top:60px;width:1280px;height:720px"></video></body>'});
  });
  return st;
}
// resultado de una prueba: imprime y devuelve si pasó
function chequear(nombre, ok, detalle) { console.log((ok ? '  ✓ ' : '  ✗ ') + nombre + (detalle ? ' — ' + detalle : '')); return !!ok; }
module.exports = {montar, chequear, BASE, RAIZ, GEN, T0, EVS};
