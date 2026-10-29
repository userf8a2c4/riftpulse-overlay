# Paquete de gráficos

La forma más simple es **una sola URL**: `overlay.html?view=auto`. Es el **[director automático](Director-automático)**: muestra siempre la barra y, en cada momento, la pieza que aporta. Si preferís armar tus escenas a mano, cada pieza también es su propia URL con `?view=`.

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/overlay-en-transmision.jpg" width="720" alt="Overlay sobre una transmisión"><br><sub>El director: la barra, la alerta de giro y el impacto del próximo dragón (partido de ejemplo con datos simulados).</sub></p>

Todo usa el estilo **[«Colores de cada equipo»](Estilo-y-colores-de-equipo)**: fondo grafito y los colores reales de los dos equipos del partido.

| Vista | URL | Qué es |
|---|---|---|
| `auto` | `overlay.html?view=auto` | **Recomendado.** El [director automático](Director-automático): la barra y, en cada momento, una sola pieza grande |
| `bar` | `overlay.html` (por defecto) | Lower-third con la probabilidad en vivo |
| `big` | `overlay.html?view=big` | Tarjeta grande con la probabilidad (esquina) |
| `alert` | `overlay.html?view=alert` | Solo la alerta de momentum a pantalla |
| `objectives` | `overlay.html?view=objectives` | Bug de timers de objetivos |
| `keys` | `overlay.html?view=keys` | Claves del momento (los factores top) |
| `serie` | `overlay.html?view=serie` | Franja de la serie: probabilidad ahora y si gana cada equipo este juego |
| `duelos` | `overlay.html?view=duelos` | Duelos por línea (oro) y jugador clave |
| `remontada` | `overlay.html?view=remontada` | Qué necesita el que va abajo para volver al 50 %. **Aparece sola** cuando un equipo pasa del 65 % y se va recién cuando baja del 60 % (sin parpadeo) |
| `recap` | `overlay.html?view=recap` | Resumen del juego. **Aparece solo** 20 s al terminar cada juego (se corta desde el control y no vuelve en ese juego) |
| `predicciones` | `overlay.html?view=predicciones` | **Predicciones del stream**: los picks de cada integrante para un día o una fase completa, con foto, aciertos automáticos y marcador. Se cargan desde el [Control de producción](Control-de-producción) |
| `cuadro` | `overlay.html?view=cuadro` | Cuadro de eliminatorias del Mundial en vivo (cuartos → semis → final): marcador de cada serie, la que se está jugando y quién puede llegar a cada llave |

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/piezas-casters.png" width="640" alt="Piezas serie, remontada, duelos, historia y resumen"><br><sub>serie · para remontar · duelos · la historia del juego · resumen (datos simulados)</sub></p>

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/cuadro.png" width="520" alt="Cuadro de eliminatorias"> <img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/predicciones.png" width="620" alt="Predicciones del stream"><br><sub>cuadro · predicciones (datos de ejemplo)</sub></p>

## Cómo usarlas
- Cada vista es un **Browser Source** aparte (1920 × 1080, transparente).
- Ponlas en escenas distintas y conmuta según el momento de la transmisión.
- En la **página** hay botones que copian la URL de cada vista con un clic.

## Parámetros de la URL

| Parámetro | Qué hace |
|---|---|
| `?view=` | `auto` · `bar` (por defecto) · `big` · `alert` · `objectives` · `keys` · `serie` · `duelos` · `remontada` · `recap` · `cuadro` · `predicciones` |
| `?director=` | con `view=auto`: `minimo` (la barra y las alertas de giro), `estandar` (por defecto) o `show` (además el oro, los duelos y la historia de vez en cuando) |
| `?tema=` | `equipos` (por defecto: los colores de cada equipo), `canal` (la barra en el color del canal, con `&accent=`) o `minimal` (plano, sin marca ni sombras) |
| `?stage=` | con `view=auto`: dónde va la pieza grande, `tl` (arriba a la izquierda, por defecto) o `tr` (arriba a la derecha) |
| `?pos=` | `bottom` (por defecto) o `top` (vista `bar`) |
| `?scale=` | tamaño, p. ej. `1.2` (de 0.6 a 2.4) |
| `?modules=` | qué muestra la barra: `prob,pregame,momentum,timers,brand` |
| `?demo` | reproduce un **partido real del Mundial ya jugado**, acelerado (×8; `?demo=4` para ×4). Siempre lleva la insignia **DEMO**: no se confunde con el vivo |
| `?delay=` | tu retraso frente al feed, en segundos (p. ej. `42`). Queda guardado. Ver [Al aire sin sorpresas](Al-aire-sin-sorpresas) |
| `?accent=` | color de señal sin `#` (p. ej. `ff8800`). Por defecto, el verde lima de RiftPulse. Con `&tema=canal`, también pinta la barra |
| `?logo=` | URL `https://` de tu logo, en lugar del de RiftPulse |
| `?brand=0` | sin marca ni precisión en la barra |
| `?safe=1` | márgenes amplios para no chocar con los elementos de Twitch o Kick |
| `?stale=` | segundos sin datos nuevos para avisar «Datos retrasados» (por defecto `25`) |

### Escenas listas (presets)
| Para | URL |
|---|---|
| **Todo en una (director)** | `overlay.html?view=auto` |
| Solo la barra (lower-third) | `overlay.html?view=bar&modules=prob,timers,brand&pos=bottom` |
| Alertas de giro (escena aparte) | `overlay.html?view=alert` |
| Entre mapas: la serie | `overlay.html?view=serie` |
| Cierre de juego | `overlay.html?view=recap` |
| Predicciones del stream | `overlay.html?view=predicciones` |
| Cuadro del Mundial | `overlay.html?view=cuadro` |

Todas se copian con un clic desde la [página](https://userf8a2c4.github.io/riftpulse-overlay/) y desde **Mando** en el panel de la extensión.

### Escena de OBS lista
En la [página](https://userf8a2c4.github.io/riftpulse-overlay/), **⬇ Descargar escena de OBS** baja una colección de escenas (OBS 28+, **Colección de escenas → Importar**) con el director ya puesto y, ocultas, las predicciones del stream y el cuadro del Mundial para prenderlas con un clic. El [control](Control-de-producción) se suma como dock: **Docks → Docks de navegador personalizados**.

### Alertas automáticas
- **Alerta de giro:** cuando la probabilidad se mueve **12 puntos o más en ~40 s**. Muestra el equipo, los puntos y la causa (Barón, dragón, inhibidor). En el director sale aunque haya una pieza grande en pantalla.
- **Serie:** los mapas que faltan se estiman con la **fuerza de cada equipo (Elo)**; la pieza dice qué método usó. No es certeza.

Se pueden mezclar: `overlay.html?view=bar&pos=top&scale=1.1`. Sin parámetros, ya funciona.

Las piezas automáticas (`remontada` y `recap`) se apagan o se fuerzan desde el [Control de producción](Control-de-producción).

> Todas las vistas usan el **modelo en vivo**. La serie y la previa usan además la **fuerza de cada equipo (Elo)**.
