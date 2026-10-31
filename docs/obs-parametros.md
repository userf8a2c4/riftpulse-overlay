# Parámetros de la URL de OBS

La referencia única de la fuente de navegador de RiftPulse. La base es siempre:

```
https://userf8a2c4.github.io/riftpulse-overlay/overlay.html
```

En OBS: **Fuentes → + → Navegador**, pegá la URL, **1920 × 1080**. El fondo es transparente.
La forma más fácil de armarla es el generador: en la [página para streamers](https://userf8a2c4.github.io/riftpulse-overlay/#stream) o en el [control de producción](https://userf8a2c4.github.io/riftpulse-overlay/control.html) (bloque «URL para OBS»).

## URLs listas

| Para qué | URL (después de `overlay.html`) |
|---|---|
| **Mínimo radical** (co-stream): la barra sola y transparente, solo aparece la pelea 5v5 que importa; al terminar el juego se va sola | `?modo=minimo` |
| **Estándar** (recomendado): la barra y, en cada momento, la pieza que aporta | `?view=auto` |
| **Show**: más piezas (oro, duelos, historia cada ~4 min) | `?view=auto&director=show` |
| Solo la barra, sin piezas | `?view=bar` |
| Predicciones del stream | `?view=predicciones` |

## Todos los parámetros

| Parámetro | Valores | Qué hace |
|---|---|---|
| `modo` | `minimo` | El mínimo radical (equivale a `view=auto&director=minimo`, sin alertas ni la serie entre juegos). |
| `view` | `auto` · `bar` · `big` · `keys` · `objectives` · `duelos` · `remontada` · `recap` · `serie` · `alert` · `cuadro` · `predicciones` | La pieza. `auto` = barra + director automático. |
| `director` | `minimo` · `estandar` · `show` | Cuántas piezas muestra el director (`auto`). Mínimo: solo peleas 5v5. Estándar: objetivos que pesan, peleas que importan, «para remontar» y el resumen. Show: además oro, duelos e historia. Siempre con un respiro de 20 s entre piezas. |
| `pos` | `bottom` (por defecto) · `top` | Dónde va la barra. |
| `scale` | `0.6` – `2.4` | Tamaño (1 = normal). |
| `modules` | `prob,pregame,momentum,timers,brand` | Qué lleva la barra (separados por coma). |
| `tema` | `equipos` (por defecto) · `canal` · `minimal` | Colores de cada equipo, el color de tu canal (con `accent`) o plano sin marca. |
| `accent` | color hex sin `#`, por ejemplo `ff8800` | Color de acento (con `tema=canal`). |
| `logo` | `https://…` | Tu logo en lugar del de RiftPulse. |
| `brand` | `0` | Sin la marca de RiftPulse. |
| `safe` | `1` | Márgenes amplios (zona segura de televisión). |
| `stage` | `tr` | Las piezas grandes arriba a la derecha. |
| `listo` | `0` · `1` | Mostrar unos segundos «RiftPulse listo» al abrir (por defecto, solo dentro de OBS). |
| `delay` | segundos, por ejemplo `42` | Tu retraso frente a la transmisión oficial (queda recordado). |
| `demo` | (sin valor) | Un juego real ya jugado, acelerado, para probar la escena sin partido en vivo. |

El **retraso** también se ajusta desde el [control](https://userf8a2c4.github.io/riftpulse-overlay/control.html) (o se calcula solo).

## Atajos de teclado (en la fuente de OBS o en el control)
`1`–`9`: pedir una pieza a mano (15 s) · `0` / `Esc`: sacarla · `R`: retenerla 30 s · `H` en el control: ocultar todo.
