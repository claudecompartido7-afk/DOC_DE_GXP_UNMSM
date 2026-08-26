/**
 * Registro de decisiones · Gestión por Procesos UNMSM
 * ---------------------------------------------------
 * Web App (doPost) que recibe las recomendaciones aceptadas desde el Centro
 * de Documentación y las registra en los cuatro documentos del proyecto.
 *
 * Arquitectura
 *   · Un solo endpoint. El cliente no sabe cuántos destinos hay ni de qué tipo son.
 *   · DESTINOS declara los archivos; ESCRITORES traduce «tipo» a la API correcta.
 *     Añadir un quinto documento = una línea en DESTINOS.
 *   · Cada destino se escribe de forma independiente: si uno falla, los demás
 *     se registran igual y la respuesta detalla qué pasó en cada uno.
 *   · La escritura es UPSERT por código de decisión, no append. Reenviar la
 *     misma decisión actualiza su fila; nunca duplica.
 */

/* ==================== CONFIGURACIÓN ==================== */

const TITULO    = 'Registro de decisiones sobre los hallazgos del diagnóstico';
const MARCADOR  = '⟦REGISTRO-DECISIONES-GXP⟧';
const HOJA      = 'Decisiones GxP';
const CABECERA  = ['Código', 'Severidad', 'Hallazgo', 'Recomendación aceptada', 'Editada', 'Fecha'];

/**
 * 'afectados' → cada decisión se escribe en D1 (libro maestro) y además en los
 *               documentos que el hallazgo afecta, según su campo `d`.
 * 'todos'     → cada decisión se escribe en los cuatro documentos.
 */
const MODO_DESTINO = 'afectados';
const MAESTRO = 'D1';

const DESTINOS = [
  { clave: 'D1', tipo: 'doc',  activo: true,
    id: '1h2cyZdeCKL6v-Uzs3gzcEeqYL0P-7BhEEFhKuXq441E',
    nombre: '1_PLAN_GESTIÓN_DE_ALCANCE_UNMSM' },

  { clave: 'D2', tipo: 'hoja', activo: true,
    id: '1ae81piYD6ZcAR8NGyCQ_ve3qV3uP6s9R-7joEP-d5q0',
    nombre: '2_PLAN DE GESTIÓN DEL CRONOGRAMA (GANTT)' },

  // El archivo original es un .xlsx subido, no una Hoja de Google: SpreadsheetApp
  // no puede abrirlo. Ejecute una vez convertirBitacora() y el ID nativo queda
  // guardado en las propiedades del script; a partir de ahí este destino funciona
  // igual que los demás.
  { clave: 'D3', tipo: 'hoja', activo: true,
    id: '1XVoLtMHaMJ4AmeEwjyVmfqHCgFT9ZduL',
    propiedadIdNativo: 'ID_NATIVO_D3',
    nombre: '3_BITÁCORA DE LA IMPLEMENTACIÓN' },

  { clave: 'D4', tipo: 'hoja', activo: true,
    id: '1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk',
    nombre: '4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES' }
];

