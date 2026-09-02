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
const fichas    = [['FM','FACULTAD DE MEDICINA','1. GESTIÓN ESTRATÉGICA','PE.01_F01','NO',0.45,'2','campo X','err','3 críticos','Crítico','Faltan campos']];
const indic     = [['IND-01','Cobertura','Aprobado'],['IND-02','Plazos','Pendiente'],['IND-03','Calidad','Conforme']];
const hist      = [[new Date('2026-08-20T10:00:00Z'),'Anexo 1',78.2],
                   [new Date('2026-08-20T10:00:00Z'),'Anexo 3',55.0],
                   [new Date('2026-08-28T09:00:00Z'),'Anexo 1',81.3],
                   [new Date('2026-08-28T09:00:00Z'),'Anexo 3',61.4],
                   [new Date('2026-08-28T09:00:00Z'),'Anexo 4',20.6]];

const HOJAS = {
  'RESUMEN_GENERAL': general, 'RESUMEN_EJECUTIVO_A1': resA1, 'RESUMEN_EJECUTIVO_A3': resA3,
  'DETALLADO_PRODUCTOS_A1': productos, 'OBSERVACIONES_DE_PROCESO_A1': procesos,
  'RESUMEN_FICHAS_A3': fichas, 'RESUMEN_INDICADORES': indic, 'HISTORIAL_REVISIONES': hist
};
const CAB = { 'RESUMEN_GENERAL':['SIGLA'], 'RESUMEN_EJECUTIVO_A1':['FACULTAD'] };

const ctx = {
  Logger: { log: () => {} },
  CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
  SpreadsheetApp: { openById: () => ({
      getName: () => '4_REVISIÓN_INTERNA DE_AVANCES_ACTIVIDADES',
      getSheetByName: (n) => {
        const f = HOJAS[n]; if (!f) return null;
        const conCab = [(CAB[n] || ['CABECERA'])].concat(f);
        return { getLastRow: () => conCab.length,
                 getDataRange: () => ({ getValues: () => conCab }) };
      } }) },
  console
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('apps-script/Tablero.gs','utf8'), ctx);
const d = vm.runInContext('tablero({sinCache:true})', ctx);

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
ok('el KPI del Anexo 1 es ponderado, no promedio simple',
   d.kpi.anexo1===Math.round(((d.totales.prodConf+d.totales.prodObs/2)/
     (d.totales.prodConf+d.totales.prodObs+d.totales.prodSin))*1000)/10, d.kpi.anexo1);
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
ok('la ficha NO completa queda OBSERVADO',
   d.registros.find(r=>r.entity==='Ficha').status==='OBSERVADO');

console.log('\nAnexo 4 e historico');
ok('cuenta 2 aprobados de 3 indicadores',
   d.anexo4.aprobados===2 && d.anexo4.indicadores===3, d.anexo4);
ok('devuelve dos revisiones para la variacion', d.revisiones.length===2, d.revisiones.length);
ok('la ultima se rotula «Revisión actual»',
   d.revisiones[d.revisiones.length-1].etiqueta==='Revisión actual');
ok('la anterior conserva sus cifras',
   d.revisiones[0].anexo1===78.2, d.revisiones[0]);

console.log('\n' + n + ' comprobaciones - ' + (malas ? malas + ' FALLAN' : 'todas correctas'));
process.exit(malas ? 1 : 0);
