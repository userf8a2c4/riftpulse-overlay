/* global Twitch */
// la Extensión de Twitch (superposición de video): la misma barra y el director de OBS, sin que el espectador instale nada.
// La configura el streamer (modo y retraso); se lee antes de arrancar el overlay. Twitch no permite scripts en línea:
// los archivos se cargan en orden desde acá.
(function () {
  function arrancar() {
    var cfg = {modo: 'minimo', delay: ''};
    try { var c = window.Twitch && Twitch.ext.configuration.broadcaster; if (c && c.content) cfg = Object.assign(cfg, JSON.parse(c.content)); } catch (e) {}
    var q = cfg.modo === 'estandar' ? 'view=auto' : cfg.modo === 'barra' ? 'view=bar' : 'modo=minimo';
    if (cfg.delay !== '' && cfg.delay != null && isFinite(+cfg.delay)) q += '&delay=' + Math.round(+cfg.delay);
    window.RP_PARAMS = '?' + q + '&listo=0';
    var fs = ['rp-i18n.js', 'engine.js', 'rp-ui.js', 'obs.js'];
    (function sig(i) { if (i >= fs.length) return; var s = document.createElement('script'); s.src = fs[i]; s.onload = function () { sig(i + 1); }; document.body.appendChild(s); })(0);
  }
  var hecho = false, una = function () { if (!hecho) { hecho = true; arrancar(); } };
  if (window.Twitch && Twitch.ext) { Twitch.ext.configuration.onChanged(una); setTimeout(una, 2500); } else una();
})();