/* ==================== ENTRADA ==================== */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, error: 'Petición sin cuerpo.' });
    }
    const datos = JSON.parse(e.postData.contents);

    switch (datos.accion) {
      case 'ping':      return responder(diagnostico());
      case 'decision':  return responder(registrarDecision(datos));
      case 'eliminar':  return responder(eliminarDecision(datos));
      case 'listar':    return responder(listarDecisiones());
      default:
        return responder({ ok: false, error: 'Acción no reconocida: ' + datos.accion });
    }
  } catch (err) {
    return responder({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet() {
  return responder(diagnostico());
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ==================== ORQUESTACIÓN ==================== */

/**
 * Traduce el «tipo» declarado en DESTINOS a la función que sabe escribir en él.
 * Para soportar un tipo nuevo (una Presentación, por ejemplo) basta con
 * añadir aquí una entrada; el resto del código no cambia.
 */
const ESCRITORES = {
  doc:  { escribir: escribirEnDoc,  eliminar: eliminarEnDoc,  leer: leerDeDoc  },
  hoja: { escribir: escribirEnHoja, eliminar: eliminarEnHoja, leer: leerDeHoja }
};

/** Devuelve los destinos activos a los que corresponde escribir esta decisión. */
function destinosDe(datos) {
  const afectados = Array.isArray(datos.destinos) ? datos.destinos : [];
  return DESTINOS.filter(function (d) {
    if (!d.activo) return false;
    if (MODO_DESTINO === 'todos') return true;
    if (d.clave === MAESTRO) return true;
    return afectados.indexOf(d.clave) !== -1;
  });
}

/**
 * El ID con el que hay que abrir realmente el archivo. Permite que un destino
 * apunte a una copia nativa creada por convertirBitacora() sin tocar el código.
 */
function idEfectivo(destino) {
  if (destino.propiedadIdNativo) {
    const guardado = PropertiesService.getScriptProperties()
      .getProperty(destino.propiedadIdNativo);
    if (guardado) return guardado;
  }
  return destino.id;
}

/** Normaliza el cuerpo recibido a la fila de seis columnas que se persiste. */
function aFila(d) {
  return [
    String(d.codigo || '').trim(),
    String(d.severidad || '').toUpperCase(),
    String(d.titulo || ''),
    String(d.recomendacion || ''),
    d.editada === true || d.editada === 'Sí' ? 'Sí' : 'No',
    d.fecha || Utilities.formatDate(new Date(), 'America/Lima', 'dd/MM/yyyy HH:mm')
  ];
}

/**
 * Recorre los destinos y acumula el resultado de cada uno por separado.
 * Un fallo en un archivo no aborta los demás: la respuesta indica
 * ok:true sólo si todos los destinos se escribieron correctamente.
 */
function porCadaDestino(destinos, operacion) {
  const resultados = [];
  destinos.forEach(function (destino) {
    try {
      const detalle = operacion(destino, ESCRITORES[destino.tipo]);
      resultados.push({ destino: destino.clave, ok: true, detalle: detalle });
    } catch (err) {
      resultados.push({
        destino: destino.clave,
        ok: false,
        error: String(err && err.message || err)
      });
    }
  });
  return {
    ok: resultados.every(function (r) { return r.ok; }),
    resultados: resultados
  };
}

function registrarDecision(datos) {
  const fila = aFila(datos);
  if (!fila[0]) return { ok: false, error: 'Falta el código de la decisión.' };
  if (!fila[3]) return { ok: false, error: 'Falta el texto de la recomendación.' };

  const destinos = destinosDe(datos);
  if (!destinos.length) return { ok: false, error: 'Ningún destino corresponde a esta decisión.' };

  // Un solo bloqueo para toda la operación: evita que dos aceptaciones
  // simultáneas creen dos veces la misma tabla o la misma pestaña.
  const bloqueo = LockService.getScriptLock();
  if (!bloqueo.tryLock(25000)) {
    return { ok: false, error: 'El registro está ocupado. Inténtelo de nuevo.' };
  }
  try {
    const salida = porCadaDestino(destinos, function (destino, escritor) {
      return escritor.escribir(idEfectivo(destino), destino, fila);
    });
    salida.codigo = fila[0];
    salida.fecha  = fila[5];
    return salida;
  } finally {
    bloqueo.releaseLock();
  }
}

function eliminarDecision(datos) {
  const codigo = String(datos.codigo || '').trim();
  if (!codigo) return { ok: false, error: 'Falta el código de la decisión.' };

  const bloqueo = LockService.getScriptLock();
  if (!bloqueo.tryLock(25000)) {
    return { ok: false, error: 'El registro está ocupado. Inténtelo de nuevo.' };
  }
  try {
    // Se elimina de todos los destinos activos, no sólo de los afectados:
    // si la decisión se registró antes con otra configuración, igual se limpia.
    const activos = DESTINOS.filter(function (d) { return d.activo; });
    const salida = porCadaDestino(activos, function (destino, escritor) {
      return escritor.eliminar(idEfectivo(destino), destino, codigo);
    });
    salida.codigo = codigo;
    return salida;
  } finally {
    bloqueo.releaseLock();
  }
}

/** Devuelve lo registrado en el documento maestro, para rehidratar la interfaz. */
function listarDecisiones() {
  const maestro = DESTINOS.filter(function (d) { return d.clave === MAESTRO; })[0];
  try {
    const filas = ESCRITORES[maestro.tipo].leer(idEfectivo(maestro), maestro);
    return { ok: true, decisiones: filas };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
}

/** Comprueba que los cuatro archivos se abren y se pueden escribir. */
function diagnostico() {
  const estado = DESTINOS.map(function (d) {
    const linea = { destino: d.clave, tipo: d.tipo, activo: d.activo, id: idEfectivo(d) };
    if (!d.activo) { linea.ok = null; linea.nota = 'Desactivado'; return linea; }
    try {
      const archivo = DriveApp.getFileById(idEfectivo(d));
      linea.nombre = archivo.getName();
      linea.mime   = archivo.getMimeType();
      if (d.tipo === 'hoja' && linea.mime !== MimeType.GOOGLE_SHEETS) {
        linea.ok = false;
        linea.error = 'No es una Hoja de Google (' + linea.mime + '). ' +
                      'Ejecute convertirBitacora() una vez.';
      } else if (d.tipo === 'doc' && linea.mime !== MimeType.GOOGLE_DOCS) {
        linea.ok = false;
        linea.error = 'No es un Documento de Google (' + linea.mime + ').';
      } else {
        linea.ok = true;
      }
    } catch (err) {
      linea.ok = false;
      linea.error = String(err && err.message || err);
    }
    return linea;
  });
  return {
    ok: estado.every(function (l) { return l.ok !== false; }),
    modo: MODO_DESTINO,
    destinos: estado
  };
}

/* ==================== ESCRITURA · DOCUMENTO ==================== */

function escribirEnDoc(id, destino, fila) {
  const tabla = obtenerTablaDoc(id);
  for (let i = 1; i < tabla.getNumRows(); i++) {
    if (tabla.getRow(i).getCell(0).getText().trim() === fila[0]) {
      pintarFilaDoc(tabla.getRow(i), fila, false);
      return { accion: 'actualizada', fila: i };
    }
  }
  pintarFilaDoc(tabla.appendTableRow(), fila, true);
  return { accion: 'insertada', fila: tabla.getNumRows() - 1 };
}

function eliminarEnDoc(id, destino, codigo) {
  const tabla = obtenerTablaDoc(id);
  for (let i = 1; i < tabla.getNumRows(); i++) {
    if (tabla.getRow(i).getCell(0).getText().trim() === codigo) {
      tabla.removeRow(i);
      return { accion: 'eliminada', fila: i };
    }
  }
  return { accion: 'no encontrada' };
}

function leerDeDoc(id, destino) {
  const tabla = obtenerTablaDoc(id);
  const filas = [];
  for (let i = 1; i < tabla.getNumRows(); i++) {
    const r = tabla.getRow(i);
    filas.push({
      codigo: r.getCell(0).getText().trim(),
      severidad: r.getCell(1).getText().trim(),
      titulo: r.getCell(2).getText(),
      recomendacion: r.getCell(3).getText(),
      editada: r.getCell(4).getText().trim() === 'Sí',
      fecha: r.getCell(5).getText().trim()
    });
  }
  return filas;
}

function pintarFilaDoc(fila, valores, esNueva) {
  valores.forEach(function (texto, c) {
    const celda = esNueva ? fila.appendTableCell(texto) : fila.getCell(c);
    if (!esNueva) celda.setText(texto);
    celda.setBackgroundColor(null);
    celda.getChild(0).asParagraph().setSpacingBefore(2).setSpacingAfter(2);

    const estilo = {};
    estilo[DocumentApp.Attribute.FONT_SIZE] = 9;
    estilo[DocumentApp.Attribute.BOLD] = false;
    if (c === 0) {
      estilo[DocumentApp.Attribute.FONT_FAMILY] = 'Consolas';
      estilo[DocumentApp.Attribute.BOLD] = true;
    }
    if (c === 1) {
      const sev = String(texto).toUpperCase();
      estilo[DocumentApp.Attribute.FOREGROUND_COLOR] =
        sev === 'CRITICO' ? '#8E2020' : sev === 'ALTO' ? '#A2660F' : '#22506E';
      estilo[DocumentApp.Attribute.BOLD] = true;
    }
    celda.setAttributes(estilo);
  });
}

function obtenerTablaDoc(id) {
  const cuerpo = DocumentApp.openById(id).getBody();
  const marca = cuerpo.findText(MARCADOR);
  if (marca) {
    const parrafo = marca.getElement().getParent();
    const desde = cuerpo.getChildIndex(parrafo);
    for (let i = desde; i < cuerpo.getNumChildren(); i++) {
      if (cuerpo.getChild(i).getType() === DocumentApp.ElementType.TABLE) {
        return cuerpo.getChild(i).asTable();
      }
    }
  }
  cuerpo.appendPageBreak();
  cuerpo.appendParagraph(TITULO).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  cuerpo.appendParagraph(
    'Esta tabla se actualiza automáticamente desde el Centro de Documentación del proyecto. ' +
    'Cada fila corresponde a una recomendación del diagnóstico que el equipo aceptó, ' +
    'con el texto definitivo y la fecha de aceptación. No la edite a mano: los cambios ' +
    'se sobrescriben en la siguiente sincronización.'
  ).setItalic(true).setFontSize(9).setForegroundColor('#5E6E7E');
  cuerpo.appendParagraph(MARCADOR).setFontSize(6).setForegroundColor('#FFFFFF').setSpacingAfter(0);

  const tabla = cuerpo.appendTable([CABECERA]);
  const encabezado = tabla.getRow(0);
  for (let c = 0; c < CABECERA.length; c++) {
    const celda = encabezado.getCell(c);
    celda.setBackgroundColor('#14202E');
    const estilo = {};
    estilo[DocumentApp.Attribute.FOREGROUND_COLOR] = '#FFFFFF';
    estilo[DocumentApp.Attribute.BOLD] = true;
    estilo[DocumentApp.Attribute.FONT_SIZE] = 9;
    celda.setAttributes(estilo);
  }
  tabla.setColumnWidth(0, 55);
  tabla.setColumnWidth(1, 60);
  tabla.setColumnWidth(4, 45);
  tabla.setColumnWidth(5, 80);
  return tabla;
}

/* ==================== ESCRITURA · HOJA DE CÁLCULO ==================== */

function escribirEnHoja(id, destino, fila) {
  const hoja = obtenerHoja(id);
  const codigos = columnaCodigos(hoja);
  const pos = codigos.indexOf(fila[0]);

  if (pos !== -1) {
    const n = pos + 2;                                  // +1 cabecera, +1 base 1
    hoja.getRange(n, 1, 1, fila.length).setValues([fila]);
    pintarFilaHoja(hoja, n, fila[1]);
    return { accion: 'actualizada', fila: n };
  }
  const n = hoja.getLastRow() + 1;
  hoja.getRange(n, 1, 1, fila.length).setValues([fila]);
  pintarFilaHoja(hoja, n, fila[1]);
  return { accion: 'insertada', fila: n };
}

function eliminarEnHoja(id, destino, codigo) {
  const hoja = obtenerHoja(id);
  const pos = columnaCodigos(hoja).indexOf(codigo);
  if (pos === -1) return { accion: 'no encontrada' };
  hoja.deleteRow(pos + 2);
  return { accion: 'eliminada', fila: pos + 2 };
}

function leerDeHoja(id, destino) {
  const hoja = obtenerHoja(id);
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, CABECERA.length).getValues()
    .filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) {
      return {
        codigo: String(r[0]).trim(),
        severidad: String(r[1]).trim(),
        titulo: String(r[2]),
        recomendacion: String(r[3]),
        editada: String(r[4]).trim() === 'Sí',
        fecha: String(r[5]).trim()
      };
    });
}

function columnaCodigos(hoja) {
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); });
}

