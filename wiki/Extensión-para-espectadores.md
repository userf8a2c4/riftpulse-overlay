# Extensión para espectadores

La extensión pone RiftPulse **encima del video** de Twitch o de lolesports.com (solo lo ves vos) y suma un **panel lateral** con toda la app y el centro de mando.

> **Próximamente en la Chrome Web Store:** una instalación de un clic, sin modo de desarrollador. Ya está el paquete (`riftpulse-extension-tienda.zip`); falta publicarlo.

## Instalar (una sola vez)

La forma más fácil: **[la página Instalar](https://userf8a2c4.github.io/riftpulse-overlay/instalar.html)**. Elegís qué querés (sobre el video, como app o para tu stream) y te guía con un botón por paso.

1. **Descargá** el [ZIP](https://userf8a2c4.github.io/riftpulse-overlay/riftpulse-extension.zip) y extraelo: queda la carpeta **riftpulse-extension**. Movela a Documentos y no la borres.
2. Abrí `chrome://extensions` (o `edge://`, `brave://`, `opera://extensions`) y activá el **Modo de desarrollador**.
3. **Cargar descomprimida** → esa carpeta.
4. En RiftPulse → **Detalles**, activá **«Permitir scripts de usuario»**: así el overlay se actualiza solo desde la web. (Si tu navegador no lo tiene, funciona igual.)

¿Dice «Falta el archivo de manifiesto»? Elegiste otra carpeta: tiene que ser la que tiene `manifest.json`.

Desde ahí no hay nada que descargar: el panel siempre abre la última versión, y el overlay se renueva al tocar ↻ en la extensión, al abrir el navegador y cada 6 horas.

## Sincronía automática con el video

Con la **sincronía automática** encendida (viene así), el overlay **lee el video**: el reloj del juego, las siglas de los equipos, las kills, el oro, los campeones en pantalla y **las victorias de cada equipo en la serie** (los rectángulos junto a los logos). Con la serie en pantalla sabe qué juego es aunque saltes a cualquier minuto del VOD, sin preguntarte nada. Con eso:

- **reconoce el partido y el juego de la serie**, aunque sea un VOD de otro día del Mundial;
- **se ata al minuto exacto** de lo que estás viendo: sigue la pausa, la velocidad, los saltos hacia adelante o atrás y los cortes de carga;
- mientras reconoce, la barra dice **«Sincronizando con el video…»**: nunca muestra otro partido;
- al reconocerlo, un aviso de 3 s lo confirma: **«Sincronizado · IG vs LYON · juego 2 · 17:42»**, en los colores de los equipos.

El lector funciona dentro del navegador, sin servicios externos, y no envía imágenes a ningún lado.

**Para ocultarlo:** el botón **✕** de la barra, o **Alt+R** (lo mismo para volver a mostrarlo).

**Cuando no está a la vista**, al mover el mouse aparece un aviso chico que dice por qué: *aparece cuando el juego está en pantalla*, *vuelve con el juego*, *sin conexión con lolesports*. En un stream que no es de LoL, RiftPulse no muestra nada. En **lolesports.com** el video va en un reproductor aparte que no se puede leer: el aviso ofrece abrir el mismo partido en Twitch.

El **panel lateral** sigue lo mismo que tu video: arriba dice *Sincronizado con tu video* y el centro de mando usa ese juego y ese minuto. Si preferís mirar otra cosa en el panel, apagá **📺 Seguir el video** en Mando.

### Si no sincroniza

En la barra del overlay, pasá el mouse y tocá **?**. Aparece el **diagnóstico**: qué reloj leyó, qué siglas, el marcador, qué partido reconoció y la calidad del video. Con una captura de ese cuadro se sabe exactamente qué pasa.

## La barra lee la sala
- **Solo con el juego en pantalla.** Sin el marcador del juego a la vista (repetición, desk, publicidad, entrevista, multivista), el overlay **desaparece entero** en unos segundos y vuelve solo cuando reaparece el juego. Si movés el mouse mientras está oculto, un aviso chico dice que está esperando el juego.
- **Integrado a la transmisión:** la barra va pegada debajo del marcador de arriba, y los paneles, de a uno, en la columna izquierda a media altura. Nunca tapan el marcador, los timers, la barra de estadísticas, las cámaras ni el minimapa.
- **Cuando termina el juego** se ve unos segundos quién ganó y después desaparece, aunque sigan los mejores momentos con el HUD. En una transmisión en vivo solo acompaña al juego que se está jugando: un clip, una repetición o los mejores momentos de otro juego no la hacen aparecer.
- **Transparente:** la barra y los paneles dejan ver el mapa; al pasar el mouse se vuelven opacos para usar los controles.
- **Siempre el partido correcto:** en una transmisión en vivo se prefiere el juego que se está jugando. Si pasan un clip de otro partido (por ejemplo, en la previa), el overlay lo suelta a los 25 s sin reloj y vuelve al vivo.
- **En el draft** muestra solo «Draft · IG vs LYON».
- **Colores del video:** la barra toma el color de la sigla de cada equipo en el marcador de la transmisión.

## Línea de tiempo y saltos en el VOD
Al pasar el mouse por la barra se despliega el **gráfico de probabilidad del juego** con los momentos clave marcados: giros, Barones, dragones e inhibidores.
- **En un VOD, tocar un momento salta el video a ese instante** (unos segundos antes, para verlo venir).
- **−10 s**, **◀ momento** y **momento ▶** para moverse por el juego.
- En vivo, el salto se desactiva.

Pasando el mouse por el porcentaje aparece la **historia del juego** en pocas frases.

## Sin spoilers
En un VOD, la app, el panel y Mando **tapan los resultados** del partido que estás viendo y de los siguientes. Ver [Modo sin spoilers](Modo-sin-spoilers).

## Paneles para el espectador

Los paneles aparecen **en su momento** (ver *Paneles automáticos*) y se cierran solos. Si querés uno siempre a la vista, fijalo desde los chips del overlay o desde **Mando → Overlay en el stream**:

| Panel | Qué muestra |
|---|---|
| **Gráfico de oro** | La diferencia de oro de todo el juego, con dragones, Barones e inhibidores marcados |
| **Impacto y remontada** | Cuánto movería la probabilidad el próximo objetivo para cada equipo, y qué necesita el que va abajo |
| **Duelos por línea** | Cada jugador contra su rival directo, con la diferencia de oro |
| **Daño de los 10** | El porcentaje del daño a campeones de cada jugador en su equipo |

Además, en la barra: **próximo objetivo** y **trayectoria**.

### Pelea en equipo
Solo después de una **pelea en equipo 5v5** (al menos 3 kills y 4 jugadores de cada equipo con una kill, una muerte o una asistencia; los 1v1, 2v2 y pick-offs no cuentan) aparece unos segundos un panel con lo que pasó en ella: el marcador de la pelea, quién la ganó, el oro, el objetivo que se llevó después, cómo cambió la probabilidad y, por jugador, su K/D/A en la pelea y cuánto más (o menos) daño que su promedio hizo. El feed público no trae la cantidad de daño ni su tipo: el ícono ⚔/✦/◐ es el tipo de daño de su campeón.

### Paneles automáticos
Sin tocar nada, el overlay suma solo el panel que aporta: el impacto del objetivo el minuto previo, el resumen al terminar y, en nivel Show, el oro y los duelos. Se elige el nivel en **Mando → Paneles automáticos** (Mínimo, Estándar o Show) y **⏭ Saltar panel** quita el que está.
