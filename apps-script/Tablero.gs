/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  TABLERO EN VIVO — origen de datos del Dashboard
 *  Oficina General de Planificación · Oficina de Racionalización (UNMSM)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Lee el libro «4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES» y devuelve, en la
 *  forma exacta que el Dashboard espera, lo que las auditorías de los anexos
 *  dejaron escrito en él. El tablero deja así de llevar sus cifras incrustadas:
 *  las pide cada vez, y cada corrida de `ejecutarAuditoriaAnexo1`,
 *  `ejecutarRevisionAnexo3` o `ejecutarRevisionAnexo4` se ve en la web sin
 *  volver a publicar nada.
 *
 *  Se responde SIN sesión, a propósito: el tablero está publicado en la portada
 *  pública. Por eso aquí sólo salen cifras agregadas y el detalle de la revisión
 *  —lo mismo que ya viajaba incrustado en el HTML—, nunca las credenciales ni
 *  los paneles del área interna, que siguen exigiendo acceso en Codigo.gs.
 *
 *  Instalación
 *  ─────────────────────────────────────────────────────────────────────────────
 *   1. Pegar este archivo en el proyecto que publica la aplicación web.
 *   2. En `Codigo.gs`, dentro del PRIMER switch de `doPost` (el de las acciones
 *      sin credenciales), añadir:      case 'tablero': return responder(tablero());
 *   3. Volver a implementar con versión «Nueva».
 *
 *  `probarTablero()` desde el editor comprueba las hojas sin pasar por la web.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const TABLERO = {

  /** Libro donde las tres auditorías dejan sus hojas de resultado. */
  LIBRO_ID: '1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk',

  HOJAS: {
    GENERAL:    'RESUMEN_GENERAL',              // Anexo 3 · % por facultad
    RESUMEN_A1: 'RESUMEN_EJECUTIVO_A1',
    PRODUCTOS:  'DETALLADO_PRODUCTOS_A1',
    PROCESOS:   'OBSERVACIONES_DE_PROCESO_A1',
    RESUMEN_A3: 'RESUMEN_EJECUTIVO_A3',
    FICHAS:     'RESUMEN_FICHAS_A3',
    DETALLE_A3: 'DETALLE_REVISION_A3',
    MAESTRO_A3: 'REGISTRO_MAESTRO_CODIGOS_A3',
    A4:         'RESUMEN_EJECUTIVO_A4',
    HISTORIAL:  'HISTORIAL_REVISIONES',
    CATALOGO:   'CODIFICACION_ DE_LAS_FACULTADES'
  },

  /**
   * Tope de filas de detalle que viajan al navegador.
   *
   * Estaba en 3000 y las hojas suman más: DETALLADO_PRODUCTOS_A1 ronda las
   * 2900 filas y OBSERVACIONES_DE_PROCESO_A1 casi 1000, así que se perdían
   * cientos de registros por el camino. Ahora cabe el libro entero con
   * holgura; es un tope de seguridad, no un recorte de trabajo.
   *
   * Nada de esto afecta a los INDICADORES: se calculan sobre las hojas de
   * resumen completas, no sobre este detalle.
   *
   * A cambio, la respuesta pasa de largo el máximo de la caché de Apps Script
   * (100 KB por entrada), así que deja de guardarse y cada consulta relee el
   * libro. Es el precio de no perder filas, y `probarTablero()` lo dice.
   */
  MAX_REGISTROS: 25000,

  /**
   * Celda de `RESUMEN_EJECUTIVO_A4` que lleva el avance del Anexo 4 según la
   * última versión del historial de revisión. Manda sobre el recuento de
   * indicadores aprobados: la hoja pondera, y contar filas no.
   */
  CELDA_PCT_A4: 'F36',

  /**
   * Celda de `HISTORIAL_REVISIONES` con el avance de Fase 1 de la última
   * versión registrada. Es el respaldo de la búsqueda por «Fase 1» en la
   * columna B: si esa búsqueda no da con la fila —porque la fecha está escrita
   * de una forma que no se reconoce, o el rótulo cambió— se lee esta celda en
   * lugar de dejar la tarjeta con el promedio calculado.
   */
  CELDA_PCT_FASE1: 'C14',

  /** Segundos que se guarda la respuesta antes de volver a leer el libro. */
  CACHE_SEG: 60,

  /**
   * Catálogo oficial, con la numeración corregida de la OGPL: FII es F17,
   * FPSIC F18, FIEE F19 y FISI F20. El orden es el de la relación.
   */
  FACULTADES: [
    ['FM',     'F01', 'FACULTAD DE MEDICINA'],
    ['FDCP',   'F02', 'FACULTAD DE DERECHO Y CIENCIA POLÍTICA'],
    ['FLCH',   'F03', 'FACULTAD DE LETRAS Y CIENCIAS HUMANAS'],
    ['FFB',    'F04', 'FACULTAD DE FARMACIA Y BIOQUÍMICA'],
    ['FO',     'F05', 'FACULTAD DE ODONTOLOGÍA'],
    ['FE',     'F06', 'FACULTAD DE EDUCACIÓN'],
    ['FQIQ',   'F07', 'FACULTAD DE QUÍMICA E INGENIERÍA QUÍMICA'],
    ['FMV',    'F08', 'FACULTAD DE MEDICINA VETERINARIA'],
    ['FCA',    'F09', 'FACULTAD DE CIENCIAS ADMINISTRATIVAS'],
    ['FCB',    'F10', 'FACULTAD DE CIENCIAS BIOLÓGICAS'],
    ['FCC',    'F11', 'FACULTAD DE CIENCIAS CONTABLES'],
    ['FCE',    'F12', 'FACULTAD DE CIENCIAS ECONÓMICAS'],
    ['FCF',    'F13', 'FACULTAD DE CIENCIAS FÍSICAS'],
    ['FCM',    'F14', 'FACULTAD DE CIENCIAS MATEMÁTICAS'],
    ['FCCSS',  'F15', 'FACULTAD DE CIENCIAS SOCIALES'],
    ['FIGMMG', 'F16', 'FACULTAD DE INGENIERÍA GEOLÓGICA, MINERA, METALÚRGICA Y GEOGRÁFICA'],
    ['FII',    'F17', 'FACULTAD DE INGENIERÍA INDUSTRIAL'],
    ['FPSIC',  'F18', 'FACULTAD DE PSICOLOGÍA'],
    ['FIEE',   'F19', 'FACULTAD DE INGENIERÍA ELECTRÓNICA Y ELÉCTRICA'],
    ['FISI',   'F20', 'FACULTAD DE INGENIERÍA DE SISTEMAS E INFORMÁTICA']
  ]
};

