/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  REPARACIÓN DEL ACCESO INTERNO
 *  Oficina General de Planificación · Oficina de Racionalización (UNMSM)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Para cuando el correo y la contraseña no dejan entrar a interno.html.
 *
 *  Se pega este archivo en EL MISMO proyecto de Apps Script que está publicado
 *  como aplicación web (el que genera la URL .../exec que figura en
 *  interno.html). Ese detalle es la causa más frecuente del fallo: las
 *  credenciales se guardan en las propiedades DEL PROYECTO, así que un usuario
 *  dado de alta en otro proyecto no existe para el que atiende las peticiones.
 *
 *  Orden de uso
 *  ─────────────────────────────────────────────────────────────────────────────
 *   1. Ejecutar `diagnosticoAcceso`   → dice qué proyecto es y qué usuarios tiene.
 *   2. Rellenar CORREO_NUEVO y CLAVE_NUEVA aquí abajo.
 *   3. Ejecutar `repararAcceso`       → crea la credencial y la comprueba sola.
 *   4. Volver a publicar: Implementar › Gestionar implementaciones › editar ›
 *      Versión «Nueva» › Implementar.  (Sin esto, la web sigue usando el código
 *      viejo.)
 *
 *  Ver › Registros muestra el resultado de cada función.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/* ── Rellene estas dos líneas antes de ejecutar `repararAcceso` ──────────── */

const CORREO_NUEVO = 'claudecompartido7@gmail.com';   // correo con el que entrará
const CLAVE_NUEVA  = 'CambiarEsta2026';               // mínimo 8 caracteres

/* ─────────────────────────────────────────────────────────────────────────── */

const PROP_USUARIOS_REP = 'USUARIOS_GXP';   // misma propiedad que usa Codigo.gs

function propsRep_() { return PropertiesService.getScriptProperties(); }

function usuariosRep_() {
  const crudo = propsRep_().getProperty(PROP_USUARIOS_REP);
  if (!crudo) return [];
  try { return JSON.parse(crudo); } catch (e) { return []; }
}

/** Misma huella que Codigo.gs: SHA-256 de «sal·clave», en hexadecimal. */
function huellaRep_(clave, sal) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, sal + '·' + clave, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
}

/**
 * PASO 1 — Radiografía del proyecto.
 *
 * Contesta a las tres preguntas que explican casi todos los fallos de acceso:
 * ¿es este el proyecto publicado?, ¿hay usuarios dados de alta?, ¿cuáles?
 */
function diagnosticoAcceso() {
  const lineas = [];
  const lista  = usuariosRep_();

  lineas.push('════════ DIAGNÓSTICO DEL ACCESO INTERNO ════════');
  lineas.push('Proyecto (ID de script): ' + ScriptApp.getScriptId());

  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  lineas.push('URL de la aplicación web: ' + (url || '(sin publicar todavía)'));
  lineas.push('');
  lineas.push('COMPRUEBE: esa URL debe ser la misma que aparece en interno.html,');
  lineas.push('en la línea window.GXP_ENDPOINT. Si el tramo AKfy… no coincide,');
  lineas.push('está dando de alta usuarios en un proyecto que la web no consulta.');
  lineas.push('');

  lineas.push('Usuarios dados de alta: ' + lista.length);
  if (!lista.length) {
    lineas.push('  → Ninguno. Ejecute repararAcceso() para crear el primero.');
  } else {
    lista.forEach(function (u, i) {
      lineas.push('  ' + (i + 1) + '. ' + u.correo + '  ·  ' + (u.nombre || '(sin nombre)') +
                  '  ·  alta: ' + (u.alta || '?'));
    });
  }
  lineas.push('');
  lineas.push('Recuerde: el correo se guarda SIEMPRE en minúsculas y sin espacios.');
  lineas.push('La contraseña distingue mayúsculas de minúsculas.');
  lineas.push('════════════════════════════════════════════════');

  const texto = lineas.join('\n');
  Logger.log(texto);
  return texto;
}

/**
 * PASO 2 — Crea (o rehace) la credencial y la verifica en el acto.
 *
 * Si el correo ya existía, se reemplaza: es también la forma de cambiar una
 * contraseña olvidada. La comprobación final recalcula la huella igual que lo
 * hará el servidor cuando alguien intente entrar, de modo que un «correcto»
 * aquí significa que la pantalla de acceso va a abrir.
 */
