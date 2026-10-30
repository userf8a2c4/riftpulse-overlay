/* RiftPulse — overlay personal de espectador (se inyecta sobre el stream; SOLO lo ve el usuario).
   Barra HORIZONTAL que se acopla al HUD de la transmisión. Aporta lo que el stream no sintetiza:
   probabilidad de victoria, impacto del próximo objetivo y la trayectoria. Módulos con triggers.
   Usa window.RiftEngine (engine.js). Shadow DOM. */
(function () {
  'use strict';
  if (!window.RiftEngine) { console.warn('[RiftPulse] falta engine.js'); return; }
  if (document.getElementById('rp-overlay-host')) return;
  var R = window.RiftEngine;

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  // v7: los paneles ya no quedan fijos (los muestra el director en su momento) y la barra vuelve a su lugar junto al marcador
  var EXT = (function () {
    try { var e = JSON.parse(ls('rp_ext7') || 'null'); if (e) return e; } catch (e1) {}
    var v6 = []; try { v6 = JSON.parse(ls('rp_ext6') || '["obj"]') || []; } catch (e2) {}
    return v6.filter(function (k) { return k === 'obj' || k === 'pg' || k === 'mini'; });
  })();
  var POS = ls('rp_pos7') || 'top';
  var DMG = ls('rp_dmg6') !== '0';  // reparto de daño automático tras cada pelea
  var XY = (function () { try { var o = JSON.parse(ls('rp_xy8') || 'null'); return o && o.rx != null ? o : null; } catch (e) { return null; } })();  // relativa al video

  if (!document.getElementById('rp-fonts')) { var fl = document.createElement('link'); fl.id = 'rp-fonts'; fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap'; (document.head || document.documentElement).appendChild(fl); }
  var host = document.createElement('div');
  host.id = 'rp-overlay-host';
  host.style.cssText = 'position:fixed;z-index:2147483646;max-width:96vw;';
  (document.body || document.documentElement).appendChild(host);
  var sh = host.attachShadow({mode: 'open'});
  // el video principal de la página (el más grande que esté visible)
  function mainVideo() {
    var best = null, area = 0;
    document.querySelectorAll('video').forEach(function (v) { var r = v.getBoundingClientRect(), a = r.width * r.height; if (a > area && r.width > 200) { best = v; area = a; } });
    return best;
  }
  var host2 = document.createElement('div');
  host2.id = 'rp-overlay-paneles';
  host2.style.cssText = 'position:fixed;z-index:2147483645;pointer-events:none;transform-origin:0 0;';
  (document.body || document.documentElement).appendChild(host2);
  var sh2 = host2.attachShadow({mode: 'open'});
  // integrado con la transmisión: la barra, pegada debajo del marcador de arriba (una fila más del HUD); los paneles, de a uno,
  // en la columna izquierda a media altura (entre los timers de arriba a la izquierda y la barra de estadísticas de abajo).
  // Nunca encima del marcador, la barra de abajo, las cámaras, el minimapa ni el centro del mapa.
  function place() {
    var v = mainVideo(), r = v ? v.getBoundingClientRect() : null;
    if (XY && r) { host.style.left = Math.round(r.left + XY.rx * r.width) + 'px'; host.style.top = Math.round(r.top + XY.ry * r.height) + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; }
    else {
      host.style.transform = 'translateX(-50%)';
      host.style.left = r ? (r.left + r.width / 2) + 'px' : '50%';
      if (POS === 'bottom') { host.style.top = 'auto'; host.style.bottom = r ? Math.max(8, innerHeight - (r.top + r.height * 0.745)) + 'px' : '112px'; }
      else { host.style.bottom = 'auto'; host.style.top = r ? Math.max(8, r.top + r.height * 0.118) + 'px' : '52px'; }
    }
    var k = r ? Math.max(0.6, Math.min(1.3, r.width / 1400)) : 1;
    host2.style.transform = 'scale(' + k.toFixed(3) + ')';
    if (r) { host2.style.left = (r.left + r.width * 0.012) + 'px'; host2.style.top = (r.top + r.height * 0.2) + 'px'; host2.style.maxHeight = (r.height * 0.52 / k) + 'px'; }
    else { host2.style.left = '12px'; host2.style.top = '20vh'; }
  }
  setInterval(place, 1000);
  window.addEventListener('resize', place);
  place();

  function rpFullscreen() { var fs = document.fullscreenElement || document.webkitFullscreenElement || null; var dest = fs || document.body; if (dest && host.parentNode !== dest) dest.appendChild(host); if (dest && host2.parentNode !== dest) dest.appendChild(host2); setTimeout(place, 50); }
  document.addEventListener('fullscreenchange', rpFullscreen);
  document.addEventListener('webkitfullscreenchange', rpFullscreen);

  // tokens del sistema visual dentro del shadow DOM (los colores del partido los pone RP.colores en el host)
  var TOK = ':host{--bg:#0C0E12;--bg-rgb:12,14,18;--g0:#101318;--g0-rgb:16,19,24;--g1:#14171D;--g1-rgb:20,23,29;--g2:#1B1F27;--g2-rgb:27,31,39;--line-rgb:220,226,236;' +
    '--line:rgba(220,226,236,.09);--line-2:rgba(220,226,236,.06);--line-strong:rgba(220,226,236,.16);--text:#F2F4F7;--muted:#9AA3B2;--text-dim:#6E7686;' +
    '--signal:#22D3EE;--signal-2:#0EA5C6;--signal-soft:#A5F3FC;--signal-rgb:34,211,238;--signal-ink:#0C0E12;--ok:#2FD6A0;--live:#FF4D5A;--link:#9CC8FF;' +
    '--team-a:#3D8BFF;--team-a-2:#2A63C0;--team-a-hi:#8DBBFF;--team-a-ink:#FFFFFF;--team-a-rgb:61,139,255;--team-a-txt:#7FB2FF;' +
    '--team-b:#FF4655;--team-b-2:#C0303D;--team-b-hi:#FF96A0;--team-b-ink:#FFFFFF;--team-b-rgb:255,70,85;--team-b-txt:#FF7C87;' +
    '--ff:Inter Tight,system-ui,sans-serif;--ffd:Saira Condensed,Inter Tight,sans-serif;--ffm:JetBrains Mono,ui-monospace,monospace}';
  var CSS = '\
  :host{all:initial}*{box-sizing:border-box;font-family:Saira Condensed,system-ui,"Segoe UI",Roboto,sans-serif}\
  .w{position:relative;display:inline-flex;align-items:stretch;height:48px;border-radius:5px;overflow:visible;\
     background:linear-gradient(180deg,rgba(var(--g1-rgb),.94),rgba(var(--g0-rgb),.96));border:1px solid rgba(var(--line-rgb),0.132);\
     box-shadow:0 14px 34px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(8px);color:var(--text);cursor:grab}\
  .w::after{content:"";position:absolute;left:-1px;top:-1px;width:70px;height:2px;background:linear-gradient(90deg,var(--signal),rgba(var(--signal-rgb),0));border-radius:5px 0 0 0;pointer-events:none}\
  .w.drag{cursor:grabbing}\
  .seg{display:flex;flex-direction:column;justify-content:center;padding:0 13px;border-right:1px solid rgba(var(--line-rgb),0.077);white-space:nowrap}\
  .seg:last-child{border-right:0}\
  .brand{align-items:center;flex-direction:row;gap:8px;background:linear-gradient(90deg,rgba(var(--signal-rgb),.1),rgba(var(--signal-rgb),0))}.brand .logo{width:20px;height:20px;display:block}\
  .brand .bn{font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:var(--text)}\
  .prob{flex-direction:row;align-items:center;gap:10px}\
  .tc{font-family:Saira Condensed,sans-serif;font-size:19px;letter-spacing:1px;text-shadow:0 2px 6px rgba(0,0,0,.6)}\
  .tc.b{color:var(--team-a-txt)}.tc.r{color:var(--team-b-txt)}\
  .bar{position:relative;width:196px;height:26px;display:flex;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);background:rgba(255,255,255,.06)}\
  .pb{display:flex;align-items:center;padding:0 12px;color:var(--team-a-ink);font-weight:700;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,var(--team-a-hi),var(--team-a-2));transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pr{display:flex;align-items:center;justify-content:flex-end;padding:0 12px;color:#fff;font-weight:700;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,var(--team-b),var(--team-b-2));transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pb.lead{background:linear-gradient(180deg,var(--team-a-hi),var(--team-a) 45%,var(--team-a-2));box-shadow:inset 0 0 14px rgba(255,255,255,.35)}\
  .pr.lead{background:linear-gradient(180deg,var(--team-b-hi),var(--team-b) 45%,var(--team-b-2));box-shadow:inset 0 0 14px rgba(255,255,255,.3)}\
  .sl{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);line-height:1.3}\
  .sv{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.25;color:var(--text);letter-spacing:.4px}\
  .sv b{font-weight:700}.sv b.b{color:var(--team-a-txt)}.sv b.r{color:var(--team-b-txt)}.sv .mut{color:var(--muted);font-weight:400;font-size:11px}\
  .obj .sv2{font-size:11px;color:var(--muted)}\
  .spark{display:flex;align-items:center;gap:8px}\
  .spark svg{display:block;width:96px;height:30px}\
  .acc{align-items:center;background:linear-gradient(270deg,rgba(61,220,151,.08),rgba(61,220,151,0))}.acc .n{font-size:16px;font-weight:700;color:var(--ok);font-variant-numeric:tabular-nums}.acc .l{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted)}\
  .next{flex-direction:row;align-items:center;gap:8px;font-weight:700}\
  .next .vs{font-family:Saira Condensed,sans-serif;font-weight:400;font-size:16px;letter-spacing:1px}.next .vs .b{color:var(--team-a-txt)}.next .vs .r{color:var(--team-b-txt)}\
  .next .in{font-size:11px;color:var(--muted);font-weight:400;letter-spacing:.6px}\
  .wait{display:flex;align-items:center;padding:0 14px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}\
  /* controles al pasar el mouse */\
  .ctl{position:absolute;left:50%;transform:translateX(-50%);top:calc(100% + 6px);display:none;gap:4px;align-items:center;\
     background:rgba(var(--g0-rgb),.96);border:1px solid rgba(var(--line-rgb),0.132);border-radius:4px;padding:4px 6px;box-shadow:0 8px 20px rgba(0,0,0,.5)}\
  .w:hover .ctl{display:flex}\
  .chip{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);background:rgba(var(--g1-rgb),.8);border:1px solid rgba(var(--line-rgb),0.132);border-radius:3px;padding:2px 8px;cursor:pointer;white-space:nowrap}\
  .chip.on{color:var(--team-a-ink);background:linear-gradient(180deg,var(--team-a),var(--team-a-2));border-color:var(--team-a)}.chip:hover{color:var(--text)}\
  .chip.on:hover{color:var(--team-a-ink)}\
  .ctl button.ic{width:18px;height:18px;border:1px solid rgba(var(--line-rgb),0.193);border-radius:5px;background:transparent;color:var(--muted);font-size:11px;line-height:1;cursor:pointer;padding:0}\
  .ctl button.ic:hover{color:#fff;border-color:var(--team-a)}\
  .mom{position:absolute;left:50%;top:-22px;transform:translateX(-50%);display:none;align-items:center;gap:6px;background:rgba(var(--g0-rgb),.96);border:1px solid rgba(var(--signal-rgb),.6);border-radius:3px;padding:2px 10px;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--signal-soft);white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.5);z-index:3}\
  .mom.show{display:flex}.mom .zap{color:var(--signal)}.mom .k.b{color:var(--team-a-txt)}.mom .k.r{color:var(--team-b-txt)}\
  .cards{position:absolute;left:50%;top:calc(100% + 8px);transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:max-content;max-width:94vw;z-index:2;pointer-events:none}\
  .cards.up{top:auto;bottom:calc(100% + 8px);flex-wrap:wrap-reverse}\
  .w:hover .cards:not(.up){top:calc(100% + 42px)}\
  .cd{width:300px;background:linear-gradient(180deg,rgba(var(--g1-rgb),.95),rgba(var(--g0-rgb),.96));border:1px solid rgba(var(--line-rgb),0.132);border-radius:5px;padding:9px 12px 10px;box-shadow:0 12px 30px rgba(0,0,0,.55);position:relative}\
  .cd::after{content:"";position:absolute;left:-1px;top:-1px;width:50px;height:2px;background:linear-gradient(90deg,var(--signal),rgba(var(--signal-rgb),0))}\
  .ch{display:flex;justify-content:space-between;align-items:baseline;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:var(--text);margin-bottom:6px}.ch b{font-size:14px;letter-spacing:.5px;font-variant-numeric:tabular-nums}\
  .ch b.b,.cd .b{color:var(--team-a-txt)}.ch b.r,.cd .r{color:var(--team-b-txt)}.cd .mut{color:var(--muted)}\
  .cd svg{display:block;width:100%;height:84px}\
  .lg{display:flex;gap:10px;font-size:10.5px;color:var(--muted);margin-top:4px;letter-spacing:.4px}\
  .du{display:grid;grid-template-columns:1fr 34px 1fr;align-items:center;gap:6px;font-size:12.5px;padding:3px 0;border-top:1px solid rgba(var(--line-rgb),0.055)}.du:first-of-type{border-top:0}\
  .du .rl{text-align:center;font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}.du .nb{display:flex;gap:6px;align-items:center;min-width:0}.du .nr{justify-content:flex-end}\
  .du .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.du .gd{font-size:11px;font-variant-numeric:tabular-nums;font-weight:700;flex:none}\
  .ir{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:4px 0}.ir .big{font-family:Saira Condensed,sans-serif;font-size:22px;letter-spacing:.5px}\
  .in{font-size:12px;color:var(--text);line-height:1.45;margin-top:4px;border-top:1px solid rgba(var(--line-rgb),0.066);padding-top:6px}\
  .dmg{display:none;width:470px;max-width:92vw;pointer-events:auto;\
     background:linear-gradient(180deg,rgba(var(--g1-rgb),.96),rgba(var(--g0-rgb),.97));border:1px solid rgba(var(--line-rgb),0.132);border-radius:5px;padding:10px 13px;box-shadow:0 12px 32px rgba(0,0,0,.6);z-index:4}\
  .dmg.show{display:block;position:relative}\
  .dh{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--signal);margin-bottom:7px;display:flex;justify-content:space-between}.dh .wl{color:var(--text);font-weight:700}\
  .dcols{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px}\
  .drow{display:flex;align-items:center;gap:7px;padding:1px 0}\
  .dn{font-size:12px;font-weight:600;letter-spacing:.6px;width:64px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}\
  .dbar{flex:1;height:7px;border-radius:1px;background:rgba(var(--line-rgb),0.077);overflow:hidden}.dbar>div{height:7px;border-radius:4px}\
  .dcol.b .dbar>div{background:linear-gradient(90deg,var(--team-a-2),var(--team-a))}.dcol.r .dbar>div{background:linear-gradient(90deg,var(--team-b-2),var(--team-b))}\
  .dcol.b .dn{color:var(--team-a-txt)}.dcol.r .dn{color:var(--team-b-txt)}\
  .dp{font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--muted);width:30px;text-align:right;flex:none}\
  .syncg{display:flex;align-items:center;gap:3px;font-size:9.5px;color:var(--muted);border-left:1px solid rgba(var(--line-rgb),0.138);padding-left:6px;margin-left:2px}\
  .syncg input{width:42px;height:18px;background:rgba(var(--g1-rgb),.7);border:1px solid rgba(var(--line-rgb),0.165);border-radius:5px;color:var(--text);font:inherit;font-size:11px;text-align:center;padding:0 3px}\
  .syncg input:focus{outline:none;border-color:var(--team-a)}.syncg input.bad{border-color:var(--team-b)}\
  .ast{font-size:9.5px;letter-spacing:1px;color:var(--muted);max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:4px}\
  .ast.ok{color:var(--ok)}\
  .w{background:rgba(var(--g1-rgb),.95);border:1px solid rgba(var(--line-rgb),.13);border-radius:12px;box-shadow:0 14px 36px rgba(0,0,0,.6)}.w::after{display:none}\
  .brand{background:none}.brand .bn{font-weight:800;letter-spacing:2px;font-size:13px}\
  .prob2{flex-direction:row;align-items:center;gap:10px}\
  .prob2 .tm{display:flex;align-items:center;gap:8px}\
  .prob2 .code{font-family:var(--ffd);font-weight:800;font-size:16px;letter-spacing:.8px;line-height:1;padding:5px 9px;border-radius:6px;background:var(--team-a);color:var(--team-a-ink)}\
  .prob2 .tm.b .code{background:var(--team-b);color:var(--team-b-ink)}\
  .prob2 .pct{font-family:var(--ffd);font-weight:800;font-size:24px;line-height:1;font-variant-numeric:tabular-nums;color:var(--muted);min-width:44px;text-align:right;transition:color .4s}\
  .prob2 .tm.b .pct{text-align:left}.prob2 .tm.lead .pct{color:#fff}.prob2 .pct small{font-size:.5em;opacity:.7;margin-left:1px}\
  .prob2 .meter{position:relative;width:150px;height:6px;border-radius:99px;background:var(--team-b);overflow:hidden}\
  .prob2 .meter i{position:absolute;left:0;top:0;bottom:0;background:var(--team-a);border-right:2px solid var(--g1);transition:width .9s cubic-bezier(.16,1,.3,1)}\
  .prob2 .meter b{position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:rgba(255,255,255,.45)}\
  .toast{position:absolute;left:50%;top:-46px;transform:translate(-50%,6px);opacity:0;pointer-events:none;white-space:nowrap;display:flex;align-items:center;gap:8px;\
    background:rgba(var(--g1-rgb),.97);border:1px solid rgba(var(--signal-rgb),.55);border-radius:999px;padding:6px 14px;font-family:var(--ff);font-size:13px;font-weight:600;color:var(--text);box-shadow:0 10px 26px rgba(0,0,0,.5);transition:opacity .35s,transform .35s;z-index:6}\
  .toast.show{opacity:1;transform:translate(-50%,0)}.toast i{width:8px;height:8px;border-radius:50%;background:var(--signal);box-shadow:0 0 10px var(--signal)}\
  .toast .ca{color:var(--team-a-txt);font-weight:800}.toast .cb{color:var(--team-b-txt);font-weight:800}\
  .mini{display:flex;align-items:center;gap:8px;padding:0 12px 0 10px;font-family:var(--ffd);font-weight:700;font-size:15px;letter-spacing:.5px;color:var(--text)}\
  .mini .logo{width:18px;height:18px}.mini .k{font-family:var(--ff);font-size:12px;font-weight:600;color:var(--muted);letter-spacing:.2px}\
  .w.chico{height:34px}\
  .ctl{flex-wrap:wrap;max-width:620px;justify-content:center}\
  .w:hover .cards{display:none}\
  .tl{flex-basis:100%;display:none}.tl.on{display:block}\
  .tl svg{display:block;width:100%;height:78px}.tl .mk{cursor:pointer}.tl .mk:hover circle{stroke:var(--signal);stroke-width:2}\
  .tl .nav{display:flex;gap:6px;justify-content:center;align-items:center;margin:2px 0 4px;font-family:var(--ff);font-size:12px;color:var(--muted)}\
  .tl .nav button{background:var(--g2);border:1px solid rgba(var(--line-rgb),.18);color:var(--text);border-radius:6px;padding:2px 9px;font:600 12px var(--ff);cursor:pointer;white-space:nowrap;flex:none}\
  .tl .nav button:hover{border-color:var(--signal)}\
  .rs li{margin:3px 0;font-size:12.5px;color:var(--text);line-height:1.4}.rs ul{margin:4px 0 0;padding-left:16px;font-family:var(--ff)}\
  .acc .n{color:var(--signal)}.rp-flash{animation:rpf .9s cubic-bezier(.16,1,.3,1)}@keyframes rpf{25%{color:var(--signal);text-shadow:0 0 14px rgba(var(--signal-rgb),.9)}}\
  .fdo .sl{color:var(--signal);font-size:11px}\
  .diag{position:absolute;right:0;top:calc(100% + 40px);display:none;width:340px;background:rgba(var(--g0-rgb),.97);border:1px solid rgba(var(--signal-rgb),.45);border-radius:5px;padding:10px 12px;box-shadow:0 12px 32px rgba(0,0,0,.6);z-index:5;cursor:default}\
  .diag.show{display:block}.dg-t{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:var(--signal);margin-bottom:6px}\
  .dg-r{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:2px 0;border-bottom:1px solid rgba(var(--line-rgb),0.055)}.dg-r span{color:var(--muted);flex:none}.dg-r b{color:var(--text);font-weight:500;text-align:right;font-family:Inter Tight,system-ui,sans-serif}\
  .dg-i{display:block;max-width:100%;height:34px;margin:4px 0;border:1px solid rgba(var(--line-rgb),0.11);image-rendering:pixelated}.dg-n{font-size:11px;color:var(--muted);margin-top:6px}\
  .syncg .gt{font-variant-numeric:tabular-nums;color:var(--muted);font-weight:700}\
  .cd .hs{margin:0;padding-left:18px;font-size:13px;line-height:1.5}.cd .hs li{padding:2px 0}\
  .col{display:flex;flex-direction:column;align-items:flex-start;gap:8px;overflow:hidden;color:var(--text);font-family:var(--ff)}\
  .col .cd,.col .dmg{width:300px;max-width:300px}.col .cd[style]{width:340px!important;max-width:340px}.col .dmg{max-width:340px;width:340px}\
  .col .dmg{width:470px;max-width:470px}.dmg.show+#cardsx{display:none!important}\
  .fsc{display:flex;justify-content:center;gap:10px;align-items:baseline;font:800 22px var(--ffd);margin:-2px 0 2px}.fsc .b{color:var(--team-a-txt)}.fsc .r{color:var(--team-b-txt)}.fsc span{color:var(--muted)}\
  .fx{text-align:center;font-size:11.5px;color:var(--muted);margin-bottom:6px}.fx b{color:var(--text)}.fx b.b{color:var(--team-a-txt)}.fx b.r{color:var(--team-b-txt)}\
  .fcols{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px}\
  .frow{display:grid;grid-template-columns:22px minmax(0,1fr) 40px 44px 30px;align-items:center;gap:5px;height:26px;font-size:11.5px}\
  .frow.fuera{opacity:.45}.frow .fc{width:22px;height:22px;border-radius:4px;background:var(--g2);display:block}\
  .frow .fn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}.frow.b .fn{color:var(--team-a-txt)}.frow.r .fn{color:var(--team-b-txt)}.frow .fn i{font-style:normal;opacity:.8}\
  .frow .fk{font-variant-numeric:tabular-nums;text-align:center;color:var(--text)}\
  .frow .fb{height:7px;background:rgba(var(--line-rgb),.08);border-radius:2px;overflow:hidden}.frow .fb i{display:block;height:7px}\
  .frow.b .fb i.mas{background:var(--team-a)}.frow.r .fb i.mas{background:var(--team-b)}.frow .fb i.menos{background:rgba(var(--line-rgb),.35)}\
  .frow .fd{font-size:10.5px;color:var(--muted);text-align:right;font-variant-numeric:tabular-nums}\
  .frow .tp{color:var(--muted);font-size:10px}\
  .fl{margin-top:6px;font-size:10px;color:var(--muted);text-align:center;line-height:1.3}\
  .w.oculto{display:none}\
  .w{background:rgba(var(--g1-rgb),.58);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 8px 22px rgba(0,0,0,.35);transition:background .2s}\
  .w:hover{background:rgba(var(--g1-rgb),.95)}\
  .w,.col{text-shadow:0 1px 2px rgba(0,0,0,.65)}\
  .col .cd,.col .dmg{background:rgba(var(--g1-rgb),.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 8px 22px rgba(0,0,0,.35)}\
  .hint{display:none;align-items:center;gap:8px;height:28px;padding:0 12px 0 8px;border-radius:999px;background:rgba(var(--g1-rgb),.9);border:1px solid rgba(var(--line-rgb),.13);font:600 12px var(--ff);color:var(--muted);white-space:nowrap;cursor:pointer}\
  .hint.show{display:inline-flex}.hint .logo{width:16px;height:16px}.hint b{color:var(--text);font-weight:700}.hint a{color:var(--signal);text-decoration:none;font-weight:700}\
  .ctl::before{content:"";position:absolute;left:0;right:0;top:-10px;height:10px}\
  .ctl.auto .man{display:none}.man{display:inline-flex;align-items:center;gap:4px}\
  ';

  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rplg" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="'+RPC.a+'"/><stop offset=".5" stop-color="'+RPC.ahi+'"/><stop offset="1" stop-color="'+RPC.b+'"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="15" fill="#14171d" stroke="#2a2f3a" stroke-width="3"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rplg)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  sh.innerHTML = '<style>' + CSS + TOK + '</style><div class="w" id="w"><div class="mom" id="mom"></div><div class="toast" id="toast"></div><div class="diag" id="diag"></div><div id="body" style="display:inline-flex"></div>' +
    '<div class="ctl" id="ctl"><div class="tl" id="tl"></div><span class="chip" id="autoc" title="Lee el reloj y el marcador del video y se sincroniza solo con el minuto que ves">sincronía automática</span><span class="ast" id="ast"></span><button class="ic" id="diagb" title="Qué está leyendo del video (por si no sincroniza)">?</button>' +
    '<span class="chip" data-ext="obj" title="El próximo objetivo (dragón, Barón…) y cuánto puede mover la probabilidad">objetivo</span><span class="chip" data-ext="pg" title="Cómo fue cambiando la probabilidad en el juego">trayectoria</span><span class="chip" data-ext="oro" title="Panel: la diferencia de oro minuto a minuto">oro</span><span class="chip" data-ext="dano" title="Panel: el daño de cada jugador">daño</span><span class="chip" data-ext="imp" title="Panel: las jugadas que más movieron la probabilidad">impacto</span><span class="chip" data-ext="duelos" title="Panel: cómo va cada jugador contra su rival de línea">duelos</span><span class="chip" data-ext="mini" title="Solo los porcentajes, lo más chico posible">mínimo</span>' +
    '<button class="ic" id="posbtn" title="Volver a su lugar (debajo del marcador o arriba de las estadísticas)">↑↓</button><span class="man"><button class="ic" data-d="-5" title="Atrasar el overlay 5 segundos">−</button><button class="ic" data-d="5" title="Adelantar el overlay 5 segundos">+</button>' +
    '<span class="syncg" title="Escribí el minuto del juego que ves en el stream y tocá ⟲ (o Enter) para clavar el overlay a ese momento">minuto <input id="scm" placeholder="mm:ss" maxlength="5"><button class="ic" id="syncb" title="Sincronizar al minuto que escribiste">⟲</button> va <span class="gt" id="gtnow">—</span></span></span><button class="ic" id="ocub" title="Ocultar RiftPulse (Alt+R lo vuelve a mostrar)">✕</button></div></div>';
  sh2.innerHTML = '<style>' + CSS + TOK + '</style><div class="col" id="cards"><div class="dmg" id="dmg"></div><div id="cardsx" style="display:contents"></div></div>';
  var hintEl = document.createElement('div'); hintEl.className = 'hint'; sh.appendChild(hintEl);
  var wEl = sh.getElementById('w'), body = sh.getElementById('body'), ctl = sh.getElementById('ctl'), momEl = sh.getElementById('mom'), dmgEl = sh2.getElementById('dmg'), cardsX = sh2.getElementById('cardsx');

  function syncChips() { ctl.querySelectorAll('.chip[data-ext]').forEach(function (c) { c.classList.toggle('on', EXT.indexOf(c.getAttribute('data-ext')) >= 0); }); }
  syncChips();
  var LAST = null;
  ctl.querySelectorAll('.chip[data-ext]').forEach(function (c) { c.addEventListener('mousedown', function (e) { e.stopPropagation(); }); c.addEventListener('click', function (e) { e.stopPropagation(); var k = c.getAttribute('data-ext'), i = EXT.indexOf(k); if (i >= 0) EXT.splice(i, 1); else EXT.push(k); ls('rp_ext7', JSON.stringify(EXT)); syncChips(); if (LAST) render(LAST); }); });
  sh.getElementById('posbtn').addEventListener('click', function (e) { e.stopPropagation(); POS = POS === 'top' ? 'bottom' : 'top'; XY = null; ls('rp_xy8', 'null'); ls('rp_pos7', POS); place(); });
  ctl.querySelectorAll('button[data-d]').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function (e) { e.stopPropagation(); R.nudge(+b.getAttribute('data-d')); }); });
  var scmEl = sh.getElementById('scm'), gtnowEl = sh.getElementById('gtnow');
  function doSync() {
    var m = (scmEl.value || '').trim().match(/^(\d{1,2})(?::([0-5]?\d))?$/);
    var ok = !!m && R.syncTo(+m[1] * 60 + (+m[2] || 0));
    scmEl.classList.toggle('bad', !ok); if (ok) { scmEl.value = ''; scmEl.blur(); }
  }
  sh.getElementById('syncb').addEventListener('mousedown', function (e) { e.stopPropagation(); });
  sh.getElementById('syncb').addEventListener('click', function (e) { e.stopPropagation(); doSync(); });
  scmEl.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  scmEl.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') doSync(); });
  scmEl.addEventListener('input', function () { scmEl.classList.remove('bad'); });

  (function () { var sx, sy, ox, oy, on = false;
    wEl.addEventListener('mousedown', function (e) { if (e.target.closest('.ctl')) return; on = true; wEl.classList.add('drag'); var r = host.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!on) return; var l = Math.max(0, Math.min(innerWidth - 80, ox + e.clientX - sx)), t = Math.max(0, Math.min(innerHeight - 24, oy + e.clientY - sy)); host.style.left = l + 'px'; host.style.top = t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; });
    window.addEventListener('mouseup', function () { if (!on) return; on = false; wEl.classList.remove('drag'); var r = host.getBoundingClientRect(), v = mainVideo(), rv = v && v.getBoundingClientRect(); if (!rv) return; XY = {rx: +((r.left - rv.left) / rv.width).toFixed(4), ry: +((r.top - rv.top) / rv.height).toFixed(4)}; ls('rp_xy8', JSON.stringify(XY)); });
  })();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function mmss(x) { x = Math.max(0, Math.round(x)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); }
  function miniSpark(sm) {
    if (!sm || sm.length < 2) return '<svg viewBox="0 0 96 30"></svg>';
    var W = 96, H = 30, t0 = sm[0].gt, t1 = sm[sm.length - 1].gt, span = Math.max(1, t1 - t0);
    var xy = sm.map(function (s) { var v = Math.max(0, Math.min(1, s.p)); return [(s.gt - t0) / span * W, H - 2 - v * (H - 4)]; });
    var line = 'M' + xy.map(function (a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join(' L');
    var area = line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z', mid = H / 2;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="z" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="'+RPC.a+'" stop-opacity=".4"/><stop offset=".5" stop-color="'+RPC.a+'" stop-opacity=".05"/><stop offset=".5" stop-color="'+RPC.b+'" stop-opacity=".05"/><stop offset="1" stop-color="'+RPC.b+'" stop-opacity=".4"/></linearGradient></defs><line x1="0" y1="' + mid + '" x2="' + W + '" y2="' + mid + '" stroke="#2a2f3a" stroke-width="1" stroke-dasharray="3 3"/><path d="' + area + '" fill="url(#z)"/><path d="' + line + '" fill="none" stroke="#f2f4f7" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  var hist = [], lastMom = 0, lastFightGt = -1, fightTimer = null;
  // pelea en equipo (5v5): aparece solo al terminar una, unos segundos, con lo que pasó en ella (todo del feed oficial)
  var CHV = null;
  function caraCampeon(id) {
    if (!CHV) { CHV = 'cargando'; fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(function (r) { return r.json(); }).then(function (v) { CHV = v[0]; }).catch(function () { CHV = null; }); }
    return CHV && CHV !== 'cargando' ? '<img class="fc" src="https://ddragon.leagueoflegends.com/cdn/' + CHV + '/img/champion/' + encodeURIComponent(id) + '.png" alt="">' : '<span class="fc"></span>';
  }
  function showFight(s) {
    if (!DMG) return;
    var f = s.game && s.game.fight;
    if (!f || f.gt == null || !f.blue || !f.red || f.kb == null) return;
    if (f.gt === lastFightGt) return;  // ya mostrada
    lastFightGt = f.gt;
    if (s.game.gt - f.gt > 40) return;  // vieja (por ejemplo, al saltar en un VOD)
    var m = s.match, mx = 0.5;
    f.blue.concat(f.red).forEach(function (p) { mx = Math.max(mx, Math.abs(p.dsh)); });
    var fila = function (p, cls) {
      var w = Math.round(Math.min(1, Math.abs(p.dsh) / mx) * 100), sg = p.dsh > 0.05 ? '+' : p.dsh < -0.05 ? '−' : '';
      return '<div class="frow ' + cls + (p.part ? '' : ' fuera') + '">' + caraCampeon(p.champId) +
        '<span class="fn">' + (p.tipo ? '<span class="tp" title="daño ' + p.tipo + ' (por su campeón)">' + {'físico': '⚔', 'mágico': '✦', 'mixto': '◐'}[p.tipo] + '</span> ' : '') + esc(p.name) + (p.d > 0 ? ' <i title="murió en la pelea">☠</i>' : '') + '</span>' +
        '<span class="fk">' + p.k + '/' + p.d + '/' + p.a + '</span>' +
        '<span class="fb" title="Cuánto cambió su parte del daño de su equipo en la pelea"><i style="width:' + w + '%" class="' + (p.dsh >= 0 ? 'mas' : 'menos') + '"></i></span>' +
        '<span class="fd">' + sg + Math.abs(p.dsh).toFixed(1).replace('.', ',') + '</span></div>';
    };
    var gana = f.win ? (f.win === 'blue' ? m.blue.code : m.red.code) : null, kc = function (g) { return (Math.abs(g) / 1000).toFixed(1).replace('.', ',') + 'k'; };
    var extra = [];
    if (f.oro) extra.push('oro <b class="b">+' + kc(f.oro.blue) + '</b> · <b class="r">+' + kc(f.oro.red) + '</b>');
    if (f.obj) extra.push('después: <b class="' + (f.obj.side === 'blue' ? 'b' : 'r') + '">' + esc(f.obj.txt) + '</b>');
    if (f.p0 != null && f.p1 != null) extra.push(esc(m.blue.code) + ' ' + Math.round(f.p0 * 100) + '% → <b>' + Math.round(f.p1 * 100) + '%</b>');
    dmgEl.innerHTML = '<div class="dh"><span>Pelea en equipo · min ' + mmss(f.ini != null ? f.ini : f.gt) + '</span><span class="wl">' + (gana ? esc(gana) + ' la gana' : 'pareja') + '</span></div>' +
      '<div class="fsc"><b class="b">' + esc(m.blue.code) + ' ' + f.kb + '</b><span>–</span><b class="r">' + f.kr + ' ' + esc(m.red.code) + '</b></div>' +
      (extra.length ? '<div class="fx">' + extra.join(' · ') + '</div>' : '') +
      '<div class="fcols"><div>' + f.blue.map(function (p) { return fila(p, 'b'); }).join('') + '</div><div>' + f.red.map(function (p) { return fila(p, 'r'); }).join('') + '</div></div>' +
      '<div class="fl">K/D/A en la pelea · barra: cuánto más (o menos) daño que su promedio hizo en la pelea<br>⚔ físico · ✦ mágico · ◐ mixto, según su campeón</div>';
    dmgEl.classList.add('show');
    clearTimeout(fightTimer); fightTimer = setTimeout(function () { dmgEl.classList.remove('show'); }, 11000);
  }
  // el overlay se ve solo cuando el juego está en pantalla (el HUD con su reloj, leído al menos dos veces seguidas).
  // Repetición, desk, publicidad, entrevista o multivista: no queda nada a la vista. Al mover el mouse aparece un aviso chico.
  var MOSTRAR = 0, MOUSE = 0;
  // el juego terminó: el resultado se ve unos segundos y después nada (los mejores momentos muestran el HUD, pero no hay que estorbar)
  var FIN = null;
  function terminado(s) {
    var g = s && s.game;
    if (!g || !g.ended) { FIN = null; return false; }
    if (!FIN || FIN.id !== g.id) FIN = {id: g.id, at: Date.now()};
    return true;
  }
  function oculto(s) {
    if (typeof AS === 'undefined' || !AS.on || !L || Date.now() <= MOSTRAR) return false;
    if (!(AS.buenas >= 2 && Date.now() - AS.visto <= 5000)) return true;
    // en una transmisión en vivo solo se acompaña al juego que se está jugando (no a clips, repeticiones ni mejores momentos)
    if (!esVod() && (!AS.id || !AS.id.live)) return true;  // en vivo: aparece recién al reconocer el juego en curso
    if (terminado(s) && Date.now() - FIN.at > 6000) return true;
    return false;
  }
  // en lolesports.com el video va en un reproductor aparte (de Twitch o YouTube) que el overlay no puede leer: se ofrece abrirlo en Twitch
  function enLolesports() {
    if (!/(^|\.)lolesports\.com$/.test(location.hostname) || mainVideo()) return null;
    var fr = null; document.querySelectorAll('iframe').forEach(function (f) { var r = f.getBoundingClientRect(); if (r.width > 300 && /twitch\.tv|youtube/.test(f.src || '')) fr = f; });
    if (!fr) return null;
    var ch = /twitch\.tv/.test(fr.src) && (fr.src.match(/[?&]channel=([\w]+)/) || [])[1];
    return 'https://www.twitch.tv/' + (ch || 'riotgames');
  }
  // el aviso chico aparece solo donde tiene sentido: una página con el juego (el HUD ya se leyó), lolesports, o un stream de LoL
  // con el Mundial en vivo. En cualquier otro stream de Twitch, RiftPulse no molesta.
  function esStreamDeLoL() { return !!document.querySelector('a[href*="/directory/category/league-of-legends"],a[href*="/directory/game/League"]'); }
  function relevante() {
    if (typeof AS === 'undefined') return false;
    return AS.vistoAlguna || !!enLolesports() || !!(LAST && LAST.match && esStreamDeLoL());
  }
  function motivo() {
    var st = (AS.diag && AS.diag.estado) || '';
    if (/no se puede leer/.test(st)) return 'este video está protegido y no se puede leer';
    if (LAST && LAST.feed && LAST.feed.estado === 'caido') return 'sin conexión con lolesports · reintento solo';
    if (AS.id) return 'vuelve con el juego';
    if (/no reconozco/.test(st)) return 'todavía no reconozco este partido';
    return 'aparece cuando el juego está en pantalla';
  }
  function pintarHint() {
    var oc = wEl.classList.contains('oculto'), ver = oc && Date.now() - MOUSE < 3000 && relevante();
    hintEl.classList.toggle('show', ver);
    if (!ver) return;
    var lol = enLolesports();
    hintEl.innerHTML = LOGO + '<span>' + (lol ? 'Para ver RiftPulse sobre el video, <a href="' + lol + '" target="_blank" rel="noopener">abrí este partido en Twitch →</a>' : '<b>RiftPulse</b> · ' + motivo()) + '</span>';
  }
  document.addEventListener('mousemove', function () { MOUSE = Date.now(); }, {passive: true});
  if (/lolesports\.com$/.test(location.hostname)) MOUSE = Date.now() + 8000;  // en lolesports, el aviso se ve solo al entrar
  setInterval(pintarHint, 600);
  hintEl.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  hintEl.addEventListener('click', function (e) { if (e.target.closest('a')) return; e.stopPropagation(); MOSTRAR = Date.now() + 20000; if (LAST) render(LAST); });  // ver los controles un rato
  function render(s) {
    var oc = oculto(s);
    wEl.classList.toggle('oculto', oc); pintarHint();
    if (oc) {
      LAST = s; tarjetas(null);
      if (typeof tlEl !== 'undefined' && tlEl) tlEl.classList.remove('on'); dmgEl.classList.remove('show'); momEl.classList.remove('show');
      return;
    }
    render0(s);
    var quieto = !!body.querySelector('.wait') || !!(s.game && s.game.ended);  // al terminar, nada de paneles sobre los mejores momentos
    tarjetas(quieto ? null : s);
    if (quieto) { if (typeof tlEl !== 'undefined' && tlEl) tlEl.classList.remove('on'); dmgEl.classList.remove('show'); momEl.classList.remove('show'); }
  }
  function render0(s) {
    LAST = s;
    if (s.match && window.RPUI) { RPUI.colores(s.match.blue.code, s.match.red.code, host); RPUI.colores(s.match.blue.code, s.match.red.code, host2); }
    gtnowEl.textContent = s.game && s.game.pBlue != null ? mmss(s.game.gt) : '—';
    // con el auto-sync activo nunca se muestra otro partido: mientras reconoce el del video, lo dice
    var leyendo = typeof AS !== 'undefined' && AS.on && Date.now() - AS.visto < 20000;
    if (leyendo && (!AS.id || AS.trasSalto || !s.match || s.match.id !== AS.id.matchId)) {
      body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div><div class="wait">' + (AS.id && !AS.trasSalto ? 'Cargando ' + esc(AS.id.codes.join(' vs ')) + ' · juego ' + AS.id.juego + '…' : 'Sincronizando con el video…') + '</div>';
      return;
    }
    if (s.game && s.game.carga != null && s.match) {  // entrando a mitad de juego: se pone al día con lo que ya pasó
      body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div><div class="wait">Poniéndome al día · ' + esc(s.match.blue.code) + ' vs ' + esc(s.match.red.code) + ' · ' + Math.round(s.game.carga * 100) + ' %</div>';
      return;
    }
    if (s.match && s.game && s.game.ended) {
      var gw = s.game.recap && s.game.recap.code;
      body.innerHTML = '<div class="mini">' + LOGO + (gw ? '<span class="' + (gw === s.match.blue.code ? 'b' : 'r') + '">' + esc(gw) + '</span><span class="k">gana el juego</span>' : '<span class="k">Terminó el juego</span>') + '</div>';
      return;
    }
    if (!s.match) {
      if (s.next) { body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div>' +
        '<div class="seg next"><span class="sl">Próximo partido</span><span class="vs"><span class="b">' + esc(s.next.blue) + '</span> vs <span class="r">' + esc(s.next.red) + '</span></span></div>'; }
      else body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div><div class="wait">buscando partido del Mundial…</div>';
      return;
    }
    var m = s.match, g = s.game;
    var html = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div>';

    if (!g || g.pBlue == null) {
      html += '<div class="mini"><span class="k">' + ((g && g.waiting) ? 'Cargando el juego' : 'Selección de campeones') + '</span><span class="b">' + esc(m.blue.code) + '</span><span class="k">vs</span><span class="r">' + esc(m.red.code) + '</span></div>';
      if (s.next) html += '<div class="seg next"><span class="sl">Próximo</span><span class="vs"><span class="b">' + esc(s.next.blue) + '</span> vs <span class="r">' + esc(s.next.red) + '</span></span></div>';
      body.innerHTML = html; return;
    }

    var pb = Math.round(g.pBlue * 100), pr = 100 - pb, lb = pb >= pr ? ' lead' : '', lr = pr > pb ? ' lead' : '';
    var fdo = s.feed && ['retrasado', 'caido', 'pausa'].indexOf(s.feed.estado) >= 0 ? '<div class="seg fdo"><span class="sl">' + esc(s.feed.txt) + '</span></div>' : '';
    if (EXT.indexOf('mini') >= 0) {  // modo mínimo: solo el porcentaje
      body.innerHTML = '<div class="seg prob"><span class="tc b">' + esc(m.blue.code) + '</span><div class="bar" style="width:150px"><div class="pb' + lb + '" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + pb + '%</div><div class="pr' + lr + '" style="width:' + Math.min(85, Math.max(pr, 15)) + '%">' + pr + '%</div></div><span class="tc r">' + esc(m.red.code) + '</span></div>' + fdo;
      hist.push({t: Date.now(), p: g.pBlue}); checkMomentum(s); showFight(s); return;
    }
    var hist0 = R.historia ? R.historia(s).map(function (x) { return x.text; }).join('\n') : '';
    html += '<div class="seg prob2"' + (hist0 ? ' title="' + esc(hist0) + '"' : '') + '><div class="tm a' + lb + '"><span class="code">' + esc(m.blue.code) + '</span><span class="pct"><span data-rpn="ext-a">' + pb + '</span><small>%</small></span></div>' +
      '<div class="meter"><i style="width:' + pb + '%"></i><b></b></div>' +
      '<div class="tm b' + lr + '"><span class="pct"><span data-rpn="ext-b">' + pr + '</span><small>%</small></span><span class="code">' + esc(m.red.code) + '</span></div></div>';

    if (EXT.indexOf('obj') >= 0 && g.impact) {
      var im = g.impact, ib = Math.max(0, im.blue), ir = Math.max(0, im.red), bigB = ib >= ir;
      html += '<div class="seg obj"><span class="sl">' + (im.at <= g.gt ? esc(im.obj) + ' · ya está' : 'Próx. ' + esc(im.obj) + ' · ' + mmss(im.at - g.gt)) + '</span>' +
        '<span class="sv"><b class="' + (bigB ? 'b' : 'r') + '">' + esc(bigB ? m.blue.code : m.red.code) + ' +' + Math.max(ib, ir) + '</b> <span class="mut">' + esc(bigB ? m.red.code : m.blue.code) + ' +' + Math.min(ib, ir) + '</span></span></div>';
    }
    if (EXT.indexOf('pg') >= 0) {
      html += '<div class="seg spark">' + miniSpark(g.samples || []) + '<div style="display:flex;flex-direction:column"><span class="sl">trayectoria</span><span class="sv">' + esc(pb >= pr ? m.blue.code : m.red.code) + ' ' + Math.max(pb, pr) + '%</span></div></div>';
    }
    // el acierto medido del modelo en este minuto del juego (sube a medida que avanza)
    html += fdo;
    html += '<div class="seg acc" title="Con lo que se sabe a este minuto, el modelo acertó este porcentaje de juegos que no había visto"><span class="n">' + (g.acc != null ? Math.round(g.acc * 100) + '%' : '—') + '</span><span class="l">acierta al min ' + Math.floor(g.gt / 60) + '</span></div>';

    body.innerHTML = html;
    if (window.RPUI) RPUI.numeros(body);
    pintarTL(s);
    hist.push({t: Date.now(), p: g.pBlue}); checkMomentum(s); showFight(s);
  }

  // ---------- paneles para el espectador: oro, daño, impacto y duelos (se eligen con los chips o desde Mando) ----------
  var kc = function (g) { return (Math.abs(g) / 1000).toFixed(1).replace('.', ',') + 'k'; };
  function grafOro(s) {
    var g = s.game, m = s.match, sm = (g.samples || []).filter(function (x) { return x.diff != null; });
    if (sm.length < 2) return '';
    var W = 300, H = 84, t0 = sm[0].gt, span = Math.max(60, sm[sm.length - 1].gt - t0), mx = Math.max(1500, Math.max.apply(null, sm.map(function (x) { return Math.abs(x.diff); }))) * 1.1;
    var X = function (t) { return (t - t0) / span * W; }, Y = function (d) { return H / 2 - d / mx * (H / 2 - 4); };
    var line = sm.map(function (x, i) { return (i ? 'L' : 'M') + X(x.gt).toFixed(1) + ' ' + Y(x.diff).toFixed(1); }).join(' ');
    var area = line + ' L' + X(sm[sm.length - 1].gt).toFixed(1) + ' ' + H / 2 + ' L0 ' + H / 2 + ' Z';
    var marcas = (g.events || []).filter(function (e) { return ['dragon', 'baron', 'elder', 'inhib'].indexOf(e.kind) >= 0 && e.gt >= t0; }).map(function (e) {
      var c = e.side === 'blue' ? RPC.atxt : RPC.btxt, L = {dragon: 'D', baron: 'B', elder: 'A', inhib: 'I'}[e.kind];
      return '<g><circle cx="' + X(e.gt).toFixed(1) + '" cy="' + (e.side === 'blue' ? 9 : H - 9) + '" r="7" fill="#101318" stroke="' + c + '"/><text x="' + X(e.gt).toFixed(1) + '" y="' + (e.side === 'blue' ? 12.5 : H - 5.5) + '" fill="' + c + '" font-size="9" font-weight="700" text-anchor="middle">' + L + '</text></g>';
    }).join('');
    var d = sm[sm.length - 1].diff, lado = d >= 0 ? 'b' : 'r';
    return '<div class="cd"><div class="ch"><span>Diferencia de oro</span><b class="' + lado + '">' + esc(d >= 0 ? m.blue.code : m.red.code) + ' +' + kc(d) + '</b></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="'+RPC.a+'" stop-opacity=".55"/><stop offset=".5" stop-color="'+RPC.a+'" stop-opacity=".05"/><stop offset=".5" stop-color="'+RPC.b+'" stop-opacity=".05"/><stop offset="1" stop-color="'+RPC.b+'" stop-opacity=".55"/></linearGradient></defs>' +
      '<line x1="0" y1="' + H / 2 + '" x2="' + W + '" y2="' + H / 2 + '" stroke="#2a2f3a" stroke-dasharray="3 3"/><path d="' + area + '" fill="url(#og)"/><path d="' + line + '" fill="none" stroke="#f2f4f7" stroke-width="1.6" vector-effect="non-scaling-stroke"/>' + marcas + '</svg>' +
      '<div class="lg"><span>' + mmss(t0) + '</span><span style="margin-left:auto">D dragón · B Barón · I inhib.</span><span>' + mmss(g.gt) + '</span></div></div>';
  }
  function grafDano(s) {
    var L = s.game.lanes; if (!L || !L.length) return '';
    var all = []; L.forEach(function (l) { all.push(l.blue, l.red); });
    var mx = Math.max(0.01, Math.max.apply(null, all.map(function (p) { return p.share || 0; })));
    var col = function (side, cls) { return '<div class="dcol ' + cls + '">' + L.map(function (l) { var p = l[side]; return '<div class="drow"><span class="dn">' + esc(p.name) + '</span><div class="dbar"><div style="width:' + Math.round((p.share || 0) / mx * 100) + '%"></div></div><span class="dp">' + Math.round((p.share || 0) * 100) + '%</span></div>'; }).join('') + '</div>'; };
    return '<div class="cd" style="width:420px"><div class="ch"><span>Daño a campeones · todo el juego</span><span class="mut" style="letter-spacing:.5px;text-transform:none">% de su equipo</span></div><div class="dcols">' + col('blue', 'b') + col('red', 'r') + '</div></div>';
  }
  function grafImpacto(s) {
    var g = s.game, m = s.match, im = g.impact, c = g.comeback; if (!im && !c) return '';
    var h = '<div class="cd"><div class="ch"><span>Impacto' + (im ? (im.at <= g.gt ? ' · ' : ' · próx. ') + esc(im.obj) : '') + '</span>' + (im ? '<span class="mut">' + (im.at <= g.gt ? 'ya está' : 'en ' + mmss(im.at - g.gt)) + '</span>' : '') + '</div>';
    if (im) h += '<div class="ir"><span>Si lo toma <b class="b">' + esc(m.blue.code) + '</b></span><span class="big b">' + (im.blue >= 0 ? '+' : '') + im.blue + '</span></div><div class="ir"><span>Si lo toma <b class="r">' + esc(m.red.code) + '</b></span><span class="big r">' + (im.red >= 0 ? '+' : '') + im.red + '</span></div>';
    if (c && c.paths && c.paths[0]) h += '<div class="in"><b class="' + (c.side === 'blue' ? 'b' : 'r') + '">' + esc(c.code) + '</b> (' + Math.round(c.p * 100) + '%) ' + (c.reached ? 'remonta con' : 'se acerca con') + ' <b>' + esc(c.paths[0].txt) + '</b> → ' + Math.round(c.paths[0].p * 100) + '%</div>';
    return h + '</div>';
  }
  function grafDuelos(s) {
    var L = s.game.lanes; if (!L || !L.length) return '';
    return '<div class="cd"><div class="ch"><span>Duelos por línea</span><span class="mut" style="letter-spacing:.5px;text-transform:none">oro de diferencia</span></div>' + L.map(function (l) {
      var gb = l.gd >= 0;
      return '<div class="du"><span class="nb"><span class="nm b">' + esc(l.blue.name) + '</span>' + (gb && l.gd > 99 ? '<span class="gd b">+' + kc(l.gd) + '</span>' : '') + '</span><span class="rl">' + esc(l.label) + '</span><span class="nb nr">' + (!gb && l.gd < -99 ? '<span class="gd r">+' + kc(l.gd) + '</span>' : '') + '<span class="nm r">' + esc(l.red.name) + '</span></span></div>';
    }).join('') + '</div>';
  }
  // ---------- paneles automáticos: el director del motor decide qué mostrar (nivel mínimo, estándar o show) ----------
  var DIR = R.crearDirector ? R.crearDirector(ls('rp_dir') || 'estandar') : null;
  function grafResumen(s) {
    var lines = R.recapLines ? R.recapLines(s) : []; if (!lines.length) return '';
    return '<div class="cd rs" style="width:420px"><div class="ch"><span>Resumen del juego</span></div><ul>' + lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></div>';
  }
  function grafHistoria(s) {
    var h = R.historia ? R.historia(s) : []; if (!h.length) return '';
    return '<div class="cd" style="width:420px"><div class="ch"><span>La historia del juego</span><span class="mut">min ' + mmss(s.game.gt) + '</span></div><ol class="hs">' + h.map(function (x) { return '<li>' + x.html + '</li>'; }).join('') + '</ol></div>';
  }
  var cardsSig = '';
  function tarjetas(s) {
    var h = '';
    if (s && s.game && s.game.pBlue != null) {
      if (EXT.indexOf('oro') >= 0) h += grafOro(s);
      if (EXT.indexOf('imp') >= 0) h += grafImpacto(s);
      if (EXT.indexOf('duelos') >= 0) h += grafDuelos(s);
      if (EXT.indexOf('dano') >= 0) h += grafDano(s);
      var d = DIR && DIR.decidir(s);  // lo automático no repite un panel que ya está puesto a mano
      if (d) {
        if (d.pieza === 'objetivo' && EXT.indexOf('imp') < 0) h += grafImpacto(s);
        else if (d.pieza === 'resumen') h += grafResumen(s);
        else if (d.pieza === 'historia') h += grafHistoria(s);
        else if (d.pieza === 'remontada' && EXT.indexOf('imp') < 0) h += grafImpacto(s);
        else if (d.pieza === 'oro' && EXT.indexOf('oro') < 0) h += grafOro(s);
        else if (d.pieza === 'duelos' && EXT.indexOf('duelos') < 0) h += grafDuelos(s);
      }
    }
    if (h !== cardsSig) { cardsSig = h; cardsX.innerHTML = h; }
  }

  // ---------- aviso «Sincronizado» ----------
  var toastEl = sh.getElementById('toast'), toastT = null;
  function aviso(html) { toastEl.innerHTML = '<i></i>' + html; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3200); }
  // ---------- línea de tiempo: el gráfico del juego con sus momentos; en un VOD, tocar un momento salta el video ----------
  var tlEl = sh.getElementById('tl'), TLM = [];
  function esVod() { return /\/videos\/|\/vod\//.test(location.pathname); }
  function pintarTL(s) {
    var g = s.game, sm = (g && g.samples) || [];
    tlEl.classList.toggle('on', sm.length > 1);
    if (sm.length < 2 || !wEl.matches(':hover')) return;
    var W = 600, H = 78, t1 = Math.max(60, g.gt), X = function (t) { return 8 + t / t1 * (W - 16); }, Y = function (p) { return H - 10 - p * (H - 20); };
    var line = sm.map(function (x, i) { return (i ? 'L' : 'M') + X(x.gt).toFixed(1) + ' ' + Y(x.p).toFixed(1); }).join(' ');
    var bw = function (x) { return R.banda ? R.banda(x.gt) || 0 : 0; };  // banda de confianza
    var band = 'M' + sm.map(function (x) { return X(x.gt).toFixed(1) + ' ' + Y(Math.min(1, x.p + bw(x))).toFixed(1); }).join(' L') + ' L' + sm.slice().reverse().map(function (x) { return X(x.gt).toFixed(1) + ' ' + Y(Math.max(0, x.p - bw(x))).toFixed(1); }).join(' L') + ' Z';
    TLM = [];
    (g.swings || []).forEach(function (w) { TLM.push({gt: w.a, txt: (w.side === 'blue' ? s.match.blue.code : s.match.red.code) + ' +' + Math.round(Math.abs(w.d) * 100) + ' · ' + ((R.causaTxt ? R.causaTxt(w.cause, w.side) : w.cause) || 'giro'), c: w.side === 'blue' ? RPC.a : RPC.b, r: 6}); });
    (g.events || []).forEach(function (e) { if (['dragon', 'baron', 'elder', 'inhib'].indexOf(e.kind) >= 0) TLM.push({gt: e.gt, txt: e.txt, c: e.side === 'blue' ? RPC.a : RPC.b, r: 4}); });
    TLM.sort(function (a, b) { return a.gt - b.gt; });
    var mk = TLM.map(function (m, i) { return '<g class="mk" data-tl="' + i + '"><title>' + esc(mmss(m.gt) + ' · ' + m.txt) + '</title><circle cx="' + X(m.gt).toFixed(1) + '" cy="' + (m.r > 5 ? 9 : H - 6) + '" r="' + m.r + '" fill="' + m.c + '" stroke="#101318" stroke-width="1.5"/></g>'; }).join('');
    var puede = esVod() && AS.id && AS.off != null;
    tlEl.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><line x1="0" x2="' + W + '" y1="' + Y(0.5) + '" y2="' + Y(0.5) + '" stroke="rgba(255,255,255,.18)" stroke-dasharray="4 4"/>' +
      '<path d="' + band + '" fill="#ffffff" opacity=".08"/><path d="' + line + '" fill="none" stroke="' + RPC.s + '" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="' + X(g.gt) + '" x2="' + X(g.gt) + '" y1="0" y2="' + H + '" stroke="rgba(255,255,255,.5)"/>' + mk + '</svg>' +
      '<div class="nav">' + (puede ? '<button data-salto="-10">−10 s</button><button data-salto="prev">◀ momento</button><button data-salto="next">momento ▶</button><span>Tocá un punto para ir a ese momento del video</span>' : '<span>' + (esVod() ? 'Sincronizá el video para saltar a cada momento' : 'Momentos clave del juego (en vivo no se puede saltar)') + '</span>') + '</div>';
  }
  function irA(gt) { var v = video(); if (!v || AS.off == null || !esVod()) return; v.currentTime = Math.max(0, gt - AS.off - 3); }  // 3 s antes, para ver la jugada entera
  tlEl.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  tlEl.addEventListener('click', function (e) {
    e.stopPropagation(); var v = video(); if (!v || AS.off == null) return;
    var gv = AS.off + v.currentTime;  // el minuto del juego que se ve ahora, según el video
    var m = e.target.closest('[data-tl]'); if (m) { irA(TLM[+m.getAttribute('data-tl')].gt); return; }
    var b = e.target.closest('[data-salto]'); if (!b || !esVod()) return; var k = b.getAttribute('data-salto');
    if (k === '-10') v.currentTime = Math.max(0, v.currentTime - 10);
    else if (k === 'prev') { var p = TLM.filter(function (x) { return x.gt < gv - 8; }).pop(); if (p) irA(p.gt); }
    else { var n = TLM.filter(function (x) { return x.gt > gv + 2; })[0]; if (n) irA(n.gt); }
  });

  function checkMomentum(s) {
    var now = Date.now(); hist = hist.filter(function (x) { return now - x.t <= 90000; });
    if (now - lastMom < 15000) return;
    var past = null; for (var i = 0; i < hist.length; i++) { if (now - hist[i].t >= 34000) past = hist[i]; }
    if (!past) return;
    var d = Math.round((s.game.pBlue - past.p) * 100); if (Math.abs(d) < 11) return;
    var toB = d > 0, code = toB ? s.match.blue.code : s.match.red.code;
    var ev = (s.game.events || []).filter(function (e) { return ['baron', 'elder', 'dragon', 'inhib'].indexOf(e.kind) >= 0 && s.game.gt - e.gt <= 60; }).slice(-1)[0];
    lastMom = now;
    momEl.innerHTML = '<span class="zap">⚡</span><span class="k ' + (toB ? 'b' : 'r') + '">' + esc(code) + ' +' + Math.abs(d) + '</span>' + (ev ? '<span>· ' + esc(ev.txt) + '</span>' : '<span>de golpe</span>');
    momEl.classList.add('show'); setTimeout(function () { momEl.classList.remove('show'); }, 6500);
  }

  // ---------- órdenes del centro de mando (pestaña «Mando» del panel lateral de la extensión) ----------
  function applyCmd(c, inicial) {
    if (!c) return;
    var viejo = inicial && c.v !== 7;  // una orden guardada antes de v7 no vuelve a fijar los paneles ni la posición vieja
    if (c.ext && !viejo) { EXT = c.ext.slice(); ls('rp_ext7', JSON.stringify(EXT)); syncChips(); }
    if (c.pos && !viejo) { POS = c.pos; XY = null; ls('rp_xy8', 'null'); ls('rp_pos7', POS); place(); }
    if (c.dmg != null) { DMG = !!c.dmg; ls('rp_dmg6', DMG ? '1' : '0'); if (!DMG) dmgEl.classList.remove('show'); }
    if (c.hidden != null) ocultarUsr(!!c.hidden);
    // la fuerza de los equipos que usa el panel: así los dos muestran el mismo porcentaje
    if (c.fuerza && R.setFuerza) { R.setFuerza(c.fuerza); ls('rp_fuerza', JSON.stringify(c.fuerza)); }
    if (!inicial && c.sync) R.syncTo(c.sync.secs + (Date.now() - c.sync.at) / 1000);  // las órdenes de un solo uso no se repiten al recargar
    if (!inicial && c.nudge) R.nudge(c.nudge);
    if (c.director && DIR) { DIR.nivel = c.director; ls('rp_dir', c.director); }
    if (!inicial && c.dirSaltar && DIR) DIR.saltar();
    if (LAST) render(LAST);
  }
  try { var fz0 = JSON.parse(ls('rp_fuerza') || 'null'); if (fz0 && R.setFuerza) R.setFuerza(fz0); } catch (e) {}
  var hayStorage = false;
  try { hayStorage = !!(chrome.storage && chrome.storage.local); } catch (e) {}
  if (hayStorage) {
    chrome.storage.local.get('rp_cmd', function (o) { applyCmd(o && o.rp_cmd, true); });
    chrome.storage.onChanged.addListener(function (ch, area) { if (area === 'local' && ch.rp_cmd) applyCmd(ch.rp_cmd.newValue, false); });
  } else {
    // cargado desde la web como «script de usuario»: no ve el almacenamiento, se lo pide al proceso de fondo
    var ultimaN = null;
    var pedir = function (inicial) {
      try { chrome.runtime.sendMessage({type: 'rp-cmd-get'}, function (o) {
        var c = o && o.rp_cmd; if (!c || c.n === ultimaN) return;
        ultimaN = c.n; applyCmd(c, inicial);
      }); } catch (e) {}
    };
    pedir(true); setInterval(function () { pedir(false); }, 1500);
  }

  // ---------- sincronía automática: lee del video el reloj del juego, los equipos y el marcador ----------
  // Sirve en vivo o en repetición, a cualquier hora: el minuto se ata a la posición del video (pausa, velocidad,
  // saltos y cortes de carga incluidos). El lector (lector.js) no usa librerías ni servicios externos.
  var L = window.RiftLector;
  // HUD de la transmisión del Mundial 2026, relativo al cuadro del video (medido sobre cuadros reales de la transmisión).
  // El reloj y el oro se recortan justos: a los costados hay íconos (objetivos, monedas, la ventaja de oro) que ensucian la lectura
  var HUD = {
    reloj: [0.474, 0.064, 0.528, 0.1],
    tagI: [0.29, 0.0, 0.375, 0.055], tagD: [0.625, 0.0, 0.715, 0.055],
    oroI: [0.418, 0.016, 0.462, 0.049], oroD: [0.542, 0.016, 0.579, 0.049],
    killI: [0.468, 0.01, 0.497, 0.065], killD: [0.503, 0.01, 0.533, 0.065],
    camI: [0.372, 0.393], camD: [0.607, 0.628], camY: [0.761, 0.81, 0.859, 0.907, 0.953], camH: 0.042,
    // las victorias de cada equipo en la serie: los rectángulos apilados junto a cada logo (se llenan con el color del lado)
    serieI: [0.2715, 0.016, 0.276, 0.06], serieD: [0.724, 0.016, 0.7285, 0.06]
  };
  // si el reloj no está en su lugar, se busca solo en la franja del marcador (arriba al centro), nunca en otras zonas
  var RELOJES = [HUD.reloj, [0.466, 0.04, 0.534, 0.125], [0.466, 0.0, 0.534, 0.065], [0.466, 0.085, 0.534, 0.155]];
  var AS = {t0: Date.now(), on: ls('rp_auto6') !== '0', busy: false, zona: null, fallas: 0, lect: [], contra: [], off: null, id: null, vid: null, visto: 0, codes: null, codesAt: 0, n: 0, malas: 0, pend: null, trasSalto: false, diag: {}, err: ''};
  // «mm:ss»; sin los dos puntos solo se acepta en la zona principal del reloj
  if (window.RP_DEBUG) { window.__rpAS = AS; window.__rpRender = function (f) { return render(f(LAST)); }; }  // solo para las pruebas
  function parseReloj(s, conPuntos) {
    s = String(s || '').replace(/[^\d:]/g, '');
    var m = s.match(/^(\d{1,2}):(\d{2})$/) || (!conPuntos && s.match(/^(\d{1,2})(\d{2})$/));
    if (!m || +m[2] > 59 || +m[1] > 75) return null;
    return +m[1] * 60 + +m[2];
  }
  // lecturas posibles del reloj: la del lector y, por cada dígito, su segunda opción (un 0 leído como 2, etc.)
  function variantes(det, conPuntos) {
    var base = det.map(function (d) { return d.c; }).join(''), out = [], g = parseReloj(base, conPuntos);
    if (g != null) out.push({gt: g, alt: false});
    det.forEach(function (d, i) {
      if (!d.c2 || !/\d/.test(d.c)) return;
      var t = det.map(function (x, j) { return j === i ? d.c2 : x.c; }).join(''), g2 = parseReloj(t, conPuntos);
      if (g2 != null) out.push({gt: g2, alt: true});
    });
    return out;
  }
  function oro(s) {  // «3.1K», «31K» o «3.1» -> 3.1 (miles)
    s = String(s || '').replace(/[^\d.]/g, ''); if (!s) return null;
    if (s.indexOf('.') < 0 && s.length >= 4) s = s.slice(0, 3);  // «1740»: la K leída como dígito (el oro nunca pasa de 99,9k)
    if (s.indexOf('.') < 0 && s.length >= 2) s = s.slice(0, -1) + '.' + s.slice(-1);
    var v = parseFloat(s); return v > 0 && v < 150 ? v : null;
  }
  // oro posible de un equipo en el minuto m: arranca en 2,5k y crece entre ~0,6k y ~2,6k por minuto
  function oroPosible(x, gt) { var m = gt / 60; return x != null && x >= 2.3 + 0.6 * Math.max(0, m - 1) && x <= 2.8 + 2.6 * m; }
  // el oro del HUD, solo si los dos lados se leen bien y son coherentes entre sí
  function oroHUD(v) {
    var oI = oro(L.numeros(L.recorte(v, HUD.oroI, 'blanco'), '0123456789K')), oD = oro(L.numeros(L.recorte(v, HUD.oroD, 'blanco'), '0123456789K'));
    // los dos valores tienen que ser posibles (al menos los 2,5k iniciales) y parecidos entre sí; si no, el oro no se usa
    if (oI == null || oD == null || oI < 2.4 || oD < 2.4 || Math.max(oI, oD) / Math.min(oI, oD) > 1.45) return null;
    return [oI, oD];
  }
  // victorias en la serie según el HUD, [izquierda, derecha]: cuántos tramos llenos del color del lado hay en cada columna.
  // Solo cuenta lo que se ve lleno: sin ningún rectángulo lleno no afirma nada (devuelve null), así un HUD distinto no confunde.
  var SERIE_CV = null;
  function victoriasHUD(v) {
    try {
      if (!SERIE_CV) { SERIE_CV = document.createElement('canvas'); SERIE_CV.width = 4; SERIE_CV.height = 48; }
      var x = SERIE_CV.getContext('2d', {willReadFrequently: true}), W = v.videoWidth, H = v.videoHeight;
      var cuenta = function (z, azul) {
        x.drawImage(v, z[0] * W, z[1] * H, (z[2] - z[0]) * W, (z[3] - z[1]) * H, 0, 0, 4, 48);
        var d = x.getImageData(0, 0, 4, 48).data, tramos = 0, largo = 0, llenas = 0;
        for (var y = 0; y <= 48; y++) {
          var lleno = false;
          if (y < 48) {
            var r = 0, g = 0, b = 0;
            for (var c = 0; c < 4; c++) { var i = (y * 4 + c) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; }
            r /= 4; g /= 4; b /= 4;
            lleno = azul ? b > 110 && b - r > 50 : r > 110 && r - Math.max(g, b) > 50;
          }
          if (lleno) { largo++; llenas++; }
          else { if (largo >= 6) tramos++; largo = 0; }
        }
        return llenas > 44 ? -1 : tramos;  // todo lleno de punta a punta: es la barra del lado, no los rectángulos
      };
      var a = cuenta(HUD.serieI, true), b2 = cuenta(HUD.serieD, false);
      if (a < 0 || b2 < 0 || a + b2 === 0 || a > 3 || b2 > 3) return null;
      return [a, b2];
    } catch (e) { return null; }
  }
  var autoc = sh.getElementById('autoc'), astEl = sh.getElementById('ast'), diagEl = sh.getElementById('diag');
  function asEstado(t, ok) { astEl.textContent = t; astEl.classList.toggle('ok', !!ok); AS.diag.estado = t; }
  function asChip() { autoc.classList.toggle('on', AS.on); ctl.classList.toggle('auto', AS.on); if (!AS.on) asEstado(''); }
  asChip();
  autoc.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  autoc.addEventListener('click', function (e) { e.stopPropagation(); AS.on = !AS.on; ls('rp_auto6', AS.on ? '1' : '0'); AS.id = null; AS.off = null; AS.lect = []; AS.contra = []; asChip(); if (!AS.on) R.follow(null); if (LAST) render(LAST); });
  sh.getElementById('diagb').addEventListener('mousedown', function (e) { e.stopPropagation(); });
  sh.getElementById('diagb').addEventListener('click', function (e) { e.stopPropagation(); diagEl.classList.toggle('show'); pintarDiag(); });
  // el video que se mide queda fijo (un aviso o una vista previa no lo reemplazan)
  function video() {
    var v = AS.vid;
    if (v && v.isConnected && v.videoWidth && v.getBoundingClientRect().width > 200) return v;
    return (AS.vid = mainVideo());
  }
  // lo que se ve en pantalla, para el centro de mando del panel
  function publicar() {
    var v = video() || {};
    var d = AS.id ? {matchId: AS.id.matchId, juego: AS.id.juego, gameId: AS.id.gameId, codes: AS.id.codes, gt: AS.off != null ? AS.off + v.currentTime : null, off: AS.off != null ? AS.off : null, playing: !v.paused, vod: esVod(), at: Date.now()} : null;
    try { if (chrome.storage && chrome.storage.local) chrome.storage.local.set({rp_pantalla: d}); else chrome.runtime.sendMessage({type: 'rp-pantalla', data: d}, function () { void chrome.runtime.lastError; }); } catch (e) {}
  }
  function soltar() {
    AS.id = null; AS.off = null; AS.lect = []; AS.contra = []; AS.trasSalto = false; AS.playing = null; AS.pend = null;
    R.follow(null); publicar();
  }
  // atar el motor al video: minuto = desfase + posición del video
  function seguir(v) {
    if (!AS.id || AS.off == null || !v) return;
    var gt = Math.max(0, AS.off + v.currentTime), g = LAST && LAST.game, playing = !v.paused && !v.ended && v.readyState > 2;
    var esp = g && g.gt != null && LAST.match && LAST.match.id === AS.id.matchId ? g.gt : null;
    if (esp == null || Math.abs(esp - gt) > 1.5 || AS.playing !== playing || AS.speed !== v.playbackRate) {
      AS.playing = playing; AS.speed = v.playbackRate;
      R.follow({matchId: AS.id.matchId, juego: AS.id.juego, gt: gt, playing: playing, speed: v.playbackRate || 1, at: Date.now()});
    }
  }
  async function codigos() {
    if (AS.codes && Date.now() - AS.codesAt < 600000) return AS.codes;
    var ms = await R.loadMatches(), set = {};
    (ms || []).forEach(function (x) { x.teams.forEach(function (t) { if (t.code) set[t.code] = 1; }); });
    AS.codes = Object.keys(set); AS.codesAt = Date.now(); return AS.codes;
  }
  // ---------- campeones en pantalla (para distinguir juegos de una misma serie) ----------
  var DDV = null, ICONOS = {};
  function icono(id) {
    if (ICONOS[id]) return ICONOS[id];
    return (ICONOS[id] = (async function () {
      if (!DDV) DDV = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json())[0];
      var im = new Image(); im.crossOrigin = 'anonymous'; im.src = 'https://ddragon.leagueoflegends.com/cdn/' + DDV + '/img/champion/' + encodeURIComponent(id) + '.png';
      await im.decode(); return firma(im, [0.1, 0.1, 0.9, 0.9]);
    })().catch(function () { return null; }));
  }
  function firma(src, z) {  // 8×8 en color, normalizada
    var c = document.createElement('canvas'); c.width = c.height = 8;
    var x = c.getContext('2d', {willReadFrequently: true}), w = src.videoWidth || src.naturalWidth, h = src.videoHeight || src.naturalHeight;
    x.drawImage(src, z[0] * w, z[1] * h, (z[2] - z[0]) * w, (z[3] - z[1]) * h, 0, 0, 8, 8);
    var d = x.getImageData(0, 0, 8, 8).data, v = [], s = 0, n = 0, i;
    for (i = 0; i < d.length; i += 4) v.push(d[i], d[i + 1], d[i + 2]);
    for (i = 0; i < v.length; i++) s += v[i]; s /= v.length;
    for (i = 0; i < v.length; i++) { v[i] -= s; n += v[i] * v[i]; }
    n = Math.sqrt(n) || 1; return v.map(function (a) { return a / n; });
  }
  async function porCampeones(v, cands) {
    var caras = {blue: [], red: []};
    HUD.camY.forEach(function (y) {
      caras.blue.push(firma(v, [HUD.camI[0], y, HUD.camI[1], y + HUD.camH]));
      caras.red.push(firma(v, [HUD.camD[0], y, HUD.camD[1], y + HUD.camH]));
    });
    var mejor = null;
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i], tot = 0, n = 0;
      for (var side in caras) {
        var ics = await Promise.all((c.champs[side] || []).map(icono));
        caras[side].forEach(function (f) { var b = -1; ics.forEach(function (ic) { if (ic) { var s = 0; for (var k = 0; k < f.length; k++) s += f[k] * ic[k]; b = Math.max(b, s); } }); if (b > -1) { tot += b; n++; } });
      }
      c.caras = n ? tot / n : null;
      if (c.caras != null && (!mejor || c.caras > mejor.caras)) mejor = c;
    }
    return mejor;
  }
  // el color de las siglas en el HUD: si es de marca (no el azul o el rojo del lado), se aprende para ese equipo
  function colorHUD(v, codes) {
    try {
      [[HUD.tagI, codes[0]], [HUD.tagD, codes[1]]].forEach(function (z) {
        var c = document.createElement('canvas'); c.width = 48; c.height = 16; var x = c.getContext('2d', {willReadFrequently: true});
        x.drawImage(v, z[0][0] * v.videoWidth, z[0][1] * v.videoHeight, (z[0][2] - z[0][0]) * v.videoWidth, (z[0][3] - z[0][1]) * v.videoHeight, 0, 0, 48, 16);
        var d = x.getImageData(0, 0, 48, 16).data, sum = [0, 0, 0], n = 0;
        for (var i = 0; i < d.length; i += 4) { var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mx > 110 && mx - mn > 80) { sum[0] += d[i]; sum[1] += d[i + 1]; sum[2] += d[i + 2]; n++; } }
        if (n < 12) return;
        var r = sum[0] / n, g = sum[1] / n, b = sum[2] / n, mx2 = Math.max(r, g, b), mn2 = Math.min(r, g, b), dd = mx2 - mn2, h = 0;
        if (dd) h = mx2 === r ? ((g - b) / dd) % 6 : mx2 === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h = (h * 60 + 360) % 360;
        var lado = Math.min(Math.abs(h - 215), 360 - Math.abs(h - 215)) < 30 || Math.min(Math.abs(h - 355), 360 - Math.abs(h - 355)) < 25;
        if (!lado && R.aprenderColor) R.aprenderColor(z[1], '#' + [r, g, b].map(function (q) { return ('0' + Math.round(q).toString(16)).slice(-2); }).join(''));
      });
    } catch (e) {}
  }
  async function identificar(v, gt) {
    var C = await codigos(), lee = function (z, m) { return L.numeros(L.recorte(v, z, 'blanco'), m); };
    var sI = L.siglas(L.recorte(v, HUD.tagI, 'color'), C), sD = L.siglas(L.recorte(v, HUD.tagD, 'color'), C);
    var sig = function (s) { return s[0] && s[0].s > 0.15 && (!s[1] || s[0].s - s[1].s > 0.1) ? s[0].code : ''; };
    var kI = parseInt(lee(HUD.killI), 10), kD = parseInt(lee(HUD.killD), 10), og = oroHUD(v), oI = og && og[0], oD = og && og[1];
    // el oro tiene que ser posible para ese minuto (si no, es una mala lectura y no se usa)
    if (!oroPosible(oI, gt) || !oroPosible(oD, gt)) { oI = oD = null; }
    if (kI > 80 || kD > 80) kI = kD = NaN;
    var mapa = function (s) { var m = {}; s.forEach(function (x) { m[x.code] = x.s; }); return m; };
    var vs = victoriasHUD(v); AS.diag.serie = vs ? vs.join('–') : 'no se ve';
    var o = {gt: gt, vivo: !esVod(), juego: vs ? vs[0] + vs[1] + 1 : null, tags: [sig(sI), sig(sD)], sig: sI.length && sD.length ? [mapa(sI), mapa(sD)] : null, kills: isFinite(kI) && isFinite(kD) ? [kI, kD] : null, gold: oI != null && oD != null ? [oI, oD] : null};
    AS.diag.siglas = [sI.slice(0, 3), sD.slice(0, 3)]; AS.diag.marcador = o;
    var id = await R.identify(o);
    if (id && id.alts && id.alts.length) {  // empate (por ejemplo, juegos de la misma serie al principio): mirar los campeones
      var cerca = [id].concat(id.alts.filter(function (a) { return a.score - id.score < 1.5; }));
      if (o.juego) { var mismo = cerca.filter(function (a) { return a.juego === o.juego; }); if (mismo.length) cerca = mismo; }  // la serie en pantalla manda
      if (cerca.length > 1) { var c = await porCampeones(v, cerca).catch(function () { return null; }); if (c && c.caras > 0.2) id = c; AS.diag.campeones = cerca.map(function (x) { return x.codes.join('-') + ' J' + x.juego + ': ' + (x.caras == null ? '—' : x.caras.toFixed(2)); }); }
    }
    AS.diag.partido = id ? id.codes.join(' vs ') + ' · J' + id.juego + ' (dif. ' + id.score.toFixed(1) + ', ' + id.revisados + ' juegos revisados)' : 'ninguno';
    return id;
  }
  function rango(ls) { var a = Infinity, b = -Infinity; ls.forEach(function (r) { a = Math.min(a, r.ct); b = Math.max(b, r.ct); }); return b - a; }
  async function asTick() {
    if (!AS.on || AS.busy || !L || document.hidden) return;  // pestaña oculta: el lector descansa
    var v = video(); if (!v || v.readyState < 2 || !v.videoWidth) return;
    // sin juego en pantalla hace más de 2 minutos (otro stream, el desk): se lee cada 6 s en vez de cada 1,5 s
    if (Date.now() - AS.t0 > 120000 && Date.now() - (AS.visto || AS.t0) > 120000 && (AS.salto = (AS.salto || 0) + 1) % 4) return;
    AS.busy = true; AS.n++;
    try {
      var ct = v.currentTime, playing = !v.paused && !v.ended, txt = '', zi = null, vars = [], zonas = AS.zona != null ? [AS.zona] : RELOJES.map(function (z, i) { return i; });
      for (var i = 0; i < zonas.length; i++) {
        var m = L.recorte(v, RELOJES[zonas[i]], 'blanco'); txt = L.numeros(m, '0123456789');
        vars = variantes(L.detalle(), zonas[i] !== 0);
        if (diagEl.classList.contains('show') && (vars.length || i === 0)) AS.diag.img = L.png(m);
        if (vars.length) { zi = zonas[i]; break; }
      }
      AS.diag.reloj = txt || '(nada)'; AS.diag.zona = zi;
      if (AS.id && AS.off != null) publicar();  // el panel recibe el minuto siempre, se vea o no el reloj
      if (!vars.length) {
        if (++AS.fallas >= 5) AS.zona = null;
        if (Date.now() - AS.visto > 5000) AS.buenas = 0;
        // el juego no vuelve (fue una repetición o un clip en la previa, o terminó): se suelta y se vuelve al vivo.
        // un clip de un partido que no se juega ahora, en una transmisión en vivo, se suelta antes
        var limite = !esVod() && AS.id && !AS.id.live ? 25000 : 90000;
        if (AS.id && AS.visto && Date.now() - AS.visto > limite) { soltar(); asEstado('buscando el reloj del juego…'); return; }
        asEstado(AS.id ? 'sincronizado · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(AS.off + ct) + ' (reloj tapado)' : 'buscando el reloj del juego…', !!AS.id);
        seguir(v); return;
      }
      AS.fallas = 0; AS.visto = Date.now(); AS.buenas = (AS.buenas || 0) + 1; AS.vistoAlguna = true;
      // el oro (si se lee bien) descarta minutos imposibles; sin oro confiable no descarta nada
      var esperado = AS.off != null ? AS.off + ct : null, og = oroHUD(v);
      AS.diag.oro = og ? og.join('k · ') + 'k' : 'no se lee';
      var vale = og ? vars.filter(function (x) { return oroPosible(og[0], x.gt) && oroPosible(og[1], x.gt); }) : vars;
      if (!vale.length) { AS.diag.descarte = mmss(vars[0].gt) + ' (imposible con el oro en pantalla)'; asEstado(AS.id ? 'sincronizado · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(esperado) : 'leyendo el reloj…', !!AS.id); seguir(v); return; }
      var cerca = esperado != null ? vale.filter(function (x) { return Math.abs(x.gt - esperado) <= 2.5; })[0] : null;
      var gt, off;
      AS.zona = zi;
      if (cerca) {
        // coincide con el ancla (aunque sea con la segunda opción de un dígito): se afina sin saltos
        gt = cerca.gt; off = gt - ct; AS.contra = []; AS.trasSalto = false;
        if (Math.abs(off - AS.off) > 1.2) AS.off = off;
      } else {
        // no coincide (o todavía no hay ancla): gana el minuto que aparece en más lecturas, contando las segundas
        // opciones de cada dígito, y además tiene que avanzar igual que el video
        var lista = AS.off == null ? AS.lect : AS.contra;
        lista.push({ct: ct, playing: playing, g: vale.map(function (x) { return x.gt; }), o: vale[0].alt ? null : vale[0].gt}); if (lista.length > 10) lista.shift();
        var mejor = null;
        vale.forEach(function (x) {
          var o = x.gt - ct, apoyan = lista.filter(function (r) { return r.g.some(function (g) { return Math.abs(g - r.ct - o) <= 1; }); });
          var directas = lista.filter(function (r) { return r.o != null && Math.abs(r.o - r.ct - o) <= 1; }).length;
          if (!mejor || apoyan.length > mejor.n || (apoyan.length === mejor.n && directas > mejor.d)) mejor = {gt: x.gt, off: o, n: apoyan.length, d: directas, span: rango(apoyan)};
        });
        var hace = AS.off == null || AS.trasSalto ? 3 : 5, avanza = playing ? mejor.span >= (hace - 1) * 1.2 : true;
        // el ganador tiene que estar en casi todas las lecturas recientes, no solo en algunas
        var mayoria = mejor.n >= Math.max(hace, Math.ceil(lista.length * 0.7));
        AS.diag.confirmando = mejor.n + '/' + lista.length + ' lecturas de ' + mmss(mejor.gt);
        if (!mayoria || !avanza) { asEstado(AS.id ? 'sincronizado · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(esperado) + ' (confirmando ' + mmss(mejor.gt) + ')' : 'leyendo el reloj… ' + mmss(mejor.gt), !!AS.id); seguir(v); return; }
        gt = mejor.gt; off = mejor.off;
        var salto = AS.off == null || Math.abs(off - AS.off) > 30;
        AS.off = off; AS.lect = []; AS.contra = []; AS.trasSalto = false;
        if (salto) AS.id = null;  // otro juego (o el primer anclaje): identificar de nuevo
      }
      AS.diag.desfase = AS.off; AS.diag.confirmando = '';
      if (!AS.id) {
        asEstado('reconociendo el partido…');
        var id = await identificar(v, gt);
        if (id) {
          var nuevo = !AS.id || AS.id.gameId !== id.gameId;
          AS.id = id; AS.playing = null; AS.malas = 0; AS.pend = null;
          if (nuevo) aviso('Sincronizado · <span class="ca">' + esc(id.codes[0]) + '</span> vs <span class="cb">' + esc(id.codes[1]) + '</span> · juego ' + id.juego + ' · ' + mmss(gt));
          AS.serie = victoriasHUD(v);
          colorHUD(v, id.codes);
        }
        else { asEstado('no reconozco el partido (mirá el diagnóstico)'); return; }
      } else if (AS.n % 7 === 0) await verificar(v, gt);  // cada ~10 s
      seguir(v); publicar();
      asEstado('sincronizado · ' + AS.id.codes.join(' vs ') + ' · J' + AS.id.juego + ' · ' + mmss(gt), true);
    } catch (err) {
      asEstado(/insecure|tainted|SecurityError/i.test(String(err)) ? 'este video no se puede leer (protegido)' : 'no pude leer el video, reintento…');
    } finally { AS.busy = false; pintarDiag(); if (LAST) render(LAST); }
  }
  // control de confirmación: las kills del HUD contra las del feed oficial en ese minuto. Solo se cambia de juego
  // si no coinciden 3 controles seguidos y otro juego gana por amplio margen dos veces seguidas.
  async function verificar(v, gt) {
    // la serie en pantalla (victorias de cada equipo) dice qué juego es: si no coincide, se reconoce de nuevo, sin esperar
    var vs = victoriasHUD(v);
    if (vs) AS.serie = vs;
    if (vs && AS.id.juego !== vs[0] + vs[1] + 1) {
      var ij = await identificar(v, gt);
      if (ij && ij.juego === vs[0] + vs[1] + 1 && ij.gameId !== AS.id.gameId) { AS.id = ij; AS.playing = null; AS.malas = 0; AS.pend = null; aviso('Sincronizado · <span class="ca">' + esc(ij.codes[0]) + '</span> vs <span class="cb">' + esc(ij.codes[1]) + '</span> · juego ' + ij.juego + ' · ' + mmss(gt)); }
      return;
    }
    // en una transmisión en vivo siguiendo un juego que no es el que se juega ahora (un clip): si el del vivo cuadra, se pasa a ese
    if (!esVod() && !AS.id.live) {
      var iv = await identificar(v, gt);
      if (iv && iv.live && iv.gameId !== AS.id.gameId) { AS.id = iv; AS.playing = null; AS.malas = 0; AS.pend = null; aviso('Sincronizado · <span class="ca">' + esc(iv.codes[0]) + '</span> vs <span class="cb">' + esc(iv.codes[1]) + '</span> · juego ' + iv.juego + ' · ' + mmss(gt)); }
      return;
    }
    var kI = parseInt(L.numeros(L.recorte(v, HUD.killI, 'blanco')), 10), kD = parseInt(L.numeros(L.recorte(v, HUD.killD, 'blanco')), 10);
    var st = LAST && LAST.game && LAST.match && LAST.match.id === AS.id.matchId && LAST.game.stats;
    if (!st || !isFinite(kI) || !isFinite(kD)) { AS.diag.control = 'sin datos para comparar'; return; }
    var ok = Math.abs(st.blue.kills - kI) + Math.abs(st.red.kills - kD) <= 1;
    AS.diag.control = 'kills HUD ' + kI + '–' + kD + ' / feed ' + st.blue.kills + '–' + st.red.kills + (ok ? ' ✓' : ' ✗');
    if (ok) { AS.malas = 0; AS.pend = null; return; }
    if (++AS.malas < 3) return;
    var id = await identificar(v, gt); if (!id) return;
    var todos = [id].concat(id.alts || []), actual = todos.filter(function (x) { return x.gameId === AS.id.gameId; })[0];
    if (id.gameId !== AS.id.gameId && (!actual || id.score + 1.5 < actual.score)) {
      if (AS.pend === id.gameId) { AS.id = id; AS.playing = null; AS.malas = 0; AS.pend = null; }
      else AS.pend = id.gameId;
    } else { AS.malas = 0; AS.pend = null; }
  }
  function pintarDiag() {
    if (!diagEl.classList.contains('show')) return;
    var d = AS.diag, sg = function (s) { return (s || []).map(function (x) { return esc(x.code) + ' ' + x.s.toFixed(2); }).join(', ') || '—'; };
    var mk = d.marcador || {};
    diagEl.innerHTML = '<div class="dg-t">Qué está leyendo del video</div>' +
      '<div class="dg-r"><span>Estado</span><b>' + esc(d.estado || '—') + '</b></div>' +
      '<div class="dg-r"><span>Reloj leído</span><b>' + esc(d.reloj || '—') + (d.zona != null ? ' · zona ' + (d.zona + 1) : '') + '</b></div>' +
      (d.img ? '<img class="dg-i" src="' + d.img + '" alt="">' : '') +
      '<div class="dg-r"><span>Siglas izq.</span><b>' + sg(d.siglas && d.siglas[0]) + '</b></div>' +
      '<div class="dg-r"><span>Siglas der.</span><b>' + sg(d.siglas && d.siglas[1]) + '</b></div>' +
      '<div class="dg-r"><span>Serie en pantalla</span><b>' + esc(d.serie || '—') + '</b></div>' +
      '<div class="dg-r"><span>Kills · oro</span><b>' + (mk.kills ? mk.kills.join('–') : '—') + ' · ' + (mk.gold ? mk.gold.join('k – ') + 'k' : '—') + '</b></div>' +
      '<div class="dg-r"><span>Partido</span><b>' + esc(d.partido || '—') + '</b></div>' +
      (d.confirmando ? '<div class="dg-r"><span>Confirmando</span><b>' + esc(d.confirmando) + '</b></div>' : '') +
      (d.control ? '<div class="dg-r"><span>Control</span><b>' + esc(d.control) + '</b></div>' : '') +
      (d.descarte ? '<div class="dg-r"><span>Descartado</span><b>' + esc(d.descarte) + '</b></div>' : '') +
      (d.campeones ? '<div class="dg-r"><span>Campeones</span><b>' + esc(d.campeones.join(' · ')) + '</b></div>' : '') +
      '<div class="dg-r"><span>Video</span><b>' + (function () { var v = video(); return v ? v.videoWidth + '×' + v.videoHeight + ' · ' + mmss(v.currentTime) + (v.paused ? ' · en pausa' : '') : 'no hay video'; })() + '</b></div>' +
      '<div class="dg-n">¿No sincroniza? Sacá una captura de este cuadro y dejala en github.com/userf8a2c4/riftpulse-overlay/issues</div>';
  }
  setInterval(function () { asTick(); }, 1500);
  var OCULTO_USR = false;
  function ocultarUsr(si) { OCULTO_USR = si; host.style.display = si ? 'none' : ''; host2.style.display = si ? 'none' : ''; }
  sh.getElementById('ocub').addEventListener('mousedown', function (e) { e.stopPropagation(); });
  sh.getElementById('ocub').addEventListener('click', function (e) { e.stopPropagation(); ocultarUsr(true); });
  document.addEventListener('keydown', function (e) { if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyR' || e.key === 'r' || e.key === 'R')) { e.preventDefault(); ocultarUsr(!OCULTO_USR); } }, true);
  // pausa, velocidad o salto del video: el minuto sale de la posición del video, así que basta con volver a atar
  ['pause', 'play', 'ratechange', 'seeked', 'waiting', 'playing'].forEach(function (ev) { document.addEventListener(ev, function (e) {
    if (!AS.on || e.target !== video()) return;
    if (ev === 'seeked') { AS.lect = []; AS.contra = []; AS.trasSalto = true; }  // tras mover el video alcanza con 3 lecturas para cambiar el ancla
    AS.playing = null; seguir(e.target); }, true); });

  R.onUpdate(render);
  if (!window.RP_NO_AUTOSTART) R.start();
})();
