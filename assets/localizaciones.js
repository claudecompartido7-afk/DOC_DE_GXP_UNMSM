/**
 * Localización de cada hallazgo dentro de su documento de origen
 * ---------------------------------------------------------------
 * Para cada hallazgo del diagnóstico y cada fila de la matriz de
 * contradicciones se declara DÓNDE está exactamente el problema:
 *
 *   d  documento (D1…D4)
 *   r  ruta de navegación dentro del documento
 *   a  texto ancla · cadena literal que existe en el documento y sirve
 *      para localizarlo con Ctrl+F. Es el ancla exacta.
 *   c  celda o rango (sólo hojas de cálculo). Permite saltar directamente.
 *   n  qué mirar al llegar
 *
 * Las referencias de celda del D2 se derivaron del contenido real de la
 * hoja: filas 1-3 son los banners combinados, la 4 es la de encabezados
 * y el detalle empieza en la 5. Si alguien inserta filas, el número deja
 * de coincidir pero el texto ancla sigue siendo válido: por eso se
 * declaran los dos.
 */
window.GXP_DOCS = {
  D1: { nombre: '1_PLAN_GESTIÓN_DE_ALCANCE_UNMSM',
        corto: 'Plan de Gestión del Alcance',
        tipo: 'documento',
        id: '1h2cyZdeCKL6v-Uzs3gzcEeqYL0P-7BhEEFhKuXq441E' },
  D2: { nombre: '2_PLAN DE GESTIÓN DEL CRONOGRAMA — CRONOGRAMA DETALLADO (GANTT)',
        corto: 'Cronograma (GANTT)',
        tipo: 'hoja',
        id: '1ae81piYD6ZcAR8NGyCQ_ve3qV3uP6s9R-7joEP-d5q0' },
  D3: { nombre: '3_BITÁCORA DE LA IMPLEMENTACIÓN (Hoja de Google)',
        corto: 'Bitácora de implementación',
        tipo: 'hoja',
        id: '1yz-Lb01caegVfdzGeT0ahKGGnxx5Axo8pxClcXw8deE' },
  D4: { nombre: '4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES',
        corto: 'Revisión interna de avances',
        tipo: 'hoja',
        id: '1oYBAHp-Bd0V8un5hUAWdK1jKbcbdsROH4IOyM0MAmFk' }
};