/* ══════════════════════ ACCIÓN PÚBLICA ══════════════════════ */

/**
 * Respuesta que consume el Dashboard. Se sirve de la caché mientras no
 * caduque: veinte personas mirando el tablero no son veinte lecturas del libro.
 */
function tablero(opciones) {
  const sinCache = opciones && opciones.sinCache;
  const cache = CacheService.getScriptCache();

  if (!sinCache) {
    const guardado = cache.get('tablero_v1');
    if (guardado) {
      const previo = JSON.parse(guardado);
      previo.deCache = true;
      return previo;
    }
  }

  const datos = construirTablero_();

  try {
    cache.put('tablero_v1', JSON.stringify(datos), TABLERO.CACHE_SEG);
    datos.enCache = true;
  } catch (e) {
    // Supera el máximo de la caché (100 KB): se sirve igual, sin guardar. Con
    // el libro completo esto es lo normal, no una avería.
    datos.enCache = false;
  }
  return datos;
}

/* ══════════════════════ LECTURA DEL LIBRO ══════════════════════ */

function construirTablero_() {
  const libro = SpreadsheetApp.openById(TABLERO.LIBRO_ID);

  const general  = leerHoja_(libro, TABLERO.HOJAS.GENERAL);
  const resA1    = leerHoja_(libro, TABLERO.HOJAS.RESUMEN_A1);
  const resA3    = leerHoja_(libro, TABLERO.HOJAS.RESUMEN_A3);
  const productos= leerHoja_(libro, TABLERO.HOJAS.PRODUCTOS);
  const procesos = leerHoja_(libro, TABLERO.HOJAS.PROCESOS);
  const fichas   = leerHoja_(libro, TABLERO.HOJAS.FICHAS);
  const campos   = leerHoja_(libro, TABLERO.HOJAS.DETALLE_A3);
  const codigos  = leerHoja_(libro, TABLERO.HOJAS.MAESTRO_A3);
  const indic    = leerHoja_(libro, TABLERO.HOJAS.A4);
  const pctA4Hoja= leerCeldaPct_(libro, TABLERO.HOJAS.A4, TABLERO.CELDA_PCT_A4);
  const histor   = leerHoja_(libro, TABLERO.HOJAS.HISTORIAL);

  const catalogo = leerCatalogo_(libro);   // fija también CATALOGO_VIGENTE
  const porSigla = indexarPorSigla_(general, resA1, resA3, catalogo);
  const facultades = catalogo.map(function (f, i) {
    return facultadDe_(f[0], f[1] + '_' + f[0], f[2], i + 1, porSigla[f[0]] || {});
  });

  const registros = recopilarRegistros_(productos, procesos, fichas, campos, codigos);

  // El detalle del Anexo 3 se lee después de armar el catálogo, así que sus
  // recuentos se acoplan aquí en lugar de dentro de `facultadDe_`.
  facultades.forEach(function (f) {
    const extra = registros.porFacultad[f.codigo] || {};
    const vacio = { conformes: 0, observados: 0, sinRegistrar: 0, critico: 0, total: 0 };
    // `fichas` ya existe con el desglose de RESUMEN_EJECUTIVO_A3 —completas,
    // incompletas, sin producto— del que sale el KPI del Anexo 3. El recuento
    // por estado va aparte, en `fichasEstado`, para no romper esa aritmética.
    f.fichasEstado = extra.fichas  || vacio;
    f.campos       = extra.campos  || vacio;
    f.codigos      = extra.codigos || { conformes: 0, observados: 0, total: 0 };
  });
  const totales   = sumarTotales_(facultades);
  const anexo4    = leerAnexo4_(indic, pctA4Hoja);
  const revisiones= leerHistorial_(histor, anexo4);
  const historial = historialPorAnexo_(histor);
  const pctFase1Celda = leerCeldaPct_(libro, TABLERO.HOJAS.HISTORIAL,
                                      TABLERO.CELDA_PCT_FASE1);

  return {
    ok: true,
    generado: new Date().toISOString(),
    origen: libro.getName(),
    facultades: facultades,
    totales: totales,
    kpi: calcularKpi_(facultades, totales, anexo4, historial, pctFase1Celda),
    anexo4: anexo4,
    revisiones: revisiones,
    historial: historial,
    registros: registros.filas,
    cobertura: registros.cobertura,
    recorte: registros.recorte
  };
}

/** Devuelve las filas de una hoja sin su encabezado; [] si la hoja no existe. */
function leerHoja_(libro, nombre) {
  const hoja = buscarHoja_(libro, nombre);
  if (!hoja || hoja.getLastRow() < 2) return [];
  return hoja.getDataRange().getValues().slice(1);
}

/**
 * Localiza una pestaña sin exigir que el nombre coincida carácter a carácter.
 *
 * Hace falta: la hoja del catálogo se llama `CODIFICACION_ DE_LAS_FACULTADES`,
 * con un espacio suelto detrás del guion bajo. Comparar literalmente haría que
 * el día que alguien lo corrija —o lo mueva de sitio— el tablero se quedara sin
 * catálogo sin decir por qué. Se comparan letras y dígitos, y nada más.
 */
function buscarHoja_(libro, nombre) {
  const exacta = libro.getSheetByName(nombre);
  if (exacta) return exacta;

  const buscada = esqueleto_(nombre);
  const hojas = libro.getSheets();
  for (let i = 0; i < hojas.length; i++) {
    if (esqueleto_(hojas[i].getName()) === buscada) return hojas[i];
  }
  return null;
}

