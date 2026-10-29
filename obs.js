/* RiftPulse — gráficos de transmisión para OBS (Browser Source).
   Página transparente. Autodetecta el partido de Worlds en vivo vía window.RiftEngine.
   Una sola base, varias piezas conmutables con ?view= :
     bar (lower-third, por defecto) · big (tarjeta grande) · alert (alerta de momentum)
     objectives (bug de objetivos) · keys (claves del momento)
     serie (probabilidad de la serie) · duelos (duelo por línea y jugador clave)
     remontada (aparece sola cuando un equipo pasa del 65 %) · recap (resumen al terminar el juego)
     cuadro (eliminatorias del Mundial en vivo: cuartos → semis → final)
     predicciones (picks de los integrantes del stream, cargados desde control.html, con aciertos automáticos)
   La vista "bar" además obedece al panel de control (control.html) en vivo por
   BroadcastChannel + localStorage (ambos dentro de OBS comparten navegador).
   Nota: el pronóstico previo (Elo) y "lo predijimos" requieren portar el Elo al motor;
   aquí todo es el modelo EN VIVO. */
(function () {
  'use strict';
  if (!window.RiftEngine) { console.warn('[RiftPulse] falta engine.js'); return; }
  var R = window.RiftEngine, Q = new URLSearchParams(location.search);
  var VIEW = (Q.get('view') || 'bar').toLowerCase();
  var SCALE = Math.max(0.6, Math.min(2.4, parseFloat(Q.get('scale') || '1') || 1));

  // ---------- config (vista bar): defaults <- URL <- control ----------
  var cfg = {
    modules: (Q.get('modules') || 'prob,pregame,momentum,timers,brand').split(',').map(function (s) { return s.trim(); }),
    pos: (Q.get('pos') === 'top' ? 'top' : 'bottom'),
    hidden: false,
    auto: {remontada: true, recap: true}  // piezas que aparecen solas (se apagan desde el control)
  };
  try { var sv = JSON.parse(localStorage.getItem('rp_ctrl') || 'null'); if (sv && VIEW === 'bar') { if (sv.modules) cfg.modules = sv.modules; if (sv.pos) cfg.pos = sv.pos; if (sv.hidden != null) cfg.hidden = sv.hidden; } if (sv && sv.auto) cfg.auto = sv.auto; } catch (e) {}
  function has(m) { return cfg.modules.indexOf(m) >= 0; }

  var S = SCALE;
  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rpog" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff"/><stop offset=".5" stop-color="#9ab0e6"/><stop offset="1" stop-color="#ff5a5f"/></linearGradient></defs><rect x="3" y="3" width="58" height="58" rx="16" fill="#0d1320" stroke="#2b3c62" stroke-width="2"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rpog)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="30" cy="17" r="3.4" fill="#fff"/></svg>';

  // ---------- estilos ----------
  var css = '\
  .rp-ovl{position:fixed;display:flex;flex-direction:column;gap:14px;padding:28px;pointer-events:none;font-size:' + (16 * S) + 'px;font-family:Inter,system-ui,sans-serif;color:#eef3fb}\
  .rp-ovl.bottom{left:0;right:0;bottom:0;align-items:center;justify-content:flex-end}\
  .rp-ovl.top{left:0;right:0;top:0;align-items:center}\
  .rp-ovl.tl{top:0;left:0;align-items:flex-start}\
  .rp-ovl.tc{top:0;left:0;right:0;align-items:center}\
  .rp-ovl.mid{inset:0;align-items:center;justify-content:center}\
  .rp-ovl.hide{display:none}\
  .logo{display:block}\
  .b{color:#6fb8ff}.r{color:#ff7a86}\
  /* superficie común: vidrio azul noche con filo dorado */\
  .rp-bar,.rp-big,.rp-keys,.rp-obj,.rp-card,.rp-ser,.rp-callout{position:relative;background:linear-gradient(180deg,rgba(16,30,62,.93),rgba(6,12,28,.96));\
    border:1px solid rgba(150,180,230,.22);border-radius:6px;box-shadow:0 18px 50px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.07)}\
  .rp-bar::after,.rp-big::after,.rp-keys::after,.rp-obj::after,.rp-card:not(.rp-pd)::after,.rp-ser::after{content:"";position:absolute;left:-1px;top:-1px;width:' + (90 * S) + 'px;height:2px;\
    background:linear-gradient(90deg,#f2c14e,rgba(242,193,78,0));border-radius:6px 0 0 0}\
  .rp-card .t,.rp-keys .t,.rp-big .hd .t{display:flex;align-items:center;gap:' + (9 * S) + 'px;font-family:Oswald,sans-serif;font-weight:600;font-size:' + (13 * S) + 'px;\
    letter-spacing:2.6px;text-transform:uppercase;color:#f2c14e;margin-bottom:' + (12 * S) + 'px}\
  .rp-card .t .logo,.rp-keys .t .logo{width:' + (22 * S) + 'px;height:' + (22 * S) + 'px}\
  .rp-card{padding:' + (16 * S) + 'px ' + (22 * S) + 'px;transition:opacity .45s,transform .45s}\
  .rp-card.off{opacity:0;transform:translateY(-10px)}\
  .rp-card .note{font-size:' + (11 * S) + 'px;color:#8fa0c2;margin-top:' + (10 * S) + 'px;letter-spacing:.2px}\
  /* barra (lower-third) */\
  .rp-bar{display:flex;align-items:stretch;padding:0;overflow:hidden}\
  .rp-brand{display:flex;align-items:center;gap:' + (10 * S) + 'px;flex:none;padding:' + (12 * S) + 'px ' + (18 * S) + 'px;\
    background:linear-gradient(90deg,rgba(242,193,78,.1),rgba(242,193,78,0));border-right:1px solid rgba(150,180,230,.18)}\
  .rp-brand .logo{width:' + (36 * S) + 'px;height:' + (36 * S) + 'px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.5))}\
  .rp-bn{font-family:Oswald,sans-serif;font-weight:700;font-size:' + (17 * S) + 'px;letter-spacing:3px;line-height:1;text-transform:uppercase}\
  .rp-bs{font-family:Oswald,sans-serif;font-size:' + (10.5 * S) + 'px;color:#f2c14e;font-weight:500;letter-spacing:1.6px;text-transform:uppercase;margin-top:' + (4 * S) + 'px}\
  .rp-core{display:flex;align-items:center;gap:' + (16 * S) + 'px;padding:' + (12 * S) + 'px ' + (20 * S) + 'px}\
  .rp-tc{font-family:Anton,Oswald,sans-serif;font-size:' + (32 * S) + 'px;letter-spacing:1.5px;line-height:1;text-shadow:0 3px 10px rgba(0,0,0,.6)}\
  .rp-tc.b{color:#6fb8ff}.rp-tc.r{color:#ff7a86}\
  .rp-pbar{position:relative;width:' + (400 * S) + 'px;height:' + (34 * S) + 'px;display:flex;font-family:Oswald,sans-serif;font-weight:700;font-size:' + (17 * S) + 'px;letter-spacing:.5px;\
    clip-path:polygon(' + (12 * S) + 'px 0,100% 0,calc(100% - ' + (12 * S) + 'px) 100%,0 100%);background:rgba(255,255,255,.06)}\
  .rp-pb{display:flex;align-items:center;padding:0 ' + (16 * S) + 'px;color:#04101f;background:linear-gradient(180deg,#7cc4ff,#2f7fe0);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .rp-pr{display:flex;align-items:center;justify-content:flex-end;padding:0 ' + (16 * S) + 'px;color:#fff;background:linear-gradient(180deg,#ff7684,#c93a52);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .rp-pb.lead{background:linear-gradient(180deg,#a3d6ff,#4aa3ff 45%,#2f7fe0);box-shadow:inset 0 0 18px rgba(255,255,255,.35)}\
  .rp-pr.lead{background:linear-gradient(180deg,#ffa0aa,#ff4d5e 45%,#c93a52);box-shadow:inset 0 0 18px rgba(255,255,255,.3)}\
  .rp-side{display:flex;align-items:center;gap:' + (18 * S) + 'px;flex:none;padding:0 ' + (20 * S) + 'px;border-left:1px solid rgba(150,180,230,.18);font-family:Oswald,sans-serif;font-variant-numeric:tabular-nums}\
  .rp-tm{display:flex;flex-direction:column;align-items:center;line-height:1.05}\
  .rp-tm .v{font-weight:700;font-size:' + (20 * S) + 'px}.rp-tm .k{font-size:' + (9.5 * S) + 'px;color:#8fa0c2;text-transform:uppercase;letter-spacing:1.6px}\
  .rp-gt{font-weight:700;font-size:' + (20 * S) + 'px;color:#dfe7f5;letter-spacing:.5px}\
  /* alerta de giro */\
  .rp-callout{display:flex;align-items:center;gap:' + (10 * S) + 'px;padding:' + (10 * S) + 'px ' + (20 * S) + 'px;border-color:rgba(242,193,78,.6);\
    font-family:Oswald,sans-serif;font-weight:600;font-size:' + (18 * S) + 'px;letter-spacing:1.2px;text-transform:uppercase;color:#f6e7c1;\
    clip-path:polygon(' + (10 * S) + 'px 0,100% 0,calc(100% - ' + (10 * S) + 'px) 100%,0 100%);opacity:0;transform:translateY(10px) scale(.98);transition:opacity .35s,transform .35s}\
  .rp-callout.show{opacity:1;transform:none}\
  .rp-callout .zap{color:#f2c14e;font-size:' + (20 * S) + 'px}\
  .rp-callout .cc{font-family:Anton,Oswald,sans-serif;font-weight:400;letter-spacing:1px}.rp-callout .cc.b{color:#6fb8ff}.rp-callout .cc.r{color:#ff7a86}\
  /* tarjeta grande */\
  .rp-big{padding:' + (18 * S) + 'px ' + (24 * S) + 'px;min-width:' + (340 * S) + 'px}\
  .rp-big .hd{display:flex;align-items:center;gap:' + (10 * S) + 'px}.rp-big .hd .logo{width:' + (24 * S) + 'px;height:' + (24 * S) + 'px}\
  .rp-big .hd .t{margin:0}\
  .rp-big .n{font-family:Anton,Oswald,sans-serif;font-size:' + (86 * S) + 'px;line-height:1;letter-spacing:1px;margin-top:' + (8 * S) + 'px}\
  .rp-big .who{font-family:Oswald,sans-serif;font-size:' + (15 * S) + 'px;letter-spacing:1.6px;text-transform:uppercase;color:#8fa0c2;margin:' + (4 * S) + 'px 0 ' + (14 * S) + 'px}\
  .rp-big .rp-pbar{width:100%}\
  /* claves del momento */\
  .rp-keys{padding:' + (16 * S) + 'px ' + (22 * S) + 'px;min-width:' + (340 * S) + 'px}\
  .rp-keys ul{list-style:none;margin:0;padding:0}\
  .rp-keys li{display:flex;align-items:center;gap:' + (12 * S) + 'px;font-size:' + (16 * S) + 'px;font-weight:600;padding:' + (8 * S) + 'px 0;border-top:1px solid rgba(150,180,230,.12)}\
  .rp-keys li:first-child{border-top:0}\
  .rp-keys .d{width:' + (9 * S) + 'px;height:' + (9 * S) + 'px;transform:rotate(45deg);flex:none}.rp-keys .d.b{background:#4aa3ff;box-shadow:0 0 8px #4aa3ff}.rp-keys .d.r{background:#ff4d5e;box-shadow:0 0 8px #ff4d5e}\
  .rp-keys li span:last-child{font-family:Oswald,sans-serif;letter-spacing:1.5px}\
  /* objetivos */\
  .rp-obj{display:flex;padding:0;overflow:hidden;font-family:Oswald,sans-serif;font-variant-numeric:tabular-nums}\
  .rp-obj .tm{display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;padding:' + (10 * S) + 'px ' + (18 * S) + 'px;border-left:1px solid rgba(150,180,230,.15)}\
  .rp-obj .tm:first-child{border-left:0;background:rgba(242,193,78,.08)}\
  .rp-obj .v{font-weight:700;font-size:' + (24 * S) + 'px}.rp-obj .k{font-size:' + (10 * S) + 'px;color:#8fa0c2;text-transform:uppercase;letter-spacing:1.8px}\
  /* serie */\
  .rp-ser{display:flex;align-items:stretch;padding:0;overflow:hidden;font-family:Oswald,sans-serif;font-variant-numeric:tabular-nums}\
  .rp-ser>.logo{width:' + (30 * S) + 'px;height:' + (30 * S) + 'px;align-self:center;margin:0 ' + (14 * S) + 'px 0 ' + (18 * S) + 'px}\
  .rp-ser .h{display:flex;flex-direction:column;justify-content:center;padding:' + (10 * S) + 'px ' + (18 * S) + 'px ' + (10 * S) + 'px 0;font-size:' + (11 * S) + 'px;color:#f2c14e;letter-spacing:2.4px;text-transform:uppercase;line-height:1.2}\
  .rp-ser .h b{display:block;font-family:Anton,Oswald,sans-serif;font-weight:400;color:#eef3fb;font-size:' + (24 * S) + 'px;letter-spacing:1.5px;margin-top:2px}\
  .rp-ser .if{display:flex;flex-direction:column;justify-content:center;line-height:1.1;padding:' + (10 * S) + 'px ' + (20 * S) + 'px;border-left:1px solid rgba(150,180,230,.15)}\
  .rp-ser .if .k{font-size:' + (10.5 * S) + 'px;color:#8fa0c2;letter-spacing:1.4px;text-transform:uppercase}.rp-ser .if .v{font-weight:700;font-size:' + (26 * S) + 'px}\
  /* duelos */\
  .rp-ln{border-collapse:collapse;font-variant-numeric:tabular-nums;font-family:Oswald,sans-serif;font-size:' + (17 * S) + 'px;letter-spacing:.6px}\
  .rp-ln td{padding:' + (6 * S) + 'px ' + (8 * S) + 'px;border-top:1px solid rgba(150,180,230,.12)}\
  .rp-ln tr:first-child td{border-top:0}\
  .rp-ln .rl{font-size:' + (10.5 * S) + 'px;color:#8fa0c2;text-transform:uppercase;letter-spacing:2px;width:' + (70 * S) + 'px}\
  .rp-ln .df{text-align:center;font-weight:700;min-width:' + (92 * S) + 'px}\
  .rp-ln .rt{text-align:right}\
  .rp-kp{margin-top:' + (10 * S) + 'px;padding:' + (8 * S) + 'px ' + (12 * S) + 'px;font-size:' + (14 * S) + 'px;color:#eef3fb;background:linear-gradient(90deg,rgba(242,193,78,.14),rgba(242,193,78,0));border-left:2px solid #f2c14e}\
  .rp-kp .g{font-family:Oswald,sans-serif;color:#f2c14e;font-weight:700;letter-spacing:1px;text-transform:uppercase}\
  /* para remontar */\
  .rp-cb{font-size:' + (17 * S) + 'px;line-height:1.45;max-width:' + (480 * S) + 'px}\
  .rp-cb .p{font-family:Anton,Oswald,sans-serif;font-size:1.35em;letter-spacing:1px}\
  /* resumen del juego */\
  .rp-rc{min-width:' + (560 * S) + 'px;max-width:' + (660 * S) + 'px;padding:' + (20 * S) + 'px ' + (26 * S) + 'px !important}\
  .rp-rc .ttl{font-family:Anton,Oswald,sans-serif;font-size:' + (56 * S) + 'px;line-height:1;letter-spacing:1.5px;text-transform:uppercase}\
  .rp-rc .sub{font-family:Oswald,sans-serif;font-size:' + (15 * S) + 'px;letter-spacing:2px;text-transform:uppercase;color:#8fa0c2;margin:' + (6 * S) + 'px 0 ' + (12 * S) + 'px}\
  .rp-rc svg{display:block;width:100%;height:' + (80 * S) + 'px;margin-bottom:' + (10 * S) + 'px}\
  /* cuadro de eliminatorias */\
  .rp-br{display:grid;grid-template-columns:repeat(3,' + (200 * S) + 'px);gap:' + (26 * S) + 'px;align-items:stretch}\
  .rp-br .col{display:flex;flex-direction:column}\
  .rp-br .h{font-family:Oswald,sans-serif;font-size:' + (12 * S) + 'px;letter-spacing:2.4px;text-transform:uppercase;color:#8fa0c2;margin-bottom:' + (8 * S) + 'px;padding-bottom:' + (6 * S) + 'px;border-bottom:1px solid rgba(242,193,78,.35)}\
  .rp-br .bd{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:' + (10 * S) + 'px}\
  .rp-br .m{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));border:1px solid rgba(150,180,230,.16);border-radius:4px;padding:' + (6 * S) + 'px ' + (10 * S) + 'px}\
  .rp-br .m.lv{border-color:rgba(255,77,94,.7);box-shadow:0 0 18px rgba(255,77,94,.28)}\
  .rp-br .tm{display:flex;align-items:center;gap:' + (9 * S) + 'px;font-family:Oswald,sans-serif;font-size:' + (17 * S) + 'px;letter-spacing:1px;padding:' + (3 * S) + 'px 0}\
  .rp-br .tm img{width:' + (20 * S) + 'px;height:' + (20 * S) + 'px;object-fit:contain}\
  .rp-br .tm b{font-weight:600}.rp-br .tm .w{margin-left:auto;font-weight:700}\
  .rp-br .tm.won .w{color:#3ddc97}.rp-br .tm.lost{opacity:.38}.rp-br .tm.tbd{color:#8fa0c2;font-size:' + (13 * S) + 'px;letter-spacing:.6px}\
  .rp-br .lvt{font-family:Oswald,sans-serif;font-size:' + (10.5 * S) + 'px;letter-spacing:1.6px;color:#ff7a86;margin-bottom:' + (3 * S) + 'px;text-transform:uppercase}\
  .rp-br .ch{text-align:center;font-family:Anton,Oswald,sans-serif;font-size:' + (28 * S) + 'px;letter-spacing:1.5px;color:#f2c14e;margin-top:' + (8 * S) + 'px}\
  /* predicciones del stream: gráfica de transmisión */\
  .rp-pd{position:relative;overflow:hidden;border-radius:6px;padding:0;border:1px solid rgba(150,180,230,.2);\
    background:radial-gradient(900px 420px at -5% -20%,rgba(74,163,255,.22),transparent 60%),radial-gradient(700px 380px at 105% -10%,rgba(242,193,78,.14),transparent 60%),\
      linear-gradient(180deg,#0b1834 0%,#081126 55%,#050a17 100%);box-shadow:0 30px 90px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08)}\
  .rp-pd::before{content:"";position:absolute;inset:0;pointer-events:none;background:\
    linear-gradient(115deg,transparent 0 58%,rgba(120,170,255,.08) 58% 59.5%,transparent 59.5% 63%,rgba(120,170,255,.05) 63% 63.8%,transparent 63.8%),\
    repeating-linear-gradient(90deg,rgba(255,255,255,.018) 0 1px,transparent 1px 64px)}\
  .rp-pd .hd{position:relative;display:flex;align-items:flex-end;justify-content:space-between;padding:' + (26 * S) + 'px ' + (34 * S) + 'px ' + (14 * S) + 'px}\
  .rp-pd .tt{font-family:Anton,"Oswald","Chakra Petch",sans-serif;font-size:' + (64 * S) + 'px;line-height:.95;letter-spacing:1.5px;text-transform:uppercase;\
    background:linear-gradient(180deg,#ffffff 0%,#dfe7f5 60%,#aab8d4 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 14px rgba(0,0,0,.5))}\
  .rp-pd .brand2{display:flex;align-items:center;gap:' + (12 * S) + 'px;text-align:right}\
  .rp-pd .brand2 .logo{width:' + (52 * S) + 'px;height:' + (52 * S) + 'px}\
  .rp-pd .brand2 b{display:block;font-family:Oswald,"Chakra Petch",sans-serif;font-size:' + (22 * S) + 'px;letter-spacing:3px;color:#fff;line-height:1}\
  .rp-pd .brand2 span{font-family:Oswald,sans-serif;font-size:' + (13 * S) + 'px;letter-spacing:2.5px;color:#f2c14e;text-transform:uppercase}\
  .rp-pd .rule{position:relative;height:2px;margin:0 ' + (34 * S) + 'px;background:linear-gradient(90deg,#f2c14e,rgba(242,193,78,.25) 55%,transparent)}\
  .rp-pd .gd{position:relative;display:grid;align-items:stretch;column-gap:' + (10 * S) + 'px;padding:' + (18 * S) + 'px ' + (34 * S) + 'px ' + (10 * S) + 'px}\
  .rp-pd .stg{display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:' + (8 * S) + 'px}\
  .rp-pd .stg .ph1{font-family:Oswald,sans-serif;font-weight:700;font-size:' + (30 * S) + 'px;text-transform:uppercase;letter-spacing:1px;line-height:1.05;color:#fff}\
  .rp-pd .stg .ph2{font-family:Oswald,sans-serif;font-weight:500;font-size:' + (17 * S) + 'px;text-transform:uppercase;letter-spacing:2px;color:#9fb0cf;margin-top:2px}\
  .rp-pd .stg .day{margin-top:' + (12 * S) + 'px;font-family:Oswald,sans-serif;font-weight:600;font-size:' + (15 * S) + 'px;letter-spacing:1.5px;text-transform:uppercase;color:#0b1220;\
    background:linear-gradient(90deg,#e9d7ad,#cdb27a);padding:' + (5 * S) + 'px ' + (12 * S) + 'px;clip-path:polygon(0 0,100% 0,94% 100%,0 100%)}\
  .rp-pd .mh{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-end}\
  .rp-pd .pic{position:relative;height:var(--ph);border-radius:4px 4px 0 0;overflow:hidden;background:linear-gradient(180deg,#1a2745,#0d1529);border:1px solid rgba(255,255,255,.1);border-bottom:0}\
  .rp-pd .pic img{width:100%;height:100%;object-fit:cover;display:block}\
  .rp-pd .pic::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(5,10,23,.55))}\
  .rp-pd .pic .ini{width:100%;height:100%;display:grid;place-items:center;font-family:Anton,"Oswald",sans-serif;font-size:calc(var(--ph) * .34);color:rgba(255,255,255,.92);letter-spacing:1px}\
  .rp-pd .nmp{font-family:Oswald,"Chakra Petch",sans-serif;font-weight:700;font-size:var(--nf);text-transform:uppercase;letter-spacing:1px;text-align:center;color:#0b1220;\
    background:linear-gradient(180deg,#efdfba,#cfb47d);padding:' + (4 * S) + 'px ' + (4 * S) + 'px;clip-path:polygon(0 0,100% 0,100% 72%,92% 100%,0 100%);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
  .rp-pd .rw{display:contents}\
  .rp-pd .mt{position:relative;display:flex;align-items:center;justify-content:center;gap:' + (12 * S) + 'px;height:var(--rh);border-top:1px solid rgba(160,190,240,.14)}\
  .rp-pd .tmb{display:flex;flex-direction:column;align-items:center;gap:2px;font-family:Oswald,sans-serif;font-weight:600;font-size:calc(var(--rh) * .17);letter-spacing:1px;color:#dfe7f5}\
  .rp-pd .tmb img{width:calc(var(--rh) * .5);height:calc(var(--rh) * .5);object-fit:contain;filter:drop-shadow(0 3px 8px rgba(0,0,0,.5))}\
  .rp-pd .mt .vs{font-family:Oswald,sans-serif;font-size:calc(var(--rh) * .16);color:#7f8fb0;letter-spacing:1px}\
  .rp-pd .mt.live::before{content:"";position:absolute;left:0;top:18%;bottom:18%;width:3px;border-radius:2px;background:#ff4d57;box-shadow:0 0 10px #ff4d57}\
  .rp-pd .mt .lv{position:absolute;left:10px;top:6px;font-family:Oswald,sans-serif;font-size:calc(var(--rh) * .13);letter-spacing:1.5px;color:#ff6b70;animation:rpblink 1.6s ease-in-out infinite}\
  @keyframes rpblink{50%{opacity:.4}}\
  .rp-pd .c{position:relative;height:var(--rh);display:grid;place-items:center;border-top:1px solid rgba(160,190,240,.14)}\
  .rp-pd .tile{position:relative;width:calc(var(--rh) * .78);height:calc(var(--rh) * .78);display:grid;place-items:center;border-radius:8px;\
    background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.08)}\
  .rp-pd .tile img{width:72%;height:72%;object-fit:contain;filter:drop-shadow(0 3px 8px rgba(0,0,0,.55))}\
  .rp-pd .tile b{font-family:Oswald,sans-serif;font-size:calc(var(--rh) * .2);letter-spacing:.5px}\
  .rp-pd .c.ok .tile{border-color:rgba(61,220,151,.75);box-shadow:0 0 16px rgba(61,220,151,.35),inset 0 0 12px rgba(61,220,151,.15)}\
  .rp-pd .c.no .tile img,.rp-pd .c.no .tile b{filter:grayscale(1);opacity:.28}\
  .rp-pd .c.no .tile{border-color:rgba(255,90,95,.35)}\
  .rp-pd .bdg{position:absolute;right:-7px;top:-7px;width:calc(var(--rh) * .24);height:calc(var(--rh) * .24);border-radius:50%;display:grid;place-items:center;\
    font-size:calc(var(--rh) * .15);font-weight:800;color:#06121f;box-shadow:0 2px 8px rgba(0,0,0,.5)}\
  .rp-pd .c.ok .bdg{background:#3ddc97}.rp-pd .c.no .bdg{background:#ff5a5f;color:#fff}\
  .rp-pd .c.none span{width:calc(var(--rh) * .3);height:2px;background:rgba(160,190,240,.25)}\
  .rp-pd .acl,.rp-pd .ac{border-top:1px solid rgba(242,193,78,.45);padding-top:' + (10 * S) + 'px;margin-top:' + (4 * S) + 'px}\
  .rp-pd .acl{font-family:Oswald,sans-serif;font-weight:700;font-size:' + (18 * S) + 'px;letter-spacing:3px;color:#f2c14e;text-transform:uppercase;display:flex;align-items:center}\
  .rp-pd .ac{display:flex;flex-direction:column;align-items:center;gap:' + (5 * S) + 'px}\
  .rp-pd .ac .n{font-family:Oswald,sans-serif;font-weight:700;font-size:calc(var(--nf) * 1.9);line-height:1;color:#fff}\
  .rp-pd .ac .n small{font-size:.55em;color:#8fa0c2;font-weight:500}\
  .rp-pd .ac .bar{width:78%;height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}\
  .rp-pd .ac .bar i{display:block;height:100%;background:linear-gradient(90deg,#4aa3ff,#7cc0ff)}\
  .rp-pd .ac.lead .n{color:#f2c14e;text-shadow:0 0 14px rgba(242,193,78,.45)}.rp-pd .ac.lead .bar i{background:linear-gradient(90deg,#d9a530,#f2c14e)}\
  .rp-pd .ac .cr{font-size:calc(var(--nf) * 1.1);height:calc(var(--nf) * 1.2);line-height:1}\
  .rp-pd .ft{position:relative;display:flex;justify-content:space-between;padding:' + (10 * S) + 'px ' + (34 * S) + 'px ' + (16 * S) + 'px;font-family:Oswald,sans-serif;font-size:' + (12 * S) + 'px;letter-spacing:2px;text-transform:uppercase;color:#6f80a3}\
  .rp-pd.anim .mh,.rp-pd.anim .rw>*{animation:rpin .55s cubic-bezier(.2,.8,.2,1) both}\
  @keyframes rpin{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}\
  .rp-rc ul{margin:0;padding-left:' + (18 * S) + 'px;font-size:' + (15 * S) + 'px;line-height:1.6}\
  ';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function nextObj(t, gt) {
    if (!t) return null;
    if (t.dragon && t.dragon.at > gt) return {k: t.dragon.elder ? 'Ancestral' : 'Dragón', v: mmss(t.dragon.at - gt)};
    if (t.baron && t.baron.at > gt) return {k: 'Barón', v: mmss(t.baron.at - gt)};
    return null;
  }

  // ---------- contenedor ----------
  var posClass = VIEW === 'bar' ? cfg.pos : VIEW === 'alert' || VIEW === 'serie' || VIEW === 'remontada' ? 'tc' : VIEW === 'recap' || VIEW === 'cuadro' || VIEW === 'predicciones' ? 'mid'
    : VIEW === 'objectives' || VIEW === 'big' || VIEW === 'keys' || VIEW === 'duelos' ? 'tl' : 'bottom';
  var ovl = document.createElement('div'); ovl.className = 'rp-ovl ' + posClass;
  var callout = document.createElement('div'); callout.className = 'rp-callout';
  var main = document.createElement('div');
  if (VIEW === 'bar') { main.className = 'rp-bar'; if (cfg.pos === 'top') { ovl.appendChild(main); ovl.appendChild(callout); } else { ovl.appendChild(callout); ovl.appendChild(main); } }
  else if (VIEW === 'alert') { ovl.appendChild(callout); }
  else { ovl.appendChild(main); }
  document.body.appendChild(ovl);
  function applyHidden() { ovl.classList.toggle('hide', !!cfg.hidden); }
  applyHidden();

  // ---------- render por vista ----------
  var hist = [], lastCallout = 0;

  function render(s) {
    if (VIEW === 'bar') return renderBar(s);
    if (VIEW === 'big') return renderBig(s);
    if (VIEW === 'keys') return renderKeys(s);
    if (VIEW === 'objectives') return renderObj(s);
    if (VIEW === 'serie') return renderSerie(s);
    if (VIEW === 'duelos') return renderDuelos(s);
    if (VIEW === 'remontada') return renderRemontada(s);
    if (VIEW === 'recap') return renderRecap(s);
    if (VIEW === 'cuadro') return renderCuadro(s);
    if (VIEW === 'predicciones') return renderPred(s);
    if (VIEW === 'alert') { if (s.game && s.game.pBlue != null) { hist.push({t: Date.now(), p: s.game.pBlue}); checkMomentum(s); } return; }
    renderBar(s);
  }

  function brandHTML(s) {
    var tr = s.demo ? '<div class="rp-bs" style="color:#f2c14e">DEMO · partido real</div>' : (has('brand') && s.precision) ? '<div class="rp-bs">' + Math.round(s.precision.acc15 * 100) + '% de acierto</div>' : '';
    return '<div class="rp-brand">' + LOGO + '<div><div class="rp-bn">RiftPulse</div>' + tr + '</div></div>';
  }

  function renderBar(s) {
    ovl.className = 'rp-ovl ' + cfg.pos; applyHidden();
    if (!s.match) { main.style.display = 'none'; return; }
    main.style.display = 'flex';
    var m = s.match, g = s.game, core, side = '';
    if (g && g.pBlue != null && has('prob')) {
      var pb = Math.round(g.pBlue * 100), pr = 100 - pb, lb = pb >= pr ? ' lead' : '', lr = pr > pb ? ' lead' : '';
      core = '<div class="rp-core"><span class="rp-tc b">' + esc(m.blue.code) + '</span>' +
        '<div class="rp-pbar"><div class="rp-pb' + lb + '" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + pb + '%</div>' +
        '<div class="rp-pr' + lr + '" style="width:' + Math.min(85, Math.max(pr, 15)) + '%">' + pr + '%</div></div>' +
        '<span class="rp-tc r">' + esc(m.red.code) + '</span></div>';
      if (has('timers')) { var o = nextObj(g.timers, g.gt);
        side = '<div class="rp-side"><span class="rp-gt">' + mmss(g.gt) + '</span>' + (o ? '<div class="rp-tm"><span class="v">' + o.v + '</span><span class="k">' + o.k + '</span></div>' : '') + '</div>'; }
      main.innerHTML = brandHTML(s) + core + side;
      if (has('momentum')) { hist.push({t: Date.now(), p: g.pBlue}); checkMomentum(s); }
    } else if (has('pregame')) {
      main.innerHTML = brandHTML(s) + '<div class="rp-core"><span class="rp-tc b">' + esc(m.blue.code) + '</span><span class="rp-gt">vs</span><span class="rp-tc r">' + esc(m.red.code) + '</span></div>';
    } else { main.style.display = 'none'; }
  }

  function renderBig(s) {
    if (!s.match || !s.game || s.game.pBlue == null) { main.style.display = 'none'; return; }
    main.style.display = 'block'; main.className = 'rp-big';
    var m = s.match, pb = Math.round(s.game.pBlue * 100), lead = pb >= 50, lc = lead ? m.blue.code : m.red.code, lp = lead ? pb : 100 - pb;
    main.innerHTML = '<div class="hd">' + LOGO + '<span class="t">RiftPulse · probabilidad en vivo</span></div>' +
      '<div class="n" style="color:' + (lead ? '#7cc0ff' : '#ff8a8f') + '">' + lp + '%</div><div class="who">a favor de ' + esc(lc) + ' · min ' + mmss(s.game.gt) + '</div>' +
      '<div class="rp-pbar"><div class="rp-pb" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + esc(m.blue.code) + '</div><div class="rp-pr" style="width:' + Math.min(85, Math.max(100 - pb, 15)) + '%">' + esc(m.red.code) + '</div></div>';
  }

  function renderKeys(s) {
    if (!s.match || !s.game || !s.game.reasons || !s.game.reasons.length) { main.style.display = 'none'; return; }
    main.style.display = 'block'; main.className = 'rp-keys';
    var m = s.match, li = s.game.reasons.slice(0, 4).map(function (x) { var b = x.z >= 0; return '<li><span class="d ' + (b ? 'b' : 'r') + '"></span>' + esc(x.txt) + ' <span style="color:#8b97b0;margin-left:auto;font-size:.8em">' + (b ? m.blue.code : m.red.code) + '</span></li>'; }).join('');
    main.innerHTML = '<div class="t">⚑ Claves del momento</div><ul>' + li + '</ul>';
  }

  function renderObj(s) {
    if (!s.match || !s.game || s.game.pBlue == null) { main.style.display = 'none'; return; }
    main.style.display = 'flex'; main.className = 'rp-obj';
    var g = s.game, items = [['Tiempo', mmss(g.gt)]], o = nextObj(g.timers, g.gt);
    if (g.timers && g.timers.dragon && g.timers.dragon.at > g.gt) items.push([g.timers.dragon.elder ? 'Ancestral' : 'Dragón', mmss(g.timers.dragon.at - g.gt)]);
    if (g.timers && g.timers.baron && g.timers.baron.at > g.gt) items.push(['Barón', mmss(g.timers.baron.at - g.gt)]);
    main.innerHTML = items.map(function (a) { return '<div class="tm"><span class="v">' + a[1] + '</span><span class="k">' + a[0] + '</span></div>'; }).join('');
  }

  var pct = function (x) { return Math.round(x * 100) + '%'; };
  var k1 = function (g) { return (Math.abs(g) / 1000).toFixed(1).replace('.', ',') + 'k'; };
  var sc = function (side) { return side === 'blue' ? 'b' : 'r'; };
  function card(on) { main.style.display = 'block'; main.className = 'rp-card' + (on ? '' : ' off'); }

  function renderSerie(s) {
    var se = s.series;
    if (!s.match || !se || se.bo < 2) { main.style.display = 'none'; return; }
    main.style.display = 'flex'; main.className = 'rp-ser';
    var m = s.match;
    main.innerHTML = LOGO + '<div class="h">Serie · Bo' + se.bo + '<b><span class="b">' + esc(m.blue.code) + '</span> ' + se.score[0] + '–' + se.score[1] + ' <span class="r">' + esc(m.red.code) + '</span></b></div>' +
      '<div class="if"><span class="k">ahora</span><span class="v"><span class="b">' + pct(se.pNow) + '</span> · <span class="r">' + pct(1 - se.pNow) + '</span></span></div>' +
      '<div class="if"><span class="k">si gana ' + esc(m.blue.code) + ' este juego</span><span class="v b">' + pct(se.ifBlue) + '</span></div>' +
      '<div class="if"><span class="k">si gana ' + esc(m.red.code) + ' este juego</span><span class="v r">' + pct(1 - se.ifRed) + '</span></div>';
  }

  function renderDuelos(s) {
    var g = s.game, L = g && g.lanes;
    if (!s.match || !L || !L.length) { main.style.display = 'none'; return; }
    card(true);
    var rows = L.map(function (l) { var up = l.gd >= 0;
      return '<tr><td class="rl">' + esc(l.label) + '</td><td class="b">' + esc(l.blue.name) + '</td><td class="df ' + (up ? 'b' : 'r') + '">' + (up ? '◀ ' : '') + k1(l.gd) + (up ? '' : ' ▶') + '</td><td class="rt r">' + esc(l.red.name) + '</td></tr>'; }).join('');
    var k = g.keyPlayer;
    main.innerHTML = '<div class="t">' + LOGO + 'Duelos por línea · oro</div><table class="rp-ln">' + rows + '</table>' +
      (k ? '<div class="rp-kp">⭐ <span class="g">' + esc(k.name) + '</span> (' + esc(k.champ) + ') · ' + (k.gd >= 0 ? '+' : '−') + k1(k.gd) + ' sobre ' + esc(k.vs) + ' · ' + Math.round(k.share * 100) + '% del daño</div>' : '');
  }

  // Aparece sola cuando un equipo pasa del 65 % (si el control no la apagó).
  function renderRemontada(s) {
    var c = s.game && s.game.comeback;
    if (!s.match || !c || c.p > 0.35 || !cfg.auto.remontada) { if (main.innerHTML) card(false); else main.style.display = 'none'; return; }
    card(true);
    var x = c.paths[0];
    main.innerHTML = '<div class="t">' + LOGO + 'Para remontar</div><div class="rp-cb"><b class="' + sc(c.side) + '">' + esc(c.code) + '</b> está en ' + pct(c.p) + '. ' +
      (c.reached ? 'Necesita <b>' + esc(x.txt) + '</b> para volver al <span class="p ' + sc(c.side) + '">' + pct(x.p) + '</span>.' : 'Lo que más lo acerca: <b>' + esc(x.txt) + '</b> → <span class="p ' + sc(c.side) + '">' + pct(x.p) + '</span>.') +
      '</div><div class="note">Simulado con el modelo de RiftPulse sobre el estado actual del juego.</div>';
  }

  // Resumen post-juego: aparece solo ~25 s al terminar cada juego, o cuando el control lo pide.
  var recapShown = {}, recapUntil = 0;
  function renderRecap(s) {
    var g = s.game, r = g && g.recap;
    if (r && cfg.auto.recap && !recapShown[g.id]) { recapShown[g.id] = true; recapUntil = Date.now() + 25000; setTimeout(function () { if (R.state) render(R.state); }, 25100); }
    if (!r || Date.now() > recapUntil) { if (main.innerHTML) card(false); else main.style.display = 'none'; return; }
    card(true); main.classList.add('rp-rc');
    var m = s.match, sm = g.samples, t0 = sm[0].gt, span = Math.max(1, sm[sm.length - 1].gt - t0), wc = r.win === 'blue' ? '#7cc0ff' : '#ff8a8f';
    var d = 'M' + sm.map(function (p) { var v = r.win === 'blue' ? p.p : 1 - p.p; return ((p.gt - t0) / span * 600).toFixed(1) + ' ' + (66 - v * 62).toFixed(1); }).join(' L');
    var li = [];
    if (r.comeback) li.push('¡Remontada! Estuvo al <b>' + pct(r.low.p) + '</b> en el min ' + mmss(r.low.gt) + '.');
    if (r.swing) li.push('Giro decisivo: min ' + mmss(r.swing.a) + '–' + mmss(r.swing.b) + ', <b>+' + Math.round(Math.abs(r.swing.d) * 100) + ' pts</b> (' + esc(r.swing.cause) + ').');
    if (r.key) li.push('Jugador clave: <b>' + esc(r.key.name) + '</b> (' + esc(r.key.champ) + ') · ' + r.key.k + '/' + r.key.d + '/' + r.key.a + ' · ' + Math.round(r.key.share * 100) + '% del daño.');
    if (r.stats) { var w = r.stats[r.win], l = r.stats[r.win === 'blue' ? 'red' : 'blue']; li.push('Kills ' + w.kills + '–' + l.kills + ' · torres ' + w.towers + '–' + l.towers + ' · dragones ' + w.dragons + '–' + l.dragons + '.'); }
    main.innerHTML = '<div class="t">' + LOGO + 'RiftPulse · fin del juego' + (m.gameNo ? ' ' + m.gameNo : '') + '</div>' +
      '<div class="ttl ' + sc(r.win) + '">' + esc(r.code) + ' gana</div><div class="sub">vs ' + esc(r.lose) + ' · ' + mmss(r.dur) + '</div>' +
      '<svg viewBox="0 0 600 70" preserveAspectRatio="none"><line x1="0" y1="35" x2="600" y2="35" stroke="#263352" stroke-dasharray="5 5"/><path d="' + d + '" fill="none" stroke="' + wc + '" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>' +
      '<ul>' + li.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
  }

  // Cuadro de eliminatorias: se pide al motor (refresca el calendario cada minuto) y marca la serie que se está jugando.
  function renderCuadro(s) {
    R.loadBracket();
    var B = R.bracket;
    if (!B) { main.style.display = 'none'; return; }
    card(true);
    function m(x) {
      var live = x.state === 'inProgress', g = s.match && s.match.id === x.id && s.game && s.game.pBlue != null ? s.game : null;
      var lt = live ? '<div class="lvt">● EN VIVO' + (g ? ' · juego en curso: ' + esc(g.pBlue >= 0.5 ? s.match.blue.code : s.match.red.code) + ' ' + pct(Math.max(g.pBlue, 1 - g.pBlue)) : '') + '</div>' : '';
      return '<div class="m' + (live ? ' lv' : '') + '">' + lt + x.teams.map(function (t, j) {
        if (!t.code) { var fr = (x.from && x.from[j]) || []; return '<div class="tm tbd">' + (fr.length ? fr.map(esc).join(' / ') : 'Por definir') + '</div>'; }
        return '<div class="tm' + (t.won ? ' won' : x.state === 'completed' ? ' lost' : '') + '">' + (t.img ? '<img src="' + esc(t.img) + '" alt="">' : '') + '<b>' + esc(t.code) + '</b>' + (x.state !== 'unstarted' ? '<span class="w">' + t.wins + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }
    var col = function (h, inner) { return '<div class="col"><div class="h">' + h + '</div><div class="bd">' + inner + '</div></div>'; };
    main.innerHTML = '<div class="t">' + LOGO + 'Mundial 2026 · eliminatorias</div><div class="rp-br">' +
      col('Cuartos', B.qf.map(m).join('')) + col('Semis', B.sf.map(m).join('')) +
      col('Final', m(B.f[0]) + (B.champion ? '<div class="ch">🏆 ' + esc(B.champion) + '</div>' : '')) + '</div>';
  }

  // Predicciones del stream: integrantes y picks vienen de control.html (mismo navegador de OBS); los resultados, del calendario.
  var PRED = (function () { try { return JSON.parse(localStorage.getItem('rp_pred') || 'null'); } catch (e) { return null; } })();
  var predSig = '', predShown = false;
  function renderPred() {
    R.loadMatches();
    var P = PRED, all = R.matches, ms = R.predMatches(all, P && P.day);
    if (!P || P.hidden || !P.members || !P.members.length || !ms.length) { predShown = false; predSig = ''; if (main.innerHTML) card(false); else main.style.display = 'none'; return; }
    // solo se redibuja si cambió algo (así la animación de entrada no se repite en cada actualización)
    var sig = JSON.stringify([P, ms.map(function (x) { return [x.id, x.state, x.teams[0].wins, x.teams[1].wins]; }), all.length]);
    if (sig === predSig && predShown) return;
    predSig = sig;
    card(true); main.classList.add('rp-pd');
    main.classList.toggle('anim', !predShown); predShown = true;
    var n = P.members.length, r = ms.length;
    // columnas y filas se ajustan a cuántos integrantes y partidos haya (sin límite)
    var cw = Math.max(58, Math.min(150, Math.floor((1760 - 330) / n) - 10)), rh = Math.max(40, Math.min(104, Math.floor(560 / r)));
    main.style.setProperty('--rh', rh * S + 'px');
    main.style.setProperty('--ph', Math.round(Math.min(170, cw * 1.18)) * S + 'px');
    main.style.setProperty('--nf', Math.max(10, Math.min(16, cw / 8)) * S + 'px');
    var winner = function (x) { return x.state === 'completed' ? (x.teams[0].won ? x.teams[0].code : x.teams[1].won ? x.teams[1].code : null) : null; };
    var logo = function (x, code) { var t = x.teams.filter(function (t) { return t.code === code; })[0]; return t && t.img ? '<img src="' + esc(t.img) + '" alt="">' : '<b>' + esc(code) + '</b>'; };
    // aciertos de todo el torneo
    var hits = {}, tot = {};
    all.forEach(function (x) { var w = winner(x), pk = P.picks[x.id] || {}; if (!w) return; for (var m in pk) { tot[m] = (tot[m] || 0) + 1; if (pk[m] === w) hits[m] = (hits[m] || 0) + 1; } });
    var best = Math.max.apply(null, P.members.map(function (m) { return hits[m.id] || 0; }));
    var blocks = ms.map(function (x) { return x.block; }).filter(function (b, i, a) { return b && a.indexOf(b) === i; });
    var days = ms.map(function (x) { return new Date(x.start).toLocaleDateString('es', {day: '2-digit', month: '2-digit'}) + ' ' + new Date(x.start).toLocaleDateString('es', {weekday: 'long'}); }).filter(function (d, i, a) { return a.indexOf(d) === i; });
    var bo = ms.every(function (x) { return x.bo === ms[0].bo; }) ? ms[0].bo : null;
    var d = function (k) { return ' style="animation-delay:' + (k * 45) + 'ms"'; };
    var h = '<div class="hd"><div class="tt">' + esc(P.title || 'Predicciones del stream') + '</div>' +
      '<div class="brand2"><div><b>RIFTPULSE</b><span>Mundial 2026</span></div>' + LOGO + '</div></div><div class="rule"></div>' +
      '<div class="gd" style="grid-template-columns:' + 300 * S + 'px repeat(' + n + ',' + cw * S + 'px)">' +
      '<div class="stg"><div class="ph1">' + esc(blocks.join(' · ') || 'Mundial') + '</div>' + (bo ? '<div class="ph2">Al mejor de ' + bo + '</div>' : '') +
      '<div class="day">' + esc(days.length === 1 ? days[0] : days[0] + ' – ' + days[days.length - 1]) + '</div></div>';
    P.members.forEach(function (m, k) {
      var hue = m.id * 67 % 360;
      h += '<div class="mh"' + d(k) + '><div class="pic">' + (m.photo ? '<img src="' + m.photo + '" alt="">' :
        '<div class="ini" style="background:linear-gradient(160deg,hsl(' + hue + ' 55% 42%),hsl(' + ((hue + 40) % 360) + ' 60% 22%))">' + esc(m.name.slice(0, 2).toUpperCase()) + '</div>') +
        '</div><div class="nmp">' + esc(m.name) + '</div></div>';
    });
    ms.forEach(function (x, ri) {
      var a = x.teams[0], b = x.teams[1], w = winner(x), pk = P.picks[x.id] || {}, live = x.state === 'inProgress';
      var tm = function (t) { return '<div class="tmb">' + (t.img ? '<img src="' + esc(t.img) + '" alt="">' : '') + '<span>' + esc(t.code || 'TBD') + '</span></div>'; };
      h += '<div class="rw"><div class="mt' + (live ? ' live' : '') + '"' + d(n + ri * (n + 1)) + '>' + (live ? '<span class="lv">● EN VIVO</span>' : '') + tm(a) + '<span class="vs">VS</span>' + tm(b) + '</div>';
      P.members.forEach(function (m, k) {
        var t = pk[m.id], st = w && t ? (t === w ? 'ok' : 'no') : '';
        h += '<div class="c' + (t ? (st ? ' ' + st : '') : ' none') + '"' + d(n + ri * (n + 1) + k + 1) + '>' +
          (t ? '<div class="tile">' + logo(x, t) + (st ? '<span class="bdg">' + (st === 'ok' ? '✓' : '✕') + '</span>' : '') + '</div>' : '<span></span>') + '</div>';
      });
      h += '</div>';
    });
    h += '<div class="rw"><div class="acl">Aciertos</div>';
    P.members.forEach(function (m) {
      var k = hits[m.id] || 0, t = tot[m.id] || 0, lead = t && k === best && best > 0;
      h += '<div class="ac' + (lead ? ' lead' : '') + '"><span class="cr">' + (lead ? '👑' : '') + '</span><span class="n">' + k + '<small>/' + t + '</small></span><span class="bar"><i style="width:' + (t ? Math.round(k / t * 100) : 0) + '%"></i></span></div>';
    });
    h += '</div></div><div class="ft"><span>RiftPulse · pronóstico en vivo</span><span>Aciertos de todo el torneo · se marcan solos al terminar cada partido</span></div>';
    main.innerHTML = h;
  }

  function showCallout(html) { callout.innerHTML = html; callout.classList.add('show'); setTimeout(function () { callout.classList.remove('show'); }, 7000); }
  function checkMomentum(s) {
    var now = Date.now(); hist = hist.filter(function (x) { return now - x.t <= 90000; });
    if (now - lastCallout < 18000) return;
    var past = null; for (var i = 0; i < hist.length; i++) { if (now - hist[i].t >= 38000) past = hist[i]; }
    if (!past) return;
    var d = Math.round((s.game.pBlue - past.p) * 100); if (Math.abs(d) < 12) return;
    var toB = d > 0, code = toB ? s.match.blue.code : s.match.red.code;
    var ev = (s.game.events || []).filter(function (e) { return ['baron', 'elder', 'dragon', 'inhib'].indexOf(e.kind) >= 0 && s.game.gt - e.gt <= 60; }).slice(-1)[0];
    lastCallout = now;
    showCallout('<span class="zap">⚡</span><span class="cc ' + (toB ? 'b' : 'r') + '">' + esc(code) + ' +' + Math.abs(d) + ' pts</span>' + (ev ? ' · ' + esc(ev.txt) : ''));
  }

  // ---------- panel de control: la vista bar obedece módulos/posición; remontada y recap, sus interruptores ----------
  function applyCtrl(o) {
    if (!o) return;
    if (VIEW === 'bar') {
      if (o.modules) cfg.modules = o.modules;
      if (o.pos) cfg.pos = o.pos;
      if (o.hidden != null) cfg.hidden = o.hidden;
      if (o.testAlert) showCallout('<span class="zap">⚡</span><span class="cc b">Alerta de prueba</span>');
    }
    if (o.auto) cfg.auto = o.auto;
    if (o.pred) PRED = o.pred;
    if (o.showRecap && VIEW === 'recap') { recapUntil = Date.now() + 25000; setTimeout(function () { if (R.state) render(R.state); }, 25100); }
    if (R.state) render(R.state);
  }
  try { var bc = new BroadcastChannel('riftpulse-ctrl'); bc.onmessage = function (e) { applyCtrl(e.data); }; } catch (e) {}
  window.addEventListener('storage', function (e) {
    if (e.key === 'rp_ctrl') { try { applyCtrl(JSON.parse(e.newValue || 'null')); } catch (x) {} }
    if (e.key === 'rp_pred') { try { applyCtrl({pred: JSON.parse(e.newValue || 'null')}); } catch (x) {} }
  });

  R.onUpdate(render);
  R.auto();
})();
