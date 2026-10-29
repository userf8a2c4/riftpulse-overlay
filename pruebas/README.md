# Pruebas de RiftPulse

Un solo comando, desde la raíz del repo:

```
node pruebas/todas.js
```

Requisitos: Node, Playwright con Chromium, Python 3 con Pillow y ffmpeg (para generar los videos de prueba la primera vez).

| Prueba | Qué comprueba |
|---|---|
| `t_sincronia` | El overlay de la extensión sobre un VOD: reconoce el partido, nunca salta a un señuelo, el minuto no se aleja más de 1 s del reloj real (aun con lecturas falseadas a propósito, una repetición sin marcador, el cambio de juego, un salto y una pausa) |
| `t_feed` | Una pieza de OBS con el feed caído y congelado: mantiene la última predicción y avisa; `?delay`; el control (piezas abiertas, retraso, «Ocultar todo»); la mesa |
| `t_extension` | La extensión real instalada desde el ZIP publicado, con y sin «Permitir scripts de usuario»: sincroniza, el panel sigue el mismo juego, Mando con alturas fijas |
| `t_legibilidad` | Ningún texto por debajo de 12 px en la app, la mesa, el control, la landing y «Cómo funciona» |
| `t_simulador` | El simulador de «Cómo funciona» da lo mismo que el motor y la página no se desborda en celular |

Para correr una sola: `node pruebas/todas.js t_feed`.

Todo es simulado: el feed de LoL Esports, Data Dragon, Twitch y la página publicada (se sirve esta carpeta). Los videos se dibujan con una tipografía libre (Saira Condensed, licencia OFL, en `fixtures/`), sin imágenes de la transmisión oficial. Se generan en `pruebas/.gen/`, que no se sube.