function repararAcceso() {
  const correo = String(CORREO_NUEVO || '').toLowerCase().trim();
  const clave  = String(CLAVE_NUEVA  || '');

  if (!correo || correo.indexOf('@') === -1) {
    throw new Error('CORREO_NUEVO está vacío o no parece un correo. Edítelo arriba.');
  }
  if (clave.length < 8) {
    throw new Error('CLAVE_NUEVA debe tener 8 caracteres o más. Ahora tiene ' +
                    clave.length + '.');
  }
  if (clave !== clave.trim()) {
    throw new Error('CLAVE_NUEVA empieza o termina en espacio. Quítelo: al teclearla ' +
                    'en la web ese espacio no se escribe y el acceso fallaría.');
  }

  const lista = usuariosRep_().filter(function (u) { return u.correo !== correo; });
  const sal   = Utilities.getUuid();

  lista.push({
    correo: correo,
    nombre: correo.split('@')[0],
    sal:    sal,
    huella: huellaRep_(clave, sal),
    alta:   new Date().toISOString()
  });

  propsRep_().setProperty(PROP_USUARIOS_REP, JSON.stringify(lista));

  // Verificación: se relee lo guardado y se valida como lo hará el servidor.
  const guardado = usuariosRep_().filter(function (u) { return u.correo === correo; })[0];
  const valida   = guardado && huellaRep_(clave, guardado.sal) === guardado.huella;

  const lineas = [];
  lineas.push('════════ REPARACIÓN DEL ACCESO ════════');
  lineas.push(valida ? 'CREDENCIAL CORRECTA · la pantalla de acceso abrirá con:'
                     : 'ALGO FALLÓ: la huella guardada no valida. Revise el código.');
  lineas.push('  Correo:     ' + correo);
  lineas.push('  Contraseña: ' + clave);
  lineas.push('');
  lineas.push('Usuarios registrados ahora: ' + lista.length);
  lineas.push('Proyecto: ' + ScriptApp.getScriptId());
  lineas.push('');
  lineas.push('SI AÚN NO ENTRA, en este orden:');
  lineas.push(' 1. Implementar › Gestionar implementaciones › lápiz ›');
  lineas.push('    Versión: «Nueva» › Implementar.');
  lineas.push(' 2. En esa misma pantalla: «Quién tiene acceso» = Cualquier usuario,');
  lineas.push('    y «Ejecutar como» = Yo. Sin eso el navegador recibe una');
  lineas.push('    redirección de inicio de sesión en lugar de la respuesta.');
  lineas.push(' 3. Confirme que la URL publicada coincide con GXP_ENDPOINT de');
  lineas.push('    interno.html (ejecute diagnosticoAcceso para verla).');
  lineas.push('══════════════════════════════════════');

  const texto = lineas.join('\n');
  Logger.log(texto);
  return texto;
}

/**
 * PASO 3 (opcional) — Ensaya un intento de acceso sin pasar por la web.
 *
 * Separa los dos fallos que desde el navegador se ven idénticos: credencial
 * equivocada, o publicación mal configurada. Si aquí dice CORRECTO y la web
 * sigue negando el paso, el problema no está en la contraseña sino en la
 * implementación.
 *
 *   probarEntrar('nombre@unmsm.edu.pe', 'la-clave')
 */
function probarEntrar(correo, clave) {
  const c = String(correo || '').toLowerCase().trim();
  const k = String(clave  || '');
  const u = usuariosRep_().filter(function (x) { return x.correo === c; })[0];

  let texto;
  if (!u) {
    texto = 'NO EXISTE el correo «' + c + '» en este proyecto.\n' +
            'Ejecute diagnosticoAcceso() para ver los que sí están dados de alta.';
  } else if (huellaRep_(k, u.sal) !== u.huella) {
    texto = 'El correo existe, pero la contraseña NO coincide.\n' +
            'Ejecute repararAcceso() para asignarle una nueva.';
  } else {
    texto = 'CORRECTO · «' + c + '» entra con esa contraseña.\n' +
            'Si la web sigue sin dejar pasar, el fallo está en la publicación:\n' +
            'vuelva a implementar con versión «Nueva» y acceso «Cualquier usuario».';
  }
  Logger.log(texto);
  return texto;
}

/** Borra todas las credenciales. Deja el acceso interno cerrado para todos. */
function borrarTodosLosUsuarios() {
  propsRep_().deleteProperty(PROP_USUARIOS_REP);
  Logger.log('Credenciales borradas. Ejecute repararAcceso() para crear una nueva.');
}
