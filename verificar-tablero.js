#!/usr/bin/env node
/**
 * Verifica Tablero.gs —el origen de datos en vivo del Dashboard— sin Apps
 * Script, sin red y sin tocar el libro de verdad.
 *
 *   node verificar-tablero.js
 *
 * Se le dan hojas simuladas con los encabezados y los formatos que escriben
 * de verdad los auditores de los anexos: los avances como fracción, porque la
 * celda lleva formato 0.0% y vale 0.813 en lugar de 81.3, y las filas de TOTAL
 * y de leyenda al pie, que no son facultades y no deben colarse en el catálogo.
 * Son las dos cosas que más fácilmente rompen el tablero en silencio.
 */
const fs = require('fs'), vm = require('vm');

const FAC = [['FM','F01'],['FDCP','F02'],['FLCH','F03'],['FFB','F04'],['FO','F05'],
  ['FE','F06'],['FQIQ','F07'],['FMV','F08'],['FCA','F09'],['FCB','F10'],
  ['FCC','F11'],['FCE','F12'],['FCF','F13'],['FCM','F14'],['FCCSS','F15'],
  ['FIGMMG','F16'],['FII','F17'],['FPSIC','F18'],['FIEE','F19'],['FISI','F20']];

// Filas tal como las escriben los auditores, con sus formatos reales:
// los avances como fracción (formato 0.0%), y filas de TOTAL y leyenda al pie.
const general = FAC.map(([s],i) => [s,'FACULTAD '+s, 0.80+i*0.005, 0.60+i*0.005, 0.70+i*0.005, 'En proceso — 3 hallazgo(s) crítico(s)','nota'])
  .concat([['TOTAL','PROMEDIO DE LAS 20 FACULTADES','','',0.75,'En proceso','']]);

const resA1 = FAC.map(([s],i) => [s,'FACULTAD '+s, 100, 60, 35, 5, 0.775,'En proceso','diag', 20+i,
                                   5,3,1, 10,4,0, 0.8,'En proceso','diag', 'F'+String(i+1).padStart(2,'0'), 0.79])
  .concat([['','LEYENDA','CONFORME = cumple los 8 criterios']]);   // pie que no es facultad

const resA3 = FAC.map(([s]) => [s,'FACULTAD '+s, 16,16, 2, 12, 2, 1,'obs','En proceso','notas', 0.615])
  .concat([['TOTAL','TOTAL DE LAS 20', 320,320,40,240,40,20,'','','',0.61]]);

const productos = [['FM',7,'PE.01 GESTIÓN ESTRATÉGICA','PE.01.01.01_F01','PLAN ESTRATÉGICO','Final / Salida','CONFORME','100%','8/8','Cumple los 8 criterios.']];
const procesos  = [['FM','PE.01','GESTIÓN ESTRATÉGICA','Nivel 0','Obligatorio',6,'CONFORME','100%','5/5',''],
                   ['FM','PE.01.01','PLANEAMIENTO','Subproceso','Obligatorio',7,'OBSERVADO','60%','3/5','Falta código']];
// RESUMEN_FICHAS_A3: su columna 10 (CLASIFICACION) lleva los mismos rotulos
// que el detalle, asi que la ficha se clasifica igual que el campo.
const fichas = [
  ['FM','FACULTAD DE MEDICINA','1. GESTION','PE.01_F01','SI',0.95,'2','','','0','Correcto','ok'],
  ['FM','FACULTAD DE MEDICINA','2. CALIDAD','PE.02_F01','NO',0.45,'2','campo X','err','3','Crítico','Faltan campos'],
  ['FM','FACULTAD DE MEDICINA','3. INVEST.','PM.02_F01','NO',0.60,'1','','','1','Observación','revisar'],
  ['FDCP','FACULTAD DE DERECHO','1. GESTION','PE.01_F02','NO',0.30,'0','','','2','Incompleto','falta']];
const indic     = [['IND-01','Cobertura','Aprobado'],['IND-02','Plazos','Pendiente'],['IND-03','Calidad','Conforme']];
const hist      = [[new Date('2026-08-20T10:00:00Z'),'Anexo 1',78.2],
                   [new Date('2026-08-20T10:00:00Z'),'Anexo 3',55.0],
                   [new Date('2026-08-28T09:00:00Z'),'Anexo 1',81.3],
                   [new Date('2026-08-28T09:00:00Z'),'Anexo 3',61.4],
                   [new Date('2026-08-28T09:00:00Z'),'Anexo 4',20.6]];

