# Al aire sin sorpresas

Todo lo que hay que saber para usar RiftPulse en una transmisión en vivo sin que nada te tome por sorpresa.

## Si el feed de LoL Esports falla
RiftPulse usa el feed público de LoL Esports. No es oficial para terceros: puede retrasarse, cambiar o caerse sin aviso. Por eso **nunca deja la pantalla vacía ni muestra un error**: mantiene la última predicción y avisa con una insignia discreta.

| Estado | Qué ves | Qué pasa |
|---|---|---|
| **Datos al día** | nada extra | todo normal |
| **Datos retrasados · N s** | insignia de aviso | hace más de 25 s (configurable con `?stale=`) que no llegan datos nuevos; se mantiene el último número |
| **Sin datos nuevos** | insignia roja | el feed falla aunque se reintente; se mantiene el último número |
| **Juego en pausa** | insignia de aviso | pausa técnica del juego |
| **Esperando partido** | las piezas de juego se ocultan | no hay partido en vivo; nunca se inventan números |
| **DEMO** | insignia DEMO | modo `?demo`: un partido ya jugado, nunca confundible con el vivo |

Cuando el feed vuelve, la insignia se va sola. El **control de producción** y la **mesa de análisis** muestran el mismo estado.

## Delay (retraso frente al stream)
Cada co-stream tiene su retraso. Si una kill aparece en el overlay antes que en el video, subí el retraso; si aparece después, bajalo.
- En la URL: `?delay=42` (segundos).
- En el **control de producción**: botones −10, −5, −1, +1, +5 y +10, con el valor actual a la vista.
- Queda guardado: OBS lo recuerda la próxima vez.
- La **mesa de análisis** muestra el «retraso aplicado», para saber con qué momento del juego está hablando el desk.

La **extensión para espectadores** no necesita esto: lee el reloj del video y se sincroniza sola (ver [Extensión para espectadores](Extensión-para-espectadores)).

## Control y overlay: misma URL de origen
El control y las piezas se hablan dentro del navegador de OBS. Para que funcione, **tienen que venir del mismo lugar**: `https://userf8a2c4.github.io/riftpulse-overlay/…`. No mezcles archivos locales (`file://`) ni `localhost` con la página publicada. En el control, «Piezas abiertas en OBS» muestra cuáles responden; si dice «ninguna», revisá esto.

## Botón de emergencia
**🚨 Ocultar todo** en el control esconde todas las piezas al instante. El mismo botón las vuelve a mostrar.

## Lista de chequeo antes de salir al aire
- [ ] La barra en OBS, a 1920 × 1080, con fondo transparente.
- [ ] El control como **Dock de navegador**, desde la misma URL de origen. En «Piezas abiertas en OBS» aparecen tus piezas.
- [ ] Delay calibrado con una kill.
- [ ] Alerta de prueba: se ve y se va sola.
- [ ] Ocultar y mostrar: funciona.
- [ ] Resumen forzado desde el control y cortado con «Cortar el resumen».
- [ ] **Ninguna escena de aire con `?demo`.**
- [ ] Si usás predicciones del stream: integrantes y picks cargados («Aplicado ✓» sin errores).
