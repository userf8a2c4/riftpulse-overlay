<div align="center">

<img src="docs/img/banner.jpg" alt="RiftPulse: tu segunda pantalla del Mundial">

# RiftPulse

**Tu segunda pantalla del Mundial. El Mundial, jugada a jugada.**

Quién va ganando cada partida del Mundial de League of Legends, en vivo y en porcentaje: sobre el video que estás viendo, en tu stream de OBS o en el celular.

![Acierto](https://img.shields.io/badge/acierto-75%25%20al%20min%2015-22D3EE)
![Prueba](https://img.shields.io/badge/medido%20en-juegos%20que%20no%20vio-0EA5C6)
![Extensión](https://img.shields.io/badge/extensi%C3%B3n-Chrome%20%C2%B7%20Edge%20%C2%B7%20Brave-3D8BFF)
![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-en%20revisi%C3%B3n-F5B700)
![OBS](https://img.shields.io/badge/OBS-Browser%20Source-302E87)
![Sin apuestas](https://img.shields.io/badge/pron%C3%B3stico-sin%20apuestas-FF4655)

**[Instalar](https://userf8a2c4.github.io/riftpulse-overlay/instalar.html)** · **[App](https://userf8a2c4.github.io/riftpulse-overlay/app.html)** · **[Para streamers](https://userf8a2c4.github.io/riftpulse-overlay/)** · **[Cómo funciona](https://userf8a2c4.github.io/riftpulse-overlay/como-funciona.html)** · **[Wiki](https://github.com/userf8a2c4/riftpulse-overlay/wiki)**

</div>

> [!NOTE]
> **La extensión está en revisión en la Chrome Web Store.** Cuando Google la apruebe se va a instalar con un clic desde la tienda. Mientras tanto se instala a mano en 3 pasos ([ver abajo](#instalar)), con la misma extensión.

<p align="center"><img src="docs/chrome-web-store/1-overlay.png" alt="La extensión de RiftPulse sobre el video de un partido" width="860"></p>

## Tres formas de usarlo

| | Para quién | Qué ves | Cómo |
|---|---|---|---|
| 🖥 **Extensión** | Cualquier espectador | La probabilidad encima del video en Twitch o lolesports, **sincronizada sola con el minuto que ves** (en vivo, en un VOD o en un co-stream con retraso), y un panel lateral con todo el Mundial | [Instalar en 3 pasos](https://userf8a2c4.github.io/riftpulse-overlay/instalar.html#extension) |
| 📱 **App** | En el celu o en la compu | El partido en vivo, la fase suiza, las eliminatorias, tu pronóstico contra RiftPulse y el modo sin spoilers | [Abrir](https://userf8a2c4.github.io/riftpulse-overlay/app.html) (se puede instalar como app) |
| 🎥 **OBS** | Streamers y casters | El overlay sobre tu transmisión, que decide solo qué mostrar en cada momento | [Una URL en OBS](https://userf8a2c4.github.io/riftpulse-overlay/) |

<p align="center">
<img src="docs/chrome-web-store/2-panel.png" width="32%" alt="El video con el panel lateral">
<img src="docs/chrome-web-store/3-ahora.png" width="32%" alt="La app: el partido en vivo">
<img src="docs/chrome-web-store/5-mando.png" width="32%" alt="Mando: guion y predicciones del staff">
</p>

## Lo que hace

- **Como el HUD de la transmisión.** El equipo de la izquierda en azul y el de la derecha en rojo, igual que el marcador de Riot.
- **Solo cuando importa.** El overlay de la extensión aparece con el juego en pantalla y desaparece en las repeticiones, el desk, la publicidad y al terminar el juego.
- **Pelea en equipo, explicada.** Después de cada 5v5: quién la ganó, el oro, el objetivo que siguió y lo que hizo cada jugador en la pelea.
- **Qué mirar ahora.** Cuánto vale el próximo dragón o Barón para cada equipo, qué necesita el que va abajo para remontar y la historia del juego en pocas frases.
- **Director automático para OBS.** Una sola URL: la barra siempre y, en cada momento, la pieza que aporta, nunca dos a la vez.
- **Para el que comenta.** Guion listo para leer, mesa de análisis en una segunda pantalla y **predicciones del staff** con aciertos automáticos y su propia URL para OBS.
- **Honesto con sus números.** Muestra cuánto acierta en cada minuto, medido en juegos que el modelo no vio.

## Instalar

**Extensión (Chrome, Edge, Brave u Opera, en la compu):**
1. Descargá el [ZIP](https://userf8a2c4.github.io/riftpulse-overlay/riftpulse-extension.zip) y extraelo: queda la carpeta **RiftPulse**.
2. Abrí `chrome://extensions` y activá el **Modo de desarrollador**.
3. **Cargar descomprimida** → carpeta **RiftPulse**.

La guía con imágenes está en la [página Instalar](https://userf8a2c4.github.io/riftpulse-overlay/instalar.html). Cuando Google apruebe la versión de la Chrome Web Store (versión 0.9 beta, en revisión), este enlace va a llevar a la tienda.

**OBS:** en la [página para streamers](https://userf8a2c4.github.io/riftpulse-overlay/), tocá **📋 Copiar URL del overlay**. En OBS: **＋ Fuentes → Navegador** → pegá la URL → **1920 × 1080**.

## Precisión

Una regresión logística por minuto, entrenada con juegos profesionales 2025–26: oro, kills, torres, dragones, Barón, inhibidores, el draft y la fuerza de cada equipo.
- **75 % de acierto al minuto 15** y 84 % al 25, medido en 589 juegos que no vio.
- En octubre de 2026 se reentrenó con 4.805 juegos y se confirmó en 691 juegos nuevos de 2026: nivel, CS, wards e ítems no mejoran la predicción, así que el modelo se quedó como está.

El detalle está en [Cómo funciona](https://userf8a2c4.github.io/riftpulse-overlay/como-funciona.html) y en [Precisión y pruebas](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Precisión-y-pruebas).

## Estructura del repositorio

| Carpeta o archivo | Qué es |
|---|---|
| `index.html`, `instalar.html`, `como-funciona.html` | Las páginas: para streamers, instalar y cómo funciona |
| `app.html` | La app para fans (también es el panel lateral de la extensión) |
| `overlay.html` + `obs.js` | El overlay de OBS y todas sus piezas (`?view=`) |
| `analista.html`, `control.html` | La mesa de análisis y el control de producción |
| `engine.js` | El motor: datos en vivo, modelo, director, historia del juego y peleas en equipo |
| `ext-overlay.js`, `riftpulse-extension*.zip` | El overlay de la extensión y sus paquetes (manual y Chrome Web Store) |
| `rp-tokens.css`, `rp-design.css`, `rp-ui.js` | El sistema visual común |
| `docs/` | Imágenes de la documentación, la ficha y las imágenes de la Chrome Web Store, y la carta para casters |
| `modelo/` | Recolección de juegos reales y reentrenamiento del modelo |
| `pruebas/` | Pruebas automáticas, simulador del feed y generadores de imágenes |
| `wiki/` | El código fuente de la [wiki](https://github.com/userf8a2c4/riftpulse-overlay/wiki), que se publica sola |
| `.github/workflows/` | Acciones: publicar la wiki, sondear el feed real, probar con video real y reentrenar el modelo |

**Para desarrollar:**

```bash
node pruebas/todas.js
```

Corre las 11 baterías de pruebas, con un simulador del feed y videos generados.

```bash
node pruebas/imagenes.js
```

Regenera las imágenes de la documentación.

```bash
node pruebas/captura-extension.js
```

Regenera las capturas de la tienda.

> [!IMPORTANT]
> **Es pronóstico y análisis, no una casa de apuestas.** Las probabilidades son estimaciones de un modelo propio, no una certeza. RiftPulse no está avalado por Riot Games y no refleja las opiniones de Riot Games ni de nadie oficialmente involucrado en la producción o gestión de League of Legends. League of Legends y Riot Games son marcas de Riot Games, Inc. Usa los datos públicos de LoL Esports. Más en [Cumplimiento y datos](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Cumplimiento-y-datos).

<sub>Las imágenes usan partidos de ejemplo con datos simulados y videos de prueba generados, no transmisiones reales.</sub>

**VectisDev** · [@CaZe_18](https://x.com/CaZe_18)
