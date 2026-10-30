/* RiftPulse — piezas comunes de interfaz: colores del partido, números animados y color de los logos.
   RPC tiene siempre los colores del partido actual (en hex) para lo que no acepta variables CSS: SVG y canvas.
   Lo usan la app, la mesa, el control, la landing, las piezas de OBS y la barra de la extensión. */
(function () {
  'use strict';
  var RPC = window.RPC = {a: '#3d8bff', a2: '#2a63c0', ahi: '#8dbbff', aink: '#ffffff', atxt: '#7fb2ff', argb: '61,139,255',
    b: '#ff4655', b2: '#c0303d', bhi: '#ff96a0', bink: '#ffffff', btxt: '#ff7c87', brgb: '255,70,85',
    s: '#22D3EE', s2: '#0EA5C6', srgb: '34,211,238', codes: null};
  var RP = window.RPUI = window.RPUI || {};
  var ultimo = '';
  // carga los colores de un partido en la página (o en un elemento, por ejemplo el host del overlay)
  RP.colores = function (codeA, codeB, el) {
    var R = window.RiftEngine; if (!R || !R.colores) return RPC;
    var key = codeA + '|' + codeB + '|' + (el ? 'el' : 'doc');
    if (key === ultimo && !el) return RPC;
    var c = RP.tema === 'canal' && R.paleta ? {a: R.paleta(RP.acento || '#22D3EE'), b: R.paleta('#AEB6C4')} : R.colores(codeA, codeB);
    aplicar(c, el);
    RPC.codes = [codeA, codeB]; if (!el) ultimo = key;
    return RPC;
  };
  // tema «Mi canal» (piezas de OBS con &tema=canal): los dos lados toman el color del canal y un gris claro
  RP.tema = 'equipos'; RP.acento = null;
  function aplicar(c, el) {
    var t = (el || document.documentElement).style;
    [['a', c.a], ['b', c.b]].forEach(function (p) {
      var k = p[0], v = p[1], pre = '--team-' + k;
      t.setProperty(pre, v.main); t.setProperty(pre + '-2', v.dark); t.setProperty(pre + '-hi', v.hi); t.setProperty(pre + '-ink', v.ink); t.setProperty(pre + '-rgb', v.rgb); t.setProperty(pre + '-txt', v.txt);
      RPC[k] = v.main; RPC[k + '2'] = v.dark; RPC[k + 'hi'] = v.hi; RPC[k + 'ink'] = v.ink; RPC[k + 'rgb'] = v.rgb; RPC[k + 'txt'] = v.txt;
    });
    // la señal del tema activo (en modo claro es más oscura, para que se vea sobre blanco)
    try { var sg = getComputedStyle(document.documentElement).getPropertyValue('--signal').trim(); if (sg) RPC.s = sg; } catch (e) {}
  }
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

// RiftPulse — idiomas (ES | EN). Las páginas se escriben en español; con inglés elegido, el texto que se ve se traduce solo
// con este diccionario (también el que se dibuja después). Los números se respetan: «Ronda {n}» → «Round {n}».
// Uso: RPI18N.boton() devuelve el selector ES|EN; RPI18N.lang() el idioma; RPI18N.locale() para fechas (Intl).
(function () {
  if (window.RPI18N) return;
  var CLAVE = 'rp_lang';
  var leer = function () { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } };
  var guardar = function (v) { try { localStorage.setItem(CLAVE, v); } catch (e) {} };
  var LANG = leer() || (/^en/i.test(navigator.language || '') ? 'en' : 'es');  // lo elegido (se recuerda) o el idioma del navegador

  var D = {
    // ---- comunes ----
    'App': 'App', 'Instalar': 'Install', 'Cómo funciona': 'How it works', 'Wiki': 'Wiki', 'Inicio': 'Home', 'Para streamers': 'For streamers',
    'El Mundial, jugada a jugada': 'Worlds, play by play', 'Secciones': 'Sections', 'Hecho por': 'Made by', 'Código abierto': 'Open source',
    'Cargando…': 'Loading…', 'Calculando…': 'Calculating…', 'Listo': 'Done', 'Hecho': 'Done', 'Cerrar': 'Close', 'por definir': 'TBD', 'ninguno': 'none',
    'Mundial': 'Worlds', 'Ahora': 'Now', 'Historial': 'History', 'Mando': 'Control room',
    'RiftPulse es pronóstico y análisis, sin apuestas. No está avalado por Riot Games y no refleja sus opiniones. League of Legends y Riot Games son marcas de Riot Games, Inc.': 'RiftPulse is forecasting and analysis, no betting. It is not endorsed by Riot Games and does not reflect its views. League of Legends and Riot Games are trademarks of Riot Games, Inc.',
    'RiftPulse es pronóstico y análisis, sin apuestas. No está avalado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.': 'RiftPulse is forecasting and analysis, no betting. It is not endorsed by Riot Games. League of Legends and Riot Games are trademarks of Riot Games, Inc.',
    // ---- portada ----
    'La probabilidad de que gane cada equipo, en vivo y sincronizada con lo que ves. Gratis, sin cuentas y sin apuestas.': 'Each team\'s chance to win, live and in sync with what you watch. Free, no accounts, no betting.',
    'Quiero ver el Mundial': 'I want to watch Worlds', 'Encima del video de Twitch, o como app en el celu y la compu.': 'On top of the Twitch video, or as an app on your phone and computer.',
    'Instalar →': 'Install →', 'Hago stream': 'I stream', 'El overlay para tu co-stream en OBS: una URL y decide solo qué mostrar.': 'The overlay for your co-stream in OBS: one URL, and it decides what to show.',
    'Ponerlo en OBS ↓': 'Add it to OBS ↓', 'TU STREAM': 'YOUR STREAM', 'Demo con un': 'Demo with a', 'partido real del Mundial': 'real Worlds match',
    ', acelerado: las piezas entran y salen solas. En OBS va con fondo transparente, sobre tu transmisión.': ', sped up: pieces come and go on their own. In OBS it has a transparent background, on top of your broadcast.',
    'Ponelo en tu stream': 'Put it on your stream', 'Cuatro pasos, una sola vez.': 'Four steps, just once.', 'Elegí qué querés mostrar': 'Choose what to show',
    'Si no sabés, dejalo así: el director automático muestra en cada momento lo que aporta.': 'Not sure? Leave it as is: the auto director shows what matters at each moment.',
    'Pieza': 'Piece', 'Director automático (recomendado)': 'Auto director (recommended)', 'Solo la barra de probabilidad': 'Only the probability bar',
    'Alerta cuando el juego da vuelta': 'Alert when the game turns', 'Serie (entre mapas)': 'Series (between maps)', 'Resumen al terminar el juego': 'Recap when the game ends',
    'Tarjeta grande': 'Big card', 'Duelos por línea': 'Lane matchups', 'Qué necesita el que va abajo': 'What the losing side needs', 'Objetivos': 'Objectives',
    'Claves del momento': 'Key points right now', 'Cuadro de eliminatorias': 'Knockout bracket', 'Predicciones de tu staff': 'Your staff\'s predictions',
    'Barra': 'Bar', 'Abajo': 'Bottom', 'Arriba': 'Top', 'Tamaño': 'Size', 'Normal': 'Normal', 'Grande': 'Large', 'Chico': 'Small',
    'Retraso de tu stream (segundos)': 'Your stream delay (seconds)', '{n} · si no sabés, dejalo vacío': '{n} · if unsure, leave it empty',
    'Cuántos segundos va atrasado tu stream frente a la transmisión oficial': 'How many seconds your stream is behind the official broadcast',
    '📋 Copiar URL': '📋 Copy URL', '▶ Probarla con un partido ya jugado': '▶ Try it with a past match', 'Agregala en OBS': 'Add it in OBS', 'Fuentes': 'Sources', 'tocá': 'click',
    '+ → Navegador': '+ → Browser', ', pegá la URL y poné': ', paste the URL and set', '. Aceptá.': '. Click OK.', 'Comprobá que funciona': 'Check that it works',
    'Si en ese momento no hay partido, vas a ver unos segundos': 'If there is no match right now, you will see for a few seconds', '«RiftPulse listo · próximo: …»': '«RiftPulse ready · next: …»',
    'y después nada: el overlay aparece solo cuando empieza el partido.': 'and then nothing: the overlay shows up by itself when the match starts.', '¿Tu stream va atrasado?': 'Is your stream delayed?',
    'Si la barra se adelanta a lo que ve tu chat, poné tu retraso en el paso {n} y volvé a copiar la URL. En vivo también lo ajustás desde el': 'If the bar is ahead of what your chat sees, enter your delay in step {n} and copy the URL again. Live, you can also adjust it from the',
    'control': 'control panel', '(abajo), sin tocar OBS.': '(below), without touching OBS.', 'Más rápido: importar la escena entera': 'Faster: import the whole scene',
    'Trae la escena «RiftPulse» con el director ya puesto y, ocultas, las predicciones de tu staff y el cuadro del Mundial, para prenderlas con un clic. En OBS:': 'It brings the «RiftPulse» scene with the director set up and, hidden, your staff\'s predictions and the Worlds bracket, to turn on with one click. In OBS:',
    'Colección de escenas → Importar': 'Scene Collection → Import', '(OBS {n} o más nuevo).': '(OBS {n} or newer).', '⬇ Descargar la escena de OBS': '⬇ Download the OBS scene',
    'Para equipos de transmisión': 'For broadcast teams', '🎚 Control de producción': '🎚 Production control', 'Un panel': 'A panel', 'dentro de OBS': 'inside OBS',
    'para prender y apagar piezas, ajustar el retraso y disparar alertas en vivo. En OBS:': 'to turn pieces on and off, adjust the delay and fire alerts live. In OBS:',
    'Ver → Docks → Docks de navegador personalizados': 'View → Docks → Custom Browser Docks', 'y pegá su URL.': 'and paste its URL.', '📋 Copiar URL del control': '📋 Copy control URL',
    '🎙 Mesa de análisis': '🎙 Analyst desk', 'Una segunda pantalla para casters: la probabilidad, el porqué y frases listas para comentar.': 'A second screen for casters: the probability, the why, and ready-to-say talking points.',
    'Ver la mesa (demo)': 'See the desk (demo)', 'Qué muestra': 'What it shows', 'Probabilidad en vivo': 'Live win probability',
    'Se mueve con el oro, las torres, los dragones, el Barón y los inhibidores, en los colores de cada equipo.': 'It moves with gold, towers, dragons, Baron and inhibitors, in each team\'s colors.',
    'Antes del juego': 'Before the game', 'A quién favorece el modelo cuando arranca la partida, según la fuerza de cada equipo y el lado del mapa.': 'Who the model favors when the game starts, based on each team\'s strength and map side.',
    'Los giros': 'The swings', 'Un aviso cuando la probabilidad da vuelta, con lo que la movió (un Barón, una pelea).': 'An alert when the probability flips, with what moved it (a Baron, a fight).',
    'Su acierto, a la vista': 'Its accuracy, in plain sight', 'La marca dice cuánto acierta el modelo a ese minuto:': 'The badge shows how often the model is right at that minute:',
    '{n} % al minuto {n}': '{n} % at minute {n}', ', medido en {n} juegos que no había visto.': ', measured on {n} games it had never seen.',
    'Ajustes avanzados (se agregan al final de la URL)': 'Advanced settings (added at the end of the URL)', 'tu color ·': 'your color ·', 'tu logo ·': 'your logo ·',
    'sin la marca de RiftPulse': 'without the RiftPulse badge', ': cuánto muestra el director solo': ': how much the director shows', '(con tu color) o': '(with your color) or',
    'márgenes amplios ·': 'wide margins ·', 'la pieza grande arriba a la derecha': 'the big piece at the top right', 'qué lleva la barra ·': 'what the bar shows ·',
    'sin el aviso «RiftPulse listo» al abrir': 'without the «RiftPulse ready» notice on load', 'Todos los parámetros, en la': 'All parameters, in the',
    'Demo del overlay con un partido real ya jugado': 'Overlay demo with a real past match',
    // ---- instalar ----
    'Instalá RiftPulse': 'Install RiftPulse', 'Elegí cómo querés ver el Mundial. Es gratis y no pide cuenta.': 'Choose how you want to watch Worlds. It is free and needs no account.',
    'Recomendado': 'Recommended', 'Sobre el video': 'On the video', 'Como app': 'As an app', 'Para mi stream': 'For my stream',
    'La probabilidad en vivo encima del partido en Twitch, y un panel con todo el Mundial. Chrome, Edge, Brave u Opera en la compu.': 'Live win probability on top of the match on Twitch, plus a panel with all of Worlds. Chrome, Edge, Brave or Opera on a computer.',
    'En el celu o en la compu, sin instalar nada: el partido en vivo, la fase suiza, las eliminatorias y tu pronóstico.': 'On your phone or computer, nothing to install: the live match, the Swiss stage, the knockouts and your picks.',
    'El overlay para tu co-stream en OBS, con la mesa de análisis y el control de producción.': 'The overlay for your co-stream in OBS, with the analyst desk and production control.',
    'Sobre el video, en {n} pasos': 'On the video, in {n} steps', 'Una sola vez: después se actualiza sola.': 'Just once: after that it updates itself.',
    'Está en revisión en la tienda de Chrome; cuando la aprueben, va a ser un solo clic.': 'It is under review in the Chrome Web Store; once approved, it will be a single click.',
    'Descargá y descomprimí': 'Download and unzip', 'Abrí el archivo y tocá': 'Open the file and click', 'Extraer todo': 'Extract all',
    '(en Mac, doble clic): queda la carpeta': '(on Mac, double-click): you get the folder', '. Movela a': '. Move it to', 'Documentos': 'Documents',
    'y no la borres: el navegador la usa.': 'and don\'t delete it: the browser uses it.', '⬇ Descargar': '⬇ Download',
    'Abrí las extensiones y activá el «Modo de desarrollador»': 'Open extensions and turn on «Developer mode»', 'Pegá la dirección copiada en una pestaña nueva.': 'Paste the copied address in a new tab.',
    'El interruptor está': 'The switch is', 'arriba a la derecha': 'at the top right', 'Modo de desarrollador': 'Developer mode', '📋 Copiar': '📋 Copy',
    '«Cargar descomprimida» → carpeta riftpulse-extension': '«Load unpacked» → riftpulse-extension folder', 'Cargar descomprimida': 'Load unpacked', 'Empaquetar extensión': 'Pack extension', 'Actualizar': 'Update',
    'Para que se actualice sola: «Permitir scripts de usuario»': 'To keep it up to date: «Allow User Scripts»', 'En la tarjeta de RiftPulse tocá': 'On the RiftPulse card click', 'Detalles': 'Details',
    'y activá el interruptor. Si tu navegador no lo tiene, salteá este paso: RiftPulse funciona igual.': 'and turn on the switch. If your browser doesn\'t have it, skip this step: RiftPulse works anyway.',
    'Permitir scripts de usuario': 'Allow User Scripts', '¿Dice «Falta el archivo de manifiesto» o no se pudo cargar?': 'Does it say «Manifest file is missing» or it couldn\'t load?',
    'Elegiste una carpeta de más arriba o de más abajo. Tiene que ser la carpeta donde están': 'You picked a folder one level too high or too low. It must be the folder that contains',
    ': abrila en el explorador para comprobarlo y elegí esa.': ': open it in your file explorer to check, and pick that one.', '¡Listo! 🎉': 'Done! 🎉', 'Abrí un partido en': 'Open a match on',
    '(en lolesports.com te ofrece abrirlo ahí): RiftPulse aparece solo cuando el juego está en pantalla y se sincroniza con el minuto que ves. Para tener el panel a mano, tocá la pieza de rompecabezas 🧩 de la barra del navegador y fijá RiftPulse 📌.': '(on lolesports.com it offers to open it there): RiftPulse appears only when the game is on screen and syncs to the minute you are watching. To keep the panel handy, click the puzzle piece 🧩 in the browser bar and pin RiftPulse 📌.',
    '¿Es seguro?': 'Is it safe?', 'No hay nada que descargar: se abre en el navegador y la podés dejar como un ícono más en tu celu o en tu compu.': 'Nothing to download: it opens in the browser and you can keep it as an icon on your phone or computer.',
    'Abrí la app': 'Open the app', 'El partido en vivo, el Mundial completo y tu pronóstico.': 'The live match, all of Worlds, and your picks.', 'Abrir RiftPulse': 'Open RiftPulse',
    'Dejala como app': 'Keep it as an app', 'En el celu: menú del navegador →': 'On your phone: browser menu →', 'Agregar a la pantalla de inicio': 'Add to Home screen', '. En iPhone:': '. On iPhone:',
    'Compartir': 'Share', 'Agregar a inicio': 'Add to Home Screen', '📲 Instalar la app': '📲 Install the app', 'Para tu stream': 'For your stream',
    'El overlay se agrega a OBS pegando': 'The overlay goes into OBS by pasting', 'una sola URL': 'a single URL',
    'como fuente de navegador. La página la arma con tu retraso y te guía en {n} pasos.': 'as a browser source. The page builds it with your delay and guides you in {n} steps.',
    'Ponerlo en OBS': 'Add it to OBS', 'Ver la mesa de análisis': 'See the analyst desk',
    // ---- app: encabezado, pestañas y tarjetas ----
    'Tu segunda pantalla del Mundial': 'Your Worlds second screen', '¿Cómo funciona? →': 'How does it work? →', '🧩 Sobre el video': '🧩 On the video',
    'Poné RiftPulse sobre el video del partido': 'Put RiftPulse on top of the match video', 'Centro de mando para streamers y analistas': 'Control room for streamers and analysts',
    '📘 Para entender': '📘 Explain terms', 'Explica los términos del juego': 'Explains game terms', '🙈 Spoilers': '🙈 Spoilers', 'Ocultar los de hoy': 'Hide today\'s', 'Mostrar todo': 'Show all',
    'Ocultar resultados que todavía no viste': 'Hide results you haven\'t seen yet', '(auto)': '(auto)', '(a mano)': '(manual)', '● EN VIVO': '● LIVE', '● en vivo': '● live', 'EN VIVO': 'LIVE', 'SIN PARTIDO': 'NO MATCH',
    'Mundial {n}': 'Worlds {n}', 'Buscando partido en vivo…': 'Looking for a live match…', 'En vivo ahora': 'Live now', 'En vivo:': 'Live:', 'Partido en vivo': 'Live match',
    'Marcador': 'Score', 'Oro': 'Gold', '· Oro': '· Gold', 'Torres': 'Towers', 'Dragones': 'Dragons', '· Dragones': '· Dragons', 'Barones': 'Barons', '· Barones': '· Barons', 'Inhibidores': 'Inhibitors', 'Inhibidor': 'Inhibitor',
    'Barón Nashor': 'Baron Nashor', 'Buff activo': 'Active buff', 'sin tomar': 'not taken', 'todos en pie': 'all standing', 'disponible': 'available', 'lado azul': 'blue side', 'lado rojo': 'red side',
    'Dragón disponible · Barón sin tomar': 'Dragon available · Baron not taken', 'Próximos objetivos': 'Upcoming objectives', 'Cuándo aparecen los objetivos grandes del mapa.': 'When the big map objectives spawn.',
    '¿Quién va a ganar?': 'Who will win?', 'Probabilidad de ganar este juego según el modelo, y por qué.': 'Chance to win this game according to the model, and why.',
    'Cómo va el juego': 'How the game is going', 'Cómo va este juego. Cada barra compara a los dos equipos.': 'How this game is going. Each bar compares both teams.',
    'Ventaja de oro (área) y probabilidad de ganar (la línea), minuto a minuto.': 'Gold lead (area) and win probability (line), minute by minute.',
    'Jugadores: duelo por línea': 'Players: lane matchups', 'Cada fila enfrenta a los jugadores del mismo rol. Al centro, quién lleva ventaja de oro y súbditos (CS).': 'Each row pits players of the same role. In the middle, who leads in gold and minions (CS).',
    'Centro: ventaja de oro y CS en el duelo directo. Barra verde: vida actual. Gris: muerto.': 'Middle: gold and CS lead in the direct matchup. Green bar: current health. Gray: dead.',
    'Momentos del juego': 'Game moments', 'Sin eventos todavía.': 'No events yet.', 'Draft y composición': 'Draft and composition', 'Los campeones elegidos y el plan de juego que sugieren.': 'The picked champions and the game plan they suggest.',
    'Condiciones de victoria': 'Win conditions', 'Antes del juego · fuerza, lado y draft': 'Before the game · strength, side and draft', 'Antes del juego (fuerza, lado y draft)': 'Before the game (strength, side and draft)',
    'Antes del juego · fuerza de los equipos': 'Before the game · team strength', 'Fuerza de los equipos:': 'Team strength:', 'Fuerza de cada equipo:': 'Each team\'s strength:',
    '▾ Ver los detalles del juego': '▾ See game details', '▾ Todos los detalles del juego': '▾ All game details', '▴ Menos detalles': '▴ Fewer details',
    'Marcador, por qué, duelos, objetivos, momentos y draft.': 'Score, why, matchups, objectives, moments and draft.', 'Probabilidad en todo el juego, con su banda de confianza': 'Probability over the whole game, with its confidence band',
    '⏱ tiempo de juego · sincronizado con el stream': '⏱ game time · synced with the stream', 'Ahora · minuto {n}': 'Now · minute {n}', 'kills · minuto {n}': 'kills · minute {n}',
    '🏆 Favoritos al título': '🏆 Title favorites', 'Favoritos al título': 'Title favorites', '🔮 Bola de Cristal': '🔮 Crystal Ball', '📅 Próximos partidos': '📅 Upcoming matches', '📜 Últimos resultados': '📜 Latest results',
    '📡 Estado de los datos': '📡 Data status', '📈 Fiabilidad del sistema': '📈 How reliable it is', 'Fiabilidad del sistema': 'How reliable it is', 'Ver el historial': 'See history', 'Ver el Mundial': 'See Worlds',
    'El camino de cada equipo, el Pick\'Em y más →': 'Each team\'s path, Pick\'Em and more →', 'Ver Pick\'Em completo': 'See full Pick\'Em', 'Ver la tasa de aciertos completa': 'See the full accuracy rate',
    'Retraso frente al stream:': 'Delay vs. the stream:', 'Los datos de lolesports llegan con': 'lolesports data arrives with', '(automático)': '(automatic)', '(ajustado a mano)': '(set manually)',
    'Esports vía feed no oficial de lolesports; campeones e ítems por Data Dragon (oficial). No afiliado a Riot Games.': 'Esports via the unofficial lolesports feed; champions and items via Data Dragon (official). Not affiliated with Riot Games.',
    'En tu hora local (GMT+{n}). Tocá uno para el enfrentamiento.': 'In your local time (GMT+{n}). Tap one for the matchup.', 'En tu hora local (GMT-{n}). Tocá uno para el enfrentamiento.': 'In your local time (GMT-{n}). Tap one for the matchup.',
    '🎯 Tu pronóstico': '🎯 Your picks', 'Elegí tu ganador: después ves el de RiftPulse.': 'Pick your winner: then you see RiftPulse\'s.', 'Ya empezó': 'Already started',
    'Elegí quién gana cada serie antes de que empiece. RiftPulse muestra el suyo después de que elijas, y al final del día se ve quién acertó más.': 'Pick who wins each series before it starts. RiftPulse shows its pick after yours, and at the end of the day you see who got more right.',
    '★ Mis equipos': '★ My teams', 'Elegí tus equipos: se destacan en todo, te avisa cuando juegan y sus partidos van primero.': 'Choose your teams: they stand out everywhere, you get notified when they play and their matches come first.',
    'Fase suiza': 'Swiss stage', 'Fase Suiza': 'Swiss Stage', 'Sistema Suizo': 'Swiss Stage', 'Eliminatorias': 'Knockouts', 'Play-In': 'Play-In', 'Cuartos': 'Quarterfinals', 'Semis': 'Semis', 'Final': 'Final', 'Ronda {n}': 'Round {n}',
    'Campeón': 'Champion', 'Clasifica': 'Advances', 'clasifica': 'advances', 'eliminado': 'eliminated', 'directo': 'direct', 'Equipo': 'Team', 'Fuerza': 'Strength', 'Series': 'Series', 'Juegos': 'Games', 'Grupo': 'Group',
    'Fases del Mundial · en vivo': 'Worlds stages · live', 'Todos los partidos': 'All matches', 'Tocá una serie para ver el enfrentamiento.': 'Tap a series to see the matchup.', 'Camino de cada equipo': 'Each team\'s path',
    'Probabilidad de llegar a cada fase del torneo. Cuanto más intenso el color, más probable.': 'Chance of reaching each stage. The stronger the color, the more likely.', 'Llegan a semifinales': 'Reach semifinals', 'Eliminatorias · favoritos': 'Knockouts · favorites',
    '← Volver a Mundial': '← Back to Worlds', 'Pick\'Em y Bola de Cristal': 'Pick\'Em and Crystal Ball', '🎯 Pick\'Em y Bola de Cristal': '🎯 Pick\'Em and Crystal Ball',
    'Sugerencia para el Pick\'Em del Sistema Suizo': 'Swiss Stage Pick\'Em suggestion', 'Sistema Suizo · nuestra sugerencia': 'Swiss Stage · our suggestion', '🖼 Compartir mi Pick\'Em': '🖼 Share my Pick\'Em',
    'Entrar con mi cuenta de Riot en lolesports y elegir ↗': 'Sign in with my Riot account on lolesports and pick ↗', 'Terminan {n}-{n}': 'Finish {n}-{n}', 'Avanzan con {n}-{n} o {n}-{n}': 'Advance with {n}-{n} or {n}-{n}',
    'Partidos del Mundial {n}': 'Worlds {n} matches', 'Resumen del juego': 'Game recap', 'Elegí un partido y después un juego.': 'Pick a match and then a game.', '📼 Ver una repetición': '📼 Watch a replay',
    'Elegí un juego ya disputado para verlo aquí mismo, con su historia y su gráfico.': 'Pick a finished game to watch it right here, with its story and chart.', 'Solo internacionales': 'Internationals only', 'Todo el Mundial': 'All of Worlds',
    'Head-to-head': 'Head-to-head', 'Probabilidad': 'Probability', 'Comparativa': 'Comparison', 'Últimos cruces (todas las ligas)': 'Latest meetings (all leagues)', 'Buscando sus últimos cruces…': 'Looking up their latest meetings…',
    'No se cruzaron desde 2025.': 'They haven\'t met since 2025.', 'en series desde 2025': 'in series since 2025', 'en series': 'in series', 'Por qué': 'Why', 'Por serie (Bo{n})': 'Per series (Bo{n})', 'Por mapa': 'Per map',
    'Tocá un jugador para ver su perfil en op.gg.': 'Tap a player to see their op.gg profile.', 'Campeones en Worlds': 'Champions at Worlds', 'Calculando la fuerza de los equipos…': 'Calculating team strength…',
    '🖼 Compartir pronóstico': '🖼 Share prediction', '🔔 Avisarme cuando empiece': '🔔 Notify me when it starts', '🔔 Te aviso al empezar': '🔔 I\'ll notify you when it starts',
    // ---- app: Mando ----
    'Al aire ahora': 'On air now', 'Guion para comentar': 'Talking points', 'Lectura del juego': 'Game read', 'Para redes': 'For social media', 'Piezas para OBS': 'OBS pieces', 'Overlay en el stream': 'Overlay on the stream',
    '📋 Copiar todo': '📋 Copy all', '📋 Copiar post': '📋 Copy post', '📋 Copiar todas': '📋 Copy all', 'Publicar en X': 'Post on X', '⬇ Imagen del resumen': '⬇ Recap image', '🎲 Predicción de Twitch': '🎲 Twitch prediction',
    'Copiar esta frase': 'Copy this line', 'Momentos para editores': 'Moments for editors', 'Predicciones del staff': 'Staff predictions', 'Giros clave': 'Key swings', 'La historia del juego': 'The story of the game',
    'Qué mirar ahora': 'What to watch now', 'Para remontar': 'To come back', '+ Agregar': '+ Add', 'Aparece con el partido.': 'Shows up with the match.',
    'Agregá a los integrantes del stream para cargar sus picks.': 'Add your stream\'s members to enter their picks.', 'Título (ej.: Predicciones del staff)': 'Title (e.g., Staff predictions)',
    '🧩 Instalar la extensión': '🧩 Install the extension', 'Director automático (recomendado · una sola URL)': 'Auto director (recommended · one URL)', 'Solo la barra, abajo': 'Only the bar, at the bottom',
    'Barra en vivo (completa)': 'Live bar (full)', 'Alerta de giro (escena aparte)': 'Swing alert (separate scene)', 'Resumen del juego (al cerrar)': 'Game recap (at the end)',
    'Mesa de análisis': 'Analyst desk', 'Control de producción (panel dentro de OBS)': 'Production control (panel inside OBS)', 'Fuente de navegador': 'Browser source', 'Disponible al terminar el juego': 'Available when the game ends',
    'Título y opciones listos para una predicción de Twitch': 'Title and options ready for a Twitch prediction', '📺 Seguir el video': '📺 Follow the video', '📺 SINCRONIZADO CON TU VIDEO': '📺 SYNCED WITH YOUR VIDEO',
    // ---- reproductor y estado ----
    'Reproducir o pausar': 'Play or pause', 'Reproducir o pausar (barra espaciadora)': 'Play or pause (space bar)', 'Velocidad': 'Speed', '⟲ Sincronizar con una kill': '⟲ Sync with a kill',
    'Atrás {n} s (flecha izquierda: {n} s)': 'Back {n} s (left arrow: {n} s)', 'Adelante {n} s (flecha derecha: {n} s)': 'Forward {n} s (right arrow: {n} s)',
    'Retraso frente al stream. Se calcula solo; si ves una kill antes acá que en el video, subilo; si va atrasada, bajalo.': 'Delay vs. the stream. It is set automatically; if you see a kill here before the video, raise it; if it lags, lower it.',
    'Cargando el calendario del Mundial…': 'Loading the Worlds schedule…', '↻ Reintentar': '↻ Retry', 'Reintentando…': 'Retrying…',
    // ---- overlay sobre el video ----
    'sincronía automática': 'auto sync', '¿otro partido?': 'other match?', 'objetivo': 'objective', 'trayectoria': 'trend', 'oro': 'gold', 'daño': 'damage', 'impacto': 'impact', 'duelos': 'matchups', 'mínimo': 'minimal',
    'Sincronizando con el video…': 'Syncing with the video…', 'Selección de campeones': 'Champion select', 'Cargando el juego': 'Loading the game', 'Próximo partido': 'Next match', 'Próximo': 'Next', 'buscando partido del Mundial…': 'looking for a Worlds match…',
    'gana el juego': 'wins the game', 'Terminó el juego': 'Game over', 'de golpe': 'in a flash', 'Pelea en equipo · min {n}': 'Teamfight · min {n}', 'pareja': 'even',
    'aparece cuando el juego está en pantalla': 'shows up when the game is on screen', 'vuelve con el juego': 'comes back with the game', 'vuelve cuando termine la repetición': 'comes back after the replay',
    'todavía no reconozco este partido': 'I don\'t recognize this match yet', 'sin conexión con lolesports · reintento solo': 'no connection to lolesports · retrying', 'este video está protegido y no se puede leer': 'this video is protected and can\'t be read',
    'Ocultar RiftPulse (Alt+R lo vuelve a mostrar)': 'Hide RiftPulse (Alt+R shows it again)', 'Qué está leyendo del video': 'What it reads from the video',
    'Pausa · lo que va del juego': 'Pause · the game so far', 'Kills': 'Kills',
    'Figura hasta ahora:': 'Top player so far:', 'Juego en pausa': 'Game paused', 'juego en pausa · vuelve al reanudarse': 'game paused · back when it resumes', 'Datos al día': 'Data up to date', 'Sin datos nuevos': 'No new data',
    'Poniéndome al día · {n}': 'Catching up · {n}', 'acierta al min {n}': 'right at min {n}', 'Daño a campeones · todo el juego': 'Champion damage · whole game', '% de su equipo': '% of their team',
    'Impacto': 'Impact', 'oro de diferencia': 'gold difference',
    'Diferencia de oro': 'Gold difference', 'D dragón · B Barón · I inhib.': 'D dragon · B Baron · I inhib.',
    // ---- control y mesa ----
    'Control de producción': 'Production control', 'manejá el overlay en vivo, sin tocar OBS': 'run the overlay live, without touching OBS', 'Estado': 'Status', 'Datos del partido': 'Match data',
    'Piezas abiertas en OBS': 'Pieces open in OBS', 'Última orden': 'Last command', '🚨 Ocultar todo': '🚨 Hide everything', 'Director automático': 'Auto director', 'Mínimo': 'Minimal', 'Estándar': 'Standard', 'Show': 'Show',
    'Retraso frente al stream': 'Delay vs. the stream', 'Retraso aplicado': 'Applied delay', 'Módulos': 'Modules', 'Pronóstico (previa)': 'Pre-game forecast', 'Giros (alertas)': 'Swings (alerts)', 'Tiempos de los objetivos': 'Objective timers',
    'Marca + precisión': 'Badge + accuracy', 'Posición': 'Position', 'Piezas automáticas': 'Automatic pieces', 'Resumen al terminar': 'Recap at the end', 'Acciones': 'Actions', '⚡ Disparar alerta de prueba': '⚡ Fire a test alert',
    '🏁 Mostrar resumen del juego': '🏁 Show game recap', '✋ Cortar el resumen': '✋ Cut the recap', 'Ocultar overlay': 'Hide overlay', 'Predicciones del stream': 'Stream predictions', 'ninguna abierta todavía': 'none open yet',
    'Este panel va dentro de OBS.': 'This panel goes inside OBS.', '📋 Copiar esta dirección': '📋 Copy this address',
    'Buscando un partido del Mundial en vivo…': 'Looking for a live Worlds match…', 'Ver una demo con un partido ya jugado': 'See a demo with a past match'
  };
  // ---- el resto de la app, el sitio, el overlay y OBS (generado desde el código; {} = un valor que cambia: un equipo, un número, un campeón) ----
  var D2 = {
    "{} la gana": "{} wins it",
    "{} · ya está": "{} · already up",
    "Próx. {} · {}": "Next {} · {}",
    "Jungla": "Jungle",
    "Soporte": "Support",
    "{} · ya está en el mapa": "{} · already on the map",
    "Dragón disponible": "Dragon available",
    "disponible": "available",
    "sin tomar": "not taken",
    "pelea": "fight",
    "Pelea en equipo": "Teamfight",
    "oro": "gold",
    "Ver el perfil de {}": "See {}'s profile",
    "Tocá un jugador para ver su perfil (Leaguepedia).": "Tap a player to see their profile (Leaguepedia).",
    "Le gané al modelo {n} vez": "I beat the model {n} time",
    "Le gané al modelo {n} veces": "I beat the model {n} times",
    "Probabilidad de {} según el modelo · sombreado: giros clave": "Probability of {} according to the model · shaded: key swings",
    "Prueba": "Test",
    ": no envía imágenes ni datos a ningún lado.": ": it sends no images or data anywhere.",
    "{n} de {n}": "{n} of {n}",
    "Serie": "Series",
    "EN": "EN",
    "Fuerza: la estimada de cada equipo (más alto, más fuerte). 3-0 y 0-3: terminar el Sistema Suizo invicto o sin ganar. «Directo»: no juega el Play-In.": "Strength: each team's estimate (higher is stronger). 3-0 and 0-3: finishing the Swiss Stage unbeaten or winless. «Direct»: skips the Play-In.",
    "Actualizado {} · {} simulaciones · {} partidos en el cálculo de fuerza.": "Updated {} · {} simulations · {} matches in the strength calculation.",
    "los resultados reales y la serie en curso se suman solos cada 2 minutos.": "real results and the series in progress are added automatically every 2 minutes.",
    "con fallos · {}": "with errors · {}",
    "Predicciones de todo el torneo. Se calculan con los {} juego ya jugado. Se puntúa al terminar Worlds (~14 nov).": "Predictions for the whole tournament. Calculated from the {} game already played. Scored when Worlds ends (~Nov 14).",
    "Predicciones de todo el torneo. Se calculan con los {} juegos ya jugados. Se puntúa al terminar Worlds (~14 nov).": "Predictions for the whole tournament. Calculated from the {} games already played. Scored when Worlds ends (~Nov 14).",
    "Aún no hay suficientes juegos. Vuelva cuando se hayan jugado varios.": "Not enough games yet. Come back once several have been played.",
    "ya está en el mapa:": "already on the map:",
    "encima del video": "on top of the video",
    "La clave: Lado del mapa.": "The key: map side.",
    "para tu retraso,": "for your delay,",
    "para tus colores y logo,": "for your colors and logo,",
    "se ven con un partido ya jugado.": "they play with a past match.",
    "En": "In",
    "lee el reloj del video": "reads the video clock",
    "Un": "A",
    "modelo entrenado con 2 247 juegos profesionales": "model trained on 2,247 pro games",
    "el mismo modelo": "the same model",
    "de los equipos y la": "of the teams and the",
    "curva del draft": "draft curve",
    "589 juegos que el modelo nunca vio": "589 games the model never saw",
    "lee el reloj del juego": "reads the game clock",
    "en el marcador del video, las siglas de los equipos, las kills, el oro y los campeones en pantalla.": "on the video scoreboard, the team tags, kills, gold and the champions on screen.",
    "varias lecturas seguidas que avanzan igual que el video": "several consecutive readings that move in step with the video",
    "; el oro descarta los minutos imposibles.": "; gold rules out impossible minutes.",
    "el partido y el juego de la serie": "the match and the game in the series",
    "en tu navegador": "in your browser",
    ", que suele decidir los juegos largos.": ", which usually decides long games.",
    "+10 puntos es pasar, por ejemplo, de 50 % a 60 % de chances de ganar.": "+10 points means going, for example, from 50% to 60% chance to win.",
    "una sola fuente de navegador": "a single browser source",
    "piden una pieza,": "request a piece,",
    "la quita,": "removes it,",
    "la retiene y": "holds it and",
    "fuente de navegador": "browser source",
    ". Cuando un partido termina, cada pick se marca solo como acierto o fallo y se suma al marcador de aciertos.": ". When a match ends, each pick is marked right or wrong on its own and added to the scoreboard.",
    "dock de navegador personalizado": "custom browser dock",
    ". Comparten el mismo navegador y se sincronizan solos.": ". They share the same browser and sync on their own.",
    "Centro: diferencia de oro y CS en el duelo directo (◀ ventaja {}, ▶ ventaja {}).": "Center: gold and CS difference in the direct matchup (◀ {} lead, ▶ {} lead).",
    "La clave: {}.": "The key: {}.",
    "Espada de Doran": "Doran's Blade",
    "Grebas del berserker": "Berserker's Greaves",
    "Filo del infinito": "Infinity Edge",
    "Sombrero mortal de Rabadon": "Rabadon's Deathcap",
    "% DE ACIERTO AL MIN 15": "% ACCURACY AT MIN 15",
    "% del daño": "% of damage",
    "% del daño de": "% of the damage of",
    "% del daño del equipo": "% of team damage",
    "% del daño ·": "% of damage ·",
    "% del daño.": "% of damage.",
    "(Ver → Docks → Docks de navegador personalizados) y el overlay como": "(View → Docks → Custom Browser Docks) and the overlay as a",
    "(abajo) en todo el juego. Sombreado: giros clave. La banda clara: cuánta confianza darle en cada minuto (más ancha cuando el modelo acierta menos).": "(bottom) across the whole game. Shaded: key swings. The light band: how much to trust it at each minute (wider when the model is right less often).",
    "(agosto a octubre de 2026, ligas regionales e internacionales). Cada predicción se hizo sin conocer el resultado. Una moneda acierta el 50 %.": "(August to October 2026, regional and international leagues). Every prediction was made without knowing the result. A coin flip is right 50% of the time.",
    "(quitá antes la RiftPulse vieja). Después solo se refresca.": "(remove the old RiftPulse first). After that it just refreshes.",
    "(quitá antes la vieja).": "(remove the old one first).",
    "(qué lo empuja) y qué movería el próximo objetivo.": "(what drives it) and what the next objective would change.",
    "({} juegos)": "({} games)",
    "({}, {}) · {}{} de oro sobre {} · {}% del daño · {}/{}/{}": "({}, {}) · {}{} gold over {} · {}% of damage · {}/{}/{}",
    ") completó": ") completed",
    "), pero no le alcanzó.": "), but it wasn't enough.",
    "). Reintento solo; si el juego recién empieza, subí el retraso.": "). Retrying on its own; if the game just started, raise the delay.",
    ", activá": ", turn on",
    ", aunque sea un VOD de otro día, y sigue pausas, saltos y velocidad.": ", even in a VOD from another day, and it follows pauses, skips and speed.",
    ", una sorpresa: el pronóstico favorecía a {}.": ", an upset: the forecast favored {}.",
    ", y después": ", and then",
    ", ▶ ventaja": ", ▶ lead",
    ". Así maneja el overlay que tenés como fuente de navegador.": ". That way it controls the overlay you have as a browser source.",
    ". En este navegador podés usar RiftPulse": ". In this browser you can use RiftPulse",
    ". Muestra siempre la barra y, en cada momento, la pieza que aporta: el impacto antes del dragón o el Barón, el daño tras una pelea, la alerta en un giro, qué necesita el que va abajo, el resumen al terminar y la serie entre juegos. Nunca dos piezas grandes a la vez. Atajos con este panel enfocado:": ". It always shows the bar and, at each moment, the piece that adds something: the impact before a dragon or Baron, damage after a fight, the alert on a swing, what the trailing team needs, the recap at the end and the series between games. Never two big pieces at once. Shortcuts with this panel focused:",
    ". Se puntúa al terminar Worlds (~14 nov).": ". Scored when Worlds ends (~Nov 14).",
    ".º ítem": " item",
    "1 partido": "1 match",
    "2025–26, todas las ligas": "2025–26, all leagues",
    ": con eso vuelve al {}%.": ": that brings them back to {}%.",
    "; acá quedan en cero para que se vea el efecto del juego.": "; here they're set to zero so you see the effect of the game itself.",
    "; después aparece el": "; then comes the",
    "A este minuto acierta": "Accuracy at this minute",
    "A la derecha de cada equipo: probabilidad de ganar la serie según el sistema. Tocá una serie para el enfrentamiento.": "Right of each team: the system's chance to win the series. Tap a series for the matchup.",
    "Abre el 18 de octubre, cierra el 23 antes del primer partido. Formato 2025: dos 3-0, dos 0-3 y cinco que avanzan.": "Opens October 18, closes on the 23rd before the first match. 2025 format: two 3-0, two 0-3 and five that advance.",
    "Abre el 31 de octubre, cierra el 3 de noviembre. Probabilidad de la simulación.": "Opens October 31, closes November 3. Probability from the simulation.",
    "Abren el mapa y la base. Un inhibidor abierto pesa mucho en el juego tardío.": "They open the map and the base. An open inhibitor weighs a lot in the late game.",
    "Abrí un partido del Mundial en Twitch (en vivo o un VOD), con la": "Open a Worlds match on Twitch (live or a VOD), with the",
    "Acierta al ganador de la serie:": "Picks the series winner:",
    "Acierto del modelo según el minuto": "Model accuracy by minute",
    "Acierto juego": "Game accuracy",
    "Acierto medido del modelo a este minuto, sobre 589 juegos que no había visto": "Measured model accuracy at this minute, over 589 games it hadn't seen",
    "Acierto serie": "Series accuracy",
    "Aciertos de todo el torneo · se marcan solos al terminar cada partido": "Hits across the tournament · marked automatically when each match ends",
    "Acá está todo lo que hace para llegar a ese número, qué tan seguido acierta y en qué casos se equivoca.": "Here is everything it does to reach that number, how often it's right and when it gets it wrong.",
    "Acá queda lo que mostró el director y cuándo.": "What the director showed, and when, stays here.",
    "Adelantar el overlay 5 segundos": "Move the overlay 5 seconds ahead",
    "Agrega a los integrantes del stream (nombre y foto opcional).": "Add your stream crew (name and optional photo).",
    "Agrega integrantes para cargar sus picks.": "Add crew members to enter their picks.",
    "Ahora está parejo:": "Right now it's even:",
    "Ahora está parejo: 50 % para cada uno": "Right now it's even: 50% each",
    "Al juntar 4 dragones, el equipo gana el alma: una mejora muy fuerte para el resto del juego.": "With 4 dragons the team gets the soul: a very strong buff for the rest of the game.",
    "Al mejor de": "Best of",
    "Al mejor de 1, 3 o 5 juegos: gana la serie quien gana 1, 2 o 3 juegos.": "Best of 1, 3 or 5 games: whoever wins 1, 2 or 3 games wins the series.",
    "Alargar el juego: su draft es más fuerte en el late": "Drag the game out: their draft is stronger late",
    "Alerta de giro": "Swing alert",
    "Alerta de prueba": "Test alert",
    "Alineaciones de la serie": "Series lineups",
    "Alma de dragón": "Dragon soul",
    "Antes (fórmula manual)": "Before (hand-made formula)",
    "Aparece cuando cargan los campeones (al iniciar el juego).": "Shows up when champions load (when the game starts).",
    "Aparece cuando cargan los campeones (al iniciar el juego). El feed no trae las bans.": "Shows up when champions load (when the game starts). The feed doesn't include bans.",
    "Aparece cuando cargan los campeones.": "Shows up when champions load.",
    "Aparece cuando empieza el juego.": "Shows up when the game starts.",
    "Aparece cuando la serie tiene juegos jugados o en curso.": "Shows up when the series has games played or in progress.",
    "Aparece cuando llega el feed de detalles de los jugadores.": "Shows up when the player details feed arrives.",
    "Aparece cuando un equipo cae por debajo del 45%.": "Shows up when a team drops below 45%.",
    "Aparece después del primer minuto de juego.": "Shows up after the first minute of the game.",
    "Aparece después del primer minuto que mirás.": "Shows up after the first minute you watch.",
    "Aparece en": "Spawns in",
    "Aparecen cuando empieza el juego.": "They show up when the game starts.",
    "Aparecen solos con los giros, los Barones, los inhibidores y las peleas grandes del juego.": "They show up on their own with swings, Barons, inhibitors and big fights.",
    "Atrasar el overlay 5 segundos": "Move the overlay 5 seconds back",
    "Automático": "Automatic",
    "Avisos de mis equipos apagados.": "My teams' alerts are off.",
    "Azul arriba, rojo abajo. El feed oficial no trae los bloqueos (bans): solo las selecciones.": "Blue on top, red below. The official feed doesn't include bans: only picks.",
    "BARÓN": "BARON",
    "Bans del draft, heraldos y larvas: el feed oficial no los trae.": "Draft bans, heralds and grubs: the official feed doesn't include them.",
    "Barones más": "more Barons",
    "Barón": "Baron",
    "Barón activo ({})": "Baron active ({})",
    "Barón más": "one more Baron",
    "Barón para remontar": "Baron to come back",
    "Barón y Ancestral": "Baron and Elder",
    "Barón:": "Baron:",
    "Base de": "Base of",
    "Bitácora": "Log",
    "Buff de": "Buff of",
    "Buscando la última kill en los datos…": "Looking for the latest kill in the data…",
    "Cada caja es un récord: el que gana sigue por la línea de arriba y el que pierde, por la de abajo. Con 3 victorias clasifica; con 3 derrotas queda afuera.": "Each box is a record: the winner moves along the upper line and the loser along the lower one. 3 wins qualifies; 3 losses is out.",
    "Cada co-stream tiene su retraso. Ajustalo hasta que una kill aparezca en el overlay al mismo tiempo que en el video. También se puede fijar al final de la URL del overlay:": "Every co-stream has its own delay. Adjust it until a kill shows on the overlay at the same time as in the video. You can also set it at the end of the overlay URL:",
    "Cada dragón suma; el punto de alma y el alma suman aparte.": "Each dragon counts; soul point and soul count on top.",
    "Cada equipo juega contra rivales con su mismo récord. Con 3 victorias clasifica; con 3 derrotas queda afuera.": "Each team plays opponents with the same record. 3 wins qualifies; 3 losses is out.",
    "Cada fila enfrenta a los dos jugadores del mismo rol: campeón, KDA (kills/muertes/asistencias), súbditos (CS), oro, daño e ítems finales.": "Each row pits the two players of the same role: champion, KDA (kills/deaths/assists), minions (CS), gold, damage and finished items.",
    "Cada pieza va como": "Each piece goes in as a",
    "Cada predicción se hizo solo con lo que se sabía antes de ese partido: el sistema avanza partido por partido y después compara con el resultado. Error medio (Brier): cuánto se equivocan las probabilidades; tirar una moneda da 0,250 (menor es mejor).": "Every prediction was made only with what was known before that match: the system moves match by match and then compares with the result. Mean error (Brier): how far off the probabilities are; a coin flip gives 0.250 (lower is better).",
    "Calculando con los resultados 2025–26…": "Calculating with 2025–26 results…",
    "Calculando la simulación del torneo…": "Running the tournament simulation…",
    "Calendario, resultados y alineaciones de cada juego del Mundial.": "Schedule, results and lineups of every Worlds game.",
    "Camino en el torneo": "Path through the tournament",
    "Campeón del Mundial 2026": "Worlds 2026 champion",
    "Campeón más elegido": "Most picked champion",
    "Cargando el juego…": "Loading the game…",
    "Cargando el juego… {}%": "Loading the game… {}%",
    "Cargando juegos…": "Loading games…",
    "Cargando lo que va del juego ({} tramos)…": "Loading the game so far ({} chunks)…",
    "Cargando lo que ves en el video:": "Loading what you see in the video:",
    "Cargando los equipos del Mundial…": "Loading Worlds teams…",
    "Cargando partidos…": "Loading matches…",
    "Cargando roster…": "Loading roster…",
    "Centro: diferencia de oro y CS en el duelo directo (◀ ventaja": "Center: gold and CS difference in the direct matchup (◀ lead",
    "Cerrar temprano (antes del ~min 25): pierde fuerza si se alarga": "Close early (before ~min 25): it loses strength if the game drags on",
    "Clase y daño: datos oficiales de cada campeón (Data Dragon). \"% de victorias\", \"presencia\" y la escala vienen de ~2,200 juegos profesionales reales (2025-26).": "Class and damage: official data for each champion (Data Dragon). \"Win %\", \"presence\" and scaling come from ~2,200 real pro games (2025-26).",
    "Comparación de equipos": "Team comparison",
    "Composiciones tardías.": "Late-game comps.",
    "Con eso reconoce": "With that it recognizes",
    "Con la extensión de RiftPulse, la probabilidad aparece": "With the RiftPulse extension, the probability shows up",
    "Con lo que se sabe a este minuto, el modelo acertó este porcentaje de juegos que no había visto": "With what's known at this minute, the model got this share of unseen games right",
    "Con nivel 6 / 11 / 16": "At level 6 / 11 / 16",
    "Con poco oro de diferencia, el número se apoya en la fuerza previa y el lado del mapa: es una estimación floja, y por eso el acierto arranca en 62 %.": "With little gold difference, the number leans on prior strength and map side: it's a weak estimate, which is why accuracy starts at 62%.",
    "Controlar los objetivos del mapa": "Control the map objectives",
    "Copiá esta dirección y en OBS agregala en": "Copy this address and in OBS add it under",
    "Cuando varios jugadores de los dos equipos se enfrentan a la vez.": "When several players from both teams fight at once.",
    "Cuartos de final": "Quarterfinals",
    "Curva del draft": "Draft curve",
    "Cuáles torres cayeron (solo cuántas): en el mapa de la mesa se marcan en el orden habitual y se avisa que es estimado.": "Which towers fell (only how many): the desk map marks them in the usual order and flags it as estimated.",
    "Cuándo se equivoca": "When it gets it wrong",
    "Cuánto cambió su parte del daño de su equipo en la pelea": "How much their share of team damage changed in the fight",
    "Cuánto mueve la probabilidad de ganar este juego, según el modelo de RiftPulse.": "How much it moves the chance of winning this game, per the RiftPulse model.",
    "Cómo fue cambiando la probabilidad en el juego": "How the probability changed during the game",
    "Cómo funciona RiftPulse": "How RiftPulse works",
    "Cómo se calcula": "How it's calculated",
    "Cómo se desarrolló": "How it played out",
    "D dragón · A ancestral · B Barón · I inhibidor": "D dragon · A elder · B Baron · I inhibitor",
    "DEMO · partido real del": "DEMO · real match from",
    "DEMO · partido real del {}/{} · ×{}": "DEMO · real match from {}/{} · ×{}",
    "DEMO · partido ya jugado": "DEMO · past match",
    "DRAGÓN": "DRAGON",
    "Dar recursos a {} ({} victorias en el pro)": "Funnel resources to {} ({} wins in pro play)",
    "Datos de esports vía el feed público no oficial de lolesports y rosters (pueden cambiar sin aviso); datos de campeones e ítems por Data Dragon (oficial de Riot) e íconos de objetivos por CommunityDragon. Las probabilidades son estimaciones de un modelo propio, no una certeza; proyecto sin fines de apuestas. Hecho por VectisDev. ·": "Esports data via the unofficial public lolesports feed and rosters (may change without notice); champion and item data from Data Dragon (official, by Riot) and objective icons from CommunityDragon. Probabilities are estimates from our own model, not a certainty; a non-betting project. Made by VectisDev. ·",
    "Datos del feed de lolesports. El feed no trae heraldos, larvas ni bans. El ganador se deduce de torres e inhibidores destruidos.": "Data from the lolesports feed. The feed doesn't include heralds, grubs or bans. The winner is inferred from destroyed towers and inhibitors.",
    "Datos retrasados ·": "Data delayed ·",
    "Datos:": "Data:",
    "Daño a campeones en todo el juego · % de su equipo.": "Champion damage over the whole game · % of their team.",
    "Daño de la pelea": "Fight damage",
    "Daño físico {}% · mágico {}%{}": "Physical damage {}% · magic {}%{}",
    "De dónde salen los datos": "Where the data comes from",
    "De ganar cada mapa": "To win each map",
    "De ganar la serie": "To win the series",
    "De {} juegos de sus jugadores.": "From {} games of its players.",
    "De {} juegos del Mundial 2026.": "From {} Worlds 2026 games.",
    "De {} juegos del Mundial {}.": "From {} Worlds {} games.",
    "Defensas de cada línea. Tirarlas da oro y abre el mapa para el equipo.": "Each lane's defenses. Taking them gives gold and opens the map for the team.",
    "Descargando resultados 2025–2026 de todas las ligas…": "Downloading 2025–2026 results from every league…",
    "Descargando resultados… ({} páginas)": "Downloading results… ({} pages)",
    "Desde ayer": "Since yesterday",
    "Desde el draft:": "From the draft:",
    "Dice que gana el favorito": "Says the favorite wins",
    "Diferencia de Barones": "Baron difference",
    "Diferencia de dragones": "Dragon difference",
    "Diferencia de kills": "Kill difference",
    "Diferencia de oro en el tiempo": "Gold difference over time",
    "Diferencia de oro minuto a minuto: arriba va ganando {}, abajo {}.": "Gold difference minute by minute: above, {} leads; below, {}.",
    "Diferencia de torres": "Tower difference",
    "Draft / esperando que empiece el juego": "Draft / waiting for the game to start",
    "Draft más fuerte temprano": "Stronger early draft",
    "Draft que escala mejor": "Better-scaling draft",
    "Draft y ventana de poder": "Draft and power window",
    "Dragones y alma": "Dragons and soul",
    "Dragones:": "Dragons:",
    "Dragón": "Dragon",
    "Dragón Ancestral": "Elder Dragon",
    "Dragón que aparece después del alma. Da un refuerzo muy fuerte por un rato: suele decidir los juegos largos.": "Dragon that spawns after the soul. Gives a very strong buff for a while: it usually decides long games.",
    "Dragón y alma:": "Dragon and soul:",
    "Duelos por línea · oro": "Lane matchups · gold",
    "EN JUEGO (cargando)": "IN GAME (loading)",
    "EN PAUSA": "PAUSED",
    "EN VIVO · SIN FEED": "LIVE · NO FEED",
    "El Pick'Em oficial se juega en lolesports: ahí iniciás sesión con tu cuenta de Riot y registrás tus picks. Acá solo te sugerimos qué elegir.": "The official Pick'Em is played on lolesports: you sign in there with your Riot account and register your picks. Here we only suggest what to choose.",
    "El cuadro aparece cuando se definen los cuartos de final.": "The bracket shows up once the quarterfinals are set.",
    "El feed no trae bans, así que es \"más elegido\", no presencia pick+ban oficial.": "The feed has no bans, so this is \"most picked\", not official pick+ban presence.",
    "El feed no trae la visión en este juego.": "The feed doesn't include vision for this game.",
    "El feed no trae los ítems en este juego.": "The feed doesn't include items for this game.",
    "El feed oficial da cuántas torres cayeron, no cuáles: en el mapa se marcan en el orden habitual de caída.": "The official feed gives how many towers fell, not which: the map marks them in the usual order.",
    "El feed oficial da las kills cada ~10 s, sin la posición en el mapa.": "The official feed gives kills every ~10 s, without map position.",
    "El giro": "The swing",
    "El giro decisivo": "The decisive swing",
    "El giro decisivo: min": "The decisive swing: min",
    "El gráfico aparece al empezar el juego.": "The chart shows up when the game starts.",
    "El interruptor está en la": "The switch is in the",
    "El juego está por empezar…": "The game is about to start…",
    "El juego todavía no empezó. Tocá cuando veas una kill.": "The game hasn't started yet. Tap when you see a kill.",
    "El panel muestra el mismo juego y minuto que tu video": "The panel shows the same game and minute as your video",
    "El partido del Mundial arranca ahora. Abrí la app para el pronóstico en vivo.": "The Worlds match starts now. Open the app for the live forecast.",
    "El próximo objetivo (dragón, Barón…) y cuánto puede mover la probabilidad": "The next objective (dragon, Baron…) and how much it can move the probability",
    "El rival hace daño casi todo {} (fácil de itemizar)": "The opponent's damage is almost all {} (easy to itemize against)",
    "El rival no tiene frontline": "The opponent has no frontline",
    "Empieza el juego{}": "Game starts{}",
    "En OBS alcanza con": "In OBS all you need is",
    "En OBS, agregá": "In OBS, add a",
    "En cada serie, a la derecha: probabilidad de ganarla (según la fuerza de cada equipo; si se está jugando, suma el juego en curso). En las llaves por definir: probabilidad de cada candidato de llegar ahí, según 20.000 simulaciones.": "For each series, on the right: chance of winning it (from each team's strength; if it's being played, it includes the current game). In undecided slots: each candidate's chance of getting there, from 20,000 simulations.",
    "En chrome://extensions → RiftPulse →": "In chrome://extensions → RiftPulse →",
    "En el juego profesional, el lado azul gana algo más seguido; el modelo lo tiene en cuenta.": "In pro play, blue side wins a bit more often; the model accounts for it.",
    "En juego, al minuto {}:": "In game, at minute {}:",
    "En la app,": "In the app,",
    "En la barra": "In the bar",
    "En la barra sobre el video, en OBS, en la mesa de análisis o en el panel: el porcentaje,": "On the bar over the video, in OBS, at the analysis desk or in the panel: the percentage,",
    "En promedio dijo": "On average it said",
    "En tres pasos": "In three steps",
    "En tu hora local ({}). Tocá uno para el enfrentamiento.": "In your local time ({}). Tap one for the matchup.",
    "En vivo · juegos vistos desde el inicio": "Live · games watched from the start",
    "Equipo más fuerte en 2025–26 (fuerza {} vs {})": "Stronger team in 2025–26 (strength {} vs {})",
    "Error Brier": "Brier error",
    "Error Brier:": "Brier error:",
    "Error medio": "Mean error",
    "Error medio (antes)": "Mean error (before)",
    "Error medio de las probabilidades (Brier): 0 es perfecto; tirar una moneda da 0,25": "Mean error of the probabilities (Brier): 0 is perfect; a coin flip gives 0.25",
    "Escala y % de victorias de ~2,200 juegos profesionales 2025–26. Es contexto para comentar: no cambia la probabilidad.": "Scaling and win % from ~2,200 pro games 2025–26. It's context for commentary: it doesn't change the probability.",
    "Escala y % de victorias de ~{} juegos profesionales {}–{}. Es contexto para comentar: no cambia la probabilidad.": "Scaling and win % from ~{} pro games {}–{}. It's context for commentary: it doesn't change the probability.",
    "Escribe el nombre del integrante.": "Type the crew member's name.",
    "Escribí": "Type",
    "Escribí el minuto como mm:ss (por ejemplo 14:32).": "Type the minute as mm:ss (for example 14:32).",
    "Escribí el minuto del juego que ves en el stream y tocá ⟲ (o Enter) para clavar el overlay a ese momento": "Type the game minute you see on stream and tap ⟲ (or Enter) to pin the overlay to that moment",
    "Esperando datos del juego…": "Waiting for game data…",
    "Esperando el video: abrí el partido en Twitch con el overlay de RiftPulse y la sincronía automática encendida.": "Waiting for the video: open the match on Twitch with the RiftPulse overlay and auto sync on.",
    "Esperando partido": "Waiting for a match",
    "Esperando que empiece el juego (draft)": "Waiting for the game to start (draft)",
    "Estructura de la base. Al romperla, aparecen súbditos más fuertes por esa línea durante unos minutos.": "Base structure. Destroying it spawns stronger minions in that lane for a few minutes.",
    "Extensión actualizada": "Extension updated",
    "Fase completa: {} · {} partidos": "Full stage: {} · {} matches",
    "Fin del juego": "End of the game",
    "Forma (de 5)": "Form (last 5)",
    "Forzar antes de que el rival compre armadura (daño casi todo físico)": "Force fights before the opponent buys armor (almost all physical damage)",
    "Frontline del draft": "Draft frontline",
    "Fuente: el feed público de LoL Esports. Datos de campeones por Data Dragon (oficial de Riot).": "Source: the public LoL Esports feed. Champion data from Data Dragon (official, by Riot).",
    "Fuerza de los equipos": "Team strength",
    "Fuerza estimada del equipo: más alto, más fuerte": "Estimated team strength: higher is stronger",
    "Fuerza: la estimada de cada equipo (más alto, más fuerte). 3-0 y 0-3: terminar el Sistema Suizo invicto o sin ganar. «Directo»: no juega el Play-In. Actualizado {} · {} simulaciones · {} partidos en el cálculo de fuerza.": "Strength: each team's estimate (higher is stronger). 3-0 and 0-3: finishing the Swiss Stage unbeaten or winless. «Direct»: skips the Play-In. Updated {} · {} simulations · {} matches in the strength calculation.",
    "Fuerza: la estimada del equipo según resultados 2025–26 (más alto = más fuerte).": "Strength: the team's estimate from 2025–26 results (higher = stronger).",
    "Ganó": "Won",
    "Glosario para empezar a mirar": "Glossary to get started",
    "Hay una versión nueva de la extensión que sincroniza sola con el video. Se instala": "There's a new version of the extension that syncs with the video on its own. It installs",
    "Impacto del objetivo": "Objective impact",
    "Inhibidor caído": "Inhibitor down",
    "Inhibidores caídos:": "Inhibitors down:",
    "Juego parejo": "Even game",
    "Juego {}": "Game {}",
    "Juego {} en vivo": "Game {} live",
    "K/D/A en la pelea · barra: cuánto más (o menos) daño que su promedio hizo en la pelea": "K/D/A in the fight · bar: how much more (or less) damage than their average they did in the fight",
    "Kills / muertes / asistencias de cada jugador en la pelea.": "Kills / deaths / assists of each player in the fight.",
    "Kills en el tiempo": "Kills over time",
    "Kills · oro": "Kills · gold",
    "La banda clara del gráfico:": "The light band on the chart:",
    "La demo necesita conexión con lolesports: probá de nuevo en un rato": "The demo needs a connection to lolesports: try again in a bit",
    "La diferencia de asesinatos; aporta poco por encima del oro, que ya las incluye en parte.": "The kill difference; it adds little on top of gold, which already partly includes it.",
    "La diferencia de oro entre equipos. Es lo que más pesa, y pesa distinto según el minuto.": "The gold difference between teams. It weighs the most, and differently depending on the minute.",
    "La extensión": "The extension",
    "La extensión es para la compu. En el celu usá RiftPulse": "The extension is for computers. On your phone use RiftPulse",
    "La extensión funciona en": "The extension works on",
    "La partida está por empezar. Apenas lleguen los datos, aparece el pronóstico en vivo.": "The game is about to start. As soon as data arrives, the live forecast shows up.",
    "La primera vez que un jugador elimina a un rival en el juego.": "The first time a player kills an opponent in the game.",
    "La probabilidad de la serie aparece con el juego en curso.": "The series probability shows up once the game is in progress.",
    "La tabla por récord queda oculta para no spoilear el VOD que estás viendo.": "The standings by record are hidden so the VOD you're watching isn't spoiled.",
    "Lado azul: gana un poco más seguido en el profesional": "Blue side: wins a bit more often in pro play",
    "Lado del mapa": "Map side",
    "Larvas del Vacío": "Void Grubs",
    "Las barras muestran cuánto empuja cada cosa hacia un lado (a la derecha del centro, hacia el azul). El modelo en vivo además suma la": "The bars show how much each thing pushes to one side (right of center, toward blue). The live model also adds the",
    "Le gané al modelo": "I beat the model",
    "Lee el partido": "Reads the match",
    "Lee el reloj y el marcador del video y se sincroniza solo con el minuto que ves": "Reads the clock and scoreboard from the video and syncs on its own to the minute you're watching",
    "Listo: retraso ajustado a {} s. Si los datos todavía van adelantados, tocá +1; si van atrasados, −1.": "Done: delay set to {} s. If the data is still ahead, tap +1; if it's behind, −1.",
    "Llega con los datos de los jugadores.": "Arrives with the player data.",
    "Lo mínimo para volver al 50%:": "The least it takes to get back to 50%:",
    "Lo que el feed no cuenta.": "What the feed doesn't tell.",
    "Lo que ganan los jugadores al eliminar rivales y tirar objetivos. Con más oro compran mejores ítems.": "What players earn by killing opponents and taking objectives. More gold buys better items.",
    "Lo que más lo acerca:": "What gets them closest:",
    "Los campeones suben de nivel con la experiencia; en el 6, el 11 y el 16 mejora su habilidad definitiva.": "Champions level up with experience; at 6, 11 and 16 their ultimate improves.",
    "Los dos drafts tienen una curva parecida.": "Both drafts have a similar curve.",
    "Los juegos que faltan se cuentan 50/50: el motor no estima la fuerza previa de los equipos.": "Remaining games count as 50/50: the engine doesn't estimate the teams' prior strength.",
    "Los objetivos que más cambian un juego en un solo momento.": "The objectives that change a game the most in a single moment.",
    "Los pesos se aprendieron por separado para los minutos 10, 15, 20 y 25, y se interpolan para el minuto exacto. La suma pasa por una función logística, que la convierte en un porcentaje entre 0 y 100.": "The weights were learned separately for minutes 10, 15, 20 and 25, and are interpolated for the exact minute. The sum goes through a logistic function that turns it into a percentage between 0 and 100.",
    "Los picks de los integrantes del stream. Al terminar cada partido se marcan solos como acierto o fallo y suman al marcador.": "Picks from your stream crew. When each match ends they're marked right or wrong on their own and added to the scoreboard.",
    "Los primeros minutos.": "The first minutes.",
    "Línea de tiempo de oro en CSV (Excel)": "Gold timeline as CSV (Excel)",
    "Línea: probabilidad. Área: oro (arriba {}, abajo {}). D dragón · A ancestral · B Barón · I inhibidor.": "Line: probability. Area: gold (top {}, bottom {}). D dragon · A elder · B Baron · I inhibitor.",
    "Mapa de la Grieta": "Rift map",
    "Mapa de la Grieta del Invocador": "Summoner's Rift map",
    "Mejor % de victorias": "Best win rate",
    "Mejor % de victorias (≥3)": "Best win rate (≥3)",
    "Mejor % de victorias · >{} ({} juegos)": "Best win rate · >{} ({} games)",
    "Mejor % de victorias · {} ({} juegos)": "Best win rate · {} ({} games)",
    "Mejor KDA (≥2 juegos)": "Best KDA (≥2 games)",
    "Mejor KDA · {} con {}": "Best KDA · {} with {}",
    "Mejor de": "Best of",
    "Mejor forma reciente: {} ({} de 5 ganadas)": "Best recent form: {} ({} of 5 won)",
    "Mi récord del Mundial": "My Worlds record",
    "Minuto 10": "Minute 10",
    "Minuto 15": "Minute 15",
    "Minuto 20": "Minute 20",
    "Minuto 25": "Minute 25",
    "Minuto del juego": "Game minute",
    "Minuto que ves:": "Minute you're watching:",
    "Minuto {} · el modelo se actualiza con oro, torres, dragones, almas, Barón e inhibidores.": "Minute {} · the model updates with gold, towers, dragons, souls, Baron and inhibitors.",
    "Modelo entrenado · juegos que no vio": "Trained model · unseen games",
    "Modo sin spoilers": "No-spoilers mode",
    "Momentos clave del juego (en vivo no se puede saltar)": "Key moments of the game (can't jump while live)",
    "Momentos para editores{}": "Moments for editors{}",
    "Montaña": "Mountain",
    "Mostrar overlay": "Show overlay",
    "Mostrar predicciones en pantalla": "Show predictions on screen",
    "Mostrar resultados": "Show results",
    "Más elegido · {} veces · {} victorias": "Most picked · {} times · {} wins",
    "Más elegido · {} veces · {}% victorias": "Most picked · {} times · {}% wins",
    "Más elegidos": "Most picked",
    "Mínimo 2 juegos.": "At least 2 games.",
    "Mínimo 3 juegos elegido.": "Picked in at least 3 games.",
    "Mínimo: la barra y los giros. Estándar: además el objetivo que viene y lo que pasó en cada pelea en equipo. Show: además el oro y los duelos de vez en cuando.": "Minimal: the bar and swings. Standard: also the upcoming objective and what happened in each teamfight. Show: also gold and matchups now and then.",
    "Nada empuja hacia ningún lado.": "Nothing pushes either way.",
    "Nadie está por debajo del 45%.": "Nobody is below 45%.",
    "Ninguna jugada corta lo pone arriba; lo que más acerca:": "No single short play puts them ahead; what gets them closest:",
    "Niveles, visión e ítems": "Levels, vision and items",
    "No cargó el motor (engine.js).": "The engine didn't load (engine.js).",
    "No encontré kills en los últimos 4 minutos de datos. Ajuste con los botones ±.": "I found no kills in the last 4 minutes of data. Adjust with the ± buttons.",
    "No hay partido en vivo ahora.": "No live match right now.",
    "No hay partido en vivo. {}": "No live match. {}",
    "No hay partidos para ese día.": "No matches that day.",
    "No hay partidos para repetir todavía.": "No matches to replay yet.",
    "No hay un partido del Mundial en vivo ahora.": "No Worlds match live right now.",
    "No hay un partido en vivo en este momento.": "No live match at the moment.",
    "No pude actualizar el calendario del Mundial (": "I couldn't update the Worlds schedule (",
    "No pude calcular las probabilidades ({}).": "I couldn't calculate the probabilities ({}).",
    "No pude cargar este juego ({}).": "I couldn't load this game ({}).",
    "No pude cargar la repetición (": "I couldn't load the replay (",
    "No pude ver los partidos en vivo (": "I couldn't see the live matches (",
    "No sabe dónde está cada jugador ni quién tiene las habilidades definitivas listas. Los niveles, las wards y los ítems completos se muestran aparte cuando el feed los trae, pero no entran al cálculo.": "It doesn't know where each player is or who has their ultimate ready. Levels, wards and finished items are shown separately when the feed has them, but they aren't part of the calculation.",
    "No se pudo abrir el juego:": "Couldn't open the game:",
    "No se pudo copiar: el navegador no dio permiso. Probá de nuevo con un clic.": "Couldn't copy: the browser didn't allow it. Try again with a click.",
    "No se pudo descargar el archivo. Probá de nuevo.": "Couldn't download the file. Try again.",
    "No se pudo guardar (¿fotos muy pesadas?)": "Couldn't save (photos too large?)",
    "Nombre del integrante": "Crew member name",
    "Norteamérica": "North America",
    "Objetivo grande que aparece al min 20. Da un refuerzo a todo el equipo para empujar y cerrar el juego.": "Big objective that spawns at min 20. Gives the whole team a buff to push and close the game.",
    "Objetivo que aparece cada 5 minutos. Cada uno da una mejora para siempre; con 4, el equipo gana el alma.": "Objective that spawns every 5 minutes. Each one gives a permanent buff; with 4, the team gets the soul.",
    "Objetos que dan visión de una zona del mapa: más wards, menos sorpresas.": "Items that give vision of an area of the map: more wards, fewer surprises.",
    "Ocultar predicciones en pantalla": "Hide predictions on screen",
    "Oculto para no spoilear: tocá para ver": "Hidden to avoid spoilers: tap to see",
    "Ocultá los resultados que todavía no viste. Se tapan los marcadores en Ahora, el Mundial, el Historial y Mando; tocá uno para verlo.": "Hide results you haven't seen yet. Scores are covered in Now, Worlds, History and Control room; tap one to see it.",
    "Océano": "Ocean",
    "Oro y objetivos": "Gold and objectives",
    "Oro, kills, torres, inhibidores, dragones (con su tipo), Barones y Ancestral de cada equipo.": "Gold, kills, towers, inhibitors, dragons (with their type), Barons and Elder for each team.",
    "Oro:": "Gold:",
    "Overlay clavado al {}:{} del video.": "Overlay pinned to {}:{} of the video.",
    "Overlay que se actualiza solo": "Self-updating overlay",
    "Pacífico": "Pacific",
    "Panel automático quitado.": "Automatic panel removed.",
    "Panel: cómo va cada jugador contra su rival de línea": "Panel: how each player is doing against their lane opponent",
    "Panel: el daño de cada jugador": "Panel: each player's damage",
    "Panel: la diferencia de oro minuto a minuto": "Panel: gold difference minute by minute",
    "Panel: las jugadas que más movieron la probabilidad": "Panel: the plays that moved the probability the most",
    "Paneles automáticos (aparecen solos cuando aportan)": "Automatic panels (show up on their own when useful)",
    "Paneles fijos (opcional: si no, aparecen solos en su momento)": "Pinned panels (optional: otherwise they show up on their own at the right time)",
    "Para comentar": "For commentary",
    "Para que controle el overlay en OBS: agregá esta página como": "To control the overlay in OBS: add this page as a",
    "Para que el": "So that the",
    "Para remontar,": "To come back,",
    "Para ver RiftPulse sobre el video,": "To see RiftPulse over the video,",
    "Partidos: automático (el próximo día con partidos)": "Matches: automatic (the next match day)",
    "Partidos: el próximo día con partidos": "Matches: the next match day",
    "Pasó de verdad": "What actually happened",
    "Pegalo en la descripción del video de YouTube": "Paste it in the YouTube video description",
    "Pelea en equipo (5v5)": "Teamfight (5v5)",
    "Pelea en equipo (min": "Teamfight (min",
    "Pelea en equipo · min": "Teamfight · min",
    "Pelea:": "Fight:",
    "Pelea: {} {} – {} {}": "Fight: {} {} – {} {}",
    "Pelear desde atrás: sin tanque, evitar iniciaciones del rival": "Fight from the backline: no tank, avoid the opponent's engages",
    "Picos de poder": "Power spikes",
    "Poniéndome al día ·": "Catching up ·",
    "Por definir": "TBD",
    "Por eso habla de probabilidad: 75 % quiere decir que, de cada 4 juegos parecidos, 1 lo termina ganando el otro.": "That's why it speaks in probabilities: 75% means that in every 4 similar games, the other team ends up winning 1.",
    "Por juego:": "Per game:",
    "Por jugador: campeón, K/D/A, oro, CS, nivel, % del daño y participación en kills.": "Per player: champion, K/D/A, gold, CS, level, % of damage and kill participation.",
    "Posición de los jugadores ni de las kills en el mapa.": "Player or kill positions on the map.",
    "Posición y visibilidad": "Position and visibility",
    "Pozo del Barón": "Baron pit",
    "Pozo del dragón": "Dragon pit",
    "Predicción previa": "Pre-game prediction",
    "Predicción previa al juego": "Pre-game prediction",
    "Predicción previa al juego (pesa menos con los minutos)": "Pre-game prediction (weighs less as minutes pass)",
    "Presionar antes de la resistencia mágica (daño casi todo mágico)": "Press before magic resist is bought (almost all magic damage)",
    "Prob. campeón": "Title odds",
    "Probabilidad de": "Chance of",
    "Probabilidad de 20.000 simulaciones.": "Probability from 20,000 simulations.",
    "Probabilidad de cada pick en 20.000 simulaciones del torneo con su formato oficial.": "Probability of each pick in 20,000 simulations of the tournament with its official format.",
    "Probabilidad de que cada equipo gane el Mundial 2026, según 20.000 simulaciones del torneo con su formato oficial.": "Chance of each team winning Worlds 2026, from 20,000 simulations of the tournament with its official format.",
    "Probabilidad de {} (arriba) frente a {} (abajo) en todo el juego. Sombreado: giros clave. La banda clara: cuánta confianza darle en cada minuto (más ancha cuando el modelo acierta menos).": "Probability of {} (top) vs {} (bottom) across the whole game. Shaded: key swings. The light band: how much to trust it at each minute (wider when the model is right less often).",
    "Probabilidad en todo el juego con su banda de confianza": "Probability across the whole game with its confidence band",
    "Probalo vos: el simulador": "Try it yourself: the simulator",
    "Pronóstico": "Forecast",
    "Pronóstico de un modelo propio, sin apuestas. No avalado por Riot Games. #Worlds2026": "Forecast from our own model, no betting. Not endorsed by Riot Games. #Worlds2026",
    "Pronóstico previo": "Pre-game forecast",
    "Pronóstico previo al juego": "Pre-game forecast",
    "Prueba con 589 juegos de agosto a octubre de 2026 que el modelo no vio (ligas regionales e internacionales). Entrenado con 1658 juegos anteriores; la version activa usa los 2247 juegos.": "Tested on 589 games from August to October 2026 the model never saw (regional and international leagues). Trained on 1,658 earlier games; the live version uses all 2,247 games.",
    "Próx.": "Next",
    "Próximo partido:": "Next match:",
    "Próximo:": "Next:",
    "Próximo: {} · {}": "Next: {} · {}",
    "Puesta a punto · {} de 3": "Setup · {} of 3",
    "Punto de alma": "Soul point",
    "Punto de alma: {}": "Soul point: {}",
    "Puntos de probabilidad:": "Probability points:",
    "Puntos de probabilidad: +10 puntos es pasar, por ejemplo, de 50 % a 60 % de chances de ganar.": "Probability points: +10 points means going, for example, from 50% to 60% chance to win.",
    "Puntos para comentar": "Talking points",
    "Quita el panel automático que se está mostrando": "Removes the automatic panel being shown",
    "Quién dominó cada aspecto. El oro compra ítems; torres, dragones y barones son los objetivos del mapa.": "Who dominated each aspect. Gold buys items; towers, dragons and Barons are the map objectives.",
    "Quién llegaba como favorito. Pesa mucho al principio y casi nada después.": "Who came in as the favorite. It weighs a lot early and almost nothing later.",
    "Qué cambió en el último minuto": "What changed in the last minute",
    "Qué está leyendo del video (por si no sincroniza)": "What it's reading from the video (in case it doesn't sync)",
    "Qué mira el modelo": "What the model looks at",
    "Qué tan seguido acierta": "How often it's right",
    "Qué tan seguido acierta el sistema, medido con partidos que no había visto.": "How often the system is right, measured on matches it hadn't seen.",
    "Reaparece en": "Respawns in",
    "Referencia: tirar una moneda acierta el 50%. Cada predicción se hizo sin conocer el resultado.": "For reference: a coin flip is right 50% of the time. Every prediction was made without knowing the result.",
    "Reloj del draft:": "Draft clock:",
    "Reloj leído": "Clock read",
    "Rendimiento por jugador": "Player performance",
    "Repetición": "Replay",
    "Resultados de la serie ocultos": "Series results hidden",
    "Resumen del juego{} · {} vs {}": "Game recap{} · {} vs {}",
    "RiftPulse listo": "RiftPulse ready",
    "RiftPulse mira el mismo partido que vos y responde una pregunta:": "RiftPulse watches the same match as you and answers one question:",
    "RiftPulse solo trabaja en twitch.tv y lolesports.com, no lee ni envía nada de ninguna cuenta y la lectura del video ocurre en tu compu. El «Modo de desarrollador» solo permite instalar extensiones desde una carpeta; podés apagarlo después. No está afiliada a Riot Games.": "RiftPulse only works on twitch.tv and lolesports.com, reads or sends nothing from any account, and the video is read on your computer. «Developer mode» only allows installing extensions from a folder; you can turn it off afterwards. Not affiliated with Riot Games.",
    "RiftPulse · Cuadro del Mundial": "RiftPulse · Worlds bracket",
    "RiftPulse · El Mundial, jugada a jugada": "RiftPulse · Worlds, play by play",
    "RiftPulse · Predicciones del staff": "RiftPulse · Staff predictions",
    "RiftPulse · fin del juego": "RiftPulse · end of the game",
    "RiftPulse · probabilidad en vivo": "RiftPulse · live probability",
    "RiftPulse · pronóstico en vivo": "RiftPulse · live forecast",
    "RiftPulse · pronóstico en vivo para comentar el Mundial": "RiftPulse · live forecast for Worlds commentary",
    "RiftPulse — Mesa de análisis": "RiftPulse — Analysis desk",
    "Ritmo flexible: adaptarse a cómo evoluciona el mapa": "Flexible pace: adapt to how the map evolves",
    "Robar objetivos y forzar el caos para compensar el nivel": "Steal objectives and force chaos to make up for the skill gap",
    "SINCRONIZADO CON TU VIDEO": "SYNCED WITH YOUR VIDEO",
    "Saltar la pieza": "Skip the piece",
    "Se actualiza solo con el partido. Al terminar el juego se habilita la imagen del resumen.": "Updates on its own with the match. When the game ends, the recap image becomes available.",
    "Se arma con la opción más probable de cada casilla, si el Pick'Em usa el formato de 2025 (dos 3-0, dos 0-3 y cinco que avanzan). Los Pick'Ems del Sistema Suizo abren el 18 de octubre y cierran el 23 antes del primer partido.": "Built from the most likely option in each slot, if the Pick'Em uses the 2025 format (two 3-0, two 0-3 and five that advance). Swiss Stage Pick'Ems open October 18 and close on the 23rd before the first match.",
    "Se dibuja conforme avanza el juego…": "It draws itself as the game goes on…",
    "Se escribe sola a medida que avanza el juego (desde el min 7).": "It writes itself as the game goes on (from min 7).",
    "Se escribe sola a medida que avanza el juego.": "It writes itself as the game goes on.",
    "Se llena solo: por cada juego que veas en vivo desde el inicio, guarda la predicción de antes del juego y, al terminar, el resultado.": "Fills in on its own: for every game you watch live from the start, it saves the pre-game prediction and, at the end, the result.",
    "Según RiftPulse": "According to RiftPulse",
    "Según RiftPulse · #Worlds2026": "According to RiftPulse · #Worlds2026",
    "Serie Bo{}": "Bo{} series",
    "Serie en pantalla": "Series on screen",
    "Serie {}–{}: si gana {} este juego, queda con {} de llevársela.": "Series {}–{}: if {} wins this game, they'd have {} to take it.",
    "Serie · Bo": "Series · Bo",
    "Series del Mundial 2026 elegidas antes de empezar. RiftPulse: probabilidad de su modelo en ese momento.": "Worlds 2026 series picked before they started. RiftPulse: its model's probability at that moment.",
    "Si gana": "If it wins",
    "Si la composición quiere ganar temprano o escala a tardío.": "Whether the comp wants to win early or scales into late game.",
    "Si no está en verde:": "If it isn't green:",
    "Simulado con el mismo modelo: suma esos objetivos al estado actual del juego.": "Simulated with the same model: adds those objectives to the current game state.",
    "Simulado con el modelo de RiftPulse sobre el estado actual del juego.": "Simulated with the RiftPulse model on the current game state.",
    "Sin agenda.": "No schedule.",
    "Sin cambios en el mapa: el modelo se mueve solo por el reloj.": "No changes on the map: the model only moves with the clock.",
    "Sin datos nuevos (": "No new data (",
    "Sin enfrentamientos previos registrados.": "No previous meetings on record.",
    "Sin eventos aún.": "No events yet.",
    "Sin factores claros.": "No clear factors.",
    "Sin la pieza del director abierta": "Without the director piece open",
    "Sin la pieza del director abierta (overlay.html?view=auto)": "Without the director piece open (overlay.html?view=auto)",
    "Sin objetivos grandes a la vista.": "No big objectives in sight.",
    "Sin objetivos mayores.": "No major objectives.",
    "Sin partido en vivo": "No live match",
    "Sin prueba todavía.": "No test yet.",
    "Sin próximos partidos.": "No upcoming matches.",
    "Sin resultados recientes.": "No recent results.",
    "Sin series entre ellos en 2025–26.": "No series between them in 2025–26.",
    "Sincronizado ·": "Synced ·",
    "Sincronizar al minuto que escribiste": "Sync to the minute you typed",
    "Sincronizá el video para saltar a cada momento": "Sync the video to jump to each moment",
    "Sincronía con el stream": "Sync with the stream",
    "Sincronía con el video": "Sync with the video",
    "Solo la barra": "Only the bar",
    "Solo lo esencial para comentar en vivo": "Only the essentials for live commentary",
    "Solo los porcentajes, lo más chico posible": "Only the percentages, as small as possible",
    "Sugerencias del sistema para el Pick'Em oficial del Mundial. Tus picks se registran en lolesports; acá te ayudamos a decidir.": "The system's suggestions for the official Worlds Pick'Em. Your picks are registered on lolesports; here we help you decide.",
    "Sí": "Yes",
    "Tardío y abierto": "Late and open",
    "Tipo de daño del draft": "Draft damage type",
    "Tocalo justo cuando veas en el stream la primera kill de una pelea": "Tap it right when you see the first kill of a fight on stream",
    "Tocá un punto del mapa: kills, dragón, Barón o cada base.": "Tap a spot on the map: kills, dragon, Baron or each base.",
    "Tocá un punto para ir a ese momento del video": "Tap a point to jump to that moment of the video",
    "Todavía nadie tomó el Barón.": "Nobody has taken Baron yet.",
    "Todavía no hay datos para ese momento: subí el retraso unos segundos.": "There's no data for that moment yet: raise the delay a few seconds.",
    "Todavía no hay giros de 9 puntos o más.": "No swings of 9 points or more yet.",
    "Todavía no hay partidos de esta fase en el calendario.": "No matches from this stage on the schedule yet.",
    "Todavía no hay partidos jugados.": "No matches played yet.",
    "Todavía no hay partidos terminados.": "No finished matches yet.",
    "Todavía no hubo kills.": "No kills yet.",
    "Todavía no se tomó ningún dragón.": "No dragon taken yet.",
    "Todo abierto: el próximo": "Wide open: the next",
    "Todos los datos del juego en JSON": "All game data as JSON",
    "Toma el": "Takes the",
    "Torres derribadas al rival:": "Enemy towers destroyed:",
    "Torres e inhibidores": "Towers and inhibitors",
    "Torres e inhibidores:": "Towers and inhibitors:",
    "Torres perdidas:": "Towers lost:",
    "Título (ej.: Predicciones del stream)": "Title (e.g.: Stream predictions)",
    "Un Barón robado, un ace en el minuto 35 o un error en la base dan vuelta un juego que el modelo daba por ganado. Lo ve recién cuando pasa.": "A stolen Baron, an ace at minute 35 or a mistake in the base can flip a game the model had as won. It only sees it when it happens.",
    "Un equipo que va abajo pero escala mejor puede remontar; la curva del draft lo tiene en cuenta solo en parte.": "A team that's behind but scales better can come back; the draft curve only partly accounts for it.",
    "Un minuto se acepta solo si aparece en": "A minute is accepted only if it shows up in",
    "Una medida de la fuerza de cada equipo según sus resultados: sube al ganar y baja al perder.": "A measure of each team's strength from its results: it goes up with wins and down with losses.",
    "Una pelea decide todo.": "One fight decides everything.",
    "Ventaja construida de a poco:": "Lead built little by little:",
    "Ventaja temprana": "Early lead",
    "Ver a {} en op.gg": "See {} on op.gg",
    "Ver el detalle técnico: tablas, calibración y error medio": "See the technical detail: tables, calibration and mean error",
    "Volver a su lugar (debajo del marcador o arriba de las estadísticas)": "Back to its place (below the scoreboard or above the stats)",
    "a este minuto acierta {}%": "accuracy at this minute {}%",
    "a favor de {}": "in favor of {}",
    "abajo: ventaja de {}": "bottom: {} lead",
    "abrí este partido en Twitch →": "open this match on Twitch →",
    "acierta al ganador de la serie": "picks the series winner",
    "acierta al ganador del juego": "picks the game winner",
    "acierta en el minuto {}": "right at minute {}",
    "al mejor de 1, 3 o 5 juegos. Gana la serie quien gana 1, 2 o 3.": "best of 1, 3 or 5 games. Whoever wins 1, 2 or 3 wins the series.",
    "algo falló al pedir los datos": "something failed while fetching the data",
    "alrededor de la línea de probabilidad hay una franja que se angosta a medida que avanza el juego. Su ancho sale de este acierto medido en cada minuto: es ancha al principio, cuando el modelo acierta 62 %, y fina al final, cuando acierta más de 83 %. Es una guía de cuánta confianza darle al número en ese momento, no un intervalo estadístico.": "around the probability line there's a band that narrows as the game goes on. Its width comes from the accuracy measured at each minute: wide early, when the model is right 62% of the time, and thin late, when it's right more than 83%. It's a guide to how much to trust the number at that moment, not a statistical interval.",
    "antes del entrenamiento: {}%": "before training: {}%",
    "antes del juego · {} juegos": "before the game · {} games",
    "antes del partido · {} series": "before the match · {} series",
    "aparece un dragón cada 5 minutos y cada uno da una mejora para siempre. Con 4, el equipo gana el": "a dragon spawns every 5 minutes and each gives a permanent buff. With 4, the team gets the",
    "arriba: ventaja de {}": "top: {} lead",
    "buscando el reloj del juego…": "looking for the game clock…",
    "buscando…": "searching…",
    "cada 2 segundos: oro, kills, torres, dragones, Barones e inhibidores de cada equipo. En la extensión, además": "every 2 seconds: gold, kills, towers, dragons, Barons and inhibitors for each team. In the extension, it also",
    "cada equipo juega contra rivales con su mismo récord. Con 3 victorias clasifica; con 3 derrotas queda afuera.": "each team plays opponents with the same record. 3 wins qualifies; 3 losses is out.",
    "cargando…": "loading…",
    "cerró con": "closed with",
    "cerró el juego en": "closed the game in",
    "convierte ese estado en una probabilidad de victoria. Sabe que 3k de oro al minuto 12 no valen lo mismo que al minuto 30.": "turns that state into a win probability. It knows 3k gold at minute 12 isn't worth the same as at minute 30.",
    "de Twitch y se sincroniza sola con el minuto que ves. Desde acá la manejás: qué paneles, dónde y cuándo.": "on Twitch and syncs on its own to the minute you're watching. You control it from here: which panels, where and when.",
    "de ganar la serie (Bo": "to win the series (Bo",
    "de ganar la serie (Bo{}, {}–{}).": "to win the series (Bo{}, {}–{}).",
    "de llevarse la serie": "to take the series",
    "de ser campeón": "to be champion",
    "después:": "after:",
    "dragones más": "more dragons",
    "dragón": "dragon",
    "dragón más": "one more dragon",
    "el Barón": "the Baron",
    "el Barón activo": "the active Baron",
    "el Barón del min {} le abrió el mapa": "the min {} Baron opened up the map",
    "el alma de dragón": "the dragon soul",
    "el control de dragones inclinó las peleas": "dragon control tilted the fights",
    "en": "in",
    "en OBS, 1920 × 1080. Agregá": "in OBS, 1920 × 1080. Add",
    "en curso": "in progress",
    "en el último minuto de juego.": "in the last minute of play.",
    "equilibrado, algo más tardío": "balanced, a bit later",
    "equilibrado, algo más temprano": "balanced, a bit earlier",
    "este juego": "this game",
    "está en": "is at",
    "está en {}%. Lo mínimo para volver al 50%:": "is at {}%. The least it takes to get back to 50%:",
    "está en {}%. Necesita": "is at {}%. It needs",
    "está en {}. {}": "is at {}. {}",
    "estás viendo un VOD, así que se ocultan los resultados de este partido y de los siguientes.": "you're watching a VOD, so results for this match and the following ones are hidden.",
    "feed en vivo": "live feed",
    "feed oficial de LoL Esports": "official LoL Esports feed",
    "físico": "physical",
    "ganó": "won",
    "ganó el juego en": "won the game in",
    "inhibidor más": "one more inhibitor",
    "inhibidores más": "more inhibitors",
    "instalala de nuevo con la guía": "reinstall it with the guide",
    "juego en pausa ·": "game paused ·",
    "juego tardío, quiere llegar a peleas grandes": "late game, wants to reach big fights",
    "kill más": "one more kill",
    "kills más": "more kills",
    "kills · duración {}{}": "kills · duration {}{}",
    "kills · minuto {}": "kills · minute {}",
    "la ganó": "won by",
    "las defensas de cada línea y de la base. Tirarlas da oro y abre el mapa.": "the defenses of each lane and the base. Taking them gives gold and opens the map.",
    "le gané al modelo": "I beat the model",
    "leyendo el reloj…": "reading the clock…",
    "lo definió en un final cerrado": "settled it in a close finish",
    "lo que ganan los jugadores al eliminar rivales y tirar objetivos. Con más oro compran mejores ítems; es lo que más pesa en el modelo.": "what players earn by killing opponents and taking objectives. More gold buys better items; it's what weighs most in the model.",
    "lolesports todavía no publicó esos datos": "lolesports hasn't published that data yet",
    "mapas que faltan estimados con el Elo de RiftPulse": "remaining maps estimated with RiftPulse's Elo",
    "mapas que faltan estimados con los resultados del Mundial": "remaining maps estimated with Worlds results",
    "mide qué tan buenas son las probabilidades, no solo si acierta. Decir 95 % y fallar suma mucho error; decir 60 % y fallar, poco. Una moneda da 0,250: menos es mejor. Por eso, en la barra del overlay, el número de acierto cambia con el minuto del juego.": "measures how good the probabilities are, not just whether it's right. Saying 95% and missing adds a lot of error; saying 60% and missing, little. A coin flip gives 0.250: lower is better. That's why the accuracy number on the overlay bar changes with the game minute.",
    "muestra estas explicaciones sobre los mismos términos mientras mirás.": "shows these explanations on the same terms while you watch.",
    "murió en la pelea": "died in the fight",
    "mágico": "magic",
    "necesita sacar ventaja antes del min ~20–24.": "needs to get ahead before min ~20–24.",
    "necesita ventaja antes del min ~24; después el draft favorece a": "needs a lead before min ~24; after that the draft favors",
    "no está avalado por Riot Games y no refleja las opiniones de Riot Games ni de nadie oficialmente involucrado en League of Legends. League of Legends y Riot Games son marcas o marcas registradas de Riot Games, Inc. Las probabilidades son estimaciones de un modelo propio, no una certeza; proyecto sin fines de apuestas. Hecho por VectisDev.": "isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. Probabilities are estimates from our own model, not a certainty; a non-betting project. Made by VectisDev.",
    "no está avalado por Riot Games y no refleja las opiniones de Riot Games ni de nadie oficialmente involucrado en League of Legends. League of Legends y Riot Games son marcas o marcas registradas de Riot Games, Inc. League of Legends © Riot Games, Inc.": "isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.",
    "no pude leer el video, reintento…": "couldn't read the video, retrying…",
    "no reconozco el partido (mirá el diagnóstico)": "I don't recognize the match (see diagnostics)",
    "objetivo grande que aparece al min 20. Da un refuerzo a todo el equipo para empujar y cerrar el juego.": "big objective that spawns at min 20. Gives the whole team a buff to push and close the game.",
    "para mostrar el mismo minuto que estás viendo.": "to show the same minute you're watching.",
    "para márgenes amplios y": "for wide margins and",
    "para quitar la marca. Con": "to remove the branding. With",
    "para volver al": "to get back to",
    "por qué": "why",
    "próx.": "next",
    "próximo:": "next:",
    "que corre en vivo. Mové el estado del partido y mirá cómo cambia la probabilidad del equipo azul. Todo se cuenta desde el lado azul: un valor negativo es ventaja del rojo.": "that runs live. Move the match state and watch how the blue team's probability changes. Everything is counted from the blue side: a negative value is a red lead.",
    "reaparece 6:00 después": "respawns 6:00 later",
    "reconociendo el partido…": "recognizing the match…",
    "remontó tras ir en desventaja temprana": "came back after an early deficit",
    "repetición en pantalla · vuelve con el juego": "replay on screen · back with the game",
    "se actualiza con cada resultado": "updates with every result",
    "se juega 20,000 veces con el formato oficial: Play-In de doble eliminación al mejor de 5, Sistema Suizo (al mejor de 1, y al mejor de 3 cuando se define si un equipo avanza o queda fuera), cuartos con sorteo de los 3-0 contra 3-2, y eliminatorias al mejor de 5.": "is played 20,000 times with the official format: double-elimination best-of-5 Play-In, Swiss Stage (best of 1, and best of 3 when a team advances or is eliminated), quarterfinals drawing 3-0 teams against 3-2, and best-of-5 knockouts.",
    "se vuelve más fuerte desde el min ~28 si el oro va parejo.": "gets stronger from min ~28 if gold stays even.",
    "seguí la guía": "follow the guide",
    "según el modelo · sombreado: giros clave": "according to the model · shaded: key swings",
    "series del Mundial 2026": "Worlds 2026 series",
    "sin conexión": "offline",
    "sincronizado ·": "synced ·",
    "sumó": "added",
    "terminó": "ended",
    "tiene que sacar ventaja antes del min ~24; después el draft favorece a": "has to get ahead before min ~24; after that the draft favors",
    "tocá para ver": "tap to see",
    "toma el Barón Nashor": "takes Baron Nashor",
    "tomó el control desde la fase de líneas": "took control from the laning phase",
    "tomó el control temprano: +": "took control early: +",
    "torre más": "one more tower",
    "torres más": "more towers",
    "un Elo con todos los partidos de 2025 y 2026 de LCK, LPL, LEC, LCS, CBLOL, LCP, First Stand, MSI, Copa Mundial de Esports y Worlds. Cada región tiene un ajuste que solo se mueve con partidos internacionales.": "an Elo with every 2025 and 2026 match from LCK, LPL, LEC, LCS, CBLOL, LCP, First Stand, MSI, Esports World Cup and Worlds. Each region has an adjustment that only moves with international matches.",
    "un dragón": "a dragon",
    "una medida de la fuerza de cada equipo según sus resultados: sube al ganar y baja al perder.": "a measure of each team's strength from its results: it goes up with wins and down with losses.",
    "una moneda": "a coin flip",
    "una pelea ganada (+{} kills)": "a won teamfight (+{} kills)",
    "venció a {} en {} min": "beat {} in {} min",
    "ventaja de oro y presión en el mapa": "gold lead and map pressure",
    "y tocá ↻ en la extensión.": "and tap ↻ on the extension.",
    "y tocá ↻.": "and tap ↻.",
    "ya está": "already up",
    "ya está en el mapa": "already on the map",
    "ya está en el mapa: si lo toma": "already on the map: if taken by",
    "{} Barón": "{} Baron",
    "{} de {}": "{} of {}",
    "{} dragón{} más": "{} more dragon{}",
    "{} juegos que el modelo no vio": "{} games the model never saw",
    "{} llega con más fuerza ({} {} · {} {})": "{} comes in stronger ({} {} · {} {})",
    "{} partido": "{} match",
    "{} partidos": "{} matches",
    "{} torre{} más": "{} more tower{}",
    "{} · minuto {}": "{} · minute {}",
    "{} · si gana": "{} · if it wins",
    "{} · sin objetivos aún": "{} · no objectives yet",
    "{}% de acierto al min {} ({} juegos de prueba)": "{}% accuracy at min {} ({} test games)",
    "{}% del daño del equipo": "{}% of team damage",
    "{}. Video: {} s detrás del juego. Datos: llegan con {} s. Se usa el mayor. Si ves una kill antes acá que en el video, tocá +1.": "{}. Video: {} s behind the game. Data: arrives with {} s. The larger one is used. If you see a kill here before the video, tap +1.",
    "{}/{}/{} · {} CS · Nv {} · {}% daño · {}% KP": "{}/{}/{} · {} CS · Lv {} · {}% dmg · {}% KP",
    "{}: {} dragones": "{}: {} dragons",
    "{}k de oro de ventaja": "{}k gold lead",
    "{}Área: oro (arriba {}, abajo {}). D dragón · A ancestral · B Barón · I inhibidor.": "{}Area: gold (top {}, bottom {}). D dragon · A elder · B Baron · I inhibitor.",
    "¡Copiada! Pegala en una pestaña nueva.": "Copied! Paste it in a new tab.",
    "¡Remontada! Estuvo al": "Comeback! It was at",
    "¡alma!": "soul!",
    "¡ya empieza!": "starting now!",
    "«Permitir scripts de usuario»": "«Allow User Scripts»",
    "· Herramienta de pronóstico y análisis, sin fines de apuestas. No está avalada por Riot Games. Hecho por VectisDev. ·": "· A forecasting and analysis tool, not for betting. Not endorsed by Riot Games. Made by VectisDev. ·",
    "· Mejor de {} · {}": "· Best of {} · {}",
    "· cargando resumen…": "· loading recap…",
    "· casi todo físico: el rival puede comprar armadura": "· almost all physical: the opponent can buy armor",
    "· casi todo mágico: el rival puede comprar resistencia mágica": "· almost all magic: the opponent can buy magic resist",
    "· después:": "· after:",
    "· dragones": "· dragons",
    "· el modelo se actualiza con oro, torres, dragones, almas, Barón e inhibidores.": "· the model updates with gold, towers, dragons, souls, Baron and inhibitors.",
    "· en pausa": "· paused",
    "· en vivo": "· live",
    "· ganó": "· won",
    "· juego": "· game",
    "· juego en curso:": "· game in progress:",
    "· juego {}…": "· game {}…",
    "· lolesports aún no transmite su feed de datos · reintentando (suele tardar al empezar cada juego)": "· lolesports isn't streaming its data feed yet · retrying (it usually takes a bit when each game starts)",
    "· lolesports aún no transmite su feed · reintentando": "· lolesports isn't streaming its feed yet · retrying",
    "· oculto para no spoilear, tocá para ver · {}": "· hidden to avoid spoilers, tap to see · {}",
    "· para no spoilear · tocá para verlos": "· to avoid spoilers · tap to see them",
    "· próx.": "· next",
    "· si gana": "· if it wins",
    "· sin datos": "· no data",
    "· sin tanque claro": "· no clear tank",
    "· tocá un partido para ver el enfrentamiento": "· tap a match to see the matchup",
    "· torres": "· towers",
    "· ya está": "· already up",
    "· {} · Juego {}": "· {} · Game {}",
    "· {}% daño · {}% KP": "· {}% dmg · {}% KP",
    "· {}–{} kills · {} oro · {}": "· {}–{} kills · {} gold · {}",
    "· ¡ALMA!": "· SOUL!",
    "· ¡remontada desde el": "· comeback from",
    "¿Está bien calibrado? Partidos internacionales: cuando el sistema dice…": "Is it well calibrated? International matches: when the system says…",
    "¿Hacés stream? Las piezas para OBS están acá abajo, en «Piezas para OBS».": "Do you stream? The OBS pieces are down here, in «OBS pieces».",
    "¿No sincroniza? Sacá una captura de este cuadro y dejala en github.com/userf8a2c4/riftpulse-overlay/issues": "Not syncing? Take a screenshot of this box and leave it at github.com/userf8a2c4/riftpulse-overlay/issues",
    "¿Quién gana el juego {}: {} o {}?": "Who wins game {}: {} or {}?",
    "¿quién va ganando, y por cuánto?": "who's winning, and by how much?",
    "Ítems completos": "Finished items",
    "Última pelea en equipo: min": "Last teamfight: min",
    "ítem completo más": "one more finished item",
    "ítems completos más": "more finished items",
    "↩ Volver al vivo": "↩ Back to live",
    "⏱ Los dos drafts tienen una curva parecida.": "⏱ Both drafts have a similar curve.",
    "⏱ Ventana de poder:": "⏱ Power window:",
    "⏱ Ventana de poder: Los dos drafts tienen una curva parecida.": "⏱ Power window: both drafts have a similar curve.",
    "⏱ Ventana de poder: {}": "⏱ Power window: {}",
    "⏱ para el partido": "⏱ until the match",
    "▶ Capítulos de YouTube": "▶ YouTube chapters",
    "● en juego": "● in game",
    "⚑ Claves del momento": "⚑ Key points right now",
    "⚔ físico · ✦ mágico · ◐ mixto, según su campeón": "⚔ physical · ✦ magic · ◐ mixed, by champion",
    "⚡ Giros clave · cuánto movió el pronóstico": "⚡ Key swings · how much they moved the forecast",
    "⚡ {} tiene {} de ganar contra {} al min {}, según RiftPulse.": "⚡ {} has {} to win against {} at min {}, according to RiftPulse.",
    "⚡ {} tiene {}% de ganar contra {} al min {}, según RiftPulse.": "⚡ {} has a {}% chance to win against {} at min {}, according to RiftPulse.",
    "✓ Copiada. En OBS: Fuentes → + → Navegador → pegala.": "✓ Copied. In OBS: Sources → + → Browser → paste it.",
    "✓ Escena descargada. En OBS: Colección de escenas → Importar → elegí RiftPulse.json": "✓ Scene downloaded. In OBS: Scene Collection → Import → choose RiftPulse.json",
    "✓ URL copiada. En OBS: Fuente → Navegador → pegala (1920×1080). Si cambian los picks, volvé a copiarla.": "✓ URL copied. In OBS: Source → Browser → paste it (1920×1080). If the picks change, copy it again.",
    "✓ URL del control copiada. En OBS: Ver → Docks → Docks de navegador personalizados.": "✓ Control URL copied. In OBS: View → Docks → Custom Browser Docks.",
    "⬇ Datos (JSON)": "⬇ Data (JSON)",
    "⬇ Oro por minuto (CSV)": "⬇ Gold per minute (CSV)",
    "🎬 Momento clave: min {}–{}, {} +{} puntos de probabilidad ({}). Según RiftPulse · #Worlds2026": "🎬 Key moment: min {}–{}, {} +{} probability points ({}). According to RiftPulse · #Worlds2026",
    "👁 Mostrar todo de nuevo": "👁 Show everything again",
    "📋 Copiar URL para OBS": "📋 Copy URL for OBS",
    "📘 Los términos subrayados tienen una explicación: tocalos o pasá el mouse.": "📘 Underlined terms have an explanation: tap them or hover.",
    "📺 SIN SEÑAL DEL VIDEO · se mantiene el último juego": "📺 NO VIDEO SIGNAL · keeping the last game",
    "🔔 Te aviso 2 minutos antes de cada partido de tus equipos.": "🔔 I'll let you know 2 minutes before each of your teams' matches.",
    "🙈 Resultados ocultos. Tocá un marcador para verlo.": "🙈 Results hidden. Tap a score to see it.",
    "🙈 Sin spoilers": "🙈 No spoilers"
  };
  // frases fijas a D; las que tienen {} se vuelven plantillas (se buscan por las dos primeras letras de su comienzo fijo)
  var TPL = {}, TPL0 = [];
  Object.keys(D2).forEach(function (k) {
    if (k.indexOf('{}') < 0) { D[k] = D2[k]; return; }
    if (k.replace(/\{\}/g, '').replace(/[\s·.,:;()%+\-–]/g, '').length < 5) return;  // demasiado genérica: no se usa
    var re = new RegExp('^' + k.split('{}').map(function (q) { return q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('([\\s\\S]*?)') + '$');
    var ini = k.slice(0, 2), x = {re: re, en: D2[k]};
    if (k.indexOf('{}') < 2) TPL0.push(x); else (TPL[ini] = TPL[ini] || []).push(x);
  });
  // primero las más específicas (más texto fijo)
  var fijo = function (x) { return x.re.source.replace(/\(\[\\s\\S\]\*\?\)/g, '').length; };
  Object.keys(TPL).forEach(function (k) { TPL[k].sort(function (a, b) { return fijo(b) - fijo(a); }); }); TPL0.sort(function (a, b) { return fijo(b) - fijo(a); });
  // datos que vienen de lolesports en español (fases, «Mejor de 3»…): se cambian las frases conocidas dentro del texto
  var FRASES = [[/\bFase Suiza\b/g, 'Swiss Stage'], [/\bSistema Suizo\b/g, 'Swiss Stage'], [/\bCuartos de [Ff]inal\b/g, 'Quarterfinals'], [/\bSemifinales?\b/g, 'Semifinals'],
    [/\bMejor de (\d)/g, 'Best of $1'], [/\bJuego (\d)/g, 'Game $1'], [/\bjuego (\d)/g, 'game $1'], [/● en vivo/g, '● live'], [/\ben vivo\b/g, 'live'], [/\b(\d+) partidos\b/g, '$1 matches'],
    [/\b1 partido\b/g, '1 match'], [/\bFase completa\b/g, 'Full stage'], [/\bpor definir\b/gi, 'TBD']];
  var ESP = /[áéíóúñ¿¡]|\b(el|la|los|las|de|del|que|con|para|por|un|una|y|sin|más)\b/;  // en minúscula: LOS o DE como siglas de equipo no cuentan
  // claves con los números cambiados por {n}
  var norm = function (s) { var nums = []; var k = s.replace(/\d+(?:[.,:]\d+)*/g, function (m) { nums.push(m); return '{n}'; }); return {k: k, nums: nums}; };
  function t(s) {
    if (LANG !== 'en' || !s) return s;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = m[2].replace(/\s+/g, ' '); if (!core) return s;  // los saltos de línea del HTML no cuentan
    if (D[core]) return m[1] + D[core] + m[3];
    var n = norm(core), en = D[n.k];
    if (en) { var i = 0; return m[1] + en.replace(/\{n\}/g, function () { return n.nums[i++] || ''; }) + m[3]; }
    var p = plantilla(core); if (p != null) return m[1] + p + m[3];
    if (/[A-ZÁÉÍÓÚÑ]{3}/.test(core) && core === core.toUpperCase()) {  // títulos en mayúsculas (imágenes para compartir)
      if (!DU) { DU = {}; Object.keys(D).forEach(function (k) { DU[k.toUpperCase()] = D[k].toUpperCase(); }); }
      var nu = norm(core), eu = DU[core] || DU[nu.k];
      if (eu) { var iu = 0; return m[1] + eu.replace(/\{N\}/g, function () { return nu.nums[iu++] || ''; }) + m[3]; }
    }
    var f = core; FRASES.forEach(function (x) { f = f.replace(x[0], x[1]); });
    return m[1] + f + m[3];
  }
  // una plantilla «Mejor KDA · {} con {}»: lo variable se respeta (y se traduce si es una frase conocida)
  var HONDO = 0, DU = null;
  function plantilla(core) {
    var ls = (TPL[core.slice(0, 2)] || []).concat(TPL0);
    for (var i = 0; i < ls.length; i++) {
      var r = ls[i].re.exec(core); if (!r) continue;
      var vs = r.slice(1).map(function (v) { return HONDO < 3 ? (HONDO++, v = t(v), HONDO--, v) : v; });  // lo variable también se traduce
      if (vs.some(function (v) { return ESP.test(v) && !/^[A-Z0-9 ]+$/.test(v); })) continue;  // lo variable sigue en español: no es esta
      var j = 0; return ls[i].en.replace(/\{\}/g, function () { return vs[j++] || ''; });
    }
    return null;
  }
  var ATR = ['title', 'placeholder', 'aria-label'];
  function traducir(raiz) {
    if (LANG !== 'en' || !raiz) return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n, cambios = [];
    while ((n = w.nextNode())) { var p = n.parentNode; if (p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) continue; var v = t(n.nodeValue); if (v !== n.nodeValue) cambios.push([n, v]); }
    cambios.forEach(function (c) { c[0].nodeValue = c[1]; });
    if (raiz.querySelectorAll) raiz.querySelectorAll('[title],[placeholder],[aria-label]').forEach(function (e) { ATR.forEach(function (a) { var v = e.getAttribute(a); if (v) { var x = t(v); if (x !== v) e.setAttribute(a, x); } }); });
  }
  // lo que se dibuja después (la app se actualiza sola) también se traduce
  function observar(raiz) {
    if (LANG !== 'en' || !raiz || !window.MutationObserver) return;
    var pend = false;
    new MutationObserver(function () { if (pend) return; pend = true; (document.hidden ? setTimeout : requestAnimationFrame)(function () { pend = false; traducir(raiz); }); })  // en segundo plano no hay cuadros: con un temporizador
      .observe(raiz, {childList: true, subtree: true, characterData: true});
    traducir(raiz);
  }
  function set(l) { guardar(l); location.reload(); }
  // el selector: «ES | EN», con el idioma elegido resaltado
  function boton() {
    var b = document.createElement('span'); b.className = 'rp-lang'; b.setAttribute('role', 'group'); b.setAttribute('aria-label', 'Idioma / Language');
    b.innerHTML = '<button type="button" data-l="es">ES</button><span aria-hidden="true">|</span><button type="button" data-l="en">EN</button>';
    b.querySelectorAll('button').forEach(function (x) { if (x.dataset.l === LANG) x.setAttribute('aria-pressed', 'true'); x.addEventListener('click', function () { if (x.dataset.l !== LANG) set(x.dataset.l); }); });
    if (!document.getElementById('rp-lang-css')) {
      var st = document.createElement('style'); st.id = 'rp-lang-css';
      st.textContent = '.rp-lang{display:inline-flex;align-items:center;gap:2px;font:700 12px/1 system-ui,sans-serif;color:var(--muted,#9AA3B2);border:1px solid var(--line-strong,rgba(220,226,236,.16));border-radius:999px;padding:2px}' +
        '.rp-lang button{all:unset;cursor:pointer;padding:5px 8px;border-radius:999px;color:inherit}.rp-lang button[aria-pressed="true"]{background:var(--signal,#22D3EE);color:var(--signal-ink,#0C0E12)}.rp-lang span{opacity:.4}';
      document.head.appendChild(st);
    }
    return b;
  }
  window.RPI18N = {t: t, traducir: traducir, observar: observar, boton: boton, set: function (l) { if (l === 'es' || l === 'en') { guardar(l); LANG = l; } }, lang: function () { return LANG; }, locale: function () { return LANG === 'en' ? 'en-US' : 'es'; }};
  // en las páginas de RiftPulse: el selector va donde diga data-rp-lang y, en inglés, se traduce toda la página.
  // Sobre Twitch o lolesports (el overlay de la extensión) solo se traduce lo de RiftPulse, nunca la página de otro
  if (/(^|\.)(twitch\.tv|lolesports\.com|youtube\.com)$/.test(location.hostname)) return;
  // las imágenes para compartir (canvas) también salen en el idioma elegido
  if (LANG === 'en' && window.CanvasRenderingContext2D) {
    var ft = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (s) { var a = [].slice.call(arguments); a[0] = t(String(s)); return ft.apply(this, a); };
  }
  var ini = function () {
    document.querySelectorAll('[data-rp-lang]').forEach(function (el) { if (!el.firstChild) el.appendChild(boton()); });
    if (LANG === 'en') { document.documentElement.lang = 'en'; observar(document.body); }
  };
  if (document.body) ini(); else document.addEventListener('DOMContentLoaded', ini);
})();

/* RiftPulse — lector del HUD de la transmisión (reloj, marcador y siglas) sin librerías externas.
   Compara cada carácter con plantillas de tipografías condensadas (como las de los HUD de esports)
   y con los glifos reales del HUD del Mundial. Las siglas se buscan solo entre los equipos del torneo. */
(function () {
  'use strict';
  var T = {"h":18,"f":[{"0":[9,"aszMynne7u7Zrv7e7rvu297rvuys7svuys7svuys7svuys7svuys7svuys7rvuys7rvuys7rvuys7rvuys7rvu297rrv7e7rne7u7aes3dyn"],"1":[6,"JYqpWc3bnO/rvv/rne/rat7rSM7rN87rN77rN77rN87rN87rN87rN87rN87rN87rN77bJqy5"],"2":[9,"eszMynre7u7avv7e7rvu287svuys7sm7qc7sVmaM7rESSd7qABWu/ZADne62AmvuyDFJ3tpRN87scgWu7ZQQjO7ZUyrv7bmHve7t3bm8zMzK"],"3":[9,"abvLuWnO7u7Jre7e7ave3N7rm7qs7rZ4ic7qI1it7ZAVnO7IAmve63E2re7IRom97Zmrqs7qvdus7rvey87rve3N7qre7e7anO7u7JerzMun"],"4":[10,"E3q8y4UUne7tliWu7v6mJ87e7aZIzt3tplndze2ma93N7aWM3LztpZ3brO2lrdus7qa+7M3uyM7u3u7brN3u/utnib3uySM1ne63AAKM7qYAAnztlgACasuF"],"5":[9,"m8zMy4ve7d24zv25iGvut1QyvuyXZTvv7Munvv7u7ard3e/riqq97sZ3eM7seIeL7srMqc7svuys7svuys7svu287svu3d7sne7u7aeszNy4"],"6":[9,"aszMynne7u7avv7e7rvu3N7svuys7svuyr3avuyqunvu27umvv7u7Jvv7u7rvu7d7svu287svuys7svuys7svu287sru7e7rne7u7aaszMyn"],"7":[7,"vNzMq97u63m9/rNHzusBbO6gKN7YA57sYUrutRa+6kJ8/YM439ckruxRW+60Fs/pMI39ggrfxxC+61EKzJQQ"],"8":[10,"aKvMy5ab3u7uyazu7e/rre7M3uut7bve66zuy97rnN7d7tmL3u7uyHre7v7Hi97u7sic7szu2pzuu97rre27zuut7bvO663uzN7rrO7d7tqb3u7uyWiszMum"],"9":[9,"eszMynre7u7Zvv7e7rvu297svuys7svuys7svuy87rvv3d7rvv7u/rne7u/reszN7rerqs7rnMuc7rvuys7rvu297svv7e/rne7u7ZeszMyn"],"K":[9,"nMurzJvu297avu3N7Zvu3O7Hvu3e61vu3e2Uvu7u2Dvu7uxyvu7uxyvu7u2Dvu7u2Uvu3e61vu3e7Hvu3N7Yvu297avuy87rveyr3snMqJvL"]},{"0":[10,"Aq7/6iAd////0H/////3z/9m//zf/xH//u//EP/+7/8Q//7v/xD//u//EP/+7/8Q//7v/xD//u//EP/+7/8Q//7v/xD//s//Zv/8j/////cd////0AKu/+og"],"1":[6,"AB7/A9//rv//3///2c//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//"],"2":[10,"AY3uxwAM////sG/////2r/+I//zP/xD//t//AP/+3/8D//wiIgj/9wAALv/hAAC//4AACP/8AABv/9EAAu/+MAAM//YAAG//1VVUr/////zP/////N/////8"],"3":[10,"AY3uyBAd////sH/////1v/+I//rP/xD//FZmAv/7AABc//gAAP//0QAA//+QAADP//YAAAf/+ru6Af/87/0B//zv/QH//M//R//5n/////Qu////sATP/+kQ"],"4":[10,"AAr//+AADv//4ABP///gAJ/9/+AA3+v/4AP/qv/gBv96/+AL/0r/4A7+Cv/gT/wK/+B/+Qr/4M/1Cv/g7/////3v/////e/////9AAAK/+AAAAr/4AAACv/g"],"5":[10,"f/////V/////9X/////1f/9VVVF//xEQAH//v/wgf////9F//+7/93//FP/6JVUC//wAAAL//Ku7Av/93/8C//zf/wL/+8//Z//5n/////U+////wAO+/+oQ"],"6":[10,"Aq7/6iAd////0W/////3r/8y//nP/wDv+d//ADMy7/8BIADv/6/+cO/////17/////rv/zX//e//Av/+7/8C//7f/wL//c//V//6j/////Uu////wAO+/+oQ"],"7":[9,"7/////7/////7////+RVVv/8AABv/4AADP/zAAP//AAAn/9gAA7/4AAF//kAAL//MAAf/9AABf/5AACf/2AADP/zAADv/wAAH//gAAP//AAA"],"8":[10,"A77/6zA+////4Z/////4z/9m//zf/wDv/c//If/8n//M//gc////sT7////Tr/+8//rP/xHv/d//AO/93/8A7/3P/wDv/a//iP/6b/////UN////wAKu/+og"],"9":[10,"Aq7/6yAN////0G/////3v/9l//vf/yD//e//EP/+7/8g//7f/0P//q/////+b/////4I7+n//gACEP/+IzMA//2v/gD//K//I//5j/////Uu////wAO+/+oQ"],"A":[10,"Af///yAD////QAT///9gBv/d/3AI/8z/kAr/u/+wC/+p/8AN/5j/4A7/d//wH/9m//Iv/1T/80//Q//0X//M//Zv////94/////4n/4Az/q//QC/+8/8AJ/9"],"B":[9,"3//+xQ3////i3/7f/33/kO/53/kN/63/kO/53/pO/23///6g3///+x3/yv/33/kM/63/kK/83/kK/83/kK/83/pN/63////23////h3//+sw"],"C":[9,"A8/+xAHv///jf////5v/09/8z/oK/93/oK/93/oK/93/oBIi3/oAAA3/oAAA3/oHqq3/oK/+3/oK/+3/oK/+z/09/9j////6Hv///jA77/xQ"],"D":[9,"3//+tQ3////j3////53/s9/83/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/83/s9/73////33////h3//+sw"],"E":[8,"3///+N////jf///43/53dN/9AADf/QAA3/0AAN////bf///23///9t/+VVLf/QAA3/0AAN/9AADf/nd23////N////zf///8"],"F":[7,"3///7f///t///+3/t3ff+AAN/4AA3/yqff//+9///73/3Mnf+AAN/4AA3/gADf+AAN/4AA3/gADf+AAN/4AA"],"G":[9,"BM//xAHv///ij////4v/07/73/oI/93/oI/+3/oBIi3/o3d33/pv/+3/pv/+3/pM/+3/oH/+3/oH/+z/oH/+v/07/+f////+Hv//3uBd/8Ke"],"H":[9,"3/oK/93/oK/93/oK/93/oK/93/oK/93/oK/93/2t/93////93////93/7O/93/oK/93/oK/93/oK/93/oK/93/oK/93/oK/93/oK/93/oK/9"],"I":[4,"3/3f/d/93/3f/d/93/3f/d/93/3f/d/93/3f/d/93/3f/d/9"],"J":[9,"AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+d3QK/+7/kK/+7/kK/+7/kK/+7/kK/+3/s8/8r////4Pv///hBL/+sg"],"K":[9,"3/cO/23/c//z3/dv/g3/ev+w3/ff9w3/n/9A3/z/4Q3/7/wA3///oA3/7/0A3/v/8g3/jv9Q3/fP+Q3/ef/A3/df/x3/cv/13/cO/43/cK/8"],"L":[8,"3/0AAN/9AADf/QAA3/0AAN/9AADf/QAA3/0AAN/9AADf/QAA3/0AAN/9AADf/QAA3/0AAN/9AADf/SIi3////d////3f///9"],"M":[14,"3//4AH///t//+gCf//7f//wAv//+3//+AN///t///xD///7f/v8y/+/+3/v/ZP/P/t/5/4b/n/7f9v+4/3/+3/Xf2v5f/t/1v+z9T/7f9Z//+k/+3/Vv//hP/t/1T//2T/7f9R//80/+3/UO//FP/t/1C//gT/7f9Qn/sE/+"],"N":[9,"3/0J/93/8Z/93/85/93/9p/93/+Z/93/+5/93//p/93//7/93//+/93/3//93/v//93/nf/93/mv/93/mP/93/lf/93/kv/93/kO/93/kL/9"],"O":[9,"BM//xALv///ij////5z/08/83/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+z/oK/9v/09/8f////4Hv///hA77/ww"],"P":[9,"3//+sw3////i3////43/tu/83/kK/93/kJ/+3/kK/93/yO/83////43////i3/7Mkg3/kAAA3/kAAA3/kAAA3/kAAA3/kAAA3/kAAA3/kAAA"],"Q":[9,"Bd/+oQPv//+wn////y3/pP/27/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/33/pP/2n////yPv//+wBd///o"],"R":[9,"3//+2A3////23////73/xc/93/sI/+3/sI/+3/xc/93////43///+w3/7f/23/sN/63/sL/73/sL/73/sL/73/sL/73/sL/73/sL/73/sL/7"],"S":[9,"BM//swPv///in////4z/o9/73/kL/9z/5BERj//kAAHf/+UAAc//5QAB3//iAAHP/5q7ce/93/kJ//3/kI/+z/w7/9j////5Lv///zBM//1Q"],"T":[8,"7////e////3v///9d+/8dgDf+gAA3/oAAN/6AADf+gAA3/oAAN/6AADf+gAA3/oAAN/6AADf+gAA3/oAAN/6AADf+gAA3/oA"],"U":[9,"7/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gJ/9z/w8/8n////4Lv///iBM//xA"],"V":[9,"3/UF/9v/cG/8n/gH/6j/oJ/4b/sK/2T/0L/1L/4N/zD/8e/xDv9P/gDP9v/ACv+f+wCP/P+QB//v9wBf//9gA///9AAf//8gAO//8AAN//0A"],"W":[15,"z/wD//UL/9v/0E//YM/8n/4G//cO/6j/8X//kP/5b/8p//of/3X/86//w//2P/9M//1P/0L/9t//5f/yDv9+//+P/xDf+v/v+v/gC//P+//P/ACv/v9//v+gCP//9P//+QBv//8e//9wBP//4N//9QAv//0L//8wAP//sK//8QAO//oI//4A"],"X":[10,"b/8z//ZP/1X/9B//dv/yDf+Y/+AK/8r/sAf/7P+ABP/+/1AB////EADv//4AAf///xAE////UAj/7f+AC//L/8AO/5j/4D//dv/zb/9E//af/yH/+c/+AO/8"],"Y":[9,"v/gH/9j/sJ/5X/0L/2H/4O/zDf9f/gCf+v+wBv/v9wA///9AAO//4QAL//wAAI//kAAE//UAAC//MAAC//MAAC//MAAC//MAAC//MAAC//MA"],"Z":[8,"n////Z////2f///9NVXv+wAF//UACv/hAA7/oABv/zAAz/wAA//3AAj/8gAN/7AAP/9gAI/+EADf/VVT////+v////r////6"]},{"0":[10,"Aa7/6hAM////wH/////3z/907/zv/wDP/v//AM////8Az////wDP////AM////8Az////wDP////AM////8Az//v/wDP/t//Uu/8j/////gd////0QLP//wg"],"1":[6,"AF7/O///3///3t//cX//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//"],"2":[10,"AZ7/6hAL////wG/////3v/0Rz/vv+QCv/O/4AM/7MzIC//cAAAv/4QAAf/9wAALv/QAAC//jAABv/4AAAu/9EAAK/+MAAG//cAAA7/////b/////9v/////2"],"3":[10,"Aa7/6hAc////0Y//3f/4z/4Q3/3v/ACv/szKAK/9AAAA3/oAAnv/4gAE//5QAAT//9EAACb/+QAAAM/93doAr/7v/ACv/s/+EN/8j//t//cd////0QPf//0w"],"4":[11,"AABf//UAAAz//1AABP//9QAAv+//UAAv+//1AAn+b/9QAe+V//UAb/Nf/1AM/AX/9QP/cF//UJ/hBf/1Dv7M3//c//////////////8AAAX/9QAAAF//UAAABf/1AAAAX/9Q"],"5":[10,"j/////KP////8p/////yn/ciIiCv9QAAAK/1ABAAv/nO/CC/////0c//zf/3z/oB7/tWYgC//QAAAK/+MzIAn/7v+gCf/d/8AL/7n/+H7/c+////0QTv//wg"],"6":[10,"Aa7//DAM////4m//y//5v/4A3/zf/ACKqe/8AAAA//wCIAD//c/+YP/////j//+7//n//ADv/f/8AM/+7/wAz/7f/ADP/a/+AO/6X//L//UL////wACe/+oQ"],"7":[8,"///////////MzN/+AACP+wAAz/gAAe/0AAT/8QAH/8AAC/+AAA7/QAA//gAAj/sAAM/4AAH/9AAE//EACP/AAAv/kAAN3VAA"],"8":[10,"Aa7/6hAM////wG//zP/2v/4A7/vP/ADP/M/8AM/8j/4R7/gd/8z/4QX///9QDP///8CP/nfv98/8AM/87/oAr/7v+gCv/s/8AM/8j/+Z//cd////0QPf//0w"],"9":[10,"As///CAN////0W//qf/3v/8g3/zf/wDP/u//AM/+7/8Az//P/yDP/4//y///Lv////8F3/zf/wACIM//AAAAz/5qqgDP/Z//EO/7b//L//YN////wAK+/+oQ"],"A":[11,"AAv//AAAAO//4AAAH///IAAE///0AABv/v9wAAn/z/kAAL/4/8AADv9P/gAC//Hv8gBf/gz/UAj/wK/4AL/7Of+wDv////4C//////JP/0I+/0f/4ADf96/8AAv/rP+gAJ/8"],"B":[11,"///+yTAP/////2D//5vv/h//8Af/9f//AC//b//wA//1//8Aj/4f//zf/lD////+kg///N//0f//AG//n//wAf/9//8AD//v//AB//7//wGP/7//////9P/////oDMzMu4MA"],"C":[10,"AJ7/6yAc////4n//uv/5v/4Av/3v/ACv/u/8AK////wAV3f//AAAAP/8AAAA//wAAAD//AAAAP/8AGmZ7/wAr//v/ACv/r/+AL/8f/+6//kc////4gCe/+sg"],"D":[10,"///utgD/////wf/+zv/3//oB7/z/+gDP/v/6AM/+//oAz///+gDP///6AM////oAz///+gDP///6AM////oAz/7/+gDP/v/6Au/7//7O//f/////wf//7rYA"],"E":[8,"/////f////3//szK//wAAP/8AAD//AAA//wAAP/+zLD////Q////0P/8AAD//AAA//wAAP/8AAD//AAA//7MzP//////////"],"F":[8,"/////////////8zM//8AAP//AAD//wAA//8AAP//qqX////3////9///IiH//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA"],"G":[11,"AI3//qEAr////8Ff/+nf/3r/9QL//N//MA//7v/zAP////8wAREf//MAAAD//zJmZm//81//////Nf/////zAJ//7/8wCf/9//MAr/+v/2AN//X//pz//wv///7f8Bnv/Tnd"],"H":[11,"//8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////qq////////////////////Ii/////wAP////8AD/////AA/////wAP////8AD/////AA/////wAP//"],"I":[4,"////////////////////////////////////////////////"],"J":[6,"AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AN/+Wv/83//33/+w"],"K":[11,"//8AT/+f//AJ//P//wHv/A//8H//YP//Df/hD//0//kA//+v/yAP//7/oAD////5AA/////gAP//n/9QD//z//sA//8N/+EP//B//2D//wL/+w//8Az/4f//AI//f//wA//8"],"L":[8,"//wAAP/8AAD//AAA//wAAP/8AAD//AAA//wAAP/8AAD//AAA//wAAP/8AAD//AAA//wAAP/8AAD//AAA//7MzP//////////"],"M":[13,"r/+QAI//mv/8AAv/+b//4ADv/5v//yAv//m///UF//+s//9wj//6z/36C/3/rP+v0N+v+8/3/i/4/73/X/j/X/vf8v/v8v+9/w7//R/83+C//6H/zv4I//cP/O/gX/9A/879Av/xDv3/0A7+AO/f/QC/sA79"],"N":[10,"/+AAb///9gBv///9AG////9Qb////8Bv////8m/////5b/////5////+/9////n/////9s/////2X/////YO////9gr////2A/////YAz///9gBf///2AA3/"],"O":[11,"AI7//oAAv////7Bv/9nf/2v/9AT/+9//IC//3v/yAv/+//8gL/////IC/////yAv////8gL/////IC/////yAv//7/8gL//t//IC//2//0BP/7X//Z3/9Qv////7AAjv/+gA"],"P":[11,"////7IAP/////8D//8zv/3//8ALv/P//AAz/7//wAM/+//8ADv/f//d7//n//////i/////9QP//VEIAD//wAAAA//8AAAAP//AAAAD//wAAAA//8AAAAP//AAAADd3QAAAA"],"Q":[11,"AI7//oAAv////7Bv/9nf/2v/9AT/+9//IC//3v/yAv/+//8gL/////IC/////yAv////8gL/////IC/////yAv//7/8gL//t//IC//2//0BP/7X//Z3/9gv////7AAjv//0A"],"R":[11,"///+2kAP/////5D//Znf/0//wAL/+P/8AA3/n//AAN/5//wAL/+P/9eN//P/////+A/////6AP/8Dv/QD//An/8g//wF//cP/8Ae/7D//ADP/h//wAn/9P/8AF//jd2gAd3a"],"S":[10,"A8///CAu////sK//y//z3/8Q7/fv/wDP59//cCEAj//jAAAd//5gAAPv//gAAD3//2AAAs//4gAADf/5esUE//3v9wD//r/8Af/9f//d//gM////wQGe/+oQ"],"T":[9,"//////////////////AH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAG3dQA"],"U":[10,"//oAr///+gCv///6AK////oAr///+gCv///6AK////oAr///+gCv///6AK////oAr///+gCv///6AK//7/oAr/7v+gCv/s/9AN/8j//d//gt////0gKu/+oQ"],"V":[11,"v/oADP/I/8AA7/lf/gAv/2L/8gT/8w7/QG/+AM/2CP/ACv+Ar/oAf/sM/3AF/9Dv9QAv/h//MADv9v/gAAz/v/wAAJ/+/5AABv//9gAAP///MAAA7//gAAAM//wAAACf/5AA"],"W":[14,"3/UF/zBf/M/2B/9Qf/uv+An/gJ/5j/oL/6Cv93/7Df/Az/Zf/Q//4O/0P/4v//L/8y//X971//EO/4+8+P/gDf+/q/v/wAv/74n+/6AJ//9n//+AB///Rf//cAX//zP//1AD//8R//8wAf/+AO//EADv/ADP/gAA3/kAn/wA"],"X":[11,"n/4AC/9j//YB7+EM/9Bv+wBv/0v/cAHv+//yAAr///wAAD///2AAAM//4QAACf/7AAAA3/+QAABP//0AAAr///UAAe/+/8AAb/1//zAK/3Lv+AHv4Qr/0G/7AE//XP9gAM/8"],"Y":[11,"v/8QDP/V//YB7/cO/7Bv/yC//hr/wAb/9u/4AC//3/9AAM///+AAB///+QAAL///QAAAz//gAAAH//oAAABv/5AAAAb/+QAAAG//kAAABv/5AAAAb/+QAAAG//kAAABv/5AA"],"Z":[8,"z////8////+szO/9AAHv+QAG//QACv/gAA7/kABf/zAAn/0AAO/5AAT/9AAK/+AAHv+AAF//MACv/AAA7/3MzP//////////"]},{"0":[9,"Bd//1QPv///jr/pq/67/EB/+//AA////AA////AA////AA////AA////AA////AA////AA////AA////AA//7/EB/+r/pq/6Pv///jBd//1Q"],"1":[6,"AAT9AAz9it/93//9Mz79AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39"],"2":[9,"BM//1QHv///jf/pr/6v/EB/+z/AA/+z/AC/9AAAH/4AAAN/hAACv+AAAn/sAAJ/8AABf/RAADf0QAAb/cAAAr/MAAAz/mIiGz////6z////6"],"3":[9,"Bd//wwLv///hn/ls/33+AE/63+AD/7MzAD/6AAAH/2AAvP/AAA7/4wAAvf/RAAAI/4AAAD/7u5AC/8/8AC/87+AD/7r/ls/4Pv///hBd//xA"],"4":[10,"AAAM/4AAAD//gAAAn/+AAAHv/4AAB///gAAN/P+AAG/n/4AAv6b/gAPvVv+AC/0G/4Av9wb/gI/hBv+Az+zN/9rP/////au7vf/aAAAG/4AAAAb/gAAABv+A"],"5":[9,"T////2X////2b/uIiDf/QAAAj/MAAAj/M1QAn/r//Br////4v/g4/9vdAB/+AAAA/+AAAA/+mqAA/+z/AA/+z/EB/9j/pr/6Hv///jBM//1Q"],"6":[9,"Bd//xAT////ir/tq/43+AA3779AAiY79AAAA79Bocg79r//i7+///47/QF/879AA7979AA7979AA7979AA793+AA78r/pr/5T////jBd//xA"],"7":[9,"7////97////9iIiJ/9AAAE/4AAAI/zAAAM/QAAAv+QAAB/9gAADP8gAAL/wAAAb/cAAAr/IAAA78AAAE/5AAAJ/1AAAO/hAABP+wAACP9gAA"],"8":[9,"BM//xAPv///jn/pq/5v/EB/7z/AA/8z/AA/8n/MD/5Pv6+/iBv//9gTv7O/kr/MD/63+AA7939AA3939AA393+AA79r/pq/6T////0Bc//xQ"],"9":[9,"BM//1QPv///0n/tq/6z+AA793+AA3+3+AA3+3+AA3+3+AA3+z/UE/+n///7+Lv/63+Anhg3+AAAA3+iYAA3+v9AA79j/pr/6Pv///0BM//1Q"],"A":[10,"AA7/8QAAP//zAABf//UAAH/e+AAAn636AADPi/wAAO9p/gAC/0f/IAT/Jf9QCP8D/4AK/QH/sA37AO/QH/////E/////81/3Zp/2j/EAT/iv4AAf+s/AAA78"],"B":[9,"///tog/////h/9ie/3/8AF/5/8AD/6/8AD/5/8AH/2/+vP/R////5A/+zO/k/8AE/7/8AA79/8AA3+/8AA3+/8AA79/9ic/6/////j///uow"],"C":[8,"B+/+cF////W/537776AI/u+QB/7vkAf+75AAEe+QAADvkAAA75AAAO+QAADvkAWq75AH/u+QB/7voAj+v+d++1////UH7/5w"],"D":[9,"///tow/////h//md/4//AD/9//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AD/9//md/4/////h///tow"],"E":[8,"/////v////7/2IiI/8AAAP/AAAD/wAAA/8AAAP/ru5D////A/+zMoP/AAAD/wAAA/8AAAP/AAAD/wAAA/9iIiP////7////+"],"F":[8,"/////v////7/+YiI//AAAP/wAAD/8AAA//AAAP/3d2D////A////wP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA"],"G":[9,"Bd//xAPv///hr/pq/47/EB/7//AA/8//AAu5//AAAA//ATMz//Bv/8//Bv/8//AU/8//AA/8//AA/8//AA/87/EB/7r/pq/3Pv///hBd//ww"],"H":[9,"/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/+u779/////9/+zM79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79"],"I":[3,"////////////////////////////////////"],"J":[6,"AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AG/7me/3///h7tow"],"K":[9,"/5AB74/5AH/h/5AN+Q/5B/4g/5DvoA/5b/MA/537AA/9/9AA////IA//7/cA//n/sA/+Hf4A/5B/9Q/5Av+Q/5AN/Q/5AI/y/5AE/2/5AA76"],"L":[8,"//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//mIiP////7////+"],"M":[12,"//8wBP/9//9QBv/9//9wCP/9//+QCv/9/++wDP79/8/ADuz9/5/gH8v9/37yP6v9/3z0X3v9/3r3f0v9/3f5nyv9/3X8vgv9/3L+3Av9/3Dv+gv9/3DP+Av9/3Cv9gv9/3CP9Av9/3Bv8gv9"],"N":[9,"//kAr8//wAr8//4Qr8//9gr8//+gr8/8/gr8/47zr8/4v3r8/4j6r8/4T+r8/4Hv38/4C//8/4Bv/8/4Av/8/4AN/8/4AJ/8/4AG/8/4AC/8"],"O":[9,"Bd//1QPv///jr/pq/67/EB/+//AA////AA////AA////AA////AA////AA////AA////AA////AA////AA//7/EB/+r/pq/6Pv///jBd//1Q"],"P":[8,"///sUP////T/yK76/5AK/v+QCf//kAn//5AJ/v+QDP3/3N/5////0f/bpxD/kAAA/5AAAP+QAAD/kAAA/5AAAP+QAAD/kAAA"],"Q":[9,"B+/+kAX///+Av+dt/g76AH/y/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z76AH/yv+dt/gX///+QB+/+/q"],"R":[9,"///tkg/////R/9ie/2/8AG/4/8AE/5/8AE/4/8AG/3/9Nd/i////5Q////+w/9Nd/1/8AG/4/8AE/5/8AD/5/8AD/5/8AD/5/8AD/5/8AB/7"],"S":[9,"A8//1QHv///if/xp/5v/QA79v/MA3+n/cAERP/5AAACv/kAAAc/+UAAAv/9QAACv/hAAAL/4RVAD/9z/AB/+v/EB/+j/pq/6Hv///jBM//1Q"],"T":[9,"3////83////8iI7+iHAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AA"],"U":[9,"3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+z/IA/9j/tq/5Lv///iBM//1Q"],"V":[9,"z8AAn8r+AAr6j/AAz4b/IA71T/QB/zL/YD/xDvgF/gDPoH/ACvwI+gCP4K+ABv8c9QBP8+8wAv9/8QAO/P4AAN/vwAAK//oAAI//gAAG//YA"],"W":[14,"77AI/6AJ/t/ACv+wC/zP0Az/0Az6r+AN/+AO+J/xD//xD/d/8x/u8i/1b/Q/3fQ/81/2T8v2T/E/91+p91/gL/l/l/l/0A/7j3b7j8AO/J9k/J+gDP6/Qv6/kAr/3zD/33AI//8Q7/9gB//+AM//UAX//QC//zAD//sAn/8g"],"X":[10,"n/UAHvhP+QBv8w39AK/QB/9B73AC/4b+EAC/zPsAAG//9QAAH//hAAAM/7AAAA3/0AAAP//yAACP7/cAAN9+/AAE/yn/MAr9A/+QHvgAz+Fv8wCP9b/QAE/6"],"Y":[10,"z/MAHvx/+ABf9z/8AI/hDP8g37AH/2L/YALvp/8gAL/t+wAAf//2AAAv/+EAAAz/oAAAB/9gAAAH/2AAAAf/YAAAB/9gAAAH/2AAAAf/YAAAB/9gAAAH/2AA"],"Z":[8,"r////q////5oiI7+AABP+AAAr/MAAu/AAAj/YAAN/hAAT/oAAK/0AAHv0AAG/3AADP4AAC/5AACP8wAA3+mIiO////7v///+"]},{"0":[10,"AZ7/6RAM////wF//7v/2v/4R3/vP+gCf/d/6AJ/+3/oAn/7f+gCf/t/6AJ/+3/oAn/7f+gCf/t/6AJ/+3/oAn/7P+gCf/b/+Ed/7X//u//YM////wAGe/+kQ"],"1":[6,"Oe/+7//+7//+mb/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AH/+"],"2":[10,"Aq7/6AAd////oI//7v/z3/wE//f/+QD/+e7oAf/5AAAF//YAAAv/8gAAT/+wAAHf/iAACf/2AABe/6AABO/8AAAN/+MAAJ//kRER7/////3v/////e/////9"],"3":[10,"j/////yP/////Y/////9AREs//gAAJ//wAAF7/0QAC7/4gAAf//rIAAK3f/iAAAAz/gAAACP+wAAAH/8m7gAj/3P+wCP/K/+EM/7f//u//cM////0QGe/+og"],"4":[12,"AAf/9QAAAAz/4AAAAB7/sAAAAG//YAAAAL//EAAAAe/8AAAAB//3AAAADP/zDv+QL//QD/+Qf/9wD/+gv//////8z//////9z//////9IzMzT/+zAAAAD/+QAAAAD/+QAAAAD/+QAAAADv+Q"],"5":[10,"z/////vP////+8/////7z/sRERHP+gAAAM/6AAAAz/oEQQDP/M/+YM/////0z//d//rP/QDf/BEQAJ/+AAAAn/6+6wCf/q/+Ed/8b//u//kM////4gGe/+og"],"6":[10,"AZ7/6RAd////wH//7v/2v/4S7/rP+wDP+8/7AEZkz/tIgwDP/v//gM/////0z/5U7/rP/ACv/c/7AJ/+z/sAn/+//ACv/p/+Ed/9X//u//kM////4gGe/+sw"],"7":[10,"z/////3f/////d/////93/IS7/xWYAT/+AAACf/0AAAO/+AAAD//kAAAf/9QAADP/gAAAe/6AAAE//YAAAn/8gAADf/QAAAv/5AAAG//QAAAr/4QAADv+gAA"],"8":[10,"AZ7/6AAM////wG//7v/2v/0S7/rf+gC//M/6AL/7n/0B7/g//93/4gXv//5AHf///8F//iTv9r/7AM/63/oAr/zP+gC//K/9Ee/5X//u//QL////oACO/+cA"],"9":[10,"Ar7/6RAu////0J//7v/23/0R7/rv+gC//O/6AL/87/oAv/zP+wDP/J/+eP/8Pv////wE7/7f/AAVUb/9WIYAv/2v/QC//Z/+Ie/8X//u//gM////0QCe/+oQ"],"A":[12,"AALv/iAAAAX//1AAAAj//4AAAAv//7AAAA7//+AAAC/87/IAAG/5v/UAAJ/3n/gAAL/0f/sAAO/yT/4AA//gL/8wB//ADv9wC//szv+wDv/////gP//////yb/4AAv/2n/0AAO/4z/oAAM/7"],"B":[10,"3//utQDv////gO/////j7/cm7/jv9gC/+e/2AK/57/YB3/bv/b7/0O////8w7/3O/8Dv9gHf9u/2AI/77/YAf/3v9gCf/e/3Fe/77/////Xv////oN///scA"],"C":[10,"Aq7/6iAN////0X//7v/4z/wRz/zv+QCf/u/5AEd37/kAAADv+QAAAO/5AAAA7/kAAADv+QAAAO/5AAAA7/kAR3fv+QCf/s/8EM/8f//u//cN////0AKu/+kQ"],"D":[10,"3//+tgDv////oO/////17/oV7/vv+QC//e/5AK/97/kAr/3v+QCv/e/5AK/97/kAr/3v+QCv/e/5AK/97/kAr/3v+QC//e/6Fe/77/////Xv////oN///rYA"],"E":[10,"3/////zv/////O/////87/wRERHv/AAAAO/8AAAA7/wAAADv/pmTAO////YA7///9gDv/XdyAO/8AAAA7/wAAADv/AAAAO/8ERER7/////zv/////N/////8"],"F":[10,"3/////vv/////O/////77/wRERHv/AAAAO/8AAAA7/wAAADv/pmTAO////UA7///9QDv/XdyAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAN/7AAAA"],"G":[10,"Aq7/6iAd////0Y//7v/43/0Rz/3v+QCf/u/5AH3d7/kAAADv+QAAAO/5C8zL7/kP//7v+Q///u/5Aq/+7/kAj/7v+QCf/t/9Ed/9j//u//gd////0QKu/+og"],"H":[10,"3/kAr/zv+QCv/O/5AK/87/kAr/zv+QCv/O/5AK/87/kAr/zv/Znf/O/////87/////zv/HfP/O/5AK/87/kAr/zv+QCv/O/5AK/87/kAr/zv+QCv/N/5AK/8"],"I":[4,"3/vv/O/87/zv/O/87/zv/O/87/zv/O/87/zv/O/87/zv/N/7"],"J":[10,"AAAAj/4AAACP/gAAAI/+AAAAj/4AAACP/gAAAI/+AAAAj/4AAACP/gAAAI/+AAAAj/4AAACP/oqmAI/+z/oAj/7P+gCf/r/9EM/9b//u//gM////0QGe/+og"],"K":[11,"3/kAHv+u/5AH//Tv+QDf+w7/kI/+IO/5Hv+QDv+Y/+IA7/rv+gAO////MADv///zAA7///+QAO////4ADv/n//UA7/oN/8AO/5Bv/zDv+QDv+g7/kAj/8u/5AD//jf+QAM/9"],"L":[10,"3/sAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8ERER7/////zv/////N/////8"],"M":[12,"7/sAAM/+//9ABf/+///QDf/+///3f//+///93//+///////+//vv/r/+//h/9p/+//gNwJ/+//gEQJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+7/gAAI/+"],"N":[11,"3/4QCf/O//UAr/3v/5AK/97//gCv/e//9Qr/3v//oK/97//+Gv/e/+/1n/3v+u+Z/97/i/6v/e/4f/7/3v+S///97/kM///e/5Bv//3v+QHv/97/kAv//e/5AH//3f+AAu/8"],"O":[10,"Aa7/6hAN////wH//7v/2z/sAv/vv9gB//e/2AG/+7/YAb/7v9gBv/u/2AG/+7/YAb/7v9gBv/u/2AG/+7/YAb/7v9gB//c/7AL/7f//u//YN////wAGu/+oQ"],"P":[10,"7//+xgDv////gO/////j7/cV7/nv9gCf/O/2AH/97/YAn/zv9gTv+e/////j7////mDv/LuTAO/2AAAA7/YAAADv9gAAAO/2AAAA7/YAAADv9gAAAO/1AAAA"],"Q":[10,"AZ7/6AAM////sG//7v/0z/0S7/rv+QC//O/5AL/87/kAv/zv+QC//O/5AL/87/kAv/zv+QC//O/5AL/87/kAv/zv+QC//M/8Ad/6f//d//UN////wAK+/+oQ"],"R":[10,"3//+xwDv////kO/////z7/cV7/nv9gCf/O/2AH/97/YAr/zv+Djv+O/////i7////kDv+r/9AO/2T/8w7/YO/3Dv9gr/wO/2Bf/h7/YA7/Xv9gC/+t/2AH/9"],"S":[10,"Aq7/6BAd////sI//7v/0z/wC7/nv+QC/+9/7AHqnn/+AAAAu//oAAAb//7EAAE3//kAAAc//4QAAGv/4eIUAz/zf+gCv/b/9Ed/7f//u//YN////wAKu/+kQ"],"T":[11,"7//////P//////z//////8ERn/9REQAI//MAAACP/zAAAAj/8wAAAI//MAAACP/zAAAAj/8wAAAI//MAAACP/zAAAAj/8wAAAI//MAAACP/zAAAAj/8wAAAI//MAAAB//zAA"],"U":[10,"7/gAn/3/+ACv/f/4AK/9//gAr/3/+ACv/f/4AK/9//gAr/3/+ACv/f/4AK/9//gAr/3/+ACv/f/4AK/9//gAr/3v+ACv/c/9Ed/7f//u//UN////sAGu/+kQ"],"V":[12,"v/8wAO/9n/9QA//5b/9wBf/2P/+gCP/yDv/AC//QC//gDf+wB//yH/9wBP/0P/9QAe/3X/8gAM/6f/0AAJ/9n/oAAG/+z/YAAD////IAAA7//+AAAAz//7AAAAj//4AAAAT//1AAAAHv/iAA"],"W":[17,"z/4ADv9QC//q//ID//gA3/x//0Bf/6AP/5T/9wj//QP/9x//kL//8V//QN/7Df//Nv/yCv/R///1n/0Ab/9P//+L/6AD//j/v/rP9wAO/9/1797/QADP//8d///xAAn//+C///0AAG///An//6AAA///oG//9wAAHv/4BP//UAAAz/9gL//yAAAJ//QA7/4AAABf/iAM/7AA"],"X":[11,"3/oACv/Y/+AA7/gv/2Bf/yCv/Az/oAT/9f/0AAz/3/wAAG///2AAAe//4QAACv/6AAAAn/+QAAAO//4AAAX///UAAM/+/8AAP/9v/zAK/9DP+gLv9gb/4o/+AA7/jf+gAK/9"],"Y":[11,"3/sADP/Z/+AB7/lf/0Bf/0Dv+Qn/0An/0O/4AD//X/8gAM/8/7AAB///9wAAP///IAAA3//AAAAI//cAAABv/1AAAAb/9QAAAG//UAAABv/1AAAAb/9QAAAG//UAAABf/1AA"],"Z":[10,"3/////3f/////d/////9EREW//kAAAz/4gAAT/+gAAC//iAAA//6AAAL/+IAAE//kAAAv/8wAAPv+gAADP/iAABP/5AAAL//URER3/////3f/////d/////9"]},{"0":[11,"AF3//WAATv///2AN/+rf/iX/9AL/95/+AAz/u//AAK/9z/sACf/t/7AAn//f+wAJ//3/sACf/9/7AAn//P+wAJ/+v/wACv/Z/+AAz/tf/0Av/3Df/q3/4gTv///2AATf/9YA"],"1":[7,"AAA40AO//2z///7////tif/0AH//AAf/8AB//wAH//AAf/8AB//wAH//AAf/8AB//wAH//AAf/8AB//wAH//"],"2":[11,"AF3//nAAb////4Au/9rv/in/4QP/9s/5AA7/irtgAO/4AAAAL/9QAAAI/+EAAAPv9gAAAd/7AAAAr/4gAAB//1AAAD7/oAAAHP/RAAAM/+MAAAn//u7u7a//////6v/////+"],"3":[11,"AH7//XAAr////5Bf/9rv/0r/0ALv+XmWAAv/oAAAAM/6AAAALv9gAFmu/7AACP//sAAAj///kAABM47/YAAAAK/7AAAACP/rzGAAj/3P/AAd/7f//a7/9Qz////6ABjv/9cA"],"4":[11,"AAAC7/YAAACv/2AAAD//9gAAC///YAAE///2AAC/7f9gAD73z/YACv0M/2AD/3DP9gCv4Qz/YC76AM/2Cv/Lvv/Kz//////b//////0jMzPf+CAAAAz/YAAAAM/2AAAADP9g"],"5":[11,"Cf////9Qv/////UN/////1Dv8wAAAB//EAAAAv/gAAAAT/5ruTAF/////mB//8vv/jBJcAT/+AAAAAv/sAAAAJ/9AAAACf/c/6AAr/yf/hAe/4Pv/q7/4gf////3AAXf/9YA"],"6":[11,"AABJ3mAAAK//9gAAn///YAB//7MAAB7/kAAABv/gAAAAr/pKujAM/9///mDv/+7//i//4gf/+P/4AA3/v/9wAJ/87/cACf/L/5AAv/t//hA+/3Hv/q7/4gTv///1AATf/9UA"],"7":[11,"///////f//////3u7u7u/7AAAADf9gAAAE/+EAAACv+QAAAB7/MAAAB//AAAAA3/cAAABP/yAAAAn/wAAAAe/3AAAAX/8gAAAK/8AAAAHv9wAAAH/+IAAADP+wAAAD//UAAA"],"8":[11,"AG3//oAAf////6Au/+rf/zb/9QP/+I//IA//l//yAP/5T/9gT/9Qn/6+/7AAr///wAB/////kD7/k4//Wf/gAN/7z/wACv/c/9AAr/6v/zAe/8X//q3/9wr////8AAfv/+kQ"],"9":[11,"AF3//EAAX////jAu/+rv/Qj/9AX/9c/9AA7/nf+gAL/83/oACv/c/9AAv/2f/0A+/9T//r7//Ar/////sAbO1t/4AAAAL/9QAAAJ/+EAAUv/9gAI///5AACP//kAAAjskwAA"],"A":[15,"AAAF//QAAAAAAJ//gAAAAAAN//wAAAAABP//8wAAAACv/v+QAAAADv+P/gAAAAT/4e/zAAAAn/oL/4AAAA3/YH/9AAAD//ID//IAAH/+AA7/YAAM/+zM7/sAAf//////4QB///////9gDf/TMzPv/AP/+QAACv/yf/9AAABf/2v/4AAAAe/7"],"B":[12,"////7JMA//////5Q///////i//sAGv/3//sAA//5//sAAv/5//sABf/2//2Inv/A//////wA//////+w//wzOf/3//sAAO/8//sAAN/9//sAAO/9//sAGP/6///////0//////+A////7aQA"],"C":[13,"ABjv/+owAAz////+MAr//s3//RT/+gAH//ef/zAADv+7/+AAAN/93/0AAAEiLf/AAAAAAN/8AAAAAA3/wAAAAADf/AAAAAAN/9AAABIiv/4AAA3/2f/yAADv+0//oAB//3C//9vf/+EB3////+MAAZ7//qMA"],"D":[12,"///+yCAA/////+QA//////4w//kBXf/R//kAA//2//kAAN/5//kAAM/7//kAAL/8//kAAL/8//kAAL/8//kAAL/8//kAAM/7//kAAO/5//kABP/2//kBXf/h//////5A/////+UA///+yCAA"],"E":[10,"//////7//////v/////+//YAAAD/9gAAAP/2AAAA//YAAAD//Lu7sP/////g/////+D/+DMzIP/2AAAA//YAAAD/9gAAAP/2AAAA//////7//////v/////+"],"F":[10,"//////////////////////kAAAD/+QAAAP/5AAAA//kAAAD/+2ZmYv/////1//////X//JmZk//5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA"],"G":[13,"ABjv/+xQAAz/////cAr//sz//iP//BAG//iP/0AADf/L//EAAHqpz/4AAAAADf/gAAAAAN/+ADiIiI3/4AX///7f/gBf///s/+ABM8/+v/8QAAz/6P/1AADP/j//0QAd/+Cv/+zO//4Av/////5QAH3//+kg"],"H":[13,"//sAAAz/3/+wAADP/f/7AAAM/9//sAAAz/3/+wAADP/f/7AAAM/9//sAAAz/3//ZmZnv/f///////9////////3//GZmbf/f/7AAAM/9//sAAAz/3/+wAADP/f/7AAAM/9//sAAAz/3/+wAADP/f/7AAAM/9"],"I":[4,"3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+"],"J":[11,"AAAAC//wAAAAv/8AAAAL//AAAAC//wAAAAv/8AAAAL//AAAAC//wAAAAv/8AAAAL//AAAAC//wAAAAv/8AAAAL//MzMAC//8//AAz/6v/1A//7T//s7/9Qr////6AAfv/+cA"],"K":[13,"//sAAN//j/+wAH//0P/7AB3/4w//sAr/9wD/+wX//AAP/7DP/iAA//tv/3AAD//N/8AAAP////0AAA/////1AAD/////wAAP//uf/3AA//4S//4QD/+wCf/3AP/7AB7/4Q//sACP/6D/+wAC7/8//7AACv/6"],"L":[10,"//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//////z//////P/////8"],"M":[16,"//+AAAAI//7//8AAAAz//v//4QAAH//+///2AABv//7///oAAK///v///gAA7+/+//7/MAP/z/7/+/+ACP+P/v/3/8AM/W/+//bP8S/5b/7/9o/1f/Vv/v/3P/rP8X/+//cO/v/Af/7/9wr//5B//v/3Bv//QH/+//cB7/4Af/7/9wDP+wB//v/3AI/3AH/+"],"N":[13,"//wAAAr/3//1AACv/f//wAAK/9///0AAr/3///wACv/f///1AK/9//7/wAr/3/+d/2Cv/f/4f/0K/9//ge/1r/3/+Aj/yv/f/4Ae/+/9//gAf///3/+AAN///f/4AAf//9//gAAN//3/+AAAf//f/4AAAe/9"],"O":[13,"AAjv/+gQABz////9EAr//s7/+wP/+gAJ//SP/hAAHv+b/9AAAM/8z/sAAAr/3f+gAACf/t/6AAAJ/+3/oAAAn/7f+gAACf/s/7AAAK/+v/wAAAv/yP/hAADv+T//oACf/0Cv/+zf/8AB3////+IAAY7//pEA"],"P":[12,"////7YEA//////0g///////R//kAGP/3//kAAN/7//kAAL/9//kAAL/9//kAAe/7//tmfP/2///////A//////oQ//yZhzAA//kAAAAA//kAAAAA//kAAAAA//kAAAAA//kAAAAA//kAAAAA"],"Q":[13,"ABjv/+gQAB3////9EAr//s7/+wP/+gAK//SP/hAAHv+b/8AAAM/83/sAAAr/3f+gAACv/u/6AAAJ/+7/oAAAn/7f+gAACv/t/7AAAK/9v/wAAAz/yP/hAAHv+T//oACf/0Cv/+zf/7AB3////9EAAY7///5A"],"R":[12,"///+7HEA//////wQ//////+w//kAK//z//kABP/2//kAAv/3//kAA//2//kACP/z//2Zz/+w//////0Q/////+EA//tq//MA//kD//kA//kAz/4Q//kAT/+A//kADP/h//kABv/3//kAAe/8"],"S":[12,"AEz//8UABe////9wLv/8vv/jf/9QA+/5n/4AAL/8n/8gACMzX//VAAAAC///1xAAAI7//+cAAAO///+QAAADr//1AAAABO/8q7gAAK/+z/wAAJ//n/5QAN/9Lv/8vv/3Be/////AADvv/+gA"],"T":[12,"7///////7///////7///////AADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAA"],"U":[12,"7/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/83/sAAM/8r/4gA+/5T//szv/jCv////9wAH3//8UA"],"V":[14,"v/4AAADv/Y//MAAD//lP/3AABv/1Dv+gAAr/4Qr/4AAN/7AG//IAL/9wAv/1AF//MADP+QCP/QAAf/0Az/gAAC//EO/zAAAN/0T/4AAACP+H/5AAAAX/u/9QAAAB7+7/IAAAAL///AAAAAB///gAAAAAP//0AAAAAA7/4AAA"],"W":[18,"v/wAB/+AAL/7n/4ACv+gAN/5b/8QDP/QAO/3T/8wDv/hAv/0H/9QT//0Bf/xDf9wf//4B//gC/+Qr//7Cf+wCP/A3+7+C/+QBv/i/7v/Lf9gA//2/4j/b/9AAf/6/2X/r/8QAN/+/zL/7/0AAK///gDv//oAAH///ADP//cAAD//+QCf//QAAA7/9wBv/+EAAAz/9AA//9AAAAr/8QAf/7AA"],"X":[13,"r/9gAD//o//8AAn/9Av/8gDv/ABP/5Bf/1AAv/4b/8AABP/5//YAAAz/7/0AAAA+//9QAAAAr//AAAAADP/9AAAABf//9gAAAd/+/+EAAG//f/9wAA3/wN/9AAX/9gf/9gDP/gAe/9BP/5AAr/9b//MABP/7"],"Y":[13,"z/4QAB7/xv/1AAX/9h7/oACv/hCf/gAO/5AC//UF//MADP+gn/wAAG/+Dv9gAADv+f/gAAAH///3AAAADv/+AAAAAJ//kAAAAAP/9AAAAAA//zAAAAAD//MAAAAAP/8wAAAAA//zAAAAAD//MAAAAAP/8wAA"],"Z":[12,"7//////87//////87//////5AAAAC//hAAAAX/9gAAAAz/wAAAAF//QAAAAd/7AAAACv/iAAAAP/+AAAAAv/0AAAAF//UAAAAN/8AAAAB//1AAAALv+wAAAAv//////+3//////+3//////+"]},{"0":[11,"B97//tgI//////nv/////+//9QX/////QD/////0A/////9AP/////QD/////0A/////9AP/////QD/////0A/////9AP/////QD/////1Bf//7//////o//////kH3v/+2A"],"1":[6,"////////////AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//"],"2":[10,"CN7/7WCf////9e/////6//0B7/v//ADv+//8AO/7AAAB//kAAAb/9gAALv/QAAHf/0AACP/6AAA+/+EAAd//YAAJ//sAAE7/4gAAz//////P/////8//////"],"3":[10,"CN7/7YCP////+O/////9//0Az/7//ADP/ru6AM/+AAAAz/4ABXfv/AAL///kAAv///gAAjTf/QAAAM/+u7kAz/7//ADP/v/9AM/+7/////2P////+Aje/+2A"],"4":[13,"AAAAz/4wAAAAf/+QAAAAHv/iAAAACf/5AAAAAu/+EAAAAJ//YAAAAC7/wAAAAAr/8wAAAAP/+gnMwADf/RC//wB//2AL//AM/+Qzz/9D3////////f///////5u7u77/+7AAAAC//wAAAAAL//AAAAAAv/8A"],"5":[11,"z/////+8//////vP/////7z/9gAAAM//YAAADP/2AAAAz//Lu5MM//////XP/////8MzMzj//gAAAD//4AAAA//+//9AP//v//QD//7//1Bf/+7//////Y//////gH3v/+1w"],"6":[11,"CN7//sUJ/////+Tv/////6//8wj/+///IG//v//yBJmW//8gAAAP//h3dRD//////i///////P//U3//7//yA//+//8gP//v//ID//7//zBf/+7//////Y//////gI3v/+1w"],"7":[10,"///////////////////9MzM5//gAAAv/8wAADv/QAABP/5AAAJ//UAAA7/4QAAb/+gAAC//1AAAe/+AAAH//kAAAz/9AAAL//gAABv/5AAAL//MAAB7/8AAA"],"8":[11,"CN7//sYJ//////bv/////8//4AH//P/9AA//z//QAP/87/0AD//L/+h4//k+/////Sn/////9+/+AB//z//QAP/8//0AD//P/9AA//z//gAf/87//////I//////YH3v/+1g"],"9":[11,"CN7//tgI//////jv/////+//9AP/////MC/////zAv////8wL/////MC///v/9u///f//////wfe////8AAAAv//RmYgL//7//YC//+//3A///r//////l//////kFzv/+2A"],"A":[13,"AAL///IAAABf//9QAAAI///4AAAAv///sAAADv/f/gAAA//4//IAAG//P/9gAAr/0O/6AADf+wv/0AAv/3B//yAE//QF//UAf/9TX/+ACv/////7AN//////4B//y7vP/yX/9AAE//Wf/xAAH/+c/9AAAN/9"],"B":[11,"/////tgP//////n//7vP/+//8QDv////EA7////xAO////8QDv/v//h4//z//////k//////+P//Q07/3//xAO////8QDv////EA7////xAO////+7z//v//////j////+2A"],"C":[11,"B97//tcI//////jv/8vP/+//8QH/////EB/////xAf////8QAzM///EAAAD//xAAAA//8QAAAP//EAAAD//xACIi//8QH/////EB/////xAf//7//Lz//o//////gH3v/+1w"],"D":[11,"3////tgN//////jf/7vP/+3/8gD//9//IA///f/yAP//3/8gD//9//IA///f/yAP//3/8gD//9//IA///f/yAP//3/8gD//9//IA///f/yAP//3/+7z//t//////jf///+2A"],"E":[10,"//////v/////+//////7//8QAAD//xAAAP//EAAA//8QAAD//7u7kP/////Q/////9D//0MzMP//EAAA//8QAAD//xAAAP//EAAA////////////////////"],"F":[10,"//////////////////////9AAAD//0AAAP//QAAA//9AAAD//0AAAP/////x//////H//8u7sf//QAAA//9AAAD//0AAAP//QAAA//9AAAD//0AAAP//QAAA"],"G":[11,"B97//tcI//////jv/8vP/+//8QD/////EA/////xAMzM//8QAAAP//EAAAD//xV3d3//8a//////Gv/////xAP////8QD/////EA/////xAP//7//Lz//p//////kI3v/+1w"],"H":[12,"3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/+Hd///3///////3///////3/+Hd///3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//"],"I":[4,"////////////////////////////////////////////////"],"J":[10,"AAAB//8AAAH//wAAAf//AAAB//8AAAH//wAAAf//AAAB//8AAAH//wAAAf//AAAB//8AAAH//7u7Af////8R/////xH/////Iv//7/////6P////+Aje/+2A"],"K":[12,"//8ACf/7//8AHv/0//8Af//A//8A3/9g//8D//4A//8I//kA//8N//QA//9P/9AA//+v/4AA//+f/5AA//8//+AA//8N//UA//8H//oA//8C//4Q//8Az/9w//8Af//A//8AHv/0//8ACf/7"],"L":[9,"3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/////3/////3/////"],"M":[15,"//+QAACP/////QAADf/////0AAP//////4AAj//////8AAz///////IC/+////z/cH/8////jvsL/o////iv4e+o////hf+v9Y////ge/v4Y////gL//sI////gG//cI////gB//II////gAERAI////gAAAAI////gAAAAI////gAAAAI//"],"N":[11,"//wAC//v//IAv/7//3AL/+//+wC//v//4Qv/7///cL/+///9C//v/9/zv/7/+t97/+//qPy//v/6P/3/7/+g3//+//oI///v/6Au//7/+gDP/+//oAf//v/6AD//7/+gAM/+"],"O":[11,"CN7//tcJ//////Xv/////7//8QT/+///AD//v//wA//7//8AP/+///AD//v//wA//8//8AP//P//AD//v//wA//7//8AP/+///AD//v//yBf/77/////+4//////UI3v/+1w"],"P":[11,"3////tkN//////nf/////+3/8wH//9//MA///f/zAP//3/8wD//9//MA///f/2Nf//3//////d//////bf/8u7pQ3/8wAAAN//MAAADf/zAAAA3/8wAAAN//MAAADf/zAAAA"],"Q":[11,"CN7//tcJ//////Xv/////7//8QT/+///AD//v//wA//7//8AP/+///AD//v//wA//8//8AP//P//AD//v//wA//7//8AP/+///AD//v//xBP/77//u7/+4//////UI3v///A"],"R":[12,"3////tkA3/////+Q3//////g3/8wH//w3/8wD//w3/8wD//w3/8wD//w3/8wD//w3/+on//g3/////+g3/////wQ3/9u//EA3/84//cA3/8z//0A3/8w3/9A3/8wf/+w3/8wHv/03/8wCP/7"],"S":[11,"CN7//tgJ//////jv/////+//9QX/////QE/////0And3//9AAAAO//t3diC//////kLP/////QAjM4//8AAAA///iIggP/////QD/////1Bf//7//////o//////kH3v/+2A"],"T":[11,"//////////////////////AAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AA"],"U":[11,"//8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////AA/////yAf//7//////o//////kI3v//2A"],"V":[13,"r/9QAE//tv/4AAf/+D//oACf/0Dv/AAL/+EM/+AA3/0An/8QHv+gBv/0A//3AD//cG//QAH/+Qj/8QAM/8DP/QAAn/4O/6AABf/0//YAAC//r/8wAADf/v/gAAAK///7AAAAb///cAAAA///9AAAAA7//gAA"],"W":[21,"z/9AAL//sAAv/8n/9gAO//4ABP/5b/+AAv//8QBv/2P/+gBP//8wCP/zDv/ABv//9QCv/gDP/gCP//+ADf/ACf/xC//f+gDv+QBv/zDf+P/AL/9gA//1Dv8//gT/8wAO/3P/0N/zf/4AAM/5b/sK/1n/wAAK/7j/gI/4v/oAAH/9v/UF/77/cAAF//7/IC/+//UAAC///+AA7///MAAA7//8AAz//+AAAAz//6AAn//8AAAAn//3AAb//5AA"],"X":[13,"j/+wAO/+Ee/+EE//oAn/9gr/9ABP/7Dv/QAA3/5v/4AABf/+/+EAAA3///gAAABv//4gAAAA7/+wAAAALv/9AAAACf//9QAAAe///8AAAI//v/9QAB7/0u/9AAb/9wv/9AC//iBv/6A//7AA7/4r//YACv/6"],"Y":[13,"3/8wAF//p//4AAr/9B7/wADv/QCv/xA//4AE//YH//MADf+gv/wAAI/+Hv+AAAT/9//zAAAO/9/+AAAAf///cAAAAv//8gAAAAv//AAAAAB//4AAAAAH//gAAAAAf/+AAAAAB//4AAAAAH//gAAAAAf/+AAA"],"Z":[11,"n//////5//////+f//////AAAAr/+wAAAv/+MAAAr/+QAAA+/+EAAAr/9gAAA//9AAAA3/8wAABv/6AAAB7/4wAACf/6AAAD7/8gAAC//6AAAA///////P//////z//////8"]},{"0":[11,"A77//sMA3////+Bf/+zv/2j/4QHv+a/8AAz/u//AAL/8v/sAC//M/7AAv/3P+wAK/9z/sACv/c/7AAv/2/+wAL/8v/wAC//K/8AAz/uP/hAe/5X//s7/9g3////+ADvv/+ww"],"1":[6,"AH7+Pf/+7//+7//+6q/+EG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+"],"2":[10,"jv///WCv////9K7czv/6EAAB7/wAAAC//QAAAL/9AAAB7/wAAF3/+QBL///kG////EB///5gAL//gQAAz/wAAADf+gAAAN/6AAAA3/////3f/////d/////9"],"3":[10,"zv//7EDv////4t3Mzv/4AAAC7/sAAADP/AAAAM/7AAAB7/gCu77/4QL///wwAv///7AAM0f/+AAAAM/9AAAAr/4AAACv/wAAAe/+7czO//r/////497//+xA"],"4":[11,"AAf/4QAAAM/7AAAAHv9wAAAF//IAAACf/AAAAA7/YAAABP/hBWMAn/sB/4AO/2BP+AT/4Qf/gI/7AK/4DP/czv/c3//////9//////8zMzPf+TAAAAz/gAAAAM/4AAAADP+A"],"5":[10,"v/////O/////87/////zv/gAAAC/+AAAAL/4AAAAv/pFUQC////+cL/////0vLu+//kAAAHv/AAAAM/9AAAAv/0AAADP/AAAAu/7zczO//jf////4r7//+sw"],"6":[11,"AH3//+wgf/////MO//3M3jX/9wAAAI/+AAAACv/AAAAAv/wDVTAM/8n//7DP/////1z/+5rv+s/9AAv/y//AAK/9r/wACf/Z/9AAr/xv/hAM/7L//s3/9wv////+ECvv//xA"],"7":[10,"3/////zf/////N/////8AAAA7/kAAAT/9AAACv/gAAAe/5AAAF//QAAAr/0AAADv+QAABP/0AAAJ/+AAAA3/oAAAP/9gAACP/xAAAM/7AAAD//YAAAj/4QAA"],"8":[11,"BL7//8UD7/////SP/9zf/6v/4ADf/L/8AAv/2//AAL/8j/0ADP+j7/p5//QEz///1QGu///+oY//Y17/nP/AAL/93/sACf/t/7AAr//f/gAN/+r//c3/+0//////UFz///xg"],"9":[11,"Bc///8QC7////+Cf/9zf/2z/4AH/+u/8AA3/z/+wAM/9//sADP/u/9AA7//P/6m///f//////wz//6z/4ANVMM/+AAAADf/AAAAA7/oAAABv/3TtzN//4k/////5A97//9gA"],"A":[13,"AAT///QAAAB///9wAAAK///6AAAA3/v/0AAAHv9f/xAABP/g7/QAAI/7DP+AAAv/kK/7AADv9gf/4AA//0Bf/zAF//EC//YAj//Mz/+QC//////7AO//////4C//czOP/zb/8gAD//af/gAADv+t/7AAAM/9"],"B":[11,"7///7ZIO/////9Dv/////27/oAPv+u/6AA3/vv+gAM/67/oAHv9+/9u9/9Hv////sg7/////oO/7M27/fv+gAM/77/oAC//e/6AAz/3v+gAu/87/////+O/////+Hv///tow"],"C":[9,"AZ7//9Cv///+Lv/9zeb/9wAAj/4AAAr/0AAAv/0AAAz/wAAAz/wAAAz/wAAAz/wAAAv/0AAAr/0AAAn/4AAAb/9wAALv/9zNCv////AZ7//9"],"D":[11,"7//+7IEO/////8Dv/////27/sAX/+u/7AA3/vv+wAL/97/sAC//e/7AAr/7v+wAK/+7/sACv/u/7AAr/7v+wAL/97/sAC//e/7AA3/vv+wBf/67/////9u/////8Dv//7sgQ"],"E":[9,"7////87////87////87/oAAA7/oAAA7/oAAA7/oAAA7/27uy7////z7////z7/szMw7/oAAA7/oAAA7/oAAA7/oAAA7////87////87////8"],"F":[9,"7////97////97////97/4AAA7/4AAA7/4AAA7/4AAA7/4zMw7////z7////z7////z7/4AAA7/4AAA7/4AAA7/4AAA7/4AAA7/4AAA7/4AAA"],"G":[11,"AH3///6gj/////0e//7MztX/+QAAAI//EAAACv/gAAAAv/0AAAAM/8AXd3fP/AL//+z/wC///s/8AXv/6//QAH/+r/0AB//o/+AAf/5f/3AH/+Hv/9zf/gn/////4Ajf///r"],"H":[11,"7/oACf/+/6AAn//v+gAJ//7/oACf/+/6AAn//v+gAJ//7/oACf/+/9u73//v//////7//////+/8d3z//v+gAJ//7/oACf/+/6AAn//v+gAJ//7/oACf/+/6AAn//v+gAJ//"],"I":[4,"3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+"],"J":[6,"AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AH/9AI/9At/87//67//17ttw"],"K":[11,"7/gADP+u/4AD//Xv+ACP/Q7/gA7/YO/4Bv/QDv+Az/gA7/g//iAO/93/sADv///2AA7///+QAO/7r/4ADv+C//UA7/gM/7AO/4Bf/iDv+ADv+Q7/gAn/4e/4AE//bv+AAN/8"],"L":[8,"7/gAAO/4AADv+AAA7/gAAO/4AADv+AAA7/gAAO/4AADv+AAA7/gAAO/4AADv+AAA7/gAAO/4AADv+jMz7////u////7v///+"],"M":[16,"7//6AACP///v//0AAL///+///xAA3///7///MAH////v/v9gBf/v/+/5/4AI/7//7/bvsAv+j//v9s/QDvuP/+/2n/Ev+I//7/Zv9U/0j//v9j/4f/GP/+/2H/uf0I//7/YN/t+gj//v9gr//3CP/+/2Bv//UI//7/YD//8gj//v9gDv/gCP/+/2AM/7AI//"],"N":[11,"7/kABv/e/+EAb/3v/3AG/97//gBv/e//9Qb/3v//sG/97//+Nv/e///6b/3v/P/o/97/bv/v/e/1f///3v9R7//97/UJ///e/1A///3v9QDP/97/UAX//e/1AA3/3v9QAH/9"],"O":[11,"A77//8QB7////+N//9zf/5n/4ADP+7/7AAn/2/+gAI/+z/oAB//s/5AAf/7P+QAH//z/kAB//8/5AAf/7P+gAH/+v/oACP/r/7AAn/2f/gAM/7b//c3/+R7////+MDvv//xA"],"P":[11,"7///7ZIO/////9Dv/////17/sAT/+e/7AA3/vv+wAM/87/sADP/O/7AA3/vv+wA+/57/////9e/////8Dv///tkg7/sAAAAO/7AAAADv+wAAAA7/sAAAAO/7AAAADv+wAAAA"],"Q":[11,"A77//sQB7////+N//9zf/5n/4ADP+7/7AAn/2/+gAI/+z/oAB//s/5AAf/7P+QAH//z/kAB//8/5AAf/7P+gAH/+v/oACP/r/7AAn/2f/gAM/7f//c3/+B7////+IDvv///Q"],"R":[11,"7///7YEO/////8Dv/////07/gAX/9+/4AA7/jv+AAN/57/gADf+e/4AA7/jv+2av/27/////4e/////lDv/Jv/0A7/gD//QO/4AO/5Dv+ACv/g7/gAX/8+/4AB7/jv+AAL/8"],"S":[10,"A77//tQu////9Y//3M3lv/wAAADP+QAAAN/5AAAAz/wQAAC///2mEH/////SG/////kAFYz//AAAAL/9AAAAj/4AAACP/QAAAM/8jczO//mP////437///1Q"],"T":[11,"7//////u//////7v/////+Mzf/9zMwAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AA"],"U":[11,"z/wACf/s/8AAn/7P/AAJ/+z/wACf/s/8AAn/7P/AAJ/+z/wACf/s/8AAn/7P/AAJ/+z/wACf/s/8AAn/7P/AAJ/+z/wACv/r/8AAr/2v/hAN/8f//c3/+S7/////QEz///1g"],"V":[12,"z/oAAJ/9r/wAAL/6f/4AAN/3X/8gAf/1L/9QA//yDv+ABv/gC/+gCf+wCP/QC/+ABf/xDv9QAf/zL/8QAN/1T/0AAK/4b/sAAI/6j/gAAF/8r/YAAD/+7/MAAA7//+AAAAz//9AAAAr//6AA"],"W":[19,"3/sACv/7AAr/2//QAM//0ADP+5/+AA7//gAN/5f/8QH///IA//df/yAv//9AH/9U//QE/+/2A//zL/9Qb/n/gE//EO/3CP9f+gb/4Az/gK/h/8B/+wCf+gz8Df4J/5AH/8DvoK/xr/YAX/0v9wj/TP9AAv/l/0Bf9t/xAA7/n/ID/57+AADf/v4AD/7/wAAL///AAN//+gAAn//6AAv//4AAB///gACf//YA"],"X":[13,"j/9QAC//ke/7AAj/4gr/4QDv+wBf/2BP/1AA3/sJ/+AAB//i7/gAAB7/z/4QAACf//+gAAAE///0AAAAP///UAAACf//+wAAAe/8/+IAAH/+Hv+QAA3/kK/+EAX/9AX/9gC//QAe/8Au/4AAn/85/+IAA//6"],"Y":[12,"z/sAAK/6f/4AAO/2L/9QBP/hC/+gCf+gBf/hDv9AAO/0P/0AAJ/5f/gAAE/9z/MAAA7//9AAAAn//3AAAAT//zAAAADv/AAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAA"],"Z":[10,"r/////6v/////q/////+AAAF//kAAAv/8wAAP/+wAACf/jAAAe/6AAAJ//QAAD7/sAAAn/8wAAHv+gAACf/0AAAu/8AAAI//YAAAz/////7P/////s/////+"]},{"0":[9,"A7//xAHv7O/if/MC75v9AAz8z9AAv+39AAv+39AAv+39AAv+39AAv+39AAv+39AAv+39AAv+39AAv+z9AAv9v9AAz8f/UE74Hv///hAr7/sg"],"1":[8,"AAb9AABe/QAE7/0ALv79AK+Z/QAWCf0AAAn9AAAJ/QAACf0AAAn9AAAJ/QAACf0AAAn9AAAJ/QAACf0AAAn9AAr///8K////"],"2":[9,"BM//1QLv///jn/QH/6z8AB/8v5AB/8e2AE/5AAAI/0AAAN/AAAB/9gAAHv0AAAj/UAAB78AAAI/0AAAu+wAACf4wAALvsiIin////9n////9"],"3":[9,"BM//xAPv///ir+MI/3z6AC/5z4AC/5jGAC/5AAAD/2AAI7/RAA7/sQAAze6AAAAE/3AAAA38aVAA39v4AA39z6AA38r+QF/6X////jBt//xA"],"4":[10,"AAAe/1AAAG//UAAAz/9QAAL//1AAB/nPUAAN899QAD/A31AAn4DvUADvMO9QBv0A/1AM9wH/UD/zAf9Qn+VV/4Xf/////7zMzP/cAAAB/1AAAAH/UAAAAf9Q"],"5":[8,"n///+p////qflVVTn3AAAJ9wAACfcCEAn5z/oJ////efxF77NRAL/QAACf4AAAn+iiAJ/u8wCf7vQAr9z5A++n///+MI7/1Q"],"6":[9,"BM//wwLv7O/in+IB7438AAv677AAr477AAEh77AAAA78jexQ7////z7+QF/577AA3877AA3977AA3977AA38z8AA77n+QF/4Pv///iBM//xA"],"7":[8,"7////u////1FVV76AAA/9QAAj/EAAM+wAAL/cAAG/yAACvwAAA74AABf9AAAv+AAAe+wAAX/YAAK/yAADv0AAD/5AACP9QAA"],"8":[9,"A87/xAHv///ib/gG/4n/IA/6n/EA77n/EA76f/IA/4Hvko/iA+//5ACf7O+gb/MC74v9AAv9z9AAv+z9AAv+z+AAz9n/UE77Pv///0Bc//1g"],"9":[9,"BM//xALv///ij/UE75v+AAz8z9AAv+39AAv+39AAv+z9AAv+r+IB3+X/2t/+B+/rz+AAIQv+AAAAv+j6AAv+r7AAz8j+EC75Lv7O/iBM//xA"],"A":[10,"AAr/oAAADP/AAAAO/+AAAD/u8wAAb8z2AACfqfkAAM93/AAA71X+AAP/Mv8wBf4A71AI/QDfgAv7AL+wDfoir9Af////8U/8zM/0f/IAL/iv8AAP+9/QAA3+"],"B":[9,"7/7bYA7///+w79As/079AG/379AE/479AE/379AH/z79WO+Q7///oA7+q++g79AG/379AB/779AA/979AA/979AC/779Aq/37////A7/7bcQ"],"C":[8,"BM/+kB7///d/9Rz8v+AI/t/ABv3vwAS478AAAO/AAADvwAAA78AAAO/AAADvwAAA78AEqt/ABv6/4Ab+f/UL/B7///cDz/6Q"],"D":[9,"7/7bYA7///+A79Ar/i79AF/379AC/679AB/879AB/879AB/879AB/879AB/879AB/879AB/879AB/879AC/679AF/379Ar/i7///+A7/7rYA"],"E":[7,"7///3v///e+yIi77AADvsAAO+wAA77AADvxVUO///x7+zMHvsAAO+wAA77AADvsAAO+wAA77IiLv///e///9"],"F":[7,"7///3v///e+yIi77AADvsAAO+wAA77AADvxVUO///x7+zMHvsAAO+wAA77AADvsAAO+wAA77AADvsAAO+wAA"],"G":[9,"Ar//1AHv///if/YG/2v+AA3439AAz478AAm078AAAA78AAAA78AAAA78Af/978Aa3978AAr978AAr939AAr9v+AAz9f/YF/9Hv//z9A8/7Ht"],"H":[9,"79AA3979AA3979AA3979AA3979AA3979AA3979AA3979VV797////97+zM7979AA3979AA3979AA3979AA3979AA3979AA3979AA3979AA39"],"I":[3,"393939393939393939393939393939393939"],"J":[7,"AACP4AAI/gAAj+AACP4AAI/gAAj+AACP4AAI/gAAj+AACP4AAI/kcwj+v2CP7PYI/t9gn9v6DPtv//9gnv6A"],"K":[9,"77AE/177AK/g77Ae+A77B/4Q77DfoA77T/QA77r9AA7874AA7//0AA79/4AA77z9AA77b/QA77HvoA77Cf4Q77A/+A77AM/Q77AH/177AC76"],"L":[6,"74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA75Ii7///7///"],"M":[12,"7/gAAJ/97/wAAN/97/4QAf/97/9ABf/977+ACPv974+wDPj9727gDub971zzT7b972j3f3f972T6rzf973Dt3gf973DO+wf973CP+Af973Bf9Qf973Av8Qf973AJkAf973AAAAf973AAAAf9"],"N":[9,"73AAf+79AAf+7/MAf+7/gAf+7/0Af+7/9Af+79+wf+74/hf+7132f+72j7b+73L/f+73C/z+73Bf/+73AN/+73AI/+73AD/+73AA3+73AAb+"],"O":[9,"Ar//sgDf///Rb/YG/2r+AA76z+AA7839AA3939AA3939AA3939AA3939AA3939AA3939AA3939AA39z+AA78r+AA76b/YG/1Df///AAr7+oQ"],"P":[8,"7+7HAO///7DvgY/174AN+u+AC/zvgAr974AK/e+AC/zvgAz674A+9u+579Dv//0w77dAAO+AAADvgAAA74AAAO+AAADvgAAA"],"Q":[9,"A7//wwHv///hf/YG/4v+AA7739AAz978AAz+78AAz+78AAz+78AAz+78AAz+78AAz+78AAz+78AAz+39AAz9v+AA77b/cW/2Df///QAa7+kQ"],"R":[9,"7/7aMA7///5A77A9/Q77AG/077AF/277AF/277AF/277AG/077AM/g79rf9w7///YA77b/QA77DfoA77CP4Q77Au+A77AL/Q77AG/177AB76"],"S":[9,"A77/xAHf///if/UG/4r+AA36r/IAv6f/oAi1Hv9wAAB//kAAAL/9EAAB3/wAAALv+QAABO/ia2AJ/5v5AC/8z8AA/9r/QF/6Pv///iBd//xA"],"T":[9,"3////+3////+Ii3+IiAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AA"],"U":[9,"79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+39AA39v+AA77f/YG/3Hf///hA8//ww"],"V":[10,"3+AAD/yv8QAv+Y/zAE/2X/UAb/Mv9gCP4A75AK/AC/oAz5AJ/ADvcAb+Af9ABP8T/yAB/0b+AADfaPsAAK+K+AAAf731AABP7vIAAB//4AAADf/AAAAL/5AA"],"W":[15,"77AAj8AAv+v9AAv+AAz7n+AA7/IA75f/EC//UB/3T/IE//cC/1L/QH/fkE/yDvYJ+PwF/gDPcM9f4G/QCvkO8u8o+wCPov4N9Z+QBvxfwK+L9wBP1/kH+b9QAv6fYE+88wAO7fIB/u8QAN/+AA3/4AAL/8AAv/wAAI/6AAn/kAAG/3AAb/cA"],"X":[9,"v+EA77b/QD/2HvgH/hC/wL+wBv8u9gAe+/4QAJ//kAAD//MAAA39AAAA38AAAE//MAAK//kAAe+v4QBv4u9gC/sL+wHvcH/hb/ID/2v9AA77"],"Y":[10,"v9AADvx/8gA/9z/2AG/yDfoAn8AI/gDPgAP/Mf9AAN9l/gAAn5n6AABf3fUAAB7/4AAAC/+gAAAG/2AAAAX/UAAABf9QAAAF/1AAAAX/UAAABf9QAAAF/1AA"],"Z":[9,"Df///+Df///9AiIo/3AAAM/hAAAv+gAACP9QAADf4AAAT/gAAAr/IAAC77AAAI/0AAAO/QAABf+AAACv8wAAHvwAAAf/giIiz////+3////+"]},{"0":[8,"CO/+gG////W/5V7676AL/e+QCv7/kAr+/5AK/v+QCv7/kAr+/5AK/v+QCv7/kAr+/5AK/u+QCv7foAv8r+NO+l////QJ//6A"],"1":[5,"AG/gXv7P/+/N/iDP4Az+AM/gDP4Az+AM/gDP4Az+AM/gDP4Az+AM/gDP4Az+"],"2":[7,"Cv/5Bf//9a/U3634CP3vcH/u9wf+/3CfwiEN+AAH/hAB75AAn+EAPvcACv4QAu+AAH/hAAr8IiHP//+s///6"],"3":[8,"Cu/+cH////W/5X/678AN/f+wDP4AAA39AAAe+gAp3+MAP/9wACnf9AAALvoAAA39/6AM/u+gDP3voA38v+Nv+W////MJ7/1Q"],"4":[8,"AAb/oAAK/6AADv+gAE/voACez6AA28+gAvfPoAbzz6AL4M+gDrDPoE9wz6CfMM+g31TPtP/////MzO/sAADPoAAAz6AAAM+g"],"5":[7,"z///fP//98+3dzz3AADPcAAM+ZtQz+/+PP1++c9wr8AACv0AAK/QAAr+zGCv3/cK/e9wr837Pfqf//9Rv/6Q"],"6":[8,"CO/+cF////Ov5X/338AP+e+wD/r/oAIh/6FDAP/e/8H////4/+Iu/P+gDP3/oAv+/6AL/++wC/7fwAz+v+VO+2////cK//+g"],"7":[8,"//////////93d379AAA/+QAAn/MAAN/AAAP/YAAI/gAADfoAAD/2AACP8gAA39AAAv+wAAX/gAAI/1AACv8wAAz/IAAN/yAA"],"8":[8,"Ce/+oG////e/4i7739AN/d/ADP3PwAz8n+AO+T76r+Mc///Af/d/9r/QDvvvsAz9/7AM/v+wDP7vwA39v+RO+m////UH7/5w"],"9":[8,"Ce/+kG////a/5n/738AO/e+wDv7/sA3/77AN/9/ADf+/4y7/b////wnv7v8AEg3/NDAN/8/ADf6/0A78n+VO+U///+MH7/1g"],"A":[9,"AG//QAAI//cAAK//kAAN/vwAAP+v4AAv9/8gBP8/9ABv4O9gCf0M+AC/sL+gDPoJ/ADvgH/gL/lI/yT////0b/zM/2j/EA74r+AAz6z8AAr9"],"B":[8,"///9UP///+L/so/3/6Av+P+gL/n/oC/4/6BP9f/s77D///+g/7Nv9/+gDfv/oAz9/6AM/v+gDP3/oA38/8N/+f///+P//+tA"],"C":[8,"B+/+cE////Wv9m/639AN/e+wDP7/sAz+/7AM/v+wARH/sAAA/7AAAP+wBWX/sAz+/7AM/u+wDP3fwA38n+Rv+T////QF3/1g"],"D":[8,"///9YP////T/wn/6/7AN/f+wDP7/sAz+/7AM/v+wDP7/sAz+/7AM/v+wDP7/sAz+/7AM/v+wDP3/sA38/8N/+P///+P//+tA"],"E":[6,"///7///7/8d1/5AA/5AA/5AA/5AA/8d0///4/9zH/5AA/5AA/5AA/5AA/5AA/8d2///9///9"],"F":[6,"///9///9/8d2/5AA/5AA/5AA/5AA/+zI///6/8mW/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA"],"G":[8,"B+/+oE////ev9l7739AK/u+wCv7/sAr//7ADVf+wAAD/sMzM/7Dv//+wKP//sAf//7AH/++wB//f0An/r/VO/0///88G7+de"],"H":[8,"/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v/arv7////+/9me/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+"],"I":[3,"/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9"],"J":[8,"AAAP/QAAD/0AAA/9AAAP/QAAD/0AAA/9AAAP/QAAD/0AAA/9AAAP/TMwD/3/0A/9/9AP/f/QD/3v4A/8v/Vv+V///+IH7/1Q"],"K":[9,"/9AG/3/9AL/y/9Ae/A/9Bv9w/9DP8g/9L/sA/9f/YA/9z+AA/+/6AA/+77AA/9v+IA/9b/gA/9Hv4A/9C/9A/9BP+Q/9AN/g/9AJ/1/9AE/7"],"L":[6,"/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/7VU///9///9"],"M":[12,"//gAAI////sAAL////0AAN////8gAf////9QBP///++AB/7//7/ACvv//47gDvj//33zL9f//3r2T6f//3f4f4f//3T7n1f//3L+zzf//3Dv7gf//3C//Af//3B/+Af//3BP9Qf//3Ad0gf/"],"N":[8,"/zAF//9wBf//wAX///IF///3Bf///AX//+4l//+/hf//btX//1z4//9X/f//Uv///1DP//9Qb///UB7//1AK//9QBf//UAHv"],"O":[8,"CO/+cF////Sv9m/638AN/e+wDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/u+wDP3fwA38r+Rf+V////QJ//6A"],"P":[8,"///9cP////X/wm/6/7AO/P+wDP3/sAz+/7AM/f+wDvv/1q/4////4v/syjD/sAAA/7AAAP+wAAD/sAAA/7AAAP+wAADdoAAA"],"Q":[8,"CO/+cF////Sv9m/638AN/e+wDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/u+wDP3fwA38r+Rf+V////QJ//6A"],"R":[8,"///9kP////f/w277/7AN/f+wDP7/sAz9/7AO/P/Yv/f////A/9m/9/+wDfz/sAv+/7AL/v+wC///sAv//7AL//+wC///sAv/"],"S":[8,"Gv/+UI///+HP0l/176AP+O+wD/jP4wzHj/0gAB3/0gAC3/0gAC7/sAAD7/SqcH/7/6Af/u+gDv7fsA79r+Rf+l////QH7/5w"],"T":[7,"/////////1Xf5VAM/gAAz+AADP4AAM/gAAz+AADP4AAM/gAAz+AADP4AAM/gAAz+AADP4AAM/gAAz+AAC9wA"],"U":[8,"/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/u+wDP7vsA39v+Re+l////QI7/1g"],"V":[9,"37AAv8v9AA36n+AA74b/IB/2T/QD/0L/YF/yDvgH/gDPsI/ACf0K+gBv4M9wBP8d9QAf9O8gAO+P4AAM/P0AAJ//sAAH//kAAF//cAAD//UA"],"W":[13,"z5AI/AB/6voAr+AI/J/ADP8Qr7f+AO/zC/lf8R//UN9z/yP/9g72H/NP34H/QO9W+Pov8g33j07D/xC/ivLOX+AJ+c4K9/wAj77Aj6+wBv36Bv35AE//gE//gAL/9gL/9gAf/0AP/0AA7/IA3/MADP8ADP8Q"],"X":[8,"v2AL+m+wDvYv4T/yDPaPwAf7z4AC/u9AAN/+AACP+gAAX/YAAJ/0AADf+QAC//4ABv7vQAr7r4AO91/QP/MO83/gCvi/oAb8"],"Y":[9,"39AA38j/IC/4T/YF/0DvoI/gCv0M+gBv8+9gAv+/8wAM//0AAH//kAAD//QAAA3+AAAAz+AAAAz+AAAAz+AAAAz+AAAAz+AAAAz+AAAAz+AA"],"Z":[7,"n///+f///0d5/9AAb/kACv9AAO/gAE/6AAn/YADf8QA//AAH/3AAv/IADv0ABf+QAK/1AA7/h3b////P///8"]},{"0":[7,"Bc7FBf//9M/p7775Cf7/kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ/++Qn+38PP2P//+Av/+w"],"1":[4,"AK8I/9//vf8G/wb/Bv8G/wb/Bv8G/wb/Bv8G/wb/Bv8G/wb/"],"2":[7,"Bt7WBf//9b/n7776Cv7vkJ/sxwr9AADPsAAe9wAG/yAAv9AAL/cACv4QAu+AAL/hAE/3AA3+Zmb/////////"],"3":[7,"Bt7EBP//4q/k7536DPvvkM+zMgz6AADvcASv4gDP+AAM/9AABe9gAAv7EQCf7vkJ/t+Qn9v8Hfpf//4wjv5g"],"4":[8,"AAT/kAAJ/5AADf+QAE//kACf/5AA7t+QBfvPkAn3z5AO88+QP+DPkH+gz5DPc8+j//////////8AAM+QAADPkAAAz5AAAK2A"],"5":[7,"3///rf//+t+5mW32AADfYAAN9kUQ3+/+Pf//+t/Av+VjCf8AAJ/wAAn/IhCf/vkJ/t+Qn+v8DPxv//9wr/+Q"],"6":[7,"B97XBf//9r/T3875Cf7/kJ//+QAA/6eED///9f/o78/5Cf7/kJ//+Qn//5Cf//kJ/++Qn+37C/1///9wrv6Q"],"7":[7,"/////////5mZ7+AADvwAA/+gAF/3AAj/QACv8gAN/gAB/7AAP/gABf9QAI/yAAv+AADfsAAf+QAF/2AAj/MA"],"8":[7,"B97XBf//9q/k76z8DPvPwM/M/Az8v9DPt/+u9w3//Qf///ffw8/e+Qn+/5Cf//kJ/++Qn+38PP2P//+Anv6g"],"9":[7,"Bt7XBv//9s/Dz875Cf7/kJ//+Qn//5Cf//kJ/++Qn/z+bv9////we6v/AACf/McJ/++Qn+z8DPyP//9wr/6g"],"A":[9,"AD//IAAG//UAAJ//gAAM//oAAO/f0AAv+v8QBP9v8wBv8v9QCP4O+AC/wN+gDfoL/ADvts/gL////xT////zf/do/2n/EC/4v9AA76zaAAvb"],"B":[7,"/+2RD///0P/M/3/5Dfr/kJ+/+Qn7/5Dfj/zP4v//+A///+P/k++f+Qr9/5Cf7/kJ/v+Q38/8z/j///0f/+og"],"C":[7,"Bc7FBf//5M/p3775Bv7/kG//+Qb//5AUT/kAAP+QAA/5AAD/kAAP+QAA/5Bd3/kG/++Qb+39O/2P//+Bv/+w"],"D":[7,"/+2RD///sP/N/0/5L/j/kN+/+Qz9/5DP7/kM/v+Qz+/5DP7/kM/v+Qz+/5DP3/kN+/+S/4/83/T///sP/tkQ"],"E":[6,"///9///9/8mY/5AA/5AA/5AA/5AA/8mQ///w///w/6Mw/5AA/5AA/5AA/5AA/9zK///9zMzK"],"F":[6,"/////////8mZ/3AA/3AA/3AA/3AA/8lw///A///A/5Mg/3AA/3AA/3AA/3AA/3AA/3AA3WAA"],"G":[7,"Bc7FBP//9L/p7775Cf7/kJ//+Qn//5BZn/kAAP+QAA/5e7v/mv//+Y3//5Cf//kJ/++Qn/37C/+v///y3/zP"],"H":[7,"/5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//yc////////////o6//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn/"],"I":[3,"////////////////////////////////////"],"J":[4,"Cf8J/wn/Cf8J/wn/Cf8J/wn/Cf8J/wn/Cf8J/wn/bv3f+d6h"],"K":[8,"/5Av9/+Qn+H/kO+g/5X/QP+a/AD/nvcA/+/2AP//+gD///0A//7/EP/o/0D/o/+A/5DvsP+Qv+D/kH/z/5A/9v+QDvr/kAv9"],"L":[6,"/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/7Zm////////"],"M":[10,"//cAf///+gCf///8AL////4A7////yH/////Q/7//99m+v//r5j4//+OuuX//33c1f//e+61//95/5X//3f/df//dP9V//9y/zX//3DvBf//cN0F//9wuwX/"],"N":[8,"/5AJ///gCf//9An///gJ///8Cf///xn///9Z///vqf//r+n//338//95/v//dP///3Dv//9wr///cG///3Ae//9wDP//cAf/"],"O":[7,"Bc7FBf//9c/p7875Cf7/kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ/++Qn+39PP2P//+Av/+w"],"P":[7,"/+2RD///wP/M/3/5Dfz/kJ/v+Qn+/5Cv3/k++v///0///5D/2lAP+QAA/5AAD/kAAP+QAA/5AAD/kAAN2AAA"],"Q":[7,"Bt6zBf//0M/a/272Dfj/YM+f9gz5/2DPn/YM+f9gz5/2DPn/YM+f9gz5/2DPn/YM+e9gz436Tvef//8hz//8"],"R":[7,"/+2SD///0f/M/4/5Dfz/kJ/v+Qn+/5C/z/p/+P///R///0D/vvYP+b+Q/5j8D/lv4P+T/z/5H/b/kN+v+Qr9"],"S":[7,"A87FAu//5I/n76v8C/2/wI25/hAAX/cAAN/hAAT/sAAK/1AALv0AAH/3AAHvzNkK/u+gn+v9HPx///9wv/+w"],"T":[7,"/////////5nf2ZAM/AAAz8AADPwAAM/AAAz8AADPwAAM/AAAz8AADPwAAM/AAAz8AADPwAAM/AAAz8AACtoA"],"U":[7,"/5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ/++Qn+z9bfx///9gjv6A"],"V":[8,"v6AK/J/ADPp/4A73X/EP9S/yL/MO9E/xDfZv0Ar3j7AI+a+QBvrPcAT831AC/O8gAO7+AADP/QAAr/sAAI/4AABf9gAAPdMA"],"W":[12,"73AP4An8z5Av8Az6r8BP8g74j+Bv9A/2b/CP9g/0T/Kf+B/yL/S/+T/wDvbf+1/QDfjt7Y+wC/v7zq+gCf/5r/+AB//3j/9gBf/0b/9AA//yT/8gAf/gL/4AAO/QDvwAAM+wDPoAAI2ACdcA"],"X":[8,"z6AL/H/gHvcv9F/yDPivwAf873AC//8gAM/8AAB/9wAAP/MAAH/2AAC/+gAB7/4ABf3vUAr5v5AO9n/QT/I/84/QDvjfkAr8"],"Y":[8,"35AJ/Z/ADPlf4R71L/Rf8Q33n9AJ+9+QBf7/UAHv/hAAz/wAAJ/5AABv9gAAb/YAAG/2AABv9gAAb/YAAG/2AABv9gAAXdUA"],"Z":[7,"b///9v///zmZ7+AAHvoAB/9QAN/hAD/7AAj/YADf4QAv/AAH/3AAz/IAH/wABv9gAL/hAA79mZn/////////"]},{"0":[9,"i8zMuWvu7v7Yz+3f/qz+u97rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rztqt7rzuzN7qvv7u/Zi8zMym"],"1":[5,"Jrynruy+/8zv663/t778Su/Dnvs578Oe/Dnvw578Oe/Dnvw578Oe/Envw3va"],"2":[9,"aszMy3ne7u/qru7e/sru3M7rru283sermb3rNVV73rABSM7aAAWt7ZACfO63AFruyEA43+piJr78gwSd/qUQe+7ZUhnf7bh2vv/u3anN3d3K"],"7":[7,"nLvLmc3v61it/rA3z9kCfO2AKN7HBJ3rYFrtpRe+2UON/YNJ3sclrutRa+2UB87YMI3scgnuthC/6lEK24MA"]}]};
  var GW = 10, GH = 16, TW = 40, TH = 14;
  // ---------- utilidades de imagen (matrices en escala de grises, Float32Array, fila por fila) ----------
  function img(w, h, a) { return {w: w, h: h, a: a || new Float32Array(w * h)}; }
  function sub(m, x0, y0, x1, y1) {
    var w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0), o = img(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) o.a[y * w + x] = m.a[(y0 + y) * m.w + x0 + x];
    return o;
  }
  function resize(m, w, h) {  // bilineal con promedio por área al achicar
    var o = img(w, h), sx = m.w / w, sy = m.h / h;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var ya = y * sy, yb = ya + sy, xa = x * sx, xb = xa + sx, s = 0, n = 0;
      if (sx <= 1 && sy <= 1) {
        var fx = Math.min(m.w - 1, Math.max(0, (x + .5) * sx - .5)), fy = Math.min(m.h - 1, Math.max(0, (y + .5) * sy - .5));
        var x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(m.w - 1, x0 + 1), y1 = Math.min(m.h - 1, y0 + 1), dx = fx - x0, dy = fy - y0;
        o.a[y * w + x] = m.a[y0 * m.w + x0] * (1 - dx) * (1 - dy) + m.a[y0 * m.w + x1] * dx * (1 - dy) + m.a[y1 * m.w + x0] * (1 - dx) * dy + m.a[y1 * m.w + x1] * dx * dy;
        continue;
      }
      for (var yy = Math.floor(ya); yy < Math.min(m.h, Math.ceil(yb)); yy++) for (var xx = Math.floor(xa); xx < Math.min(m.w, Math.ceil(xb)); xx++) { s += m.a[yy * m.w + xx]; n++; }
      o.a[y * w + x] = n ? s / n : 0;
    }
    return o;
  }
  function vec(m, w, h) {  // vector normalizado (media 0, norma 1) para comparar por correlación
    var r = resize(m, w, h).a, s = 0, i, n = 0;
    for (i = 0; i < r.length; i++) s += r[i];
    var mu = s / r.length;
    for (i = 0; i < r.length; i++) { r[i] -= mu; n += r[i] * r[i]; }
    n = Math.sqrt(n) || 1;
    for (i = 0; i < r.length; i++) r[i] /= n;
    return r;
  }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function pct(m, p) {  // percentil de una matriz con valores 0..255
    var h = new Uint32Array(256), i;
    for (i = 0; i < m.a.length; i++) h[Math.max(0, Math.min(255, m.a[i] | 0))]++;
    var k = p * m.a.length, c = 0;
    for (i = 0; i < 256; i++) { c += h[i]; if (c >= k) return i; }
    return 255;
  }
  // ---------- plantillas ----------
  function dec(w, b64) {
    var bin = atob(b64), m = img(w, T.h), n = w * T.h;
    for (var i = 0; i < n; i++) { var byte = bin.charCodeAt(i >> 1); m.a[i] = ((i & 1) ? byte & 15 : byte >> 4) / 15; }
    return m;
  }
  var FUENTES = T.f.map(function (f) { var o = {}; Object.keys(f).forEach(function (c) { o[c] = dec(f[c][0], f[c][1]); }); return o; });
  var DIG = {};  // dígito -> [{v, asp}]
  FUENTES.forEach(function (f) { '0123456789K'.split('').forEach(function (c) { if (f[c]) (DIG[c] = DIG[c] || []).push({v: vec(f[c], GW, GH), asp: f[c].w / f[c].h}); }); });
  var SIG = {};  // siglas -> [{v, asp}] (se arman al pedirlas)
  function plantillaSiglas(code) {
    if (SIG[code]) return SIG[code];
    var out = [];
    FUENTES.slice(0, -1).forEach(function (f) {
      var gl = code.split('').map(function (c) { return f[c]; });
      if (gl.some(function (g) { return !g; })) return;
      var gap = Math.round(T.h * 0.1), w = gl.reduce(function (s, g) { return s + g.w; }, 0) + gap * (gl.length - 1), m = img(w, T.h), x = 0;
      gl.forEach(function (g) { for (var y = 0; y < g.h; y++) for (var i = 0; i < g.w; i++) m.a[y * w + x + i] = g.a[y * g.w + i]; x += g.w + gap; });
      out.push({v: vec(m, TW, TH), asp: w / T.h});
    });
    return (SIG[code] = out);
  }
  // ---------- recorte del video ----------
  var CV = null;
  // z = [x0, y0, x1, y1] relativo al cuadro; modo 'blanco' (texto claro) o 'color' (siglas en azul/rojo)
  function recorte(v, z, modo) {
    var vw = v.videoWidth || v.naturalWidth || v.width, vh = v.videoHeight || v.naturalHeight || v.height, sx = z[0] * vw, sy = z[1] * vh, sw = (z[2] - z[0]) * vw, shh = (z[3] - z[1]) * vh;
    var k = Math.max(1, Math.min(8, 60 / shh)), w = Math.max(4, Math.round(sw * k)), h = Math.max(4, Math.round(shh * k));
    if (!CV) CV = document.createElement('canvas');
    CV.width = w; CV.height = h;
    var x = CV.getContext('2d', {willReadFrequently: true});
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(v, sx, sy, sw, shh, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, m = img(w, h);  // falla si el video está protegido
    for (var i = 0, j = 0; j < m.a.length; i += 4, j++) {
      var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      m.a[j] = modo === 'color' ? (mx > 90 ? Math.min(255, (mx - mn) * 1.6) : 0) : mn;
    }
    return m;
  }
  // ---------- números: reloj (mm:ss), oro (3.1K) y kills ----------
  function columnas(ink, w, h, y0, y1) {
    var segs = [], x = 0;
    function col(x) { for (var y = y0; y < y1; y++) if (ink[y * w + x]) return true; return false; }
    while (x < w) { if (col(x)) { var a = x; while (x < w && col(x)) x++; segs.push([a, x]); } else x++; }
    return segs;
  }
  function filasDe(ink, w, a, b, y0, y1) {
    var t = -1, u = -1, rows = [];
    for (var y = y0; y < y1; y++) { var r = false; for (var x = a; x < b; x++) if (ink[y * w + x]) { r = true; break; } rows.push(r); if (r) { if (t < 0) t = y; u = y + 1; } }
    return {t: t, u: u, rows: rows};
  }
  function clasificar(g, letras) {
    var v = vec(g, GW, GH), asp = g.w / g.h, mejor = {}, best = null, seg = null;
    letras.split('').forEach(function (c) {
      (DIG[c] || []).forEach(function (t) {
        var s = dot(v, t.v) - 0.8 * Math.abs(Math.log((asp + 0.05) / (t.asp + 0.05)));
        if (mejor[c] == null || s > mejor[c]) mejor[c] = s;
      });
    });
    Object.keys(mejor).forEach(function (c) { if (!best || mejor[c] > mejor[best]) { seg = best; best = c; } else if (!seg || mejor[c] > mejor[seg]) seg = c; });
    if (best === '0' || best === '8') {  // el 0 y el 8 se separan por el centro: hueco en el 0, trazo en el 8
      var p = [], cx0 = Math.floor(g.w * 0.4), cx1 = Math.max(cx0 + 1, Math.ceil(g.w * 0.6));
      for (var y = 0; y < g.h; y++) { var s2 = 0; for (var x = cx0; x < cx1; x++) s2 += g.a[y * g.w + x]; p.push(s2 / (cx1 - cx0)); }
      var rng = function (a, b) { return p.slice(Math.floor(g.h * a), Math.max(Math.floor(g.h * a) + 1, Math.ceil(g.h * b))); };
      var mid = Math.max.apply(null, rng(0.42, 0.58)), d1 = Math.min.apply(null, rng(0.18, 0.4)), d2 = Math.min.apply(null, rng(0.6, 0.82));
      best = mid > Math.max(d1, d2) + 0.12 ? '8' : '0';
    }
    return {c: best, s: mejor[best], c2: seg, s2: seg != null ? mejor[seg] : null};
  }
  var DET = [];  // detalle de la última lectura: por carácter, la segunda opción
  function numeros(m, letras) {
    DET = [];
    letras = letras || '0123456789';
    var hi = pct(m, 0.995), lo = pct(m, 0.4);
    if (hi - lo < 40 || hi < 110) return '';
    var w = m.w, h = m.h, ink = new Uint8Array(w * h), gn = img(w, h), th = Math.max(hi * 0.62, 100), i;
    for (i = 0; i < w * h; i++) { ink[i] = m.a[i] > th ? 1 : 0; gn.a[i] = Math.max(0, Math.min(1, (m.a[i] - lo) / (hi - lo))); }
    var segs = columnas(ink, w, h, 0, h).filter(function (s) { var n = 0; for (var y = 0; y < h; y++) for (var x = s[0]; x < s[1]; x++) n += ink[y * w + x]; return n > 3; });
    if (!segs.length) return '';
    var cajas = segs.map(function (s) { var f = filasDe(ink, w, s[0], s[1], 0, h); return {a: s[0], b: s[1], t: f.t, u: f.u, rows: f.rows}; });
    var H = Math.max.apply(null, cajas.map(function (c) { return c.u - c.t; }));
    var out = '';
    cajas.forEach(function (c) {
      var hh = c.u - c.t, ww = c.b - c.a;
      if (hh < 0.25 * H) return;  // ruido
      var r = c.rows.slice(c.t, c.u), hueco = r[0] && r[r.length - 1] && r.indexOf(false) > 0;
      if (ww < 0.3 * H && (hh < 0.45 * H || hueco)) { var pc = (hueco || hh > 0.3 * H) ? ':' : '.'; out += pc; DET.push({c: pc}); return; }
      if (ww < 0.18 * H && hh > 0.8 * H) { out += '1'; DET.push({c: '1', c2: '7'}); return; }
      var n = Math.max(1, Math.round(ww / (0.56 * H))), cortes = [0];
      for (var k = 1; k < n; k++) {  // glifos pegados: cortar donde hay menos tinta
        var cc = Math.round(ww * k / n), l = Math.max(1, cc - Math.round(0.15 * H)), rr = Math.min(ww - 1, cc + Math.round(0.15 * H)), bx = cc, bv = 1e9;
        for (var x = l; x < rr; x++) { var s = 0; for (var y = c.t; y < c.u; y++) s += ink[y * w + c.a + x]; if (s < bv) { bv = s; bx = x; } }
        cortes.push(bx);
      }
      cortes.push(ww);
      for (k = 0; k < n; k++) {
        var x0 = c.a + cortes[k], x1 = c.a + cortes[k + 1], xa = -1, xb = -1;
        for (var xx = x0; xx < x1; xx++) { var hay = false; for (var yy = c.t; yy < c.u; yy++) if (ink[yy * w + xx]) { hay = true; break; } if (hay) { if (xa < 0) xa = xx; xb = xx + 1; } }
        if (xa < 0) continue;
        var hallado = clasificar(sub(gn, xa, c.t, xb, c.u), letras); out += hallado.c; DET.push(hallado);
      }
    });
    return out;
  }
  // ---------- siglas de los equipos: se elige entre una lista cerrada ----------
  function siglas(m, codigos) {
    var hi = pct(m, 0.995), lo = pct(m, 0.4);
    if (hi - lo < 40) return [];
    var w = m.w, h = m.h, gn = img(w, h), ink = new Uint8Array(w * h), i;
    for (i = 0; i < w * h; i++) { gn.a[i] = Math.max(0, Math.min(1, (m.a[i] - lo) / (hi - lo))); ink[i] = gn.a[i] > 0.5 ? 1 : 0; }
    // la banda de filas con más tinta es la palabra principal (descarta la línea de «LPL #4» de abajo)
    var best = [0, 0, 0], y = 0;
    function fila(y) { for (var x = 0; x < w; x++) if (ink[y * w + x]) return true; return false; }
    while (y < h) { if (fila(y)) { var a = y, n = 0; while (y < h && fila(y)) { for (var x = 0; x < w; x++) n += ink[y * w + x]; y++; } if (n > best[0]) best = [n, a, y]; } else y++; }
    if (!best[0]) return [];
    var segs = columnas(ink, w, h, best[1], best[2]).filter(function (s) { return s[1] - s[0] > 1; });
    if (!segs.length) return [];
    // la palabra: segmentos cercanos entre sí (separa un logo o un ícono a los costados)
    var bh = best[2] - best[1], grupos = [[segs[0]]];
    for (i = 1; i < segs.length; i++) { if (segs[i][0] - segs[i - 1][1] > bh * 0.6) grupos.push([]); grupos[grupos.length - 1].push(segs[i]); }
    var res = [];
    grupos.forEach(function (gr) {
      var a = gr[0][0], b = gr[gr.length - 1][1]; if (b - a < bh * 0.4) return;
      var p = sub(gn, a, best[1], b, best[2]), v = vec(p, TW, TH), asp = p.w / p.h;
      codigos.forEach(function (code) {
        var s = -9; plantillaSiglas(code).forEach(function (t) { s = Math.max(s, dot(v, t.v) - 0.5 * Math.abs(Math.log(asp / t.asp))); });
        res.push({code: code, s: s});
      });
    });
    var top = {}; res.forEach(function (r) { if (top[r.code] == null || r.s > top[r.code]) top[r.code] = r.s; });
    return Object.keys(top).map(function (c) { return {code: c, s: top[c]}; }).sort(function (a, b) { return b.s - a.s; });
  }
  // miniatura para el diagnóstico
  function png(m) {
    var c = document.createElement('canvas'); c.width = m.w; c.height = m.h;
    var x = c.getContext('2d'), d = x.createImageData(m.w, m.h);
    for (var i = 0; i < m.a.length; i++) { var v = Math.max(0, Math.min(255, m.a[i])); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0); return c.toDataURL('image/png');
  }
  // ---------- victorias en la serie: los rectángulos apilados junto a cada logo del HUD ----------
  // Pegada a la barra de color de cada lado hay una columna de rectángulos (2 al mejor de 3, 3 al mejor de 5) que se llenan
  // con el color del lado por cada juego ganado. Primero se ubica la barra (la columna con el tramo de color más largo) y
  // después se miran las columnas donde van los rectángulos, unos píxeles hacia adentro: así no importa si el video está un
  // poco corrido o escalado. Devuelve {i: victorias izq., d: victorias der.} o null si no se ve el marcador.
  var SERIE = {i: [0.262, 0.006, 0.282, 0.072], d: [0.718, 0.006, 0.738, 0.072]}, LIENZO_SERIE = null, FILAS = 64, COLS = 30;
  function serie(src) {
    var W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    if (!W || !H) return null;
    if (!LIENZO_SERIE) { LIENZO_SERIE = document.createElement('canvas'); LIENZO_SERIE.width = COLS; LIENZO_SERIE.height = FILAS; }
    var x = LIENZO_SERIE.getContext('2d', {willReadFrequently: true});
    function lado(z, azul, haciaDentro) {
      x.drawImage(src, z[0] * W, z[1] * H, (z[2] - z[0]) * W, (z[3] - z[1]) * H, 0, 0, COLS, FILAS);
      var d = x.getImageData(0, 0, COLS, FILAS).data;
      var deColor = function (c, y) { var i = (y * COLS + c) * 4, r = d[i], g = d[i + 1], b = d[i + 2]; return azul ? b > 100 && b - r > 45 : r > 100 && r - Math.max(g, b) > 45; };
      var tramos = function (c) {  // los tramos de color de una columna: [inicio, largo]
        var out = [], ini = -1;
        for (var y = 0; y <= FILAS; y++) { var si = y < FILAS && deColor(c, y); if (si && ini < 0) ini = y; if (!si && ini >= 0) { out.push([ini, y - ini]); ini = -1; } }
        return out;
      };
      // la barra del lado: el tramo más largo (al menos la mitad de la zona)
      var barra = -1, largo = FILAS * 0.45;
      for (var c = 0; c < COLS; c++) tramos(c).forEach(function (t) { if (t[1] > largo) { largo = t[1]; barra = c; } });
      if (barra < 0) return null;
      // los rectángulos: de 3 a 7 columnas hacia adentro; cada tramo de color de 6 filas o más (y más corto que la barra) es una victoria
      var votos = {};
      for (var k = 3; k <= 7; k++) {
        var cc = barra + haciaDentro * k; if (cc < 0 || cc >= COLS) continue;
        var n = tramos(cc).filter(function (t) { return t[1] >= 6 && t[1] < largo * 0.8; }).length;
        votos[n] = (votos[n] || 0) + 1;
      }
      var mejor = 0, vn = 0; for (var q in votos) if (votos[q] > vn || (votos[q] === vn && +q > mejor)) { vn = votos[q]; mejor = +q; }
      return mejor;
    }
    var a = lado(SERIE.i, true, 1), b = lado(SERIE.d, false, -1);
    if (a == null || b == null || a > 3 || b > 3) return null;
    return {i: a, d: b};
  }
  window.RiftLector = {recorte: recorte, numeros: numeros, detalle: function () { return DET.slice(); }, siglas: siglas, serie: serie, png: png, _img: img};
})();

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
  host2.style.cssText = 'position:fixed;z-index:2147483645;pointer-events:none;transform-origin:0 0;transition:opacity .6s;';
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
  .w{background:rgba(var(--g1-rgb),.4);backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);box-shadow:0 6px 18px rgba(0,0,0,.28);transition:background .2s}\
  .w:hover{background:rgba(var(--g1-rgb),.86)}\
  .w,.col{text-shadow:0 1px 2px rgba(0,0,0,.75),0 0 8px rgba(0,0,0,.35)}\
  .col .cd,.col .dmg{background:rgba(var(--g1-rgb),.5);backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);box-shadow:0 6px 18px rgba(0,0,0,.28)}\
  .hint{display:none;align-items:center;gap:8px;height:28px;padding:0 12px 0 8px;border-radius:999px;background:rgba(var(--g1-rgb),.9);border:1px solid rgba(var(--line-rgb),.13);font:600 12px var(--ff);color:var(--muted);white-space:nowrap;cursor:pointer}\
  .w.tenue{opacity:.14;transition:opacity .6s}.w{transition:opacity .6s,background .2s}\
  .hint.show{display:inline-flex}.hint .logo{width:16px;height:16px}.hint b{color:var(--text);font-weight:700}.hint a{color:var(--signal);text-decoration:none;font-weight:700}\
  .ctl::before{content:"";position:absolute;left:0;right:0;top:-10px;height:10px}\
  .pzp{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;font:700 13px var(--ff);margin:2px 0 6px}.pzp b{font:800 18px var(--ffd);font-variant-numeric:tabular-nums}\
  .pzm{height:6px;border-radius:3px;background:var(--team-b);overflow:hidden}.pzm i{display:block;height:6px;background:var(--team-a)}\
  .pzr{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;font-size:13px;padding:3px 0;border-top:1px solid rgba(var(--line-rgb),0.055);font-variant-numeric:tabular-nums}\
  .pzr span{color:var(--muted);font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;text-align:center;align-self:center}.pzr i{font-style:normal;color:var(--muted)}.pzr i:last-child{text-align:right}.pzr b:last-child{text-align:right}\
  .pzk{font-size:12.5px;margin-top:6px;line-height:1.4}.pz .hs{margin-top:6px;font-size:12.5px}\
  .ctl.auto .man{display:none}.man{display:inline-flex;align-items:center;gap:4px}\
  ';

  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rplg" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="'+RPC.a+'"/><stop offset=".5" stop-color="'+RPC.ahi+'"/><stop offset="1" stop-color="'+RPC.b+'"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="15" fill="#14171d" stroke="#2a2f3a" stroke-width="3"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rplg)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  sh.innerHTML = '<style>' + CSS + TOK + '</style><div class="w" id="w"><div class="mom" id="mom"></div><div class="toast" id="toast"></div><div class="diag" id="diag"></div><div id="body" style="display:inline-flex"></div>' +
    '<div class="ctl" id="ctl"><div class="tl" id="tl"></div><span class="chip" id="autoc" title="Lee el reloj y el marcador del video y se sincroniza solo con el minuto que ves">sincronía automática</span><span class="ast" id="ast"></span><button class="ic" id="diagb" title="Qué está leyendo del video (por si no sincroniza)">?</button>' +
    '<span class="chip" data-ext="obj" title="El próximo objetivo (dragón, Barón…) y cuánto puede mover la probabilidad">objetivo</span><span class="chip" data-ext="pg" title="Cómo fue cambiando la probabilidad en el juego">trayectoria</span><span class="chip" data-ext="oro" title="Panel: la diferencia de oro minuto a minuto">oro</span><span class="chip" data-ext="dano" title="Panel: el daño de cada jugador">daño</span><span class="chip" data-ext="imp" title="Panel: las jugadas que más movieron la probabilidad">impacto</span><span class="chip" data-ext="duelos" title="Panel: cómo va cada jugador contra su rival de línea">duelos</span><span class="chip" data-ext="mini" title="Solo los porcentajes, lo más chico posible">mínimo</span>' +
    '<button class="ic" id="posbtn" title="Volver a su lugar (debajo del marcador o arriba de las estadísticas)">↑↓</button><span class="man"><button class="ic" data-d="-5" title="Atrasar el overlay 5 segundos">−</button><button class="ic" data-d="5" title="Adelantar el overlay 5 segundos">+</button>' +
    '<span class="syncg" title="Escribí el minuto del juego que ves en el stream y tocá ⟲ (o Enter) para clavar el overlay a ese momento">minuto <input id="scm" placeholder="mm:ss" maxlength="5"><button class="ic" id="syncb" title="Sincronizar al minuto que escribiste">⟲</button> va <span class="gt" id="gtnow">—</span></span></span><button class="ic" id="ocub" title="Ocultar RiftPulse (Alt+R lo vuelve a mostrar)">✕</button></div></div>';
  sh2.innerHTML = '<style>' + CSS + TOK + '</style><div class="col" id="cards"><div id="pausa" style="display:contents"></div><div class="dmg" id="dmg"></div><div id="cardsx" style="display:contents"></div></div>';
  var hintEl = document.createElement('div'); hintEl.className = 'hint'; sh.appendChild(hintEl);
  // idioma (ES | EN): el que se eligió en la app (llega con las órdenes de Mando) o el del navegador. Solo se traduce lo de
  // RiftPulse, nunca la página de Twitch
  var IDIOMA_ON = false;
  function idioma(l) {
    if (!window.RPI18N) return;
    if (l && l !== RPI18N.lang()) RPI18N.set(l);
    if (RPI18N.lang() === 'en' && !IDIOMA_ON) { IDIOMA_ON = true; RPI18N.observar(sh); RPI18N.observar(sh2); }
  }
  idioma();
  var wEl = sh.getElementById('w'), body = sh.getElementById('body'), ctl = sh.getElementById('ctl'), momEl = sh.getElementById('mom'), dmgEl = sh2.getElementById('dmg'), cardsX = sh2.getElementById('cardsx'), pausaEl = sh2.getElementById('pausa');

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
    // entra cuando la pelea terminó (unos 10 s sin kills) y queda 30 s, para leerla con calma; después se va sola
    clearTimeout(fightTimer); fightTimer = setTimeout(function () { dmgEl.classList.remove('show'); }, 30000);
  }
  // el overlay se ve solo cuando el juego está en pantalla (el HUD con su reloj, leído al menos dos veces seguidas).
  // Repetición, desk, publicidad, entrevista o multivista: no queda nada a la vista. Al mover el mouse aparece un aviso chico.
  var MOSTRAR = 0, MOUSE = 0, pausaSig = '';
  // el juego terminó: el resultado se ve unos segundos y después nada (los mejores momentos muestran el HUD, pero no hay que estorbar)
  var FIN = null;
  function terminado(s) {
    var g = s && s.game;
    if (!g || !g.ended) { FIN = null; return false; }
    if (!FIN || FIN.id !== g.id) FIN = {id: g.id, at: Date.now()};
    return true;
  }
  // true: no se ve nada · 'pausa': el juego está en pausa (se ve el panel de pausa) · 'tenue': casi transparente (se sigue un juego, pero ahora no está en pantalla) · false: se ve
  function oculto(s) {
    if (typeof AS === 'undefined' || !AS.on || !L || Date.now() <= MOSTRAR) return false;
    if (terminado(s) && Date.now() - FIN.at > 6000) return true;  // el juego terminó: nada sobre los mejores momentos
    // se sigue un juego (un VOD, o el juego en curso en vivo) y ahora hay una repetición, tomas de los jugadores o el desk:
    // en vez de desaparecer, queda casi transparente y vuelve a la normalidad apenas se ve el juego
    var sigue = !!(AS.id && AS.off != null && (esVod() || AS.id.live));
    if (AS.pausa && sigue) return 'pausa';  // pausa del juego: en vez de la barra, el resumen de lo que va (debajo del cartel)
    if (AS.replay && Date.now() - AS.replay < 180000) return sigue ? 'tenue' : true;  // una repetición (hasta 3 min)
    if (!(AS.buenas >= 2 && Date.now() - AS.visto <= 5000)) return sigue && AS.visto ? 'tenue' : true;
    // en una transmisión en vivo solo se acompaña al juego que se está jugando (no a clips ni mejores momentos)
    if (!esVod() && (!AS.id || !AS.id.live)) return true;  // en vivo: aparece recién al reconocer el juego en curso
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
    if (/repetición/.test(st)) return 'vuelve cuando termine la repetición';
    if (AS.pausa) return 'juego en pausa · vuelve al reanudarse';
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
    var oc = oculto(s), tenue = oc === 'tenue', pz = oc === 'pausa';
    wEl.classList.toggle('oculto', oc === true || pz); wEl.classList.toggle('tenue', tenue); host2.style.opacity = tenue ? '0.12' : ''; pintarHint();
    var ph = pz ? grafPausa(s) : '';
    if (ph !== pausaSig) { pausaSig = ph; pausaEl.innerHTML = ph; if (pz && window.RPUI) RPUI.numeros(pausaEl); }
    if (oc === true || pz) {
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
    // «juego en pausa» solo si la pantalla no dice lo contrario (con el reloj del HUD corriendo, manda la pantalla)
    var corre = typeof AS !== 'undefined' && AS.on && AS.id && !AS.pausa && Date.now() - AS.visto < 5000;
    var fdo = s.feed && ['retrasado', 'caido', 'pausa'].indexOf(s.feed.estado) >= 0 && !(corre && s.feed.estado === 'pausa') ? '<div class="seg fdo"><span class="sl">' + esc(s.feed.txt) + '</span></div>' : '';
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
  // el juego está en pausa (el cartel «GAME PAUSE» de la transmisión): lo que va del juego hasta ese minuto
  function grafPausa(s) {
    var g = s && s.game, m = s && s.match;
    if (!g || !m || g.pBlue == null) return '<div class="cd pz" style="width:340px"><div class="ch"><span>Juego en pausa</span></div></div>';
    var st = g.stats, pb = Math.round(g.pBlue * 100), pr = 100 - pb, k = function (x) { return (x / 1000).toFixed(1).replace('.', ',') + 'k'; };
    var fila = function (n, b, r, f) { var x = f ? f(b) : b, y = f ? f(r) : r; return '<div class="pzr">' + (b > r ? '<b class="b">' + x + '</b>' : '<i>' + x + '</i>') + '<span>' + n + '</span>' + (r > b ? '<b class="r">' + y + '</b>' : '<i>' + y + '</i>') + '</div>'; };
    var h = '<div class="cd pz" style="width:340px"><div class="ch"><span>Pausa · lo que va del juego</span><b>' + mmss(g.gt) + '</b></div>' +
      '<div class="pzp"><span class="b">' + esc(m.blue.code) + ' <b>' + pb + '%</b></span><div class="pzm"><i style="width:' + pb + '%"></i></div><span class="r"><b>' + pr + '%</b> ' + esc(m.red.code) + '</span></div>';
    if (st) h += fila('Kills', st.blue.kills, st.red.kills) + fila('Oro', st.blue.gold, st.red.gold, k) + fila('Torres', st.blue.towers, st.red.towers) +
      fila('Dragones', st.blue.dragons, st.red.dragons) + fila('Barones', st.blue.barons, st.red.barons) + (st.blue.inhibs + st.red.inhibs ? fila('Inhibidores', st.blue.inhibs, st.red.inhibs) : '');
    var kp = g.keyPlayer;
    if (kp) h += '<div class="pzk">Figura hasta ahora: <b class="' + (kp.side === 'blue' ? 'b' : 'r') + '">' + esc(kp.name) + '</b> (' + esc(kp.champ) + ') · ' + kp.k + '/' + kp.d + '/' + kp.a + '</div>';
    var hs = R.historia ? R.historia(s).slice(-3) : [];
    if (hs.length) h += '<ol class="hs">' + hs.map(function (x) { return '<li>' + x.html + '</li>'; }).join('') + '</ol>';
    return h + '</div>';  // compacto: entra entero debajo del cartel
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
    if (c.lang) idioma(c.lang);
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
    // el reloj no está siempre en el mismo lugar: los íconos de dragones de la segunda fila lo corren a un lado o al otro.
    // Se lee la franja ancha y se busca «mm:ss» adentro (los íconos de alrededor se ignoran)
    reloj: [0.44, 0.062, 0.56, 0.102],
    tagI: [0.29, 0.0, 0.375, 0.055], tagD: [0.625, 0.0, 0.715, 0.055],
    oroI: [0.418, 0.016, 0.462, 0.049], oroD: [0.542, 0.016, 0.579, 0.049],
    killI: [0.468, 0.01, 0.497, 0.065], killD: [0.503, 0.01, 0.533, 0.065],
    camI: [0.372, 0.393], camD: [0.607, 0.628], camY: [0.761, 0.81, 0.859, 0.907, 0.953], camH: 0.042
  };
  // si el reloj no está en su lugar, se busca solo en la franja del marcador (arriba al centro), nunca en otras zonas
  var RELOJES = [HUD.reloj, [0.44, 0.04, 0.56, 0.125], [0.44, 0.0, 0.56, 0.065], [0.44, 0.085, 0.56, 0.155]];
  var AS = {t0: Date.now(), on: ls('rp_auto6') !== '0', busy: false, zona: null, fallas: 0, lect: [], contra: [], off: null, id: null, vid: null, visto: 0, codes: null, codesAt: 0, n: 0, malas: 0, pend: null, trasSalto: false, diag: {}, err: ''};
  if (window.RP_DEBUG) { window.__rpAS = AS; window.__rpRender = function (f) { return render(f(LAST)); }; }  // solo para las pruebas
  // «mm:ss» dentro de lo leído (a los costados puede haber restos de íconos): «:21:134» → 21:13. Con un solo dígito de
  // minutos («5:09», HUD de otros años) solo si no hay nada más alrededor
  function parseReloj(s) {
    s = String(s || '').replace(/[^\d:]/g, '');
    var m = s.match(/(\d{2}):(\d{2})/) || s.match(/^(\d):(\d{2})$/);
    if (!m || +m[2] > 59 || +m[1] > 75) return null;
    return +m[1] * 60 + +m[2];
  }
  // lecturas posibles del reloj: la del lector y, por cada dígito, su segunda opción (un 0 leído como 2, etc.)
  function variantes(det) {
    var base = det.map(function (d) { return d.c; }).join(''), out = [], g = parseReloj(base);
    if (g != null) out.push({gt: g, alt: false});
    det.forEach(function (d, i) {
      if (!d.c2 || !/\d/.test(d.c)) return;
      var t = det.map(function (x, j) { return j === i ? d.c2 : x.c; }).join(''), g2 = parseReloj(t);
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
  // victorias en la serie según el HUD, [izquierda, derecha] (las lee lector.js); null si el marcador no está en pantalla
  function victoriasHUD(v) { var r = L.serie ? L.serie(v) : null; return r ? [r.i, r.d] : null; }
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
    AS.pausa = null; AS.id = null; AS.off = null; AS.lect = []; AS.contra = []; AS.trasSalto = false; AS.playing = null; AS.pend = null;
    R.follow(null); publicar();
  }
  // atar el motor al video: minuto = desfase + posición del video
  // remedir: el juego se reanudó tras una pausa (el motor vuelve a medir las pausas del feed)
  function seguir(v, remedir) {
    if (!AS.id || AS.off == null || !v) return;
    if (AS.pausa) AS.off = AS.pausa.gt - v.currentTime;  // en pausa, el minuto del juego no avanza aunque el video sí
    var gt = Math.max(0, AS.off + v.currentTime), g = LAST && LAST.game, playing = !v.paused && !v.ended && v.readyState > 2 && !AS.pausa;
    var esp = g && g.gt != null && LAST.match && LAST.match.id === AS.id.matchId ? g.gt : null;
    var reloj = !AS.pausa && Date.now() - AS.visto < 3000, choca = reloj && playing && g && g.pausa;  // el reloj corre y el feed dice pausa
    if (remedir || choca || esp == null || Math.abs(esp - gt) > 1.5 || AS.playing !== playing || AS.speed !== v.playbackRate) {
      AS.playing = playing; AS.speed = v.playbackRate;
      R.follow({matchId: AS.id.matchId, juego: AS.id.juego, gt: gt, playing: playing, speed: v.playbackRate || 1, at: Date.now(), reloj: reloj, remedir: !!remedir});
    }
  }
  // el cartel «GAME PAUSE» de la transmisión (arriba a la izquierda, junto al logo del torneo)
  var CARTEL = [0.1, 0.02, 0.3, 0.125];
  function cartelPausa(v) {
    try {
      var r = L.siglas(L.recorte(v, CARTEL, 'blanco'), ['GAMEPAUSE', 'PAUSE', 'GAME', 'REPLAY', 'LIVE']);
      AS.diag.cartel = r[0] ? r[0].code + ' ' + r[0].s.toFixed(2) : '—';
      return !!(r[0] && /PAUSE$/.test(r[0].code) && r[0].s > 0.4);
    } catch (e) { return false; }
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
        vars = variantes(L.detalle());
        if (diagEl.classList.contains('show') && (vars.length || i === 0)) AS.diag.img = L.png(m);
        if (vars.length) { zi = zonas[i]; break; }
      }
      AS.diag.reloj = txt || '(nada)'; AS.diag.zona = zi;
      if (AS.id && AS.off != null) publicar();  // el panel recibe el minuto siempre, se vea o no el reloj
      if (!vars.length) {
        if (++AS.fallas >= 5) AS.zona = null;
        if (Date.now() - AS.visto > 5000) AS.buenas = 0;
        // sin el reloj a la vista (repetición larga, tomas de los jugadores, el desk) el minuto igual sale de la posición del
        // video: se sigue el mismo juego (oculto en pantalla, el panel sigue) y al volver el HUD se confirma o se corrige solo.
        // Lo único que se suelta es un clip de un partido que no se juega ahora, en una transmisión en vivo
        if (AS.id && AS.off != null && AS.n % 2 === 0) { var cp = cartelPausa(v); if (!AS.pausa) { AS.cartel = cp ? (AS.cartel || 0) + 1 : 0; if (AS.cartel >= 2) AS.pausa = {gt: Math.max(0, AS.off + ct), at: Date.now()}; } }
        if (AS.pausa) { asEstado('juego en pausa · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(AS.pausa.gt), true); seguir(v); return; }
        if (AS.id && !esVod() && !AS.id.live && AS.visto && Date.now() - AS.visto > 25000) { soltar(); asEstado('buscando el reloj del juego…'); return; }
        asEstado(AS.id ? 'sincronizado · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(AS.off + ct) + ' (reloj tapado)' : 'buscando el reloj del juego…', !!AS.id);
        seguir(v); return;
      }
      AS.fallas = 0; AS.visto = Date.now(); AS.buenas = (AS.buenas || 0) + 1; AS.vistoAlguna = true;
      // pausa del juego: el reloj del HUD queda quieto 3 s mientras el video avanza (después suele venir el cartel «GAME PAUSE»).
      // El minuto se congela ahí y, cuando el reloj vuelve a correr desde ese minuto, se sigue sin saltos. Si vuelve desde
      // otro minuto (un juego reiniciado, otro video), se reconoce de nuevo con 3 lecturas
      var p0 = vars.filter(function (x) { return !x.alt; })[0];
      if (AS.pausa && p0) {
        if (p0.gt === AS.pausa.gt) { AS.pausaOtro = 0; asEstado('juego en pausa · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(p0.gt), true); seguir(v); return; }
        var sigue = p0.gt > AS.pausa.gt && p0.gt - AS.pausa.gt <= 10;
        if (!sigue && ++AS.pausaOtro < 3) { seguir(v); return; }  // una mala lectura no termina la pausa
        AS.pausa = null; AS.pausaOtro = 0; AS.quieto = null; AS.playing = null;
        if (sigue) { AS.off = p0.gt - ct; AS.contra = []; seguir(v, true); }  // el motor vuelve a medir las pausas (esta puede ser nueva)
        else { AS.trasSalto = true; AS.lect = []; AS.contra = []; }
      } else if (p0 && AS.id && AS.off != null && playing) {
        var q = AS.quieto;
        if (q && q.gt === p0.gt) {
          if (ct - q.ct >= 3 && Math.abs(q.gt - (AS.off + q.ct)) <= 3) { AS.pausa = {gt: q.gt, at: Date.now()}; AS.pausaOtro = 0; asEstado('juego en pausa · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(q.gt), true); seguir(v); return; }
        } else AS.quieto = {gt: p0.gt, ct: ct};
      }
      // el oro (si se lee bien) descarta minutos imposibles; sin oro confiable no descarta nada
      var esperado = AS.off != null ? AS.off + ct : null, og = oroHUD(v);
      AS.diag.oro = og ? og.join('k · ') + 'k' : 'no se lee';
      var vale = og ? vars.filter(function (x) { return oroPosible(og[0], x.gt) && oroPosible(og[1], x.gt); }) : vars;
      if (!vale.length) { AS.diag.descarte = mmss(vars[0].gt) + ' (imposible con el oro en pantalla)'; asEstado(AS.id ? 'sincronizado · ' + AS.id.codes.join(' vs ') + ' · ' + mmss(esperado) : 'leyendo el reloj…', !!AS.id); seguir(v); return; }
      var cerca = esperado != null ? vale.filter(function (x) { return Math.abs(x.gt - esperado) <= 2.5; })[0] : null;
      var gt, off;
      AS.zona = zi;
      // repetición en la transmisión: el reloj del HUD va bastante atrás de lo esperado sin que nadie haya movido el video.
      // Se oculta todo y no se cambia el ancla; cuando el reloj vuelve a coincidir, reaparece. (Si dura más de 3 min, era otra cosa.)
      var principal = vale.filter(function (x) { return !x.alt; })[0];  // la lectura tal cual (sin las segundas opciones de cada dígito)
      // un juego nuevo también «vuelve atrás» (a 0:00): eso no es una repetición. Repetición = reloj más allá del minuto y medio,
      // el juego que se sigue no terminó y la serie en pantalla es la misma
      var nuevoJuego = (LAST && LAST.game && LAST.game.ended) || (principal && principal.gt < 90);
      var atras = !cerca && esperado != null && !AS.trasSalto && !!principal && principal.gt < esperado - 6 && !nuevoJuego;
      if (atras) {
        if (!AS.replay) AS.replay = Date.now();
        if (Date.now() - AS.replay < 180000) { AS.diag.replay = mmss(vale[0].gt); asEstado('repetición en pantalla · vuelve con el juego', !!AS.id); seguir(v); return; }
      } else AS.replay = 0;
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
    var vs = victoriasHUD(v), otro = vs && AS.id.juego !== vs[0] + vs[1] + 1;
    if (vs) AS.serie = vs;
    AS.serieOtro = otro ? (AS.serieOtro || 0) + 1 : 0;
    if (otro && AS.serieOtro >= 2) {
      AS.serieOtro = 0;
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
    if (ev === 'seeked') { AS.lect = []; AS.contra = []; AS.trasSalto = true; AS.pausa = null; AS.quieto = null; }  // tras mover el video alcanza con 3 lecturas para cambiar el ancla
    AS.playing = null; seguir(e.target); }, true); });

  R.onUpdate(render);
  if (!window.RP_NO_AUTOSTART) R.start();
})();
