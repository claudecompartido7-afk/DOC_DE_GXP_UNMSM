/**
 * Acceso al área interna
 * ------------------------
 * El diagnóstico —hallazgos, contradicciones, avance por facultad y
 * recomendaciones— no está en este archivo ni en ningún otro del sitio.
 * Vive en el backend y sólo se entrega tras validar las credenciales.
 *
 * Es una diferencia que importa: en un sitio estático, ocultar con JavaScript
 * un contenido que ya viajó al navegador no protege nada, porque basta abrir
 * el código fuente. Aquí, mientras no haya sesión, no hay nada que abrir.
 *
 * La sesión dura diez horas y se guarda en este navegador. Cerrarla la borra
 * de aquí y la anula en el servidor.
 */
(function () {
  'use strict';

  const CLAVE_SESION = 'gxp.sesion.v1';

  function endpoint() {
    let url = '';
    try { url = localStorage.getItem('gxp.endpoint') || ''; } catch (e) {}
    return (url || window.GXP_ENDPOINT || '').trim();
  }

  function sesion() {
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
      return s && s.hasta > Date.now() ? s : null;
    } catch (e) { return null; }
  }

  function guardar(s) {
    try { localStorage.setItem(CLAVE_SESION, JSON.stringify(s)); } catch (e) {}
  }
  function olvidar() {
    try { localStorage.removeItem(CLAVE_SESION); } catch (e) {}
  }

  function pedir(cuerpo) {
    const url = endpoint();
    if (!url) return Promise.resolve({ ok: false, error: 'No hay endpoint configurado.' });
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(cuerpo),
      redirect: 'follow'
    }).then(r => r.json()).catch(e => ({ ok: false, error: String(e.message || e) }));
  }

  /* ==================== PANTALLA ==================== */

  const puerta = document.getElementById('puerta');
  const form   = document.getElementById('formAcceso');
  const aviso  = document.getElementById('avisoAcceso');
  const boton  = document.getElementById('btAcceso');

  function abrir(res) {
    guardar({ ficha: res.ficha, hasta: res.hasta, nombre: res.nombre, correo: res.correo });
    document.getElementById('quien').textContent = res.nombre || res.correo;
    document.body.classList.add('dentro');
    puerta.hidden = true;
    // La ficha viaja en cada petición posterior: decisiones y edición
    // del documento también exigen sesión en el servidor.
    window.GXP_FICHA = res.ficha;
    window.GXP_ARRANCAR(res.datos);
  }

  function cerrar() {
    const s = sesion();
    if (s) pedir({ accion: 'salir', ficha: s.ficha });
    olvidar();
    window.GXP_FICHA = null;
    location.reload();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    const correo = document.getElementById('correo').value.trim();
    const clave  = document.getElementById('clave').value;
    if (!correo || !clave) return;

    boton.disabled = true;
    boton.textContent = 'Comprobando…';
    aviso.textContent = '';

    pedir({ accion: 'entrar', correo: correo, clave: clave }).then(function (res) {
      boton.disabled = false;
      boton.textContent = 'Ingresar';
      if (res && res.ok) { abrir(res); return; }
      aviso.textContent = (res && res.error) || 'No se pudo verificar el acceso.';
      document.getElementById('clave').value = '';
      document.getElementById('clave').focus();
    });
  });

  document.getElementById('btSalir').addEventListener('click', cerrar);

  /* Sesión ya abierta en este navegador: se piden los datos sin preguntar. */
  const s = sesion();
  if (s) {
    aviso.textContent = '';
    pedir({ accion: 'datos', ficha: s.ficha }).then(function (res) {
      if (res && res.ok) {
        abrir({ ficha: s.ficha, hasta: s.hasta, nombre: s.nombre,
                correo: s.correo, datos: res.datos });
      } else {
        olvidar();                                  // caducó o se revocó
        document.getElementById('correo').focus();
      }
    });
  } else {
    document.getElementById('correo').focus();
  }
})();
