# RiftPulse como Extensión de Twitch

Con la extensión, **todo tu chat ve RiftPulse sobre tu stream sin instalar nada**: en la web, en el celular y en la app de TV.
Vos la activás una vez en tu canal. Es la misma barra y el mismo director de OBS (por defecto, el **mínimo**: la barra y
las peleas 5v5 que importan).

El paquete listo para subir es **`descargas/riftpulse-twitch.zip`** (lo lo arma `python3 fuente/construir_extension.py`).

## Publicarla (una sola vez, la hace el dueño del proyecto)
1. Entrá a **dev.twitch.tv/console** con tu cuenta de Twitch → **Extensiones → Crear extensión**. Nombre: *RiftPulse*.
2. Tipo: **Superposición de video** (*Video – Fullscreen*).
3. En **Configuración de activos**:
   - **Ruta del visor de superposición de video:** `viewer.html`
   - **Ruta de configuración:** `config.html`
   - **Configuración de la extensión:** *Servicio de configuración de extensiones* (la guarda Twitch; no hace falta servidor).
4. En **Capacidades → URLs permitidas para la API** (`connect-src`), agregá:
   - `https://esports-api.lolesports.com`
   - `https://feed.lolesports.com`
   - `https://ddragon.leagueoflegends.com`
5. **Archivos → Subir versión:** `riftpulse-twitch.zip`.
6. Probala en **Prueba local / alojada** en tu canal; después **Enviar a revisión**. Twitch revisa las extensiones a mano
   (puede tardar varios días); mientras tanto la pueden usar los canales que agregues como probadores.

## Para el streamer
**Extensiones** de tu canal → busca *RiftPulse* → **Instalar → Configurar** (elegís qué se ve y, si querés, tu retraso)
→ **Activar como superposición**.

## Qué tener en cuenta
- Sin apuestas: solo el pronóstico del modelo. Revisá las reglas de Twitch para extensiones y las de Riot para co-streams.
- El feed de lolesports no es oficial: si cambia, la extensión se actualiza subiendo una versión nueva del ZIP.
- La votación del chat (`canal=` en OBS) no va en la extensión: Twitch ya tiene sus propias predicciones; la de RiftPulse
  vive en la fuente de OBS.
