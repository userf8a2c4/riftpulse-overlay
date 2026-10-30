// RiftPulse — idiomas (ES | EN). Las páginas se escriben en español; con inglés elegido, el texto que se ve se traduce solo
// con este diccionario (también el que se dibuja después). Los números se respetan: «Ronda {n}» → «Round {n}».
// Uso: RPI18N.boton() devuelve el selector ES|EN; RPI18N.lang() el idioma; RPI18N.locale() para fechas (Intl).
(function () {
  if (window.RPI18N) return;
  var CLAVE = 'rp_lang';
  var leer = function () { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } };
  var guardar = function (v) { try { localStorage.setItem(CLAVE, v); } catch (e) {} };
  var LANG = leer() === 'en' ? 'en' : 'es';  // español, salvo que se elija EN (se recuerda)

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
  // claves con los números cambiados por {n}
  var norm = function (s) { var nums = []; var k = s.replace(/\d+(?:[.,:]\d+)*/g, function (m) { nums.push(m); return '{n}'; }); return {k: k, nums: nums}; };
  function t(s) {
    if (LANG !== 'en' || !s) return s;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = m[2]; if (!core) return s;
    if (D[core]) return m[1] + D[core] + m[3];
    var n = norm(core), en = D[n.k]; if (!en) return s;
    var i = 0; return m[1] + en.replace(/\{n\}/g, function () { return n.nums[i++] || ''; }) + m[3];
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
    new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; traducir(raiz); }); })
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
  var ini = function () {
    document.querySelectorAll('[data-rp-lang]').forEach(function (el) { if (!el.firstChild) el.appendChild(boton()); });
    if (LANG === 'en') { document.documentElement.lang = 'en'; observar(document.body); }
  };
  if (document.body) ini(); else document.addEventListener('DOMContentLoaded', ini);
})();
