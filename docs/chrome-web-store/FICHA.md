# Publicar RiftPulse en la Chrome Web Store

Todo lo que pide la tienda ya está listo; solo falta subirlo con tu cuenta.

## Subir una versión nueva (2 minutos)
RiftPulse ya está publicada. Cada versión nueva:
1. Armala: `python3 fuente/construir_extension.py` (sube el número en `VERSION`, al principio de ese archivo). Queda `riftpulse-extension-tienda.zip` en la raíz, también en `https://userf8a2c4.github.io/riftpulse-overlay/riftpulse-extension-tienda.zip`.
2. En la [consola de desarrolladores](https://chrome.google.com/webstore/devconsole), abrí RiftPulse → **Paquete** → **Subir paquete nuevo** → elegí ese ZIP.
3. Si cambió algo de la ficha, actualizala con los textos y las imágenes de abajo (español e inglés).
4. **Enviar para revisión.** Suele tardar de 1 a 3 días; después les llega sola a todos los que la instalaron.

O, con los secretos cargados, sin entrar a la consola: ver «Publicar una versión nueva» al final.

> **Por qué es otro ZIP:** la tienda no acepta extensiones que bajen su código de la web, que es lo que hace la versión de instalación manual con «Permitir scripts de usuario». En la versión de la tienda, el overlay viaja dentro del paquete y el panel lateral sigue abriendo la app desde la web (eso sí está permitido: es una página, no código de la extensión). Quien ya tiene la versión manual puede seguir usándola.

## Textos de la ficha

La ficha va en dos idiomas: **Español** (principal) y **English** (en la consola: *Ficha de Play Store → Agregar idioma → English*). Cada idioma lleva sus capturas y promocionales (carpetas `es/` y `en/`).

### Español
**Nombre:** RiftPulse — tu segunda pantalla del Mundial de LoL

**Descripción breve (máx. 132):**
Quién va ganando el Mundial de LoL, en vivo sobre el video de Twitch. Se sincroniza solo con el minuto que ves.

**Descripción:**
RiftPulse pone sobre el video del Mundial de League of Legends la probabilidad de victoria de cada equipo, en vivo y en sus colores.

• Se sincroniza solo: lee el reloj y el marcador del video y muestra el minuto exacto que estás viendo, en vivo, en un VOD o en cualquier co-stream. Pausás, adelantás o cambiás de partido y se acomoda.
• Cada pelea, explicada: quién la ganó, qué hizo cada jugador y cuánto movió el juego.
• ¿Pausa técnica? Mientras dura el «GAME PAUSE», un resumen de lo que va del juego, debajo del cartel.
• Te cuenta el juego: cómo arrancó, el giro clave, qué cambió en el último minuto y qué mirar ahora (el próximo dragón o Barón y cuánto vale para cada equipo).
• Honesto: muestra cuánto acierta el modelo en cada minuto (75 % al minuto 15, medido en 589 juegos que no vio).
• Panel lateral con todo el Mundial: tu pronóstico contra el de RiftPulse, la fase suiza, las eliminatorias, el Pick'Em y el historial entre los equipos.
• Sin spoilers en los VOD, en español o en inglés (botón ES | EN).

Gratis, sin cuentas y sin apuestas. No está avalado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.

### English
**Name:** RiftPulse — your LoL Worlds second screen

**Summary (max. 132):**
Who's winning LoL Worlds, live on top of the Twitch video. Synced on its own to the minute you're watching.

**Description:**
RiftPulse puts each team's win probability on top of the League of Legends Worlds video, live and in their colors.

• Syncs on its own: it reads the clock and scoreboard from the video and shows the exact minute you're watching, live, in a VOD or any co-stream. Pause, skip or switch matches and it keeps up.
• Every fight, explained: who won it, what each player did and how much it moved the game.
• Technical pause? While the «GAME PAUSE» lasts, a recap of the game so far, right below the banner.
• It tells the story of the game: how it started, the key swing, what changed in the last minute and what to watch next (the next dragon or Baron and what it's worth to each team).
• Honest: it shows how often the model is right at each minute (75% at minute 15, measured on 589 games it never saw).
• A side panel with all of Worlds: your picks vs RiftPulse's, the Swiss Stage, the knockouts, Pick'Em and head-to-head history.
• No spoilers in VODs, in English or Spanish (ES | EN button).

Free, no accounts, no betting. Not endorsed by Riot Games. League of Legends and Riot Games are trademarks of Riot Games, Inc.

**Categoría / Category:** Deportes / Sports  ·  **Idiomas / Languages:** Español, English

## Pestaña «Prácticas de privacidad»

**Propósito único:** mostrar, sobre el video de partidos del Mundial de League of Legends en Twitch y lolesports, la probabilidad de victoria en vivo y la información del partido, y un panel lateral con la app de RiftPulse.

**Justificación de permisos:**
- `sidePanel`: abrir el panel lateral con la app de RiftPulse.
- `storage`: guardar en tu navegador tus preferencias y el partido que estás viendo, para que el panel siga el mismo juego.
- Acceso a `twitch.tv` y `lolesports.com`: dibujar el overlay sobre el video del partido y leer en tu computadora el reloj y el marcador de la imagen para sincronizarse.
- Acceso a `esports-api.lolesports.com`, `feed.lolesports.com`, `static.lolesports.com` y `ddragon.leagueoflegends.com`: traer los datos públicos del partido y las imágenes de campeones e ítems.

**¿Usa código remoto?** No. Todo el código de la extensión va dentro del paquete. El panel lateral muestra una página web (la app de RiftPulse en GitHub Pages).

**Datos del usuario:** no recopila ni transmite datos personales, de cuenta, de navegación ni de ningún otro tipo. La lectura del video ocurre en tu computadora y no se envía ninguna imagen. Marcá todas las casillas de «no recopila» y las tres declaraciones de cumplimiento.

## Capturas (1280 × 800) y promocionales
En `es/` y `en/`, las mismas piezas en cada idioma:
- `1-en-vivo.png`: la barra de probabilidad.
- `2-sincronia.png`: lee el reloj y el marcador del video.
- `3-pelea.png`: la pelea en equipo explicada.
- `4-pausa.png`: el resumen durante una pausa.
- `5-panel.png`: el panel lateral («Ahora» y el Mundial).
- `promo-440x280.png` (mosaico pequeño) y `promo-1400x560.png` (marquesina).
- `icon128.png`: ícono de la tienda (128 × 128), el mismo para los dos idiomas.

Son la interfaz real funcionando con el simulador de las pruebas, sobre videos generados (ninguna imagen de una transmisión). Se regeneran con `node pruebas/ficha-tienda.js`.

## Publicar una versión nueva (lo hace el flujo «Publicar en la Chrome Web Store»)
Con los secretos cargados una vez (ver el comentario al principio de `.github/workflows/tienda.yml`), cada versión nueva se sube y se manda a revisión desde *Actions → Publicar en la Chrome Web Store → Run workflow*, sin entrar a la consola.
