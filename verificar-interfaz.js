#!/usr/bin/env node
/**
 * Comprueba el comportamiento del Dashboard en un navegador de verdad: el
 * estado por defecto, el resaltado cruzado al elegir una facultad, la línea de
 * referencia —que se dibuja en el lienzo y no en el DOM, así que se mira
 * píxel a píxel—, el ancho del eje de porcentajes y los dos paneles de
 * clasificación.
 *
 *   npm i playwright chart.js && node verificar-interfaz.js
 *
 * Para que el bloque responsivo signifique algo hace falta el CSS de Tailwind,
 * que en la página llega de un CDN de desarrollo y se genera en el navegador.
 * Se le puede dar uno hecho con el CLI:
 *
 *   npm i -D tailwindcss@3
 *   npx tailwindcss -i entrada.css -o tw.css --content Dashboard.html --minify
 *   # envolver tw.css en un .js que lo inyecte y defina window.tailwind
 *   TAILWIND_SHIM=/ruta/al/shim.js node verificar-interfaz.js
 *
 * Sin él, la prueba lo detecta y falla en vez de dar por buenas unas medidas
 * tomadas sobre una página sin estilos.
 *
 * Si Playwright no está instalado, no falla: avisa y sale. Las otras dos
 * comprobaciones (verificar-tablero.js y verificar-dashboard.js) no necesitan
 * navegador y cubren los datos.
 */
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  console.log('Playwright no está instalado; se omite la prueba de interfaz.');
  console.log('  npm i playwright chart.js && node verificar-interfaz.js');
  process.exit(0);
}
const path = require('path');
const fs = require('fs');
const RUTA = 'file://' + path.join(__dirname, 'Dashboard.html');

