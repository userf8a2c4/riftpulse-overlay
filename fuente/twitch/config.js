/* global Twitch */
// la configuración de la Extensión de Twitch: qué se ve sobre el stream y el retraso del streamer
(function () {
  var $ = function (i) { return document.getElementById(i); };
  Twitch.ext.configuration.onChanged(function () {
    try { var c = JSON.parse((Twitch.ext.configuration.broadcaster || {}).content || '{}'); if (c.modo) $('modo').value = c.modo; if (c.delay != null) $('delay').value = c.delay; } catch (e) {}
  });
  $('guardar').addEventListener('click', function () {
    Twitch.ext.configuration.set('broadcaster', '1', JSON.stringify({modo: $('modo').value, delay: $('delay').value}));
    $('msg').textContent = '✓ Guardado'; $('msg').className = 'ok';
  });
})();