/**
 * Devuelve la pestaña de decisiones del libro, creándola si no existe.
 * Nunca toca las pestañas de datos del proyecto: escribe en una hoja propia.
 */
function obtenerHoja(id) {
  const libro = SpreadsheetApp.openById(id);
  let hoja = libro.getSheetByName(HOJA);
  if (hoja) return hoja;

  hoja = libro.insertSheet(HOJA);
  hoja.getRange(1, 1, 1, CABECERA.length).setValues([CABECERA]);
  hoja.getRange(1, 1, 1, CABECERA.length)
    .setBackground('#14202E').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(9);
  hoja.setFrozenRows(1);
  hoja.setColumnWidth(1, 70);
  hoja.setColumnWidth(2, 80);
  hoja.setColumnWidth(3, 320);
  hoja.setColumnWidth(4, 460);
  hoja.setColumnWidth(5, 60);
  hoja.setColumnWidth(6, 120);
  return hoja;
}

function pintarFilaHoja(hoja, n, severidad) {
  const rango = hoja.getRange(n, 1, 1, CABECERA.length);
  rango.setFontSize(9).setVerticalAlignment('top').setWrap(true);
  hoja.getRange(n, 1).setFontFamily('Consolas').setFontWeight('bold');
  const sev = String(severidad).toUpperCase();
  hoja.getRange(n, 2)
    .setFontColor(sev === 'CRITICO' ? '#8E2020' : sev === 'ALTO' ? '#A2660F' : '#22506E')
    .setFontWeight('bold');
}