// La hoja de catálogo con el nombre EXACTO que tiene el libro: hay un espacio
// suelto detrás del guion bajo, y ese detalle es justo lo que buscarHoja_ debe
// tolerar. Sus columnas van en otro orden que el del código, a propósito.
const catalogo = [['N°','FACULTAD','SIGLA','CODIGO']].concat(
  FAC.map(([s,c],i) => [i+1, 'FACULTAD '+s, s, c]));

// DETALLE_REVISION_A3: los cinco rotulos que escribe el auditor, incluido
// «Opcional», que no debe contar ni como acierto ni como fallo.
const camposA3 = [['FACULTAD','NOMBRE','N° FICHA / PROCESO','SECCION','CAMPO REVISADO',
                   'N° DE FILA','CELDA','CODIGO ENCONTRADO','¿CAMPO COMPLETO?',
                   'CLASIFICACION','OBSERVACION ESPECIFICA']];
[['FM','Correcto'], ['FM','Correcto'], ['FM','Observación'], ['FM','Incompleto'],
 ['FM','Crítico'], ['FM','Opcional'], ['FDCP','Correcto'], ['FDCP','Crítico']
].forEach(([sig, clas], i) => camposA3.push(
  [sig, 'FACULTAD ' + sig, '1. GESTION', 'Seccion A', 'Campo ' + i, 10 + i, 'B' + i,
   'PE.01_F01', clas === 'Correcto' ? 'Sí' : 'No', clas, 'obs ' + i]));

// REGISTRO_MAESTRO_CODIGOS_A3
const codigosA3 = [['FACULTAD','NOMBRE','TIPO','CODIGO','DENOMINACION',
                    'FICHAS EN QUE APARECE','¿DENOMINACION CONSISTENTE?','OBSERVACION']];
[['FM','Sí'], ['FM','Sí'], ['FM','No'], ['FDCP','Sí'], ['FDCP','No'], ['FDCP','']
].forEach(([sig, cons], i) => codigosA3.push(
  [sig, 'FACULTAD ' + sig, 'Proceso', 'PE.0' + i + '_F01', 'DENOM ' + i,
   '2 fichas', cons, 'obs ' + i]));

const HOJAS_OK = {
  'RESUMEN_GENERAL': [['SIGLA']].concat(general),
  'RESUMEN_EJECUTIVO_A1': [['FACULTAD']].concat(resA1),
  'RESUMEN_EJECUTIVO_A3': [['SIGLA']].concat(resA3),
  'DETALLADO_PRODUCTOS_A1': [['FACULTAD']].concat(productos),
  'OBSERVACIONES_DE_PROCESO_A1': [['FACULTAD']].concat(procesos),
  'RESUMEN_FICHAS_A3': [['FACULTAD']].concat(fichas),
  'RESUMEN_EJECUTIVO_A4': [['CODIGO','INDICADOR','ESTADO']].concat(indic),
  'HISTORIAL_REVISIONES': [['FECHA_HORA','ANEXO','PORCENTAJE']].concat(hist),
  'CODIFICACION_ DE_LAS_FACULTADES': catalogo,
  'DETALLE_REVISION_A3': camposA3,
  'REGISTRO_MAESTRO_CODIGOS_A3': codigosA3
};

/** Ejecuta Tablero.gs contra un juego de hojas, en un contexto limpio. */
function correr(hojas) {
  const ctx = {
    Logger: { log: () => {} },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    SpreadsheetApp: { openById: () => ({
        getName: () => '4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES',
        getSheets: () => Object.keys(hojas).map(n => envoltura(n, hojas[n])),
        getSheetByName: (n) => hojas[n] ? envoltura(n, hojas[n]) : null
      }) },
    console
  };
  const envoltura = (nombre, filas) => ({
    getName: () => nombre,
    getLastRow: () => filas.length,
    getDataRange: () => ({ getValues: () => filas }),
    // Solo lo que Tablero.gs pide: una celda suelta por su referencia A1.
    getRange: (ref) => {
      const m = /^([A-Z]+)(\d+)$/.exec(ref);
      if (!m) throw new Error('referencia no soportada: ' + ref);
      let col = 0;
      for (const c of m[1]) col = col * 26 + (c.charCodeAt(0) - 64);
      const fila = filas[Number(m[2]) - 1];
      return { getValue: () => (fila ? fila[col - 1] : undefined) };
    }
  });
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('apps-script/Tablero.gs','utf8'), ctx);
  return vm.runInContext('tablero({sinCache:true})', ctx);
}

const d = correr(HOJAS_OK);

let n=0, malas=0;
const ok=(t,c,x)=>{n++;console.log((c?'  ok    ':'  FALLA ')+t+(c?'':'   -> '+JSON.stringify(x)));if(!c)malas++;};

console.log('\nForma de la respuesta');
['facultades','totales','kpi','anexo4','revisiones','registros','cobertura']
  .forEach(k => ok('trae ' + k, d[k] !== undefined));