window.GXP_LOC = {

/* ---------- D1 · Plan de Gestión del Alcance ---------- */

'D1-01': [
  { d:'D1', r:'§2 Enunciado del Alcance › tabla «Dentro / Fuera» › fila 6',
    a:'Documentación de lo Procesos por parte de la Facultad',
    n:'Columna izquierda. En la misma fila, a la derecha, dice «Documentación de los Procesos»: la misma actividad declarada dentro y fuera.' },
  { d:'D1', r:'§3 Redacción de la Definición del Alcance › último párrafo',
    a:'Tampoco se abordará la automatización informática de los procesos',
    n:'El párrafo de exclusiones repite la ambigüedad en prosa.' }
],
'D1-02': [
  { d:'D1', r:'§2 Enunciado del Alcance › columna «Fuera del alcance» › fila 8',
    a:'Automatización de los procesos',
    n:'La exclusión no distingue entre automatizar SIGPRO y automatizar los procesos de las facultades.' },
  { d:'D2', r:'Fase 1 › Etapa 1.3 › Actividad 1.3.4 Desarrollo de SIGPRO', c:'D27',
    a:'AUTOMATIZACIÓN CULMINADA',
    n:'Tarea del 23/11/2026 al 30/11/2026, estado Pendiente. Es la tarea que contradice la exclusión del D1.' }
],
'D1-03': [
  { d:'D1', r:'§3 Redacción de la Definición del Alcance › párrafo 3',
    a:'Para la Fase 2, el trabajo se enfocará en la diagramación',
    n:'El mismo párrafo sitúa el despliegue de SIGPRO en la Fase 2.' },
  { d:'D2', r:'Fase 1 › Etapa 1.3 › Actividad 1.3.4', c:'C22:C27',
    a:'Actividad 1.3.4: Desarrollo de SIGPRO',
    n:'Las seis tareas de SIGPRO están dentro de la Fase 1, no de la Fase 2.' }
],
'D1-04': [
  { d:'D1', r:'§4 Estructura de Desglose del Trabajo (EDT)',
    a:'Estructura de Desglose',
    n:'La EDT llega a 3 niveles y sus celdas están desalineadas en los niveles 2 y 3.' },
  { d:'D2', r:'Fila de encabezados del cronograma', c:'A4:D4',
    a:'Fase (Nivel 1)',
    n:'El cronograma declara cuatro niveles: Fase, Etapa, Actividad, Tarea.' }
],
'D1-05': [
  { d:'D1', r:'§ Control de cambios del alcance › tabla de pasos',
    a:'Aprobación de MAPA DE PROCESOS',
    n:'Este paso está numerado 5 y su celda de responsable está vacía. El paso siguiente también está numerado 5.' }
],
'D1-06': [
  { d:'D1', r:'§ Matriz RACI › filas «Aprobar el MAGPROF» y «MAPRO»',
    a:'Aprobar el MAGPROF',
    n:'Hay una A en la columna del Decano y otra A en la del Jefe de OGPL, en la misma fila.' }
],
'D1-07': [
  { d:'D1', r:'§ Matriz de trazabilidad de requisitos › encabezados',
    a:'RQ-01',
    n:'Recorra los encabezados: no existe columna que apunte a la EDT ni a una tarea del cronograma.' }
],
'D1-08': [
  { d:'D1', r:'§ Matriz de trazabilidad › fila RQ-03',
    a:'Ficha de los Indicadores',
    n:'Estado escrito a mano «En curso».' },
  { d:'D2', r:'Fase 1 › Etapa 1.3 › Actividad 1.3.2 Indicadores', c:'C16:H20',
    a:'Actividad 1.3.2: Indicadores',
    n:'Cuatro tareas Culminado y una En Proceso: el estado del requisito no se puede conciliar con esto.' }
],
'D1-09': [
  { d:'D1', r:'Encabezado del documento › tabla de identificación',
    a:'Componente del PDD',
    n:'Dice «Plan de Gestión del Alcance». No existen los planes de las otras nueve áreas del PMBOK.' }
],

/* ---------- D2 · Cronograma (GANTT) ---------- */

'D2-01': [
  { d:'D2', r:'Banner superior › fila 3 de indicadores', c:'M3',
    a:'% AVANCE DEL PROYECTO: 78%',
    n:'El rótulo dice «del proyecto», pero el cálculo (6+1)÷9 corresponde sólo a las actividades de la Fase 1.' },
  { d:'D2', r:'Tabla resumen al pie de la hoja', c:'A62:D65',
    a:'Fase 1: Identificación',
    n:'6 culminadas · 1 en proceso · 2 pendientes = 9 actividades. De aquí sale el 78%.' }
],
'D2-02': [
  { d:'D2', r:'Banner superior › contadores', c:'A3:L3',
    a:'CULMINADO: 6 de 18',
    n:'«de 18» son actividades; el detalle de la hoja lista 35 tareas.' }
],
'D2-03': [
  { d:'D2', r:'Fase 1 › Actividad 1.3.4 › tarea de sistema completo', c:'D23',
    a:'DESARROLLO DEL SISTEMA COMPLETADO',
    n:'Inicia el 25/06/2026 (columna E). La tarea Front-End, que lo compone, inicia el 01/09/2026 en la fila anterior.' },
  { d:'D2', r:'Fase 1 › Actividad 1.3.4 › front-end', c:'D22',
    a:'Front-End culminado',
    n:'01/09/2026 al 25/09/2026. Debería preceder al sistema completo, no seguirlo.' }
],
'D2-04': [
  { d:'D2', r:'Fase 1 › Actividad 1.3.2 › cierre de fase', c:'D30',
    a:'Cierre de Fase 1 (Cierre 30 Oct)',
    n:'El nombre dice 30 de octubre; las columnas E y F dicen 01/10 al 03/10; el D1 fija el 30/09. Tres fechas para el mismo hito.' }
],
'D2-05': [
  { d:'D2', r:'Fase 1 › Etapa 1.3 › columna Tarea', c:'D21:D27',
    a:'Tarea 1.3.1.2',
    n:'Use Ctrl+F: el mismo código aparece en siete filas, desde el llenado de fichas hasta las seis tareas de SIGPRO.' }
],
'D2-06': [
  { d:'D2', r:'Fase 1 › Etapa 1.3 › columna Actividad', c:'C16:C30',
    a:'Actividad 1.3.2',
    n:'El código 1.3.2 rotula «Indicadores» en la fila 16 y «Consolidación Fase 1» en la fila 30. A su vez «Consolidación Fase 1» aparece como 1.3.2, 1.3.5 y 1.3.6.' }
],
'D2-07': [
  { d:'D2', r:'Fase 1 › columna Etapa › primeras filas', c:'B5:B8',
    a:'Etapa 1.1: Inicio',
    n:'La fila 5 dice «Etapa 1.1: Inicio»; las filas 6, 7 y 8 dicen «Etapa 1.1: Sensibilización».' }
],
'D2-08': [
  { d:'D2', r:'Fase 1 › Actividad 1.3.2 Indicadores', c:'D19:D20',
    a:'Tarea 1.3.2.4',
    n:'Dos filas consecutivas con el mismo código: una de 1 día Culminado, otra de 28 días En Proceso.' }
],
'D2-09': [
  { d:'D2', r:'Fila de encabezados de la tabla', c:'A4:H4',
    a:'Duración (Días)',
    n:'Después de Estado empiezan las bandas mensuales: no hay Responsable, ni Predecesora, ni Hito, ni % de avance.' }
],
'D2-10': [
  { d:'D2', r:'Fase 1 › Etapa 1.1 › primera tarea', c:'E5',
    a:'Analisis  de la doumentación de la Nueva Norma',
    n:'Inicia el 01/06/2025, pero la primera banda mensual del Gantt (columna I) es Jul 2025.' },
  { d:'D2', r:'Encabezado de las bandas del Gantt', c:'I4',
    a:'Jul 2025',
    n:'Primera columna del gráfico. Junio de 2025 no existe en el rango.' }
],
'D2-11': [
  { d:'D2', r:'Banner superior › subtítulo', c:'A2',
    a:'Estado al 24 de julio de 2026',
    n:'La fecha de última modificación del archivo en Drive es posterior en un mes.' }
],

/* ---------- D3 · Bitácora de implementación ---------- */

'D3-01': [
  { d:'D3', r:'Bitácora › bloque de indicadores de PE.01',
    a:'Determinación del Indicador Estándar de PE.01',
    n:'Aquí la tarea padre es «Tarea 1.3.1.2».' },
  { d:'D2', r:'Fase 1 › Actividad 1.3.2 Indicadores', c:'D16',
    a:'Determinacion de lo Indicador  Estadar de PE.01',
    n:'La misma tarea, en el cronograma, es «Tarea 1.3.2.1». Los dos códigos no coinciden.' }
],
'D3-02': [
  { d:'D3', r:'Bitácora › columna de subtareas › bloques PE.01 y PE.02',
    a:'Sub Tarea 1',
    n:'Ctrl+F sobre esta cadena: aparece en decenas de filas sin correlativo que las distinga.' }
],
'D3-03': [
  { d:'D3', r:'Bitácora › segundo bloque de subtareas',
    a:'Subtarea 31',
    n:'Tres filas con este código y contenidos distintos. Lo mismo con «Subtarea 33» y «Subtarea 35».' }
],
'D3-04': [
  { d:'D3', r:'Bitácora › encabezado de la hoja',
    a:'1/3/2026',
    n:'Declarado como inicio del proyecto.' },
  { d:'D2', r:'Fase 1 › primera tarea del cronograma', c:'E5',
    a:'01/06/2025',
    n:'El cronograma arranca nueve meses antes. Todos los cálculos de semana de la bitácora parten de la fecha equivocada.' }
],
'D3-05': [
  { d:'D3', r:'Bitácora › fila de encabezados de fecha del Gantt',
    a:'#NAME?',
    n:'Error en todas las columnas de fecha: funciones de la plantilla Vertex42 de Excel que Sheets no reconoce.' }
],
'D3-06': [
  { d:'D3', r:'Bitácora › columna de observaciones',
    a:'Toma de la Universidad',
    n:'Del 11 al 22/05/2026. La otra paralización es «Reorganización del personal», del 12 al 31/07/2026.' },
  { d:'D2', r:'Cronograma › columnas de fechas', c:'E5:F39',
    a:'Fecha de Inicio',
    n:'Ninguna fecha del cronograma refleja los ~32 días hábiles perdidos por las dos paralizaciones.' }
],
'D3-07': [
  { d:'D3', r:'Bitácora › columna de observaciones',
    a:'Solo 6 facultades',
    n:'Riesgo de dependencia externa ya materializado, anotado como comentario suelto. Busque también «VRAP» y «OCCAA».' }
],
'D3-08': [
  { d:'D3', r:'Pestañas del libro',
    a:'Bizagi',
    n:'En el mismo archivo conviven la bitácora, el cronograma de visitas, la capacitación de marzo en Bizagi y la relación de participantes.' }
],
'D3-09': [
  { d:'D3', r:'Bitácora › bloque rotulado PE.03',
    a:'Porcentaje de Convenios Activos',
    n:'Este indicador es de PM.02 Investigación, pero está bajo el encabezado de PE.03. Busque también la errata «Interinstitucionalesc».' }
],
'D3-10': [
  { d:'D3', r:'Bitácora › columnas de fecha',
    a:'9-3-26',
    n:'Formato d-m-aa.' },
  { d:'D2', r:'Cronograma › columna Fecha de Inicio', c:'E16',
    a:'02/03/2026',
    n:'Formato dd/mm/aaaa. Al importar, d-m-aa puede leerse como m-d-aa e invertir día y mes.' }
],

/* ---------- D4 · Revisión interna de avances ---------- */

'D4-01': [
  { d:'D4', r:'Tablero de avance › fila de la FCM',
    a:'FCM',
    n:'191 completos, 0 observados, 0 pendientes = 100%. En la misma fila: «Faltan 1 procesos de Nivel 0 obligatorios: PS.10».' },
  { d:'D4', r:'Tablero de avance › fila de la FPSIC',
    a:'FPSIC',
    n:'89% con PS.10 igualmente ausente. El denominador es lo cargado, no lo exigible.' }
],
'D4-02': [
  { d:'D4', r:'Pestaña de la Facultad de Medicina › columna de código de producto',
    a:'PE.02.02.05_F01',
    n:'Es el registro de PE.03. Busque también PE.02.02.16_F01, PE.02.02.36_F01 y PE.02.02.52_F01: toda la facultad cuelga del prefijo PE.02 y el validador la marca CONFORME.' }
],
'D4-03': [
  { d:'D4', r:'Pestaña de la FCF › columna de sufijo de formulario',
    a:'_F02',
    n:'Ese sufijo pertenece a la FDCP. La observación del tablero lo rotula «FORMULARIO AJENO».' }
],
'D4-04': [
  { d:'D4', r:'Tablero de avance › observaciones de la FPSIC',
    a:'se toma el dominante de la pestaña',
    n:'El código de facultad se dedujo de los datos porque no está declarado en ninguna fuente autorizada.' }
],
'D4-05': [
  { d:'D4', r:'Tablero de avance › columnas del Anexo 2',
    a:'A.2 COMPLETADO',
    n:'Se sigue midiendo un anexo que el Anexo 1 declara sin uso. Busque también la regla especial A2↔A3.' },
  { d:'D2', r:'Fase 1 › Actividad 1.3.3', c:'D21',
    a:'Anexos 1,2, 3',
    n:'El cronograma también sigue programando el llenado del Anexo 2.' }
],
'D4-06': [
  { d:'D4', r:'Tablero de avance › columnas del Anexo 4',
    a:'A.4 COMPLETADO',
    n:'No existe archivo ni regla de validación para un Anexo 4. Las columnas están vacías.' }
],
'D4-07': [
  { d:'D4', r:'Tablero de avance › observaciones de procesos de soporte',
    a:'PS.09',
    n:'Compare la denominación que aparece aquí con la del catálogo maestro: hay un desplazamiento de un dígito en todo el bloque PS.04–PS.10.' },
  { d:'D3', r:'Bitácora › encabezados de proceso',
    a:'PS.04',
    n:'En la bitácora PS.04 aparece como «Recursos Bibliográficos», que en el catálogo oficial es PS.09.' }
]

};