function esqueleto_(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Cruza por sigla las tres hojas de resumen. Cada una aporta una parte:
 * RESUMEN_GENERAL los porcentajes, RESUMEN_EJECUTIVO_A1 los productos y los
 * procesos, RESUMEN_EJECUTIVO_A3 las fichas.
 *
 * Se descartan las filas que no son de facultad —la de TOTAL y la leyenda que
 * el auditor del Anexo 1 escribe al pie— comprobando la sigla contra el
 * catálogo, que es el único juez de qué es una facultad.
 */
function indexarPorSigla_(general, resA1, resA3, catalogo) {
  const validas = {};
  catalogo.forEach(function (f) { validas[f[0]] = true; });

  const mapa = {};
  const cajon = function (sigla) {
    const s = String(sigla || '').trim().toUpperCase();
    if (!validas[s]) return null;
    if (!mapa[s]) mapa[s] = {};
    return mapa[s];
  };

  general.forEach(function (f) {
    const c = cajon(f[0]); if (!c) return;
    c.pctAnexo1  = pct_(f[2]);
    c.pctAnexo3  = pct_(f[3]);
    c.pctGeneral = pct_(f[4]);
    c.estado     = String(f[5] || '').trim();
    c.notas      = String(f[6] || '').trim();
  });

  resA1.forEach(function (f) {
    const c = cajon(f[0]); if (!c) return;
    c.productos = {
      total:        num_(f[2]),
      conformes:    num_(f[3]),
      observados:   num_(f[4]),
      sinRegistrar: num_(f[5])
    };
    c.procesos = num_(f[9]);
    // Columnas 11-13 y 14-16 del resumen: el desglose que las tarjetas de
    // «Procesos» y «SubProcesos» necesitan. Se leía la fila entera y solo se
    // usaba el total, así que esas dos tarjetas salían siempre en cero.
    c.procesosN0 = {
      conformes:    num_(f[10]),
      observados:   num_(f[11]),
      sinRegistrar: num_(f[12])
    };
    c.subprocesos = {
      conformes:    num_(f[13]),
      observados:   num_(f[14]),
      sinRegistrar: num_(f[15])
    };
    // Si RESUMEN_GENERAL no existe todavía, el avance del Anexo 1 se toma aquí.
    if (c.pctAnexo1 === null) c.pctAnexo1 = pct_(f[6]);
  });

  resA3.forEach(function (f) {
    const c = cajon(f[0]); if (!c) return;
    c.fichas = {
      total:       num_(f[2]),
      esperadas:   num_(f[3]),
      completas:   num_(f[4]),
      incompletas: num_(f[5]),
      sinProducto: num_(f[6])
    };
    if (c.pctAnexo3 === null) c.pctAnexo3 = pct_(f[11]);
  });

  return mapa;
}

/** Una facultad del catálogo, completada con lo que el libro tenga de ella. */
function facultadDe_(sigla, codigo, nombre, orden, d) {
  const productos = d.productos || { total: 0, conformes: 0, observados: 0, sinRegistrar: 0 };
  const cero = function () { return { conformes: 0, observados: 0, sinRegistrar: 0, total: 0 }; };
  const conTotal = function (b) {
    if (!b) return cero();
    b.total = b.conformes + b.observados + b.sinRegistrar;
    return b;
  };
  const fichas    = d.fichas    || { total: 0, esperadas: 16, completas: 0, incompletas: 0, sinProducto: 0 };
  const pctA1 = d.pctAnexo1 === null || d.pctAnexo1 === undefined ? 0 : d.pctAnexo1;
  const pctA3 = d.pctAnexo3 === null || d.pctAnexo3 === undefined ? 0 : d.pctAnexo3;
  const pctG  = d.pctGeneral === null || d.pctGeneral === undefined
                  ? redondear_((pctA1 + pctA3) / 2) : d.pctGeneral;

  return {
    codigo: codigo, sigla: sigla, nombre: nombre, orden: orden,
    procesos: d.procesos || 0,
    pctAnexo1: pctA1, pctAnexo3: pctA3, pctGeneral: pctG,
    estado: d.estado || 'Sin revisar',
    clasificacion: clasificar_(d.estado, pctG),
    productos: productos,
    procesosN0: conTotal(d.procesosN0),
    subprocesos: conTotal(d.subprocesos),
    fichas: fichas
  };
}

/**
 * La clasificación que colorea el listado. Se respeta la que escribió el
 * auditor cuando la hay; si la hoja aún no se ha generado, se deduce del
 * avance para que el tablero no quede en gris.
 */
function clasificar_(estado, pct) {
  const e = String(estado || '').toLowerCase();
  if (e.indexOf('crítico') !== -1 || e.indexOf('critico') !== -1) return 'Crítico';
  if (e.indexOf('conforme') !== -1)  return 'Conforme';
  if (e.indexOf('proceso') !== -1)   return 'Observación';
  if (!e || e.indexOf('sin revisar') !== -1) return 'Sin revisar';
  return pct >= 90 ? 'Conforme' : (pct >= 50 ? 'Observación' : 'Crítico');
}

/** Los totales del encabezado salen de las facultades, no de la fila TOTAL. */
/**
 * Cómo se traduce la columna CLASIFICACIÓN de DETALLE_REVISION_A3 a los cuatro
 * estados de la tarjeta «Fichas / Campos».
 *
 * El auditor del Anexo 3 escribe cinco rótulos y la tarjeta pide cuatro
 * estados, así que la correspondencia hay que decidirla y dejarla escrita:
 *
 *   Correcto    -> Conforme       el campo está y está bien
 *   Observación -> Observado      está, pero hay algo que corregir
 *   Incompleto  -> Sin Registrar  la columna es «¿CAMPO COMPLETO?»: no está
 *   Crítico     -> Crítico
 *   Opcional    -> no cuenta      no era exigible, no es un acierto ni un fallo
 */
const CLASIFICACION_A3 = {
  'CORRECTO':    'CONFORME',
  'OBSERVACION': 'OBSERVADO',
  'INCOMPLETO':  'SIN REGISTRAR',
  'CRITICO':     'CRITICO'
};

/** El estado de una fila de DETALLE_REVISION_A3 según su clasificación. */
function estadoDeCampo_(clasificacion) {
  const c = String(clasificacion || '').trim().toUpperCase()
              .replace(/[ÁÀÄÂ]/g, 'A').replace(/[ÉÈËÊ]/g, 'E')
              .replace(/[ÍÌÏÎ]/g, 'I').replace(/[ÓÒÖÔ]/g, 'O')
              .replace(/[ÚÙÜÛ]/g, 'U');
  return CLASIFICACION_A3[c] || null;
}

/** «Sí» / «No» de la columna ¿DENOMINACIÓN CONSISTENTE? del maestro. */
function estadoDeCodigo_(consistente) {
  const v = String(consistente || '').trim().toUpperCase();
  if (!v) return null;
  return /^S/.test(v) ? 'CONFORME' : 'OBSERVADO';
}

function sumarTotales_(facultades) {
  const t = { prodConf: 0, prodObs: 0, prodSin: 0,
              procConf: 0, procObs: 0, procSin: 0,
              subConf: 0, subObs: 0, subSin: 0,
              fichComp: 0, fichIncomp: 0, fichSin: 0,
              fichConf: 0, fichObs: 0, fichSinReg: 0, fichCrit: 0,
              campConf: 0, campObs: 0, campSin: 0, campCrit: 0,
              codConf: 0, codObs: 0 };
  facultades.forEach(function (f) {
    t.prodConf   += f.productos.conformes;
    t.prodObs    += f.productos.observados;
    t.prodSin    += f.productos.sinRegistrar;
    t.procConf   += f.procesosN0.conformes;
    t.procObs    += f.procesosN0.observados;
    t.procSin    += f.procesosN0.sinRegistrar;
    t.subConf    += f.subprocesos.conformes;
    t.subObs     += f.subprocesos.observados;
    t.subSin     += f.subprocesos.sinRegistrar;
    t.fichComp   += f.fichas.completas;
    t.fichIncomp += f.fichas.incompletas;
    t.fichSin    += f.fichas.sinProducto;
    const h = f.fichasEstado || {};
    t.fichConf   += h.conformes    || 0;
    t.fichObs    += h.observados   || 0;
    t.fichSinReg += h.sinRegistrar || 0;
    t.fichCrit   += h.critico      || 0;
    const c = f.campos  || {}, k = f.codigos || {};
    t.campConf   += c.conformes    || 0;
    t.campObs    += c.observados   || 0;
    t.campSin    += c.sinRegistrar || 0;
    t.campCrit   += c.critico      || 0;
    t.codConf    += k.conformes    || 0;
    t.codObs     += k.observados   || 0;
  });
  return t;
}

/**
 * Los cuatro indicadores de cabecera.
 *
 * El avance de los anexos se pondera por volumen —una facultad con 281
 * productos no puede pesar lo mismo que una con 62—, que es el criterio de la
 * fórmula del Centro de Documentación: (conformes + ½ observados) ÷ total.
 */
function calcularKpi_(facultades, t, anexo4, historial, pctFase1Celda) {
  const totalProd = t.prodConf + t.prodObs + t.prodSin;
  const totalFich = t.fichComp + t.fichIncomp + t.fichSin;

  const a1 = totalProd ? redondear_(((t.prodConf + t.prodObs / 2) / totalProd) * 100) : 0;
  const a3 = totalFich ? redondear_(((t.fichComp + t.fichIncomp / 2) / totalFich) * 100) : 0;

  const conAvance = facultades.filter(function (f) { return f.pctGeneral > 0; });
  const general = conAvance.length
    ? redondear_(conAvance.reduce(function (a, f) { return a + f.pctGeneral; }, 0) / conAvance.length)
    : 0;

  // HISTORIAL_REVISIONES es la cifra que la OGPL da por buena para cada anexo:
  // la escribe el propio auditor al terminar. Manda sobre lo que se recalcula
  // aquí desde las hojas de resumen, que puede diferir si alguien editó una a
  // mano después de la corrida. Si un anexo no está en el historial todavía,
  // se queda con el cálculo, que es mejor que un hueco.
  const delHistorial = function (clave, calculado) {
    const h = historial && historial[clave];
    return h && h.actual ? h.actual.valor : calculado;
  };

  // Fase 1, en orden de preferencia:
  //   1. La fila «Fase 1» más reciente del historial. Es la única que trae
  //      fecha, así que es la única con la que la tarjeta puede mostrar su
  //      variación y su línea de tendencia.
  //   2. La celda C14 a secas, para cuando la búsqueda no da con la fila.
  //   3. El promedio de las facultades con avance.
  const fase1 = (historial && historial.fase1 && historial.fase1.actual)
    ? historial.fase1.actual.valor
    : (pctFase1Celda === null || pctFase1Celda === undefined ? general : pctFase1Celda);

  return {
    general: fase1,
    anexo1: delHistorial('anexo1', a1),
    anexo3: delHistorial('anexo3', a3),
    anexo4: delHistorial('anexo4', anexo4.pct),

    // Lo que dan las hojas por su cuenta, al margen del historial. No lo pinta
    // ninguna tarjeta: está para que `probarTablero()` pueda enseñar las dos
    // cifras cuando no coinciden, que es justo cuando alguien quiere saberlo.
    hojas: { general: general, anexo1: a1, anexo3: a3, anexo4: anexo4.pctContado },

    // De dónde salió cada cifra de Fase 1, para poder decirlo en el diagnóstico.
    origenFase1: (historial && historial.fase1 && historial.fase1.actual)
      ? 'la fila «Fase 1» más reciente de ' + TABLERO.HOJAS.HISTORIAL
      : (pctFase1Celda === null || pctFase1Celda === undefined
          ? 'el promedio de las facultades (ni fila «Fase 1» ni celda ' +
            TABLERO.CELDA_PCT_FASE1 + ')'
          : 'la celda ' + TABLERO.CELDA_PCT_FASE1 + ' (no se encontró la fila «Fase 1»)')
  };
}

/**
 * El historial visto anexo por anexo: su último registro, el anterior y la
 * diferencia en puntos porcentuales.
 *
 * Se ordena por fecha DENTRO de cada anexo, no por corridas conjuntas. Importa:
 * los tres auditores se ejecutan por separado, así que la revisión anterior del
 * Anexo 4 puede ser de otro día que la del Anexo 1, y agruparlas por momento
 * haría que una tarjeta se comparase contra una revisión que no es la suya.
 */
function historialPorAnexo_(filas) {
  const porAnexo = { fase1: [], anexo1: [], anexo3: [], anexo4: [] };

  filas.forEach(function (f, i) {
    // Una fecha que no se puede interpretar NO descarta la fila. Antes sí, y
    // en silencio: una columna A escrita como texto —«28/08/2026 09:00»— hacía
    // desaparecer registros que estaban perfectamente ahí, sin que nada lo
    // dijera. Se conserva la fila y, a falta de fecha, manda su orden en la
    // hoja, que es el orden en que se registraron.
    const fecha = fechaDeCelda_(f[0]);

    // «Fase 1» se comprueba ANTES que los anexos: lleva un 1 en el nombre y si
    // no, se colaría como Anexo 1 y falsearía las dos series.
    const texto = String(f[1] || '');
    const clave = /fase\s*1/i.test(texto) ? 'fase1'
                : /4/.test(texto) ? 'anexo4'
                : /3/.test(texto) ? 'anexo3'
                : /1/.test(texto) ? 'anexo1' : null;
    if (!clave) return;

    const valor = pct_(f[2]);
    if (valor === null) return;

    porAnexo[clave].push({
      fecha: fecha ? fecha.toISOString() : null,
      valor: valor,
      orden: i
    });
  });

  const salida = {};
  Object.keys(porAnexo).forEach(function (clave) {
    // Por fecha cuando la hay; a igualdad, o sin fecha, por su posición en la
    // hoja. Así «el último registro» sigue siendo el de más abajo aunque la
    // columna A esté vacía o mal escrita.
    const lista = porAnexo[clave].sort(function (a, b) {
      if (a.fecha && b.fecha && a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
      return a.orden - b.orden;
    });
    const actual   = lista.length ? lista[lista.length - 1] : null;
    const anterior = lista.length > 1 ? lista[lista.length - 2] : null;

    // La serie completa, con la variación de cada punto contra el anterior.
    // Se calcula aquí y no en el navegador para que el gráfico de tendencia y
    // la tarjeta no puedan discrepar: una sola aritmética, un solo resultado.
    const serie = lista.map(function (p, i) {
      return {
        fecha: p.fecha,
        valor: p.valor,
        variacion: i === 0 ? null : redondear_(p.valor - lista[i - 1].valor)
      };
    });

    salida[clave] = {
      actual: actual,
      anterior: anterior,
      variacion: (actual && anterior) ? redondear_(actual.valor - anterior.valor) : null,
      registros: lista.length,
      serie: serie
    };
  });
  return salida;
}

/* ── Detalle de la revisión ─────────────────────────────────────────────── */

/**
 * Junta en una sola lista el detalle de las tres hojas, con la forma que la
 * vista de base de datos y las dos tablas de análisis esperan.
 */
function recopilarRegistros_(productos, procesos, fichas, campos, codigos) {
  const filas = [];
  const cobertura = { Producto: {}, Proceso: {}, SubProceso: {}, Ficha: {},
                      Campo: {}, Codigo: {} };
  // Recuento por facultad de las dos tarjetas nuevas del Anexo 3. Se lleva
  // aquí porque es la única pasada que recorre el detalle, y contar dos veces
  // lo mismo es cómo acaban discrepando la tarjeta y su tabla.
  const porFacultad = {};
  const anota = function (sigla, grupo, estado) {
    const f = codigoFacultad_(sigla);
    if (!f) return;
    if (!porFacultad[f]) porFacultad[f] = {
      fichas:  { conformes: 0, observados: 0, sinRegistrar: 0, critico: 0, total: 0 },
      campos:  { conformes: 0, observados: 0, sinRegistrar: 0, critico: 0, total: 0 },
      codigos: { conformes: 0, observados: 0, total: 0 }
    };
    const caja = porFacultad[f][grupo];
    caja.total++;
    if (estado === 'CONFORME')           caja.conformes++;
    else if (estado === 'OBSERVADO')     caja.observados++;
    else if (estado === 'SIN REGISTRAR') caja.sinRegistrar++;
    else if (estado === 'CRITICO')       caja.critico++;
  };
  let id = 0, recortadas = 0;

  const meter = function (entidad, fila) {
    if (!fila.faculty) return;
    cobertura[entidad][fila.faculty] = true;
    if (filas.length >= TABLERO.MAX_REGISTROS) { recortadas++; return; }
    fila.id = ++id;
    fila.entity = entidad;
    filas.push(fila);
  };

  // DETALLADO_PRODUCTOS_A1
  productos.forEach(function (f) {
    meter('Producto', {
      anexo: 'Anexo 1', faculty: codigoFacultad_(f[0]), row: texto_(f[1]),
      process: texto_(f[2]), code: texto_(f[3]), name: texto_(f[4]),
      type: texto_(f[5]), status: texto_(f[6]), compliance: texto_(f[7]),
      criteria: texto_(f[8]), observations: texto_(f[9])
    });
  });

  // OBSERVACIONES_DE_PROCESO_A1 — la columna NIVEL separa proceso de subproceso
  procesos.forEach(function (f) {
    const nivel = texto_(f[3]);
    meter(/sub/i.test(nivel) ? 'SubProceso' : 'Proceso', {
      anexo: 'Anexo 1', faculty: codigoFacultad_(f[0]), row: texto_(f[5]),
      process: texto_(f[2]), code: texto_(f[1]), name: texto_(f[2]),
      type: nivel, status: texto_(f[6]), compliance: texto_(f[7]),
      criteria: texto_(f[8]), observations: texto_(f[9])
    });
  });

  // RESUMEN_FICHAS_A3 — la tarjeta «Fichas»
  fichas.forEach(function (f) {
    // Su columna CLASIFICACIÓN la escribe el mismo auditor y con los mismos
    // rótulos que el detalle, así que la ficha se clasifica igual que el
    // campo. Si esa columna viniera vacía, se recae en el «¿COMPLETA?» de
    // toda la vida, que solo distingue dos estados.
    const estado = estadoDeCampo_(f[10]) ||
                   (/^s[ií]/i.test(texto_(f[4])) ? 'CONFORME' : 'OBSERVADO');
    anota(f[0], 'fichas', estado);
    meter('Ficha', {
      anexo: 'Anexo 3', faculty: codigoFacultad_(f[0]), row: '',
      process: texto_(f[2]), code: texto_(f[3]), name: texto_(f[2]),
      type: texto_(f[10]), status: estado,
      compliance: porcentajeTexto_(f[5]), criteria: texto_(f[9]),
      observations: texto_(f[11])
    });
  });

  // DETALLE_REVISION_A3 — la tarjeta «Fichas / Campos»
  campos.forEach(function (f) {
    const estado = estadoDeCampo_(f[9]);
    if (!estado) return;                       // «Opcional» no cuenta
    anota(f[0], 'campos', estado);
    meter('Campo', {
      anexo: 'Anexo 3', faculty: codigoFacultad_(f[0]), row: texto_(f[5]),
      process: texto_(f[2]), code: texto_(f[7]), name: texto_(f[4]),
      type: texto_(f[3]), status: estado, compliance: texto_(f[8]),
      criteria: texto_(f[6]), observations: texto_(f[10])
    });
  });

  // REGISTRO_MAESTRO_CODIGOS_A3 — la tarjeta «Códigos»
  codigos.forEach(function (f) {
    const estado = estadoDeCodigo_(f[6]);
    if (!estado) return;
    anota(f[0], 'codigos', estado);
    meter('Codigo', {
      anexo: 'Anexo 3', faculty: codigoFacultad_(f[0]), row: '',
      process: texto_(f[5]), code: texto_(f[3]), name: texto_(f[4]),
      type: texto_(f[2]), status: estado, compliance: texto_(f[6]),
      criteria: '', observations: texto_(f[7])
    });
  });

  const cuenta = {};
  Object.keys(cobertura).forEach(function (k) {
    cuenta[k] = Object.keys(cobertura[k]).length;
  });

  return { filas: filas, cobertura: cuenta, recorte: recortadas,
           porFacultad: porFacultad };
}

/** El detalle nombra la facultad por su sigla; el tablero, por su código. */
function codigoFacultad_(valor) {
  const s = String(valor || '').trim().toUpperCase();
  if (/^F\d\d_/.test(s)) return s;                       // ya viene como F01_FM
  const f = CATALOGO_VIGENTE.filter(function (x) { return x[0] === s; })[0];
  return f ? f[1] + '_' + f[0] : '';
}

/**
 * El catálogo que rige la corrida en curso. Lo fija `leerCatalogo_`, y hasta
 * entonces vale el del código: así `codigoFacultad_` funciona igual si alguna
 * vez se le llama antes de leer el libro.
 */
let CATALOGO_VIGENTE = TABLERO.FACULTADES;

/** De dónde salió el catálogo en la última lectura. Lo informa probarTablero. */
let CATALOGO_ORIGEN = 'el catálogo escrito en Tablero.gs';

/**
 * Catálogo de facultades desde la hoja `CODIFICACION_ DE_LAS_FACULTADES`, que
 * es donde la OGPL lo mantiene. Se prefiere al del código porque una
 * renumeración —como la que movió FII a F17 y FISI a F20— se hace ahí, y no
 * tendría que obligar a volver a publicar la aplicación web.
 *
 * Las columnas se localizan por su encabezado, no por su posición: añadir una
 * columna a la izquierda es lo más normal del mundo en una hoja que se edita a
 * mano, y no debería descolocar el tablero.
 *
 * Si la hoja falta, o no da las 20 facultades, se conserva el catálogo del
 * código: es preferible una numeración de hace un mes a un tablero vacío.
 */
function leerCatalogo_(libro) {
  CATALOGO_ORIGEN = 'el catálogo escrito en Tablero.gs';
  CATALOGO_VIGENTE = TABLERO.FACULTADES;

  const hoja = buscarHoja_(libro, TABLERO.HOJAS.CATALOGO);
  if (!hoja || hoja.getLastRow() < 2) {
    CATALOGO_ORIGEN += ' (la hoja de codificación no aparece)';
    return TABLERO.FACULTADES;
  }

  const datos = hoja.getDataRange().getValues();
  const cab = datos[0].map(esqueleto_);
  const col = function (varias) {
    for (let i = 0; i < cab.length; i++) {
      for (let j = 0; j < varias.length; j++) {
        if (cab[i].indexOf(varias[j]) !== -1) return i;
      }
    }
    return -1;
  };

  const iSigla  = col(['SIGLA']);
  const iNombre = col(['FACULTAD', 'NOMBRE', 'DENOMINACION']);
  const iCodigo = col(['CODIGO', 'FORMULARIO']);
  if (iSigla === -1 || iCodigo === -1) {
    CATALOGO_ORIGEN += ' (la hoja no trae columnas de SIGLA y CÓDIGO)';
    return TABLERO.FACULTADES;
  }

  const filas = [];
  const vistas = {};
  for (let f = 1; f < datos.length; f++) {
    const sigla = String(datos[f][iSigla] || '').trim().toUpperCase();
    // El código puede venir como "F01" o como "F01_FM": interesa el número.
    const bruto = String(datos[f][iCodigo] || '').trim().toUpperCase();
    const m = bruto.match(/F\s*0*(\d{1,2})/);
    if (!sigla || !m || esTotal_(sigla) || vistas[sigla]) continue;
    vistas[sigla] = true;
    filas.push([sigla,
                'F' + ('0' + m[1]).slice(-2),
                iNombre === -1 ? sigla : String(datos[f][iNombre] || sigla).trim()]);
  }

  // La hoja se edita a mano y trae más filas de las que son facultades: una de
  // TOTAL, un pie, alguna repetida. Exigir un número exacto la descartaba
  // entera y en silencio, que es peor que quedarse con alguna de más. Basta
  // con que salgan las 20 y ninguna sigla se repita.
  if (filas.length < TABLERO.FACULTADES.length) {
    CATALOGO_ORIGEN += ' (la hoja solo dio ' + filas.length + ' facultades de ' +
                       TABLERO.FACULTADES.length + ')';
    return TABLERO.FACULTADES;
  }

  // El orden del tablero es el del número de formulario, no el de la hoja.
  filas.sort(function (a, b) { return a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0); });
  CATALOGO_VIGENTE = filas;
  CATALOGO_ORIGEN = 'la hoja ' + hoja.getName() + ' (' + filas.length + ' facultades)';
  return filas;
}

/* ── Anexo 4 e histórico ────────────────────────────────────────────────── */

/**
 * Indicadores del Anexo 4. La hoja no tiene todavía un formato cerrado, así
 * que se busca el estado en cualquier columna en lugar de fiarlo a una
 * posición: si mañana se le añade una columna, esto sigue contando bien.
 */
function leerAnexo4_(filas, pctDeLaHoja) {
  let aprobados = 0, total = 0;

  filas.forEach(function (f) {
    // La hoja cierra con una fila de totales, y contarla como un indicador más
    // desplaza el porcentaje sin que nada lo delate. Tampoco cuentan las filas
    // en blanco que quedan al final de una hoja editada a mano.
    if (esTotal_(primeraCelda_(f)) || f.join('').trim() === '') return;
    total++;
    const linea = f.join(' ').toLowerCase();
    if (/aprobado|conforme|cumple|validado/.test(linea)) aprobados++;
  });

  // El porcentaje sale de la celda cuando la hoja lo tiene calculado: allí está
  // ponderado, mientras que contar aprobados sobre el total trata por igual a
  // indicadores que no pesan lo mismo. El recuento se conserva como respaldo y
  // porque el tablero muestra «N de M» junto al porcentaje.
  const contado = total ? redondear_((aprobados / total) * 100) : 0;

  return {
    aprobados: aprobados,
    indicadores: total,
    pct: pctDeLaHoja === null ? contado : pctDeLaHoja,
    pctContado: contado,
    origenPct: pctDeLaHoja === null
      ? 'recuento de aprobados (la celda ' + TABLERO.CELDA_PCT_A4 + ' está vacía)'
      : 'la celda ' + TABLERO.CELDA_PCT_A4 + ' de ' + TABLERO.HOJAS.A4
  };
}

/**
 * Lee una celda suelta como porcentaje. Devuelve null si la hoja o la celda no
 * dan un número, para que quien llame decida con qué respaldo sigue en lugar
 * de quedarse con un cero que parece un dato.
 */
function leerCeldaPct_(libro, nombreHoja, celda) {
  try {
    const hoja = buscarHoja_(libro, nombreHoja);
    if (!hoja) return null;
    return pct_(hoja.getRange(celda).getValue());
  } catch (e) {
    return null;      // la celda cae fuera de la hoja, o no se puede leer
  }
}

/**
 * Primera celda con algo escrito. El rótulo de una fila de cierre no siempre
 * cae en la columna A: la hoja del Anexo 4 la deja en blanco y escribe
 * «TOTAL DE INDICADORES» en la siguiente.
 */
function primeraCelda_(fila) {
  for (let i = 0; i < fila.length; i++) {
    const v = String(fila[i] === null || fila[i] === undefined ? '' : fila[i]).trim();
    if (v) return v;
  }
  return '';
}

/**
 * Fecha de una celda, o null. Además de lo que `new Date` entiende, admite el
 * formato en que se escribe a mano en el Perú —«28/08/2026», día primero—,
 * que `new Date` interpreta al revés o directamente rechaza.
 */
function fechaDeCelda_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  const s = String(v === null || v === undefined ? '' : v).trim();
  if (!s) return null;

  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[\s,]+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]),
                       Number(m[4] || 0), Number(m[5] || 0));
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Reconoce las filas de cierre que las hojas llevan al pie. */
function esTotal_(valor) {
  return /^(TOTAL|TOTALES|PROMEDIO|GENERAL|RESUMEN|SUMA|LEYENDA)\b/i
           .test(String(valor || '').trim());
}

