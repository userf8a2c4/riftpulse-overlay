# Paquete de gráficos

Más allá del lower-third, el overlay ofrece **varias piezas** que producción puede conmutar como escenas. Cada una es la misma URL con `?view=`:

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/overlay-en-transmision.jpg" width="720" alt="Overlay sobre una transmisión"><br><sub>Barra en vivo, claves del momento y alerta de giro (datos simulados).</sub></p>

| Vista | URL | Qué es |
|---|---|---|
| `bar` | `overlay.html` (por defecto) | Lower-third con la probabilidad en vivo |
| `big` | `overlay.html?view=big` | Tarjeta grande con la probabilidad (esquina) |
| `alert` | `overlay.html?view=alert` | Solo la alerta de momentum a pantalla |
| `objectives` | `overlay.html?view=objectives` | Bug de timers de objetivos |
| `keys` | `overlay.html?view=keys` | Claves del momento (los factores top) |
| `serie` | `overlay.html?view=serie` | Franja de la serie: probabilidad ahora y si gana cada equipo este juego |
| `duelos` | `overlay.html?view=duelos` | Duelos por línea (oro) y jugador clave |
| `remontada` | `overlay.html?view=remontada` | Qué necesita el que va abajo para volver al 50 %. **Aparece sola** cuando un equipo pasa del 65 % |
| `recap` | `overlay.html?view=recap` | Resumen del juego. **Aparece solo** ~25 s al terminar cada juego |

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/piezas-casters.png" width="480" alt="Piezas serie, remontada, duelos y resumen"><br><sub>serie · remontada · duelos · recap (datos simulados)</sub></p>

## Cómo usarlas
- Cada vista es un **Browser Source** aparte (1920 × 1080, transparente).
- Ponlas en escenas distintas y conmuta según el momento de la transmisión.
- En la **página** hay botones que copian la URL de cada vista con un clic.

## Parámetros de la URL

| Parámetro | Qué hace |
|---|---|
| `?view=` | `bar` (por defecto) · `big` · `alert` · `objectives` · `keys` · `serie` · `duelos` · `remontada` · `recap` |
| `?pos=` | `bottom` (por defecto) o `top` (vista `bar`) |
| `?scale=` | tamaño, p. ej. `1.2` (de 0.6 a 2.4) |
| `?modules=` | qué muestra la barra: `prob,pregame,momentum,timers,brand` |

Se pueden mezclar: `overlay.html?view=bar&pos=top&scale=1.1`. Sin parámetros, ya funciona.

Las piezas automáticas (`remontada` y `recap`) se apagan o se fuerzan desde el [Control de producción](Control-de-producción).

> Nota: todas las vistas usan el **modelo en vivo**. El pronóstico previo (Elo) y la tarjeta "lo predijimos" llegarán al portar el Elo al motor del overlay.