console.log('\nCatalogo');
ok('son 20 facultades', d.facultades.length===20, d.facultades.length);
ok('descarta la fila TOTAL y la leyenda',
   d.facultades.every(f=>/^F\d\d_/.test(f.codigo)), d.facultades.map(f=>f.codigo).slice(0,3));
ok('FII conserva F17', d.facultades.find(f=>f.sigla==='FII').codigo==='F17_FII');
ok('FISI conserva F20', d.facultades.find(f=>f.sigla==='FISI').codigo==='F20_FISI');
ok('el numero del codigo coincide con el orden',
   d.facultades.every(f=>Number(f.codigo.slice(1,3))===f.orden));

console.log('\nConversion de porcentajes (la celda vale 0.80, no 80)');
const fm = d.facultades.find(f=>f.sigla==='FM');
ok('0.80 se lee como 80', fm.pctAnexo1===80, fm.pctAnexo1);
ok('0.60 se lee como 60', fm.pctAnexo3===60, fm.pctAnexo3);
ok('ninguno pasa de 100', d.facultades.every(f=>f.pctAnexo1<=100&&f.pctAnexo3<=100));

console.log('\nAritmetica de los totales');
const suma=(k,s)=>d.facultades.reduce((a,f)=>a+f[k][s],0);
ok('productos conformes cuadran', suma('productos','conformes')===d.totales.prodConf);
ok('productos observados cuadran', suma('productos','observados')===d.totales.prodObs);
ok('fichas completas cuadran', suma('fichas','completas')===d.totales.fichComp);
// El KPI que se pinta sale del historial; lo que las hojas dan por su cuenta
// queda en kpi.hojas, y ahi es donde se comprueba la ponderacion.
ok('el calculo de las hojas para el Anexo 1 es ponderado, no promedio simple',
   d.kpi.hojas.anexo1===Math.round(((d.totales.prodConf+d.totales.prodObs/2)/
     (d.totales.prodConf+d.totales.prodObs+d.totales.prodSin))*1000)/10, d.kpi.hojas.anexo1);
ok('los 4 KPI estan entre 0 y 100',
   ['general','anexo1','anexo3','anexo4'].every(k=>d.kpi[k]>=0&&d.kpi[k]<=100), d.kpi);

console.log('\nDetalle');
ok('el producto sale como Producto', d.registros.some(r=>r.entity==='Producto'));
ok('NIVEL separa Proceso de SubProceso',
   d.registros.some(r=>r.entity==='Proceso') && d.registros.some(r=>r.entity==='SubProceso'),
   d.registros.map(r=>r.entity));
ok('la ficha sale como Ficha', d.registros.some(r=>r.entity==='Ficha'));
ok('la sigla se convierte en codigo de facultad',
   d.registros.every(r=>/^F\d\d_/.test(r.faculty)), d.registros.map(r=>r.faculty));
ok('los id no se repiten', new Set(d.registros.map(r=>r.id)).size===d.registros.length);
// La ficha ya no se clasifica por el «¿COMPLETA?» de Si/No sino por su
// columna CLASIFICACION, que distingue cuatro estados en vez de dos.
ok('la ficha marcada Crítico llega a la tabla como CRITICO',
   d.registros.some(r => r.entity === 'Ficha' && r.status === 'CRITICO'),
   d.registros.filter(r => r.entity === 'Ficha').map(r => r.status));
// Sin esa columna se recae en el Si/No, que solo da dos estados.
const sinClas = fichas.map(f => f.slice(0, 10).concat(['', f[11]]));
const dSinClas = correr(Object.assign({}, HOJAS_OK,
  { 'RESUMEN_FICHAS_A3': [['FACULTAD']].concat(sinClas) }));
ok('sin CLASIFICACION recae en el «¿COMPLETA?» de toda la vida',
   dSinClas.facultades.find(f => f.sigla === 'FM').fichasEstado.conformes === 1 &&
   dSinClas.facultades.find(f => f.sigla === 'FM').fichasEstado.observados === 2,
   dSinClas.facultades.find(f => f.sigla === 'FM').fichasEstado);

console.log('\nAnexo 4 e historico');
ok('cuenta 2 aprobados de 3 indicadores',
   d.anexo4.aprobados===2 && d.anexo4.indicadores===3, d.anexo4);
ok('devuelve dos revisiones para la variacion', d.revisiones.length===2, d.revisiones.length);
ok('la ultima se rotula «Revisión actual»',
   d.revisiones[d.revisiones.length-1].etiqueta==='Revisión actual');
ok('la anterior conserva sus cifras',
   d.revisiones[0].anexo1===78.2, d.revisiones[0]);