/* Localización de cada fila de la matriz de contradicciones, por documento.
   El índice del arreglo interior corresponde a las columnas D1, D2, D3, D4. */
window.GXP_LOC_MTZ = {
  'Fecha de cierre de la Fase 1': [
    { d:'D1', r:'§3 Definición del Alcance', a:'30 de setiembre de 2026' },
    { d:'D2', r:'Actividad 1.3.2 › cierre', c:'D30', a:'Cierre de Fase 1 (Cierre 30 Oct)' },
    { d:'D3', r:'Bitácora › bloque de validación del MAGPROF', a:'MAGPROF',
      n:'La bitácora cierra la validación el 18/09/2026, doce días antes que el hito del D1.' },
    null ],
  'Fecha de inicio del proyecto': [
    null,
    { d:'D2', r:'Primera tarea del cronograma', c:'E5', a:'01/06/2025' },
    { d:'D3', r:'Encabezado de la bitácora', a:'1/3/2026' },
    null ],
  'Fase en la que vive SIGPRO': [
    { d:'D1', r:'§3 Definición del Alcance › párrafo 3', a:'Plataforma Web Institucional (SIGPRO)' },
    { d:'D2', r:'Fase 1 › Etapa 1.3', c:'C22', a:'Actividad 1.3.4: Desarrollo de SIGPRO' },
    { d:'D3', r:'Bitácora › bloque SIGPRO', a:'SIGPRO' },
    null ],
  'Código del indicador de PE.01': [
    { d:'D1', r:'Matriz de trazabilidad › RQ-03', a:'Ficha de los Indicadores' },
    { d:'D2', r:'Actividad 1.3.2', c:'D16', a:'Tarea 1.3.2.1' },
    { d:'D3', r:'Bitácora › bloque PE.01', a:'Tarea 1.3.1.2' },
    null ],
  'Avance de fase': [
    null,
    { d:'D2', r:'Banner superior', c:'M3', a:'% AVANCE DEL PROYECTO: 78%' },
    null,
    { d:'D4', r:'Tablero de avance › total institucional', a:'63' } ],
  'Vocabulario de estados': [
    { d:'D1', r:'Matriz de trazabilidad › columna Estado', a:'En curso' },
    { d:'D2', r:'Columna Estado', c:'H5:H39', a:'En Proceso' },
    { d:'D3', r:'Bitácora › columna de estado', a:'EN DESARROLLO' },
    { d:'D4', r:'Tablero › columna de estado', a:'OBSERVADO' } ],
  'PS.09 — denominación': [
    null, null,
    { d:'D3', r:'Bitácora › encabezados de proceso', a:'PS.09' },
    { d:'D4', r:'Catálogo de procesos del tablero', a:'PS.09' } ],
  'Vigencia del Anexo 2': [
    null,
    { d:'D2', r:'Actividad 1.3.3', c:'D21', a:'Anexos 1,2, 3' },
    { d:'D3', r:'Bitácora › observaciones', a:'anexo 2' },
    { d:'D4', r:'Tablero › columnas del Anexo 2', a:'A.2 COMPLETADO' } ],
  'Formato de fecha': [
    { d:'D1', r:'§3 Definición del Alcance', a:'30 de setiembre de 2026' },
    { d:'D2', r:'Columna Fecha de Inicio', c:'E16', a:'02/03/2026' },
    { d:'D3', r:'Bitácora › columnas de fecha', a:'9-3-26' },
    null ]
};
