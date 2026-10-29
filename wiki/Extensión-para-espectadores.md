# Extensión para espectadores

La extensión pone RiftPulse **encima del video** de Twitch o de lolesports.com (solo lo ves vos) y suma un **panel lateral** con toda la app y el centro de mando.

## Instalar (una sola vez)

1. Bajá el **[ZIP de la extensión](https://userf8a2c4.github.io/riftpulse-overlay/riftpulse-extension.zip)** y descomprimilo.
2. Abrí `chrome://extensions` (o `brave://extensions` / `edge://extensions`) y activá el **Modo de desarrollador**.
3. Si ya tenías RiftPulse, tocá **Quitar** en la vieja.
4. **Cargar descomprimida** → elegí la carpeta `extension`.
5. En RiftPulse → **Detalles**, activá **«Permitir scripts de usuario»**. Con eso el overlay se actualiza solo desde la web.

Desde ahí no hay nada que descargar: el panel siempre abre la última versión, y el overlay se renueva al tocar ↻ en la extensión, al abrir el navegador y cada 6 horas.

## Sincronía automática con el video

Con **auto-sync** encendido (viene así), el overlay **lee el video**: el reloj del juego, las siglas de los equipos, las kills, el oro y los campeones en pantalla. Con eso:

- **reconoce el partido y el juego de la serie**, aunque sea un VOD de otro día del Mundial;
- **se ata al minuto exacto** de lo que estás viendo: sigue la pausa, la velocidad, los saltos hacia adelante o atrás y los cortes de carga;
- mientras reconoce, la barra dice **«Sincronizando con el video…»**: nunca muestra otro partido;
- al reconocerlo, un aviso de 3 s lo confirma: **«Sincronizado · IG vs LYON · juego 2 · 17:42»**, en los colores de los equipos.

El lector funciona dentro del navegador, sin servicios externos, y no envía imágenes a ningún lado.

El **panel lateral** sigue lo mismo que tu video: arriba dice *Sincronizado con tu video* y el centro de mando usa ese juego y ese minuto. Si preferís mirar otra cosa en el panel, apagá **📺 Seguir el video** en Mando.

### Si no sincroniza

En la barra del overlay, pasá el mouse y tocá **?**. Aparece el **diagnóstico**: qué reloj leyó, qué siglas, el marcador, qué partido reconoció y la calidad del video. Con una captura de ese cuadro se sabe exactamente qué pasa.

## La barra lee la sala
- **Sin reloj a la vista** durante más de 12 s (el desk, una pausa, una entrevista), la barra se **contrae** a una pastilla con la última probabilidad. Vuelve sola cuando reaparece el juego.
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

Debajo de la barra podés sumar paneles, desde los chips del overlay o desde **Mando → Overlay en el stream**:

| Panel | Qué muestra |
|---|---|
| **Gráfico de oro** | La diferencia de oro de todo el juego, con dragones, Barones e inhibidores marcados |
| **Impacto y remontada** | Cuánto movería la probabilidad el próximo objetivo para cada equipo, y qué necesita el que va abajo |
| **Duelos por línea** | Cada jugador contra su rival directo, con la diferencia de oro |
| **Daño de los 10** | El porcentaje del daño a campeones de cada jugador en su equipo |

Además, en la barra: **próximo objetivo**, **trayectoria** y el **reparto de daño** que aparece solo después de cada pelea.

### Paneles automáticos
Sin tocar nada, el overlay suma solo el panel que aporta: el impacto del objetivo el minuto previo, el resumen al terminar y, en nivel Show, el oro y los duelos. Se elige el nivel en **Mando → Paneles automáticos** (Mínimo, Estándar o Show) y **⏭ Saltar panel** quita el que está.
