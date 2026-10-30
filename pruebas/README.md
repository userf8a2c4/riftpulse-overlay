# Pruebas de RiftPulse

Un solo comando, desde la raíz del repo:

```bash
node pruebas/todas.js
```

Para correr una sola:

```bash
node pruebas/todas.js t_feed
```

**Requisitos:** Node, Playwright con Chromium, y Python 3 con Pillow y ffmpeg (para generar los videos de prueba la primera vez).

## Las 11 baterías

| Prueba | Qué comprueba |
|---|---|
| `t_sincronia` | La extensión sobre un VOD: reconoce el partido, nunca salta a un señuelo y el minuto no se aleja más de 1 s del reloj real. Lo hace aun con lecturas falseadas a propósito, una repetición sin marcador, el cambio de juego, un salto y una pausa |
| `t_feed` | Una pieza de OBS con el feed caído, de vuelta y congelado; `?delay`; el control y la mesa |
| `t_extension` | La extensión real, instalada desde el ZIP publicado: la versión manual (con y sin «Permitir scripts de usuario») y la de la Chrome Web Store. Sincroniza, el panel sigue el mismo juego y los dos muestran el mismo porcentaje |
| `t_legibilidad` | Ningún texto por debajo de 12 px en la app, la mesa, el control, la página y «Cómo funciona» |
| `t_simulador` | El simulador de «Cómo funciona» da lo mismo que el motor, y la página no se desborda en celular |
| `t_contraste` | Contraste WCAG de los colores de equipo sobre el grafito, y que los dos equipos siempre se distingan |
| `t_director` | El director automático: qué pieza muestra y cuándo, la pelea en equipo 5v5 (y que un 2v2 no cuenta), los atajos y el control |
| `t_magia` | El overlay que «lee la sala»: se oculta sin el juego en pantalla, no muestra clips de otro partido en vivo, desaparece al terminar el juego, y la línea de tiempo salta el VOD |
| `t_historia` | La historia del juego, qué cambió, qué mirar, niveles, visión e ítems (solo si el feed los trae) y la banda de confianza |
| `t_app` | La app: «Ahora», Mis equipos, sin spoilers, la fase suiza, las tarjetas para compartir, las predicciones del staff y el marcador de la serie al instante |
| `t_espectador` | «Tu pronóstico» contra RiftPulse, «Para entender», la app instalable y la bienvenida de la extensión |

## Herramientas

| Script | Qué genera |
|---|---|
| `generar.py` | Los videos de prueba con un HUD dibujado a mano (en `pruebas/.gen/`, que no se sube) |
| `mocks.js` | El simulador del feed de LoL Esports, de Data Dragon, de Twitch y de la página publicada |
| `imagenes.js` | Las imágenes del README y de la wiki (`docs/img/`) |
| `captura-extension.js` | Las 5 capturas de la Chrome Web Store (`docs/chrome-web-store/`) |
| `promo.js` | Las imágenes promocionales de la tienda |
| `gif.js` | El GIF del README (`docs/img/demo.gif`) |
| `capturas.js` | Capturas sueltas de las páginas, para revisar el diseño |
| `sondeo.js` | El sondeo del feed real (corre en GitHub Actions) |
| `real.js` | El overlay sobre un tramo real de la transmisión (acción «Probar con video real») |

Todo es simulado: el feed de LoL Esports, Data Dragon, Twitch y la página publicada (se sirve esta carpeta). Los videos se dibujan con una tipografía libre (Saira Condensed, licencia OFL, en `fixtures/`), sin imágenes de la transmisión oficial.
