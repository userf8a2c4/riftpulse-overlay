# Control de producción

Un panel para que producción controle el overlay **en vivo**, sin recargar: enciende/apaga módulos, cambia la posición y dispara alertas.

Página: `https://userf8a2c4.github.io/riftpulse-overlay/control.html`

## Cómo conectarlo (dentro de OBS)
El overlay y el control se sincronizan cuando **ambos corren en OBS** (comparten el mismo navegador interno):
1. Añade el **overlay** como *Browser Source* (ver [Instalación en OBS](Instalación-en-OBS)).
2. Añade el **control** como *Dock de navegador*: **Ver → Docks → Docks de navegador personalizados** → nombre "RiftPulse", URL del `control.html` → Aplicar.
3. El dock aparece dentro de OBS; lo que toques ahí cambia el overlay al instante.

## Qué controla
- **Módulos:** pronóstico, momentum, timers, marca (la probabilidad siempre va).
- **Posición:** arriba o abajo.
- **Ocultar / mostrar** el overlay.
- **⚡ Disparar alerta de prueba** — para ensayar antes del aire.

## Detalle técnico
La sincronía usa `BroadcastChannel` + `localStorage`: funciona entre pestañas/paneles del **mismo navegador y origen**, que es justo el caso dentro de OBS. No necesita servidor.