/**
 * HISTORIAL_REVISIONES, agrupado por momento de corrida. El tablero compara la
 * última con la anterior para pintar la variación, así que bastan las dos
 * últimas; se devuelven en orden cronológico.
 */
function leerHistorial_(filas, anexo4) {
  const porFecha = {};
  filas.forEach(function (f) {
    const fecha = f[0] instanceof Date ? f[0] : new Date(f[0]);
    if (isNaN(fecha.getTime())) return;
    const clave = fecha.toISOString();
    if (!porFecha[clave]) porFecha[clave] = { fecha: clave };
    const anexo = String(f[1] || '').toLowerCase();
    const valor = num_(f[2]);
    if (anexo.indexOf('1') !== -1) porFecha[clave].anexo1 = valor;
    if (anexo.indexOf('3') !== -1) porFecha[clave].anexo3 = valor;
    if (anexo.indexOf('4') !== -1) porFecha[clave].anexo4 = valor;
  });

  const claves = Object.keys(porFecha).sort();
  const dos = claves.slice(-2).map(function (k, i, arr) {
    const r = porFecha[k];
    r.etiqueta = (i === arr.length - 1) ? 'Revisión actual' : 'Revisión anterior';
    return r;
  });

  if (!dos.length) {
    return [{ etiqueta: 'Revisión anterior', fecha: null, anexo4: anexo4.pct }];
  }
  if (dos.length === 1) {
    return [{ etiqueta: 'Revisión anterior', fecha: null }, dos[0]];
  }
  return dos;
}

