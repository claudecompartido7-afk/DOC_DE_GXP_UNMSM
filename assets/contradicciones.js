/**
 * Resolución de la matriz de contradicciones
 * -------------------------------------------
 * Cada fila de la matriz es un dato que debería ser único en el proyecto y hoy
 * tiene un valor distinto en cada documento. Resolverla no es corregir un
 * documento: es elegir una columna ganadora y propagarla a las demás.
 *
 * Por eso las recomendaciones de una contradicción siguen siempre la misma
 * secuencia, y en ese orden:
 *   1. decidir cuál es el valor correcto y dejarlo en acta;
 *   2. propagarlo a cada documento que hoy discrepa, uno por recomendación,
 *      para que cada corrección tenga su propio responsable y su acuse;
 *   3. impedir que vuelva a divergir (una validación, una regla, una fuente única).
 *
 * Las contradicciones se identifican como MTZ-01 a MTZ-09 y se integran con el
 * resto de la maquinaria: comparten el catálogo de recomendaciones, el visor de
 * localizaciones y el registro en Drive.
 */
(function () {
  'use strict';

  /* Los ítems tienen la misma forma que los hallazgos del diagnóstico, de modo
     que el módulo de decisiones los trate igual sin ningún caso especial. */
  const ITEMS = [
    { c:'MTZ-01', s:'critico', d:['D1','D2','D3'],
      asunto:'Fecha de cierre de la Fase 1',
      h:'Tres fechas distintas para el hito más importante del año',
      gana:'D1 · 30/09/2026',
      pq:'Es el plazo que el Plan de Alcance comprometió institucionalmente. Mientras conviva con el 01–03/10 de las fechas del cronograma y el «Cierre 30 Oct» de su nombre, el Gantt no puede calcular holgura ni ruta crítica.' },

    { c:'MTZ-02', s:'alto', d:['D2','D3'],
      asunto:'Fecha de inicio del proyecto',
      h:'La bitácora arranca el proyecto nueve meses después que el cronograma',
      gana:'D2 · 01/06/2025',
      pq:'Es la fecha de la primera tarea real, el análisis de la Norma Técnica. El 01/03/2026 de la bitácora desplaza todos sus cálculos de semana.' },

    { c:'MTZ-03', s:'critico', d:['D1','D2','D3'],
      asunto:'Fase en la que vive SIGPRO',
      h:'SIGPRO pertenece a la Fase 2 según el alcance y a la Fase 1 según el cronograma',
      gana:'Decisión pendiente del equipo',
      pq:'No hay una columna obviamente correcta: es una decisión de alcance, no un error de transcripción. De ella depende que el retraso de SIGPRO bloquee o no el cierre del 30 de setiembre.' },

    { c:'MTZ-04', s:'alto', d:['D1','D2','D3'],
      asunto:'Código del indicador de PE.01',
      h:'La misma tarea tiene un código en el cronograma y otro en la bitácora',
      gana:'D2 · Tarea 1.3.2.1',
      pq:'El cronograma es la fuente de los códigos de tarea; la bitácora debe heredarlos. Hoy la llama 1.3.1.2, que además es el código reutilizado en otras seis filas.' },

    { c:'MTZ-05', s:'medio', d:['D2','D4'], cerrada:true,
      asunto:'Avance de fase',
      h:'Resuelta · el avance de fase se mide únicamente con la revisión interna',
      gana:'D4 · 63% ponderado por productos',
      pq:'El equipo ya adoptó la regla: el 78% del cronograma mide actividades iniciadas y se reclasificó como ejecución, no como avance. Queda documentarla donde corresponde.' },

    { c:'MTZ-06', s:'critico', d:['D1','D2','D3','D4'],
      asunto:'Vocabulario de estados',
      h:'Los cuatro documentos usan cuatro escalas distintas para decir lo mismo',
      gana:'Diccionario único de cinco estados',
      pq:'Ningún documento tiene hoy la escala correcta: hay que crearla. Sin una tabla común, ningún tablero se consolida automáticamente ni se conecta a SIGPRO.' },

    { c:'MTZ-07', s:'critico', d:['D3','D4'],
      asunto:'PS.09 — denominación',
      h:'PS.09 es Recursos Bibliográficos en un documento y Comunicación en otro',
      gana:'D4 · PS.09 Gestión de Recursos Bibliográficos',
      pq:'Coincide con el catálogo oficial. El desplazamiento de un dígito afecta a todo el bloque PS.04–PS.10, no sólo a PS.09.' },

    { c:'MTZ-08', s:'alto', d:['D2','D3','D4'],
      asunto:'Vigencia del Anexo 2',
      h:'Un anexo declarado sin uso se sigue programando, midiendo y llenando',
      gana:'Anexo 2 derogado',
      pq:'El propio Anexo 1 declara que su contenido se llena ahora allí. Falta el acto formal: mientras no exista, las facultades reciben dos instrucciones opuestas.' },

    { c:'MTZ-09', s:'medio', d:['D1','D2','D3'],
      asunto:'Formato de fecha',
      h:'Tres formatos de fecha conviviendo, uno de ellos ambiguo',
      gana:'D2 · dd/mm/aaaa',
      pq:'Es el único formato no ambiguo de los tres. El d-m-aa de la bitácora puede leerse como m-d-aa al importar e invertir día y mes sin aviso.' }
  ];

  const RECS = {

  'MTZ-01': [
    { t:'Adoptar en acta de línea base el 30 de setiembre de 2026 como única fecha de cierre de la Fase 1, que es la comprometida en el Plan de Alcance.',
      q:'OGPL', e:'Acta de línea base del cronograma v1.0' },
    { t:'Corregir en el cronograma el nombre de la tarea de cierre, que hoy dice «Cierre de Fase 1 (Cierre 30 Oct)», y ajustar sus fechas de 01–03/10 a la fecha acordada.',
      q:'OR', e:'Celda D30 y sus columnas de fecha corregidas' },
    { t:'Alinear la bitácora, cuya validación de MAGPROF termina el 18/09/2026, con el nuevo hito de cierre.',
      q:'OR', e:'Fechas de validación de la bitácora ajustadas' },
    { t:'Reprogramar el arranque de la Fase 2, hoy fijado el 01/10/2026, en función de la fecha adoptada.',
      q:'OR', e:'Fechas de la Fase 2 recalculadas' },
    { t:'Declarar el cierre de fase como hito formal con criterio de aceptación escrito, para que la fecha no vuelva a depender del nombre de una tarea.',
      q:'OGPL', e:'Hito H1.3.5.03 con criterio de aceptación' }
  ],

  'MTZ-02': [
    { t:'Adoptar el 01/06/2025 como fecha oficial de inicio del proyecto en los dos documentos: es la de la primera tarea ejecutada.',
      q:'OGPL', e:'Fecha de inicio declarada en acta' },
    { t:'Corregir el encabezado de la bitácora, que declara el 01/03/2026, y recalcular sus columnas de semana.',
      q:'OR', e:'Encabezado y columnas de semana corregidos' },
    { t:'Extender el rango del gráfico del cronograma hasta junio de 2025, para que la primera tarea deje de quedar fuera del Gantt.',
      q:'OR', e:'Gantt graficando desde junio 2025' },
    { t:'Incorporar la fecha de inicio al Plan de Alcance, que hoy no la declara pese a ser el documento de línea base.',
      q:'OR', e:'Fecha de inicio en el §3 del D1' }
  ],

  'MTZ-03': [
    { t:'Resolver en acta la pregunta de fondo antes de tocar ningún documento: ¿el desarrollo de SIGPRO es condición para cerrar la Fase 1 o no lo es?',
      q:'OGPL', e:'Acuerdo registrado en acta' },
    { t:'Adoptar la separación propuesta —desarrollo en Fase 1, despliegue con facultades en Fase 2— o dejar constancia de por qué se decide lo contrario.',
      q:'OGPL', e:'Decisión de alcance documentada' },
    { t:'Reubicar en el cronograma la Actividad 1.3.4 según lo acordado, junto con sus seis tareas.',
      q:'OR', e:'Actividad 1.3.4 reubicada' },
    { t:'Alinear el párrafo 3 del §3 del Plan de Alcance, que hoy sitúa el despliegue de SIGPRO en la Fase 2.',
      q:'OR', e:'§3 del D1 coherente con el cronograma' },
    { t:'Reflejar la decisión en la bitácora, donde el bloque de SIGPRO acumula 32 subtareas sin fase declarada.',
      q:'OR', e:'Bloque SIGPRO de la bitácora etiquetado' }
  ],

  'MTZ-04': [
    { t:'Adoptar la regla general: el cronograma es la fuente única de los códigos de tarea y la bitácora los hereda añadiendo el correlativo de subtarea.',
      q:'OGPL', e:'Regla escrita en la Guía de GxP' },
    { t:'Recodificar en la bitácora el bloque del indicador de PE.01, que hoy cuelga de «Tarea 1.3.1.2» cuando en el cronograma es la «Tarea 1.3.2.1».',
      q:'OR', e:'Bloque PE.01 recodificado' },
    { t:'Completar en el Plan de Alcance la columna de tarea del requisito RQ-03, que hoy no apunta a ningún código.',
      q:'OR', e:'RQ-03 vinculado a su tarea' },
    { t:'Verificar que ningún otro bloque de la bitácora arrastre el mismo error, dado que 1.3.1.2 se reutiliza en siete filas del cronograma.',
      q:'OR', e:'Tabla de equivalencias de códigos' }
  ],

  'MTZ-05': [
    { t:'Dejar escrita en el encabezado de la revisión interna la fórmula del avance de fase —(completos + 0,5 × observados) ÷ total de productos— para que nadie tenga que deducirla.',
      q:'OR', e:'Fórmula visible en el D4' },
    { t:'Declarar en el Plan de Alcance que la revisión interna es la fuente única del avance de fase, que es el acuerdo ya adoptado pero aún no documentado.',
      q:'OGPL', e:'Cláusula de fuente única en el D1' },
    { t:'Renombrar en el cronograma la celda del 78% como «% de actividades iniciadas o culminadas · Fase 1», para cerrar la contradicción por el otro extremo.',
      q:'OR', e:'Celda M3 del cronograma corregida' }
  ],

  'MTZ-06': [
    { t:'Aprobar el diccionario único de cinco estados —NO INICIADO, EN PROCESO, OBSERVADO, CONFORME, NO APLICA— con su definición y su peso para el cálculo del avance.',
      q:'OGPL', e:'Diccionario de estados aprobado' },
    { t:'Publicar la tabla de equivalencias entre los estados actuales y los nuevos, para poder convertir lo ya registrado sin releerlo fila por fila.',
      q:'OR', e:'Tabla de equivalencias publicada' },
    { t:'Migrar la columna de estado del cronograma, hoy en Culminado / En Proceso / Pendiente.',
      q:'OR', e:'Columna H del cronograma migrada' },
    { t:'Migrar los estados de la bitácora, que usa COMPLETADO, EN DESARROLLO, PENDIENTE y además registra paralizaciones como si fueran estados.',
      q:'OR', e:'Bitácora migrada' },
    { t:'Migrar los siete valores de la revisión interna a los cinco del diccionario, y decidir expresamente qué hacer con CRÍTICO y AVANZADO, que no son estados sino severidades.',
      q:'OR', e:'Tablero del D4 migrado' },
    { t:'Aplicar validación de lista desplegable en las cuatro fuentes, para que no se pueda escribir un estado fuera del diccionario.',
      q:'OR – ISA', e:'Validación de datos activa en los cuatro archivos' }
  ],

  'MTZ-07': [
    { t:'Publicar el catálogo maestro de procesos de Nivel 0 como fuente única, con PS.09 Gestión de Recursos Bibliográficos y PS.10 Gestión de la Comunicación.',
      q:'OGPL', e:'Catálogo maestro difundido a las 20 facultades' },
    { t:'Corregir en la bitácora todo el bloque PS.04 a PS.10, no sólo PS.09: el desplazamiento es de un dígito y afecta a siete procesos.',
      q:'OR', e:'Bitácora recodificada en el bloque de soporte' },
    { t:'Auditar las 20 pestañas de la revisión interna contra el catálogo antes de que continúe el llenado, porque lo codificado con el esquema desplazado deberá rehacerse.',
      q:'OR', e:'Informe de auditoría de codificación' },
    { t:'Incorporar al validador la comprobación de que el código y la denominación del proceso coinciden con el catálogo.',
      q:'OR – ISA', e:'Regla de validación de catálogo' },
    { t:'Comunicar a las facultades qué procesos deben recodificar y con qué plazo, dado que el trabajo recae en ellas.',
      q:'OGPL', e:'Oficio con plazo y acuse' }
  ],

  'MTZ-08': [
    { t:'Emitir la nota de derogación formal del Anexo 2, que hoy sólo está declarada dentro del propio Anexo 1 y nunca se comunicó como decisión.',
      q:'OGPL', e:'Nota de derogación difundida' },
    { t:'Corregir en el cronograma el nombre de la tarea de llenado, que sigue diciendo «Anexos 1, 2, 3».',
      q:'OR', e:'Celda D21 del cronograma corregida' },
    { t:'Retirar del tablero de la revisión interna las columnas del Anexo 2 y la regla especial A2↔A3.',
      q:'OR', e:'Columnas A.2 eliminadas del D4' },
    { t:'Corregir en la bitácora las observaciones que aún instruyen «pasarlas al anexo 2».',
      q:'OR', e:'Observaciones de la bitácora corregidas' },
    { t:'Instruir a las facultades que sigan llenando el Anexo 2 que suspendan ese trabajo, para no seguir gastando esfuerzo en un instrumento sin uso.',
      q:'OGPL', e:'Comunicación con acuse de las facultades' }
  ],

  'MTZ-09': [
    { t:'Fijar dd/mm/aaaa como formato obligatorio de fecha para todos los archivos del proyecto y dejarlo escrito en la Guía de GxP.',
      q:'OGPL', e:'Regla de formato en la Guía' },
    { t:'Convertir las fechas de la bitácora, hoy en d-m-aa, que es el formato que puede invertirse al importar.',
      q:'OR', e:'Columnas de fecha de la bitácora convertidas' },
    { t:'Sustituir en el Plan de Alcance las fechas escritas en prosa («30 de setiembre de 2026») por el formato numérico, al menos en los hitos.',
      q:'OR', e:'Hitos del D1 con fecha numérica' },
    { t:'Aplicar formato de fecha real en las celdas, no texto con apariencia de fecha, para que las restas de días funcionen.',
      q:'OR', e:'Celdas con formato de fecha verificado' },
    { t:'Probar una importación a SIGPRO y verificar que ninguna fecha se haya invertido antes de la carga definitiva.',
      q:'OR – ISA', e:'Prueba de importación sin inversiones' }
  ]

  };

  /* ---------- Integración con el resto de la maquinaria ---------- */

  window.GXP_MTZ_ITEMS = ITEMS;
  window.GXP_RECS = window.GXP_RECS || {};
  Object.keys(RECS).forEach(function (k) { window.GXP_RECS[k] = RECS[k]; });

  // Las localizaciones de la matriz están indexadas por asunto y por columna.
  // Se reindexan por código para que el visor las trate como las de un hallazgo.
  window.GXP_LOC = window.GXP_LOC || {};
  ITEMS.forEach(function (it) {
    const porColumna = (window.GXP_LOC_MTZ || {})[it.asunto] || [];
    const lista = porColumna.filter(Boolean);
    if (lista.length) window.GXP_LOC[it.c] = lista;
  });

  /* ---------- Render ---------- */

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function pintar() {
    const cont = document.getElementById('listaMtz');
    if (!cont) return;

    const abiertos = new Set([].slice.call(cont.querySelectorAll('details[open]'))
      .map(function (d) { return d.querySelector('.cod').textContent; }));

    cont.innerHTML = ITEMS.map(function (it) {
      const valores = ((window.MTZ || []).filter(r => r.a === it.asunto)[0] || {}).v || [];
      const docs = ['D1', 'D2', 'D3', 'D4'];

      const tabla = valores.map(function (v, i) {
        if (!v || v.t === '—') return '';
        return `<tr><th>${docs[i]}</th><td class="${esc(v.c)}">${esc(v.t)}</td></tr>`;
      }).join('');

      return `
      <details class="hall mtzc sev-${esc(it.s)}${it.cerrada ? ' cerrada' : ''}">
        <summary>
          <span class="cod">${esc(it.c)}</span>
          <span class="cuerpo">
            <span class="h">${esc(it.h)}</span>
            <span class="meta">
              <span class="tag sv-${esc(it.s)}">${esc(it.s)}</span>
              ${it.d.map(d => `<span class="tag doc">${esc(d)}</span>`).join('')}
              ${it.cerrada ? '<span class="tag cerrada">resuelta</span>' : ''}
            </span>
          </span>
        </summary>
        <dl class="det">
          <dt>El mismo dato, según cada documento</dt>
          <dd><table class="mtzc-val">${tabla}</table></dd>
          <dt>Columna que debe ganar</dt>
          <dd><span class="mtzc-gana">${esc(it.gana)}</span><p class="mtzc-pq">${esc(it.pq)}</p></dd>
          ${window.GXP_VISOR ? window.GXP_VISOR.bloqueLoc(it.c) : ''}
          ${window.GXP_DEC ? window.GXP_DEC.bloque(it) : ''}
        </dl>
      </details>`;
    }).join('');

    cont.querySelectorAll('details.mtzc').forEach(function (d) {
      if (abiertos.has(d.querySelector('.cod').textContent)) d.open = true;
    });
    if (window.GXP_DEC) window.GXP_DEC.enlazar(cont);
  }

  // Aceptar una recomendación de la matriz también repinta esta lista.
  document.addEventListener('gxp:decision', function () { pintar(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pintar);
  } else {
    pintar();
  }

  window.GXP_MTZC = { pintar, items: ITEMS };
})();