console.log('\nNombres de las hojas del libro');
ok('el Anexo 4 sale de RESUMEN_EJECUTIVO_A4', d.anexo4.indicadores === 3, d.anexo4);
const sinA4 = correr(Object.fromEntries(
  Object.entries(HOJAS_OK).filter(([k]) => k !== 'RESUMEN_EJECUTIVO_A4')));
ok('sin esa hoja el Anexo 4 queda en cero y el resto se pinta igual',
   sinA4.anexo4.indicadores === 0 && sinA4.facultades.length === 20, sinA4.anexo4);

console.log('\nCatalogo desde CODIFICACION_ DE_LAS_FACULTADES');
ok('encuentra la hoja pese al espacio suelto del nombre',
   d.facultades.length === 20 && d.facultades[0].sigla === 'FM');
// El nombre sin el espacio, o con guiones: buscarHoja_ debe dar con ella igual.
const renombrada = Object.assign({}, HOJAS_OK);
delete renombrada['CODIFICACION_ DE_LAS_FACULTADES'];
renombrada['CODIFICACION DE LAS FACULTADES'] = catalogo;
ok('sigue encontrandola si le quitan el espacio o el guion bajo',
   correr(renombrada).facultades.length === 20);

// Una renumeracion hecha en la hoja debe mandar sobre la del codigo.
const renumerado = catalogo.map(f => f.slice());
// La fila 0 es la cabecera: FDCP va en la 2 y FLCH en la 3. Se cruzan.
renumerado[2][3] = 'F03'; renumerado[3][3] = 'F02';
const conCambio = Object.assign({}, HOJAS_OK, { 'CODIFICACION_ DE_LAS_FACULTADES': renumerado });
const dc = correr(conCambio);
ok('una renumeracion en la hoja manda sobre el catalogo del codigo',
   dc.facultades.find(f => f.sigla === 'FDCP').codigo === 'F03_FDCP' &&
   dc.facultades.find(f => f.sigla === 'FLCH').codigo === 'F02_FLCH',
   dc.facultades.slice(0,3).map(f => f.codigo));
ok('y el tablero se reordena por el numero de formulario',
   dc.facultades.every((f, i) => f.orden === i + 1 &&
     Number(f.codigo.slice(1,3)) === i + 1), dc.facultades.slice(0,3).map(f=>f.codigo));

// Sin catalogo, o con uno incompleto, se conserva el del codigo.
const sinCat = Object.fromEntries(
  Object.entries(HOJAS_OK).filter(([k]) => k !== 'CODIFICACION_ DE_LAS_FACULTADES'));
ok('sin la hoja de catalogo recae en el del codigo, no se queda vacio',
   correr(sinCat).facultades.length === 20);
const cortado = Object.assign({}, HOJAS_OK,
  { 'CODIFICACION_ DE_LAS_FACULTADES': catalogo.slice(0, 15) });
ok('un catalogo incompleto tampoco lo vacia',
   correr(cortado).facultades.length === 20);

console.log('\nEl libro real: filas de mas al pie de las hojas');
// Reproduce lo que devolvio probarTablero() sobre el libro de verdad: la hoja
// de codificacion trae 22 filas y no 20, y la del Anexo 4 trae 35 y no 34.
// Exigir el numero exacto descartaba el catalogo entero, en silencio.
const catalogo22 = catalogo.concat([
  [21, 'TOTAL', 'TOTAL', ''],
  [22, 'FACULTAD FM', 'FM', 'F01']            // repetida al pie
]);
// FII y FISI se cruzan EN LA HOJA: si el tablero lo recoge, manda la hoja.
catalogo22.find(f => f[2] === 'FII')[3]  = 'F20';
catalogo22.find(f => f[2] === 'FISI')[3] = 'F17';
const a4con35 = indic.concat([['', 'TOTAL DE INDICADORES', ''], ['', '', '']]);
const real = correr(Object.assign({}, HOJAS_OK, {
  'CODIFICACION_ DE_LAS_FACULTADES': catalogo22,
  'RESUMEN_EJECUTIVO_A4': [['CODIGO','INDICADOR','ESTADO']].concat(a4con35)
}));
ok('22 filas de catalogo siguen dando las 20 facultades',
   real.facultades.length === 20, real.facultades.length);
ok('no cuela la fila TOTAL como facultad',
   !real.facultades.some(f => f.sigla === 'TOTAL'), real.facultades.map(f=>f.sigla));
ok('no duplica la facultad repetida al pie',
   new Set(real.facultades.map(f => f.sigla)).size === 20);