/* ── Conversiones ───────────────────────────────────────────────────────── */

function texto_(v) { return v === null || v === undefined ? '' : String(v).trim(); }

function num_(v) {
  const n = Number(String(v === null || v === undefined ? '' : v).replace('%', '').trim());
  return isNaN(n) ? 0 : n;
}

/**
 * Los avances se escriben con formato 0.0%, así que la celda vale 0.813 y no
 * 81.3. Un número menor o igual a 1 se toma por fracción; por encima ya viene
 * en puntos porcentuales. El texto "81.3%" también se admite.
 */
function pct_(v) {
  if (v === null || v === undefined || v === '' || v === '—') return null;
  if (typeof v === 'number') return redondear_(v <= 1 ? v * 100 : v);
  const s = String(v).trim();
  if (!s || s === '—') return null;
  const n = Number(s.replace('%', '').replace(',', '.').trim());
  if (isNaN(n)) return null;
  return redondear_(s.indexOf('%') !== -1 ? n : (n <= 1 ? n * 100 : n));
}

function porcentajeTexto_(v) {
  const p = pct_(v);
  return p === null ? '' : p + '%';
}

function redondear_(n) { return Math.round(n * 10) / 10; }

/* ══════════════════════ COMPROBACIÓN DESDE EL EDITOR ══════════════════════ */

