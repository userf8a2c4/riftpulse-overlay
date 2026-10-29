# Publicar RiftPulse en la Chrome Web Store

Todo lo que pide la tienda ya está listo; solo falta subirlo con tu cuenta.

## Lo que hacés vos (una sola vez, ~20 minutos)
1. Entrá a la [consola de desarrolladores de Chrome Web Store](https://chrome.google.com/webstore/devconsole) con tu cuenta de Google y pagá la inscripción única (5 USD).
2. **Nuevo elemento** → subí `riftpulse-extension-tienda.zip` (está en la raíz de este repositorio y en la página: `https://userf8a2c4.github.io/riftpulse-overlay/riftpulse-extension-tienda.zip`).
3. Copiá los textos de abajo en cada campo, subí las tres capturas de esta carpeta y el ícono `extension/icon128.png`.
4. **Enviar para revisión.** Suele tardar de 1 a 3 días.

Después, cada versión nueva se sube igual (otro ZIP con la versión mayor) y les llega sola a todos los que la instalaron.

> **Por qué es otro ZIP:** la tienda no acepta extensiones que bajen su código de la web, que es lo que hace la versión de instalación manual con «Permitir scripts de usuario». En la versión de la tienda, el overlay viaja dentro del paquete y el panel lateral sigue abriendo la app desde la web (eso sí está permitido: es una página, no código de la extensión). Quien ya tiene la versión manual puede seguir usándola.

## Textos de la ficha

**Nombre:** RiftPulse — pronóstico en vivo del Mundial de LoL

**Descripción breve (máx. 132):**
Probabilidad en vivo del Mundial de LoL sobre el video de Twitch y lolesports, sincronizada sola con el minuto que ves.

**Categoría:** Deportes (o Entretenimiento)  ·  **Idioma:** Español

**Descripción:**
RiftPulse pone sobre el video del Mundial de League of Legends la probabilidad de victoria de cada equipo, en vivo y en sus colores.

• Se sincroniza solo: lee el reloj y el marcador del video y muestra el minuto exacto que estás viendo, en vivo, en un VOD o en cualquier co-stream con su retraso.
• Te cuenta el juego: cómo arrancó, el giro clave, qué cambió en el último minuto y qué mirar ahora (el próximo dragón o Barón y cuánto vale para cada equipo).
• Honesto: muestra cuánto acierta el modelo en cada minuto (75 % al minuto 15, medido en 589 juegos que no vio).
• Línea de tiempo: en un VOD, tocá un momento clave y el video salta a ese instante.
• Sin spoilers: en un VOD tapa los resultados del partido que estás viendo y de los siguientes.
• Panel lateral con todo el Mundial: tu pronóstico contra el de RiftPulse, mis equipos, la fase suiza, las eliminatorias y el Pick'Em.

Es pronóstico y análisis, sin apuestas. No está avalado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.

## Pestaña «Prácticas de privacidad»

**Propósito único:** mostrar, sobre el video de partidos del Mundial de League of Legends en Twitch y lolesports, la probabilidad de victoria en vivo y la información del partido, y un panel lateral con la app de RiftPulse.

**Justificación de permisos:**
- `sidePanel`: abrir el panel lateral con la app de RiftPulse.
- `storage`: guardar en tu navegador tus preferencias y el partido que estás viendo, para que el panel siga el mismo juego.
- Acceso a `twitch.tv` y `lolesports.com`: dibujar el overlay sobre el video del partido y leer en tu computadora el reloj y el marcador de la imagen para sincronizarse.
- Acceso a `esports-api.lolesports.com`, `feed.lolesports.com`, `static.lolesports.com` y `ddragon.leagueoflegends.com`: traer los datos públicos del partido y las imágenes de campeones e ítems.

**¿Usa código remoto?** No. Todo el código de la extensión va dentro del paquete. El panel lateral muestra una página web (la app de RiftPulse en GitHub Pages).

**Datos del usuario:** no recopila ni transmite datos personales, de cuenta, de navegación ni de ningún otro tipo. La lectura del video ocurre en tu computadora y no se envía ninguna imagen. Marcá todas las casillas de «no recopila» y las tres declaraciones de cumplimiento.

## Capturas (1280 × 800)
- `1-overlay.png`: el overlay sobre el video (video de prueba generado, no es una transmisión real).
- `2-ahora.png`: la app en «Ahora».
- `3-mundial.png`: la fase suiza.
