# Paquete de gráficos

Más allá del lower-third, el overlay ofrece **varias piezas** que producción puede conmutar como escenas. Cada una es la misma URL con `?view=`:

| Vista | URL | Qué es |
|---|---|---|
| `bar` | `overlay.html` (por defecto) | Lower-third con la probabilidad en vivo |
| `big` | `overlay.html?view=big` | Tarjeta grande con la probabilidad (esquina) |
| `alert` | `overlay.html?view=alert` | Solo la alerta de momentum a pantalla |
| `objectives` | `overlay.html?view=objectives` | Bug de timers de objetivos |
| `keys` | `overlay.html?view=keys` | Claves del momento (los factores top) |

## Cómo usarlas
- Cada vista es un **Browser Source** aparte (1920 × 1080, transparente).
- Ponlas en escenas distintas y conmuta según el momento de la transmisión.
- En la **página** hay botones que copian la URL de cada vista con un clic.

## Combinar con parámetros
Se pueden mezclar: `overlay.html?view=bar&pos=top&scale=1.1`.

> Nota: todas las vistas usan el **modelo en vivo**. El pronóstico previo (Elo) y la tarjeta "lo predijimos" llegarán al portar el Elo al motor del overlay.