/**
 * Ejecútese desde el editor para ver, sin pasar por la web, qué hojas
 * encuentra y qué cifras saca de ellas. Ver › Registros muestra el resultado.
 */
function probarTablero() {
  const libro = SpreadsheetApp.openById(TABLERO.LIBRO_ID);
  const lineas = ['════════ TABLERO EN VIVO ════════',
                  'Libro: ' + libro.getName(), ''];

  const usadas = {};
  lineas.push('Hojas que el tablero NECESITA:');
  Object.keys(TABLERO.HOJAS).forEach(function (k) {
    const nombre = TABLERO.HOJAS[k];
    const hoja = buscarHoja_(libro, nombre);
    if (hoja) usadas[hoja.getName()] = true;
    lineas.push('  ' + (hoja ? '✓' : '✗') + '  ' + nombre +
                (hoja ? '  (' + Math.max(0, hoja.getLastRow() - 1) + ' filas)'
                      : '  — NO EXISTE: ejecute la auditoría que la genera'));
  });

  // Sin esto, ver nueve hojas listadas y once en el libro parece que falta
  // algo. No falta: el tablero no necesita las otras dos.
  const sobrantes = libro.getSheets()
    .map(function (h) { return h.getName(); })
    .filter(function (n) { return !usadas[n]; });
  lineas.push('');
  lineas.push('Otras hojas del libro, que el tablero NO usa: ' +
              (sobrantes.length ? '' : '(ninguna)'));
  sobrantes.forEach(function (n) { lineas.push('  ·  ' + n); });
  lineas.push('  Es normal que existan. Ninguna cifra del tablero sale de ellas.');

  const d = tablero({ sinCache: true });
  lineas.push('');
  lineas.push('KPI · general ' + d.kpi.general + '%  ·  Anexo 1 ' + d.kpi.anexo1 +
              '%  ·  Anexo 3 ' + d.kpi.anexo3 + '%  ·  Anexo 4 ' + d.kpi.anexo4 + '%');
  lineas.push('    (las hojas por su cuenta dan: Anexo 1 ' + d.kpi.hojas.anexo1 +
              '%  ·  Anexo 3 ' + d.kpi.hojas.anexo3 +
              '%  ·  Anexo 4 ' + d.kpi.hojas.anexo4 + '%)');
  lineas.push('    Orden de preferencia: HISTORIAL_REVISIONES › celda ' +
              TABLERO.CELDA_PCT_A4 + ' (solo A4) › cálculo de las hojas.');
  lineas.push('');
  lineas.push('Catálogo tomado de: ' + CATALOGO_ORIGEN);
  lineas.push('Facultades: ' + d.facultades.length +
              '  ·  con avance: ' + d.facultades.filter(function (f) {
                return f.pctGeneral > 0; }).length);
  lineas.push('Anexo 4: ' + d.kpi.anexo4 + '%  ·  tomado de ' + d.anexo4.origenPct);
  lineas.push('   (' + d.anexo4.aprobados + ' aprobados de ' + d.anexo4.indicadores +
              ' indicadores da ' + d.anexo4.pctContado + '%, que es el respaldo)');
  lineas.push('Registros de detalle: ' + d.registros.length +
              (d.recorte ? '  ¡+' + d.recorte + ' RECORTADOS! Suba TABLERO.MAX_REGISTROS'
                         : '  (ninguno recortado: viaja el libro entero)'));
  lineas.push('Caché: ' + (d.enCache === false
    ? 'no cabe (>100 KB), cada consulta relee el libro — es lo esperado con el detalle completo'
    : 'guardada ' + TABLERO.CACHE_SEG + ' s'));
  lineas.push('Cobertura: ' + JSON.stringify(d.cobertura));
  // Volcado literal de la hoja: cuando una fila «no aparece», lo que hace
  // falta es ver qué pone exactamente y cómo se ha clasificado, no adivinarlo.
  lineas.push('');
  lineas.push('HISTORIAL_REVISIONES, fila por fila (columnas A, B y C):');
  const hojaHist = buscarHoja_(libro, TABLERO.HOJAS.HISTORIAL);
  if (!hojaHist) {
    lineas.push('  (la hoja no aparece)');
  } else {
    const crudo = hojaHist.getDataRange().getValues();
    crudo.forEach(function (f, i) {
      if (i === 0) { lineas.push('  fila 1 (cabecera): ' + f.slice(0, 3).join(' | ')); return; }
      const fecha = fechaDeCelda_(f[0]);
      const texto = String(f[1] || '');
      const clave = /fase\s*1/i.test(texto) ? 'Fase 1'
                  : /4/.test(texto) ? 'Anexo 4'
                  : /3/.test(texto) ? 'Anexo 3'
                  : /1/.test(texto) ? 'Anexo 1' : null;
      const valor = pct_(f[2]);
      lineas.push('  fila ' + (i + 1) + ': A=«' + f[0] + '»  B=«' + texto +
                  '»  C=«' + f[2] + '»' +
                  '   →  ' + (clave ? clave : 'NO CLASIFICADA (la columna B no dice fase 1 ni 1/3/4)') +
                  ', ' + (valor === null ? 'SIN VALOR (la columna C no da un número)' : valor + '%') +
                  ', ' + (fecha ? 'fecha ok' : 'sin fecha legible → ordena por su posición'));
    });
  }

  lineas.push('');
  lineas.push('% Avance Fase 1: ' + d.kpi.general + '%  ·  tomado de ' + d.kpi.origenFase1);

  lineas.push('');
  lineas.push('HISTORIAL_REVISIONES, anexo por anexo:');
  ['fase1', 'anexo1', 'anexo3', 'anexo4'].forEach(function (k) {
    const h = d.historial[k];
    if (!h || !h.actual) {
      lineas.push('  ' + k + ': sin registros — la tarjeta usará el cálculo de las hojas');
      return;
    }
    lineas.push('  ' + k + ': ' + h.actual.valor + '%  (' + h.actual.fecha + ')' +
      (h.anterior
        ? '   anterior ' + h.anterior.valor + '%  (' + h.anterior.fecha + ')' +
          '   variación ' + (h.variacion >= 0 ? '+' : '') + h.variacion + ' pp'
        : '   sin revisión anterior') +
      '   ·  ' + h.registros + ' registro(s)');
  });
  lineas.push('═════════════════════════════════');

  const texto = lineas.join('\n');
  Logger.log(texto);
  return texto;
}
