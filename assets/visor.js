/**
 * Visor de documentos · ubicación exacta de cada hallazgo
 * --------------------------------------------------------
 * Abre a la derecha una vista del documento de origen y muestra, junto a
 * ella, la ruta y el texto ancla con el que localizar la corrección.
 *
 * Cómo se «ubica» realmente cada cosa
 *  · Hojas de cálculo: la URL admite ?range=D27, así que el visor salta a
 *    la celda por sí solo.
 *  · Documentos: Google no permite anclar a un texto arbitrario desde la
 *    URL. Por eso el visor entrega el texto ancla con un botón de copiar:
 *    se pega en el buscador del documento (Ctrl+F) y cae en el punto exacto.
 *
 * Depende de assets/localizaciones.js, que debe cargarse antes.
 */
(function () {
  'use strict';

  const DOCS = window.GXP_DOCS || {};
  const LOC  = window.GXP_LOC  || {};
  const LOCM = window.GXP_LOC_MTZ || {};

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ==================== URLS ==================== */

  function urlVisor(loc) {
    const doc = DOCS[loc.d];
    if (!doc) return '';
    if (doc.tipo === 'hoja') {
      return 'https://docs.google.com/spreadsheets/d/' + doc.id + '/preview' +
             (loc.c ? '?range=' + encodeURIComponent(loc.c.split(':')[0]) : '');
    }
    return 'https://docs.google.com/document/d/' + doc.id + '/preview';
  }

  function urlDrive(loc) {
    const doc = DOCS[loc.d];
    if (!doc) return '#';
    if (doc.tipo === 'hoja') {
      return 'https://docs.google.com/spreadsheets/d/' + doc.id + '/edit' +
             (loc.c ? '?range=' + encodeURIComponent(loc.c) : '');
    }
    return 'https://docs.google.com/document/d/' + doc.id + '/edit';
  }

  /* ==================== PANEL ==================== */

  let panel, marco, actual = null;

  function construir() {
    panel = document.createElement('aside');
    panel.className = 'visor';
    panel.id = 'visor';
    panel.setAttribute('aria-label', 'Visor del documento de origen');
    panel.hidden = true;
    panel.innerHTML = `
      <header class="visor-cab">
        <div class="visor-ident">
          <span class="visor-doc" data-rol="doc"></span>
          <span class="visor-ruta" data-rol="ruta"></span>
        </div>
        <button type="button" class="visor-x" data-rol="cerrar"
          aria-label="Cerrar el visor">✕</button>
      </header>

      <div class="visor-ancla">
        <div class="visor-ancla-cab">
          <span class="visor-et">Texto a buscar en el documento</span>
          <button type="button" class="visor-copiar" data-rol="copiar">Copiar</button>
        </div>
        <code data-rol="ancla"></code>
        <p class="visor-nota" data-rol="nota"></p>
        <p class="visor-tip" data-rol="tip"></p>
      </div>

      <div class="visor-marco">
        <iframe data-rol="marco" title="Vista del documento"
          referrerpolicy="no-referrer"></iframe>
        <p class="visor-fallo">
          Si el documento no se muestra, es porque su cuenta no tiene acceso o
          el archivo no admite previsualización incrustada.
          <a data-rol="drive" target="_blank" rel="noopener">Ábralo en Drive</a>.
        </p>
      </div>

      <footer class="visor-pie">
        <a class="visor-bt" data-rol="drive2" target="_blank" rel="noopener">Abrir en Drive ↗</a>
        <span class="visor-paso" data-rol="paso"></span>
        <button type="button" class="visor-nav" data-rol="prev" aria-label="Ubicación anterior">‹</button>
        <button type="button" class="visor-nav" data-rol="sig" aria-label="Ubicación siguiente">›</button>
      </footer>`;
    document.body.appendChild(panel);
    marco = panel.querySelector('[data-rol="marco"]');

    panel.querySelector('[data-rol="cerrar"]').addEventListener('click', cerrar);
    panel.querySelector('[data-rol="copiar"]').addEventListener('click', copiarAncla);
    panel.querySelector('[data-rol="prev"]').addEventListener('click', () => mover(-1));
    panel.querySelector('[data-rol="sig"]').addEventListener('click', () => mover(1));
  }

  const q = (sel) => panel.querySelector('[data-rol="' + sel + '"]');

  /** grupo: lista de localizaciones; i: cuál se muestra. */
  function abrir(grupo, i) {
    if (!panel) construir();
    actual = { grupo: grupo, i: i || 0 };
    pintar();
    panel.hidden = false;
    document.body.classList.add('con-visor');
    q('cerrar').focus();
  }

  function pintar() {
    const loc = actual.grupo[actual.i];
    const doc = DOCS[loc.d] || {};

    q('doc').textContent = loc.d + ' · ' + (doc.corto || '');
    q('ruta').textContent = loc.r || '';
    q('ancla').textContent = loc.a || '';
    q('nota').textContent = loc.n || '';

    q('tip').textContent = doc.tipo === 'hoja'
      ? (loc.c ? 'El visor salta a ' + loc.c + '. Confirme con el texto de arriba.'
               : 'Use Ctrl+F dentro de la hoja con el texto de arriba.')
      : 'Pulse Ctrl+F dentro del documento y pegue el texto de arriba.';

    const url = urlVisor(loc);
    if (marco.getAttribute('src') !== url) marco.setAttribute('src', url);
    q('drive').setAttribute('href', urlDrive(loc));
    q('drive2').setAttribute('href', urlDrive(loc));

    const varias = actual.grupo.length > 1;
    q('paso').textContent = varias ? (actual.i + 1) + ' de ' + actual.grupo.length : '';
    q('prev').hidden = !varias;
    q('sig').hidden = !varias;
  }

  function mover(paso) {
    const n = actual.grupo.length;
    actual.i = (actual.i + paso + n) % n;
    pintar();
  }

  function copiarAncla() {
    const texto = q('ancla').textContent;
    const boton = q('copiar');
    const fin = (ok) => {
      boton.textContent = ok ? 'Copiado ✓' : 'No se pudo';
      setTimeout(() => { boton.textContent = 'Copiar'; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(() => fin(true), () => fin(false));
    } else {
      // Sin API de portapapeles (contexto no seguro): se selecciona para copiar a mano.
      const r = document.createRange();
      r.selectNodeContents(q('ancla'));
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      fin(false);
    }
  }

  function cerrar() {
    if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove('con-visor');
    marco.removeAttribute('src');           // detiene la carga del documento
    actual = null;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel && !panel.hidden) cerrar();
  });

  /* ==================== BLOQUES EN LA VISTA ==================== */

  /** Bloque «Dónde está» que se inserta en el detalle de cada hallazgo. */
  function bloqueLoc(codigo) {
    const grupo = LOC[codigo];
    if (!grupo || !grupo.length) return '';

    const chips = grupo.map(function (l, i) {
      const doc = DOCS[l.d] || {};
      return `
      <li>
        <button type="button" class="ubic" data-ubic="${esc(codigo)}" data-i="${i}">
          <span class="ubic-doc">${esc(l.d)}</span>
          <span class="ubic-cuerpo">
            <span class="ubic-ruta">${esc(l.r)}${l.c ? ' · ' + esc(l.c) : ''}</span>
            <span class="ubic-ancla">«${esc(l.a)}»</span>
          </span>
          <span class="ubic-ver">Ver ↗</span>
        </button>
        ${l.n ? `<p class="ubic-nota">${esc(l.n)}</p>` : ''}
      </li>`;
    }).join('');

    return `
    <dt>Dónde está exactamente</dt>
    <dd class="ubic-zona"><ul class="ubics">${chips}</ul></dd>`;
  }

  document.addEventListener('click', function (ev) {
    const b = ev.target.closest('.ubic');
    if (b) {
      const grupo = LOC[b.dataset.ubic];
      if (grupo) abrir(grupo, parseInt(b.dataset.i, 10) || 0);
      return;
    }
    const m = ev.target.closest('.mtz-ver');
    if (m) {
      const fila = LOCM[m.dataset.fila];
      if (!fila) return;
      const uno = fila[parseInt(m.dataset.col, 10)];
      if (uno) abrir([uno], 0);
    }
  });

  /** Marca una celda de la matriz de contradicciones como localizable. */
  function botonMtz(asunto, col) {
    const fila = LOCM[asunto];
    if (!fila || !fila[col]) return '';
    return `<button type="button" class="mtz-ver" data-fila="${esc(asunto)}"
      data-col="${col}" title="Ver en el documento">⌕</button>`;
  }

  window.GXP_VISOR = { abrir, cerrar, bloqueLoc, botonMtz };
})();
