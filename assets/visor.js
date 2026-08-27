/**
 * Visor de documentos · ubicar, resaltar y corregir
 * ---------------------------------------------------
 * Abre a la derecha el documento de origen, resalta en amarillo la frase
 * exacta del hallazgo y permite corregirla sin salir de la página.
 *
 * Por qué el documento se renderiza aquí y no se incrusta
 *   Incrustar Google en un iframe impide las otras dos cosas: el iframe es
 *   de otro origen, así que el navegador no deja pintar un resaltado dentro
 *   ni activar la edición. Google además bloquea el modo /edit en iframes.
 *   Por eso el visor pide el contenido al backend —que sí tiene permisos—,
 *   lo pinta como HTML propio, y devuelve las correcciones por la misma vía.
 *   La vista incrustada de Google queda como respaldo de sólo lectura para
 *   cuando no hay backend configurado.
 *
 * Direcciones, no búsquedas
 *   Cada bloque que entrega el backend viene con la dirección con la que se
 *   le puede escribir después (índice del elemento, o fila y columna). Al
 *   guardar no se busca texto: se escribe en esa dirección. Así una frase
 *   repetida en el documento nunca se corrige en el lugar equivocado.
 *
 * Depende de assets/localizaciones.js y del módulo de decisiones.
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

  let panel, actual = null, contenido = null, sucios = {};

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

      <div class="visor-barra">
        <span class="visor-et">Frase del hallazgo</span>
        <code data-rol="ancla"></code>
        <div class="visor-acc">
          <button type="button" class="visor-bt2" data-rol="ir">Ir al resaltado</button>
          <button type="button" class="visor-bt2" data-rol="copiar">Copiar</button>
          <label class="visor-edit">
            <input type="checkbox" data-rol="editable"> Editar el documento
          </label>
        </div>
        <p class="visor-nota" data-rol="nota"></p>
        <p class="visor-aviso" data-rol="aviso"></p>
      </div>

      <div class="visor-cuerpo" data-rol="cuerpo"></div>

      <footer class="visor-pie">
        <a class="visor-bt" data-rol="drive" target="_blank" rel="noopener">Abrir en Drive ↗</a>
        <button type="button" class="visor-bt" data-rol="recargar">Recargar</button>
        <span class="visor-paso" data-rol="paso"></span>
        <button type="button" class="visor-nav" data-rol="prev" aria-label="Ubicación anterior">‹</button>
        <button type="button" class="visor-nav" data-rol="sig" aria-label="Ubicación siguiente">›</button>
      </footer>

      <div class="visor-guardar" data-rol="guardar" hidden>
        <span data-rol="cuenta"></span>
        <button type="button" class="visor-bt2 desc" data-rol="descartar">Descartar</button>
        <button type="button" class="visor-bt2 conf" data-rol="aplicar">Guardar en Drive</button>
      </div>`;
    document.body.appendChild(panel);

    q('cerrar').addEventListener('click', cerrar);
    q('copiar').addEventListener('click', copiarAncla);
    q('ir').addEventListener('click', irAlResaltado);
    q('prev').addEventListener('click', () => mover(-1));
    q('sig').addEventListener('click', () => mover(1));
    q('recargar').addEventListener('click', () => cargar(true));
    q('editable').addEventListener('change', aplicarModoEdicion);
    q('descartar').addEventListener('click', descartar);
    q('aplicar').addEventListener('click', guardar);
  }

  const q = (sel) => panel.querySelector('[data-rol="' + sel + '"]');

  function abrir(grupo, i) {
    if (!panel) construir();
    if (Object.keys(sucios).length && !confirm(
        'Hay correcciones sin guardar. ¿Descartarlas y abrir otra ubicación?')) return;
    actual = { grupo: grupo, i: i || 0 };
    panel.hidden = false;
    document.body.classList.add('con-visor');
    cargar();
    q('cerrar').focus();
  }

  function mover(paso) {
    const n = actual.grupo.length;
    const antes = actual.grupo[actual.i];
    actual.i = (actual.i + paso + n) % n;
    const ahora = actual.grupo[actual.i];
    // Si sigue siendo el mismo documento basta con mover el resaltado.
    if (antes.d === ahora.d && contenido) { cabecera(); resaltar(); }
    else cargar();
  }

  function cabecera() {
    const loc = actual.grupo[actual.i];
    const doc = DOCS[loc.d] || {};
    q('doc').textContent = loc.d + ' · ' + (doc.corto || '');
    q('ruta').textContent = loc.r || '';
    q('ancla').textContent = loc.a || '';
    q('nota').textContent = loc.n || '';
    q('drive').setAttribute('href', urlDrive(loc));
    const varias = actual.grupo.length > 1;
    q('paso').textContent = varias ? (actual.i + 1) + ' de ' + actual.grupo.length : '';
    q('prev').hidden = !varias;
    q('sig').hidden = !varias;
  }

  /* ==================== CARGA DEL CONTENIDO ==================== */

  function cargar(forzar) {
    cabecera();
    sucios = {}; refrescarGuardar();
    const loc = actual.grupo[actual.i];
    const doc = DOCS[loc.d] || {};
    const url = window.GXP_DEC && window.GXP_DEC.endpoint && window.GXP_DEC.endpoint();

    if (!url) { respaldo(loc, 'Sin backend configurado: se muestra la vista de Google, ' +
      'que no admite resaltado ni edición.'); return; }

    q('cuerpo').innerHTML = '<p class="visor-cargando">Cargando el documento…</p>';
    q('aviso').textContent = '';

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        accion: 'contenido', destino: loc.d,
        hoja: loc.h || '', rango: loc.c || ''
      }),
      redirect: 'follow'
    })
      .then(r => r.json())
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'respuesta no válida');
        contenido = res;
        pintarContenido();
        resaltar();
        aplicarModoEdicion();
        if (res.truncado) {
          q('aviso').textContent = 'El documento es largo: se muestra sólo una parte. ' +
            'Si la frase no aparece, ábralo en Drive.';
        }
      })
      .catch(function (err) {
        // El backend antiguo responde «Acción no reconocida» porque la
        // implementación publicada es anterior a estas acciones. Es el fallo
        // más probable, y no se arregla desde la web: hay que volver a
        // implementar el Apps Script.
        const viejo = /no reconocida/i.test(err.message);
        respaldo(loc, viejo
          ? 'El Apps Script publicado está desactualizado: no conoce la acción ' +
            '«contenido». Actualice Codigo.gs y cree una NUEVA VERSIÓN de la ' +
            'implementación (Implementar › Gestionar implementaciones › ✏ › ' +
            'Versión: Nueva versión). Mientras tanto se muestra la vista de ' +
            'Google, sin resaltado ni edición.'
          : 'No se pudo leer el documento (' + err.message + '). ' +
            'Se muestra la vista de Google, sin resaltado ni edición.');
      });
  }

  /** Vista incrustada de Google: sólo lectura, cuando no hay otra opción. */
  function respaldo(loc, motivo) {
    contenido = null;
    q('aviso').textContent = motivo;
    q('editable').checked = false;
    q('editable').disabled = true;
    q('cuerpo').innerHTML =
      '<iframe class="visor-marco" title="Vista del documento" referrerpolicy="no-referrer" src="' +
      esc(urlVisor(loc)) + '"></iframe>';
  }

  function pintarContenido() {
    q('editable').disabled = false;
    if (contenido.tipo === 'doc') {
      q('cuerpo').innerHTML = '<div class="doc">' + contenido.bloques.map(function (b, n) {
        const dir = esc(JSON.stringify({ k: b.k, i: b.i, r: b.r, c: b.c }));
        if (b.k === 'td') {
          return `<div class="doc-td" data-n="${n}" data-dir="${dir}">${esc(b.t)}</div>`;
        }
        const et = b.h && b.h.indexOf('HEADING') === 0 ? 'h4' : 'p';
        return `<${et} class="doc-p" data-n="${n}" data-dir="${dir}">${esc(b.t)}</${et}>`;
      }).join('') + '</div>';
      return;
    }

    const v = contenido.valores || [];
    const filas = v.map(function (fila, r) {
      const celdas = fila.map(function (celda, c) {
        const dir = esc(JSON.stringify({ fila: contenido.fila0 + r, col: contenido.col0 + c }));
        return `<td data-n="${r}-${c}" data-dir="${dir}">${esc(celda)}</td>`;
      }).join('');
      return `<tr><th class="nfila">${contenido.fila0 + r}</th>${celdas}</tr>`;
    }).join('');

    const cols = (v[0] || []).map(function (_, c) {
      return '<th>' + letraCol(contenido.col0 + c) + '</th>';
    }).join('');

    q('cuerpo').innerHTML =
      (contenido.hojas && contenido.hojas.length > 1
        ? `<div class="hojas">${contenido.hojas.map(h =>
            `<button type="button" class="hoja${h === contenido.hoja ? ' on' : ''}"
              data-hoja="${esc(h)}">${esc(h)}</button>`).join('')}</div>`
        : '') +
      `<div class="hoja-marco"><table class="hoja-t">
         <thead><tr><th class="nfila"></th>${cols}</tr></thead>
         <tbody>${filas}</tbody></table></div>`;
  }

  function letraCol(n) {
    let s = '';
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
    return s;
  }

  /* ==================== RESALTADO ==================== */

  function resaltar() {
    if (!contenido) return;
    panel.querySelectorAll('mark.hl').forEach(function (m) {
      m.replaceWith(document.createTextNode(m.textContent));
    });
    panel.querySelectorAll('.hl-caja').forEach(e => e.classList.remove('hl-caja'));

    const ancla = (actual.grupo[actual.i].a || '').trim();
    if (!ancla) return;

    const nodos = q('cuerpo').querySelectorAll('[data-dir]');
    let encontrado = null;
    for (const el of nodos) {
      const texto = el.textContent;
      const pos = indiceFlexible(texto, ancla);
      if (pos === -1) continue;
      const largo = anchoCoincidencia(texto, ancla, pos);
      el.innerHTML = esc(texto.slice(0, pos)) +
        '<mark class="hl">' + esc(texto.slice(pos, pos + largo)) + '</mark>' +
        esc(texto.slice(pos + largo));
      el.classList.add('hl-caja');
      encontrado = el;
      break;
    }

    if (encontrado) {
      q('aviso').textContent = '';
      irAlResaltado();
    } else {
      q('aviso').textContent = 'La frase no aparece en la parte cargada del documento: ' +
        'puede haber cambiado o estar más adelante.';
    }
  }

  /** Compara ignorando mayúsculas, acentos y espacios repetidos. */
  const normal = (t) => t.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // marcas de acento
    .replace(/\s+/g, ' ');

  function indiceFlexible(texto, ancla) {
    const directo = texto.indexOf(ancla);
    if (directo !== -1) return directo;
    const nt = normal(texto), na = normal(ancla);
    const pos = nt.indexOf(na);
    if (pos === -1) return -1;
    // Reproyecta la posición del texto normalizado sobre el original.
    let i = 0, j = 0;
    while (j < pos && i < texto.length) {
      const antes = normal(texto.slice(0, i + 1)).length;
      if (antes > j) j = antes;
      i++;
    }
    return Math.min(i, texto.length - 1);
  }

  function anchoCoincidencia(texto, ancla, pos) {
    if (texto.substr(pos, ancla.length) === ancla) return ancla.length;
    const na = normal(ancla);
    for (let n = ancla.length; n <= ancla.length + 12 && pos + n <= texto.length; n++) {
      if (normal(texto.substr(pos, n)) === na) return n;
    }
    return ancla.length;
  }

  function irAlResaltado() {
    const m = panel.querySelector('mark.hl') || panel.querySelector('.hl-caja');
    if (m) m.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ==================== EDICIÓN ==================== */

  function aplicarModoEdicion() {
    if (!contenido) return;
    const on = q('editable').checked;
    q('cuerpo').classList.toggle('editando', on);
    q('cuerpo').querySelectorAll('[data-dir]').forEach(function (el) {
      el.setAttribute('contenteditable', on ? 'true' : 'false');
      if (on && !el.dataset.orig) el.dataset.orig = el.textContent;
    });
  }

  // Cada tecleo marca su bloque como sucio; nada se envía hasta «Guardar».
  document.addEventListener('input', function (ev) {
      const el = ev.target.closest && ev.target.closest('.visor-cuerpo [data-dir]');
      if (!el || !panel || panel.hidden) return;
      const n = el.dataset.n;
      if (el.textContent === el.dataset.orig) delete sucios[n];
      else sucios[n] = { dir: JSON.parse(el.dataset.dir), texto: el.textContent };
      el.classList.toggle('sucio', !!sucios[n]);
      refrescarGuardar();
  });

  function refrescarGuardar() {
    if (!panel) return;
    const n = Object.keys(sucios).length;
    q('guardar').hidden = n === 0;
    q('cuenta').textContent = n === 1 ? '1 corrección sin guardar'
                                      : n + ' correcciones sin guardar';
  }

  function descartar() {
    q('cuerpo').querySelectorAll('[data-dir]').forEach(function (el) {
      if (sucios[el.dataset.n]) {
        el.textContent = el.dataset.orig;
        el.classList.remove('sucio');
      }
    });
    sucios = {}; refrescarGuardar(); resaltar();
  }

  function guardar() {
    const url = window.GXP_DEC && window.GXP_DEC.endpoint && window.GXP_DEC.endpoint();
    const destino = actual.grupo[actual.i].d;
    const pend = Object.keys(sucios);
    if (!url || !pend.length) return;

    q('aplicar').disabled = true;
    q('aplicar').textContent = 'Guardando…';

    const enviarUno = (clave) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({
        accion: 'editar', destino: destino,
        hoja: (contenido && contenido.hoja) || '',
        texto: sucios[clave].texto
      }, sucios[clave].dir)),
      redirect: 'follow'
    }).then(r => r.json()).then(res => ({ clave, res }));

    // En serie: dos escrituras simultáneas sobre el mismo archivo compiten
    // por el bloqueo del backend y una de las dos se pierde.
    pend.reduce(function (cadena, clave) {
      return cadena.then(function (fallos) {
        return enviarUno(clave).then(function (r) {
          if (r.res && r.res.ok) {
            const el = q('cuerpo').querySelector('[data-n="' + r.clave + '"]');
            if (el) { el.dataset.orig = el.textContent; el.classList.remove('sucio');
                      el.classList.add('guardado');
                      setTimeout(() => el.classList.remove('guardado'), 2500); }
            delete sucios[r.clave];
          } else {
            fallos.push((r.res && r.res.error) || 'error desconocido');
          }
          return fallos;
        }).catch(function (e) { fallos.push(e.message); return fallos; });
      });
    }, Promise.resolve([])).then(function (fallos) {
      q('aplicar').disabled = false;
      q('aplicar').textContent = 'Guardar en Drive';
      refrescarGuardar();
      q('aviso').textContent = fallos.length
        ? 'No se pudieron guardar ' + fallos.length + ' correcciones: ' + fallos[0]
        : 'Correcciones guardadas en el documento.';
    });
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
    } else { fin(false); }
  }

  function cerrar() {
    if (!panel) return;
    if (Object.keys(sucios).length &&
        !confirm('Hay correcciones sin guardar. ¿Cerrar y descartarlas?')) return;
    panel.hidden = true;
    document.body.classList.remove('con-visor');
    q('cuerpo').innerHTML = '';
    contenido = null; sucios = {}; actual = null;
    refrescarGuardar();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel && !panel.hidden) cerrar();
  });

  // Cambio de pestaña dentro de una hoja de cálculo
  document.addEventListener('click', function (ev) {
    const h = ev.target.closest('.visor-cuerpo .hoja');
    if (!h || !actual) return;
    actual.grupo[actual.i].h = h.dataset.hoja;
    cargar();
  });

  window.addEventListener('beforeunload', function (e) {
    if (Object.keys(sucios).length) { e.preventDefault(); e.returnValue = ''; }
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
          <span class="ubic-n">${i + 1}</span>
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
    <dt>Ubicación del hallazgo</dt>
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
