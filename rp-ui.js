/* RiftPulse — piezas comunes de interfaz: colores del partido, números animados y color de los logos.
   RPC tiene siempre los colores del partido actual (en hex) para lo que no acepta variables CSS: SVG y canvas.
   Lo usan la app, la mesa, el control, la landing, las piezas de OBS y la barra de la extensión. */
(function () {
  'use strict';
  var RPC = window.RPC = {a: '#3d8bff', a2: '#2a63c0', ahi: '#8dbbff', aink: '#ffffff', atxt: '#7fb2ff', argb: '61,139,255',
    b: '#ff4655', b2: '#c0303d', bhi: '#ff96a0', bink: '#ffffff', btxt: '#ff7c87', brgb: '255,70,85',
    s: '#c8ff3e', s2: '#9ed62a', srgb: '200,255,62', codes: null};
  var RP = window.RPUI = window.RPUI || {};
  var ultimo = '';
  // carga los colores de un partido en la página (o en un elemento, por ejemplo el host del overlay)
  RP.colores = function (codeA, codeB, el) {
    var R = window.RiftEngine; if (!R || !R.colores) return RPC;
    var key = codeA + '|' + codeB + '|' + (el ? 'el' : 'doc');
    if (key === ultimo && !el) return RPC;
    var c = R.colores(codeA, codeB), t = (el || document.documentElement).style;
    [['a', c.a], ['b', c.b]].forEach(function (p) {
      var k = p[0], v = p[1], pre = '--team-' + k;
      t.setProperty(pre, v.main); t.setProperty(pre + '-2', v.dark); t.setProperty(pre + '-hi', v.hi); t.setProperty(pre + '-ink', v.ink); t.setProperty(pre + '-rgb', v.rgb); t.setProperty(pre + '-txt', v.txt);
      RPC[k] = v.main; RPC[k + '2'] = v.dark; RPC[k + 'hi'] = v.hi; RPC[k + 'ink'] = v.ink; RPC[k + 'rgb'] = v.rgb; RPC[k + 'txt'] = v.txt;
    });
    // la señal del tema activo (en modo claro es más oscura, para que se vea sobre blanco)
    try { var sg = getComputedStyle(document.documentElement).getPropertyValue('--signal').trim(); if (sg) RPC.s = sg; } catch (e) {}
    RPC.codes = [codeA, codeB]; if (!el) ultimo = key;
    return RPC;
  };
  // números que se animan al cambiar: <span data-rpn="clave">57</span> (después de cada render se llama RP.numeros(raiz))
  var PREV = {}, ANIM = {};
  var quieto = function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  RP.numeros = function (raiz) {
    (raiz || document).querySelectorAll('[data-rpn]').forEach(function (el) {
      var k = el.getAttribute('data-rpn'), txt = el.textContent, m = txt.match(/-?\d+/); if (!m) return;
      var n = +m[0], p = PREV[k]; PREV[k] = n;
      if (p == null || p === n || quieto()) return;
      if (Math.abs(n - p) >= 5) { el.classList.remove('rp-flash'); void el.offsetWidth; el.classList.add('rp-flash'); }
      var t0 = performance.now(), dur = 420; cancelAnimationFrame(ANIM[k]);
      (function paso(t) { var x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 3), v = Math.round(p + (n - p) * e);
        if (el.isConnected) el.textContent = txt.replace(m[0], v); if (x < 1) ANIM[k] = requestAnimationFrame(paso); })(t0);
    });
  };
  // color dominante de un logo (si el servidor deja leerlo); solo para equipos que no están en la tabla
  var VISTOS = {};
  RP.colorDeLogo = function (code, url) {
    var R = window.RiftEngine; if (!R || !code || !url || VISTOS[code] || (R.colorConocido && R.colorConocido(code))) return;
    VISTOS[code] = 1;
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 32);
        var d = x.getImageData(0, 0, 32, 32).data, sum = [0, 0, 0], n = 0;
        for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mx - mn < 60 || mx < 70) continue; sum[0] += d[i]; sum[1] += d[i + 1]; sum[2] += d[i + 2]; n++; }
        if (n > 20) R.aprenderColor(code, '#' + sum.map(function (v) { return ('0' + Math.round(v / n).toString(16)).slice(-2); }).join(''));
      } catch (e) {}  // el servidor del logo no deja leerlo: queda la tabla o el color del lado
    };
    im.src = url;
  };
})();