ok('manda la hoja: FII pasa a F20 y FISI a F17 porque asi lo dice',
   real.facultades.find(f => f.sigla === 'FII').codigo === 'F20_FII' &&
   real.facultades.find(f => f.sigla === 'FISI').codigo === 'F17_FISI',
   real.facultades.filter(f => ['FII','FISI'].includes(f.sigla)).map(f => f.codigo));
ok('la fila de TOTAL no cuenta como indicador del Anexo 4',
   real.anexo4.indicadores === 3, real.anexo4);
ok('ni las filas vacias', real.anexo4.aprobados === 2, real.anexo4);

console.log('\nEl % del Anexo 4 sale de la celda F36');
// Hoja con la celda F36 puesta: 36 filas, y en la F de la ultima el 40,4 %
// con formato de porcentaje, que es como lo guarda la hoja de verdad.
// 36 filas contando la cabecera. La ultima lleva en la columna F el 40,4 %
// como fraccion, que es como lo guarda una celda con formato de porcentaje.
const conF36 = [['CODIGO','INDICADOR','ESTADO','','','PCT']];
for (let i = 1; i <= 34; i++) {
  conF36.push(['IND-' + i, 'Indicador ' + i, i <= 14 ? 'Aprobado' : 'Pendiente', '', '', '']);
}
conF36.push(['', 'ULTIMA REVISION DEL HISTORIAL', '', '', '', 0.404]);   // fila 36
// Orden de preferencia para el Anexo 4: historial > celda F36 > recuento.
// Aqui se prueba el escalon del medio, sin historial para ese anexo.
const histSinA4 = hist.filter(f => !/4/.test(String(f[1])));
const dF36 = correr(Object.assign({}, HOJAS_OK, {
  'RESUMEN_EJECUTIVO_A4': conF36,
  'HISTORIAL_REVISIONES': [['FECHA_HORA','ANEXO','PORCENTAJE']].concat(histSinA4) }));
ok('sin historial de Anexo 4, toma el 40,4 % de F36 y no el recuento',
   dF36.kpi.anexo4 === 40.4, dF36.kpi.anexo4);
ok('conserva el recuento como respaldo',
   typeof dF36.anexo4.pctContado === 'number' && dF36.anexo4.pctContado !== 40.4,
   dF36.anexo4);
ok('dice de donde saco el porcentaje',
   /F36/.test(dF36.anexo4.origenPct), dF36.anexo4.origenPct);
ok('el historial manda sobre F36 cuando lo hay',
   correr(Object.assign({}, HOJAS_OK, { 'RESUMEN_EJECUTIVO_A4': conF36 })).kpi.anexo4 === 20.6);

// Sin la celda Y sin historial debe recaer en el recuento, no dar cero.
const sinF36 = correr(Object.assign({}, HOJAS_OK, {
  'RESUMEN_EJECUTIVO_A4': [['CODIGO','INDICADOR','ESTADO']].concat(indic),
  'HISTORIAL_REVISIONES': [['FECHA_HORA','ANEXO','PORCENTAJE']].concat(histSinA4) }));
ok('sin historial ni F36 recae en el recuento de aprobados',
   sinF36.kpi.anexo4 === sinF36.anexo4.pctContado && sinF36.kpi.anexo4 > 0,
   sinF36.anexo4);

console.log('\nAnexo 3: fichas, campos y denominacion');
const fmFich = d.facultades.find(f => f.sigla === 'FM');
ok('las fichas se clasifican en cuatro estados desde su CLASIFICACION',
   fmFich.fichasEstado.conformes === 1 && fmFich.fichasEstado.observados === 1 &&
   fmFich.fichasEstado.critico === 1 && fmFich.fichasEstado.sinRegistrar === 0,
   fmFich.fichasEstado);
ok('«Incompleto» en una ficha tambien es Sin Registrar',
   d.facultades.find(f => f.sigla === 'FDCP').fichasEstado.sinRegistrar === 1,
   d.facultades.find(f => f.sigla === 'FDCP').fichasEstado);
ok('el desglose de fichas va aparte del que alimenta el KPI',
   fmFich.fichas.completas !== undefined && fmFich.fichasEstado.total === 3,
   [fmFich.fichas, fmFich.fichasEstado]);
ok('los registros de Ficha llevan el estado nuevo',
   d.registros.filter(r => r.entity === 'Ficha')
     .every(r => ['CONFORME','OBSERVADO','SIN REGISTRAR','CRITICO'].includes(r.status)),
   [...new Set(d.registros.filter(r => r.entity === 'Ficha').map(r => r.status))]);
ok('los totales de fichas por estado cuadran con las facultades',
   d.totales.fichCrit === d.facultades.reduce((a, f) => a + f.fichasEstado.critico, 0),
   d.totales.fichCrit);

