# Registro de decisiones · Web App de Apps Script

Backend que recibe las recomendaciones aceptadas en el panel **Diagnóstico** del
Centro de Documentación y las registra en los cuatro documentos del proyecto.

## Los cuatro destinos

| | Archivo | Tipo real en Drive | API |
|---|---|---|---|
| D1 | 1_PLAN_GESTIÓN_DE_ALCANCE_UNMSM | Documento de Google | `DocumentApp` |
| D2 | 2_PLAN DE GESTIÓN DEL CRONOGRAMA (GANTT) | Hoja de Google | `SpreadsheetApp` |
| D3 | 3_BITÁCORA DE LA IMPLEMENTACIÓN | **`.xlsx` subido** | `SpreadsheetApp`, previa conversión |
| D4 | 4_REVISIÓN_INTERNA DE_AVANCES | Hoja de Google | `SpreadsheetApp` |

> **D3 requiere un paso extra.** El archivo está en Drive como `.xlsx` de Excel,
> no como Hoja de Google. `SpreadsheetApp.openById()` no puede abrirlo y lanza
> excepción. Ejecute `convertirBitacora()` una vez (ver abajo).

En D1 el registro es una **tabla al final del documento**, delimitada por un
marcador invisible. En D2, D3 y D4 es una **pestaña propia** llamada
`Decisiones GxP`: el script nunca escribe en las pestañas de datos del proyecto.

## Instalación

1. **Cree el proyecto.** [script.google.com](https://script.google.com) → *Nuevo proyecto*.
   Pegue `Codigo.gs` en el editor.

2. **Active la Drive API.** Panel izquierdo → *Servicios* → **Drive API**, versión
   **v3**, identificador `Drive`. Sólo la necesita `convertirBitacora()`.

3. **Convierta la bitácora.** Seleccione `convertirBitacora` en el desplegable de
   funciones y pulse *Ejecutar*. Autorice los permisos. En el registro aparecerá
   el ID de la copia nativa, que queda guardado en las propiedades del script.
   El original `.xlsx` no se toca.

4. **Compruebe los destinos.** Ejecute `inicializarDestinos()`: crea la tabla y las
   pestañas en los cuatro archivos y deja en el registro el estado de cada uno.

5. **Publique la Web App.** *Implementar* → *Nueva implementación* → tipo
   **Aplicación web**.
   - *Ejecutar como:* **Yo** — el script escribe con sus permisos, así los usuarios
     de la web no necesitan acceso de edición a los documentos.
   - *Quién tiene acceso:* **Cualquier usuario**.

   Copie la URL que termina en `/exec`.

6. **Conecte el frontend.** En `index.html`, línea ~714:

   ```html
   <script>window.GXP_ENDPOINT = 'https://script.google.com/macros/s/AKfy…/exec';</script>
   ```

7. **Verifique.** Abra la URL `/exec` en el navegador: `doGet` devuelve el estado
   de los cuatro destinos con su nombre, su MIME y si son escribibles.

> Cada vez que modifique el código debe crear una **nueva versión** de la
> implementación para que los cambios entren en producción.

## Cómo se estructura el envío a varios IDs

El cliente **no sabe** cuántos documentos hay. Envía una sola petición con la
decisión y la lista de documentos que el hallazgo afecta; el servidor decide el
resto. Tres piezas lo hacen posible:

**1 · `DESTINOS` — declaración, no código.** Cada archivo es un objeto con
`clave`, `tipo`, `id` y `activo`. Añadir un quinto documento es añadir una línea.
Desactivar uno temporalmente es `activo: false`, sin borrar nada.

**2 · `ESCRITORES` — un traductor por tipo.** Asocia `tipo` con las tres funciones
que saben operar sobre él (`escribir`, `eliminar`, `leer`). El orquestador nunca
pregunta «¿esto es un Doc o una Hoja?»: pide `ESCRITORES[destino.tipo]` y usa lo
que reciba. Soportar Presentaciones sería añadir una entrada `pres`.

**3 · `porCadaDestino()` — aislamiento de fallos.** Recorre los destinos y captura
la excepción de cada uno por separado. Si D3 no está convertido, D1, D2 y D4 se
escriben igual y la respuesta lo dice:

```json
{ "ok": false, "codigo": "D1-02-R1",
  "resultados": [
    { "destino": "D1", "ok": true,  "detalle": { "accion": "insertada", "fila": 4 } },
    { "destino": "D2", "ok": true,  "detalle": { "accion": "actualizada", "fila": 7 } },
    { "destino": "D3", "ok": false, "error": "No es una Hoja de Google…" } ] }
```

`ok` global es `true` sólo si **todos** los destinos se escribieron. Un registro
parcial nunca se reporta como éxito.

### A qué documentos va cada decisión

Lo gobierna la constante `MODO_DESTINO`:

- **`'afectados'`** (por defecto) — la decisión va a **D1**, que actúa como libro
  maestro de todas las decisiones, y además a los documentos que el hallazgo
  afecta según su campo `d`. Una decisión sobre `D1-02` (que afecta a D1 y D2)
  se escribe en el Plan de Alcance y en el Cronograma, no en la Bitácora.
- **`'todos'`** — la decisión se escribe en los cuatro documentos.

### Idempotencia

La escritura es **UPSERT por código**, nunca `append` ciego: se busca el código en
la primera columna y, si existe, se actualiza esa fila. Consecuencias prácticas:

- Reenviar la misma decisión no duplica filas.
- El reintento automático del cliente tras un fallo de red es seguro.
- Editar una recomendación ya aceptada actualiza la fila existente.

Toda la operación va dentro de un único `LockService`, de modo que dos personas
aceptando a la vez no pueden crear dos veces la misma tabla o la misma pestaña.

## Protocolo

Petición `POST` con `Content-Type: text/plain;charset=utf-8` — **es
deliberado**: Apps Script no responde a las peticiones `OPTIONS` de verificación
previa, así que `application/json` haría fallar la petición por CORS.

```jsonc
// accion: 'decision'
{ "accion": "decision",
  "codigo": "D1-02-R1",
  "severidad": "alto",
  "titulo": "«Automatización» está excluida del alcance pero…",
  "recomendacion": "Texto definitivo, original o editado por el equipo.",
  "editada": true,
  "destinos": ["D1", "D2"],
  "fecha": "26/08/2026, 09:19 p. m." }
```

| Acción | Efecto |
|---|---|
| `ping` | Estado de los cuatro destinos. Igual que `doGet`. |
| `decision` | Inserta o actualiza la decisión en los destinos que correspondan. |
| `eliminar` | Retira la decisión de **todos** los destinos activos. |
| `listar` | Devuelve lo registrado en D1, para rehidratar la interfaz. |

## Comportamiento sin conexión

El frontend guarda cada decisión en `localStorage` **antes** de enviarla. Si la
red falla, la decisión queda en una cola y se muestra `⚠ No se pudo registrar`;
al recuperarse la conexión (evento `online` o recarga de la página) se reintenta
sola y el sello pasa a `✓ Registrada`. Ninguna aceptación se pierde por un fallo
de red.

## Pruebas sin tocar los documentos reales

El endpoint se puede sobrescribir desde la consola del navegador sin editar
`index.html`:

```js
localStorage.setItem('gxp.endpoint', 'https://…/exec');   // apuntar a un despliegue de prueba
localStorage.removeItem('gxp.decisiones.v1');             // borrar las decisiones locales
```
