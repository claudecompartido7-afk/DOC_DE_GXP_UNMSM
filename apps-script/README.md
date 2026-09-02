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

## Actualizar el backend · el paso que se olvida

Pegar el código nuevo en el editor **no cambia nada en producción**. Apps Script
sigue sirviendo la última *versión implementada* hasta que se crea una nueva.

1. Pegue el `Codigo.gs` actualizado y guarde (Ctrl+S).
2. **Implementar › Gestionar implementaciones**.
3. Pulse el lápiz **✏** de la implementación activa.
4. En **Versión** elija **Nueva versión**. Este es el paso decisivo.
5. **Implementar**.

La URL `/exec` no cambia: no hay que tocar `index.html`.

Para comprobarlo, abra la URL `/exec` en el navegador. La respuesta incluye:

```json
{"ok":true,"version":"2.1.0","acciones":["ping","decision","eliminar","listar","contenido","editar"], …}
```

Si no aparece `version` o falta `contenido` en `acciones`, la implementación
sigue siendo la antigua y el visor mostrará *«El Apps Script publicado está
desactualizado»* en lugar del documento con resaltado.

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


## Acceso al área interna

El Centro de Documentación es público. El diagnóstico —hallazgos,
contradicciones, avance por facultad y recomendaciones— no, y no está en el
repositorio: vive en `Datos.gs` y sólo se entrega tras validar credenciales.

Es la única forma de que la separación sea real. El sitio es estático: cualquier
archivo que forme parte de él es legible con «ver código fuente», con contraseña
o sin ella. Un control de acceso hecho en el navegador escondería un contenido
que ya viajó.

### Dar de alta a una persona

Desde el editor de Apps Script, en el desplegable de funciones, con la llamada
escrita en el propio editor:

```js
altaUsuario('nombre@unmsm.edu.pe', 'una-clave-de-8-o-mas', 'Nombre Apellido');
```

Borre la línea después de ejecutarla: el editor guarda el historial.

- `bajaUsuario('correo')` retira el acceso.
- `listarUsuarios()` escribe los correos registrados en el registro de ejecución.

Las contraseñas no se almacenan: se guarda su huella SHA-256 con una sal
distinta por persona. Quien lea las propiedades del script no puede deducirlas.

### Qué exige sesión

Sólo `ping` y `entrar` responden sin credenciales. Todo lo demás —leer el
diagnóstico, registrar decisiones, leer o editar los documentos— exige una ficha
de sesión válida, que dura diez horas.

### Actualizar los datos internos

`Datos.gs` se genera desde el repositorio; no se edita a mano. Cuando cambien los
hallazgos o los paneles hay que regenerarlo y volver a implementar el Apps
Script con una versión nueva.

## El tablero en vivo · `Tablero.gs`

`Dashboard.html` llevaba sus cifras incrustadas en el propio archivo: para que
la web reflejara una auditoría nueva había que regenerar el HTML y volver a
publicarlo. Con `Tablero.gs` las pide al servidor, y cada corrida de
`ejecutarAuditoriaAnexo1`, `ejecutarRevisionAnexo3` o `ejecutarRevisionAnexo4`
se ve en la portada sin tocar el repositorio.

### Instalación

1. Pegar `Tablero.gs` en **este mismo proyecto** —el que publica la aplicación
   web—, no en el proyecto enlazado a la hoja.
2. En `Codigo.gs`, dentro del **primer** `switch` de `doPost` (el de las
   acciones que no exigen credenciales), ya está añadida la línea:

   ```javascript
   case 'tablero':   return responder(tablero());
   ```

3. Volver a implementar con versión **«Nueva»**.
4. `probarTablero()` desde el editor dice qué hojas encuentra y qué cifras
   saca de cada una, sin pasar por la web.

### De qué hoja sale cada cifra

| Hoja del libro | Qué aporta al tablero |
|---|---|
| `RESUMEN_GENERAL` | % Anexo 1, % Anexo 3 y % general de cada facultad |
| `RESUMEN_EJECUTIVO_A1` | productos conformes, observados y sin registrar; nº de procesos |
| `RESUMEN_EJECUTIVO_A3` | fichas totales, completas, incompletas y sin producto |
| `DETALLADO_PRODUCTOS_A1` | detalle de productos de la vista de base de datos |
| `OBSERVACIONES_DE_PROCESO_A1` | detalle de procesos y subprocesos |
| `RESUMEN_FICHAS_A3` | detalle de fichas técnicas |
| `RESUMEN_EJECUTIVO_A4` | indicadores del Anexo 4 |
| `HISTORIAL_REVISIONES` | la variación entre la revisión actual y la anterior |
| `CODIFICACION_ DE_LAS_FACULTADES` | el catálogo: sigla, nombre y número de formulario |

Las pestañas se localizan comparando solo letras y dígitos, así que el espacio
suelto del nombre real —`CODIFICACION_ DE_LAS_FACULTADES`— no estorba, y
corregirlo algún día tampoco romperá nada.

El catálogo manda sobre el que lleva escrito `Tablero.gs`: una renumeración
como la que movió FII a F17 y FISI a F20 se hace en la hoja y el tablero la
recoge sin volver a publicar la aplicación web. Si la hoja falta o no da las 20
facultades, se conserva el del código, que es preferible a un tablero vacío.

Una hoja que aún no se haya generado no rompe nada: esa parte sale en cero y
el resto del tablero se pinta igual.

### Por qué se responde sin credenciales

El tablero está publicado también en la portada pública, así que `tablero` va
en el switch de acciones abiertas. Devuelve solo cifras de avance y el detalle
de la revisión —lo mismo que ya viajaba incrustado en el HTML y era visible en
el código fuente—. Los paneles del área interna, las decisiones y la edición de
documentos siguen exigiendo sesión.

Si esa exposición deja de ser aceptable, mover el `case 'tablero'` al segundo
switch lo cierra: entonces el tablero solo tendrá datos frescos dentro de
`interno.html`, y en la portada se quedará con los incrustados.

### Cuánto tarda en verse un cambio

El servidor guarda su respuesta **60 segundos** (`TABLERO.CACHE_SEG`), y el
navegador vuelve a preguntar cada **dos minutos** (`CADA`, en `Dashboard.html`),
al volver a la pestaña, y cuando se pulsa el botón de recarga del encabezado.
En el peor caso, unos tres minutos desde que termina la auditoría. El botón lo
hace inmediato.

Una pestaña en segundo plano no pregunta: no gasta cuota de Apps Script en
refrescar algo que nadie está mirando.

### Si el servidor no contesta

El HTML conserva incrustado el último estado conocido. Si la petición falla
—red caída, endpoint sin publicar, despliegue mal configurado— el tablero se
queda con esas cifras y lo dice en el encabezado, en lugar de aparecer vacío.
Por eso el bloque `DATOS_FUENTE` sigue en el archivo y conviene refrescarlo de
vez en cuando.

### Comprobación

```
node verificar-tablero.js     # 38 comprobaciones sobre Tablero.gs, sin red
node verificar-dashboard.js   # 26 sobre los datos incrustados de respaldo
```