console.log('\nAnexo 3: campos y codigos');
const fmA3 = d.facultades.find(f => f.sigla === 'FM');
ok('los campos salen de DETALLE_REVISION_A3, clasificados en cuatro estados',
   fmA3.campos.conformes === 2 && fmA3.campos.observados === 1 &&
   fmA3.campos.sinRegistrar === 1 && fmA3.campos.critico === 1, fmA3.campos);
ok('«Opcional» no cuenta ni como acierto ni como fallo',
   fmA3.campos.total === 5, fmA3.campos.total);   // 6 filas de FM, una opcional
ok('«Incompleto» es Sin Registrar, no Observado',
   fmA3.campos.sinRegistrar === 1 && fmA3.campos.observados === 1, fmA3.campos);
ok('los codigos salen de REGISTRO_MAESTRO_CODIGOS_A3',
   fmA3.codigos.conformes === 2 && fmA3.codigos.observados === 1, fmA3.codigos);
ok('un «¿consistente?» vacio no se cuenta',
   d.facultades.find(f => f.sigla === 'FDCP').codigos.total === 2,
   d.facultades.find(f => f.sigla === 'FDCP').codigos);
ok('los totales de campos y codigos cuadran con las facultades',
   d.totales.campConf === d.facultades.reduce((a, f) => a + f.campos.conformes, 0) &&
   d.totales.codObs === d.facultades.reduce((a, f) => a + f.codigos.observados, 0),
   [d.totales.campConf, d.totales.codObs]);
ok('el detalle trae las entidades Campo y Codigo',
   d.registros.some(r => r.entity === 'Campo') &&
   d.registros.some(r => r.entity === 'Codigo'),
   [...new Set(d.registros.map(r => r.entity))]);
ok('un campo critico llega a la tabla con estado CRITICO',
   d.registros.some(r => r.entity === 'Campo' && r.status === 'CRITICO'));
ok('los codigos no heredan estados que no tienen',
   d.registros.filter(r => r.entity === 'Codigo')
     .every(r => ['CONFORME','OBSERVADO'].includes(r.status)),
   [...new Set(d.registros.filter(r => r.entity === 'Codigo').map(r => r.status))]);

// Sin esas hojas, el tablero no debe romperse.
const sinA3 = correr(Object.fromEntries(Object.entries(HOJAS_OK)
  .filter(([k]) => k !== 'DETALLE_REVISION_A3' && k !== 'REGISTRO_MAESTRO_CODIGOS_A3')));
ok('sin esas hojas las tarjetas quedan en cero y el resto se pinta igual',
   sinA3.facultades.length === 20 && sinA3.totales.campConf === 0 &&
   sinA3.facultades[0].campos.total === 0, sinA3.totales);

console.log('\nDesglose de procesos y subprocesos por facultad');
// El resumen del Anexo 1 trae en las columnas 11-13 los procesos de Nivel 0 y
// en las 14-16 los subprocesos. Se leian y se tiraban: las dos tarjetas del
// tablero salian siempre en cero.
const fmProc = d.facultades.find(f => f.sigla === 'FM');
ok('cada facultad trae su desglose de procesos de Nivel 0',
   fmProc.procesosN0 && fmProc.procesosN0.conformes === 5 && fmProc.procesosN0.observados === 3 &&
   fmProc.procesosN0.sinRegistrar === 1, fmProc.procesosN0);
ok('y el de subprocesos',
   fmProc.subprocesos && fmProc.subprocesos.conformes === 10 && fmProc.subprocesos.observados === 4 &&
   fmProc.subprocesos.sinRegistrar === 0, fmProc.subprocesos);
ok('con su total, para el rotulo del panel de filtros',
   fmProc.procesosN0.total === 9 && fmProc.subprocesos.total === 14,
   [fmProc.procesosN0.total, fmProc.subprocesos.total]);
ok('los totales de procesos ya no salen en cero',
   d.totales.procConf > 0 && d.totales.procObs > 0, d.totales);
ok('ni los de subprocesos', d.totales.subConf > 0, d.totales);
ok('y cuadran con la suma de las facultades',
   d.totales.procConf === d.facultades.reduce((a, f) => a + f.procesosN0.conformes, 0) &&
   d.totales.subConf === d.facultades.reduce((a, f) => a + f.subprocesos.conformes, 0));

console.log('\nFase 1 desde HISTORIAL_REVISIONES');
const dFase = correr(Object.assign({}, HOJAS_OK, {
  'HISTORIAL_REVISIONES': [['FECHA_HORA','ANEXO','PORCENTAJE']].concat(hist).concat([
    [new Date('2026-08-20T10:00:00Z'), 'Fase 1', 66.0],
    [new Date('2026-08-28T09:00:00Z'), 'Fase 1', 71.9]
  ]) }));
