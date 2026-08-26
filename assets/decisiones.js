/**
 * Decisiones sobre las recomendaciones del diagnóstico
 * ----------------------------------------------------
 * Añade a cada hallazgo del panel «Diagnóstico» sus recomendaciones, con el
 * ciclo Aceptar · Mejorar · Confirmar, y las envía a la Web App de Apps Script.
 *
 * Se expone como window.GXP_DEC y lo consume el render de hallazgos de
 * index.html mediante dos ganchos: bloque(hallazgo) y enlazar(contenedor).
 *
 * Decisiones de diseño
 *  · El estado vive en localStorage y se sincroniza con el servidor. Si la red
 *    falla la decisión NO se pierde: queda en cola y se reintenta.
 *  · El envío usa Content-Type text/plain a propósito. Apps Script no responde
 *    a las peticiones OPTIONS de verificación previa, así que cualquier otro
 *    tipo de contenido haría fallar la petición por CORS.
 *  · Cada decisión se identifica por su código; reenviarla actualiza la fila
 *    en destino en lugar de duplicarla.
 */
(function () {
  'use strict';

  /* ==================== CONFIGURACIÓN ==================== */

  /**
   * URL /exec de la Web App. Se lee en cada envío, no al cargar: así puede
   * definirse en cualquier momento (window.GXP_ENDPOINT en index.html) y
   * sobrescribirse desde el navegador para pruebas, sin tocar el archivo.
   */
  function endpoint() {
    let url = '';
    try { url = localStorage.getItem('gxp.endpoint') || ''; } catch (e) {}
    return (url || window.GXP_ENDPOINT || '').trim();
  }

  const CLAVE_ESTADO = 'gxp.decisiones.v1';
  const CLAVE_COLA   = 'gxp.decisiones.cola.v1';

  /* ==================== ESTADO ==================== */

  function leerJSON(clave, porDefecto) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : porDefecto;
    } catch (e) {
      return porDefecto;
    }
  }
  function guardarJSON(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  }

  let estado = leerJSON(CLAVE_ESTADO, {});   // { 'D1-01-R1': {texto, editada, fecha, sync} }
  let cola   = leerJSON(CLAVE_COLA, []);     // decisiones pendientes de enviar

  const persistir = () => guardarJSON(CLAVE_ESTADO, estado);

  /* ==================== MODELO ==================== */

  /**
   * Recomendaciones de un hallazgo, por orden de preferencia:
   *   1. las redactadas en assets/recomendaciones.js
   *   2. un arreglo `recs` en el propio hallazgo
   *   3. el campo `co` heredado, como recomendación única
   * Así la interfaz admite N recomendaciones sin depender de una sola fuente.
   */
  function recomendacionesDe(h) {
    const catalogo = window.GXP_RECS && window.GXP_RECS[h.c];
    const lista = (catalogo && catalogo.length) ? catalogo
      : (Array.isArray(h.recs) && h.recs.length ? h.recs : [{ t: h.co }]);

    return lista.map(function (r, i) {
      const obj = typeof r === 'string' ? { t: r } : r;
      return {
        id: h.c + '-R' + (i + 1),
        texto: obj.t,
        responsable: obj.q || '',
        entregable: obj.e || '',
        orden: i + 1,
        total: lista.length,
        codigo: h.c,
        severidad: h.s,
        titulo: h.h,
        destinos: h.d || []
      };
    });
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ==================== RENDER ==================== */

  /** HTML del bloque de recomendaciones de un hallazgo. */
  function bloque(h) {
    const recs = recomendacionesDe(h);
    if (!recs.length || !recs[0].texto) return '';

    const filas = recs.map(function (r) {
      const d = estado[r.id];
      return `
      <li class="rec" data-rec="${esc(r.id)}" data-estado="${d ? 'aceptada' : 'abierta'}">
        <div class="rec-cab">
          <span class="rec-n">R${r.orden}${r.total > 1 ? ' de ' + r.total : ''}</span>
          ${r.responsable ? `<span class="rec-quien">${esc(r.responsable)}</span>` : ''}
        </div>
        <div class="rec-texto" data-rol="texto">${esc(d ? d.texto : r.texto)}</div>
        ${r.entregable ? `<p class="rec-ent">Entregable → ${esc(r.entregable)}</p>` : ''}
        <div class="rec-edicion" data-rol="edicion" hidden>
          <label class="sr-only" for="ta-${esc(r.id)}">Editar la recomendación ${esc(r.id)}</label>
          <textarea id="ta-${esc(r.id)}" data-rol="area" rows="4"
            aria-describedby="ay-${esc(r.id)}">${esc(d ? d.texto : r.texto)}</textarea>
          <p class="rec-ayuda" id="ay-${esc(r.id)}">
            Ajuste la redacción y confirme. El texto que quede aquí es el que se registra.
          </p>
        </div>
        <div class="rec-pie">
          <div class="rec-botones" data-rol="botones"></div>
          <span class="rec-sello" data-rol="sello" role="status" aria-live="polite"></span>
        </div>
      </li>`;
    }).join('');

    return `
    <dt>Recomendaciones</dt>
    <dd class="rec-zona">
      <ul class="recs">${filas}</ul>
    </dd>`;
  }

  /** Dibuja los botones que corresponden al estado actual de una recomendación. */
  function pintarControles(li) {
    const id = li.dataset.rec;
    const modo = li.dataset.estado;          // abierta · editando · aceptada
    const botones = li.querySelector('[data-rol="botones"]');
    const sello = li.querySelector('[data-rol="sello"]');
    const guardada = estado[id];

    if (modo === 'editando') {
      botones.innerHTML =
        '<button type="button" class="bt bt-si" data-act="confirmar">Acepto recomendación</button>' +
        '<button type="button" class="bt bt-no" data-act="cancelar">Cancelar</button>';
    } else if (modo === 'aceptada') {
      botones.innerHTML =
        '<button type="button" class="bt bt-ed" data-act="mejorar">Mejorar la recomendación</button>' +
        '<button type="button" class="bt bt-no" data-act="revertir">Retirar aceptación</button>';
    } else {
      botones.innerHTML =
        '<button type="button" class="bt bt-si" data-act="aceptar">Acepto la recomendación</button>' +
        '<button type="button" class="bt bt-ed" data-act="mejorar">Mejorar la recomendación</button>';
    }

    if (guardada) {
      const marca = guardada.sync === 'ok' ? '✓ Registrada'
                  : guardada.sync === 'pendiente' ? '⟳ Pendiente de envío'
                  : guardada.sync === 'error' ? '⚠ No se pudo registrar'
                  : '✓ Aceptada';
      sello.textContent = marca + (guardada.editada ? ' · texto editado' : '') +
                          (guardada.fecha ? ' · ' + guardada.fecha : '');
      sello.dataset.sync = guardada.sync || 'ok';
    } else {
      sello.textContent = '';
      sello.removeAttribute('data-sync');
    }
  }

  function modo(li, nuevo) {
    li.dataset.estado = nuevo;
    li.querySelector('[data-rol="texto"]').hidden = nuevo === 'editando';
    li.querySelector('[data-rol="edicion"]').hidden = nuevo !== 'editando';
    pintarControles(li);
    if (nuevo === 'editando') {
      const area = li.querySelector('[data-rol="area"]');
      area.focus();
      area.setSelectionRange(area.value.length, area.value.length);
    }
  }

  /* ==================== ACCIONES ==================== */

  function datosDe(li) {
    const id = li.dataset.rec;
    const h = (window.HALL || []).filter(x => x.c === id.replace(/-R\d+$/, ''))[0] || {};
    const r = recomendacionesDe(h).filter(x => x.id === id)[0] || {};
    return { id, hallazgo: h, base: r };
  }

  function aceptar(li, textoFinal, editada) {
    const { id, base } = datosDe(li);
    const fecha = new Date().toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    estado[id] = { texto: textoFinal, editada: !!editada, fecha, sync: 'pendiente' };
    persistir();

    li.querySelector('[data-rol="texto"]').textContent = textoFinal;
    modo(li, 'aceptada');

    enviar({
      accion: 'decision',
      codigo: id,
      severidad: base.severidad || '',
      titulo: (base.titulo || '') + (base.total > 1 ? ' · R' + base.orden + '/' + base.total : ''),
      recomendacion: textoFinal,
      editada: !!editada,
      destinos: base.destinos || [],
      fecha
    }, id);
  }

  function revertir(li) {
    const { id, base } = datosDe(li);
    delete estado[id];
    persistir();
    li.querySelector('[data-rol="texto"]').textContent = base.texto || '';
    li.querySelector('[data-rol="area"]').value = base.texto || '';
    modo(li, 'abierta');
    enviar({ accion: 'eliminar', codigo: id }, null);
  }

  /* ==================== TRANSPORTE ==================== */

  function marcarSync(id, valor) {
    if (!id || !estado[id]) return;
    estado[id].sync = valor;
    persistir();
    const li = document.querySelector('[data-rec="' + CSS.escape(id) + '"]');
    if (li) pintarControles(li);
  }

  function enviar(cuerpo, idParaMarcar) {
    const url = endpoint();
    if (!url) {
      marcarSync(idParaMarcar, 'error');
      console.warn('[GxP] No hay endpoint configurado: define window.GXP_ENDPOINT.');
      return Promise.resolve({ ok: false, error: 'sin endpoint' });
    }

    return fetch(url, {
      method: 'POST',
      // text/plain evita la petición previa OPTIONS, que Apps Script no atiende.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(cuerpo),
      redirect: 'follow'
    })
      .then(r => r.json())
      .then(function (res) {
        if (res && res.ok) {
          marcarSync(idParaMarcar, 'ok');
          sacarDeCola(cuerpo);
        } else {
          marcarSync(idParaMarcar, 'error');
          meterEnCola(cuerpo);
          console.warn('[GxP] El servidor rechazó la decisión:', res);
        }
        return res;
      })
      .catch(function (err) {
        marcarSync(idParaMarcar, 'error');
        meterEnCola(cuerpo);
        console.warn('[GxP] Error de red:', err);
        return { ok: false, error: String(err) };
      });
  }

  function meterEnCola(cuerpo) {
    cola = cola.filter(c => !(c.accion === cuerpo.accion && c.codigo === cuerpo.codigo));
    cola.push(cuerpo);
    guardarJSON(CLAVE_COLA, cola);
  }
  function sacarDeCola(cuerpo) {
    cola = cola.filter(c => !(c.accion === cuerpo.accion && c.codigo === cuerpo.codigo));
    guardarJSON(CLAVE_COLA, cola);
  }

  /** Reintenta lo que quedó pendiente: al cargar y cada vez que vuelve la red. */
  function vaciarCola() {
    if (!cola.length || !endpoint()) return;
    const pendientes = cola.slice();
    pendientes.forEach(c => enviar(c, c.accion === 'decision' ? c.codigo : null));
  }

  /* ==================== ENLACE CON LA VISTA ==================== */

  function enlazar(contenedor) {
    (contenedor || document).querySelectorAll('.rec').forEach(function (li) {
      if (li.dataset.listo) return;
      li.dataset.listo = '1';
      pintarControles(li);
    });
  }

  document.addEventListener('click', function (ev) {
    const boton = ev.target.closest('.rec .bt');
    if (!boton) return;
    const li = boton.closest('.rec');
    const act = boton.dataset.act;

    if (act === 'aceptar') {
      aceptar(li, li.querySelector('[data-rol="texto"]').textContent.trim(), false);
    } else if (act === 'mejorar') {
      modo(li, 'editando');
    } else if (act === 'cancelar') {
      const { id, base } = datosDe(li);
      li.querySelector('[data-rol="area"]').value =
        estado[id] ? estado[id].texto : (base.texto || '');
      modo(li, estado[id] ? 'aceptada' : 'abierta');
    } else if (act === 'confirmar') {
      const texto = li.querySelector('[data-rol="area"]').value.trim();
      if (!texto) {
        li.querySelector('[data-rol="area"]').focus();
        return;
      }
      const { base } = datosDe(li);
      aceptar(li, texto, texto !== (base.texto || '').trim());
    } else if (act === 'revertir') {
      revertir(li);
    }
  });

  // Ctrl/Cmd + Enter confirma la edición sin tocar el ratón.
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' || !(ev.ctrlKey || ev.metaKey)) return;
    const area = ev.target.closest('.rec [data-rol="area"]');
    if (!area) return;
    ev.preventDefault();
    area.closest('.rec').querySelector('[data-act="confirmar"]').click();
  });

  window.addEventListener('online', vaciarCola);
  vaciarCola();

  window.GXP_DEC = { bloque, enlazar, estado: () => estado, enviar, vaciarCola };
})();
