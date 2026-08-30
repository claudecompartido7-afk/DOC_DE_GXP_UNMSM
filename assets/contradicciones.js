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

  /* Los ítems y sus recomendaciones llegan del backend tras el acceso: no
     viven en este archivo, que es público. Aquí sólo está la lógica. */
  const ITEMS = () => window.GXP_MTZ_ITEMS || [];

  /* ---------- Integración con el resto de la maquinaria ---------- */

  /**
   * Las localizaciones de la matriz llegan indexadas por asunto y por columna.
   * Se reindexan por código para que el visor las trate como las de un hallazgo.
   * Se ejecuta al pintar, porque hasta el acceso no hay datos.
   */
  function reindexar() {
    window.GXP_LOC = window.GXP_LOC || {};
    ITEMS().forEach(function (it) {
      const porColumna = (window.GXP_LOC_MTZ || {})[it.asunto] || [];
      const lista = porColumna.filter(Boolean);
      if (lista.length) window.GXP_LOC[it.c] = lista;
    });
  }

  /* ---------- Render ---------- */

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function pintar() {
    const cont = document.getElementById('listaMtz');
    if (!cont || !ITEMS().length) return;
    reindexar();

    const abiertos = new Set([].slice.call(cont.querySelectorAll('details[open]'))
      .map(function (d) { return d.querySelector('.cod').textContent; }));

    cont.innerHTML = ITEMS().map(function (it) {
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