ok('el KPI de Fase 1 sale del ultimo registro «Fase 1»',
   dFase.kpi.general === 71.9, dFase.kpi.general);
ok('«Fase 1» NO se cuela como Anexo 1 pese a llevar un 1',
   dFase.kpi.anexo1 === 81.3, dFase.kpi.anexo1);
ok('Fase 1 trae su variacion contra la anterior',
   dFase.historial.fase1.variacion === 5.9, dFase.historial.fase1);
ok('y su serie para la tendencia', dFase.historial.fase1.serie.length === 2);
ok('sin registro de Fase 1 se calcula como antes',
   d.kpi.general > 0 && d.historial.fase1.actual === null,
   [d.kpi.general, d.historial.fase1.actual]);

console.log('\nFase 1 en C13 y C14, como esta en el libro');
// Reproduce la hoja real: 14 filas, y las de Fase 1 en la 13 y la 14, con la
// fecha escrita COMO TEXTO en formato peruano. Antes se descartaban en
// silencio por no poder interpretar la columna A.
const histC13C14 = [['FECHA_HORA','ANEXO','PORCENTAJE']];
for (let i = 2; i <= 12; i++) {
  histC13C14.push([new Date('2026-08-2' + (i % 9) + 'T09:00:00Z'), 'Anexo 1', 60 + i]);
}
histC13C14.push(['20/08/2026 10:00', 'Fase 1', 66.0]);   // fila 13 -> C13
histC13C14.push(['28/08/2026 09:00', 'Fase 1', 71.9]);   // fila 14 -> C14
const dC14 = correr(Object.assign({}, HOJAS_OK, { 'HISTORIAL_REVISIONES': histC13C14 }));

ok('una fecha escrita como texto ya no descarta la fila',
   dC14.historial.fase1.registros === 2, dC14.historial.fase1);
ok('el valor principal es el de C14, el ultimo registro',
   dC14.kpi.general === 71.9, dC14.kpi.general);
ok('el anterior es el de C13', dC14.historial.fase1.anterior.valor === 66.0,
   dC14.historial.fase1.anterior);
ok('con su variacion en puntos porcentuales',
   dC14.historial.fase1.variacion === 5.9, dC14.historial.fase1.variacion);
ok('lee el dia primero, como se escribe aqui, y no al reves',
   /2026-08-27|2026-08-28/.test(dC14.historial.fase1.actual.fecha),
   dC14.historial.fase1.actual.fecha);
ok('dice que salio de la fila del historial',
   /fila «Fase 1»/.test(dC14.kpi.origenFase1), dC14.kpi.origenFase1);

// Sin fecha ninguna: manda el orden de la hoja, y C14 sigue siendo el ultimo.
const sinFechas = histC13C14.map((f, i) => i === 0 ? f : ['', f[1], f[2]]);
const dSinFecha = correr(Object.assign({}, HOJAS_OK, { 'HISTORIAL_REVISIONES': sinFechas }));
ok('sin fecha alguna, el ultimo sigue siendo el de mas abajo',
   dSinFecha.kpi.general === 71.9, dSinFecha.kpi.general);

// Rotulo distinto: la busqueda falla y entra el respaldo por celda C14.
// Las dos filas de Fase 1 son los indices 12 y 13 (filas 13 y 14 de la hoja,
// contando la cabecera). Renombrar solo una dejaba la otra encontrable.
const otroRotulo = histC13C14.map((f, i) =>
  i >= 12 ? [f[0], 'Avance general del proyecto', f[2]] : f);
const dCelda = correr(Object.assign({}, HOJAS_OK, { 'HISTORIAL_REVISIONES': otroRotulo }));
ok('si el rotulo no dice «Fase 1», recae en la celda C14',
   dCelda.kpi.general === 71.9, dCelda.kpi.general);
ok('y deja constancia de que uso la celda',
   /C14/.test(dCelda.kpi.origenFase1), dCelda.kpi.origenFase1);

console.log('\nSerie completa para las lineas de tendencia');
const dSerie = correr(Object.assign({}, HOJAS_OK, {
  'HISTORIAL_REVISIONES': [['FECHA_HORA','ANEXO','PORCENTAJE']].concat([
    [new Date('2026-07-10T08:00:00Z'), 'Anexo 1', 62.0],
    [new Date('2026-07-19T08:00:00Z'), 'Anexo 1', 70.5],
    [new Date('2026-07-28T08:00:00Z'), 'Anexo 1', 68.1],
    [new Date('2026-08-06T08:00:00Z'), 'Anexo 1', 81.3]
  ]) }));
const s1 = dSerie.historial.anexo1.serie;
ok('la serie trae TODAS las versiones, no solo las dos ultimas',
   s1.length === 4, s1.length);