/* ==================== UTILIDADES DE INSTALACIÓN ==================== */

/**
 * El documento 3 está en Drive como .xlsx y SpreadsheetApp no puede abrirlo.
 * Esta función crea una copia nativa de Google Sheets junto al original y
 * guarda su ID en las propiedades del script, de modo que el destino D3
 * empiece a funcionar sin editar el código.
 *
 * Ejecútela UNA sola vez desde el editor de Apps Script.
 * Requiere activar el servicio avanzado «Drive API» (v3).
 */
function convertirBitacora() {
  const destino = DESTINOS.filter(function (d) { return d.clave === 'D3'; })[0];
  const props = PropertiesService.getScriptProperties();

  const yaHecho = props.getProperty(destino.propiedadIdNativo);
  if (yaHecho) {
    Logger.log('Ya existe una copia nativa: ' + yaHecho);
    return yaHecho;
  }

  const original = DriveApp.getFileById(destino.id);
  if (original.getMimeType() === MimeType.GOOGLE_SHEETS) {
    Logger.log('El archivo ya es una Hoja de Google. No hace falta convertir.');
    return destino.id;
  }

  const carpetas = original.getParents();
  const padre = carpetas.hasNext() ? carpetas.next().getId() : null;

  const copia = Drive.Files.copy(
    {
      name: original.getName().replace(/\.xlsx$/i, '') + ' (Hoja de Google)',
      mimeType: MimeType.GOOGLE_SHEETS,
      parents: padre ? [padre] : undefined
    },
    destino.id
  );

  props.setProperty(destino.propiedadIdNativo, copia.id);
  Logger.log('Copia nativa creada: ' + copia.id);
  Logger.log('https://docs.google.com/spreadsheets/d/' + copia.id + '/edit');
  return copia.id;
}

/** Prepara los cuatro destinos y deja el estado en el registro. Opcional. */
function inicializarDestinos() {
  DESTINOS.filter(function (d) { return d.activo; }).forEach(function (d) {
    try {
      if (d.tipo === 'doc')  obtenerTablaDoc(idEfectivo(d));
      if (d.tipo === 'hoja') obtenerHoja(idEfectivo(d));
      Logger.log(d.clave + ' · listo');
    } catch (err) {
      Logger.log(d.clave + ' · ERROR: ' + err);
    }
  });
}