(async () => {
  const nav = await browserLaunch();
  const pag = await nav.newPage({ viewport: { width: 1600, height: 1000 } });

  // Los CDN estan bloqueados en esta red. Chart.js se sirve desde el paquete
  // npm de la misma version mayor, para poder probar los graficos de verdad;
  // Tailwind y Font Awesome solo afectan al aspecto, y se dejan caer.
  // chart.js declara `exports` en su package.json y no publica la ruta del
  // build UMD, asi que require.resolve no da con el. Se busca a mano por las
  // carpetas de modulos, incluida la de NODE_PATH.
  const chartLocal = (() => {
    const carpetas = module.paths.concat(
      (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean));
    for (const c of carpetas) {
      const f = path.join(c, 'chart.js', 'dist', 'chart.umd.js');
      if (fs.existsSync(f)) return f;
    }
    return null;
  })();
  if (!chartLocal) {
    console.log('Aviso: sin chart.js local, los graficos dependeran del CDN.');
  }
  if (chartLocal) {
    await pag.route('**/chart.js*', r =>
      r.fulfill({ path: chartLocal, contentType: 'application/javascript' }));
  }

  // Tailwind llega de su CDN de desarrollo, que en esta red esta bloqueado y
  // ademas genera las clases en tiempo de ejecucion. Para poder comprobar el
  // comportamiento responsivo hace falta el CSS de verdad: si existe un
  // sustituto generado con el CLI, se sirve en su lugar.
  const twShim = process.env.TAILWIND_SHIM;
  if (twShim && fs.existsSync(twShim)) {
    // Con expresion regular y no con glob: la URL es
    // «https://cdn.tailwindcss.com» a secas, sin ruta, y el patron `**/…*`
    // no llega a casar. Sin darse cuenta, se estaba probando la pagina SIN
    // Tailwind, que es tanto como no probar el diseño.
    await pag.route(/cdn\.tailwindcss\.com/, r =>
      r.fulfill({ path: twShim, contentType: 'application/javascript' }));
  }
  const errores = [];
  pag.on('pageerror', e => errores.push('pageerror: ' + e.message));
  pag.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

  await pag.goto(RUTA, { waitUntil: 'networkidle', timeout: 60000 });
  await pag.waitForTimeout(1500);

  let n = 0, malas = 0;
  const ok = (t, c, x) => { n++; console.log((c?'  ok    ':'  FALLA ') + t + (c?'':'   -> '+JSON.stringify(x))); if(!c) malas++; };

  const chartJsCargo = await pag.evaluate(() => typeof Chart !== 'undefined');
  const tailwindCargo = await pag.evaluate(() => getComputedStyle(document.body).margin === '0px');
  console.log('\nEntorno');
  // En esta red los CDN estan bloqueados; eso no es un fallo del tablero, que
  // esta hecho para seguir funcionando sin ellos. Se ignoran esos errores.
  const propios = errores.filter(e =>
    !/ERR_TUNNEL_CONNECTION_FAILED|ERR_CONNECTION_RESET|tailwind is not defined/.test(e));
  ok('la pagina carga sin errores propios de JS', propios.length === 0, propios.slice(0,3));
  ok('Chart.js llego del CDN', chartJsCargo);
  // Sin Tailwind las clases responsivas no existen y las medidas de mas abajo
  // no significan nada. Se comprueba explicitamente para no dar por buenas
  // unas comprobaciones que en realidad no se estan haciendo.
  ok('Tailwind aplica sus clases (si no, el bloque responsivo no vale)',
     tailwindCargo, 'body.margin != 0: no se cargo el CSS');

  console.log('\nEstado por defecto');
  const porDefecto = await pag.evaluate(() => ({
    sel: facultadSel,
    kpis: ['kpi1-val','kpi2-val','kpi3-val','kpi4-val'].map(i => document.getElementById(i).textContent),
    colores: chart1 ? chart1.data.datasets[0].backgroundColor : null,
    barras: chart1 ? chart1.data.datasets[0].data.length : 0,
    facultadesEnLista: document.querySelectorAll('#faculty-list li').length,
    opacidades: [...document.querySelectorAll('#faculty-list li')].map(l => l.style.opacity),
    selloOculto: document.getElementById('sello-seleccion').hidden,
    quitarOculto: document.getElementById('quitar-seleccion').hidden
  }));
  ok('ninguna facultad seleccionada', porDefecto.sel === null, porDefecto.sel);
  ok('el grafico trae las 20 facultades', porDefecto.barras === 20, porDefecto.barras);
  ok('el panel de filtros lista las 20', porDefecto.facultadesEnLista === 20, porDefecto.facultadesEnLista);
  ok('todas las barras a opacidad plena',
     porDefecto.colores && porDefecto.colores.every(c => c === '#3b82f6'),
     porDefecto.colores && porDefecto.colores.slice(0,3));
  ok('todas las facultades del filtro a opacidad 1',
     porDefecto.opacidades.every(o => o === '1'), porDefecto.opacidades.slice(0,3));
  ok('sin rotulo de seleccion', porDefecto.selloOculto && porDefecto.quitarOculto);
  console.log('   KPI por defecto: ' + porDefecto.kpis.join('  '));

  console.log('\nPaneles de clasificacion');
  const clasif = await pag.evaluate(() => {
    const leer = id => [...document.querySelectorAll('#' + id + ' .clasif-grupo')].map(g => ({
      titulo: g.querySelector('.clasif-titulo').textContent.replace(/\s+/g,' ').trim(),
      items: [...g.querySelectorAll('.clasif-item')].map(i => i.textContent)
    }));
    return { a1: leer('clasif-a1'), a3: leer('clasif-a3') };
  });
  ok('hay un solo cuadro por grafico, con 4 grupos cada uno',
     clasif.a1.length === 4 && clasif.a3.length === 4, [clasif.a1.length, clasif.a3.length]);
  ok('los titulos son los pedidos, en orden',
     clasif.a1.every((g,i) => g.titulo.startsWith(['Facultades que están en el 100%',
        'Facultades con avance mayor al 80%','Facultades con avance entre el 50% y 80%',
        'Facultades con avance menor al 50%'][i])),
     clasif.a1.map(g => g.titulo));

  // Cerrar el rango es justo esto: que no quede ninguna fuera de los cuatro.
  const cobertura = await pag.evaluate(() => {
    const dentro = clave => {
      const puestas = new Set();
      TRAMOS.forEach(t => DATOS_FUENTE.facultades
        .filter(f => typeof f[clave] === 'number' && t.prueba(f[clave]))
        .forEach(f => puestas.add(f.sigla)));
      return { puestas: puestas.size, total: DATOS_FUENTE.facultades.length,
               fuera: DATOS_FUENTE.facultades.filter(f => !puestas.has(f.sigla))
                        .map(f => f.sigla + ':' + f[clave]) };
    };
    return { a1: dentro('pctAnexo1'), a3: dentro('pctAnexo3') };
  });
  ok('el rango queda cerrado en el Anexo 1: ninguna facultad fuera de los tramos',
     cobertura.a1.fuera.length === 0, cobertura.a1);
  ok('y cerrado tambien en el Anexo 3', cobertura.a3.fuera.length === 0, cobertura.a3);
  // Y que nadie caiga en dos a la vez, que seria contarla dos veces.
  const solapes = await pag.evaluate(() => DATOS_FUENTE.facultades.filter(f =>
     TRAMOS.filter(t => t.prueba(f.pctAnexo1)).length > 1).map(f => f.sigla + ':' + f.pctAnexo1));
  ok('los tramos no se solapan', solapes.length === 0, solapes);
  const enA1 = await pag.evaluate(() => DATOS_FUENTE.facultades.filter(f => f.pctAnexo1 >= 100).map(f => f.sigla));
  ok('el grupo del 100% del Anexo 1 cuadra con los datos',
     JSON.stringify(clasif.a1[0].items.sort()) === JSON.stringify(enA1.sort()),
     { panel: clasif.a1[0].items, datos: enA1 });
  const menor50A3 = await pag.evaluate(() => DATOS_FUENTE.facultades.filter(f => f.pctAnexo3 < 50).map(f => f.sigla));
  // El grupo de <50% es el ultimo, ahora que el rango va cerrado.
  const ultimoA3 = clasif.a3[clasif.a3.length - 1];
  ok('el grupo de <50% del Anexo 3 evalua SOLO el Anexo 3',
     JSON.stringify(ultimoA3.items.sort()) === JSON.stringify(menor50A3.sort()),
     { panel: ultimoA3.items, datos: menor50A3 });
  const medioA3 = await pag.evaluate(() =>
     DATOS_FUENTE.facultades.filter(f => f.pctAnexo3 >= 50 && f.pctAnexo3 <= 80).map(f => f.sigla));
  ok('el tramo nuevo 50-80 recoge las que antes quedaban fuera',
     JSON.stringify(clasif.a3[2].items.sort()) === JSON.stringify(medioA3.sort()),
     { panel: clasif.a3[2].items, datos: medioA3 });

  console.log('\nEje de porcentajes');
  const eje = await pag.evaluate(() => ({
    ancho1: chart1.scales.y.width, ancho3: chart3.scales.y.width,
    etiquetas: chart1.scales.y.ticks.map(t => t.label),
    separacion: chart1.options.scales.y.ticks.padding
  }));
  ok('el eje Y reserva al menos 62 px en los dos graficos',
     eje.ancho1 >= 62 && eje.ancho3 >= 62, eje);
  ok('las etiquetas llevan el signo de porcentaje separado',
     eje.etiquetas.every(e => / %$/.test(e)), eje.etiquetas);
  ok('y se despegan de la linea del eje', eje.separacion >= 8, eje.separacion);

  await pag.screenshot({ path: path.join(require('os').tmpdir(), 'dash-defecto.png') });

  console.log('\nAl hacer clic en una facultad');
  await pag.evaluate(() => seleccionarFacultad('F05_FO'));
  await pag.waitForTimeout(600);
  const tras = await pag.evaluate(() => {
    const f = DATOS_FUENTE.facultades.find(x => x.codigo === 'F05_FO');
    return {
      sel: facultadSel,
      kpi1: document.getElementById('kpi1-val').textContent,
      kpi2: document.getElementById('kpi2-val').textContent,
      kpi3: document.getElementById('kpi3-val').textContent,
      kpi4: document.getElementById('kpi4-val').textContent,
      esperado: [f.pctGeneral, f.pctAnexo1, f.pctAnexo3],
      colores: chart1.data.datasets[0].backgroundColor,
      idx: DATOS_FUENTE.facultades.findIndex(x => x.codigo === 'F05_FO'),
      sello: document.getElementById('sello-seleccion').textContent,
      selloOculto: document.getElementById('sello-seleccion').hidden,
      kpi4Global: DATOS_FUENTE.kpi.anexo4
    };
  });
  const fmt = v => v.toFixed(1).replace('.', ',') + '%';
  ok('queda seleccionada', tras.sel === 'F05_FO', tras.sel);
  ok('el KPI de fase 1 pasa a ser el de la facultad',
     tras.kpi1 === fmt(tras.esperado[0]), [tras.kpi1, fmt(tras.esperado[0])]);
  ok('el KPI del Anexo 1 tambien', tras.kpi2 === fmt(tras.esperado[1]), [tras.kpi2, fmt(tras.esperado[1])]);
  ok('el KPI del Anexo 3 tambien', tras.kpi3 === fmt(tras.esperado[2]), [tras.kpi3, fmt(tras.esperado[2])]);
  ok('el KPI del Anexo 4 NO se filtra (es institucional)',
     tras.kpi4 === fmt(tras.kpi4Global), [tras.kpi4, fmt(tras.kpi4Global)]);
  ok('la barra elegida conserva el color solido',
     tras.colores[tras.idx] === '#3b82f6', tras.colores[tras.idx]);
  ok('las demas barras se atenuan',
     tras.colores.filter((c,i) => i !== tras.idx).every(c => c === '#3b82f633'),
     tras.colores.slice(0,3));
  ok('aparece el rotulo con la sigla', !tras.selloOculto && tras.sello === 'FO', tras.sello);

  // La linea discontinua se dibuja en el lienzo, no en el DOM: se comprueba
  // mirando los pixeles a la altura del valor de la facultad elegida.
  const linea = await pag.evaluate(() => {
    const f = DATOS_FUENTE.facultades.find(x => x.codigo === 'F05_FO');
    const y = Math.round(chart1.scales.y.getPixelForValue(f.pctAnexo1));
    const area = chart1.chartArea;
    const ctx = chart1.canvas.getContext('2d');
    const rel = window.devicePixelRatio || 1;
    const franja = ctx.getImageData(Math.round(area.left * rel) + 4, Math.round(y * rel) - 1,
                                    Math.round((area.right - area.left) * rel) - 8, 3).data;
    // Cuenta pixeles del azul de la linea (#3b82f6) a esa altura.
    let pintados = 0, huecos = 0;
    for (let i = 0; i < franja.length; i += 4) {
      const [r, g, b, a] = [franja[i], franja[i+1], franja[i+2], franja[i+3]];
      if (a > 200 && Math.abs(r - 59) < 40 && Math.abs(g - 130) < 40 && Math.abs(b - 246) < 40) pintados++;
      else if (a < 30) huecos++;
    }
    return { pintados, huecos, y, alto: chart1.canvas.height };
  });
  ok('la linea de referencia se dibuja a la altura de la facultad',
     linea.pintados > 40, linea);
  ok('y es discontinua, no maciza', linea.huecos > 10, linea);

  await pag.screenshot({ path: path.join(require('os').tmpdir(), 'dash-seleccion.png') });

  console.log('\nVolver a las veinte');
  await pag.evaluate(() => seleccionarFacultad('F05_FO'));
  await pag.waitForTimeout(400);
  const vuelta = await pag.evaluate(() => ({
    sel: facultadSel,
    kpi1: document.getElementById('kpi1-val').textContent,
    general: DATOS_FUENTE.kpi.general,
    colores: chart1.data.datasets[0].backgroundColor
  }));
  ok('volver a pulsar deshace el filtro', vuelta.sel === null, vuelta.sel);
  ok('los KPI vuelven al conjunto', vuelta.kpi1 === fmt(vuelta.general), [vuelta.kpi1, fmt(vuelta.general)]);
  ok('las barras recuperan el color pleno',
     vuelta.colores.every(c => c === '#3b82f6'));

  console.log('\nVariacion de cada anexo contra SU revision anterior');
  // Se inyecta un historial con fechas escalonadas: si la tarjeta rotulara la
  // fecha de una corrida conjunta, mostraria la de otro anexo.
  const variacion = await pag.evaluate(() => {
    DATOS_FUENTE.historial = {
      anexo1: { actual: { valor: 81.3, fecha: '2026-08-28T09:00:00Z' },
                anterior: { valor: 78.2, fecha: '2026-08-20T10:00:00Z' },
                variacion: 3.1, registros: 3 },
      anexo3: { actual: { valor: 61.4, fecha: '2026-08-27T16:00:00Z' },
                anterior: { valor: 70.0, fecha: '2026-08-15T11:00:00Z' },
                variacion: -8.6, registros: 2 },
      anexo4: { actual: { valor: 40.4, fecha: '2026-09-01T12:00:00Z' },
                anterior: null, variacion: null, registros: 1 }
    };
    vincularVariaciones();
    const leer = id => document.getElementById(id);
    return {
      a1: leer('kpi2-var').textContent.trim(), a1cls: leer('kpi2-var').className,
      a3: leer('kpi3-var').textContent.trim(), a3cls: leer('kpi3-var').className,
      a4: leer('kpi4-var').textContent.trim()
    };
  });
  ok('la subida sale con signo, en pp y con la fecha de SU anterior',
     /\+3,1 pp vs R\. 20\/08/.test(variacion.a1), variacion.a1);
  ok('y en verde', /emerald/.test(variacion.a1cls));
  ok('la bajada sale negativa y con la fecha de SU anterior, otro dia distinto',
     /-8,6 pp vs R\. 15\/08/.test(variacion.a3), variacion.a3);
  ok('y en rojo', /rose/.test(variacion.a3cls));
  ok('con un solo registro dice que no hay anterior, en vez de inventar un 0',
     /sin revisión anterior/.test(variacion.a4), variacion.a4);

  console.log('\nLineas de tendencia historica');
  const tend = await pag.evaluate(() => {
    // Historial con cuatro registros del Anexo 1, dos del 3 y uno del 4:
    // cubre la tendencia normal, la minima y el caso sin tendencia.
    const serie = puntos => puntos.map((v, i) => ({
      fecha: new Date(Date.UTC(2026, 6, 10 + i * 9)).toISOString(),
      valor: v, variacion: i === 0 ? null : Math.round((v - puntos[i-1]) * 10) / 10
    }));
    const s1 = serie([62.0, 70.5, 68.1, 81.3]);
    const s3 = serie([50.0, 61.4]);
    const s4 = serie([40.4]);
    DATOS_FUENTE.historial = {
      anexo1: { actual: s1[3], anterior: s1[2], variacion: 13.2, registros: 4, serie: s1 },
      anexo3: { actual: s3[1], anterior: s3[0], variacion: 11.4, registros: 2, serie: s3 },
      anexo4: { actual: s4[0], anterior: null, variacion: null, registros: 1, serie: s4 }
    };
    pintarTendencias();
    return {
      claves: Object.keys(TENDENCIAS),
      puntos1: TENDENCIAS.anexo1 ? TENDENCIAS.anexo1.data.datasets[0].data : null,
      etiquetas1: TENDENCIAS.anexo1 ? TENDENCIAS.anexo1.data.labels : null,
      tipo: TENDENCIAS.anexo1 ? TENDENCIAS.anexo1.config.type : null,
      serieEnPlugin: TENDENCIAS.anexo1
        ? TENDENCIAS.anexo1.options.plugins.rotuloVariacion.serie.map(p => p.variacion) : null,
      caja4Oculta: document.getElementById('tend-caja-4').hidden,
      aviso4: document.getElementById('tend-vacio-4').textContent,
      aviso4Visible: !document.getElementById('tend-vacio-4').hidden
    };
  });
  ok('hay tendencia para los anexos con dos registros o mas',
     tend.claves.sort().join(',') === 'anexo1,anexo3', tend.claves);
  ok('es un grafico de lineas', tend.tipo === 'line', tend.tipo);
  ok('traza TODAS las versiones del historial, no solo las dos ultimas',
     tend.puntos1 && tend.puntos1.length === 4, tend.puntos1);
  ok('en orden, de la primera a la actual',
     JSON.stringify(tend.puntos1) === JSON.stringify([62, 70.5, 68.1, 81.3]), tend.puntos1);
  ok('el eje rotula la fecha de cada version',
     tend.etiquetas1 && tend.etiquetas1.length === 4 &&
     tend.etiquetas1.every(e => /^\d{2}\/\d{2}$/.test(e)), tend.etiquetas1);
  ok('cada punto lleva su variacion contra el inmediatamente anterior',
     JSON.stringify(tend.serieEnPlugin) === JSON.stringify([null, 8.5, -2.4, 13.2]),
     tend.serieEnPlugin);
  ok('con un solo registro no dibuja una tendencia falsa',
     tend.caja4Oculta && tend.aviso4Visible && /una sola revisión/i.test(tend.aviso4),
     tend.aviso4);

  // La variacion se rotula sobre el lienzo: se busca el verde de una subida
  // y el rojo de la bajada del tercer punto.
  const colores = await pag.evaluate(() => {
    const c = TENDENCIAS.anexo1.canvas;
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let verde = 0, rojo = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i+3] < 128) continue;
      if (Math.abs(d[i]-5) < 45 && Math.abs(d[i+1]-150) < 45 && Math.abs(d[i+2]-105) < 45) verde++;
      if (Math.abs(d[i]-225) < 45 && Math.abs(d[i+1]-29) < 45 && Math.abs(d[i+2]-72) < 45) rojo++;
    }
    return { verde, rojo };
  });
  ok('las subidas se rotulan en verde sobre el grafico', colores.verde > 20, colores);
  ok('y la caida del tercer punto, en rojo', colores.rojo > 20, colores);

  console.log('\nSincronizacion del filtro lateral con las tarjetas');
  // Se inyecta un desglose conocido para poder comprobar cifras exactas.
  await pag.evaluate(() => {
    DATOS_FUENTE.facultades.forEach((f, i) => {
      f.procesosN0  = { conformes: 5 + i, observados: 3, sinRegistrar: 1, total: 9 + i };
      f.subprocesos = { conformes: 10 + i, observados: 4, sinRegistrar: 0, total: 14 + i };
    });
    facultadSel = null; derivarDeLaFuente(); aplicarSeleccion();
  });
  const global = await pag.evaluate(() => ['prod-conf','proc-conf','sub-conf','prod-obs']
      .map(i => document.getElementById(i).textContent));
  // Se elige una facultad que SI tenga productos conformes en los datos, para
  // que la comprobacion de la tabla mida el filtro y no la falta de registros.
  const facPrueba = await pag.evaluate(() => {
    const con = allData.find(d => d.entity === 'Producto' && d.status === 'CONFORME');
    return con ? con.faculty : DATOS_FUENTE.facultades[0].codigo;
  });
  await pag.evaluate(c => seleccionarFacultad(c), facPrueba);
  await pag.waitForTimeout(350);
  await pag.evaluate(c => { window.__facPrueba = c; }, facPrueba);
  const deFO = await pag.evaluate(() => {
    const f = DATOS_FUENTE.facultades.find(x => x.codigo === window.__facPrueba);
    return {
      leidos: ['prod-conf','prod-obs','prod-sin','proc-conf','proc-obs','proc-sin',
               'sub-conf','sub-obs','sub-sin']
              .map(i => document.getElementById(i).textContent),
      esperados: [f.productos.conformes, f.productos.observados, f.productos.sinRegistrar,
                  f.procesosN0.conformes, f.procesosN0.observados, f.procesosN0.sinRegistrar,
                  f.subprocesos.conformes, f.subprocesos.observados, f.subprocesos.sinRegistrar]
                 .map(String),
      denominador: document.querySelector('.status-filter[data-block="procesos"] .m-den').textContent,
      totalProc: f.procesosN0.total
    };
  });
  ok('las tres tarjetas pasan a las cifras de la facultad',
     JSON.stringify(deFO.leidos) === JSON.stringify(deFO.esperados), deFO);
  ok('y no son las del conjunto',
     JSON.stringify(deFO.leidos.slice(0,1)) !== JSON.stringify(global.slice(0,1)),
     [deFO.leidos[0], global[0]]);
  ok('el denominador «/ de N» sigue al filtro, no se queda fijo',
     deFO.denominador === '/ de ' + deFO.totalProc, deFO.denominador);

  console.log('\nLa tabla de detalle sigue al filtro y cambia de origen');
  const tabla = async () => pag.evaluate(() => ({
    titulo: document.getElementById('tableTitleA1').textContent,
    pie: document.getElementById('dataFooterA1').textContent,
    filas: [...document.querySelectorAll('#productRowsA1 tr')]
             .map(tr => tr.children[0] ? tr.children[0].textContent : ''),
    selector: document.getElementById('filterFacultyA1').value,
    alerta: document.getElementById('productRowsA1').closest('table')
              .classList.contains('col-obs-alerta'),
    fondoObs: (() => {
      const c = document.querySelector('#productRowsA1 tr td:nth-child(10)');
      return c ? getComputedStyle(c).backgroundColor : null;
    })()
  }));

  await pag.evaluate(() => filterByStatus('producto', 'CONFORME'));
  await pag.waitForTimeout(250);
  let t = await tabla();
  ok('la tabla muestra solo la facultad elegida',
     t.filas.length > 0 && t.filas.every(f => f === facPrueba), t.filas.slice(0, 4));
  ok('el desplegable de la tabla refleja el panel lateral',
     t.selector === facPrueba, t.selector);
  ok('y el titulo lo dice', t.titulo.includes(facPrueba), t.titulo);

  await pag.evaluate(() => { facultadSel = null; aplicarSeleccion(); });
  await pag.waitForTimeout(250);
  const limpio = await tabla();
  ok('al quitar la seleccion el desplegable se vacia con ella',
     limpio.selector === '' && !limpio.titulo.includes('_'),
     [limpio.selector, limpio.titulo]);

  // Cada tarjeta debe cambiar el ORIGEN de la tabla, no solo el rotulo.
  for (const [bloque, rotulo, hoja] of [
      ['producto', 'Productos', 'DETALLADO_PRODUCTOS_A1'],
      ['procesos', 'Procesos', 'OBSERVACIONES_DE_PROCESO_A1'],
      ['subprocesos', 'Subprocesos', 'OBSERVACIONES_DE_PROCESO_A1']]) {
    await pag.evaluate(b => filterByStatus(b, 'CONFORME'), bloque);
    await pag.waitForTimeout(220);
    const r = await pag.evaluate(b => {
      const entidad = ORIGEN_TABLA[b].entidad;
      const enTabla = document.getElementById('visibleCountA1').textContent;
      const esperados = allData.filter(d => d.entity === entidad && d.status === 'CONFORME').length;
      return { enTabla: Number(enTabla), esperados,
               titulo: document.getElementById('tableTitleA1').textContent,
               pie: document.getElementById('dataFooterA1').textContent };
    }, bloque);
    ok('«' + rotulo + '» proyecta sus propios registros, no los de productos',
       r.enTabla === r.esperados && r.esperados > 0, r);
    ok('  y el titulo y el origen lo dicen: ' + hoja,
       r.titulo.includes(rotulo) && r.pie.includes(hoja), [r.titulo, r.pie.slice(0, 60)]);
  }

  console.log('\nResaltado de la columna de observaciones');
  await pag.evaluate(() => filterByStatus('producto', 'CONFORME'));
  await pag.waitForTimeout(220);
  const conforme = await tabla();
  ok('en CONFORME la columna no se resalta', !conforme.alerta, conforme.alerta);
  for (const estado of ['OBSERVADO', 'SIN REGISTRAR']) {
    await pag.evaluate(e => filterByStatus('producto', e), estado);
    await pag.waitForTimeout(220);
    const r = await tabla();
    ok('en ' + estado + ' la columna se marca', r.alerta, r.alerta);
    if (r.fondoObs) {
      const m = r.fondoObs.match(/\d+/g).map(Number);
      ok('  y el fondo es amarillo', m[0] > 240 && m[1] > 230 && m[2] < 210, r.fondoObs);
    }
  }
  await pag.evaluate(() => filterByStatus('producto', 'CONFORME'));
  await pag.waitForTimeout(200);
  ok('al volver a CONFORME el resaltado se quita solo', !(await tabla()).alerta);

  console.log('\nPanel de filtros: nombre completo y dos metricas');
  const panel = await pag.evaluate(() => {
    const li = document.querySelector('#faculty-list li');
    const nom = li.querySelector('.nombre-facultad');
    const met = li.querySelector('.metricas-facultad');
    return {
      texto: nom.textContent,
      completo: nom.textContent === DATOS_FUENTE.facultades[0].nombre,
      truncado: getComputedStyle(nom).textOverflow === 'ellipsis' ||
                nom.scrollWidth > nom.clientWidth + 1,
      metricas: met.textContent.replace(/\s+/g, ' ').trim(),
      conTruncate: [...document.querySelectorAll('#faculty-list .truncate')].length
    };
  });
  ok('el nombre aparece entero', panel.completo, panel.texto);
  ok('y no se corta con puntos suspensivos',
     !panel.truncado && panel.conTruncate === 0, panel);
  ok('debajo van las dos metricas por separado',
     /proc\. nivel 0/.test(panel.metricas) && /subprocesos/.test(panel.metricas),
     panel.metricas);

  console.log('\nResponsivo');
  const pantallas = [
    ['movil pequeno', 360, 740], ['movil', 414, 896], ['tableta vertical', 768, 1024],
    ['tableta apaisada', 1024, 768], ['portatil', 1366, 768], ['monitor', 1920, 1080]
  ];
  for (const [nombre, w, h] of pantallas) {
    await pag.setViewportSize({ width: w, height: h });
    // Chart.js redimensiona sus lienzos en diferido. Sin esperar a que
    // termine, se mide un lienzo con el tamaño de la resolucion anterior y el
    // fallo que sale es del cronometraje, no del diseño.
    await pag.waitForTimeout(500);
    await pag.evaluate(() => {
      [chart1, chart3, ...Object.values(TENDENCIAS)].forEach(c => c && c.resize());
    });
    await pag.waitForTimeout(350);
    const m = await pag.evaluate(() => {
      const chocan = (a, b) => {
        if (!a || !b) return false;
        return !(a.right <= b.left + 1 || b.right <= a.left + 1 ||
                 a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
      };
      const caja = sel => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
      const kpis = [...document.querySelectorAll('[id$="-val"]')].map(e => e.getBoundingClientRect());
      return {
        desborde: document.documentElement.scrollWidth - window.innerWidth,
        lienzo: Math.round((caja('#chartAnexo1') || {width:0}).width),
        panelClasif: Math.round((caja('#clasif-a1') || {width:0}).width),
        tarjetaKpi: Math.round((caja('#kpi2-val') || {width:0}).width),
        tendencia: Math.round((caja('#tend-anexo1') || {width:0}).width),
        // ¿Se solapa alguna cifra grande con la siguiente?
        solapeKpi: kpis.some((a, i) => kpis.slice(i + 1).some(b => chocan(a, b))),
        // ¿Se sale algo del ancho de la ventana?
        fuera: [...document.querySelectorAll('.glass-card, canvas, h1')]
          .filter(e => { const r = e.getBoundingClientRect();
                         return r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2); })
          .length
      };
    });
    ok(nombre + ' (' + w + 'x' + h + '): sin desplazamiento horizontal', m.desborde <= 1, m);
    ok(nombre + ': ningun elemento se sale del ancho', m.fuera === 0, m);
    ok(nombre + ': las cifras de las tarjetas no se solapan', !m.solapeKpi, m);
    ok(nombre + ': el grafico conserva ancho util', m.lienzo >= 180, m);
    ok(nombre + ': la linea de tendencia se dibuja', m.tendencia >= 120, m);
  }
  await pag.setViewportSize({ width: 390, height: 844 });
  await pag.waitForTimeout(400);
  await pag.screenshot({ path: path.join(require('os').tmpdir(), 'dash-movil.png'), fullPage: true });
  await pag.setViewportSize({ width: 1600, height: 1000 });
  await pag.waitForTimeout(400);
  await pag.screenshot({ path: path.join(require('os').tmpdir(), 'dash-escritorio.png'), fullPage: true });

  console.log('\n' + n + ' comprobaciones - ' + (malas ? malas + ' FALLAN' : 'todas correctas'));
  if (errores.length) { console.log('\nErrores de consola:'); errores.slice(0,6).forEach(e => console.log('  ' + e)); }
  await nav.close();
  process.exit(malas ? 1 : 0);
})();

/** El Chromium preinstalado no siempre está donde Playwright lo busca. */
async function browserLaunch() {
  try { return await chromium.launch(); }
  catch (e) {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    const dir = fs.existsSync(base)
      ? fs.readdirSync(base).find(d => /^chromium-\d+$/.test(d)) : null;
    if (!dir) throw e;
    return await chromium.launch({
      executablePath: path.join(base, dir, 'chrome-linux', 'chrome') });
  }
}