ok('en orden cronologico, de la primera a la actual',
   JSON.stringify(s1.map(p => p.valor)) === JSON.stringify([62, 70.5, 68.1, 81.3]),
   s1.map(p => p.valor));
ok('cada punto lleva su variacion contra el inmediatamente anterior',
   JSON.stringify(s1.map(p => p.variacion)) === JSON.stringify([null, 8.5, -2.4, 13.2]),
   s1.map(p => p.variacion));
ok('el primer punto no inventa una variacion', s1[0].variacion === null);
ok('la variacion de la tarjeta es la del ultimo punto de la serie',
   dSerie.historial.anexo1.variacion === s1[s1.length - 1].variacion,
   [dSerie.historial.anexo1.variacion, s1[s1.length - 1].variacion]);
ok('cada punto conserva su fecha, para rotular el eje',
   s1.every(p => /^\d{4}-\d{2}-\d{2}T/.test(p.fecha)), s1.map(p => p.fecha));

console.log('\nHISTORIAL_REVISIONES, anexo por anexo');
// Fechas escalonadas a proposito: los tres auditores corren por separado, y
// la revision anterior del Anexo 4 no tiene por que ser del mismo dia que la
// del Anexo 1. Agrupar por corridas conjuntas comparaba contra la ajena.
const histEscalonado = [
  [new Date('2026-08-10T08:00:00Z'), 'Anexo 1', 70.0],
  [new Date('2026-08-20T10:00:00Z'), 'Anexo 1', 78.2],
  [new Date('2026-08-28T09:00:00Z'), 'Anexo 1', 81.3],
  [new Date('2026-08-15T11:00:00Z'), 'Anexo 3', 50.0],
  [new Date('2026-08-27T16:00:00Z'), 'Anexo 3', 61.4],
  [new Date('2026-09-01T12:00:00Z'), 'Anexo 4', 40.4]     // uno solo
];
const dh = correr(Object.assign({}, HOJAS_OK, {
  'HISTORIAL_REVISIONES': [['FECHA_HORA','ANEXO','PORCENTAJE']].concat(histEscalonado) }));

ok('el valor actual es el ultimo registro de cada anexo',
   dh.historial.anexo1.actual.valor === 81.3 &&
   dh.historial.anexo3.actual.valor === 61.4 &&
   dh.historial.anexo4.actual.valor === 40.4,
   ['anexo1','anexo3','anexo4'].map(k => dh.historial[k].actual.valor));
ok('el anterior es el PENULTIMO de ese anexo, no de otra corrida',
   dh.historial.anexo1.anterior.valor === 78.2 &&
   dh.historial.anexo3.anterior.valor === 50.0,
   [dh.historial.anexo1.anterior, dh.historial.anexo3.anterior]);
ok('la variacion son puntos porcentuales',
   dh.historial.anexo1.variacion === 3.1 && dh.historial.anexo3.variacion === 11.4,
   [dh.historial.anexo1.variacion, dh.historial.anexo3.variacion]);
ok('conserva la fecha del penultimo, para poder rotularlo',
   /2026-08-20/.test(dh.historial.anexo1.anterior.fecha) &&
   /2026-08-15/.test(dh.historial.anexo3.anterior.fecha),
   [dh.historial.anexo1.anterior.fecha, dh.historial.anexo3.anterior.fecha]);
ok('con un solo registro no inventa variacion',
   dh.historial.anexo4.variacion === null && dh.historial.anexo4.anterior === null,
   dh.historial.anexo4);
ok('los KPI de los tres anexos salen del historial',
   dh.kpi.anexo1 === 81.3 && dh.kpi.anexo3 === 61.4 && dh.kpi.anexo4 === 40.4,
   dh.kpi);
ok('el KPI general NO sale del historial: es agregado de las hojas',
   dh.kpi.general > 0 && dh.kpi.general !== 81.3, dh.kpi.general);

// Sin historial, las tarjetas no se quedan en blanco.
const sinHist = correr(Object.fromEntries(
  Object.entries(HOJAS_OK).filter(([k]) => k !== 'HISTORIAL_REVISIONES')));
ok('sin historial los KPI recaen en el calculo de las hojas',
   sinHist.kpi.anexo1 > 0 && sinHist.kpi.anexo3 > 0, sinHist.kpi);
ok('y el Anexo 4 recae en el recuento cuando tampoco hay F36',
   sinHist.kpi.anexo4 === sinHist.anexo4.pctContado, sinHist.anexo4);

console.log('\n' + n + ' comprobaciones - ' + (malas ? malas + ' FALLAN' : 'todas correctas'));
process.exit(malas ? 1 : 0);
